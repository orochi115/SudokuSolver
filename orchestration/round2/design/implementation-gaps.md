# Round2 run4 · 实现补充规格

> 本文补齐 [harness-spec.md](./harness-spec.md) 与 [state-and-events.md](./state-and-events.md) 中**实现前必须约定**、但主规格未展开的细节。
> 读完本文 + 三份主文档，即可开始写 harness 代码。

## 1. 完备度结论

| 类别 | 状态 |
|---|---|
| 状态机、文件布局、事件 schema | ✅ 足够 |
| verify 分层、Hard/Soft 边界 | ✅ 足够 |
| Monitor / Watchdog / control | ✅ 足够 |
| KPI 与 report 数据源 | ✅ 足够 |
| 共享库、env、夹具映射、prompt 模板 | ✅ 本文 §2–§8 |
| stub 预写死、foundation 重切 | ✅ 本文 §9–§10 |
| v2 脚本迁移 | ✅ 本文 §11 |

**判定：设计完备度足够开始实现。** harness 代码本身尚未编写。

---

## 2. 共享库 `lib/events.sh`

新建 `orchestration/round2/harness/lib/events.sh`，被 `run-step.sh`、`run-phase.sh`、`run-all.sh`、`watchdog.sh`、`monitor.sh` source。

```bash
# 约定函数（实现时保持签名稳定）
write_event()   # $logdir/events.jsonl  — kind + data + 公共字段
append_stats()  # $logdir/stats.jsonl
write_checkpoint()
write_snapshot()  # 原子 mv 写 status/*.json / pids/*.json
derive_cursor()   # 从 events.jsonl 重建游标（resume 用）
new_run_id()      # round2-run4-YYYYMMDD-HHMMSS
```

**`write_event` 公共字段**（与 state-and-events §3 一致）：

```bash
write_event "$events_file" "$kind" "$name" "$(jq -nc --arg k "$kind" '{...}')"
# 自动注入: ts, unix, runId, name（scheduler 级可省略 name）
```

**原则**：所有脚本禁止直接 `echo >> events.jsonl` 拼裸 JSON；统一走 `write_event` 保证 schema 一致。

---

## 3. 环境变量表

继承 v2（`run-all.sh` / `run-model.sh` / `launch.sh`），v3 新增标注 **(v3)**。

| 变量 | 默认 | 作用域 | 说明 |
|---|---|---|---|
| `MAX_PAR` | 8 | scheduler | 并发模型上限 |
| `SERIAL_PROVIDERS` | `amazon-bedrock alibaba-cn siliconflow-cn grok` | scheduler | 同 key 串行分组 |
| `SERIAL_CAP` | 1 | scheduler | 串行 provider 并发上限 |
| `LAUNCH_STAGGER` | 8 | scheduler | 模型冷启动错峰（秒） |
| `VERIFY_MAX` | 3 | verify | 本地 verify 并发（保护笔记本） |
| `TIMEOUT` | 3600 | invocation | 单次 opencode 硬超时（秒） |
| `IDLE` | 180 | invocation | 无输出判「本轮结束」（秒） |
| `VERIFY_TIMEOUT` | 2700 | verify-phase | phase 末 verify 超时 |
| `WATCHDOG` | 1 | scheduler | 是否启动 watchdog |
| `WATCHDOG_STALL` | 2400 | watchdog | pipeline.log 无增长阈值（秒） |
| `WATCHDOG_CHECK` | 120 | watchdog | watchdog 轮询间隔 |
| `COST_CHECK_SEC` **(v3)** | 60 | watchdog | 费用累加轮询 |
| `MAX_COST_PER_MODEL` **(v3)** | （待 pilot 定，建议 50） | watchdog | 单模型费用熔断 USD |
| `INVOCATION_RETRIES` **(v3)** | 3 | step | opencode 失败 / kill / idle 重试 |
| `STEP_RETRIES` **(v3)** | 2 | step | verify-step 失败后 git reset 重试 |
| `PHASE_RETRIES` **(v3)** | 1 | phase | verify-phase 失败后重跑 |
| `PHASE_FAIL_POLICY` **(v3)** | `skip` | phase | `skip`（默认，同 v2）或 `continue` |
| `RUN_TAG` **(v3)** | `round2/run4` | launch | 归档路径 `archive/$RUN_TAG/` |
| `RUN_ID` **(v3)** | launch 生成 | 全局 | 写入所有 jsonl |
| `DRY_RUN` | 0 | scheduler | 模拟不调用模型 |
| `POLLUTION_HUMAN_MAX` | 480 | verify-phase | human-default solved 异常高阈值 |

