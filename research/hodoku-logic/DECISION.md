# 引擎方向决策：基于 HoDoKu 忠实移植重建 solver（保留契约与测试基建）

> 状态：**方向已定，未动代码。** 本文记录调研结论与决策边界；未来即使开始移植 HoDoKu，也从 `research/hodoku-logic/` 这里起步（已含可运行的 HoDoKu 纯逻辑 oracle + 全套源码）。
> 关联：[`FINDINGS.md`](./FINDINGS.md)（727 普查数据）、[`README.md`](./README.md)（oracle 构建/运行）、[`../../docs/plans/diabolical-727.md`](../../docs/plans/diabolical-727.md)（Roadmap ②）。

## 1. 背景与问题

Roadmap ② 要让引擎解出 727 道当前 stuck 的 diabolical。为评估"自研补全策略 vs 借助 HoDoKu"，我们把 HoDoKu（GPLv3，~70+ 人类技巧）的纯逻辑解法做成 standalone CLI 并跑完 727，随后深入对比了两边的架构与元数据模型。

核心问题演进为：**继续在现有 TS 引擎上逐个补策略，还是把 HoDoKu 的 solver 作为引擎基础？**

用户约束（决策前提）：
- 许可证无所谓（GPL 不构成阻碍，可自由阅读/移植 HoDoKu）。
- 终极第一性原则：**任意难度的题，都用尽可能简单、易懂的人类解法展示。** → 需要广度 + 正确性 + "最简路径"。
- 每个 solver 的输出必须是**结构化数据**，可被任意前端渲染（不与 GUI 绑定）。
- 红线：**不引入回溯/模板枚举/无约束 forcing nets/题号专用 guard**（非人类解法）。

## 2. 调研结论

### 2.1 HoDoKu 确实比现有 TS 引擎完善得多

- **技巧广度**：~70+ 技巧，含 finned/sashimi/franken/mutant fish、kraken、所有 nice-loop 类型及 grouped 变体、multi-coloring、ALS 链、death blossom、Sue de Coq、UR 1–6、hidden/avoidable rectangle、BUG 等。现有 TS 引擎仅 33 个策略。
- **难度模型更丰富**（见 §4）：每技巧带 `level`(DifficultyType) + `baseScore`，并有"按累计分聚合到整题难度"的 rater。现有引擎只有单一 `difficulty:number`。
- **二维分类**：每技巧带 `SolutionCategory`（SINGLES/INTERSECTIONS/SUBSETS/BASIC_FISH/.../UNIQUENESS/CHAINS_AND_LOOPS/WINGS/ALMOST_LOCKED_SETS/LAST_RESORT 等 18 类），与难度正交，满足不同教学需求。
- **结构化 step 数据**：`SolutionStep` 是纯数据对象，携带 placements/eliminations + fins/endoFins/base&cover 集合/chains/alses/colorCandidates/restrictedCommons —— 正是"被任意前端渲染"所需。
- **自带逐策略测试**：`reglib-1.4.txt` 共 **1226 条**，每条按技巧码标注 + pencilmark 盘面 + 期望消除/落子，由 `RegressionTester.java` 执行。现有引擎的测试是整题级，**没有逐策略覆盖**。

### 2.2 现有 TS 引擎的真正资产（与 solver 无关、必须保留）

这些才是项目身份，且**不依赖哪个 solver 产出 step**：
- **可序列化 trace 契约**（`packages/engine/src/trace.ts` 的 `SolveTrace`/`Step`/`Highlights`）——M4 回放 / M5 tutor / soundness 共同消费的"脊柱"。
- **soundness / AC-3 校验**（`soundness.ts` + `data/ground-truth/`）——项目最强正确性护栏。
- **语料 + ground-truth + （新增）reglib + HoDoKu 差分 oracle** 测试基建（`corpus-lib.ts`、`full-corpus.ts`、本目录的 standalone CLI）。
- **双语命名 / glossary** 与"按人类学习成本排难度"的教学取向（Roadmap ①）。

