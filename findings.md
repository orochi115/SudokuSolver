# 发现记录 (findings.md)

## 现有代码结构与设计规范
1. **地基文件**：
   - `packages/engine/src/grid.ts`: 提供数独盘面 `Grid` 模型。支持 81 格、`PEERS_OF`、`HOUSES`、`UNITS_OF`、位运算、`candidates` 位掩码（1-9 分别对应 bit 0..8）。
   - `packages/engine/src/trace.ts`: 提供 `Link` (包含 `from`, `to`, `type` 为 `strong` | `weak`)，`Step` (Placements, Eliminations, Highlights, Explanation) 的数据接口。**不可破坏**。
   - `packages/engine/src/strategy.ts`: 定义 `Strategy` 接口。成员有 `id`, `name`, `difficulty`, `apply(grid)` 方法。
   - `packages/engine/src/solver.ts`: 核心求解循环。从低难度到高难度遍历 `STRATEGIES`。一旦策略产生 elimination 或 placement，则应用它并记录 Step，并重新从最基础的策略开始。
   - `packages/engine/src/soundness.ts`: 强健性校验（零 violation）。不允许将任何不属于真解的数字填入单元格，也不允许把属于真解的候选数消除。

2. **基线解出率统计**：
   - `easy`: 100.0%
   - `medium`: 100.0%
   - `hard`: 89.0%
   - `diabolical`: 14.0%
   - 我们的终极目标：diabolical 解出率必须显著提升，同时零 violation，保持全绿。

3. **技巧参考路径**：
   - 技巧规则：`research/sudoku-human-solving/local-library/techniques/` 提供了有价值的参考，尤其是 `08-chains-aic` 和 `09-als`。我们应该去看看！

## 调研 /techniques 目录下的参考资料
我们可以使用 `glob` 寻找 `research/sudoku-human-solving/local-library/techniques/` 下的所有文件，了解具体算法说明。