`launch.sh` 注释块应列出 v3 全套 env 示例（含 `RUN_TAG`）。

---

## 4. Step prompt 模板

### 4.1 文件布局

```
orchestration/round2/prompts/
  phases/p0.md … p3.md,e.md     # 保留：phase 级红线与背景（从现有 prompts/*.md 迁入或软链）
  steps/_template.md            # step 拼接骨架
  steps/<strategyId>.md         # 可选：per-id 补充（研究卡路径、夹具 hint）
```

### 4.2 拼接规则（`run-step.sh`）

每次 invocation 由 harness 生成 `invocation-<seq>-<ts>.prompt.txt`：

1. **Header**：`phase`、`strategyId`、`runId`、`invocation seq`
2. **Phase 上下文**：`phases/<phase>/phase-meta.json` 中 `stepsDone[]`
3. **Phase 红线**：`prompts/phases/<phase>.md` 全文或摘要
4. **Step 任务**：`prompts/steps/<id>.md` 若存在，否则从 `_template.md` + checklist 行生成
5. **夹具要求**：引用 `docs/strategy-implementation-guide.md` §TDD + 本 id 研究卡路径（见 §5）
6. **Retry 块**（`seq > 1` 或 `STEP_RETRIES > 0`）：上一 `verify-step-*.json` 的 `hardReasons` + offenders 摘要
7. **禁止**：一次实现多个 id；增删 registry 条目；改其他 id 的 difficulty

### 4.3 Session 语义

| 场景 | session |
|---|---|
| 同 step 内 invocation 重试（`INVOCATION_RETRIES`） | **续 session**（`opencode run --continue`） |
| `STEP_RETRIES`（verify-step 失败，已 `git reset`） | **新 session**（`sessionId: null`） |
| resume 从 pause | 续上一 session（若 meta 有 `sessionId`） |
| resume 从 watchdog kill（step 未完成） | 新 session，从 `parentCommit` |

---

## 5. 夹具与研究卡映射

**不维护独立大表**——以现有单一真相源推导：

| 数据源 | 用途 |
|---|---|
| `required-ids/<phase>.txt` | step 顺序与 scope |
| `docs/plans/diabolical-727-checklist.md` | 每 id 的 detector、difficulty、研究卡列 |
| `research/sudoku-human-solving/local-library/techniques/**` | 研究卡正文 |
| `orchestration/round2/prompts/p*.md` | phase 级研究卡路径列表 |
| `packages/engine/test/` 或 `strategies/<id>.test.ts` | step 末 T0 夹具路径（实现时按 id 约定命名） |

**`verify-step.sh` 解析规则**：

```bash
# T0: vitest run packages/engine/test/strategies/<id>.test.ts  # 或约定路径
# T1: npx tsx harness/judge/smoke-apply.ts <id>   # apply(fixtureGrid) !== null
# T3: grep -l 'solveBruteforce\|countSolutions' packages/engine/src/strategies/<id>.ts
```

实现时在 `harness/judge/` 新增 `smoke-apply.ts`（若尚无）；夹具盘面从研究卡 worked example 或 test 文件 import。

---

## 6. 结构化失败反馈（retry prompt 片段）

```
## 上轮失败（请只修下列问题，勿改其他策略）

- verify-step rc=1
- hardReasons: fixture-fail, oracle-grep
- 夹具: finned-x-wing.test.ts — expected elimination r3c5, got null
- 727 offender: puzzle 42, strategyId finned-x-wing, 2 illegal eliminations
- 污染: grep hit solveBruteforce in strategies/foo.ts（若适用）

约束：仍只实现 strategyId=<id>；不得修改 registry 其他条目。
```

由 `run-step.sh` 从 `verify-step-*.json` + judge stdout 自动填充。

---

## 7. verify 脚本拆分

| 脚本 | 从 `verify.sh` 拆出 | 时机 |
|---|---|---|
| `verify-step.sh` | T0–T3 only；**不跑** npm test / 727 | step 末 |
| `verify-phase.sh` | 原 `verify.sh` §1–5 全量；加 `--phase` | phase 末 |

