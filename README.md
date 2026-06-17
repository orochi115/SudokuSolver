# 数独交互式教程 (Sudoku Interactive Tutorial)

用人类解法(非暴力枚举)系统化地求解数独,逐步可视化解题过程,并交互式引导用户学习各种策略。

## 仓库结构
```
packages/engine/                  纯 TS 求解引擎(无 DOM):grid / parser / bruteforce /
                                  trace / strategy / solver / soundness / strategies(17 策略)
packages/web/                     (M4/M5)回放与交互式引导 UI —— 待建
data/ground-truth/                冻结标准答案集(各档 100 题,solved/unique)
data/failing-diabolical/          当前引擎未解出的 727 道 diabolical(下一阶段开发目标)
puzzles/                          测试语料(Git LFS,完整 OpenSudoku ~893,916 题,四个难度档)
research/sudoku-human-solving/    第 1 阶段:人类解法研究库(56 来源 / 13 技巧卡 / 中英术语 + 研究过程记录)
docs/requirements.md              需求总纲
docs/milestones/M1..M5.md         各阶段详细需求与验收清单
docs/checklist.md                 进度看板
docs/methodology/                 方法论:多模型对比测试流程、结果数据管理、跨分支 trace 对比
docs/roadmap/                     未来工作计划:策略拆分重构、剩余 diabolical 补全
docs/investigations/              第一轮对比测试的修复/根因分析记录
orchestration/                    多模型对比测试框架(harness:调度/裁判/提示词/必需 id/报告工具)
QUESTIONS.md                      M3 实现期的假设与开放问题记录
```

## 当前进展
- **引擎**:M2/M3 策略已大量实现(17 个策略),全语料 893189/893916 解出;**diabolical 余 727 题未解出**(全部 stuck,无 invalid)。
- 这 727 题是下一阶段"策略拆分 + 新策略"开发目标,已抽出至 `data/failing-diabolical/`。
- 引擎由第一轮多模型对比测试的胜出实现(sonnet46)综合修复而来,过程见 `docs/methodology/` 与 `docs/investigations/`。

## 快速开始
```bash
# 需要 Node 22+ 与 Git LFS(已 git lfs pull 才会有真实谜题文件)
npm install
npm test            # 运行全部单元 + 语料集成测试(含 diabolical 回归)
npm run typecheck   # 类型检查
npm run gen:ground-truth   # 重新生成冻结标准答案集(确定性抽样)
```

## 核心设计:SolveTrace 脊柱
求解器不只输出答案,而输出结构化的 `SolveTrace`(见 `packages/engine/src/trace.ts`);
一份 trace 三处复用——正确性验证(`soundness.ts`)、网页逐步回放(M4)、交互式提示(M5)。
这是把各阶段串起来的唯一数据契约,**接口冻结**。

## 路线图
M1 地基 ✅ → M2/M3 策略(已实现,diabolical 余 727)→ **策略拆分重构 + 新策略补全 727**(进行中,见 `docs/roadmap/`)→ M4 回放 → M5 交互引导。
详见 `docs/checklist.md`。

## 关于 orchestration/
`orchestration/` 是多模型对比测试的私有编排区(harness),不属于产品代码。第一轮用它横评多个大模型实现同一策略任务。
下一轮对比测试时从 master 切出新的 foundation/orchestration 环境,让执行分支对对比无感知。方法论沉淀见 `docs/methodology/`,
第一轮原始数据保留在归档分支 `archive/round1/orchestration`。
