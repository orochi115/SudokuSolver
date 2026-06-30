# Round2 run4 · 状态、统计与事件留痕

> 本文是 [harness-spec.md](./harness-spec.md) 的配套细则。**核心约束：状态与统计只允许追加或新建文件，禁止覆盖。**
> 每个 start / stop / pause / kill 必须写一条事件，resume 只读这些事件重建游标。

## 1. 设计原则

### 1.1 禁止覆盖（硬规则）

| 允许 | 禁止 |
|---|---|
| 向 `*.jsonl` **追加**一行 | 重写整个 jsonl |
| 创建 `action-003-<ts>.log` 新文件 | 复用 `action-001.log` 写入第二次 |
| 用 **原子 replace** 更新「当前视图」快照（见 §2.3） | 直接 `>` 覆盖无历史的 `status.json` |
| `pipeline.log` append | 截断 `pipeline.log`（`cleanup` 除外） |

实现方应使用：`>>` 写 jsonl、`printf > file.tmp && mv` 写快照、日志文件名含单调序号或 ISO 时间戳。

### 1.2 留痕（硬规则）

以下动作**各写一条** `events.jsonl`（类型见 §3）：

- scheduler **start** / **stop**（正常结束）
- 每模型 pipeline **start** / **stop**
- 每 **round** start / complete / fail / skip
- 每 **turn** start / complete / fail / skip
- 每 **action** start / end（含 exitReason）
- **verify-turn** / **verify-round** start / end
- **git commit**（checkpoint）
- **pause** 请求被采纳 / **resume** 游标恢复
- watchdog **kill**（含 reason、被 kill 的 pid 树）
- **cost-fuse** 熔断
- 外部 **control** 信号创建/删除（可选，由 monitor 写）

没有事件 = 不能 resume。宁可多写，不可漏写。

---

## 2. 文件布局

根目录：`orchestration/round2/reports/`（调度层）、`../sudoku-wt-r2/logs/<name>/`（每模型）。

```
orchestration/round2/reports/
  run-all.pid                 # scheduler pgid（启动时写，退出时删）
  run-all.jsonl               # 全局 scheduler 事件
  watchdog.pid
  watchdog.jsonl
  scheduler.log               # append only

  control/                    # 控制信号（touch 创建，rm 清除）
    PAUSE                     # 全局暂停
    PAUSE.<name>              # 单模型暂停
    STOP                      # 全局停止（monitor 转 kill）
    STOP.<name>
    STOP.cost.<name>          # watchdog 费用熔断写入

  pids/
    <name>.json               # 当前 runner 快照（原子 mv 更新）

  status/
    <name>.json               # 当前视图快照（原子 mv，见 §2.3）
    <name>.hist.jsonl         # 每次 status 变更追加一行

  liveness.json               # monitor 用，周期性原子 mv（可选）

logs/<name>/
  pipeline.log                # append
  events.jsonl                # 本模型全量事件（append）
  checkpoints.jsonl           # 仅 turn 检查点（append）
  stats.jsonl                 # 度量增量（append，§4）

  rounds/<round>/             # round = p0|p1|p2a|p2b|e|p3
    round-meta.json           # 创建后不变；含 startedAt、requiredIds[]
    turns/<strategyId>/
      turn-meta.json          # 创建后不变；parentCommit、startedAt
      action-<seq>-<ts>.log
      action-<seq>-<ts>.prompt.txt
      action-<seq>-<ts>.meta.json   # exit code, sessionId, wallSec, idleReason
      verify-turn-<seq>-<ts>.json
      turn-summary.json       # turn 结束时写一次（不可变；失败则写 turn-summary-fail-<ts>.json）
```

**不存在的路径**：`p0-attempt-1.log` 覆写、`p0.metrics.json` 单文件覆盖、把旧日志 mv 到 prevruns（run4 v3 不需要 prevruns）。

### 2.3 「当前视图」快照 vs 历史

- **hist / jsonl**：真相来源，只追加。
- **`<name>.json` / `pids/<name>.json`**：从 jsonl 推导的**最新快照**，便于 monitor O(1) 读取；更新方式：

```bash
write_snapshot() {
  tmp="$1.tmp.$$"
  build_json_from_events > "$tmp" && mv "$tmp" "$1"
}
```

崩溃时最多快照落后一条事件；resume 以 **jsonl 为准** 重放。

---

## 3. `events.jsonl` 记录格式