### 2.3 727 普查数据（详见 FINDINGS.md）

| 模式 | solved | stuck | invalid |
|---|---|---|---|
| 全套人类技巧（含 forcing chains+nets） | **727/727** | 0 | 0 |
| Strict（禁 forcing nets） | 424/727 | 303 | 0 |

每道 727 都需要 ≥1 个引擎当前缺失的技巧；首个缺失族排序：链/Nice-Loop ≈380、finned fish ≈179、Hidden Rectangle 65、forcing nets 52、Turbot 34。

## 3. 决策

**以 HoDoKu 的 solver 核心 + 元数据模型为引擎基础，但执行方式是"在现有 trace 契约与测试基建之下替换 solver 内部"，而非清空重来。**

### 3.1 保留 / 替换 / 新建

| 处置 | 内容 |
|---|---|
| **保留** | trace 契约（扩展，见 §5）、soundness/AC-3、语料+ground-truth+reglib+oracle 测试基建、双语命名与教学取向 |
| **替换** | 现有 33 个策略 + ad-hoc `difficulty` → HoDoKu 移植的 solver 核心 + `StepConfig` 元数据 + 难度 rater |
| **新建** | HTML 渲染器（HoDoKu 的 Swing `Graphics2D` 渲染**无法移植**，只能基于 trace 数据全新实现） |

### 3.2 为什么不是"清空重来"

"清空重来"会连同 trace 契约、soundness、语料/ground-truth/oracle 基建、教学取向一起丢掉——而这些与 solver 无关、是真正花了设计成本的资产。正确做法是把 HoDoKu 的 solver **塞到这套契约之下**。

### 3.3 "运行时双策略集"降级为可选

既然 HoDoKu 超集现有策略，**可直接退役原 33 个策略**，不必长期维护"双集 + 适配层"。仅当某些原创技巧的教学排序/讲法确有独特价值时，才保留为带标记的第二集。这反而**简化**了早先的方案。

## 4. 关键设计：HoDoKu 的难度/顺序/元数据模型（已核实）

### 4.1 难度（DifficultyType）体现在两层

- `DifficultyType` 枚举：`INCOMPLETE, EASY, MEDIUM, HARD, UNFAIR, EXTREME`。
- **逐技巧**：每个 `StepConfig` 有 `level`(=DifficultyType) + `baseScore`。例：FULL_HOUSE→EASY/4、HIDDEN_SINGLE→EASY/14、NAKED_PAIR→MEDIUM/60、X_WING→HARD、NICE_LOOP→UNFAIR、FORCING_NET→EXTREME。
- **整题聚合**：每个 `DifficultyLevel` 有 `maxScore` 阈值（默认集：EASY 800 / MEDIUM 1000 / HARD 1600 / UNFAIR 1800 / EXTREME ∞；Options 中另有一套阈值变体）。整题难度 = **所用技巧的最高 level**，再 **`while (累计 score > level.maxScore) level++`** 上调。

→ 这套 rater 正好服务"展示最简解法"：给每步一个可最小化的成本，给整题一个一致的分级。

### 4.2 应用顺序是预排的、且独立于难度

`getHint` 按 `Options.solverSteps` 的**声明顺序**遍历，跳过 `enabled==false` 的项，返回第一个能出 step 的技巧。该顺序由 `StepConfig.index`（"search order when solving"）固定，是**人工调过的优先级表**，**不在运行时按 level 排序**（只有用于"步效率评级"的 `solverStepsProgress` 才按 `ProgressComparator` 排序）。

→ 关键：HoDoKu **把"搜索顺序(index)"与"难度评级(level+baseScore)"解耦**。现有引擎把两者合成一个 `difficulty` 数。忠实复刻 HoDoKu 时，HoDoKu 集按其 `index` 排序，难度/教学用 `tier`+`baseScore`。

### 4.3 需引进的元数据清单（来自 `StepConfig` 等）

