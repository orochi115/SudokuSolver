# Round-2 对比测试（占位）

> **状态：占位。** 第二轮多模型对比测试尚未开始；详细规划待 Roadmap ①（taxonomy 重构）与 ② 推进、且 727 聚类结果明确后再定。本文件先记录意图与方法骨架，避免散落。

## 目的

不是再给模型排名，而是**为剩余的 diabolical 失败题生成独立的人类可解策略假设**——用对比测试这套机制探索"还缺哪些策略族"。目标集与聚类来自工程侧的 `docs/plans/diabolical-727.md`（基于 `data/failing-diabolical/` 的 727 题）。

## 方法骨架（迁自第一轮 regression 计划的 Phase 5）

仅在聚类已提示候选策略族之后启用：

- `foundation` 保持稳定，除非需求需要澄清。
- 写一份新的分析提示词，聚焦"解释某一个 stuck 盘面并提出人类可解策略"。
- 用 2–4 个强模型跑同一批聚类代表盘面。
- 把模型提出的策略族与本地研究库 `research/sudoku-human-solving/local-library/` 对照。
- 只采纳**可解释、sound、可在当前引擎契约下测试**的策略。

## 环境（执行分支对对比无感）

- 从 `master` 重新切出**全新的 `foundation` 与 `orchestration` 环境**：foundation 剥离 `orchestration/`，并清除任何对比/评分/模型字样，让 worker 分支对"正在被对比"无感知。
- 复用 `orchestration/harness/` 的通用框架（run-all / run-model / verify / judge / prompts / required-ids / 报告与分析工具）与 `orchestration/harness/methodology/` 的方法论。
- 本轮专属产物（模型清单、报告、结果数据、调查笔记）放在 `orchestration/round2/` 下（镜像 `round1/` 的组织）。

## 可选：对照开源引擎

为核对策略覆盖与命名是否完整，可在分析阶段参考开源数独分析器的算法实现（如 [HoDoKu](https://github.com/PseudoFish/Hodoku/tree/master/src/solver)）。这属算法参考，与模型评测分开看待。

## 待定稿

- 模型清单、提示词、required-ids 增量、聚类代表盘面的选取——均待 Roadmap ①/② 推进后定稿。