每行一个 JSON 对象（NDJSON）。公共字段：

```jsonc
{
  "ts": "2026-06-30T12:00:00+08:00",  // ISO8601
  "unix": 1782811200,
  "runId": "round2-run4-20260630",          // 本次实验 ID，launch 时生成
  "name": "gpt55",                     // 模型短名；scheduler 级事件可省略
  "kind": "action.end",                // 见下表
  "data": { /* kind-specific */ }
}
```

### 3.1 `kind` 枚举与 `data` 字段

| kind | 触发时机 | data 要点 |
|---|---|---|
| `scheduler.start` | run-all 启动 | `{ pid, pgid, models[], env{} }` |
| `scheduler.stop` | run-all 正常退出 | `{ pid, reason:"complete", running:0 }` |
| `scheduler.signal` | trap 收到 SIG | `{ sig, pid }` |
| `pipeline.start` | --one 开始 | `{ pid, model, runner }` |
| `pipeline.stop` | --one 结束 | `{ pid, reason, lastRound, lastTurn }` |
| `round.start` | 进入 round | `{ round, requiredIds[] }` |
| `round.complete` | round 末 verify 过 | `{ round, verifyRc, gitCommit }` |
| `round.fail` | round 失败 | `{ round, verifyRc, hardReasons }` |
| `round.skip` | 前序 fail 跳过 | `{ round, because }` |
| `turn.start` | 开始实现 strategyId | `{ round, strategyId, parentCommit }` |
| `turn.complete` | turn 夹具+verify-turn 过 | `{ round, strategyId, gitCommit, actions, costUsd }` |
| `turn.fail` | turn 重试耗尽 | `{ round, strategyId, lastCommit, reason }` |
| `turn.skip` | 可选：跳过该 id | `{ round, strategyId, reason }` |
| `action.start` | opencode 调用前 | `{ round, strategyId, seq, sessionId? }` |
| `action.end` | opencode 退出后 | `{ seq, exitCode, idleReason?, wallSec, sessionId }` |
| `verify.turn.start` | turn 末验证开始 | `{ round, strategyId, seq }` |
| `verify.turn.end` | 结束 | `{ rc, hardReasons?, fixturePass }` |
| `verify.round.start` | round 末验证 | `{ round }` |
| `verify.round.end` | 结束 | `{ rc, solveHuman, solveLast, offenders[] }` |
| `git.commit` | turn/round 提交后 | `{ commit, parent, subject, round, strategyId? }` |
| `checkpoint` | turn 成功或显式存档 | `{ commit, round, strategyId, actionCount }` |
| `pause.accepted` | action 末读到 PAUSE | `{ scope:"global"|"model", round, turn }` |
| `resume.cursor` | 启动时恢复游标 | `{ round, strategyId, commit, actionSeq }` |
| `watchdog.kill` | SIGKILL 子树 | `{ round, turn, targetPid, staleSec, reason }` |
| `cost.fuse` | 超 MAX_COST | `{ costUsd, limit, action }` |
| `control.touch` | 用户 touch 信号 | `{ file, by:"monitor"|"user" }` |

---

## 4. `stats.jsonl`（统计增量）

与 events 分离：**一行 = 一条可加总的度量**，供 report 与 watchdog 累加 cost，不覆盖汇总文件。

```jsonc
{
  "ts": "...",
  "name": "gpt55",
  "scope": "action",        // action | turn | round
  "round": "p1",
  "strategyId": "tridagon",
  "seq": 3,
  "costUsd": 0.18,
  "tokensIn": 12000,
  "tokensOut": 800,
  "wallSec": 45,
  "activeSec": 42,
  "verifySec": 0
}
```

report.sh **只读 stats.jsonl 求和**，不读可变的 `metrics.json`。

---

## 5. `checkpoints.jsonl`

仅在「可恢复点」追加：

```jsonc
{
  "ts": "...",
  "name": "gpt55",
  "round": "p1",
  "strategyId": "tridagon",
  "gitCommit": "a1b2c3d4",
  "parentCommit": "f0e0e0e0",
  "actionCount": 2,
  "verify": "turn-pass",
  "costUsdTurn": 0.55
}
```

**恢复默认策略**：turn 失败且 `TURN_RETRIES` 耗尽 → `git reset --hard <parentCommit>` → 新 session → 新 action 序列（不覆盖旧 action 日志）。

---

