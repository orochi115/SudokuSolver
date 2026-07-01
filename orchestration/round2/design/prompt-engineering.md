# Round2 run4 · 提示词工程

> v2 是「整 phase 一条巨 prompt + 续跑时 prepend 失败摘要」；v3 改为 **step 窄任务 + 分层组装 + 按重试类型注入不同深度的上下文**。
> 对应假设 H2/H3，见 [experiment-matrix.md](./experiment-matrix.md)。
> 配套：[checkpoint-and-reset.md](./checkpoint-and-reset.md)（git reset 后如何把「学到的东西」写回 prompt）。

## 1. 设计原则

| 原则 | 说明 |
|---|---|
| **窄 scope** | 每次 invocation 只谈**一个** `strategyId`；禁止 v2 式「本 phase 全部 id 清单」塞进同一条 prompt |
| **harness 组装** | 模型不自选任务边界；`run-step.sh` / `lib/build-prompt.sh` 确定性拼接 |
| **重试 ≠ 抽盲盒** | `git reset` 会抹掉 worktree 代码，但**必须把上轮失败的可操作信息**写进新 prompt（见 §5、checkpoint 文档） |
| **分层复用** | 不变红线与 phase 规则分文件存放；动态块按 invocation 类型增减，避免每轮重复上万 token |
| **可追溯** | 每次生成 `prompt-manifest.json`，记录各 section 来源与引用的 artifact 路径 |

## 2. 与 v2 的差异

| 维度 | v2 (`run-model.sh`) | v3 (`run-step.sh`) |
|---|---|---|
| 粒度 | 整 phase 一次交付 | 单 step（单 id） |
| 主 prompt | `prompts/p0.md` 全文 + required-ids 附录 | phase 摘要 + step 专块 + 动态进度 |
| 续跑反馈 | `resume_feedback_section()` prepend 到 attempt-1 | 按 `attemptKind` 选不同 section 组合 |
| session | grok resume / opencode 多轮 | invocation 内续 session；step retry **必须新 session** |
| 失败信息 | `.verify.json` 截断 1400 字符 | 结构化 dossier + verify JSON + diff 摘要（reset 前捕获） |

v2 的 `resume_feedback_section` 思路保留并加强，但**绑定到 step 目录下的 artifact**，且区分 invocation 级与 step 级重试。

## 3. Prompt 分层（section）

实现时 `lib/build-prompt.sh` 按固定顺序拼接：

```
┌─────────────────────────────────────────┐
│ A. meta-header          （动态，必含）   │
│ B. invariants           （静态，每 step 首 invocation）│
│ C. phase-context        （静态/摘要）    │
│ D. step-task            （per-id）       │
│ E. progress-snapshot    （动态）         │
│ F. attempt-dossier      （重试时必含）   │
│ G. work-rhythm          （stall 预防）   │
│ H. closure-checklist    （收尾自检）     │
└─────────────────────────────────────────┘
```

### A. meta-header（每次必含）

```markdown
## 运行上下文
- runId: round2-run4-20260630-120000
- model: minimax-m3
- phase: p0 | step: finned-x-wing
- invocation: 3 / attemptKind: step-retry
- worktree: …/sudoku-wt-r2/minimax-m3
- git@step-start: f0e0e0e0
```

`attemptKind` 枚举：`fresh` | `invocation-retry` | `step-retry` | `resume-pause` | `resume-kill`

### B. invariants（`prompts/_invariants.md`）

每 step **第一次** invocation 包含全文；同 step 后续 invocation 可缩为「见 invocation-1 不变红线」+ 仅列禁止项标题（省 token）。

内容要点（从 v2 phase prompt 抽离）：
- 纯函数 `apply(grid) -> Step | null`，不改 grid
- 禁止暴力 oracle（`solveBruteforce` / `countSolutions`）
- 禁止 human-default 策略做回溯/穷举
- **禁止**一次实现多个 id；**禁止**增删 registry 条目
- 术语对齐 `research/sudoku-human-solving/glossary.zh-en.md`

### C. phase-context（`prompts/phases/<phase>.md`）

