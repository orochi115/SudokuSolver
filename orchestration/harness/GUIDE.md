# 多模型横评 · 方法与复现指南

> 本文是这套"用同一个编码任务横评多个大模型"流程的**总入口**。
> 命令/flag 速查见 [`README.md`](./README.md);评分协议见 [`model-comparison.md`](./model-comparison.md);
> 结果见 [`report-final.md`](./report-final.md)。新来者读本文即可复现或加测新模型。

---

## 1. 这套流程在测什么

给每个模型**完全相同的编码任务**(在一个数独求解引擎地基上,实现一整套人类解题策略),
然后**客观地比较实现质量**。核心理念三条:

- **固定范围**:所有模型必须实现同一套策略 id(`required-ids/`)。"没实现某策略"=能力不足,而非"没被要求"——否则结果会随采样温度漂移,不公平。
- **健全性是硬门槛**:解题器不得用非法消除"作弊"(0 soundness violation)。不健全的解出率可被刷高,毫无可比性。
- **质量只收集、不设门槛**:解出率/成本/耗时只统计,不卡阈值。大家都实现同一范围后,这些数字**纯粹反映实现质量**。

> 衡量"质量"的主指标是 **diabolical 解出率**(最难档),因为合格实现普遍能解 easy/medium/hard。

---

## 2. 整体组织(分支与角色)

```
master        手动主干(需求文档 + puzzles via LFS),实验期间不动
foundation    共享冻结地基:引擎 + 测试 + 冻结标准答案集 + 任务文档。★worker 从这里分叉
orchestration 私有编排区:脚本、提示词、评分、报告、日志归档(worker 永不分叉到这里)
model/<短名>  某模型的工作分支(从 foundation 出),跑完归档
archive/*     历史归档:final/(最终结果)、fail/(失败尝试)、run1·run2·trial/(早期)
```

两条关键设计:

1. **foundation 对 worker"无对比意识"**:foundation 上的代码注释与文档**不提任何"对比/其他模型/评分"**字样。
   评分逻辑、提示词、required-ids 全在 `orchestration`(worker 看不到),避免模型因"知道在被对比"而改变行为。
2. **共享地基 + 策略接缝**:foundation 提供盘面模型、求解循环、`SolveTrace` 契约、暴力校验(标准答案)、
   健全性校验,以及 `Strategy` 接口和一个参考策略(naked-single)。模型只在 `strategies/` 下按接口加实现。
   这样所有模型在**同一接缝**上竞争,引擎/UI/评分都不变。详见 foundation 的 `docs/`。

---

## 3. 端到端生命周期

| 阶段 | 做什么 | 涉及文件 |
|---|---|---|
| ① 配置 | 列出要测的模型 | `models.txt`(`provider/model 短名`) |
| ② 扇出调度 | 每模型一个 git worktree(从 foundation),按 provider 限并发 | `run-all.sh` |
| ③ 跑里程碑 | 注入提示词 + 必需 id 清单,headless 跑 opencode;M2 通过才跑 M3 | `run-model.sh`、`prompts/`、`required-ids/` |
| ④ 验收闸门 | typecheck + 单测 + 裁判(健全性 + 必需 id 齐全);失败带反馈**重试**(续接同一 session) | `verify.sh`、`judge/verify-engine.ts` |
| ⑤ 提交 + 度量 | 每里程碑自动提交到 `model/<名>`;从日志 `step_finish` 汇总 cost/tokens/耗时 | `run-model.sh`、`metrics.mjs` |
| ⑥ 报告 | 生成环境 + 结果表(解出率 %、相同列省略)+ 工具使用 + 失败 + 复现 | `gen-report.mjs` → `report-final.md` |
| ⑦ 归档清理 | **一键**:日志打包进 LFS + `model/*` → `archive/<tag>/*` + 删 worktree | `archive-run.sh <tag>`(`cleanup.sh` 仅删除/不归档) |

判据(`verify.sh`):**有效**(typecheck/test 绿) + **健全**(0 violation) + **范围齐全**(注册了 `required-ids/<ms>.txt` 全部 id)。
解出率不卡门槛。失败 → 把失败原因(缺失 id / 违例数 / 编译错误)喂回**同一会话**重试,最多 `RETRIES` 次。

---

## 4. 后期处理(post-processing)

- **度量(`metrics.mjs`)**:从每次 attempt 的 JSON 日志里累加 `step_finish` 事件 → cost、token、步数、
  `activeSec`(首末事件时间差≈模型工作时长)。**不依赖 `opencode export`**(它对大会话在 128KB 截断)。
  单次尝试的 activeSec 是纯模型时间;多次尝试会含尝试间的 verify 间隙。
- **报告(`gen-report.mjs`)**:跑裁判取解出率 + 读 metrics + 从日志解析每模型的工具/技能使用,
  产出 `report-final.md`:环境表、结果表(解出率 %、**所有模型取值相同的列自动省略并注明**)、
  工具/技能使用、失败清单、复现步骤。换模型重跑后一键再生。
- **归档 + 清理(已脚本化)**:`archive-run.sh <tag>` 一键完成——提交 worktree WIP → 把
  `sudoku-wt/logs` + `reports` 打包成 `run-logs/run-<tag>-<date>.tar.gz`(Git LFS)并提交 →
  删 worktree → `model/<名>` 重命名为 `archive/<tag>/<名>`(归档,非删除)→ 清理 reports 工作文件。
  **不可逆删除一律没有**:代码留在分支、日志留在 LFS。例:`orchestration/harness/archive-run.sh final`。
  - 模型实现 = git 分支(`archive/<tag>/*`),代码本身就是记录。
  - 原始 transcript/日志体积大,**不进 git 历史**,而是 LFS 存 tar.gz;小巧运行快照(summary +
    metrics + notes)由 `report.sh` 提交于 `reports/archive/<时间戳>/`。
