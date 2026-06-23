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
- **✅△ 规则实现级（仅片段/图示例）**：规则/判定足够实现，但 worked example 只有候选片段、源图示或理论示例；实现前必须补 81-char/restored-state 夹具。
- **◇ 理论/边界卡**：用于记录成体系来源、包含关系或排除理由，不承诺直接实现。
- **◐ 概要**：有卡但仅"规则 + 扫描"，缺精确约束 / 边界 / 例子。
- **✗ 缺文档**：无专卡且无可用源镜像。

> 现状（2026-06-23 卡片补齐；**2026-06-23 晚** 引擎验证六轮）：00–11 分册的全部 P0/P1/P2 技巧均已有**实现级或边界级专卡（41 张）**。51 个 worked example 已通过 `packages/engine/test/worked-examples.test.ts` 暴力解核对（见 §文档缺口 backlog）。仍待验证的 exotic / AR 等卡保持 ✅\*。仅 P3（红线）保持边界卡。库存见 [`audit-report.md`](../../research/sudoku-human-solving/local-library/audit-report.md)（90 源 / 41 卡）。

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
| Finned / Sashimi X-Wing·Swordfish·Jellyfish | 04-fish | ✅ | `04-fish/finned-sashimi.md` | 现有 fish 的受控扩展（cover set + fin 格；仅消除"看到全部 fin"的 cover 格）。退化为 Sashimi（缺角）。**仅做到 jellyfish 大小**（更大鱼见有意排除）。 |
| Rectangle Elimination（SudokuWiki 现行 Empty Rectangle 表述） | 05-single-digit-patterns | ✅ | `05-single-digit-patterns/rectangle-elimination.md` | 明确补齐 SudokuWiki 2023+ Tough 策略；实现上吸收进 Empty Rectangle / grouped X-Cycle / grouped AIC，不重复增加逻辑力。 |
| Grouped AIC / Grouped Nice Loops | 08-chains-aic | ✅ | `08-chains-aic/grouped-aic.md` | 给链搜索加 **group node**。 |
| 不连续 / 连续 Nice Loop | 08-chains-aic | ✅ | `08-chains-aic/nice-loops.md` | 链端点重合 → 强制落子/消除；727 最大族。 |
| XY-Chain（显式） | 08-chains-aic | ✅ | `08-chains-aic/xy-chain.md` | 双值格链，AIC 的常见特例（Remote Pairs ⊂ XY-Chain ⊂ AIC）。 |
| Hidden Unique Rectangle（Hidden Rectangle） | 10-uniqueness | ✅ | `10-uniqueness/unique-rectangle-bug.md` | 与 UR Type 6 逻辑重叠，已在卡内交叉标注。 |
| UR Type 3 / 5 / 6 | 10-uniqueness | ✅ | `10-uniqueness/unique-rectangle-bug.md`（逐型 1–6 + Hidden UR + BUG/Unique Loop） | 补齐现有 UR 1/2/4 的其余类型。 |
| Turbot Fish / X-Cycles（含 Fishy Cycle 别名） | 05-single-digit-patterns | ✅ | `05-single-digit-patterns/turbot-family.md` | 与现有 skyscraper / 2-string-kite / empty-rectangle **部分重叠**，卡内已写清"同一单数字强链模式"（见 overlap）。 |

### P1 — 标准进阶，中等杠杆