从现有 `prompts/p0.md` 等**瘦身**迁移：
- 保留：phase 目标、E 项耦合说明、phase 级红线、必读文档路径
- **删除**：本 phase 全部 strategyId 清单（改由 step-task 承载）
- **删除**：「必须实现清单中的全部 id」类整包表述

长度目标：每 phase ≤ 原 v2 prompt 的 40%。

### D. step-task（`prompts/steps/<id>.md` 或 checklist 生成）

每个 `strategyId` 一块，来源优先级：
1. 手写 `prompts/steps/<id>.md`（复杂 id）
2. 否则 `prompts/steps/_template.md` + `diabolical-727-checklist.md` 对应行填充

必含字段：

| 字段 | 来源 |
|---|---|
| `strategyId` | harness |
| 家族 / detector owner | checklist |
| 拟定 difficulty & 插入原则 | checklist + strategy-implementation-guide |
| 研究卡路径（1–3 个） | checklist / phase prompt 交叉引用 |
| 参考实现（同族文件） | harness 静态表或 checklist |
| 夹具要求 | `test/strategies/<id>.test.ts` 路径 +「须有 worked example 断言」 |
| overlap/boundaries 动作 | 「从 futureMembers 移入 members」等 |

**禁止**在 step-task 里列出同 phase 其他待实现 id（避免模型顺手实现）。

### E. progress-snapshot（动态）

```markdown
## 本 phase 进度
- 已完成 step: nice-loop, xy-chain（commit: abc1234, def5678）
- 当前 stub 状态: finned-x-wing 仍为 apply()=>null
- 本 step parentCommit: f0e0e0e0（reset 基准，勿改更早 commit 上的已完成 step）
```

从 `phase-meta.json`、`checkpoints.jsonl`、`events.jsonl` 生成。

### F. attempt-dossier（重试核心，见 §5）

`fresh` 第一次 invocation **不含**此块。  
`invocation-retry` / `step-retry` / `resume-*` **必含**。

### G. work-rhythm（`prompts/_work-rhythm.md`）

继承 v2 反 stall 文案；在以下情况**全文**注入：
- `attemptKind` 含 retry
- 存在 `watchdog.kill` 或 idle 事件
- invocation seq ≥ 2

要点：小步提交、每改一处就跑 typecheck/单测、禁止长时间无 tool 输出。

### H. closure-checklist（每次 invocation 末尾）

```markdown
## 收尾（本轮结束前自检）
1. 仅改动 strategies/<id>.ts 及本 id 测试；未动其他 id
2. `npm run typecheck` 与 `vitest run …/<id>.test.ts` 本地通过
3. 在 docs/plans/diabolical-727-checklist.md 勾选本 id（若首次完成）
4. 回复「STEP_DONE」仅当以上满足且你认为实现完毕（harness 仍会跑 verify-step）
```

模型声明 `STEP_DONE` 仅触发 harness 提前结束 invocation 循环；**不以模型自述代替 verify**。

## 4. 组装管线

```
run-step.sh
  ├─ resolve attemptKind（events + seq + STEP_RETRIES）
  ├─ lib/build-prompt.sh
  │    ├─ load static sections（invariants, phase, step-task）
  │    ├─ build progress-snapshot
  │    ├─ lib/build-dossier.sh（若 retry）
  │    └─ write invocation-<seq>-<ts>.prompt.txt
  │         + invocation-<seq>-<ts>.prompt-manifest.json
  └─ opencode run --prompt-file … [--continue]
```

### `prompt-manifest.json` 示例

```jsonc
{
  "seq": 3,
  "attemptKind": "step-retry",
  "stepRetry": 2,
  "sections": ["meta", "invariants-abbr", "phase", "step-task", "progress", "dossier", "rhythm", "closure"],
  "artifactRefs": [
    "attempt-history.jsonl#line-2",
    "verify-step-2-20260630T120100.json",
    "invocation-002-20260630T115800.log#tail-80"
  ],
  "chars": 12400
}
```

report / 人工调试时通过 manifest 还原「模型当时看到了什么」。

## 5. attemptKind 与上下文深度

