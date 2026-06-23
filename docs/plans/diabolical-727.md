# 人类策略全覆盖路线图（Roadmap ②）

> **定位：** 主 TS 引擎（[`packages/engine/`](../../packages/engine/)）的人类技巧补全计划。目标是做到**人类解法全覆盖、并超越 HoDoKu 的完整度**——理想状态是**不依赖 forcing chain / net 也能 100% 解出** [`../../data/failing-diabolical/`](../../data/failing-diabolical/) 里的 727 道 diabolical。
>
> **资料口径：** 策略定义、分类与优先级**只参考网络数独资料**（SudokuWiki / Sudopedia / sudoku.com / 论坛 / 中文社区等，镜像见 [`research/sudoku-human-solving/`](../../research/sudoku-human-solving/)）；**不参考 HoDoKu 的实现与源码**（HoDoKu 仅作为另一条独立轨道，见 [`research/hodoku-logic/`](../../research/hodoku-logic/)，与本计划解耦）。
>
> **727 的角色：** 727 是**经验验证门槛（empirical gate）**，不是计划的组织框架——补齐技巧树后用它度量覆盖率，而非按它逆推该实现什么。
>
> **实现就绪标准（本文件的目标）：** 读完本目录的某一条 + 它链接的研究卡，应能**无歧义实现**该策略。研究卡是否达标用下方 **文档状态** 标注；未达标的卡片任务集中在 [§ 文档缺口 backlog](#文档缺口-backlog)。

## 目标与红线

- **全覆盖**：实现网络数独资料中成体系的全部人类技巧（见下方技巧目录），并显式列出**有意排除**的项（见 [§ 有意排除](#有意排除不实现-9×9-上冗余出题域外或越过红线)）。
- **超越 HoDoKu**：完整度对标并超过 HoDoKu，但路径独立得出。
- **避免 forcing net**：forcing nets / Nishio / 模板枚举 / Kraken / POM 视为**红线（P3）**——偏向枚举而非"人类解法"。目标是**在动用它们之前**就靠允许的技巧达到 100%。若最终仍有残留，再显式决策是否接受 / 是否在 flag 后有限引入。
- 任何改动若降低全语料 solved 数或引入 invalid，立即停。
- 同一选择反复调三次仍不行，重审架构，而非再堆 tie-break 规则。
- 性能不是本阶段首要目标；缓存只能作为后续独立优化任务，不作为策略正确性的前提。

## Taxonomy 约束（继承 [Roadmap ①](./taxonomy-refactor.md)）

- 新策略必须使用具体的人类技巧 ID，不得塞进宽泛家族名（不要只叫 `fish` / `als` / `chain` 的默认 trace ID）。
- `difficulty` 按**人类识别/学习成本**排序，而不是实现复杂度或运行成本；默认 trace 优先展示更易讲解的技巧。
- 一个 trace step 默认对应一个具体模式实例；同技巧跨实例合并若为控范围保留，必须列为显式 deferred exception。
- 每个新增/增强技巧都要有 restored-state 测试，断言具体 `strategyId`、关键 sound deduction，以及整题 solved/sound 不回退。

## 文档状态图例

每条技巧标注其研究卡能否支撑**无歧义实现**：

- **✅ 实现级**：有专卡，含精确模式定义 + 触发判定 + 全部消除/落子情形 + 退化/边界 + 关系 + worked example + soundness（实现级模板九节，见下）。
- **✅\* 实现级（例待验证）**：卡已达实现级，但其 worked example 为源派生/构造、**尚未用本仓库引擎验证**消除集（见 [§ worked-example 验证 backlog](#文档缺口-backlog已基本完成)）。
- **◐ 概要**：有卡但仅"规则 + 扫描"，缺精确约束 / 边界 / 例子。
- **✗ 缺文档**：无专卡且无可用源镜像。

> 现状（2026-06-23 卡片补全后）：00–11 分册的全部 P0/P1/P2 技巧均已有**实现级专卡（39 张）**；其中一部分的 worked example 仍待引擎验证（标 ✅\*）。仅 P3（红线，默认不实现）保持边界卡。库存计数与源镜像见 [`research/sudoku-human-solving/local-library/audit-report.md`](../../research/sudoku-human-solving/local-library/audit-report.md)（85 源 / 39 卡）。

## 已实现（31，仅供参照，不再规划；其研究卡已于 2026-06-23 升级到实现级）

singles：`full-house` / `naked-single` / `hidden-single`；
intersections：`locked-candidates-pointing` / `-claiming`；
subsets：`naked-pair/triple/quad`、`hidden-pair/triple/quad`；
fish：`x-wing` / `swordfish` / `jellyfish`；
single-digit：`skyscraper` / `two-string-kite` / `empty-rectangle`；
wings：`xy-wing` / `xyz-wing` / `w-wing`；
coloring：`simple-coloring`；
chains：`x-chain` / `aic`；
ALS：`als-xz` / `als-xz-doubly-linked` / `als-xy-wing` / `death-blossom`；
uniqueness：`bug-plus-one`、`unique-rectangle-type1/2/4`；
exotic：`sue-de-coq`；
last-resort：`forcing-chain`。

## 待实现技巧目录 — 分类与优先级

分类对齐研究库分册 [`research/sudoku-human-solving/local-library/techniques/`](../../research/sudoku-human-solving/local-library/techniques/)（`00-foundations … 12-last-resort`）。优先级依据：①SudokuWiki 的人类难度递进；②**用我们自己的引擎探针**对 727 实测的杠杆（不采用任何外部解法器的普查数字）。
研究卡路径相对 `research/sudoku-human-solving/local-library/techniques/`；源镜像相对 `research/sudoku-human-solving/local-library/markdown/`。

### P0 — 高杠杆，复用现有机制（先做）

| 技巧 | 分册 | 文档状态 | 研究卡 | 说明 |
|---|---|---|---|---|
| Finned / Sashimi X-Wing·Swordfish·Jellyfish | 04-fish | ✅\* | `04-fish/finned-sashimi.md` | 现有 fish 的受控扩展（cover set + fin 格；仅消除"看到全部 fin"的 cover 格）。退化为 Sashimi（缺角）。**仅做到 jellyfish 大小**（更大鱼见有意排除）。 |
| Grouped AIC / Grouped Nice Loops | 08-chains-aic | ✅ | `08-chains-aic/grouped-aic.md` | 给链搜索加 **group node**。 |
| 不连续 / 连续 Nice Loop | 08-chains-aic | ✅ | `08-chains-aic/nice-loops.md` | 链端点重合 → 强制落子/消除；727 最大族。 |
| XY-Chain（显式） | 08-chains-aic | ✅ | `08-chains-aic/xy-chain.md` | 双值格链，AIC 的常见特例（Remote Pairs ⊂ XY-Chain ⊂ AIC）。 |
| Hidden Unique Rectangle（Hidden Rectangle） | 10-uniqueness | ✅ | `10-uniqueness/unique-rectangle-bug.md` | 与 UR Type 6 逻辑重叠，已在卡内交叉标注。 |
| UR Type 3 / 5 / 6 | 10-uniqueness | ✅ | `10-uniqueness/unique-rectangle-bug.md`（逐型 1–6 + Hidden UR + BUG/Unique Loop） | 补齐现有 UR 1/2/4 的其余类型。 |
| Turbot Fish / X-Cycles（含 Fishy Cycle 别名） | 05-single-digit-patterns | ✅\* | `05-single-digit-patterns/turbot-family.md` | 与现有 skyscraper / 2-string-kite / empty-rectangle **部分重叠**，卡内已写清"同一单数字强链模式"（见 overlap）。 |

### P1 — 标准进阶，中等杠杆

| 技巧 | 分册 | 文档状态 | 研究卡 |
|---|---|---|---|
| Tridagon / anti-Tridagon（Thor's Hammer） | 11-exotic | ✅ | `11-exotic/tridagon.md`（现代 diabolical 高杠杆，已提到 P1） |
| Multi-Coloring | 07-coloring | ✅\* | `07-coloring/multi-coloring.md` |
| 3D Medusa | 07-coloring | ✅\* | `07-coloring/3d-medusa.md` |
| ALS-XY-Chain / 一般 ALS 链 | 09-als | ✅ | `09-als/als.md`（`als-xy-wing` 是其 len-2 特例） |
| Almost Hidden Sets (AHS) 作链节点 | 09-als | ✅ | `09-als/ahs.md`（ALS 的对偶：N 数字落在 N+1 格） |
| WXYZ-Wing | 06-wings | ✅ | `06-wings/wxyz-wing.md` |
| Remote Pairs | 06-wings | ✅ | `06-wings/remote-pairs.md`（XY-Chain 特例） |
| Almost Locked Pair/Triple（Bent Sets）/ Chute Remote Pairs | 06-wings | ✅\* | `06-wings/bent-sets.md`（+ chute 见 `remote-pairs.md`） |
| Broken Wing / Guardians | 05-single-digit-patterns | ✅\* | `05-single-digit-patterns/broken-wing.md`（与 Turbot/X-Cycle 重叠，已交叉标注） |
| Avoidable Rectangle Type 1–4（一般 AR） | 10-uniqueness | ✅\* | `10-uniqueness/avoidable-rectangle.md` |
| Extended Unique Rectangle（2×3 / 3 数） | 10-uniqueness | ✅ | `10-uniqueness/extended-ur.md` |
| Unique Loops / Unique Polygon / BUG 变体（BUG Lite、BUG+n） | 10-uniqueness | ✅ | `10-uniqueness/unique-rectangle-bug.md` |
| AIC with ALS nodes | 08-chains-aic | ✅ | `08-chains-aic/aic-with-als.md` |
| AIC with UR / grouped nodes | 08-chains-aic | ✅\* | `08-chains-aic/aic-with-ur.md`（+ grouped 见 `grouped-aic.md`） |

### P2 — 罕见 / 异域，低频

| 技巧 | 分册 | 文档状态 | 研究卡 |
|---|---|---|---|
| WXYZ-Wing 之上的翼梯：VWXYZ-Wing（及一般 size-ladder） | 06-wings | ✅ | `06-wings/wxyz-wing.md`（含 VWXYZ 与翼梯通项） |
| Exocet（Junior / Senior）；Double Exocet 交叉标注 | 11-exotic | ✅\* | `11-exotic/exocet.md` |
| SK-Loop（⊂ MSLS，交叉标注） | 11-exotic | ✅\* | `11-exotic/sk-loop.md` |
| MSLS（Multi-Sector Locked Sets） | 11-exotic | ✅\* | `11-exotic/msls.md` |
| Fireworks | 11-exotic | ✅\* | `11-exotic/fireworks.md` |
| Aligned Pair/Triple Exclusion（APE/ATE） | 11-exotic | ✅\* | `11-exotic/aligned-exclusion.md` |
| Subset Exclusion / Subset Counting（APE/ATE 的非对齐推广） | 11-exotic | ✅\* | `11-exotic/subset-exclusion.md` |
| Sue de Coq 扩展（更大 SdC / 双线） | 11-exotic | ✅\* | `11-exotic/sue-de-coq.md` |
| AIC with exotic links | 08-chains-aic | ✅ | `08-chains-aic/aic-with-exotic-links.md` |
| Twinned XY-Chains | 08-chains-aic | ✅\* | `08-chains-aic/twinned-xy-chains.md` |
| Franken / Mutant fish（含 Endo Fins / Cannibalism 精炼、Siamese 呈现） | 04-fish | ✅\* | `04-fish/franken-mutant.md` |
| Gurth's Symmetrical Placement（对称占位） | 10-uniqueness | ✅ | `10-uniqueness/gurth.md`（仅对称题有效，727 上低频） |

### P3 — 最后手段 / 红线（默认不实现；仅在确需时 flag 后引入；此处仅枚举命名）

| 技巧 | 分册 | 文档状态 | 研究卡 / 源 |
|---|---|---|---|
| Forcing Chains 子类：Digit / Nishio / Cell / Unit(Region) Forcing Chains、Double Implication Chain (DIC) | 12-last-resort | ◐策略边界 | `12-last-resort/forcing-vs-enumeration.md`；源 `forcing_nets.md`。仅命名枚举，不实现 |
| Forcing Nets（cell / region / contradiction / verity） | 12-last-resort | ◐策略边界 | 同上 |
| Kraken Fish | 12-last-resort | ✗ | 同册边界卡（接受不写算法） |
| Tabling / Trebor's Tables | 12-last-resort | ✗ | 枚举类，红线 |
| Pattern Overlay Method (POM) | 12-last-resort | ✗ | 同上 |
| Templates / Bowman's Bingo | 12-last-resort | ✗ | 同上 |
| GEM（Graded Equivalence Marks）/ Braid Analysis | 12-last-resort | ✗ | 临近枚举，归红线 |

> P3 越过了"人类解法"边界（趋近枚举/试错）。项目目标是在动用 P3 **之前**达到 100%；若仍有残留再显式决策。

### 有意排除（不实现：9×9 上冗余、出题域外、或越过红线）

读本计划时这些应被当作**明确不做**，而非遗漏：

- **更大基础鱼**：Squirmbag(5)/Whale(6)/Leviathan(7) 及其 finned 版——9×9 上补集恒为更小的鱼，冗余。finned 鱼也止于 jellyfish 大小。
- **Oriented chains / nrczt 3D chains（Berthier）**：解法器/学术专用，非人类实践树。
- **Trial & Error / Bifurcation / Ariadne's Thread / 猜测 / 回溯 / 暴力计数**：红线定义之外。
- **Constraint Subsets**：meta 框架（subset+fish 的统一视角），非离散落子动作。
- **Reverse BUG / Reverse ER 等"反向"边角形**：极冷门，列此备查。
- **变体规则**（Jigsaw/Windoku/Killer/Sudoku-X：Law of Leftovers、9 Windows、cage 规则等）：非经典 9×9，727 域外。
- **Multivalue X-Wing**：SudokuWiki 已废弃，被标准 X-Wing/finned fish 吸收。

### 重叠 / 包含关系（交叉标注，避免重复实现或独立去重出错）

1. **单数字强链族**：Turbot Fish = skyscraper/2-string-kite/empty-rectangle 的统一 4-链形；X-Cycle = 单数字 Nice Loop；Fishy Cycle = X-Cycle 别名；X-Wing = 长度 4 的连续 X-Cycle。→ 不要实现成 4 个独立探测器，写成"单数字链"统一说明。
2. **链族嵌套**：Remote Pairs ⊂ XY-Chain ⊂ AIC；W-Wing 是短双值链。
3. **链引擎合一**：Grouped AIC / 连续·不连续 Nice Loop / 基础 AIC 是**同一链引擎 + 开关**（分组开关、开链 vs 环），按 feature flag 推进，而非三个技巧。
4. **uniqueness 重叠**：Hidden UR ↔ UR Type 6（对角 hidden）逻辑重叠。
5. **ALS 嵌套**：ALS-XY-Wing 是一般 ALS 链的 len-2 特例。
6. **SdC**：已实现基型 vs "扩展"需界定差异（更大 SdC / 双线 SdC）。
7. **多扇区族**：SK-Loop 是 MSLS 的首发特例（每个 SK-Loop 蕴含一个 MSLS）。
8. **Exocet**：Double Exocet = 两耦合 Exocet；APE/ATE ⊂ Subset Exclusion（非对齐推广）。
9. **染色变体**：X-Colors / Weak Colors / Color Wing / Supercoloring 多被 Multi-Coloring / 3D Medusa 吸收——交叉标注，不单独实现。

## 实现级研究卡模板（每张卡须满足以下章节，才算 ✅）

1. **Front-matter**：`id`、`name_en`/`name_zh`、`family`、`difficulty`（按人类学习成本）、`strategyId`（trace 必须发出的具体 taxonomy ID）、`sources`。
2. **精确模式定义**：涉及的格/宫/数字 + 基数约束（如"N 个 base house、N 个 cover house、digit 计数 = N"），定义每个术语。
3. **触发判定（detection predicate）**：solver 求值的精确布尔条件，可直接映射到代码。
4. **消除/落子规则——全部情形**：枚举该模式能产生的每类消除（UR 逐型、fish 带 fin vs 不带、AIC Type-1/2/连续/不连续…），目标集要精确（"同时看到 X 与 Y 的格"，而非"相关格"）。
5. **退化 & 边界**：sashimi（缺角）、与更简单已实现模式的塌缩、parity 要求、RCC restricted/unrestricted 区分。
6. **与其他技巧的关系**：显式包含/重叠（见上 overlap），保证引擎排序与去重无歧义。
7. **Worked example**：至少一个具体 81 字符盘面（givens + 关键候选）、命中格、精确消除/落子——最好同时作为 restored-state 测试夹具。
8. **Soundness 说明**：推导为何成立（uniqueness 类须显式写"假设唯一解"）。
9. **Sources**：源镜像文件名，保持可追溯。

## 文档缺口 backlog（已基本完成）

**卡片书写：✅ 完成（2026-06-23）。** 原三桶工作（A 网络抓取新建、B 富源 curate、C 升级 ◐ 卡）已全部落地：00–11 分册的 P0/P1/P2 技巧 + 全部已实现技巧均有实现级专卡，共 **39 张**；新增 **24 个非 HoDoKu 源镜像**（markdown + raw-html）并登记进 manifest / 索引 / citation-map / bibliography（85 源，audit 全绿）。

**唯一剩余项：worked-example 引擎验证。** 标 **✅\*** 的卡，其 worked example 是源派生或构造的盘面，消除集来自源文叙述但**尚未用本仓库 `packages/engine` / 暴力解独立验证**。待验证清单（按卡）：

- 04-fish：`finned-sashimi.md`、`franken-mutant.md`（后者为 Sudopedia 示意图，非整盘）
- 05：`turbot-family.md`（skyscraper 草图）、`broken-wing.md`（单数字草图）
- 06-wings：`bent-sets.md`（ALPair/ALTriple 示意，整盘交叉引用 XYZ-Wing 源盘）
- 07：`multi-coloring.md`、`3d-medusa.md`（盘面来自源，逐格候选未像素级核对）
- 08-chains：`aic-with-ur.md`（Example B 源仅图示）、`twinned-xy-chains.md`（源无显式消除列表）
- 10：`avoidable-rectangle.md`（AR1 构造盘）
- 11-exotic：`exocet.md`、`sk-loop.md`（Easter Monster 盘真实、逐链候选待核）、`msls.md`、`fireworks.md`、`aligned-exclusion.md`、`sue-de-coq.md`、`subset-exclusion.md`
- 01–03 basics：`singles.md`（Full/Naked 盘构造）、`locked-candidates.md`、`naked-hidden-subsets.md`（盘为源串、命中格转写自叙述）

> 验证方式（实现期顺带做）：把每个 ✅\* 的 worked example 作为 restored-state 夹具喂给引擎/暴力解，核对消除集；通过后该卡升为 ✅。**未验证不影响"规则/约束无歧义"**——它影响的是"示例本身是否 100% 准确"。

## 实施方法

1. **聚类 727**（用我们自己的引擎探针，非外部解法器）：对每个 stuck 终局记录空格数、候选掩码、最后若干步策略 ID、各待实现技巧的可用性探针；按"首个可用的缺失技巧族"聚类，得到本仓库自测的杠杆排序。
2. **按 P0 → P1 → P2 顺序、族内按实测产出**推进；每实现一个技巧前，先把它的研究卡升级到 ✅（模板九节）。
3. **TDD**：先写失败用例（restored-state 定位首个分歧 + 整题，复用卡里的 worked example 作夹具），再最小实现新策略/更强变体；遵循 ① 的命名、一步粒度与排序原则。
4. **全语料校验无回退** → 提交 → 下一族。

## 验证（三层模型）

- `data/ground-truth/` 的 `npm test`（AC-3 全 400 题 0 violation）始终保持绿。
- 每修若干题，`npm run corpus:run` 确认 **solved 数不回退、0 invalid**。
- 进度 = 727 中转为 solved 的数量（`corpus:run --difficulty diabolical` 跟踪）；`data/failing-diabolical/` 随策略增加重新生成会逐步缩小。

## 关联

- 研究资料补全（卡片新建 / 网络抓取 / 索引更新）：落地于 [`research/sudoku-human-solving/`](../../research/sudoku-human-solving/)。
- 逐格推算难度评估（引导模式）：见 [`difficulty-evaluation.md`](./difficulty-evaluation.md)（本轮仅记录方向）。
- HoDoKu 移植（独立轨道，含 727 的纯逻辑普查结果）：见 [`research/hodoku-logic/`](../../research/hodoku-logic/)。