**复用**：`verify-phase.sh` 可 `source` 或调用现有 `verify.sh "$WT" "$PH"` 不变；`verify-step.sh` 为新增薄包装。

phase 末 KPI（利用率）在 `verify-phase.sh` 成功后由 `run-phase.sh` 调用 `judge/usage-kpi.ts` 追加 `stats.jsonl` scope=phase-kpi。

---

## 8. models.txt run4 变更

相对当前 `orchestration/round2/models.txt`：

1. **删除** `devstral2` 行（round2 三次 P0 失败）
2. **改 runner**：`composer25`、`grokbuild` 从 `grok` → `opencode`（xai 路由）
3. 其余行不变；`SERIAL_PROVIDERS` 可去掉 `grok`（若无一 grok runner）

建议另存 `models-run4.txt` 或直接在 master 更新并注释「run4 起用」。

---

## 9. Stub 预写死流程

**目标**：worktree 创建时 registry 已含全部 round2 required id，均为 `apply() => null` 占位。

```
1. 合并 required-ids/*.txt → required-ids/all.txt（去重、保序）
2. 脚本 harness/bootstrap-stubs.ts（或手工一次性 PR）：
   - 对每个 id 生成 strategies/<id>.ts stub
   - 更新 index.ts STRATEGIES + CANONICAL_STRATEGY_ORDER（difficulty 用 checklist 拟定值）
   - overlap.ts futureMembers → members 仅在实际实现时动
3. master 合并后，foundation 从该 master 重切
4. step 任务禁止增删 registry；只替换 stub 的 apply 实现
```

`NotImplementedStrategy` 模式：`apply: () => null`，`difficulty` 占位，explanation 空。

---

## 10. Foundation 重切检查清单

从当前 master（含 stub + verify:r2 + harness v3 设计就绪）：

```bash
git checkout -b foundation master
# 删除 orchestration/、research/hodoku-logic/
# 中性化 README（去掉 round2 实验指引，保留引擎说明）
# 保留 packages/engine、data/、docs/plans、research/sudoku-human-solving/
git commit -m "foundation: neutral base for round2 run4"
```

旧 foundation 快照：`archive/round2/run3/foundation`（只读参考）。

---

## 11. v2 脚本迁移

| v2 脚本 | v3 处理 |
|---|---|
| `run-model.sh` | 拆为 `run-phase.sh` + `run-step.sh`；grok 分支删除 |
| `run-all.sh` | 调度逻辑保留；`--one` 改调 `run-phase.sh` 链 |
| `verify.sh` | 保留；由 `verify-phase.sh` 调用 |
| `watchdog.sh` | 加费用熔断 + `write_event` |
| `launch.sh` | 加 `RUN_ID`/`RUN_TAG` 生成；写 `run-all.jsonl` |
| `report.sh` | 改读 jsonl（status + events + stats）；不再读 `*.metrics.json` |
| `cleanup.sh` | 默认保留 jsonl；`--purge` 抹整次 run |
| `archive-run.sh` | `RUN_TAG` 默认 `round2/run4`；tar 含 jsonl；tar 成功前不 truncate |
| `metrics-grok.mjs` | 退役；费用从 opencode 输出解析进 `stats.jsonl` |

---

## 12. Pilot 流程（实现后首次真跑）

1. `models-pilot.txt`：2–3 模型（如 `gpt55`、`glm52`）
2. `PHASES=(p0)` 或 env `PILOT_PHASES=p0` 只跑 P0
3. 验证：events 可 resume、checkpoint 可 reset、monitor 可读、watchdog 可 kill
4. 通过后换 `models-run4.txt` 全量 + 全 phase 链

---

## 13. 实现顺序（与 README 一致）

1. `lib/events.sh` + jsonl 写入
2. `verify-step.sh` + `smoke-apply.ts`
3. `run-step.sh`（含 prompt 拼接）
4. `run-phase.sh` + `verify-phase.sh`
5. 改造 `run-all.sh` / `launch.sh`
6. `watchdog.sh` 费用 + `monitor.sh`
7. `report.sh` v3
8. `bootstrap-stubs.ts` + foundation 重切
9. pilot → full run4