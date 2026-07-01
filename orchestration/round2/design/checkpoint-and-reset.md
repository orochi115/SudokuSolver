# Round2 run4 · Checkpoint 与 Git Reset

> **结论**：checkpoint **值得做**，但 reset 不是 `git reset --hard` 一行了事。
> 对应假设 H3，见 [experiment-matrix.md](./experiment-matrix.md)。
> 代码回滚到 `parentCommit` 的同时，**日志 / jsonl / attempt 摘要必须保留**，且下一轮的 prompt 必须通过 **attempt dossier** 把失败经验写回去（见 [prompt-engineering.md §5–6](./prompt-engineering.md#5-attemptkind-与上下文深度)）。

## 1. 两个层次

| 概念 | 时机 | git | 日志 |
|---|---|---|---|
| **checkpoint** | `step.complete`（verify-step 通过） | `git commit` | 追加 `checkpoints.jsonl`、`git.commit` 事件 |
| **reset** | `STEP_RETRIES`（verify-step 失败且需重跑整 step） | `git reset --hard <parentCommit>` | **不删**；追加 `step.fail`、`attempt-history.jsonl` |

```
parentCommit (checkpoint N-1 或 phase 起点)
    │
    ├─ invocation 1..k  （可能多次，代码在 worktree 演进）
    ├─ verify-step FAIL
    ├─ capture-attempt   ← reset 前必做
    ├─ git reset --hard parentCommit
    └─ invocation k+1..  （新 session，prompt 含 dossier）
```

**不做 reset 的情况**：`INVOCATION_RETRIES` 内 opencode 失败/idle — worktree **不动**，续 session 重试。

## 2. 不可丢失 vs 必须回滚

| 保留（append-only） | 回滚 |
|---|---|
| `events.jsonl` 全部历史 | worktree 内**本 step**未 checkpoint 的代码改动 |
| `stats.jsonl` | `git index` / 未提交变更 |
| `invocation-*.log` / `*.prompt.txt` | — |
| `verify-step-*.json` | — |
| `attempt-history.jsonl` | — |
| `attempt-*-diff*.patch` | — |
| `checkpoints.jsonl`（只追加成功点） | — |
| `step-meta.json` 的 `parentCommit` 字段不变 | — |

**原则**：jsonl 与 logs 是**审计真相源**；git 只是 worktree 的「可写草稿」。reset 只抹草稿，不抹审计。

## 3. Reset 前脚本：`lib/capture-attempt.sh`

`run-step.sh` 在 `git reset` **之前**必须调用：

```bash
capture_attempt() {
  local wt="$1" parent="$2" step_dir="$3" attempt_n="$4"
  local failed_head="$(git -C "$wt" rev-parse HEAD)"

  # 1) diff 统计与 excerpt（仅本 id 相关文件）
  git -C "$wt" diff "$parent" "$failed_head" --stat \
    > "$step_dir/attempt-${attempt_n}-diffstat.txt"
  git -C "$wt" diff "$parent" "$failed_head" -- \
    "packages/engine/src/strategies/${strategyId}.ts" \
    "packages/engine/test/strategies/${strategyId}.test.ts" \
    > "$step_dir/attempt-${attempt_n}-diff-excerpt.patch" || true

  # 2) 最后一份 verify-step JSON 已在 step_dir（append-only，不覆盖）

  # 3) 追加 attempt-history.jsonl
  write_attempt_history_line "$step_dir/attempt-history.jsonl" ...

  # 4) events: step.fail（含 artifact 指针，非内联大段文本）
  write_event ... "step.fail" "$(jq -nc \
    --arg p "$parent" --arg f "$failed_head" \
    '{ parentCommit: $p, failedCommit: $f, attempt: $attempt_n,
       verifyRef: "verify-step-...", diffRef: "attempt-N-diff-excerpt.patch",
       invocationRefs: ["invocation-001-....log", ...] }')"
}
```

**禁止**：reset 后仍让 prompt 引用「你刚才写的 `strategies/foo.ts`」而不附带 excerpt — 该文件已不存在于 worktree。

## 4. parentCommit 解析规则

| 场景 | parentCommit |
|---|---|
| phase 内第一个 step | 上一 `step.complete` 的 `gitCommit`，或 phase 入口 commit |
| phase 内后续 step | 上一 step 的 checkpoint `gitCommit` |
| `STEP_RETRIES` reset 目标 | **本 step** `step.start` 时记录的 `parentCommit`（不变） |
| phase 末 `PHASE_RETRIES` | 见 §6 |

`step-meta.json`（创建后不变，除 `parentCommit` 在 step.start 写入）：

```jsonc
{
  "phase": "p0",
  "strategyId": "finned-x-wing",
  "parentCommit": "f0e0e0e0",
  "startedAt": "...",
  "stepRetryBudget": 2
}
```

## 5. 事件与游标一致性

reset 后 `resume` / 下一 invocation 的游标：

```jsonc
// step.fail 之后、下一 invocation.start 之前
{
  "currentStep": "finned-x-wing",
  "currentInvocationSeq": 4,        // 单调递增，不重用序号
  "gitHead": "f0e0e0e0",            // 等于 parentCommit
  "stepRetry": 2,
  "sessionId": null
}
```

| 字段 | reset 后行为 |
|---|---|
| `invocation seq` | **继续递增**（003 → 004），不覆盖 003 的 log |
| `sessionId` | 置 `null`（新 session） |
| `stepRetry` | +1，写入 `step-meta.json` 的运行时副本或 events |
| `checkpoints.jsonl` | **不写入**失败尝试 |

## 6. Phase 级重试（`PHASE_RETRIES`）

phase 末 `verify-phase` 失败时，**默认不 reset 整个 phase 的 git 历史**（已完成 step 的 checkpoint 保留）。

策略（可配置 `PHASE_RETRY_MODE`）：

| 模式 | 行为 |
|---|---|
| `last-steps`（默认） | 仅重跑 `verify-phase` 失败的「末段」steps（如最后 2 个 id） |
| `full-phase` | 从 phase 入口 commit reset 并重跑全部 step（**慎用**；需人工确认） |

重跑时 prompt 的 progress-snapshot 标注「phase retry 1/1」，dossier 引用 `verify-phase-*.json` 的 offenders。

## 7. 与 pause / resume 的边界

| 操作 | git | 历史 |
|---|---|---|
| PAUSE | 不动 | 保留 worktree 未提交改动（若有）；invocation 正常结束 |
| resume-pause | 不动 | 续 session；prompt 用 `resume-pause` kind |
| STEP_RETRIES reset | `reset --hard parentCommit` | 保留全部 invocation 历史 + attempt-history |
| watchdog kill | 通常不动 git | 若 kill 时未 verify：按 invocation-retry；若已脏改动：可选 reset 或保留（默认保留，靠 dossier） |

## 8. 文件布局补充

在 [state-and-events.md §2](./state-and-events.md#2-文件布局) 的 `steps/<strategyId>/` 下增加：

```
steps/<strategyId>/
  step-meta.json
  attempt-history.jsonl          # 每次 verify-step 失败 append 一行
  attempt-<n>-diffstat.txt
  attempt-<n>-diff-excerpt.patch
  invocation-<seq>-<ts>.log
  invocation-<seq>-<ts>.prompt.txt
  invocation-<seq>-<ts>.prompt-manifest.json
  verify-step-<seq>-<ts>.json
```

## 9. 实现检查清单

- [ ] `capture-attempt.sh` 在**每次** `git reset` 前执行
- [ ] reset 后 `git -C wt rev-parse HEAD` === `step-meta.parentCommit`
- [ ] `step.fail` 事件含 `verifyRef` / `diffRef` / `invocationRefs[]`
- [ ] `build-dossier.sh` 只读 artifact 路径，不读已消失的 worktree 状态
- [ ] invocation 序号全局单调（同 step 内不重用）
- [ ] CI grep：禁止 `git reset` 后 `rm` invocation / verify / attempt-history 文件