| attemptKind | 触发 | session | 必含 section | dossier 深度 |
|---|---|---|---|---|
| `fresh` | step 第 1 次 invocation | 新建 | A–E, G, H | 无 |
| `invocation-retry` | opencode 失败/idle/watchdog，未 verify | **续** | A, E, F-lite, G, H | 上轮 invocation 摘要 + stall 原因 |
| `step-retry` | verify-step 失败，`git reset` 后 | **新建** | A–H 全量 | **完整 dossier**（§6） |
| `resume-pause` | PAUSE 后继续 | 续（若有 sessionId） | A, E, F-lite, H | pause 前最后一轮 verify 状态 |
| `resume-kill` | watchdog 后 resume | 新建 | A–H | dossier + kill 原因 |

**关键**：`step-retry` 时模型**看不到**上轮代码（已 reset），dossier 必须包含：
- 失败 verify 的结构化原因
- 上轮尝试的 **diff 摘要**（reset 前捕获，非整仓库）
- 相关 log **摘录**（非全文，控制 ≤ 4k token）
- 明确「勿重复的错误路径」

## 6. Attempt dossier 结构（step-retry）

由 `lib/build-dossier.sh` 从以下来源组装：

| 来源文件 | 内容 |
|---|---|
| `steps/<id>/attempt-history.jsonl` | 每行一次失败尝试的摘要（reset 前追加） |
| `verify-step-<n>-<ts>.json` | `hardReasons`, `fixtureOutput`, `offenders[]` |
| `attempt-<n>-diffstat.txt` | `git diff parent..failed --stat` |
| `attempt-<n>-diff-excerpt.patch` | 仅 `strategies/<id>.ts` 与对应 test（≤200 行） |
| `invocation-*-*.log` | `tail -n 80` 或 tool-error 行 grep |

模板：

```markdown
## ⚠️ 上轮本 step 未通过（worktree 已还原到 parentCommit）

### 失败验收（verify-step）
- rc: 1
- hardReasons: [fixture-fail, typecheck]
- 夹具: finned-x-wing.test.ts — Expected elimination at r3c5, received null
- （若有）727 offender: puzzle 12, strategyId finned-x-wing, 3 violations

### 上轮你曾做的改动（已撤销，勿原样重复）
```diff
… excerpt …
```

### 上轮 invocation 摘录
```
… tail of log …
```

### 请针对性修正
1. 只改 strategyId=finned-x-wing 及其测试
2. 优先修 hardReasons 列出的第一项
3. 不要扩大 scope 到其他策略
```

`attempt-history.jsonl` 单行示例：

```jsonc
{
  "attempt": 2,
  "failedCommit": "deadbeef",
  "parentCommit": "f0e0e0e0",
  "invocationCount": 3,
  "verifyRef": "verify-step-2-20260630T120100.json",
  "diffRef": "attempt-2-diff-excerpt.patch",
  "hardReasons": ["fixture-fail"],
  "summary": "apply returned null on fixture; typecheck passed"
}
```

## 7. 静态文件布局

```
orchestration/round2/prompts/
  _invariants.md
  _work-rhythm.md
  phases/p0.md … p3.md, e.md      # 从现有 prompts/*.md 瘦身迁入
  steps/_template.md
  steps/<strategyId>.md           # 可选，逐步补齐高频/难 id
```

实现顺序：先 `_template.md` + checklist 自动生成；再为 run1–run3 中**失败最多**的 id 手写 `steps/<id>.md`。

## 8. Token 预算（建议）

| section | fresh | step-retry |
|---|---|---|
| invariants | ≤2k | ≤0.5k（缩写） |
| phase | ≤3k | ≤3k |
| step-task | ≤2k | ≤2k |
| progress | ≤0.5k | ≤0.5k |
| dossier | 0 | ≤6k |
| rhythm + closure | ≤1k | ≤1k |
| **合计** | **~8k** | **~13k** |

超过 16k 时：优先截断 log excerpt，保留 verify JSON 与 diff excerpt。

## 9. 实现检查清单

- [ ] `build-prompt.sh` 对同一输入确定性输出（便于回归测试）
- [ ] 每种 `attemptKind` 有 fixture 测试（golden prompt 片段）
- [ ] `step-retry` prompt 含 diff excerpt，不依赖已 reset 的 worktree 文件
- [ ] `prompt-manifest.json` 与 `invocation-*.prompt.txt` 成对落盘
- [ ] phase prompt 已瘦身，无「实现本 phase 全部 id」表述