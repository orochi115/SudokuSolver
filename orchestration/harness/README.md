# Orchestration（编排区 —— 仅供编排者使用）

> 📖 **新来者从 [`GUIDE.md`](./GUIDE.md) 开始** —— 方法论、端到端流程、加测新模型的步骤与经验教训。
> 本 README 是命令/机制速查;评分协议见 [`model-comparison.md`](./model-comparison.md);结果见 [`report-final.md`](./report-final.md)。

> ⚠️ 本目录只存在于 `orchestration` 分支,**不在 `foundation` 上**。
> worker 模型从 `foundation` 分叉,看不到这里的内容,避免被"正在被对比/评分"的信息误导。

本目录是你(编排者)驱动多模型实验的工具箱:
- `models.txt` —— 横评模型清单(`provider/model 短名`)。
- `prompts/` —— 里程碑 worker 提示词(中性,不含被评分措辞)。
- `run-all.sh` —— **全自动扇出**:对清单里每个模型并行跑 M2→M3(各阶段带验收闸门 + 重试)。
- `run-model.sh` —— 单(模型,里程碑)驱动:worktree 隔离 + `opencode run`(免权限)+ verify + 有界重试。
- `verify.sh` —— 验收闸门:typecheck + test + judge(引擎健全性 + 解出率)。
- `judge/verify-engine.ts` —— 裁判:对冻结 `data/ground-truth/` 跑引擎,**任何健全性 violation 即判失败**。
- `report.sh` —— 汇总各 worktree → `reports/summary.md`(状态/解出率/产出文档)+ `reports/questions.md`。
- `model-comparison.md` —— 横评协议:评分维度、防过拟合。

## 全自动扇出(本期:仅 M2、M3)
```bash
# 并行跑完 models.txt 里所有模型的 M2→M3,结束后自动出报告
MAX_PAR=4 RETRIES=3 orchestration/harness/run-all.sh
# 看结果与模型提问
cat orchestration/reports/summary.md
cat orchestration/reports/questions.md
```
- 每个模型一个 worktree(`../sudoku-wt/<短名>`,从 `foundation` 分叉),互不干扰、可并行。
- **M3 仅在 M2 通过闸门后才跑**(门控链,避免错误累积);M2 失败则 M3 标记 SKIP。
- 跑完根据 `summary.md` 决定后续是否继续 M4/M5。

## 推荐的"先试运行,再正式跑"节奏
1. **试运行**:用一个小清单先跑 1~2 个模型(复制 `models.txt` 为 `models-trial.txt` 只留两行):
   ```bash
   MAX_PAR=2 orchestration/harness/run-all.sh orchestration/round1/models-trial.txt
   ```
2. 看 `reports/questions.md` —— 模型在 headless 中把疑问写进各自 `QUESTIONS.md`,已汇总于此(它们**不会卡住**,而是带着假设继续)。
3. **预先答复**:把这些疑问在**基础文档**里答好(改 `foundation` 上的 `docs/requirements.md` 或 `docs/milestones/M2.md`、`M3.md`,并补充 `naked-single.ts` 之外的约定)。worker 下次会 fork 到更新后的 foundation。
4. **正式跑**:`orchestration/harness/run-all.sh`(全清单)。

## 机制要点
- **自主化条款**由 `run-model.sh` 在 headless 时自动追加("自主完成、勿提问、疑问写 QUESTIONS.md"),
  故 `prompts/*.md` 保持中性,也能手动交互用。
- `--dangerously-skip-permissions` 免除写文件/跑测试的权限弹窗(headless 主要阻塞)。
- 提问不卡死:`run` 单发,问题只进输出/QUESTIONS.md;重试用 `-c` 续接会话喂回 verify 结果。
- **超时保护**:每次 opencode 尝试受 `TIMEOUT` 秒限制(默认 1800),挂起的模型会被杀掉并判 FAIL,
  不会阻塞整个 fleet,只是安全网。
- **按-provider 限并发**:总并发 ≤ `MAX_PAR`;`SERIAL_PROVIDERS`(默认 `amazon-bedrock alibaba-cn`)里的
  provider 同时最多 `SERIAL_CAP`(默认 1)个,其余 provider 仅受 `MAX_PAR` 限。
  当前清单全走直连 provider;`alibaba-cn` 的 5 个模型共用一个 DashScope key,故默认串行以防限流,
  其它 provider 仍并行。无需串行时 `SERIAL_PROVIDERS="" ...` 关闭。
