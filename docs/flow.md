# Solver Flow — 引擎流程文档 (FR-9)

> 派生自策略注册表 (`strategies/index.ts`) + 代表性 worked trace。
> 版本：1.0 — M3 完成后。

---

## 一、总体架构 / Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    solve(grid, strategies)               │
│  (packages/engine/src/solver.ts)                        │
└────────────────────────┬────────────────────────────────┘
                         │ 按 difficulty 升序排列
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Strategy Loop (贪心最简推理)                            │
│  for each strategy in order:                            │
│    step = strategy.apply(grid)                          │
│    if step: applyStep(grid, step); record; restart      │
│  until solved or stuck                                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                    SolveTrace { steps[], outcome }
```

求解器不修改策略，策略不修改棋盘（纯函数）。

---

## 二、策略注册表 / Strategy Registry

按 difficulty 升序（`packages/engine/src/strategies/index.ts`）：

| ID | 中文名 | difficulty | 层级 |
|----|--------|-----------|------|
| `full-house` | 唯一余数 | 4 | T1 |
| `naked-single` | 裸单 | 10 | T1 |
| `hidden-single` | 隐藏单数 | 10 | T1 |
| `locked-candidates` | 候选数锁定 | 20 | T2 |
| `naked-subset` | 裸子集 | 30 | T2 |
| `hidden-subset` | 隐藏子集 | 30 | T2 |
| `basic-fish` | 基础鱼 (X翼/剑鱼/水母) | 40 | T3 |
| `single-digit-patterns` | 单数字模式 (摩天楼/风筝/空矩形) | 45 | T3 |
| `xy-wing` | XY翼 | 50 | T3 |
| `xyz-wing` | XYZ翼 | 50 | T3 |
| `w-wing` | W翼 | 50 | T3 |
| `simple-coloring` | 简单染色 | 60 | T4 |
| `aic` | 交替推理链 | 70 | T4 |
| `als` | 几乎锁定集 | 80 | T4 |
| `uniqueness` | 唯一性技巧 | 90 | T4 |
| `sue-de-coq` | 苏德蔻 | 95 | T4 |
| `forcing-chain` | 强制链 | 100 | T4 |

---

## 三、代表性 Worked Trace / Worked Traces

### 3.1 Easy — Naked Single 主导

**谜题**: `530070000600195000098000060800060003400803001700020006060000280000419005000080079`

```
Step 0 [naked-single]:    R4C8=6 (只剩一个候选数)
Step 1 [hidden-single]:   R5C2=2 (行内唯一位置)
Step 2 [naked-single]:    R6C3=8
...
Outcome: solved (全 naked-single + hidden-single)
```

**流程**：T1 策略主导，无需更高级技巧。

---

### 3.2 Hard — Locked Candidates + Fish

**谜题**: `000823001003000400070000052300960010000102000010038006830000040002000900600789000`

```
Step 0 [hidden-single]:    R1C9=7
Step 1 [locked-candidates]: digit 4 locked in R2 within B1 → elim from rest of R2
Step 2 [basic-fish]:        X-Wing digit 6 rows [2,6], cols [3,8]
Step 3 [xy-wing]:           pivot R4C6 {1,5}, pincers R4C9 {1,4}, R7C6 {4,5} → elim 4
...
Outcome: solved
```

**流程**：T1→T2→T3 梯次推进。

---

### 3.3 Diabolical — AIC + ALS

**谜题**: `003004050260080340040000001400090000090608010000070009100000070089010026050200100`

```
Step 0-5 [hidden-single, locked-candidates, single-digit-patterns]: 基础推进
Step 6  [aic]:  AIC(3链): R2C3(1) --S--> R2C6(1) --W--> R3C6(1) --S--> ...
                消去公共可见格中的 1
Step 7  [als]:  ALS-XZ: ALS_A = {R3C2,R3C3} cands{1,6,9}, ALS_B = ...
                RCC = 9, 消去 Z=1 from R3C9
...
Step 26 [forcing-chain]: 单格强制链确认 R5C4=3
Outcome: solved
```

**流程说明**：
1. **AIC 发现时机**：当低阶策略耗尽，棋盘仍有多个空格，AIC 引擎扫描所有强链节点，按深度优先搜索（最多14节点）找到有效消去。
2. **ALS 发现时机**：在 AIC 之后，按宫/行/列枚举1-4格的 ALS，检验受限公共候选（RCC）。
3. **强制链兜底**：当所有链式策略均未奏效，最后尝试对每个双/三值格的候选独立假设+裸单传播，找到所有分支均同意的结论。

---

## 四、关键数据结构 / Key Data Structures

### Step（来自 `trace.ts`）
```typescript
interface Step {
  strategyId: string;          // 策略 ID
  placements: CellDigit[];     // 确认填入
  eliminations: CellDigit[];   // 候选消去
  highlights: Highlights;      // 可视化信息
  explanation: { zh, en };     // 双语说明
}
```

### Link（链路径，用于可视化）
```typescript
interface Link {
  from: CellDigit;  // 链的起始候选
  to: CellDigit;    // 链的目标候选
  type: 'strong' | 'weak';  // 强链或弱链
}
```

### AIC 节点编码
内部用 `cell * 10 + digit` 作为整数 key，用 `Set<number>` 跟踪已访问节点，避免环路。

---

## 五、健全性保证 / Soundness

- 策略 `apply()` 不修改 grid（所有修改通过 `solver.ts:applyStep()` 完成）
- `soundness.ts` 对比每步消去/填入与暴力解答案，确保一致性
- AC-3 回归：400 题全量验证零 violation（`npm run solve:rate`）

---

## 六、解出率报告 (AC-4)

M2 基线 vs M3 完成后：

| 难度 | M2 解出率 | M3 解出率 | 提升 |
|------|----------|----------|------|
| easy | 100% | 100% | — |
| medium | 100% | 100% | — |
| hard | 87% | 100% | +13% |
| diabolical | 14% | 99% | **+85%** |
| **总计** | **75.25%** | **99.75%** | **+24.5%** |

主要贡献策略（diabolical 档）：`aic` (240次), `als`, `simple-coloring`, `forcing-chain`

报告详见：`data/reports/solve-rate.json`
