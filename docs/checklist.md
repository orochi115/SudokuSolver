# 进度看板 (Progress Checklist)

总纲见 `docs/requirements.md`,各阶段详情见 `docs/milestones/`。

## 阶段总览
- [x] **第 1 阶段 · 研究库**(`research/sudoku-human-solving/`)
- [x] **M1 地基** —— 引擎核心 + 测试 + 冻结标准答案集
- [~] **M2 基础策略** T1~T3 —— 已实现(第一轮对比测试产出)
- [~] **M3 高级策略** T4 / AIC / ALS / forcing —— 已实现;diabolical 全语料余 **727 题**未解出(见 `data/failing-diabolical/`)
- [ ] **策略拆分重构 + 补全 727** —— 进行中,见 `docs/roadmap/`(taxonomy 重构 → 新策略对比测试)
- [ ] **M4 网页逐步回放**
- [ ] **M5 交互式引导 UI**

> 当前引擎来自第一轮多模型对比测试胜出实现的综合修复;过程与结果见 `docs/methodology/`、`docs/investigations/`。

## M1 验收(✅ 已完成)
- [x] AC-1 解析四档语料并生成冻结标准答案集(各档 100 题,solved=100 / unique=100)
- [x] `Step`/`SolveTrace` 契约冻结
- [x] 求解循环 + 健全性校验可用
- [x] 21 单测通过 + typecheck 通过

## M2 验收
- [ ] AC-2 每个 T1~T3 策略有单元测试
- [ ] AC-3 全部 400 题标准答案集零 violation(健全性回归)
- [ ] AC-4 按难度报告非暴力解出率(解出率统计脚本)
- [ ] 策略顺序据统计调优

## M3 验收
- [ ] FR-8 `docs/forcing-boundary.md` 成文
- [ ] AC-2 T4 各策略单测;链接图 + AIC 引擎单测
- [ ] AC-3 含 diabolical 的零 violation
- [ ] AC-4 diabolical 解出率显著提升
- [ ] FR-9 `docs/flow.md` 由算法派生

## M4 验收
- [ ] `packages/web` 可启动
- [ ] AC-5 逐步回放 + 高亮 + 双语讲解正确

## M5 验收
- [ ] AC-6 任意盘面分级提示 + 落子校验(浏览器 MCP 走查)
