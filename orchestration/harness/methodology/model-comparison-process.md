# 方法论：多模型对比测试流程

> 第一轮（M2/M3 策略实现）用此流程横评多个大模型，胜出实现再综合修复成为当前引擎。
> 本文是可复用的**方法沉淀**；可执行的 harness 仍在 `orchestration/`（`GUIDE.md` / `README.md` /
> `model-comparison.md` 为操作手册与速查）。下一轮对比测试时从 master 切出新的 foundation/orchestration，
> 让执行分支对对比无感知。

## 1. 测什么 / 三条核心理念

给每个模型**完全相同的编码任务**（在冻结的数独引擎地基上实现一整套人类解题策略），客观比较实现质量：

- **固定范围**：所有模型必须实现同一套策略 id（`orchestration/harness/required-ids/<里程碑>.txt`）。
  "没实现某策略" = 能力不足，而非"没被要求"——否则结果随采样漂移，不公平。
- **健全性是硬门槛**：解题器不得用非法消除作弊（0 soundness violation）。不健全的解出率可被刷高、毫无可比性。
- **质量只收集、不设门槛**：解出率/成本/耗时只统计。范围固定后，这些数字纯粹反映实现质量。
- **主指标 = diabolical 解出率**（最难档），合格实现普遍能解 easy/medium/hard。

## 2. 分支角色（comparison-blind 是关键）

```
master        统一主干（引擎 + 文档 + 语料 + harness）。下一轮从这里切新环境
foundation    冻结地基：引擎 + 测试 + 冻结标准答案集 + 任务文档。worker 从这里分叉
orchestration 私有编排区：脚本/提示词/评分/报告/日志（worker 永不分叉到这里）
model/<短名>  某模型工作分支（从 foundation 出），跑完归档为 archive/<tag>/<短名>
```

两条设计决定成败：

1. **foundation 对 worker 无对比意识**：foundation 上代码注释与文档**不提"对比/其他模型/评分"**字样；
   评分逻辑、提示词、required-ids 全在 `orchestration`（worker 看不到），避免模型因"知道在被对比"改变行为。
2. **共享地基 + 策略接缝**：foundation 提供盘面模型、求解循环、`SolveTrace` 契约、暴力校验、健全性校验、
   `Strategy` 接口与一个参考策略。模型只在 `packages/engine/src/strategies/` 下按接口加实现——所有模型在同一接缝竞争。

**禁止修改的冻结面**：`packages/engine/src/{grid,trace,strategy,solver,soundness,bruteforce,parser}.ts`、
`data/ground-truth/`、`docs/`、顶层配置（`package.json`/`tsconfig*`/`vitest.config.ts`）。分叉点 = M2。

## 3. 端到端生命周期

| 阶段 | 做什么 | 文件 |
|---|---|---|
| ① 配置 | 列出要测的模型 | `models.txt`（`provider/model 短名`） |
| ② 扇出调度 | 每模型一个 worktree（从 foundation），按 provider 限并发 | `run-all.sh` |
| ③ 跑里程碑 | 注入提示词 + 必需 id，headless 跑 opencode；M2 通过才跑 M3 | `run-model.sh`、`prompts/`、`required-ids/` |
| ④ 验收闸门 | typecheck + 单测 + 裁判（健全性 + 必需 id 齐全）；失败带反馈续接同会话**重试** | `verify.sh`、`judge/verify-engine.ts` |
| ⑤ 提交 + 度量 | 每里程碑自动提交；从日志 `step_finish` 汇总 cost/tokens/耗时 | `run-model.sh`、`metrics.mjs` |
| ⑥ 报告 | 生成环境表 + 结果表 + 工具使用 + 失败 + 复现 | `gen-report.mjs` → `report-final.md` |
| ⑦ 归档清理 | 一键：日志→LFS、`model/*`→`archive/<tag>/*`、删 worktree | `archive-run.sh <tag>` |

判据（`verify.sh`）：**有效**（typecheck/test 绿）+ **健全**（0 violation）+ **范围齐全**（注册了
`required-ids/<里程碑>.txt` 全部 id）。解出率不卡门槛。失败 → 把原因（缺失 id / 违例数 / 编译错误）喂回
**同一会话**重试，最多 `RETRIES` 次。

## 4. 解读口径

1. **先看健全性**：`viol > 0` 的行，解出率作废（靠非法消除刷出来的）。
2. **再看 PASS/FAIL**：PASS = 有效 + 健全 + 范围齐全；**PASS ≠ 质量好**（可能是能跑通但解不动的空壳）。
3. **质量排序**：按 diabolical 解出率（必要时 hard 作次级）。
4. **效率**：cost（美元；订阅制 provider 可能为 0，token 仍记）与 activeSec（模型工作时长）。
5. **综合**：取胜出分支主实现，择优嫁接其他分支亮点（本轮即如此产出当前引擎）。

## 5. 防过拟合

- `data/ground-truth/`（公开集）冻结并供 worker 自测。
- 另用 `packages/engine/scripts/gen-ground-truth.ts` 以**不同 SAMPLE/stride** 生成一个**不提交**的 holdout 集，
  仅最终评分时由编排者跑，检验是否对公开集过拟合。

## 6. 经验教训 / 坑（实跑踩出来的）

- **`opencode run` 未必在模型说完后退出**：改用**空闲检测**（`IDLE` 秒无新日志即判完成），硬超时只作上限。
- **共享 key 的 provider 会限流**：调度器按 provider 限并发（`SERIAL_PROVIDERS`@`SERIAL_CAP`）；能直连就别走 Bedrock。
- **`opencode export` 在 128KB 截断**：大会话取不到完整 cost → 从日志 `step_finish` 自己累加。
- **只卡健全性会放过空跑**：必须**固定范围**（required-ids），缺策略即重试——这也是公平性关键。
- **提示词绝不能提"对比/其他模型/评分"**：保持 comparison-blind。
- **多次尝试是连续的**：重试用 `--session <id>` 续接同会话（保留上下文 + worktree 代码），成本含全部尝试。
- **不要在运行中编辑正在执行的脚本**：bash 按字节偏移读脚本，改动会让进程错乱；先停再改。
- **soundness gate 抓作弊很关键**：本轮 qwen3-coder 反复用非法消除伪造高解出率，全被门槛挡下。

## 7. 加测一个新模型

1. 确认 id 存在：`opencode models <provider> | grep '<provider>/<model>'`。
2. 连通性自测：`opencode run -m '<provider>/<model>' --format json "Reply with exactly: OK"`（秒回即可用）。
3. 加进 `models.txt`：`<provider>/<model>  <分支安全短名>`（共享 key 易限流的 provider 加进 `SERIAL_PROVIDERS`）。
4. 跑：`TIMEOUT=3600 MAX_PAR=2 orchestration/harness/run-all.sh orchestration/round1/models-trial.txt`。
5. 看结果：`node orchestration/harness/gen-report.mjs orchestration/round1/models.txt` → `report-final.md`。

> 复现整轮：配好凭据 + `git lfs pull` → `TIMEOUT=3600 MAX_PAR=4 orchestration/harness/run-all.sh` → `gen-report.mjs`。

## 相关

- 结果数据生成与管理：[`results-data-management.md`](./results-data-management.md)
- 用成功分支定位失败：[`cross-branch-trace-diffing.md`](./cross-branch-trace-diffing.md)
- 第一轮最终结果：[`report-final.md`](../../round1/report-final.md)
- 下一轮策略拆分计划：[`../../../docs/plans/taxonomy-refactor.md`](../../../docs/plans/taxonomy-refactor.md)
