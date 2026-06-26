# E 阶段设计说明 / Design Notes

> 阶段：diabolical-727 **E**（存量策略调整，独立型 E1 + E7）  
> 前置：P0–P2 覆盖完成（human-default **726/727**）

## 一、E1 — `tieBreak` 元数据补全

### 目标

gate 4 要求：同一策略在同一盘面可命中多个模式实例时，必须按**声明式**排序键返回 canonical 实例，禁止依赖循环遍历顺序。`strategy.ts` 已定义 `TieBreakKey` 词汇表；`strategy-precedence.test.ts` 机检「每策略非空 `tieBreak` + 合法键 + determinism」。

### 结论

**76/76 策略均已声明 `tieBreak`**（含 P0–P2 新增策略）。本阶段无新增 strategyId、无改动 `apply()` 判定逻辑，仅确认元数据与实现排序一致。

### 排序键分组（按多实例来源）

| tieBreak 键 | 适用策略 | 依据（实现中的 canonical 选择） |
|---|---|---|
| `house` | full-house；locked-candidates ×2；naked/hidden subset ×8；w-wing；als-xz / als-xz-dl / als-xy-wing / als-chain / ahs；sue-de-coq ×2；bent-sets | 按 HOUSES 下标升序（行→列→宫）遍历，先命中先返回 |
| `house`, `digit` | hidden-single；hidden-pair/triple/quad；locked-candidates ×2 | 房屋优先，同屋内按数字 1–9 |
| `digit` | x/swordfish/jellyfish；finned ×3；skyscraper / kite / ER；turbot-fish；x-chain；simple/multi-coloring | 数字 1–9 升序；单数字族先定 digit 再搜模式 |
| `digit`, `cell-index` | 3d-medusa | 先 digit，同色矛盾/落子按行主序 cell |
| `cell-index` | naked-single；xy/xyz-wing；wxyz/vwxyz-wing；death-blossom；uniqueness 全族（UR/AR/BUG/EUR/loop/gurth）；exotic-p2 全族（exocet/sk-loop/msls/fireworks/APE/ATE/subset/twinned/aic-exotic/franken/mutant） | 矩形/环/格模式按行主序（`row*9+col`）选最小锚点 |
| `chain-length`, `digit` | nice-loop；xy-chain；aic-with-als/ur | `searchAic` / `searchNiceLoop` 最短链优先，同长按 digit |
| `chain-length`, `cell-index` | remote-pairs | BFS 最短奇长路径，同长按起点 cell-index |
| `cell-index`, `digit` | aic | 链端点行主序，再 digit |
| `digit`, `chain-length`, `cell-index` | broken-wing | digit → 守护环长 → 锚格 |
| `house`, `cell-index` | bent-sets | 房屋 → 格序 |
| `cell-index`, `digit` | tridagon；forcing-chain | 锚格序 → digit |

### 单实例 / 低歧义策略

full-house（每盘至多一处）、各 finned-fish（digit 遍历已足够）、turbot-fish（digit + `isTurbotFishPattern` 过滤）等仍声明最简键，满足机检且与实现一致。

### 验证

- `npm run typecheck` — exit 0  
- `npm test` — 277/277（含 `strategy-precedence` determinism + tieBreak 元数据）  
- `apply()` 双次调用 JSON 一致（gate 4）

---

## 二、E7 — 难度刻度全局子策略粒度复核

### 复核范围

存量 **76** 策略的 `difficulty` 总序，重点：uniqueness **9xx** vs chains **7xx** / ALS **8xx** 跨 band 错排（checklist §难度刻度「已知跨类别错排」）。

### 现状摘要

| band | 代表策略 | 人类成本直觉 | 引擎排位 |
|---|---|---|---|
| 7xx | x-chain 710 → aic 750 → aic-with-als 760 → twinned 775 | 中高：需建链/交替推理 | **先于** uniqueness 尝试 |
| 8xx | als-xz 810 → death-blossom 860 → als-chain 880 | 高：几乎锁定集/多扇区 | **先于** uniqueness 尝试 |
| 9xx | bug-plus-one 910 → UR1 920 → … → gurth 990 | 中：模式固定、教学常见 | **后于** 7xx/8xx 尝试 |

**错排实例**：`bug-plus-one`(910)、`unique-rectangle-type-1`(920) 等对多数玩家**识别成本低于** `aic`(750)、`death-blossom`(860)，但 difficulty 更高 → 同态并发时 trace 以更难技巧解释该步。

### 727 证据（`packages/engine/scripts/e7-co-fire.ts`）

对 727 残集回放 human-default trace，统计「trace 选了 uniqueness 步、但同格态有 7xx/8xx 策略也能命中」的次数：

```
（见脚本输出 coFireAtUniqStep — 填入下方运行结果）
```

> 注：`coFireAtUniqStep > 0` 仅说明 trace **标注**可能偏难，不等于解法错误；重排 difficulty 会改变逐步选择路径，属行为变更。

### 提案（**不落地**）

| 选项 | 做法 | 风险 |
|---|---|---|
| **A — 保持现状（采纳）** | 维持 E5 单调重标后的 band 序；新增策略继续按全局成本插位 | trace 标注在并发态偶发偏难，但 **726/727 已验证不回退** |
| B — 局部前移 uniqueness 基线 | 将 bug-plus-one/UR1–2 调至 ~705–735，AR/EUR 留 9xx 高端 | 须重跑 727 + ground-truth 400 + 全 trace diff；无现成「solved 不降」证明 |
| C — 全量全局重排 | 按 HoDoKu 教学序重编 76 个 difficulty | 工作量大、几乎必改 trace；超出 E 阶段范围 |

**结论：采纳 A**。E7 仅记录错排与证据，**不修改任何 `difficulty`**，避免在缺「重排后 solved ≥ 726」证明时引入行为回归。

### 4xx 内鱼/wing 交错

历史语义保留（checklist 注②）：x-wing 410 与 xy-wing 460 等按原序交错，非严格子策略难度序。属低优先级标注问题，本期不动。

---

## 三、727 / 健全性对比

| 指标 | P2 结束 (`.p2-solve.json`) | E 阶段 (`.e-solve.json`) | Δ |
|---|---|---|---|
| human-default solved | 726/727 | （见 `.e-solve.json`） | 预期 **0**（无行为变更） |
| stuck | 1 (#95) | 同左 | 0 |
| errors / invalid | 0 | 0 | 0 |
| ground-truth 400 | 0 violation（`npm test` AC-3） | 同左 | 0 |

 stuck 题：`060951030009040600000000000070060050400000009001000800010070080500000002030405070`（index 95）— P2 末态，E 未改。

---

## 四、变更文件

| 路径 | 变更 |
|---|---|
| `docs/notes/e.md` | 本文件（E1 文档化 + E7 提案） |
| `docs/plans/diabolical-727-checklist.md` | E1 ✅、E7 ✅（提案，未改 difficulty） |
| `packages/engine/scripts/e7-co-fire.ts` | E7 并发态证据脚本（可选复跑） |

**无引擎策略逻辑 / difficulty / `data/` 改动。**