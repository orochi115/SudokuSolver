# HoDoKu 移植引擎 — 高层架构决策（轨道 B）

> **状态：高层架构决策，未动代码。** 本轮只定方向与边界，不排具体 solver 阶段。
> **关联：** [`DECISION.md`](./DECISION.md)（仍有效的技术分析：难度模型 §4、数据结构与 solver 清单 §5.2、排除项 §5.3、测试 §6、风险 §7）、[`FINDINGS.md`](./FINDINGS.md)（727 普查）、[`README.md`](./README.md)（oracle）、主引擎补全计划 [`../../docs/plans/diabolical-727.md`](../../docs/plans/diabolical-727.md)（轨道 A）。

## 0. 与早先 DECISION.md 的差异（2026-06-23 方向调整）

早先决策是"把 HoDoKu solver 塞进现有 TS 引擎契约、退役原 33 策略、重建主引擎"。**现已改为两条独立轨道：**

- 主 TS 引擎（`packages/engine/`）**保留**，由轨道 A 自研补全人类策略以超越 HoDoKu。
- HoDoKu 移植是**独立引擎**，落在 `research/hodoku-logic/` 下，与主引擎**不共享代码**。

因此 DECISION.md 中关于"替换/退役主引擎策略、改主引擎共享契约、运行时双策略集"的章节不再适用；其余技术分析（数据结构、难度模型、测试、风险）继续作为本移植的参考。

## 1. 忠实性原则

- **100% 行为忠实于上游 HoDoKu，不做任何改进。** 算法、搜索顺序、难度评分、边界情况都照搬。
- 所有"更完整 / 更优 / 更易讲"的改进**只发生在轨道 A 的主引擎**；本引擎的价值正是"HoDoKu 究竟怎么做"的可执行参照与差分基准。
- 不"清干净"HoDoKu 风格：会带入其 `Options` 单例、位掩码缓存、稠密写法。换取的是**完整度与可验证的忠实**，而非更干净的设计。

## 2. 独立性

- 独立引擎，**不与 `packages/engine/` 共享代码**：自带数据结构、solver、配置、step 数据类型。
- 两套引擎通过**各自的结构化 step 输出**与未来的渲染层对接，而非通过共享内部类型耦合。
- 目录：移植代码落在 `research/hodoku-logic/` 下的独立 TS 子目录（与现有 Java 源 + oracle 并列）。

## 3. 引擎边界（落实"无暴力"红线）

- **纯逻辑技巧在范围内**；**不移植** `BruteForceSolver` / `TemplateSolver` / `GiveUpSolver` / `IncompleteSolver` / 整个 `generator/`（回溯）。
- 不调用 `validSolution()`、不依赖 `Sudoku2.solution[]`（uniqueness 类只假设唯一解，不读真解）。
- 边界与现有 census driver（`LogicalBatchSolver` + `run.sh --strict`）已确立的口径一致。

## 4. 数据结构映射（草图，非实现）

照搬上游，TS 侧大致对应（详清单见 DECISION.md §5.2）：

| HoDoKu (Java) | TS 侧 | 备注 |
|---|---|---|
| `Sudoku2` | grid 类 | 候选/落子状态 |
| `SudokuSet` / `SudokuSetBase`（81-bit） | `Uint32Array[3]` | 为性能用定长数组，**不**用 BigInt |
| `Candidate` / `Chain` / `GroupNode` / `TableEntry` | 同名结构 | 链/表引擎用 |
| `SolutionStep` | step 数据对象 | 携带 placements/eliminations + fins/base&cover/chains/alses/colorCandidates/restrictedCommons |
| `SolutionType`(库码 `0000`/`0708`…) | 带元数据的类型 | reglib 按此键映射 |
| `SolutionCategory` | 第二分类轴 | 与难度正交 |
| `StepConfig`：`index` / `level` / `baseScore` | 同名字段 | 见 §5 |
| `Als` / `RestrictedCommon` | 同名结构 | ALS 类用 |

solver 类清单（按上游分组，本轮不排阶段）：`SimpleSolver`、`FishSolver`、`SingleDigitPatternSolver`、`WingSolver`、`UniquenessSolver`、`ColoringSolver`、`ChainSolver` / `TablingSolver`（链/AIC/nice-loop/forcing 引擎，最大成本）、`AlsSolver`、`MiscellaneousSolver`、`SudokuStepFinder`。

## 5. 难度模型（须忠实保留）

HoDoKu 把**搜索顺序**与**难度评级**解耦——这正是本项目想要、且要忠实复刻的（详见 DECISION.md §4）：

- `index`：解题循环的搜索顺序（人工调过的优先级表），**与难度无关**。
- `level`(DifficultyType) + `baseScore`：逐技巧的评级与每步成本。
- 整题难度 = 所用技巧的最高 `level`，再 `while (Σ baseScore > level.maxScore) level++` 上调。

→ 这套"解耦 + 累计上调"也是主引擎轨道 C（[逐格难度评估](../../docs/plans/difficulty-evaluation.md)）想借鉴的模型，但两边**各自实现**。

## 6. 测试策略

- **我们自己的用例**：`data/failing-diabolical/`（727）+ 现有语料；移植结果须与本目录 HoDoKu oracle 的消除/落子**逐题一致**（差分验证）。
- **HoDoKu 自带用例集**：`reglib-1.4.txt`（~1226 条，按技巧码 + pencilmark 盘面 + 期望消除/落子）。**当前未随本副本附带，需另行获取**；获取后建逐策略 harness，按库码映射到对应 solver 验证。
- 无暴力护栏：driver 已硬断言禁用步类型不出现，移植引擎沿用同口径。

## 7. 渲染（未来工作，本轮不设计）

- HoDoKu 的 Swing `Graphics2D` 渲染**不可移植**；未来 **HTML 渲染层从零基于 step/trace 数据重建**。
- 该渲染层设计为**同时服务两套引擎**（主 TS 引擎 + HoDoKu 移植引擎），各自喂入结构化 step。
- 可借鉴 HoDoKu 的视觉语言：链箭头、base/cover 集高亮、候选染色。

## 8. 未决事项

- 移植 TS 子目录的具体命名与构建集成（与现有 Java 源/oracle 共存）。
- `reglib-1.4.txt` 的获取来源与许可记录。
- 两引擎 step 输出面向渲染层的**最小公共形状**（在渲染层动工时再定，避免过早耦合）。
- 具体 solver 移植的阶段排序（待本轨道正式启动时再定；执行优先级当前在轨道 A 之后）。
