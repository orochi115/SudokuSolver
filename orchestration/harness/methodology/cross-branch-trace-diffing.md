# 方法论：用成功分支对比定位失败

> 当前分支某题解不动、而另一个（归档的）分支能解出时，如何精确定位"第一处实现差异"，
> 并把它转化为可回归的测试。这是第一轮修复（regression + 补全）的核心手法，见
> [`../../round1/repair-plans/remaining-diabolical-regression-plan.md`](../../round1/repair-plans/remaining-diabolical-regression-plan.md) 与
> [`../../round1/investigations/`](../../round1/investigations/) 的根因笔记。

## 思路

两个分支在同一道题上跑出不同 trace，逐步对齐到**首次分歧**：找出第一步"候选状态相同、却做出不同消除"的位置。
分歧点的策略 id + 期望消除，就是要修复/补全的能力。只对**首次分歧**写测试，不要对"卡死后的终局盘面"写测试。

## 工具：`trace-archive-case.mjs`

对两个 git ref 在同一道题上生成可对比的 trace、饱和（saturation）、分歧探针（divergence-probe）与对比报告。

```bash
node orchestration/harness/trace-archive-case.mjs \
  (--puzzle <81 位字符串> | --difficulty <难度> --index <1-based>) \
  --models <名A>,<名B> \
  --refs <名A>=<git-ref-A>,<名B>=<git-ref-B> \
  --out <输出目录> [--keep-worktrees]
```

示例（注意 ref 名在本轮归档后已变为 `archive/round1/...`）：

```bash
node orchestration/harness/trace-archive-case.mjs \
  --puzzle 200900060090000500005100000306200050000030000010008207000007800002000040080004003 \
  --models winner,current \
  --refs winner=archive/round1/final/gemini35flash,current=archive/round1/analysis-sonnet46-strategy-fix \
  --out /tmp/case-analysis
```

输出目录内容：

| 文件 | 含义 |
|---|---|
| `trace-<名>.json` | 每分支完整 SolveTrace（步序、每步策略 id、消除） |
| `saturation-<名>.json` | 每步后的候选饱和状态 |
| `divergence-probe.json` | 首次分歧点：`probeGrid`、`candidateHashBefore`、两边各自的动作 |
| `saturation-comparison.json` / `comparison.json` | 逐步对齐对比 |
| `rescue-comparison.json` | 从分歧的恢复态出发，当前分支是否还有有效救援策略 |
| `summary.md` | 人读摘要：是否同候选状态、首分歧策略 id、两边动作 |

## 判读首次分歧

对每个 case 记录：

- `candidateHashesMatchAtDivergence` —— 候选哈希是否一致。**关键陷阱**：很多"看似分歧"其实只是
  **步批分差异**（一方把多个消除合进一步、另一方拆成连续几步）；候选哈希对齐后才能确认是不是真的根因。
- 首次分歧的策略 id（两边）。
- 从 `divergence-probe.json` 取两边的具体消除动作。
- 当前分支从同一恢复态是否有有效救援策略。

## 转成回归测试（TDD：先红后绿）

1. **restored-state 测试**：用 `divergence-probe.json` 的 `probeGrid` / `candidateHashBefore` 构造恢复态，
   断言期望消除以"必须包含的若干 sound 消除"形式出现（用 `arrayContaining`），**不要**断言唯一精确步：
   ```ts
   expect(step?.eliminations).toEqual(expect.arrayContaining([
     { cell: 54, digit: 5 }, { cell: 63, digit: 5 }, { cell: 72, digit: 5 },
   ]));
   ```
2. **整题测试**：在 restored-state 修复通过后，再加"用 `STRATEGIES` 解整题、断言 `outcome==='solved'` 且
   `checkTraceSoundness(...).sound===true`"。
3. 测试落在 `packages/engine/test/diabolical-regressions.test.ts`。
4. **最小化实现修复**：先定位真正根因层（locked-candidates 选择策略？ALS 覆盖？AIC 排序？），改那一层，
   **不要**加针对具体题号的 guard 或字面量分支。

## 红线（务必遵守）

- 任何修复若降低全语料 solved 数、或引入 invalid 解，立即停。
- 同一策略选择策略调三次仍不行，重新考虑架构，别再堆 tie-break 规则。
- 不得以"人类策略"之名引入回溯、模板枚举、无约束 forcing nets。

## 相关

- 对比测试总流程：[`model-comparison-process.md`](./model-comparison-process.md)
- 结果数据生成与管理：[`results-data-management.md`](./results-data-management.md)