| 技巧 | 分册 | 文档状态 | 研究卡 |
|---|---|---|---|
| Tridagon / anti-Tridagon（Thor's Hammer） | 11-exotic | ✅ | `11-exotic/tridagon.md`（现代 diabolical 高杠杆，已提到 P1） |
| Multi-Coloring | 07-coloring | ✅\* | `07-coloring/multi-coloring.md`（HoDoKu mc01/mc02 已验证；X-Colors 例 1/3 待补） |
| 3D Medusa | 07-coloring | ✅ | `07-coloring/3d-medusa.md`（R1/R3/R4/R5 已验证；R2 整色翻转待夹具） |
| ALS-XY-Chain / 一般 ALS 链 | 09-als | ✅ | `09-als/als.md`（`als-xy-wing` 是其 len-2 特例） |
| Almost Hidden Sets (AHS) 作链节点 | 09-als | ✅ | `09-als/ahs.md`（ALS 的对偶：N 数字落在 N+1 格） |
| WXYZ-Wing | 06-wings | ✅ | `06-wings/wxyz-wing.md` |
| Remote Pairs | 06-wings | ✅ | `06-wings/remote-pairs.md`（XY-Chain 特例） |
| Almost Locked Pair/Triple（Bent Sets）/ Chute Remote Pairs | 06-wings | ✅ | `06-wings/bent-sets.md`（+ chute 见 `remote-pairs.md`） |
| Broken Wing / Guardians | 05-single-digit-patterns | ✅\* | `05-single-digit-patterns/broken-wing.md`（SW Guardian 1/2/3 已验证） |
| Avoidable Rectangle Type 1–4（一般 AR） | 10-uniqueness | ✅ | `10-uniqueness/avoidable-rectangle.md`（HoDoKu ar101/ar102/ar201/ar202 已验证） |
| Extended Unique Rectangle（2×3 / 3 数） | 10-uniqueness | ✅ | `10-uniqueness/extended-ur.md` |
| Unique Loops / Unique Polygon / BUG 变体（BUG Lite、BUG+n） | 10-uniqueness | ✅ | `10-uniqueness/unique-rectangle-bug.md` |
| AIC with ALS nodes | 08-chains-aic | ✅ | `08-chains-aic/aic-with-als.md` |
| AIC with UR / grouped nodes | 08-chains-aic | ✅ | `08-chains-aic/aic-with-ur.md`（Examples A/B 已验证） |

### P2 — 罕见 / 异域，低频

| 技巧 | 分册 | 文档状态 | 研究卡 |
|---|---|---|---|
| WXYZ-Wing 之上的翼梯：VWXYZ-Wing（及一般 size-ladder） | 06-wings | ✅ | `06-wings/wxyz-wing.md`（含 VWXYZ 与翼梯通项） |
| Exocet（Junior / Senior）；Double Exocet 交叉标注 | 11-exotic | ✅ | `11-exotic/exocet.md`（Rule 1 已验证） |
| SK-Loop（⊂ MSLS，交叉标注） | 11-exotic | ✅\* | `11-exotic/sk-loop.md`（Easter Monster 外链消除 + 两例唯一性已验证；内链消除待补） |
| MSLS（Multi-Sector Locked Sets） | 11-exotic | ✅ | `11-exotic/msls.md`（David P Bird Ex1 已验证） |
| Fireworks | 11-exotic | ✅ | `11-exotic/fireworks.md`（triple + quad 已验证） |
| Aligned Pair/Triple Exclusion（APE/ATE） | 11-exotic | ✅ | `11-exotic/aligned-exclusion.md`（SW 四例已验证） |
| Subset Exclusion / Subset Counting（APE/ATE 的非对齐推广） | 11-exotic | ✅\* | `11-exotic/subset-exclusion.md` |
| Sue de Coq 扩展（更大 SdC / 双线） | 11-exotic | ✅ | `11-exotic/sue-de-coq.md`（HoDoKu sdc01–sdc04 已验证） |
| AIC with exotic links | 08-chains-aic | ✅ | `08-chains-aic/aic-with-exotic-links.md` |
| Twinned XY-Chains | 08-chains-aic | ✅ | `08-chains-aic/twinned-xy-chains.md`（Examples A/B/C 已验证） |
| Franken / Mutant fish（含 Endo Fins / Cannibalism 精炼、Siamese 呈现） | 04-fish | ✅ | `04-fish/franken-mutant.md` |
| Gurth's Symmetrical Placement（对称占位） | 10-uniqueness | ✅ | `10-uniqueness/gurth.md`（仅对称题有效，727 上低频） |
| Rank / SET / Phistomefel / Oddagon 理论边界 | 11-exotic | ◇ | `11-exotic/rank-set-theory.md` | 成体系现代资料补齐；作为 MSLS/SK/Oddagon/Tridagon/Broken-Wing 的理论映射，不作为默认策略。 |

### P3 — 最后手段 / 红线（默认不实现；仅在确需时 flag 后引入；此处仅枚举命名）