- **验收闸门 = 有效 + 健全 + 固定范围**:typecheck + test 通过、**健全性 0 violation**、
  且**注册了该里程碑全部必需策略 id**(`orchestration/harness/required-ids/<ms>.txt`,所有模型同一范围)。
  缺任何 id 都会被退回**重试**;反馈里会列出缺失项。`run-model.sh` 把该清单注入提示词。
  - **解出率只收集、不 gate**——所有模型实现同一范围,差异就纯粹反映**实现质量**(你的选择)。
  - "固定范围"解决了公平性:模型缺某技巧 = 实现不出(能力),而非"没被要求"(否则结果会随温度漂)。
  - 想额外加解出率门槛可设 `MIN_EASY` 等环境变量(默认关)。
  - 取舍:必需清单含 `forcing-chain`/`als` 等最难项,弱模型可能多次重试后仍 FAIL——这正是能力信号;
    报告会记下其部分成果、解出率与缺失 id。若太严可裁剪 `required-ids/*.txt`。
- **成本 + 运行时**:每个里程碑汇总各 attempt 日志的 `step_finish` 事件,得到 cost / tokens /
  步数 / `activeSec`(模型工作时长),写入 `sudoku-wt/logs/<名>/<里程碑>.metrics.json`,汇入 `reports/summary.md`。
  (不用 `opencode export`——它对大会话在 128KB 处截断。)
- **前提**:`models.txt` 里每个 provider/model 已在 opencode 配好凭据;`git lfs pull` 已拉到谜题。
- 基线参考(仅 naked-single 时):easy 54% / medium 14% / hard 0% / diabolical 0%,0 violation。
- 评分逻辑只在本目录、由你掌握;worker 看不到。详见 `model-comparison.md`。
- worker 日志现为 JSON 事件流(`--format json`,用于抓 session id 算成本),仍可逐条阅读。

## 提交行为
- **每个里程碑跑完会自动提交**到该模型的 `model/<短名>` 分支(`run-model.sh` 里的 `commit_milestone`),
  提交信息形如 `model/sonnet46: m2 PASS (1 attempt(s)) [<model>]`。**无论 worker 自己有没有提交**,
  分支都会停在干净、带状态标签的状态,便于看 diff 与复盘。
- 这些提交在各自 worktree 的 `model/<短名>` 分支上,**不影响 `foundation` / `master` / `orchestration`**。

## 日志与排查
所有日志写文件(便于事后排查),位置:
- `sudoku-wt/logs/<名>/<ms>-attempt-N.log` —— 每次 opencode 的原始输出(JSON 事件流,含模型每一步)。
- `sudoku-wt/logs/<名>/pipeline.log` —— 该模型整条流水线(里程碑标记 + verify 输出 + 异常 notes)。
- `sudoku-wt/logs/<名>/<ms>.notes` —— **异常记录**:resume 了历史状态、opencode 超时/非零退出、没抓到 session 等。
- `sudoku-wt/logs/<名>/<ms>.cost.json` —— 该里程碑 token cost。
- `orchestration/reports/scheduler.log` —— 调度器的启动顺序/时间。
- `orchestration/reports/summary.md` / `questions.md` —— 跑完的汇总(含 ⚠️ 异常记录)。

**模型自身的原始输出(transcript)**保留在磁盘 `sudoku-wt/logs/`,**不提交进 git**(太大)。
模型的实质产出(代码 + `docs/notes/mX.md`)提交在各自 `model/<名>` 分支;
一份**小而可提交的运行记录**(summary + questions + 各模型 cost/notes)由 report 写入
`orchestration/reports/archive/<时间戳>/`,**这个目录可被 git 跟踪**——`git add` 后提交到 orchestration 即留档。

## 重跑 / 恢复语义
- 中断后再跑 `run-all.sh`:若某模型的 `model/<名>` 分支/worktree 仍在,脚本会**在其上继续(resume)**,
  并在 notes 里记一条 `PRE-EXISTING ... RESUMING`。**想要干净重跑**:先 `cleanup.sh --purge`。
- 单个模型失败/超时/卡住**不会阻塞其它模型**:调度器后台跑各模型、按存活态回收槽位,
  每次尝试还有 `TIMEOUT` 上限兜底。失败的里程碑会提交(带 FAIL 标签)并记录,便于排查。

## 归档与清理

跑完一轮、要保留成果并清干净工作区,用 **`archive-run.sh <tag>`**(一键归档,不删任何东西):
```bash
orchestration/harness/archive-run.sh final
# 1) 提交 worktree WIP  2) 日志+reports 打包成 run-logs/run-final-<date>.tar.gz(Git LFS)并提交
# 3) 删 worktree  4) model/<名> -> archive/round1/final/<名>  5) 清 reports 工作文件
```
代码留在 `archive/round1/final/*` 分支、日志留在 LFS,**无不可逆删除**。

只想删、不归档时用 `cleanup.sh`:
```bash
orchestration/harness/cleanup.sh           # 删 worktree,保留 model/<名> 分支
orchestration/harness/cleanup.sh --purge   # 连分支/日志/reports 一起删(确认已取走结果后再用)
```
- 每个里程碑都已自动提交,worktree 无未保存改动,移除安全。
- LFS 对象默认在本地;push 远程需远程启用 LFS。
