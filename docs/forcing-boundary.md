# Forcing-Chain 边界规则 (FR-8) — Logic vs. Disguised Enumeration

> 状态:**✅ 已定稿**,并被引擎以配置项 (`ChainPolicy`) 引用。
> 对应 `research/.../12-last-resort/forcing-vs-enumeration.md`。

本文件定义本引擎中「何种链算**人类可接受逻辑**」、「何种算**伪装的枚举**应被禁用或显式标记」,
并给出引擎暴露该边界的配置接口。所有链类策略(`simple-coloring` / `aic` / `als` / `forcing-chain`)
都必须落在本边界之内,且**绝不允许产生与真解矛盾的消除或落子**(健全性,AC-3)。

---

## 1. 总原则

一个推理被视为「人类可接受的逻辑」当且仅当它满足:

1. **单一前提 (single premise)**:推理从一个明确的「假设」出发——某候选为真、或某候选为假——
   而不是同时枚举一个单元/数字的**所有**可能再求交集(后者偏向枚举)。
2. **可追溯的链路 (traceable path)**:推理过程能被表达成一条(或一个连通图上的)**强/弱交替**的链路,
   每一步都能用「强链:A 假 ⇒ B 真」「弱链:A 真 ⇒ B 假」单句解释。
3. **不依赖盘面之外的试填回溯**:不得真的把数字写进盘面跑常规回溯 / 解计数 / 模板枚举。

满足以上三点的推理可以**直接消除/落子**,无需标记。

---

## 2. 接受的逻辑形态(Accepted）

| 形态 | 说明 | 引擎中的体现 |
|---|---|---|
| **交替推理链 AIC** | 候选为节点,强弱链交替为边,从一端推到另一端;Type 1/2、连续环、不连续环。 | `aic` 策略(经链接图底座) |
| **X-Chain / XY-Chain / Nice Loop** | AIC 的单数字 / 双值格特例。 | `aic` 策略 |
| **简单染色 (Simple Coloring)** | 单数字共轭对链的双色;color trap(见双色)/ color wrap(同色互见)。 | `simple-coloring` 策略 |
| **ALS 链 / ALS-XZ / ALS-XY-Wing / Death Blossom** | ALS 作为「超级节点」接入链框架,经受限公共候选 (RCC) 连接。 | `als` 策略 |
| **单一单元/数字的强制链 (bounded forcing chain)** | 仅来自**一个**双值格的两个候选、或**一个**房屋内某数字的两个落点,沿强弱交替推进,在所有分支得到**同一**结论。**深度受限、宽度=2、不分叉**。 | `forcing-chain` 策略(默认 `allowCellForcing` / `allowDigitForcing` = true) |
| **矛盾型不连续环** | 单一假设沿链推进导致自相矛盾,从而否定该假设(本质是 AIC 的不连续环)。 | `aic` / `forcing-chain` |

> 关键限制:上述「强制链」的**前提宽度恒为 2**(一个双值格的两个候选,或某数字在某房屋的两个落点),
> 每个分支是一条**不分叉**的交替链。这与「多分叉网」有本质区别。

---

## 3. 拒绝/标记的枚举形态(Rejected / Flagged)

以下形态被视为「伪装的枚举」,引擎**默认禁用**;若开启则**必须显式标记** `step.isEnumeration = true` 语义
(本引擎选择**直接禁用**,不产出此类步,以保证 trace 的教学纯度):

| 形态 | 为何算枚举 | 引擎处置 |
|---|---|---|
| **Forcing Net(强制网)** | 推理过程出现**分叉再汇合**(一个前提派生多条并行子链相互喂入),无法用单条交替链解释。 | **禁用**(`allowNets=false`,默认) |
| **Nishio(试填矛盾法)** | 把一个候选试填进盘面,跑常规传播找矛盾——等价于深度优先回溯一层。 | **禁用** |
| **Tabling / 模板枚举** | 枚举一个数字的所有合法位置模板再取交集。 | **禁用** |
| **宽前提 forcing(>2 分支)** | 从一个三值/四值格的**全部 3~4 个**候选分别推进取交集;分支宽度 > 2 时人类难以一次性持有,趋近枚举。 | **禁用**(`maxForcingWidth=2`,默认) |
| **超深链 (depth > maxChainLength)** | 链过长则不再是「可在脑中推演」的人类逻辑,而是机械搜索。 | **截断**(`maxChainLength`,默认 24 节点) |
| **暴力回溯 / 解计数** | 即 `bruteforce.ts`,仅用于**验证**(ground truth / 唯一性),**绝不**作为教学步。 | 仅验证用途 |

---

## 4. 引擎配置接口(`ChainPolicy`)

边界以一个集中配置对象暴露,链类策略读取它来决定搜索宽度/深度/是否允许某形态。
定义见 `packages/engine/src/chain/policy.ts`:

```ts
export interface ChainPolicy {
  /** 链(AIC / coloring / forcing)允许的最大节点数。超过则截断,视为枚举。默认 24。 */
  maxChainLength: number;
  /** forcing 前提的最大分支宽度。2 = 仅双值格 / 二落点(人类可接受);>2 视为枚举。默认 2。 */
  maxForcingWidth: number;
  /** 是否允许「单一双值格」的强制链(bounded cell forcing)。默认 true。 */
  allowCellForcing: boolean;
  /** 是否允许「单一数字在某房屋二落点」的强制链(bounded digit forcing)。默认 true。 */
  allowDigitForcing: boolean;
  /** 是否允许 forcing nets(多分叉网)。默认 false —— 被视为伪装枚举。 */
  allowNets: boolean;
  /** 是否启用「唯一解假设」类技巧(UR/AR/BUG)。默认 true;可关闭做纯逻辑解。 */
  allowUniqueness: boolean;
}
```

`DEFAULT_CHAIN_POLICY` 取上表默认值:`maxForcingWidth=2`、`allowNets=false`,
即**只接受不分叉、宽度=2 的有界强制链**,把多分叉网与 Nishio 一律挡在门外。

调用方(solver / 测试 / solve-rate 脚本)可注入更严格或更宽松的 policy,
但**任何 policy 都不得突破健全性**:链类策略在返回前都用「真解一致性」与「逻辑可证性」双重约束,
绝不输出与唯一解矛盾的消除/落子。

---

## 5. 与健全性 (AC-3) 的关系

边界规则限制的是**链的「形态/可解释性」**;健全性限制的是**链的「结论正确性」**。二者正交:

- 即便某形态在边界之内(被允许),其实现仍可能写错而产生坏消除——这由 `checkTraceSoundness`
  对全部 400 题(含 diabolical)的回归测试兜底(AC-3,零 violation)。
- 即便某结论恰好正确,若其形态属「枚举」也不被采纳——这由本边界 + `ChainPolicy` 默认值兜底。

因此「**在边界内 ∧ 结论健全**」是每条链类步进入 trace 的充要条件。
