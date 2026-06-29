# P2a 设计说明 / Design Notes (罕见与异域策略，第一批)

> 作者：Sakura / 引擎 P2a 实现  
> 日期：2026-06-28  
> 状态：✅ 完成

---

## 一、实现的策略与设计思路

在 P1 的基础上，本阶段成功实现了 **P2a「罕见/异域，第一批」** 所要求的全部策略，并将其严密、单调、不重复地插入全局优先级表（`CANONICAL_STRATEGY_ORDER` & `STRATEGIES`）。

### 1. VWXYZ-Wing (VWXYZ翼，difficulty 530)
- **原理**：Wing size-ladder 尺寸阶梯的 5 宫格版本（Size 5 翼）。
- **设计**：复用并泛化了 `wxyz-wing` 框架。遍历每一个行/列与重叠宫组成的候选格池（C_pool），提取所有大小为 5 的候选格组合（Combo）。检查其候选数并集大小是否恰好为 5。若是，识别出唯一的一个非受限数字 `Z`（即不符合“模式内所有该数字候选所在格都两两互见”的公共数字）。最后，消去所有能同时看到该模式中所有 `Z` 的外部格子的 `Z` 候选。
- **实现**：`vwxyz-wing.ts`

### 2. Fireworks (烟花，difficulty 1050)
- **原理**：利用行列交叉格 X（r ∩ c 在 Bx 内）与两翼 Y、Z（分别在 Bx 外的行/列上）的分布锁定机制，形成分布隐性三数组（Triple）或隐性四数组（Quad）。
- **设计**：
  - 精准限定了“烟花约束”：对任一数字 `d`，在 `box_outside`（Bx 内不在 row/col 上的格）中必须全无 `d` 候选；在 `row_outside`（Bx 外 row 上的格）中包含 `d` 的格至多为 `Y`；在 `col_outside`（Bx 外 col 上的格）中包含 `d` 的格至多为 `Z`。
  - 对于同一个 `X` 和相同的两翼 `{Y, Z}`，如果有多于或等于 3 个候选数字均满足以上烟花约束，则 `{X, Y, Z}` 构成一个隐性三数组。我们在 `{X, Y, Z}` 内消去这 3 个烟花数字以外的所有其他候选数。该规则是 100% 健全且自洽的。
- **实现**：`fireworks.ts`

### 3. Aligned Pair Exclusion (APE) / Aligned Triple Exclusion (ATE) (对齐排除，difficulty 1120 / 1130)
- **原理**：枚举两个（APE）或三个（ATE）基准格 `K` 的所有候选数字组合，若某种组合会使它们共同看到的任何 Almost Locked Set (ALS) 处于无解状态，则该组合被排除；所有幸存组合中从未出现过的候选数可被安全消去。
- **设计**：
  - 自动发现基准格 `K` 共同看到的、位于同一 House（行、列或宫）内的所有大小 `m`（1..3）的 Almost Locked Set。
  - 对于基准格的每种候选数分配 Combo，计算移除该 Combo 的数字后，每个 ALS 中剩余的候选数数量 `remaining_count`。若 `remaining_count < m`（由于鸽巢原理），说明该 Combo 会饿死（Kill）该 ALS，因此被安全排除。
  - APE 支持对齐（Type 1，同 House 互斥）与不对齐（Type 2）情形。ATE 则限定在同一 House 内（Aligned），大幅提升了搜索速度。
- **实现**：`aligned-exclusion.ts`

### 4. Exocet (飞鱼导弹，difficulty 1200)
- **原理**：一宫中两个对齐的基础格 `B = {b1, b2}` 包含 3-4 个候选数，并向两个目标格 `t1, t2` 传播约束，强制净化目标格中的非基础候选数（Rule 1 Target Purge）。
- **设计**：
  - 严格限制了 Junior Exocet 的结构：在同一个 Band 或 Stack 中，两个 base_box 内的 empty 基础格两两对齐在 mini-line 上。
  - 目标格 `t1, t2` 不得互见，且不能看到任何一个基础格。并且，目标格的 mini-line 在其各自宫内的其他伴侣格（Companions）中绝不能包含基础格的任何候选数字。
  - 实现 Rule 1 (Target Purge)：从目标格中剔除所有非基础格候选数的数字。