- **纯删除(`cleanup.sh`)**:只想删不想归档时用——删 worktree(默认保留分支);`--purge` 连分支/日志/reports 一起删。

---

## 5. 加测一个新模型(分步)

1. **确认模型 id 存在**:`opencode models <provider> | grep '<provider>/<model>'`。
2. **连通性自测**(强烈建议,避免浪费一整轮):
   ```bash
   opencode run -m '<provider>/<model>' --format json "Reply with exactly: OK"
   ```
   秒回即可用;长时间无输出 = 该 provider/模型有问题(未激活/限流/未授权),先解决。
3. **加进清单**:在 `models.txt` 写一行 `<provider>/<model>  <分支安全短名>`。
   - 若该 provider 多个模型共用一把 key(易限流),把它加进 `SERIAL_PROVIDERS`(默认已含 `amazon-bedrock alibaba-cn`)。
4. **跑**(单测可只放它一行到一个小清单):
   ```bash
   TIMEOUT=3600 MAX_PAR=2 orchestration/harness/run-all.sh orchestration/round1/models-trial.txt
   ```
5. **看结果**:`node orchestration/harness/gen-report.mjs orchestration/round1/models.txt` → `report-final.md`。
6. **解读**:FAIL+违例>0 = 不健全(无效);PASS 但解出率低 = 能力弱;PASS 且 diabolical 高 = 强。

> 复现整轮:配好凭据 + `git lfs pull` → `TIMEOUT=3600 MAX_PAR=4 orchestration/harness/run-all.sh` → `gen-report.mjs`。

---

## 6. 解读口径(scoring)

- **先看健全性**:`viol > 0` 的行,其解出率作废(靠非法消除刷出来的)。
- **再看 PASS/FAIL**:PASS = 有效 + 健全 + 范围齐全;**PASS ≠ 质量好**(可能是能跑通但解不动的空壳)。
- **质量排序**:按 diabolical 解出率(必要时 hard 作次级)。
- **效率**:cost(美元;订阅制 provider 可能为 0,但 token 仍记)与 activeSec(模型工作时长)。
- 详细维度与防过拟合(holdout 集)见 `model-comparison.md`。

---

## 7. 经验教训 / 坑(务必先读)

这些都是实跑踩出来的,直接影响成败:

- **`opencode run` 不一定在模型说完后退出**:某些 provider 它会"挂着"。早期 watchdog 只能等到硬超时,
  导致每次尝试和里程碑之间硬等 `TIMEOUT`。现已改为**空闲检测**(`IDLE` 秒无新日志即判完成并停止),硬超时只作上限。
- **共享 key 的 provider 会限流**:多个 Bedrock/alibaba-cn 模型并发会排队甚至长时间停滞(opus 曾停滞 40min)。
  调度器**按 provider 限并发**(`SERIAL_PROVIDERS`@`SERIAL_CAP`)。**能直连就别走 Bedrock**(其 opus 长会话易停滞)。
- **`opencode export` 在 128KB 处截断**:大会话取不到完整 cost → 改为从日志 `step_finish` 自己累加。
- **只卡健全性的闸门会放过空跑**:模型啥都没干也"通过"(baseline 本就健全)。→ 必须**固定范围**(required-ids),
  缺策略即重试。这也是公平性的关键。
- **提示词绝不能提"对比/其他模型/评分"**:会影响 worker 行为。保持 comparison-blind。
- **多次尝试是连续的**:重试用 `--session <id>` 续接同一会话(模型保留上下文 + worktree 代码),不是重开;成本统计含全部尝试。
- **订阅制 provider 的 cost 显示为 0**(按量计费才有美元数);token 始终有记录。
- **不要在运行中编辑正在执行的脚本**:bash 按字节偏移读脚本,改动会让运行中的进程错乱。先停再改。
- **soundness gate 抓作弊很关键**:qwen3-coder(flash 与 plus)反复用非法消除伪造高解出率,全被门槛挡下。

---

## 8. 文件地图

| 文件 | 作用 |
|---|---|
| `models.txt` / `models-trial.txt` / `models-rerun.txt` | 模型清单 |
| `run-all.sh` | 扇出调度(按 provider 限并发 + 门控链 + 报告) |
| `run-model.sh` | 单(模型,里程碑):worktree + 注入提示 + 空闲检测 + 重试 + 提交 + 度量 |
| `verify.sh` + `judge/verify-engine.ts` | 验收闸门(有效 + 健全 + 范围) |
| `prompts/m2.md`…`m5.md` | worker 任务提示词(comparison-blind) |
| `required-ids/m2.txt` `m3.txt` | 各里程碑必需策略 id(单一事实源) |
| `metrics.mjs` | 从日志算 cost/tokens/耗时 |
| `gen-report.mjs` | 生成 `report-final.md` |
| `report.sh` | 即时汇总 + 可提交快照 |
| `archive-run.sh <tag>` | **一键归档+清理**:日志→LFS、`model/*`→`archive/<tag>/*`、删 worktree |
| `cleanup.sh` | 纯删除 worktree(`--purge` 连分支/日志/reports) |
| `run-logs/*.tar.gz` | 打包的原始日志(Git LFS) |

> 注:LFS 对象默认在本地;push 到远程需远程启用 LFS(并留意存储配额)。
