# Sudoku Human Solving Workflow & Registry (数独人类解题流程与策略注册表)

本文件详述了本引擎集成的数独解题策略及其推荐的人类扫描与应用流程（FR-9），并结合真实求解案例，提供直观、易懂的人类解题步骤指导。

---

## 一、 策略注册表与推荐扫描顺序 (Strategy Registry)

为了让 Trace (求解步骤轨迹) 呈现最自然、最符合人类直觉的解题路径，引擎按 **Difficulty (难度/认知成本)** 从低到高对策略进行了排序。每次盘面发生变化，人类/引擎应总是重新从 **难度最低** 的策略开始扫描。

下表完整列出了目前本数独解题引擎所支持的所有策略：

| 难度值 | 策略标识符 (ID) | 策略名称 (中文) | 策略名称 (英文) | 核心原理简述 |
| :--- | :--- | :--- | :--- | :--- |
| **10** | `full-house` | 唯余格 / 宫/行列最后一格 | Full House | 某行、列、宫中仅剩一个空格，数字唯一确定。 |
| **11** | `naked-single` | 唯一候选数 / 唯余 | Naked Single | 某格子中候选数掩码仅剩 1 个，直接落子。 |
| **20** | `hidden-single` | 隐性唯一数 / 排除 | Hidden Single | 某行、列、宫中，某个数字仅有唯一位置。 |
| **21** | `pointing` | 区块对角线排除 / 指向区块 | Pointing | 宫内数字仅位于某行/列，排斥该行/列宫外候选数。 |
| **22** | `claiming` | 行列排除 / 锁定候选数 | Claiming | 行/列内数字仅位于某宫，排斥该宫行/列外候选数。 |
| **30** | `naked-pair` | 显性数对 | Naked Pair | 行/列/宫中 2 个格子均只包含相同的 2 个候选数，排除其它格中该候选数。 |
| **31** | `naked-triple` | 显性三数组 | Naked Triple | 3 格 3 候选数锁定，排除同 House 其它格中候选数。 |
| **32** | `naked-quad` | 显性四数组 | Naked Quad | 4 格 4 候选数锁定，排除同 House 其它格中候选数。 |
| **33** | `hidden-pair` | 隐性数对 | Hidden Pair | 2 个候选数在某 House 中仅出现于 2 个格子，清除这两格其它候选数。 |
| **34** | `hidden-triple` | 隐性三数组 | Hidden Triple | 3 候选数在某 House 中仅出现于 3 个格子，清除这三格其它候选数。 |
| **35** | `hidden-quad` | 隐性四数组 | Hidden Quad | 4 候选数在某 House 中仅出现于 4 个格子，清除这四格其它候选数。 |
| **40** | `x-wing` | X-翼 | X-Wing | 2 行仅 2 列包含某数，在对应 2 列其它行排除该数。 |
| **41** | `swordfish` | 剑鱼 | Swordfish | 3 行 3 列交织的鱼结构排除。 |
| **42** | `jellyfish` | 水母 | Jellyfish | 4 行 4 列交织的鱼结构排除。 |
| **46** | `skyscraper` | 摩天楼 | Skyscraper | 单数字非对齐强弱链排除。 |
| **47** | `two-string-kite` | 双线风筝 | 2-String Kite | 宫内行列对角线交叉排除。 |
| **48** | `empty-rectangle` | 空矩形 | Empty Rectangle | 利用宫内十字型限制建立强链排除。 |
| **50** | `xy-wing` | XY翼 | XY-Wing | 三格双值（XY, XZ, YZ）通过轴格相连排除 Z。 |
| **51** | `xyz-wing` | XYZ翼 | XYZ-Wing | 轴格有三值（XYZ），排除看清全部三格的 Z。 |
| **52** | `w-wing` | W翼 | W-Wing | 两个相同双值格通过单数字强链桥接排除。 |
| **60** | `simple-coloring` | 简单染色 | Simple Coloring | 单数字强链双色化，利用 Wrap/Trap 排除。 |
| **70** | `aic` | 交替推理链 | Alternating Inference Chain | 强弱链交替传递，不连续环放置/消除，Type 1 消除。 |
| **80** | `als-xz` | 几乎锁定集双雄会 | ALS-XZ | 两个 ALS 共享 RCC，引发其它公共候选数消除。 |
| **90** | `unique-rectangle-type1` | 唯一矩形一类 | Unique Rectangle Type 1 | 避免 deadly pattern，安全在第四角消除候选数。 |
| **91** | `bug-plus-one` | BUG+1 全双值格致死 | BUG+1 | 所有空格仅 R_C_ 拥有 3 候选数，填入在该格所属 House 出现 3 次的数字。 |

