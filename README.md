# 数独交互式教程 (Sudoku Interactive Tutorial)

用人类解法(非暴力枚举)系统化地求解数独,逐步可视化解题过程,并交互式引导用户学习各种策略。

## 仓库结构
```
research/sudoku-human-solving/   第 1 阶段:人类解法研究库(56 来源 / 13 技巧卡 / 中英术语)
puzzles/                          测试语料(Git LFS,~27,800 题,四个难度档)
data/ground-truth/                冻结标准答案集(各档 100 题,solved/unique)
packages/engine/                  纯 TS 求解引擎(无 DOM):grid / parser / bruteforce /
                                  trace / strategy / solver / soundness / strategies
packages/web/                     (M4/M5)回放与交互式引导 UI —— 待建
docs/requirements.md              需求总纲
docs/milestones/M1..M5.md         各阶段详细需求与验收清单
docs/checklist.md                 进度看板
```

## 快速开始
```bash
# 需要 Node 22+ 与 Git LFS(已 git lfs pull 才会有真实谜题文件)
npm install
npm test            # 运行全部单元 + 语料集成测试
npm run typecheck   # 类型检查
npm run gen:ground-truth   # 重新生成冻结标准答案集(确定性抽样)
```

## 核心设计:SolveTrace 脊柱
求解器不只输出答案,而输出结构化的 `SolveTrace`(见 `packages/engine/src/trace.ts`);
一份 trace 三处复用——正确性验证(`soundness.ts`)、网页逐步回放(M4)、交互式提示(M5)。
这是把各阶段串起来的唯一数据契约,**接口冻结**。

## 路线图
M1 地基 ✅ → M2 基础策略 → M3 高级策略(AIC/ALS/链)→ M4 回放 → M5 交互引导。
详见 `docs/checklist.md`。
