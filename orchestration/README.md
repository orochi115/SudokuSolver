# Orchestration（编排区 —— 仅供编排者使用）

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
MAX_PAR=4 RETRIES=3 orchestration/run-all.sh
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
   MAX_PAR=2 orchestration/run-all.sh orchestration/models-trial.txt
   ```
2. 看 `reports/questions.md` —— 模型在 headless 中把疑问写进各自 `QUESTIONS.md`,已汇总于此(它们**不会卡住**,而是带着假设继续)。
3. **预先答复**:把这些疑问在**基础文档**里答好(改 `foundation` 上的 `docs/requirements.md` 或 `docs/milestones/M2.md`、`M3.md`,并补充 `naked-single.ts` 之外的约定)。worker 下次会 fork 到更新后的 foundation。
4. **正式跑**:`orchestration/run-all.sh`(全清单)。

## 机制要点
- **自主化条款**由 `run-model.sh` 在 headless 时自动追加("自主完成、勿提问、疑问写 QUESTIONS.md"),
  故 `prompts/*.md` 保持中性,也能手动交互用。
- `--dangerously-skip-permissions` 免除写文件/跑测试的权限弹窗(headless 主要阻塞)。
- 提问不卡死:`run` 单发,问题只进输出/QUESTIONS.md;重试用 `-c` 续接会话喂回 verify 结果。
- **超时保护**:每次 opencode 尝试受 `TIMEOUT` 秒限制(默认 1800),挂起的模型会被杀掉并判 FAIL,
  不会阻塞整个 fleet,只是安全网。
- **按-provider 限并发**:总并发 ≤ `MAX_PAR`;`SERIAL_PROVIDERS`(默认 `amazon-bedrock`)里的
  provider 同时最多 `SERIAL_CAP`(默认 1)个,其余 provider 仅受 `MAX_PAR` 限。
  这样 Bedrock 串行避免限流,非 Bedrock 仍并行——比一刀切降 `MAX_PAR` 更快。
- **验收闸门只要求"有效且健全"**:typecheck + test 通过 + **健全性 0 violation**。
  解出率/策略数/成本**只收集、不 gate**——各模型跑到尽力,事后比数字。健全性是硬要求
  (不健全的解出率可被非法消除刷高,无可比性)。想额外 gate 可设 `MIN_EASY` 等环境变量(默认关)。
- **成本统计**:每个里程碑会用 `opencode export` 汇总该会话的 token cost,写入
  `sudoku-wt/logs/<名>/<里程碑>.cost.json`,并汇入 `reports/summary.md`。
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

## 清理 worktree
```bash
# 默认:删掉 ../sudoku-wt/* 工作目录,但保留 model/<名> 分支及其提交(结果不丢)
orchestration/cleanup.sh
# 彻底清理:连分支、日志、生成的 reports 一起删(确认已取走所需结果后再用)
orchestration/cleanup.sh --purge
# 也可指定清单(例如只清试运行的两个)
orchestration/cleanup.sh orchestration/models-trial.txt
```
- 因为每个里程碑都已自动提交,worktree 无未保存改动,`git worktree remove --force` 可安全移除。
- 默认保留分支 = 你随时能 `git checkout model/<名>` 回看某模型的成果;`--purge` 才会删分支。
