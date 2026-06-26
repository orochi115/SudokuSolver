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

> 注：① band 内步长留 ~10–20，插入新技巧无需再 renumber。② 4xx 内鱼与短 wing 按**原有顺序**交错（历史语义，未重排）；进阶 wing 归 5xx。③ human-default exotic（1xxx）人类难度可**高于** forcing-chain 的 9000 数字——last-resort band 高隔离只是为了排序末位，不代表「最难」。④ 重排（如把鱼/wing 分到不同 band）会改变默认 trace 选择，属行为变更，**未做**；如需，单独提案 + 707 证据。

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
| `tridagon`（anti-Tridagon / Thor's Hammer） | Tridagon | owner（exotic） | 1100 | ✅ | ☐ |
| `multi-coloring` | Multi-Coloring | owner（coloring）；X-Colors/Weak Colors/Color Wing 等并入（overlap #9） | 620 | ✅ | ☐ |
| `3d-medusa` | 3D Medusa | owner（coloring）；Supercoloring 并入 | 640 | ✅ | ☐ |
| `als-chain`（一般 ALS 链 / ALS-XY-Chain） | ALS-XY-Chain | owner（ALS）；`als-xy-wing` 是其 len-2 特例 | 880 | ✅ | ☐ |
| `ahs`（Almost Hidden Set 作链节点） | AHS | ALS 的对偶；供链引擎复用 | 885 | ✅ | ☐ |
| `wxyz-wing` | WXYZ-Wing | owner（进阶 wing） | 510→ 520 | ✅ | ☐ |
| `remote-pairs` | Remote Pairs | XY-Chain 特例（复用 aic/xy-chain 引擎） | 505 | ✅ | ☐ |
| `bent-sets`（ALP/ALT / Chute Remote Pairs） | Almost Locked Pair/Triple | owner（进阶 wing / bent） | 540 | ✅ | ☐ |
| `broken-wing`（Guardians） | Broken Wing | owner（单数字 / oddagon 亲缘） | 560 | ✅* | ☐ |
| `avoidable-rectangle-type-1..4` | Avoidable Rectangle 1–4 | AR detector（逐型，与 UR 平行） | 945（带子步） | ✅ | ☐ |
| `extended-unique-rectangle` | Extended UR (2×3) | UR detector 扩展 | 980 | ✅ | ☐ |
| `unique-loop` / `bug-lite` / `bug-plus-n` | Unique Loops / BUG 变体 | uniqueness detector 扩展 | 985 | ✅ | ☐ |
| `aic-with-als` | AIC with ALS nodes | AIC 引擎 + ALS 节点（复用 aic owner） | 760 | ✅ | ☐ |
| `aic-with-ur` | AIC with UR / grouped nodes | AIC 引擎 + UR/grouped 节点 | 770 | ✅ | ☐ |

## P2 — 罕见 / 异域

| strategyId | 目录家族 | detector（owner / 共享?） | 拟定 difficulty | 卡 | 状态 |
|---|---|---|---|---|---|
| `vwxyz-wing`（及 size-ladder） | VWXYZ-Wing | wing size-ladder 通项（复用 WXYZ 框架） | 530 | ✅ | ☐ |
| `exocet`（Junior/Senior；Double Exocet 交叉标注） | Exocet | owner（exotic） | 1200 | ✅ | ☐ |
| `sk-loop` | SK-Loop | MSLS 首发特例（每个 SK-Loop 蕴含一个 MSLS） | 1250 | ✅ | ☐ |
| `msls` | MSLS | owner（多扇区） | 1300 | ✅ | ☐ |
| `fireworks` | Fireworks | owner（exotic） | 1050 | ✅ | ☐ |
| `aligned-pair-exclusion` / `aligned-triple-exclusion` | APE / ATE | ⊂ Subset Exclusion（对齐特例） | 1120 / 1130 | ✅ | ☐ |
| `subset-exclusion`（Subset Counting） | Subset Exclusion | owner（APE/ATE 的非对齐推广） | 1140 | ✅ | ☐ |
| `sue-de-coq-extended`（更大 SdC / 双线） | SdC 扩展 | 复用 sue-de-coq owner（界定与基型差异） | 1015 | ✅ | ☐ |
| `aic-with-exotic-links` | AIC with exotic links | AIC 引擎 + exotic 节点 | 780 | ✅ | ☐ |
| `twinned-xy-chains` | Twinned XY-Chains | 复用 xy-chain / aic | 775 | ✅ | ☐ |
| `franken-fish` / `mutant-fish`（含 Endo Fins / Cannibalism / Siamese 呈现） | Franken / Mutant fish | owner（fish 扩展） | 1080 | ✅ | ☐ |
| `gurth`（对称占位） | Gurth's Symmetrical Placement | owner（uniqueness / 对称） | 990 | ✅ | ☐ |

> P3（红线）只在 `diabolical-727.md` 枚举命名，不进本执行清单，除非显式 flag 后决策。

## 已有策略调整 backlog（回应「存量调整是否入计划」）

`diabolical-727.md` 旧措辞「已实现…不再规划」只对**覆盖**成立；**契约 / 重构**层仍有存量任务，列此显式跟踪：

| # | 调整 | 触发 / 原因 | 状态 |
|---|---|---|---|
| E1 | 给现有多实例策略**填 `tieBreak` 元数据** | gate 4 收尾：字段已加、determinism 已测，但声明式排序键尚未逐策略填写 | ☐ |
| E2 | **单数字强链族统一**：评估把 skyscraper/kite/ER 收编进共享 owner | 实现 turbot-fish/x-cycle 时（`overlap.unified: false→true`） | ☐ |
| E3 | **UR 引擎重构**：3 个独立 UR detector → 共享 UR engine | 实现 UR3/5/6 + Hidden UR + AR + EUR 时 | ☐ |
| E4 | **ALS 收编**：通用 `als-chain` 落地后，`als-xy-wing` 降为其特例（alias 或折叠） | 实现 als-chain 时 | ☐ |
| E5 | **难度重标已落地**（2026-06-24）：4–100 → 分层 band | gate 2 + 本清单难度刻度节 | ✅ |
| E6 | **chain 引擎归属落实**：nice-loop 接管 `AicResult` 现有却未返回的 `*-loop` kind；确保 aic 不私自发 loop | 实现 nice-loop 时（boundaries 已声明） | ☐ |

## 推进流程（与 diabolical-727.md §实施方法一致）

1. 选下一个 strategyId（P0→P1→P2，族内按 727 实测杠杆）。
2. 确认其研究卡为 ✅ 实现级；不足则先补卡（见 spec 文档九节模板）。
3. TDD：先写失败的 restored-state 用例（复用卡内 worked example）→ 最小实现 → 全语料无回退。
4. 把该 id 从 `overlap.ts`/`boundaries.ts` 的 `futureMembers`/reserved 移入正式 members；在本表勾选 ✅。
5. 每族完成后 `corpus:run --profile human-default` 记录 727 覆盖率增量；并用此残集做**迭代式杠杆测量**（挑下一个高杠杆技巧）——这取代了旧计划里「一次性前置聚类探针」（对未实现技巧无法探针、对全实现后又无残集，故只在循环中做，见 spec §实施方法 2）。终极 727 以 `--profile last-resort` 口径核对。