| 技巧 | 分册 | 文档状态 | 研究卡 / 源 |
|---|---|---|---|
| Forcing Chains 子类：Digit / Nishio / Cell / Unit(Region) Forcing Chains、Double Implication Chain (DIC) | 12-last-resort | ◇边界卡 | `12-last-resort/forcing-vs-enumeration.md`；源 `forcing_nets.md`。仅命名枚举，不实现 |
| Forcing Nets（cell / region / contradiction / verity） | 12-last-resort | ◇边界卡 | 同上 |
| Kraken Fish（Type 1 / Type 2） | 12-last-resort | ◇边界卡 | 同上；HoDoKu 将其定义为 fish + chains，归红线 |
| Tabling / Trebor's Tables | 12-last-resort | ◇边界卡 | 枚举类，红线 |
| Pattern Overlay Method (POM) | 12-last-resort | ◇边界卡 | 同上 |
| Templates / Bowman's Bingo | 12-last-resort | ◇边界卡 | 同上 |
| GEM（Graded Equivalence Marks）/ Braid Analysis | 12-last-resort | ◇边界卡 | 临近枚举，归红线 |

> P3 越过了"人类解法"边界（趋近枚举/试错）。项目目标是在动用 P3 **之前**达到 100%；若仍有残留再显式决策。

### 有意排除（不实现：9×9 上冗余、出题域外、或越过红线）

读本计划时这些应被当作**明确不做**，而非遗漏：

- **更大基础鱼**：Squirmbag(5)/Whale(6)/Leviathan(7) 及其 finned 版——9×9 上补集恒为更小的鱼，冗余。finned 鱼也止于 jellyfish 大小。
- **Oriented chains / nrczt 3D chains（Berthier）**：解法器/学术专用，非人类实践树。
- **Trial & Error / Bifurcation / Ariadne's Thread / 猜测 / 回溯 / 暴力计数**：红线定义之外。
- **Constraint Subsets**：meta 框架（subset+fish 的统一视角），非离散落子动作。
- **Rank Logic / SET / Phistomefel / Fred intersection theory**：meta 框架或恒等定理；其可实现代表已拆为 MSLS、SK-Loop、Subset Exclusion、Broken Wing、Tridagon 等具名卡。泛化搜索暂不实现。
- **Bivalue Oddagon / Oddagon 泛化**：作为 Broken Wing / Guardians / Tridagon 的理论亲缘记录在 `rank-set-theory.md`；不新增泛用 oddagon 搜索器，除非后续有 727 证据证明具名特例不足。
- **AALS / AAALS / Almost Fish 泛化**：ALS/AIC 的更高阶扩展，搜索空间与 forcing-net 接近；先用 ALS、AHS、AIC with ALS/exotic links 覆盖。
- **Reverse BUG / Reverse ER 等"反向"边角形**：极冷门，列此备查。
- **变体规则**（Jigsaw/Windoku/Killer/Sudoku-X：Law of Leftovers、9 Windows、cage 规则等）：非经典 9×9，727 域外。
- **Multivalue X-Wing**：SudokuWiki 已废弃，被标准 X-Wing/finned fish 吸收。
- **Y-Wing Chains**：SudokuWiki 已标 deprecated，逻辑 ⊂ XY-Chain（见 overlap §2）。
- **M-Wing / M-Ring**（enjoysudoku 论坛别名）：极冷门社区技巧，视为 AIC/XY-Chain 族的非标准命名，不单独实现。

### 重叠 / 包含关系（交叉标注，避免重复实现或独立去重出错）

1. **单数字强链族**：Turbot Fish = skyscraper/2-string-kite/empty-rectangle 的统一 4-链形；X-Cycle = 单数字 Nice Loop；Fishy Cycle = X-Cycle 别名；X-Wing = 长度 4 的连续 X-Cycle。→ 不要实现成 4 个独立探测器，写成"单数字链"统一说明。
2. **链族嵌套**：Remote Pairs ⊂ XY-Chain ⊂ AIC；Y-Wing Chain（已废弃名）⊂ XY-Chain；W-Wing 是短双值链。
3. **链引擎合一**：Grouped AIC / 连续·不连续 Nice Loop / 基础 AIC 是**同一链引擎 + 开关**（分组开关、开链 vs 环），按 feature flag 推进，而非三个技巧。
4. **uniqueness 重叠**：Hidden UR ↔ UR Type 6（对角 hidden）逻辑重叠。
5. **ALS 嵌套**：ALS-XY-Wing 是一般 ALS 链的 len-2 特例。
6. **SdC**：已实现基型 vs "扩展"需界定差异（更大 SdC / 双线 SdC）。
7. **多扇区族**：SK-Loop 是 MSLS 的首发特例（每个 SK-Loop 蕴含一个 MSLS）。
8. **Exocet**：Double Exocet = 两耦合 Exocet；APE/ATE ⊂ Subset Exclusion（非对齐推广）。
9. **染色变体**：X-Colors / Weak Colors / Color Wing / Supercoloring 多被 Multi-Coloring / 3D Medusa 吸收——交叉标注，不单独实现。
10. **Rectangle Elimination**：SudokuWiki 当前将其列为 Tough 策略并说明其替代 Empty Rectangle；实现上仍是 Empty Rectangle / grouped X-Cycle / grouped AIC 的 presentation alias。
11. **Rank/SET 理论族**：MSLS/SK/Phistomefel/Subset Counting/Oddagon 可以互相解释；计划只实现具名、可界定、可测试的子技巧。

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

