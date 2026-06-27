# Roadmap ② 执行清单（diabolical-727 实施 checklist）

> **定位：** 这是 [`diabolical-727.md`](./diabolical-727.md)（**规格 / 覆盖**文档：what & why，相对稳定）的**配套执行清单**（living tracker：勾选进度、逐 strategyId 拆解、难度刻度、存量调整）。需求与计划分离，避免一个文件越长越乱。
>
> **单一真相源对齐：** 本清单的「具名 strategyId」「canonical owner / 共享 detector」必须与引擎里的 [`overlap.ts`](../../packages/engine/src/strategies/overlap.ts)（`OVERLAP_FAMILIES` / `futureMembers`）与 [`chain/boundaries.ts`](../../packages/engine/src/chain/boundaries.ts) 保持一致；实现一个 strategyId 时，把它从对应 family 的 `futureMembers` 移入 `members`，并在此勾选。
>
> **粒度原则（回应「避免一个 step 跑完一大家族」）：** `diabolical-727.md` 的待实现目录是**家族/覆盖**视角；本清单把每个家族行**拆成具体 strategyId**——每个 strategyId 是一个独立的实现 + trace 命名单元（gate 5：一个 step = 一个具体模式实例）。但「拆 strategyId」≠「拆 detector」：同一 overlap family 可**共享一个搜索 detector**（canonical owner），只是发不同的具名 ID / presentation（gate 3）。下表「detector」列标明。

## 难度刻度（gate 2 重标方案，2026-06-24）

`difficulty` 标量按**人类识别 / 学习成本**排序，并已从旧的 4–100 密集刻度**整体重标**为留有插入空间的分层 band（单调变换，保持原有相对顺序不变 → 解法行为不变；仅腾出插槽并隔离 last-resort）。

| band | 含义 | 已分配（现有 31 策略） | 预留给（待实现） |
|---|---|---|---|
| 1xx | singles | full-house 100 / naked-single 150 / hidden-single 170 | — |
| 2xx | intersections | lc-pointing 210 / lc-claiming 220 | — |
| 3xx | subsets | naked/hidden pair 310/320、triple 330/340、quad 350/360 | — |
| 4xx | 基础鱼 + 短 wing | x-wing 410、skyscraper 420、kite 430、ER 440、swordfish 450、xy-wing 460、xyz-wing 470、w-wing 480、jellyfish 490 | finned/sashimi fish（贴近各 base size） |
| 5xx | 进阶 wing / 进阶单数字 | —（空 band） | WXYZ/VWXYZ-wing、remote-pairs、bent-sets、turbot-fish、broken-wing |
| 6xx | coloring | simple-coloring 610 | multi-coloring、3d-medusa |
| 7xx | chains / AIC | x-chain 710、aic 750 | nice-loop、xy-chain、grouped-aic（switch）、aic-with-als/ur/exotic |
| 8xx | ALS / AHS | als-xz 810、als-xz-dl 820、als-xy-wing 840、death-blossom 860 | ahs、general als-chain |
| 9xx | uniqueness | bug-plus-one 910、ur1 920、ur2 930、ur4 950 | ur3/5/6、hidden-ur、AR1–4、EUR、unique-loops、gurth |
| 1xxx | exotic | sue-de-coq 1010 | tridagon、exocet、sk-loop、msls、fireworks、APE/ATE、subset-exclusion、franken/mutant |
| 9xxx | last-resort / 红线 | forcing-chain 9000 | forcing nets、kraken、POM、templates、GEM |

### 已知跨类别错排 & 排序原则（回应「按类别分段 vs 子策略全局排序」）

> **引擎事实：** `difficulty` 是引擎**唯一的全局总序**（`packages/engine/src/strategies/index.ts` 按 difficulty 升序、取**第一个命中**、禁止重复，`test/strategy-profiles.test.ts` 机检）。因此 band 方案**就是** trace 选择顺序——跨类别错排会让引擎在「更难技巧先命中」时，用它解释本可用更易技巧完成的一步。

- **承认局限**：band 按**类别**切分，不是子策略粒度的全局人类成本排序，故存在跨类别错排。例证（现有 31）：
  - uniqueness（`bug-plus-one` 910 / `unique-rectangle-type-1` 920…）人类**识别成本通常低于** `aic` 750、`death-blossom` 860，却被排在其后 → 两者同时命中时引擎先试更难者并以其解释该步。
  - 4xx 内鱼与短 wing 按**历史顺序**交错，非真实难度序（见注②）。
