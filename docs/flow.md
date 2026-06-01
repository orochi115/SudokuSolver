# FR-9 数独求解引擎人读流程文档 (Sudoku Solving Flow)

本文件详述了数独求解引擎的人类解法决策流。整个求解流程是由代码中的策略注册表（`packages/engine/src/strategies/index.ts`）与主求解循环直接派生、算法与文档完全同源。

---

## 1. 策略注册表与执行流 (Strategy Registry and Execution Flow)

主循环按策略的 **Difficulty (难度)** 升序依次尝试。这种排序反映了“便宜/直观技巧优先，昂贵/链式技巧后置”的人类思维心智。一旦某个策略产出了有效的赋值或消除，引擎将立刻应用此步骤（Step）并**重新从最简单的策略开始尝试**。

以下是当前引擎注册的全部 17 种策略及其难度评级：

| 顺序 | 策略 ID | 中文建议译名 | 英文名称 | 难度评级 | 核心作用与逻辑 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `full-house` | 全屋唯一 | Full House | 9 | 在行/列/宫中仅剩最后一个空格时直接填入。 |
| 2 | `naked-single` | 显性唯一 | Naked Single | 10 | 某格子仅剩下一个候选数，直接填入该数（基础 baseline）。 |
| 3 | `hidden-single` | 隐性唯一 | Hidden Single | 12 | 某数字在行/列/宫的所有空格中仅出现一次，直接填入。 |
| 4 | `locked-candidates` | 区块排除 | Locked Candidates | 20 | 包含 Pointing 与 Claiming，用于行/列/宫之间的交叉候选数排除。 |
| 5 | `naked-subset` | 显性数组 | Naked Subset | 30 | 包含 Naked Pair/Triple/Quad，通过特定格子候选数组合锁定来排除单元内其他格。 |
| 6 | `hidden-subset` | 隐性数组 | Hidden Subset | 35 | 包含 Hidden Pair/Triple/Quad，隐藏在多值格中的互锁候选数锁定。 |
| 7 | `basic-fish` | 基础鱼 | Basic Fish | 40 | 包含 X-Wing, Swordfish, Jellyfish，基于 Base/Cover 覆盖集排除模型。 |
| 8 | `xy-wing` | XY翼 | XY-Wing | 45 | 三值格 Pivot `{x, y}` 与两翼 Pincers `{x, z}`、`{y, z}` 产生对 `z` 的消除。 |
| 9 | `xyz-wing` | XYZ翼 | XYZ-Wing | 46 | 三值格 Pivot `{x, y, z}` 与两翼 Pincers 产生宫/线交汇处的 `z` 消除。 |
| 10 | `w-wing` | W翼 | W-Wing | 48 | 通过强强联结（桥梁）连接两个相同的双值格 `{x, y}`，排除共同可见处的 `y`。 |
| 11 | `single-digit-patterns` | 单数字模式 | Single Digit Patterns | 50 | 包含 Skyscraper（摩天楼）、2-String Kite（双线风筝）、Empty Rectangle（空矩形）。 |
| 12 | `simple-coloring` | 简单染色 | Simple Coloring | 60 | 单数字强链的双色染色，利用同色冲突（Wrap）和双色可见（Trap）做消除。 |
| 13 | `aic` | 交替推理链 | Alternating Inference Chain | 70 | 候选数强弱链交替图底座。包含 X-Chain, XY-Chain, Nice Loops，完美解释全部短链。 |
| 14 | `als` | 几乎锁定集 | Almost Locked Set | 80 | 包含 ALS-XZ（单链/双链），多个 $N$ 格 $N+1$ 候选数集通过桥梁 RCC 产生关联消除。 |
| 15 | `uniqueness` | 唯一性策略 | Uniqueness | 90 | 包含 Unique Rectangle Type 1 和 BUG+1（可通过配置开关启用/禁用）。 |
| 16 | `sue-de-coq` | 双区域不交数组 | Sue de Coq | 95 | 在行/列与宫的交叉部分通过局部不交集与候选数精细计数进行排除。 |
| 17 | `forcing-chain` | 强制链 | Forcing Chain | 100 | 双重强制链。从双值格的两个分支展开推导，取其公共逻辑交集（消除或赋值）。 |

---

## 2. 核心算法决策模型 (Decision Logic)

```
[开始解题]
   │
   ▼
[工作网格初始化 (Clone)]
   │
   ├─► [是否已解出？] ───────► (是) ──► [输出 SolveTrace 成果: 'solved']
   │      │
   │      ▼ (否)
   ├─► [按 Difficulty 排序尝试所有注册策略]
   │      │
   │      ├─► [策略 apply(grid) 尝试]
   │      │      │
   │      │      ├─► 产生有效 Placements / Eliminations？
   │      │      │      │
   │      │      │      ├─► (是) ──► [应用改动并记录 Step] ──► [回到最简单策略重新循环]
   │      │      │      │
   │      │      │      └─► (否) ──► [尝试下一个更高难度策略]
   │      │      │
   │      │      └─► 遍历完所有策略均无进展？ ──► (是) ──► [解题卡死: 'stuck']
   │      │
   ▼
[输出 SolveTrace 成果: 'stuck' 或达到 Max Steps]
```

---

## 3. 代表性高级策略 worked trace (Worked Examples)

### 3.1 交替推理链 (AIC) 特例
当盘面陷入僵局，摩天楼或风筝等局部结构已无法满足消除时，AIC 引擎将大显身手。
*   **Worked Trace 场景**：在候选数 9 上，通过强弱链交替路径 `R1C1(9) === R1C8(9) --- R3C8(9) === R3C5(9)` 构成一条交替链。
*   **逻辑推理**：
    *   如果 `R1C1(9)` 为假，则由于强链关系，`R1C8(9)` 必为真。
    *   如果 `R1C8(9)` 为真，则由于弱链关系（同行），`R3C8(9)` 必为假。
    *   如果 `R3C8(9)` 为假，则由于强链关系，`R3C5(9)` 必为真。
*   **公共消除**：这意味着 `R1C1(9)` 和 `R3C5(9)` 必有一个为真。任何共同看见 `R1C1` 和 `R3C5` 且包含候选数 9 的空格（例如 `R3C1`），均可安全排除候选数 9。

### 3.2 几乎锁定集 (ALS-XZ)
*   **Worked Trace 场景**：
    *   ALS1 包含 2 个格子 `{R1C1, R1C2}`，其候选数并集为 `{1, 2, 3}`（$N=2$ 格有 $N+1=3$ 个候选数）。
    *   ALS2 包含 2 个格子 `{R1C9, R2C9}`，其候选数并集为 `{1, 4, 5}`。
    *   它们共享 Restricted Common Candidate (RCC) $X = 1$（因为 ALS1 中的 1 都在第 1 行，ALS2 中的 1 都在第 9 列，它们在 R1C9 处强关联相见）。
*   **逻辑推理**：
    *   如果 ALS1 不包含 1，则 ALS1 被锁定为 `{2, 3}`。
    *   如果 ALS1 包含 1，由于 R1C9 共同可见，ALS2 绝对无法包含 1，因此 ALS2 被锁定为 `{4, 5}`。
*   **公共消除**：由于两个集合中必定有一个处于锁定态，如果它们共享另一个普通候选数 $Z$（例如 $Z=2$），那么任何能同时看到 ALS1 和 ALS2 中所有 $2$ 的外部格子，都绝不可能填入 2。