## 文档缺口 backlog

**卡片书写：✅ 完成（2026-06-23）。** 41 张专卡 + 90 源镜像已登记。

**引擎验证：八轮完成（2026-06-23）。** 自动化入口：`packages/engine/test/worked-examples.test.ts`（`verifyDeductions` 对照暴力解核对消除/落子；`decodeS9B` / `gridFromS9B` 解析 SudokuWiki `Load Example`）。**已通过 69 例**，覆盖：

| 卡 | 验证项 |
|---|---|
| `01-singles` | Full House `r1c1=5` |
| `02-intersections` | Pointing + Claiming 各一例 |
| `03-subsets` | Naked Pair 行 A + Hidden Pair box 3 |
| `04-fish/finned-sashimi` | Finned/Sashimi X-Wing + Swordfish |
| `04-fish/franken-mutant` | HoDoKu Finned Franken Swordfish `r3c7<>8` |
| `05/rectangle-elimination` | `r1c2<>9` |
| `05/broken-wing` | Guardian 1 `r4c7=3`、Guardian 2 `r7c7<>7`、Guardian 3 `r7c4<>1` |
| `05/turbot-family` | HoDoKu Skyscraper `r1c78,r3c45<>1` |
| `06/xy-xyz-w-wings` | XY/XYZ/W-Wing 各一例 |
| `06/bent-sets` | ALTriple via XYZ-Wing 源盘 |
| `07/simple-coloring` | Color Trap `r9c3<>7` |
| `07/multi-coloring` | HoDoKu mc01 `r5c23<>1`、mc02 `r6c2,r7c3,r8c6<>3` |
| `07/3d-medusa` | R1–R5 + R2 FTS/全局 16 格 `<>7`；R2 Exemplars 3/4/5/8 唯一性 |
| `08/xy-chain` | 开链三处消除 |
| `08/aic-with-ur` | Example A `r3c5=2`；Example B explore 3 `r4c6<>9`, `r7c6=6` + explore 4 `r9c5<>5`, `r9c6<>6` |
| `08/twinned-xy-chains` | Example A 十处消除 + S9B 恢复态；B 五行消除；C `r6c3<>3,4` |
| `11-exotic/sue-de-coq` | HoDoKu sdc01/sdc02 + sdc03/sdc04 扩展型 |
| `11-exotic/fireworks` | triple F4 + quad + Exemplars 1–7 唯一性 |
| `11-exotic/exocet` | SudokuWiki Rule 1 `r2c4<>4`, `r3c7<>2,7` |
| `11-exotic/aligned-exclusion` | SudokuWiki APE 例 1/3/4/6 + Brenner 8-cell S9B `r4c5<>1`, `r5c5<>4` |
| `11-exotic/sk-loop` | Easter Monster `r2c5,r2c6<>3,8` + 3-1-3-1 / solved-cell 两例唯一性 |
| `11-exotic/msls` | David P Bird Ex1–3（21 + 17 + 13 处消除） |
| `10/avoidable-rectangle` | HoDoKu ar101/ar102 Type1 + ar201/ar202 Type2 |

**仍待验证（✅\*）** — 规则已写清，消除集或 restored-state 候选网格待核：

- 07：`multi-coloring.md` X-Colors 例 1/3 候选态（Sudopedia 无 81-char，需识图重建）
- 10：`avoidable-rectangle.md` SudokuWiki B4 叙事例（仅压缩 `bd=` 恢复态）
- 11-exotic：`sk-loop.md`（内链消除）、`subset-exclusion.md`

> 验证方式：向 `worked-examples.test.ts` 追加用例 → 通过后更新卡内 FLAG 为 `Verified` 并在此表划掉。Restored-state 候选掩码（post-basics 精确态）可在实现期与策略探测器一并补写。

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
