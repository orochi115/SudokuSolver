# 模型提问汇总(供预先在基础文档中答复)

> 模型在 headless 运行中把会影响实现的疑问写入各自 worktree 的 QUESTIONS.md;此处汇总。

## sonnet46 (`anthropic/claude-sonnet-4-6`)
# Implementation Questions & Assumptions (M3)

These questions were encountered during headless implementation. Reasonable assumptions were made and documented here.

## Q1: ALS 多宫/行互见单元
**问题**：ALS 是否允许跨宫/行/列的"互相可见"单元（非单一宫）？
**假设**：本实现仅从单一 house（宫/行/列）内枚举 ALS，这是最常见且安全的形式。跨宫互见的 ALS 理论上合法但实现复杂；未实现。

## Q2: 死亡之花 N 花瓣
**问题**：死亡之花是否支持茎格含 3+ 候选数（3+ 花瓣）？
**假设**：仅实现 2 花瓣（茎格恰好双值）。3+ 花瓣极为罕见，且实现时遇到了因非空判断缺失导致的健全性问题。限制为双值茎可保证正确性。

## Q3: AIC 使用强链作弱链
**问题**：在弱链步骤中，是否允许"强链当弱链用"（即共轭对的两端可通过强链而非仅弱链连接）？
**假设**：`dfsWeak` 中使用 `getWeakNeighbors`，该函数已包含同格不同数字（双值）和同数字同宫的弱链。强链在语义上必然也是弱链（共轭对满足"如果一个为真另一个为假"），因此通过 `getWeakNeighbors` 隐式覆盖。未单独添加"强当弱"路径，避免重复。

## Q4: Sue de Coq 3 格交叉区间
**问题**：3 格交叉区间的 Sue de Coq 如何处理？
**假设**：实现支持 2-3 格空白交叉格。核心逻辑相同（行+宫各一个裸集），但 3 格时通常需要更多行伴侣/宫伴侣。`combineK` 通用化处理了这种情况。

## Q5: 唯一性策略的 optional 标记
**问题**：M3 要求"uniqueness 以开关控制"，如何实现？
**假设**：通过注册表控制：`uniqueness` 策略被注册在 STRATEGIES 中，但用户可从 `STRATEGIES.filter(s => s.id !== 'uniqueness')` 排除。未实现独立的 config flag，因为现有架构通过策略列表参数传递给 `solve()` 已经实现了等效控制。

## deepseekv4 (`alibaba-cn/deepseek-v4-flash`)
# Questions (unresolved, not blocking)

1. Should 2-String Kite and Empty Rectangle be added back with more rigorous validation, or left for M3's X-Chain framework?
2. Is the current 57% solve rate on hard acceptable for M2, or should more T2/T3 strategies be tuned?
3. The W-Wing requires bivalue cells + conjugate pair in the same house. Should we also support grouped strong links (house-level conjugacy)?
4. basic-fish currently tries sizes 2-4; should it also try fins/sashimi variants (technically M3)?
5. When both row-based and column-based skyscraper patterns exist simultaneously, which should take priority (current: row first, arbitrary)?
## kimi-k26 (`alibaba-cn/kimi-k2.6`)
# 实现过程中的疑问与假设

1. **AIC 引擎的 XY-Chain 因健全性验证复杂而暂时禁用**
   - 问题：XY-Chain 的端点数字一致性验证在复杂盘面下容易出现错误消除
   - 假设：为确保零 violation，仅启用经过严格验证的 X-Chain（4 节点 S-W-S），XY-Chain 留待后续补充单元测试后启用

2. **Sue de Coq 的实现范围**
   - 问题：完整 Sue de Coq 逻辑涉及 box-line 交集的复杂分区
   - 假设：实现核心模式（2-3 格交集的分组排除），已覆盖常见盘面

3. **Forcing Chain 的深度边界**
   - 问题：题目要求定义"人类可接受逻辑"的边界
   - 假设：单一路径、深度 ≤ 6 为合理边界；多分支 nets 明确禁用

