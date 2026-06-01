# 任务计划：M3 高级策略与 AIC/ALS 引擎实现

## 目标
实现 Sudoku 求解引擎的 M3 高级策略（Simple Coloring、通用 AIC 引擎、ALS、Unique Rectangle / Avoidable Rectangle / BUG+1、Sue de Coq / aligned exclusion、Forcing Chains），并生成边界规则与人读流程文档，使 diabolical 档解出率大幅提升且无 soundness 违规。

## 当前阶段
阶段 1：需求分析与调研

## 各阶段

### 阶段 1：需求分析与调研
- [x] 阅读 M3.md 需求与验收清单
- [x] 查看现有代码结构、trace.ts、grid.ts 及 solve-rate.ts
- [x] 将所有调研结果和关键设计记录到 findings.md
- **状态：** complete

### 阶段 2：技术方案与详细设计
- [ ] 详细设计 AIC 引擎 (强弱链、多值、grouped links 建模及 DFS/BFS 寻找链路径)
- [ ] 详细设计 ALS 策略 (ALS-XZ, ALS-XY-Wing, ALS 链, Death Blossom)
- [ ] 详细设计 唯一性策略 (UR Type 1-4, AR, BUG/BUG+1)
- [ ] 详细设计 Simple Coloring 与 Forcing Chains
- [ ] 撰写 `docs/forcing-boundary.md` 边界设计草案
- **状态：** in_progress

### 阶段 3：代码实现与逐步集成
- [ ] 实现 Simple Coloring 策略并集成
- [ ] 实现 链接图与通用 AIC 引擎，支持连续环与不连续环等，并注册对应 X-Chain/XY-Chain/Nice Loops 等
- [ ] 实现 ALS 策略并集成
- [ ] 实现 Uniqueness (唯一性) 策略并集成（以开关或配置控制）
- [ ] 实现 Forcing Chains 策略并集成
- [ ] 每次实现都配单测，并保持 `npm run typecheck` 零报错
- **状态：** pending

### 阶段 4：测试、验证与调优
- [ ] 在全部 400 题 ground-truth 上运行解决率与 Soundness 检查，确认零 violation
- [ ] 统计并记录 diabolical 的解决率提升
- [ ] 修复所有 bug 与 soundness 违规
- **状态：** pending

### 阶段 5：文档完善与交付
- [ ] 编写/完善 `docs/forcing-boundary.md`
- [ ] 编写 `docs/flow.md`
- [ ] 编写 `docs/notes/m3.md` 设计说明
- [ ] 确认 typecheck + test 全绿，提交成果
- **状态：** pending

## 关键问题
1. Grouped links 在 AIC 中的建模和实现复杂度是多少？是否可以通过基本 AIC + ALS + 强弱链图已经达到 95%+ 的 diabolical 解决率？
2. Forcing chains 边界如何定义？在人类可接受逻辑中，如何区分伪装的枚举与真实推理？

## 已做决策
| 决策 | 理由 |
|------|------|
| 保持策略为纯函数，不修改 Grid | 强硬要求，防止回溯/破坏 solver loop 状态 |

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|

## 备注
- 必须精细维护 Highlights 结构 (包括 `links` 路径和 explanations) 方便 M4/M5 渲染。
