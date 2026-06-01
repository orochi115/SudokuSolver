# Orchestration（编排区 —— 仅供编排者使用）

> ⚠️ 本目录只存在于 `orchestration` 分支,**不在 `foundation` 上**。
> worker 模型从 `foundation` 分叉,看不到这里的内容,避免被"正在被对比/评分"的信息误导。

本目录是你(编排者)驱动多模型实验的工具箱:
- `model-comparison.md` —— 横评协议:如何公平组织对比、评分维度、防过拟合。
- `prompts/` —— 按里程碑准备好的 worker 提示词,创建分支后依次粘贴执行。

## 实验流程速览
1. 为某模型建分支(从干净的 foundation 分叉):
   ```bash
   git checkout -b model/<name> foundation
   ```
2. 把 `prompts/m2.md` 粘给该模型执行;通过验收后,再粘 `prompts/m3.md`,以此类推。
3. 评分:见 `model-comparison.md`。可对公开集 + 一个不提交的 holdout 集分别打分。

## 关于 prompts 的设计
提示词只描述"要做什么"(实现 MX 的策略、遵守契约、跑绿测试),
**不含任何"你在被对比/评分"的措辞**,以免影响 worker 行为。评分逻辑只在本目录、由你掌握。
