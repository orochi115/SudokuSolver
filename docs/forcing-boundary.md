# Forcing Chains, Nets, and Enumeration Boundary (强制链与枚举边界规则)

在数独高级解法中，当面对最难的谜题（Diabolical/Extreme）时，常规的 AIC（交替推理链）和 ALS（几乎锁定集）推理可能依然无法突破。此时，我们需要引入 **Forcing Chains / Forcing Nets（强制链/强制网）** 或者是 **Cell/Digit Forcing Chains（单元格/数字强制链）**。

然而，强制链和强制网在逻辑上极易退化为“伪装的枚举（枚举试错，Backtracking/Guessing）”。为了保持数独引擎的“人类可理解性”（Human-solvability）与教学价值，本引擎特制定此 **边界规则 (FR-8)**，并以配置项方式暴露，供引擎统一控制是否启用某种类型的强制推理。

---

## 一、 为什么需要划定边界？

- **人类可接受逻辑**：数独是一门基于逻辑推理的艺术。人类喜欢循序渐进的推导：“如果 A 是假的，则 B 是真的；如果 B 是真的，则 C 是假的……”。这种单线（无分叉）的逻辑链是人类极易追踪和验证的。
- **伪装的枚举**：如果在推理过程中允许无限分叉、回溯（例如：“如果 A 是 1，我们做一次完整的数独求解，发现发生冲突，所以 A 不是 1；如果 A 是 2，我们也做一次完整的数独求解……”），这在本质上就是计算机的 **深度优先搜索（DFS）回溯**，丧失了人类逻辑解题的精髓。

---

## 二、 逻辑边界定义

本引擎将强制推理分为四个安全级别（Safe Levels）：

### 级别 1：单链矛盾 (Discontinuous Loops / Cell-Digit Contradiction) —— **完全接受**
- **定义**：从单个候选数 $X$ 出发，经过单条（不分叉）的强弱交替推理链（AIC），最终推导出同一候选数 $X$ 为假（即 $X \implies \neg X$），从而可以安全消除 $X$。或者推导出 $X$ 为真（即 $\neg X \implies X$），从而可以安全填入 $X$。
- **人类可接受度**：**极高**。这其实是标准的单数字/双数字 AIC，完全可以通过链的可视化清晰呈现。

### 级别 2：单元格/数字强路分流 (Cell / Digit / House Forcing Chains) —— **受限接受**
- **定义**：对于一个双值格 $\{A, B\}$（只有两个候选数）或者一个只有两个候选数位置的 House $H = \{C_1, C_2\}$：
  - 分支一：假设格子里是 $A$（或位置在 $C_1$），可以推出消除某个候选数 $Z$。
  - 分支二：假设格子里是 $B$（或位置在 $C_2$），通过另一条独立的单线链，同样可以推出消除候选数 $Z$。
  - 由于这两种假设穷尽了所有可能性，所以候选数 $Z$ 必然可以被安全消除。
- **约束条件**：
  - 推理链必须是单线（不能有二级分支）。
  - 最大链深度（Step 数量） $\le 8$。
- **人类可接受度**：**高**。人类可以相对轻松地在大脑中分别跟踪这两条短链。

### 级别 3：多分支强制链 (Multi-branch Forcing Chains) —— **标记为高级/默认关闭**
- **定义**：如果基础单元格有 3 个或以上候选数（如 $\{A, B, C\}$），或者 House 中有 3 个或以上位置，分别从每个可能出发推导出一个共同的结果 $Z$。
- **人类可接受度**：**低**。记忆和追踪 3 条或以上的独立推导链对人类大脑而言是极其沉重的负担。
- **引擎控制**：本引擎将此类归为 `forcing-chains-multi`。默认关闭，仅在用户显式启用时激活，且在 Trace 中显式标记为“超人类极限/拟枚举”。

### 级别 4：强制网、Nishio、表格试错 (Forcing Nets, Nishio, Tabling) —— **禁止使用**
- **定义**：允许在推导分支中进行多层嵌套分支（网状结构）、进行全面试错（Nishio 试错），或者在草稿纸上罗列大型真值表（Tabling）。
- **人类可接受度**：**无**（纯属计算机暴力搜索）。
- **引擎控制**：引擎源码中不提供任何网状回溯或多层嵌套推理的实现。

---

## 三、 引擎配置与暴露

本引擎在控制策略注册和执行时，通过全局配置项 `FORCING_BOUNDARY_CONFIG` 暴露以下参数：

```typescript
export interface ForcingBoundaryConfig {
  /** 是否允许 Cell Forcing Chains (仅限双值格/双格House) */
  allowCellForcing: boolean;
  /** 是否允许 Digit Forcing Chains (仅限双格House) */
  allowDigitForcing: boolean;
  /** 强制链最大单线深度限制（默认 8） */
  maxForcingDepth: number;
}

export const DEFAULT_FORCING_CONFIG: ForcingBoundaryConfig = {
  allowCellForcing: true,
  allowDigitForcing: true,
  maxForcingDepth: 8,
};
```

该配置可在运行求解循环时传入，用于动态拦截超出人类接受边界的伪装枚举，确保引擎输出的每一步逻辑步骤都是高质量、可追溯且极具启发性的。
