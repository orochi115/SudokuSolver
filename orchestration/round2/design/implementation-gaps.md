# Round2 run4 · 实现补充规格

> 本文补齐 [harness-spec.md](./harness-spec.md) 与 [state-and-events.md](./state-and-events.md) 中**实现前必须约定**、但主规格未展开的细节。
> 读完本文 + 三份主文档，即可开始写 harness 代码。
> 跑前冻结清单、pilot 与 full run 解读协议见 [experiment-matrix.md](./experiment-matrix.md)。

## 1. 完备度结论

| 类别 | 状态 |
|---|---|
| 状态机、文件布局、事件 schema | ✅ 足够 |
| verify 分层、Hard/Soft 边界 | ✅ 足够 |
| Monitor / Watchdog / control | ✅ 足够 |
| KPI 与 report 数据源 | ✅ 足够 |
| 提示词工程、checkpoint/reset | ✅ [prompt-engineering.md](./prompt-engineering.md)、[checkpoint-and-reset.md](./checkpoint-and-reset.md) |
| 共享库、env、夹具映射 | ✅ 本文 §2–§3、§5–§7 |
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

# 提示词与 reset（见 prompt-engineering.md / checkpoint-and-reset.md）
lib/build-prompt.sh    # 分层拼接 → invocation-*.prompt.txt + manifest
lib/build-dossier.sh   # attemptKind=step-retry 时组装 dossier
lib/capture-attempt.sh # git reset 前捕获 diff / verify 指针 → attempt-history.jsonl
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

## 4. 提示词与 checkpoint（专文）

- **提示词分层、attemptKind、组装管线、dossier** → [prompt-engineering.md](./prompt-engineering.md)
- **git reset 前 capture、artifact 保留、parentCommit 规则** → [checkpoint-and-reset.md](./checkpoint-and-reset.md)

实现 `run-step.sh` 时必须先打通：`build-prompt.sh` + `capture-attempt.sh` + `build-dossier.sh`。

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

## 6. verify 脚本拆分

| 脚本 | 从 `verify.sh` 拆出 | 时机 |
|---|---|---|
| `verify-step.sh` | T0–T3 only；**不跑** npm test / 727 | step 末 |
| `verify-phase.sh` | 原 `verify.sh` §1–5 全量；加 `--phase` | phase 末 |

**复用**：`verify-phase.sh` 可 `source` 或调用现有 `verify.sh "$WT" "$PH"` 不变；`verify-step.sh` 为新增薄包装。

phase 末 KPI（利用率）在 `verify-phase.sh` 成功后由 `run-phase.sh` 调用 `judge/usage-kpi.ts` 追加 `stats.jsonl` scope=phase-kpi。

---

## 7. models.txt run4 变更

相对当前 `orchestration/round2/models.txt`：

1. **删除** `devstral2` 行（round2 三次 P0 失败）
2. **改 runner**：`composer25`、`grokbuild` 从 `grok` → `opencode`（xai 路由）
3. 其余行不变；`SERIAL_PROVIDERS` 可去掉 `grok`（若无一 grok runner）

建议另存 `models-run4.txt` 或直接在 master 更新并注释「run4 起用」。

---

## 8. Stub 预写死流程

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

## 9. Foundation 重切检查清单

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

## 10. v2 脚本迁移

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

## 11. Pilot 流程（实现后首次真跑）

**模型**：仅用 **minimax-m3**（`orchestration/round2/models-pilot.txt`），成本低、opencode 路由稳定，足够验证 harness 机制。

```bash
# models-pilot.txt 仅一行 minimax-m3
PILOT_PHASES=p0 MAX_PAR=1 \
  orchestration/round2/harness/launch.sh orchestration/round2/models-pilot.txt
```

验收项（pilot 必须通过再开全量）：

| 项 | 验证方式 |
|---|---|
| 分层 prompt | 检查 `invocation-*.prompt.txt` + `prompt-manifest.json` |
| invocation-retry | 人为触发 idle，确认续 session + F-lite dossier |
| step-retry + reset | 人为让 verify-step 失败，确认 `capture-attempt`、git 回到 parentCommit、**log/jsonl 仍在**、下一 prompt 含 diff excerpt |
| pause/resume | `touch PAUSE` 后续跑 |
| monitor / watchdog | `monitor.sh watch` 可读；stall 可 kill 并留痕 |

通过后：`models-run4.txt` 全量模型 + 全 phase 链。

---

## 12. 实现顺序（与 README 一致）

1. `lib/events.sh` + jsonl 写入
2. `lib/build-prompt.sh` + `lib/capture-attempt.sh` + `lib/build-dossier.sh`
3. `verify-step.sh` + `smoke-apply.ts`
4. `run-step.sh`（串联 prompt + verify + checkpoint/reset）
5. `run-phase.sh` + `verify-phase.sh`
6. 改造 `run-all.sh` / `launch.sh`
7. `watchdog.sh` 费用 + `monitor.sh`
8. `report.sh` v3
9. 瘦身 `prompts/phases/*.md`（从现有 p0–p3 迁移）
10. `bootstrap-stubs.ts` + foundation 重切
11. pilot（minimax-m3）→ full run4