| 字段 | 引进 | 用途 |
|---|---|---|
| `index` | ✅ | 解题循环搜索顺序（与难度解耦） |
| `type` | 已有 | → `strategyId` |
| `level`(DifficultyType) | ✅ | `tier` |
| `category`(SolutionCategory) | ✅ | 第二分类轴 |
| `baseScore` | ✅ | 每步成本 → 整题分级 + "最简路径"打分 |
| `adminScore` | ❌ | HoDoKu 中未使用 |
| `enabled` | 部分 | 映射"该策略是否在当前集内" |
| `allStepsEnabled` | 延后 | 仅"找出所有步"模式需要 |
| `indexProgress`/`enabledProgress` | 延后 | HoDoKu 的步**效率评级**通道，未来要再引 |
| `enabledTraining` | 延后 | 仅训练/练习模式需要 |
| `SolutionType` 库码(`0000/0708`...) | ✅ | reglib 测试按此键映射到策略 |
| `DifficultyLevel.maxScore` 阈值 | ✅ | 双集一致地跑整题分级；"最简路径"基础 |
| `DifficultyLevel` 颜色 | ❌ | GUI 专用 |

## 5. 引擎改造范围

### 5.1 共享契约（`packages/engine/src/`）

- **`strategy.ts`**：把单一 `difficulty:number` 拆成 ——
  ```ts
  interface Strategy {
    id; name; apply;            // 不变
    order: number;              // 解题搜索顺序（原 difficulty 即作 order）
    tier: Tier;                 // DifficultyType
    baseScore: number;          // 每步成本
    category: SolutionCategory;
    libCode?: string;           // '0708' 等，供 reglib 映射
  }
  ```
  新增 `SolutionCategory` 枚举（镜像 HoDoKu）与 `Tier` 类型。`solve()` 改按 `order` 排序。
- **`trace.ts`**：`Highlights` **加性**扩展，对齐 `SolutionStep`（全部可选，旧策略/旧 UI 不受影响）：
  `fins?` `endoFins?` `baseRegions?` `coverRegions?` `groups?`(组节点) `colorClasses?`(染色) `alses?` `restrictedCommons?`；`Link` 可加组端点。
- 新增**难度 rater**：`max(tier) 被 Σ baseScore 上调` —— 双集通用，亦是"最简路径"搜索的基础。
- **`solver.ts`**：基本不变（已按策略数组解题）；可加便捷重载。
- **`corpus-lib.ts`/`full-corpus.ts`**：加 `--set`（默认沿用当前集）以便两集对跑/对比。
- **`soundness.ts`**：不变（只读 placements/eliminations；扩展 highlights 被忽略）。

### 5.2 HoDoKu 移植核心（新模块 `packages/engine/src/hodoku/`）

- **数据结构**：`Sudoku2`、`SudokuSet`/`SudokuSetBase`（81-bit → 建议 `Uint32Array[3]`，非 BigInt，顾及性能）、`Candidate`、`Chain`、`SolutionStep`、`SolutionType`(带 category/tier/score/libCode)、`SolutionCategory`、`StepConfig`、`SudokuUtil`、`Als`、`RestrictedCommon`、`GroupNode`、`TableEntry`。
- **solver 类**：`AbstractSolver`、`SimpleSolver`、`FishSolver`、`SingleDigitPatternSolver`、`WingSolver`、`UniquenessSolver`、`ColoringSolver`、`ChainSolver`、`TablingSolver`(最大/最难)、`AlsSolver`、`MiscellaneousSolver`、`SudokuStepFinder`。
- **裁剪版 config**：只移 solver 相关（solverSteps 顺序、`MAX_FINS`、链长上限、ALS 标志），**不**移 GUI/i18n。
- **适配层** `hodoku/adapter.ts`：`gridToSudoku2(grid)` + `solutionStepToStep(ss)`（SolutionType→id/name/category；candidatesToDelete→eliminations；indices/values→placements；fins/base/cover/als/chains→`Highlights`）。每技巧暴露为一个 `Strategy`，其 `apply` 克隆 grid→转换→`stepFinder.getStep(type)`→转回，**不改动引擎 Grid**（由现有 solver 循环施加 step）。`order` 取自 HoDoKu `index`。