- **前向排序原则（本期新增子策略适用，不改存量行为）**：新增 strategyId 的 `difficulty` 按**全局人类识别/学习成本**插位，**band 仅作提示而非硬约束**——允许「靠后类别」的简单子策略取得比「靠前类别」更低的数字（例：`remote-pairs` 作为短双值链，可低于 `w-wing` 480，而非机械塞进 5xx 末尾）。因为只动新插入项，故不改现有解法行为。
- **存量错排**不在本期重排（属行为变更，见注④/⑤），留待 [`已有策略调整 backlog`](#已有策略调整-backlog回应存量调整是否入计划) 的 **E7** 用 707 证据复核。

> 注：① band 内步长留 ~10–20，插入新技巧无需再 renumber。② 4xx 内鱼与短 wing 按**原有顺序**交错（历史语义，未重排）；进阶 wing 归 5xx。③ human-default exotic（1xxx）人类难度可**高于** forcing-chain 的 9000 数字——last-resort band 高隔离只是为了排序末位，不代表「最难」。④ 重排（如把鱼/wing 分到不同 band）会改变默认 trace 选择，属行为变更，**未做**；如需，单独提案 + 707 证据。⑤ band 是**提示而非硬约束**：新增子策略按全局人类成本插位（可跨 band 取更低数字）；存量跨类别错排（如 uniqueness vs chains/ALS）的重排为行为变更，统一收敛到 E7。

## 727 进度基线与量表

- **量表工具**：`npm run solve:list -- --profile <human-default|last-resort> [--file <path>] [--out f.json]`（[`packages/engine/scripts/solve-list.ts`](../../packages/engine/scripts/solve-list.ts)）——对 `data/failing-diabolical/puzzles.txt` 跑引擎、报 solved/stuck/invalid，**不重跑 11.9 万全档**。每实现一个策略后跑它看 727 增量。
- **基线（2026-06-26，实现任何新策略前）**：human-default **0/727**、last-resort **0/727**（均 0 invalid / 0 error）。last-resort 也为 0 → 确认 727 是真实残集（全策略含 forcing-chain 仍全 stuck），未陈旧。进度 = human-default 的 solved 数从 0 往上走。

## 状态图例

☐ 未开始 · ◐ 进行中 · ✅ 完成（detector + restored-state 测试 + 卡 Verified + 全语料无回退）。「卡」列引用 `diabolical-727.md` 文档状态。

## P0 — 高杠杆（先做）

| strategyId | 目录家族 | detector（owner / 共享?） | 拟定 difficulty | 卡 | 状态 |
|---|---|---|---|---|---|
| `finned-x-wing` / `finned-swordfish` / `finned-jellyfish`（sashimi = 缺角退化，同 detector） | Finned/Sashimi fish | 共享 finned-fish detector（fish family 扩展），按 base size 发具名 ID | 415 / 455 / 495 | ✅ | ☐ |
| `nice-loop` | 连续/不连续 Nice Loop | **owner**（chains）；连续/不连续是 kind 非两策略 | 720 | ✅ | ☐ |
| `xy-chain` | XY-Chain | 复用 AIC chain 引擎（aic family member）；Remote Pairs ⊂ XY-Chain | 715 | ✅ | ☐ |
| `turbot-fish` | Turbot Fish / X-Cycles | 复用单数字强链 owner `x-chain`（presentation 别名） | 510 | ✅ | ☐ |
| `x-cycle` | 同上（单数字 Nice Loop） | = `nice-loop` 的单数字特例（别名 / 同 detector） | （别名） | ✅ | ☐ |
| `hidden-unique-rectangle` | Hidden UR | UR detector 扩展（与 UR Type 6 逻辑重叠） | 935 | ✅ | ☐ |
| `unique-rectangle-type-3` / `-type-5` / `-type-6` | UR Type 3/5/6 | UR detector 扩展（逐型） | 940 / 960 / 970 | ✅ | ☐ |
| — | Rectangle Elimination | **不新增**：吸收进 empty-rectangle / grouped X-Cycle / grouped AIC 的 presentation alias（overlap #10） | — | ✅ | n/a |
| — | Grouped AIC / Grouped Nice Loops | **不新增策略**：`grouped` 是 `buildLinkGraph` 的开关，复用 x-chain/aic/nice-loop（boundaries） | — | ✅ | n/a |

## P1 — 标准进阶

| strategyId | 目录家族 | detector（owner / 共享?） | 拟定 difficulty | 卡 | 状态 |
|---|---|---|---|---|---|
| `tridagon`（anti-Tridagon / Thor's Hammer） | Tridagon | owner（exotic） | 1100 | ✅ | ✅ |
| `multi-coloring` | Multi-Coloring | owner（coloring）；X-Colors/Weak Colors/Color Wing 等并入（overlap #9） | 620 | ✅ | ✅ |
| `3d-medusa` | 3D Medusa | owner（coloring）；Supercoloring 并入 | 640 | ✅ | ✅ |
| `als-chain`（一般 ALS 链 / ALS-XY-Chain） | ALS-XY-Chain | owner（ALS）；`als-xy-wing` 是其 len-2 特例 | 880 | ✅ | ✅ |
| `ahs`（Almost Hidden Set 作链节点） | AHS | ALS 的对偶；供链引擎复用 | 885 | ✅ | ✅ |
| `wxyz-wing` | WXYZ-Wing | owner（进阶 wing） | 510→ 520 | ✅ | ✅ |
| `remote-pairs` | Remote Pairs | XY-Chain 特例（复用 aic/xy-chain 引擎） | 505 | ✅ | ✅ |
| `bent-sets`（ALP/ALT / Chute Remote Pairs） | Almost Locked Pair/Triple | owner（进阶 wing / bent） | 540 | ✅ | ✅ |
| `broken-wing`（Guardians） | Broken Wing | owner（单数字 / oddagon 亲缘） | 560 | ✅* | ✅ |
| `avoidable-rectangle-type-1..4` | Avoidable Rectangle 1–4 | AR detector（逐型，与 UR 平行） | 945（带子步） | ✅ | ✅ |
| `extended-unique-rectangle` | Extended UR (2×3) | UR detector 扩展 | 980 | ✅ | ✅ |
| `unique-loop` / `bug-lite` / `bug-plus-n` | Unique Loops / BUG 变体 | uniqueness detector 扩展 | 985 | ✅ | ✅ |
| `aic-with-als` | AIC with ALS nodes | AIC 引擎 + ALS 节点（复用 aic owner） | 760 | ✅ | ✅ |
| `aic-with-ur` | AIC with UR / grouped nodes | AIC 引擎 + UR/grouped 节点 | 770 | ✅ | ✅ |

## P2 — 罕见 / 异域

| strategyId | 目录家族 | detector（owner / 共享?） | 拟定 difficulty | 卡 | 状态 |
|---|---|---|---|---|---|
| `vwxyz-wing`（及 size-ladder） | VWXYZ-Wing | wing size-ladder 通项（复用 WXYZ 框架） | 530 | ✅ | ✅ |
| `exocet`（Junior/Senior；Double Exocet 交叉标注） | Exocet | owner（exotic） | 1200 | ✅ | ✅ |
| `sk-loop` | SK-Loop | MSLS 首发特例（每个 SK-Loop 蕴含一个 MSLS） | 1250 | ✅ | ✅ |
| `msls` | MSLS | owner（多扇区） | 1300 | ✅ | ✅ |
| `fireworks` | Fireworks | owner（exotic） | 1050 | ✅ | ✅ |
| `aligned-pair-exclusion` / `aligned-triple-exclusion` | APE / ATE | ⊂ Subset Exclusion（对齐特例） | 1120 / 1130 | ✅ | ✅ |
| `subset-exclusion`（Subset Counting） | Subset Exclusion | owner（APE/ATE 的非对齐推广） | 1140 | ✅ | ☐ |
| `sue-de-coq-extended`（更大 SdC / 双线） | SdC 扩展 | 复用 sue-de-coq owner（界定与基型差异） | 1015 | ✅ | ☐ |
| `aic-with-exotic-links` | AIC with exotic links | AIC 引擎 + exotic 节点 | 780 | ✅ | ☐ |
| `twinned-xy-chains` | Twinned XY-Chains | 复用 xy-chain / aic | 775 | ✅ | ☐ |
| `franken-fish` / `mutant-fish`（含 Endo Fins / Cannibalism / Siamese 呈现） | Franken / Mutant fish | owner（fish 扩展） | 1080 | ✅ | ☐ |
| `gurth`（对称占位） | Gurth's Symmetrical Placement | owner（uniqueness / 对称） | 990 | ✅ | ☐ |

## P3 — 最后手段 / 红线（仅 last-resort，隔离 human-default）

> **隔离声明（硬约束）：** P3 每个 strategyId 实现时其 id **必须加入 `LAST_RESORT_IDS`**（[`profiles.ts`](../../packages/engine/src/strategies/profiles.ts) 第 31 行），**绝不进 `HUMAN_DEFAULT_STRATEGIES`**；727 进度（human-default 口径）**不计** P3。human-default「在 P3 之前达 100%」的项目目标**不变**——本期实现 P3 只为强化 `last-resort` 回归守门与完整度（参照 HoDoKu 全 727 纯逻辑、其中 ~303 需 forcing nets）。

| strategyId | 目录家族 | detector（owner / 共享?） | 拟定 difficulty | 卡 | profile | 状态 |
|---|---|---|---|---|---|---|
| `forcing-chain`（现存） | Forcing Chains | owner（last-resort） | 9000 | ◇ | last-resort（✅已隔离） | ✅ |
| `digit-forcing-chain` / `nishio-forcing-chain` / `cell-forcing-chain` / `region-forcing-chain` / `dic`(Double Implication Chain) | Forcing Chains 子类 | 复用 forcing 引擎（按起点/区类型发具名 ID） | 9010 / 9020 / 9030 / 9040 / 9050 | ◇边界卡 | last-resort | ☐ |
| `forcing-net`（cell/region/contradiction/verity 为 kind） | Forcing Nets | owner（last-resort） | 9100 | ◇边界卡 | last-resort | ☐ |
| `kraken-fish`（Type1/Type2 为 kind） | Kraken Fish | fish + chains 组合（red-line） | 9200 | ◇边界卡 | last-resort | ☐ |
| `tabling`（Trebor's Tables） | Tabling | owner（枚举类） | 9300 | ◇边界卡 | last-resort | ☐ |
| `pom`（Pattern Overlay Method） | POM | owner（枚举类） | 9400 | ◇边界卡 | last-resort | ☐ |
| `templates`（Bowman's Bingo） | Templates | owner（枚举类） | 9500 | ◇边界卡 | last-resort | ☐ |
| `gem`（Graded Equivalence Marks / Braid Analysis） | GEM | owner（临近枚举） | 9600 | ◇边界卡 | last-resort | ☐ |

> 注：① 拟定 difficulty 全在 9xxx band、互不重复、与现有 `forcing-chain` 9000 不撞——满足 `index.ts` 的 no-tie 不变量；band 内步长留 ~10–100 便于插入。② 实现前须把对应 ◇边界卡升级到实现级九节模板（spec §实现级研究卡模板），与 P0–P2 同；这些卡当前是 `diabolical-727.md` §P3 的边界卡。③ 与 spec 一致性：`diabolical-727.md` §P3 写「默认不实现；仅在确需时 flag 后引入」——「实现为 last-resort-only」即该 flag 形态，二者不冲突。

## 已有策略调整 backlog（回应「存量调整是否入计划」）

> **定位（本期上调）：** 这些是执行计划的一等公民，**优先级高于红线 P3**——见下方引言与[推进流程](#推进流程与-diabolical-727md-实施方法一致)。

`diabolical-727.md` 旧措辞「已实现…不再规划」只对**覆盖**成立；**契约 / 重构**层仍有存量任务。**这些是执行计划的一等公民，不是旁支 backlog**：作为人类技巧轨的契约/重构工作，**优先级高于红线 P3**，须在动用 P3 之前完成。

按**与新策略的耦合关系**分两类（决定其落地时机，见下表「归类」列）：

- **耦合型（E2/E3/E4/E6）**：与某个新策略的实现强耦合，**在其触发策略落地的同一步内一并完成**，不单独排期（E2↔turbot/x-cycle、E3↔UR3/5/6+Hidden UR+AR+EUR、E4↔als-chain、E6↔nice-loop）。它们随 P0/P1 自然先于 P3。
- **独立型（E1、E7）**：**不依赖任何新策略**，只动存量策略（E1 给现有多实例策略补 `tieBreak`；E7 存量难度刻度复核）。可随时做，也可作为一个独立的**存量策略调整步**集中处理——该步天然落在覆盖类工作（P0–P2）之后、红线 P3 之前。

| # | 调整 | 归类 | 触发 / 原因 | 状态 |
|---|---|---|---|---|
| E1 | 给现有多实例策略**填 `tieBreak` 元数据** | **独立**（存量策略调整步） | gate 4 收尾：字段已加、determinism 已测，但声明式排序键尚未逐策略填写 | ☐ |
| E2 | **单数字强链族统一**：评估把 skyscraper/kite/ER 收编进共享 owner | **耦合 P0** | 实现 turbot-fish/x-cycle 时（`overlap.unified: false→true`） | ☐ |
| E3 | **UR 引擎重构**：3 个独立 UR detector → 共享 UR engine | **耦合 P0**（AR/EUR 部分随 P1） | 实现 UR3/5/6 + Hidden UR + AR + EUR 时 | ☐ |
| E4 | **ALS 收编**：通用 `als-chain` 落地后，`als-xy-wing` 降为其特例（alias 或折叠） | **耦合 P1** | 实现 als-chain 时 | ✅ |
| E5 | **难度重标已落地**（2026-06-24）：4–100 → 分层 band | —（已完成） | gate 2 + 本清单难度刻度节 | ✅ |
| E6 | **chain 引擎归属落实**：nice-loop 接管 `AicResult` 现有却未返回的 `*-loop` kind；确保 aic 不私自发 loop | **耦合 P0** | 实现 nice-loop 时（boundaries 已声明） | ☐ |
| E7 | **难度刻度全局子策略粒度复核**：评估是否重排存量 31（尤其 uniqueness 9xx vs chains 7xx / ALS 8xx）使其按真实人类成本全局排序 | **独立**（存量策略调整步，仅复核/提案） | 用户质疑 band 跨类别错排（见[难度刻度节](#已知跨类别错排--排序原则回应按类别分段-vs-子策略全局排序)）；属行为变更（注④/⑤），须单独提案 + 707 证据 + 回归无降级方可落地 | ☐ |

## 推进流程（与 diabolical-727.md §实施方法一致）

**执行模型（优先级 ≠ 时序，避免当成瀑布相位）：** 下面是**选下一步的优先级**与**红线门槛**，不是「做完一相再做下一相」的 Phase。
- **P0 → P1 → P2**：技巧实现的优先级桶，大体按序，族内按 727 实测杠杆微调（见步骤 5）。
- **E 项（存量调整）按耦合关系分两类**（见 [backlog 表](#已有策略调整-backlog回应存量调整是否入计划) 的「归类」列）：
  - **耦合型 E2/E3/E4/E6** 与具体技巧**耦合**，在其触发策略落地的**同一步**内一并完成（E2↔turbot/x-cycle、E3↔UR 系、E4↔als-chain、E6↔nice-loop），**不**攒到 P2 之后再做——把耦合型 E 当成「P2 之后的一个阶段」会与「E6 在实现 nice-loop(P0) 时做」直接矛盾。
  - **独立型 E1/E7** 不依赖任何新策略、只动存量策略，随时可做；也可在覆盖类工作（P0–P2）收尾后、动用 P3 之前作为一个独立的**存量策略调整步**集中处理。
- **唯一硬时序不变量**：动用任何 P3 之前，human-default 须达 100% **且**所有被触发的 E 项已结清——这就是「E 优先级高于 P3」的**可执行**含义（门槛，非排期）。P3 仅进 last-resort 轨。

1. 选下一个 strategyId（P0→P1→P2，族内按 727 实测杠杆；human-default 全覆盖收尾后才动 P3）。
2. 确认其研究卡为 ✅ 实现级；不足则先补卡（见 spec 文档九节模板）。
3. TDD：先写失败的 restored-state 用例（复用卡内 worked example）→ 最小实现 → 全语料无回退。
4. 把该 id 从 `overlap.ts`/`boundaries.ts` 的 `futureMembers`/reserved 移入正式 members；在本表勾选 ✅。**若为 P3 策略**，额外把 id 加入 [`profiles.ts`](../../packages/engine/src/strategies/profiles.ts) 的 `LAST_RESORT_IDS`，并断言它**不出现在** `HUMAN_DEFAULT_STRATEGIES`（呼应 `strategy-profiles.test.ts`），确保不污染 human-default。
5. 每族完成后 `corpus:run --profile human-default` 记录 727 覆盖率增量；并用此残集做**迭代式杠杆测量**（挑下一个高杠杆技巧）——这取代了旧计划里「一次性前置聚类探针」（对未实现技巧无法探针、对全实现后又无残集，故只在循环中做，见 spec §实施方法 2）。终极 727 以 `--profile last-resort` 口径核对（P3 增量在此口径体现）。
