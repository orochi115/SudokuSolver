# FR-8 Forcing Chain 边界规则 (Forcing Chain Boundary Rules)

在高级数独技巧中，**强制链 (Forcing Chains)** 和 **强制网 (Forcing Nets)** 常被用作最后的解题手段。然而，由于这些方法往往涉及复杂的假设与多重分支，它们在“人类可接受的逻辑推理”与“计算机试错/回溯搜索（Nishio/Enum）”之间的界限极其模糊。

为了保证本数独教程的“人类逻辑教学”本质，不沦为伪装的暴力搜索器，特制定此边界规则。

---

## 1. 核心定义 (Core Definitions)

### 1.1 人类可接受逻辑 (Human-Acceptable Logic)
*   **单一起点与清晰前提**：所有推理必须基于一个明确的单一假设（例如：“假设某个格子填入某个数字” 或 “假设某个格子的某个候选数不存在”）。
*   **强弱链接交替推进 (Alternating Inference)**：推理步必须沿着严格的强链接与弱链接交替推进，不允许无根据的跨跃。
*   **不可分叉/链式结构**：路径必须是一条线性的链，而不是树状或网状的分支结构（即：不能同时进行“如果 A 成立则 B，如果 B 成立则 C 且 D”这种多重分支并行推理）。
*   **深度可控**：推理的深度（链的节点个数）必须限制在人类大脑可跟踪的阈值内（通常 $\le 10$ 或 $12$ 步）。

### 1.2 伪装的枚举/试错 (Disguised Enumeration / Trial and Error)
以下形式将被判定为“伪装的枚举”，应当被**禁用**或**显式标记**：
*   **多分叉强制网 (Forcing Nets / Branched Nets)**：从一处假设出发，衍生出多条不相交的推理支线，并试图寻找这些支线的公共交汇点。这实际上是决策树的遍历。
*   **西尾试错 (Nishio Trial and Error)**：对某个格子/候选数进行假设，若导致盘面崩溃则排除该假设。在没有严格链式推导链条的支持下，直接使用局部的崩溃来做排除，是典型的回溯试错。
*   **模板枚举 (Pattern/Template Overlay)**：对某种候选数的所有可能解（如 X-Wing 的所有布局）进行全排列覆盖，并取交集排除。
*   **过长链 (Ultra-Long Chains)**：步数 $> 15$ 步的链。虽然逻辑上闭合，但人类无法在不借用辅助工具的情况下在脑中维持此状态，本质上属于计算机级别的深度搜索。

---

## 2. 边界控制配置 (Boundary Configuration)

求解引擎通过全局/策略配置项暴露该边界，支持在运行期和编译期进行统一控制：

```typescript
export interface ForcingBoundaryConfig {
  /** 是否允许启用 Forcing Chain 策略 */
  enableForcingChains: boolean;
  
  /** 允许的最大链深度（节点个数），推荐 <= 10 */
  maxChainDepth: number;
  
  /** 是否允许 Cell Forcing Chain (从单格的所有候选数出发进行链式推导) */
  allowCellForcing: boolean;
  
  /** 是否允许 Region Forcing Chain (从某行/列/宫内某数字的所有可能位置出发) */
  allowRegionForcing: boolean;
  
  /** 是否允许 Dual Forcing Chain (从某一格的两种可能状态 [真/假] 出发) */
  allowDualForcing: boolean;
  
  /** 严格禁止多分支网状结构 (Forcing Nets) */
  strictNoNets: boolean;
}

export const DEFAULT_FORCING_BOUNDARY: ForcingBoundaryConfig = {
  enableForcingChains: true,
  maxChainDepth: 10,
  allowCellForcing: true,
  allowRegionForcing: true,
  allowDualForcing: true,
  strictNoNets: true, // 默认完全禁用 forcing nets
};
```

---

## 3. 策略实现规范 (Implementation Rules)

1.  **不分叉性**：在搜索 `forcing-chain` 时，引擎只搜寻从同一节点引出的线性链，并将终点做交集。严禁使用广度优先搜索合并所有后续状态的“强制网”算法。
2.  **可视化支持**：所有被允许的 Forcing Chain 必须能够被拆解为可理解的 `Step`，其 `highlights.links` 必须精细画出参与推导的每一条链的每一个环节。
3.  **讲解双语化**：必须给出清晰的双语说明，告知用户假设的起点（Premise）和推导出的公共结论（Common Outcome）。