### 5.3 排除项（落实"无暴力"红线）

不移植：`BruteForceSolver`、`TemplateSolver`、`GiveUpSolver`、`IncompleteSolver`、整个 `generator/`（回溯引擎）。不调用 `validSolution()`，不依赖 `Sudoku2.solution[]`（人类技巧不需要；uniqueness 类只假设唯一解、不读真解）。

### 5.4 现有策略

退役（HoDoKu 超集之）。如保留为第二集，则仅需加 `order/tier/baseScore/category` 元数据，`apply()` 逻辑不动。

## 6. 测试与验证

- **reglib 逐策略测试**：新增 harness，对 `reglib-1.4.txt` 每条按库码映射到对应策略，重建 pencilmark 盘面、跑该策略、断言找到标注的消除/落子。补上现有"整题级测试"缺失的逐策略覆盖，并直接暴露移植偏差。
- **差分 oracle**：本目录 standalone HoDoKu CLI；每个移植技巧须在全语料上与其消除一致。
- **保留三层验证**：soundness/AC-3 全绿、ground-truth `npm test` 全绿、`corpus:run` solved 数不回退、0 invalid。

## 7. 风险与权衡（决策须知）

1. **TablingSolver 是真正的大头**：链/AIC/nice-loop/forcing 引擎（组节点、table entries、BFS 蕴含展开）数千行、最易藏 bug，是任何方案下的主成本——"重来"并不能绕过它。
2. **忠实移植 = "Java-in-TS"，不是干净 TS**：会带入 HoDoKu 的 `Options` 单例、位掩码缓存、稠密风格（及德语注释）。得到的是它的**完整度**，不是更干净的**设计**。取舍：**忠实移植**（快速达正确、可被 reglib/oracle 验证——推荐）vs **重新架构**（更干净、慢得多、bug 风险高）。建议先忠实移植，日后再谈重构。
3. **HTML 渲染器是全新工作**：能移植的是**数据**（SolutionStep→trace），渲染器须基于 trace 重写。可借鉴 HoDoKu 的视觉语言（链箭头、base/cover 高亮、候选染色）。
4. **性能**：`SudokuSet` 的 81-bit 表示与 TablingSolver 在 TS 下可能更慢；性能非本阶段首要目标。

## 8. 实施顺序（增量，始终可构建/测试，绝不长期 dark）

1. **共享契约**：拆 `order/tier/baseScore/category` + `Highlights` 扩展 + 难度 rater + `--set`。（小、打底）
2. **移植基建 + 一个 solver**：`Sudoku2`/`SudokuSet`/`SolutionStep`/`SolutionType`(+元数据)/`StepConfig`/`SudokuStepFinder` + `SimpleSolver`；接适配层；singles/subsets/LC 跑通 reglib + 匹配 oracle。**端到端打通管线。**
3. **搭 reglib 逐策略 harness** 作为门槛。
4. **按序移植其余**：fish → single-digit → wings → uniqueness → coloring → **tabling** → ALS → misc，每个对 reglib + oracle 验证。
5. **HTML 渲染器**：trace 携带丰富字段后开建。
6. **双集（如保留）对跑 727 + 全语料**，对比。

## 9. 未决事项

- `SolutionCategory`/`Tier` 在 `Strategy` 上设为必填还是先可选（影响现有策略迁移成本）。
- 是否保留原创策略为第二集，还是直接退役。
- `Highlights` 扩展字段的最终命名（以 `SolutionStep` 字段为依据定稿）。
- 是否引进 HoDoKu 的"步效率评级"(`indexProgress`/progress score)用于"最简路径"打分，还是另设打分。
- 整题分级采用 HoDoKu 的哪套 `maxScore` 阈值，或按本项目"人类学习成本"重定。