## 6. start / stop / kill 留痕流程

### 6.1 正常启动

```
launch.sh
  → run-all: scheduler.start → run-all.pid
  → watchdog: 写 watchdog.pid + watchdog.jsonl scheduler.watchdog.start
  → 每模型 --one: pipeline.start → pids/<name>.json
```

### 6.2 暂停（优雅）

```
用户: touch reports/control/PAUSE[.<name>]
runner: 当前 action 结束 → verify-turn → 写 pause.accepted → pipeline.stop reason=paused
        不标 round/turn fail；status 中 current.state = "paused"
下次 launch: resume.cursor 读 status + events → 从下一 action 或下一 turn 继续
```

### 6.3 外部停止

```
monitor.sh stop-all
  → 写 control/STOP + events control.touch
  → kill -TERM -$(cat run-all.pid)
  → scheduler  trap → scheduler.signal + scheduler.stop reason=sigterm
子 pipeline: pipeline.stop reason=sigterm（trap 内尽量写）
```

### 6.4 watchdog kill

```
watchdog 检测 stale → 写 logs/<name>/events.jsonl watchdog.kill
  → 写 rounds/.../action-*-*.meta.json exitReason=watchdog
  → 不删 pid 文件；runner 死后 scheduler 标 pipeline.stop reason=watchdog
resume: 该 turn 未 turn.complete → 从 turn.start 的 parentCommit 或上一 checkpoint 重试
```

### 6.5 费用熔断

```
watchdog 累加 stats.jsonl cost → 超阈
  → touch control/STOP.cost.<name>
  → events cost.fuse
runner 在 action 末读到 → pipeline.stop reason=cost-fuse
```

---

## 7. Resume 算法（伪代码）

```text
function resumeModel(name):
  events = readJsonl(logs/name/events.jsonl)
  cp = last(events, kind in ["checkpoint", "turn.complete"])
  if exists(control/PAUSE*) and not forced:
    cursor = last(events, kind == "pause.accepted")
  else:
    cursor = deriveCursor(events)
    append(resume.cursor, cursor)

  if cursor.roundComplete:
    nextRound = nextRequiredRound(status)
  else if cursor.turnComplete:
    nextTurn = nextStrategyId(cursor.round)
  else:
    git checkout cursor.parentCommit or cursor.commit
    nextTurn = cursor.strategyId
    nextActionSeq = cursor.actionSeq + 1

  status[name].json = snapshot(cursor)
  return { nextRound, nextTurn, nextActionSeq, sessionId: null }  // 失败 turn 换新 session
```

**与 run1–run3 隔离**：run4 使用新 `runId`（如 `round2-run4-20260630`）；不读取 run1–run3 的 `status/*.tsv`。

### 7.1 status/<name>.json 快照字段

```jsonc
{
  "runId": "round2-run4-20260630",
  "name": "gpt55",
  "state": "running",       // idle | running | paused | stopped | complete
  "currentRound": "p1",
  "currentTurn": "tridagon",
  "currentActionSeq": 3,
  "lastCheckpoint": "a1b2c3d4",
  "rounds": {
    "p0": { "state": "complete", "commit": "..." },
    "p1": { "state": "in_progress", "turnsDone": ["..."], "turnsFail": [] }
  },
  "costUsdTotal": 12.5,
  "updatedAt": "..."
}
```

每次变更：`hist.jsonl` 追加一行完整快照 + 原子 mv `status/<name>.json`。

---

## 8. report 读取规则

1. **进度 / 结果**：`status/*.json` + `events.jsonl` 按 `runId` 过滤
2. **费用 / token**：仅累加 `stats.jsonl`
3. **失败原因**：`verify-turn-*.json` / `verify-round-*.json` + `turn-summary*.json`
4. **禁止**：依赖可被覆盖的单一 `p0.metrics.json`（run4 harness 不再生成）

全语料 **full corpus** 不在此流程内；跑完后人工执行，结果单独目录归档（见 [scoring.md](./scoring.md)）。

---

## 9. cleanup 边界

`cleanup.sh` 是唯一允许删除 `logs/` 与 `reports/status` 的入口；默认**不删** `events.jsonl`（除非 `--purge` 显式抹掉整次 run）。

归档时：`archive-run.sh` 将 `logs/` + `reports/` 打 tar.gz（LFS），**不 truncate 源文件直到 tar 成功**（同 round2 教训）。