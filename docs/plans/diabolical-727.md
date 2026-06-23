# 人类策略全覆盖路线图（Roadmap ②）

> **定位：** 主 TS 引擎（[`packages/engine/`](../../packages/engine/)）的人类技巧补全计划。目标是做到**人类解法全覆盖、并超越 HoDoKu 的完整度**——理想状态是**不依赖 forcing chain / net 也能 100% 解出** [`../../data/failing-diabolical/`](../../data/failing-diabolical/) 里的 727 道 diabolical。
>
> **资料口径：** 策略定义、分类与优先级**只参考网络数独资料**（SudokuWiki / Sudopedia / sudoku.com / 中文社区等，镜像见 [`research/sudoku-human-solving/`](../../research/sudoku-human-solving/)）；**不参考 HoDoKu 的实现与源码**。HoDoKu 仅作为另一条独立轨道（移植引擎，见 [`research/hodoku-logic/`](../../research/hodoku-logic/)）存在，与本计划解耦。
>
> **727 的角色：** 727 是**经验验证门槛（empirical gate）**，不是计划的组织框架——补齐技巧树后用它度量覆盖率，而非按它逆推该实现什么。

## 目标与红线

- **全覆盖**：实现网络数独资料中成体系的全部人类技巧（见下方技巧目录）。
- **超越 HoDoKu**：完整度对标并超过 HoDoKu，但路径独立得出。
- **避免 forcing net**：forcing nets / 模板枚举 / Kraken / POM 视为**红线**——它们偏向枚举而非"人类解法"。目标是**在动用它们之前**就靠允许的技巧达到 100%。若最终仍有残留，再显式决策是否接受 / 是否在 flag 后有限引入。
- 任何改动若降低全语料 solved 数或引入 invalid，立即停。
- 同一选择反复调三次仍不行，重审架构，而非再堆 tie-break 规则。
- 性能不是本阶段首要目标；缓存只能作为后续独立优化任务，不作为策略正确性的前提。

## Taxonomy 约束（继承 [Roadmap ①](./taxonomy-refactor.md)）

- 新策略必须使用具体的人类技巧 ID，不得塞进宽泛家族名（不要只叫 `fish` / `als` / `chain` 的默认 trace ID）。
- `difficulty` 按**人类识别/学习成本**排序，而不是实现复杂度或运行成本；默认 trace 优先展示更易讲解的技巧。
- 一个 trace step 默认对应一个具体模式实例；同技巧跨实例合并若为控范围保留，必须列为显式 deferred exception。
- 每个新增/增强技巧都要有 restored-state 测试，断言具体 `strategyId`、关键 sound deduction，以及整题 solved/sound 不回退。

## 已实现（31，仅供参照，不再规划）

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

分类对齐研究库的技巧分册 [`research/sudoku-human-solving/local-library/techniques/`](../../research/sudoku-human-solving/local-library/techniques/)（`00-foundations … 12-last-resort`）。每条标注：所属分册、对应研究卡（无则待 A3 新建/抓取）。优先级依据：①SudokuWiki 的人类难度递进；②**用我们自己的引擎探针**对 727 实测的杠杆（不采用任何外部解法器的普查数字）。

### P0 — 高杠杆，复用现有机制（先做）

| 技巧 | 分册 | 研究卡 | 说明 |
|---|---|---|---|
| Finned / Sashimi X-Wing·Swordfish·Jellyfish | 04-fish | 扩展 [`fish-base-cover.md`](../../research/sudoku-human-solving/local-library/techniques/04-fish/fish-base-cover.md)（待补 finned 段） | 现有 fish 的受控扩展（cover set + fin 格）。 |
| Grouped AIC / Grouped Nice Loops | 08-chains-aic | 扩展 [`aic.md`](../../research/sudoku-human-solving/local-library/techniques/08-chains-aic/aic.md)；源 `markdown/sudokuwiki/aic_with_groups.md` | 给链搜索加 **group node**。 |
| 不连续 / 连续 Nice Loop | 08-chains-aic | 同上；源 `markdown/sudokuwiki/x_cycles.md` | 链端点重合 → 强制落子/消除；727 最大族。 |
| XY-Chain（显式） | 08-chains-aic | 源 `markdown/sudokuwiki/xy_chains.md` | 双值格链，AIC 的常见特例。 |
| Hidden Unique Rectangle（Hidden Rectangle） | 10-uniqueness | 扩展 [`unique-rectangle-bug.md`](../../research/sudoku-human-solving/local-library/techniques/10-uniqueness/unique-rectangle-bug.md) | 小而独立的 uniqueness 补充。 |
| UR Type 3 / 5 / 6 | 10-uniqueness | 同上；源 `markdown/sudokuwiki/unique_rectangles.md` | 补齐现有 UR 1/2/4 的其余类型。 |
| Turbot Fish / X-Cycles | 05-single-digit-patterns | [`turbot-family.md`](../../research/sudoku-human-solving/local-library/techniques/05-single-digit-patterns/turbot-family.md)；源 `x_cycles.md` | 与现有 skyscraper / 2-string-kite / empty-rectangle 部分重叠，需在卡里写清关系。 |

