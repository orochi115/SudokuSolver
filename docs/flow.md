# Human Solve Flow (FR-9)

本文由 `packages/engine/src/strategies/index.ts` 的注册顺序与实盘 trace 派生。

## 1. 固定策略顺序

从低到高:

1. `full-house`
2. `naked-single`
3. `hidden-single`
4. `locked-candidates`
5. `naked-subset`
6. `hidden-subset`
7. `basic-fish`
8. `single-digit-patterns`
9. `xy-wing`
10. `xyz-wing`
11. `w-wing`
12. `simple-coloring`
13. `aic`
14. `als`
15. `uniqueness` (可选,默认关闭)
16. `sue-de-coq` (可选,默认关闭)
17. `forcing-chain`

求解器每轮取“第一个可用步骤”,应用后从最便宜策略重新开始。

## 2. 代表性 worked trace 片段

数据源: `data/ground-truth/diabolical.json`

### 案例 A: puzzle[0] (solved, 70 steps)

- 26: `naked-single` (p1/e0)
- 27: `full-house` (p1/e0)
- 28: `aic` (p0/e1)
- 29: `naked-single` (p1/e0)
- 30: `naked-single` (p1/e0)

说明:进入中后盘后,`aic` 提供关键消除,随后回落到 singles 完成推进。

### 案例 B: puzzle[2] (solved, 70 steps)

- 25: `hidden-single` (p1/e0)
- 26: `locked-candidates` (p0/e1)
- 27: `simple-coloring` (p0/e1)
- 28: `locked-candidates` (p0/e1)
- 29: `aic` (p0/e1)

说明:颜色链先打穿候选,再由 AIC 延续链式消除。

### 案例 C: puzzle[8] (stuck, 13 steps)

- 10: `aic` (p0/e1)
- 11: `als` (p0/e1)
- 12: `forcing-chain` (p0/e1)
- 13: `forcing-chain` (p0/e1)

说明:在高难残局中,`forcing-chain` 作为最后手段继续提供消除,但仍可能停滞。

## 3. Diabolical 档策略使用分布(步数)

基于当前求解统计:

- `aic`: 196
- `forcing-chain`: 51
- `als`: 29
- `simple-coloring`: 23

链类/ALS 已成为 diabolical 档的重要推进来源,并与前置基础技巧形成“回落-再推进”的循环。
