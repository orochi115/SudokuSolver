# Orchestration（编排区 —— 仅供编排者使用）

> ⚠️ 本目录只存在于 `orchestration` 分支,**不在 `foundation` 上**。
> worker 模型从 `foundation` 分叉,看不到这里的内容,避免被"正在被对比/评分"的信息误导。

本目录是你(编排者)驱动多模型实验的工具箱:
- `model-comparison.md` —— 横评协议:如何公平组织对比、评分维度、防过拟合。
- `prompts/` —— 按里程碑准备好的 worker 提示词,创建分支后依次粘贴执行。
- `run-model.sh` —— 半自动驱动:worktree 隔离 + `opencode run`(免权限)+ 自动 verify + 有界重试。
- `verify.sh` —— 验收闸门:typecheck + test + judge(引擎健全性 + 解出率)。
- `judge/verify-engine.ts` —— 裁判脚本:对冻结 `data/ground-truth/` 跑引擎,**任何健全性 violation 即判失败**。

## 半自动驱动(opencode,推荐)
```bash
# 一个模型跑一个里程碑(从 foundation 分叉出 model/<name> 的 worktree)
orchestration/run-model.sh anthropic/claude-opus-4-8 opus orchestration/prompts/m2.md
orchestration/run-model.sh google/gemini-2.5-pro     gem  orchestration/prompts/m2.md
# 通过验收后,人工看一眼 diff,再推进下一里程碑(对同一 worktree):
orchestration/run-model.sh anthropic/claude-opus-4-8 opus orchestration/prompts/m3.md
```
- **自主化条款**由 `run-model.sh` 在 headless 运行时**自动追加**到提示词("自主完成、勿提问"),
  因此 `prompts/*.md` 本身保持中性,既可被脚本用、也可手动交互用。
- `--dangerously-skip-permissions` 免除写文件/跑测试的权限弹窗(headless 的主要阻塞)。
- 提问不会卡死:`run` 是单发模式,问题只进输出;重试时用 `-c` 续接同一会话喂回 verify 结果。
- **前提**:对应 provider/model 已在 opencode 配好凭据;`git lfs pull` 已拉到谜题。
- 基线参考(仅 naked-single 时):easy 54% / medium 14% / hard 0% / diabolical 0%,0 violation。

## 手动流程(备选)
1. `git checkout -b model/<name> foundation`
2. 把 `prompts/m2.md` 粘给该模型执行;`orchestration/verify.sh <worktree>` 验收;再粘 `m3.md`…
3. 评分:见 `model-comparison.md`。可对公开集 + 一个不提交的 holdout 集分别打分。

## 关于 prompts 的设计
提示词只描述"要做什么"(实现 MX 的策略、遵守契约、跑绿测试),
**不含任何"你在被对比/评分"的措辞**,以免影响 worker 行为。评分逻辑只在本目录、由你掌握。