### P1 — 标准进阶，中等杠杆

| 技巧 | 分册 | 研究卡 / 源 |
|---|---|---|
| Multi-Coloring | 07-coloring | 扩展 [`simple-coloring.md`](../../research/sudoku-human-solving/local-library/techniques/07-coloring/simple-coloring.md)；**待抓取**专卡 |
| 3D Medusa | 07-coloring | 源 `markdown/sudokuwiki/3d_medusa.md` |
| ALS-XY-Chain / 一般 ALS 链 | 09-als | 扩展 [`als.md`](../../research/sudoku-human-solving/local-library/techniques/09-als/als.md)；源 `almost_locked_sets.md` |
| WXYZ-Wing | 06-wings | 扩展 [`xy-xyz-w-wings.md`](../../research/sudoku-human-solving/local-library/techniques/06-wings/xy-xyz-w-wings.md)；**待抓取** |
| Remote Pairs | 06-wings | 同上；**待抓取** |
| Avoidable Rectangle Type 1/2 | 10-uniqueness | 扩展 `unique-rectangle-bug.md`；**待抓取** |
| Unique Loops / BUG 变体 | 10-uniqueness | 源 `markdown/sudokuwiki/bug.md` |
| AIC with ALS nodes | 08-chains-aic | 源 `markdown/sudokuwiki/aic_with_alss.md` |
| AIC with UR / grouped nodes | 08-chains-aic | 源 `markdown/sudokuwiki/aic_with_urs.md` |

### P2 — 罕见 / 异域，低频

| 技巧 | 分册 | 研究卡 / 源 |
|---|---|---|
| Exocet（Junior / Senior） | 11-exotic | [`exocet.md`](../../research/sudoku-human-solving/local-library/techniques/11-exotic/exocet.md) |
| SK-Loop | 11-exotic | [`sk-loop.md`](../../research/sudoku-human-solving/local-library/techniques/11-exotic/sk-loop.md) |
| MSLS（Multi-Sector Locked Sets） | 11-exotic | [`msls.md`](../../research/sudoku-human-solving/local-library/techniques/11-exotic/msls.md) |
| Fireworks | 11-exotic | [`fireworks.md`](../../research/sudoku-human-solving/local-library/techniques/11-exotic/fireworks.md) |
| Aligned Pair / Triple Exclusion (APE/ATE) | 11-exotic | [`aligned-exclusion.md`](../../research/sudoku-human-solving/local-library/techniques/11-exotic/aligned-exclusion.md) |
| Sue de Coq 扩展 | 11-exotic | [`sue-de-coq.md`](../../research/sudoku-human-solving/local-library/techniques/11-exotic/sue-de-coq.md) |
| Franken / Mutant fish | 04-fish | **待抓取**（SudokuWiki / 论坛等非 HoDoKu 源） |

### P3 — 最后手段 / 红线（默认不实现；仅在确需时 flag 后引入）

| 技巧 | 分册 | 研究卡 / 源 |
|---|---|---|
| Forcing Nets（cell / region / contradiction） | 12-last-resort | [`forcing-vs-enumeration.md`](../../research/sudoku-human-solving/local-library/techniques/12-last-resort/forcing-vs-enumeration.md)；源 `forcing_nets.md` |
| Kraken Fish | 12-last-resort | 同上 |
| Pattern Overlay Method (POM) | 12-last-resort | 同上 |
| Templates / Bowman Bingo | 12-last-resort | 同上 |

> P3 越过了"人类解法"边界（趋近枚举）。项目目标是在动用 P3 **之前**达到 100%；若仍有残留再显式决策。

## 实施方法

1. **聚类 727**（用我们自己的引擎探针，非外部解法器）：对每个 stuck 终局记录空格数、候选掩码、最后若干步策略 ID、各待实现技巧的可用性探针；按"首个可用的缺失技巧族"聚类，得到本仓库自测的杠杆排序。
2. **按 P0 → P1 → P2 顺序、族内按实测产出**推进。
3. **TDD**：先写失败用例（restored-state 定位首个分歧 + 整题），再最小实现新策略/更强变体；遵循 ① 的命名、一步粒度与排序原则。
4. **全语料校验无回退** → 提交 → 下一族。

## 验证（三层模型）

- `data/ground-truth/` 的 `npm test`（AC-3 全 400 题 0 violation）始终保持绿。
- 每修若干题，`npm run corpus:run` 确认 **solved 数不回退、0 invalid**。
- 进度 = 727 中转为 solved 的数量（`corpus:run --difficulty diabolical` 跟踪）；`data/failing-diabolical/` 随策略增加重新生成会逐步缩小。

## 关联

- 研究资料补全（卡片新建 / 网络抓取 / 索引更新）：见 A3，落地于 [`research/sudoku-human-solving/`](../../research/sudoku-human-solving/)。
- 逐格推算难度评估（引导模式）：见 [`difficulty-evaluation.md`](./difficulty-evaluation.md)（本轮仅记录方向）。
- HoDoKu 移植（独立轨道，含上述 727 的纯逻辑普查结果）：见 [`research/hodoku-logic/`](../../research/hodoku-logic/)。