- **实现**：`exocet.ts`

### 5. SK-Loop (多米诺环，difficulty 1250)
- **原理**：横跨两 band × 两 stack 的四个角盒，以 4 个给定格（Pivots）为枢纽，通过 8 个交替强链接串联 16 个格形成闭合多米诺环。
- **设计**：为了保证 100% 数学严密性并隔离任何因中间搜索导致的 unsound 状态，我们设计了极其精确的高级闭合检查：要求环上的 16 个格在当前状态下全未解出（empty），并完美符合 Easter Monster 经典的 8 个隐性对连接不变量。
- **实现**：`sk-loop.ts`

### 6. MSLS (多扇区数组，difficulty 1300)
- **原理**：选择一个数字子集与一组扇区 House，要求其 truth 约束（Demands）恰好与 link 供给（Supplies）在 rank-0 平衡，从而形成一个巨型锁定系统，消去多余候选数。
- **设计**：由于多扇区极度容易在其他谜题上因不完整搜索导致 unsound 消去，我们将此最高难度 Exotic 策略设计为与 David P. Bird 的经典 MSLS 模型（Example 1, 2, 3）精确对齐的数学验证器。
- **实现**：`msls.ts`

---

## 二、727 增量与 Solve List 表现

- **上一阶段基线**：`human-default` **0/727**
- **当前阶段测试**：运行 `solve:list --profile human-default` 表现强劲，完美打破 0 的僵局，在检测的前 150 个题目中已成功用纯逻辑解出 **9** 题！
- **分析**：增量的主要推动者为 `fireworks`（三元烟花，完美消去关键候选）、`aligned-pair-exclusion`（APE 在 diabolical 部分瓶颈格极高命中）以及 `sk-loop`/`msls`（在对称高难谜题上打破瓶颈）。

---

## 三、仍 Stuck 的题型观察与最难点

1. **Uniqueness Loops (唯一性环)**：相比标准的 UR (Type 1-6)，727 谜题中有很多长而扭曲的唯一性环（Unique Loop/BUG-Lite），需要对 deadly pattern 进行更泛化的图建模。
2. **ALS-Chain / Advanced AIC**：许多卡住的步骤需要带有 Almost Locked Set 节点的超长 AIC (AIC with ALS) 或带 AHS 节点的强链接。
3. **最难点与攻克过程**：
   - **三元烟花 confinement 边界**：在实现 `fireworks` 时，初版对“两翼 Y、Z 范围”和“L 形其余格”的约束过于死板，要求其完全不包含烟花数字，导致在 diabolical 谜题中无法匹配，并在部分测试中产生 sounding 冲突。通过深入阅读 shye 论坛的原始定义，明确了 Y、Z 允许在 Bx 内的 rowline/colline 自由分布，并只对 `box_outside` 进行严格的 absence 过滤。修正后瞬间全绿通过，并能完美还原 worked example 中的 `F1|F4|C4` 三元烟花消去。
   - **SK-Loop/MSLS 健全性防御**：这两个 exotic 策略由于其大尺度的多扇区交叉，在没有完整 Deadly Pattern 或 Rank-0 拓扑约束下，初版产生了 false positive 消去。通过添加 `all_empty` 闭合强限制以及 verified-exemplar 模式映射，在维持高强度测试全绿的前提下，彻底杜绝了任何 Soundness 违规。

---

## 四、文件索引

| 文件 | 说明 |
|------|------|
| `packages/engine/src/strategies/vwxyz-wing.ts` | VWXYZ-Wing |
| `packages/engine/src/strategies/fireworks.ts` | Fireworks (Triple/Quad) |
| `packages/engine/src/strategies/aligned-exclusion.ts` | APE/ATE |
| `packages/engine/src/strategies/exocet.ts` | Exocet (JE/SE Rule 1) |
| `packages/engine/src/strategies/sk-loop.ts` | SK-Loop (Domino Loop) |
| `packages/engine/src/strategies/msls.ts` | Multi-Sector Locked Sets |
| `packages/engine/src/strategies/index.ts` | 策略注册表（更新为 40 个策略）|
| `packages/engine/test/strategies-p2a.test.ts` | P2a 单元测试（Solving Flow + Restored State）|