---

## 二、 扫描流程图与人类认知操作 (Human Scan Flow)

人类在解一道极其困难（Diabolical）的数独题时，应按照以下循环扫描：

```
[开始/数字填入或消除]
       │
       ▼
 1. 基础单数扫描 (Full House, Naked Single, Hidden Single)
       │
       ├─► 成功落子 ───► 重置并返回 1
       │
       ▼
 2. 区块及数组扫描 (Pointing, Claiming, Naked/Hidden Subsets)
       │
       ├─► 消除候选数 ──► 重置并返回 1
       │
       ▼
 3. 基础单数字模式 & 鱼结构 (Fish, Skyscraper, Kite, Empty Rectangle)
       │
       ├─► 消除候选数 ──► 重置并返回 1
       │
       ▼
 4. 翼格与多数字关联模式 (XY/XYZ/W-Wing, Simple Coloring)
       │
       ├─► 消除候选数 ──► 重置并返回 1
       │
       ▼
 5. 链接图与 AIC 引擎 (X-Chain, XY-Chain, Nice Loops)
       │
       ├─► 消除/落子 ────► 重置并返回 1
       │
       ▼
 6. 几乎锁定集与唯一性策略 (ALS-XZ, UR, BUG+1)
       │
       ├─► 消除/落子 ────► 重置并返回 1
       │
       ▼
  [卡死 / 进入 Forcing Boundary 限制] ──► 诉诸 Forcing Chains
```

---

## 三、 代表性求解 Trace 分析 (Worked Traces)

以下摘录并复现两个高级策略的典型 worked trace：

### 1. 经典 X-Chain (单数字交替推理链) 案例
- **盘面状态**：数字 `9` 在 Row 0 有强链 `R0C1 == R0C4`；在 Column 1 有强链 `R0C1 == R3C1`；在 Row 3 有强链 `R3C1 == R3C6`。
- **构建链条**：`R0C4(9) == R0C1(9) -- R3C1(9) == R3C6(9)`（起止均为强链）。
- **逻辑分析**：
  - 若 `R0C4(9)` 为假，则 `R0C1(9)` 为真 $\implies$ `R3C1(9)` 为假 $\implies$ `R3C6(9)` 为真。
  - 无论如何，`R0C4(9)` 与 `R3C6(9)` 之中必有至少一个是真。
- **消除结果**：由于 `R3C4` (Row 3, Col 4) 同时能看到这两个顶端格子，因此 `R3C4` 中的候选数 `9` 被安全消除。
- **双语解释**：
  - **中文**：`找到交替推理链（X-链，从 R0C4(9) 到 R3C6(9)），排除能同时看到两端的候选数。`
  - **英文**：`Found Alternating Inference Chain (X-Chain from R0C4(9) to R3C6(9)), eliminating common peer candidates.`

### 2. 连续强弱环 (Continuous Nice Loop) 案例
- **构建链条**：在双值格与单数字强链共同作用下，形成一条自环交替链 `n0 =weak=> n1 =strong=> n2 ... =strong=> n_k =weak=> n0`，且终点与起点强相关。
- **逻辑分析**：环中所有的弱链升级为强链。这意味着弱链连接的两个候选数不仅“不能同时为真”，更“不能同时为假”。
- **消除结果**：所有弱链所在区域（例如：弱链两端格子所在的 Row 或 Col）中的其它相同候选数，均被强力消除。
- **双语解释**：
  - **中文**：`找到连续强弱环（连续强弱环），环内弱链升级为强链，排除环外相关候选数。`
  - **英文**：`Found Continuous Nice Loop (Continuous Nice Loop), upgrading weak links to strong links and eliminating off-chain candidates.`
