# Flow / 策略流程文档

> FR-9: 由策略注册表 + 代表性 worked trace 派生的人读流程文档。

## 策略注册表 (按难度排序)

| 难度 | 策略 ID | 名称 | 说明 |
|------|---------|------|------|
| 10 | naked-single | 显眼唯一数 | 唯一候选的单元格直接填入 |
| 10 | full-house | 满宫 | 只有一个空格的单元直接填入 |
| 20 | hidden-single | 隐藏唯一数 | 在单元中唯一位置包含某候选 |
| 25 | locked-candidates | 锁定候选 | 某候选仅出现在行/列/宫的一部分 |
| 30 | naked-subset | 显眼数组 | N格包含恰好N个相同候选 |
| 35 | hidden-subset | 隐藏数组 | N个候选仅出现在N格 |
| 40 | basic-fish | 基础鱼 | 行/列上的候选形成鱼结构 |
| 42 | single-digit-patterns | 单数字模式 | Turbot 家族等模式 |
| 45 | xy-wing | XY翼 | 三格形成的翼结构 |
| 47 | xyz-wing | XYZ翼 | 三格形成的翼结构 |
| 45 | w-wing | W翼 | 双值格桥接强链 |
| 60 | simple-coloring | 简单染色 | 单数字强链双色 |
| 70 | aic | AIC | 交替推理链 |
| 80 | als | ALS | 几乎锁定集 |
| 90 | uniqueness | 唯一性 | UR/AR/BUG (可选) |
| 95 | sue-de-coq | Sue de Coq | 行宫交叉区域分析 |
| 100 | forcing-chain | 强制链 | 最后手段 |

## 求解流程

### 第一阶段: 基础 (难度 10-30)

1. **检查是否已解** - 扫描是否有已填满的单元
2. **满宫 (full-house)** - 只有一个空格的单元
3. **显眼唯一数 (naked-single)** - 只有一个候选的格子
4. **隐藏唯一数 (hidden-single)** - 在单元中某数字只有一个位置
5. **锁定候选 (locked-candidates)** - 候选被限制在行/列/宫的一部分

### 第二阶段: 中级 (难度 30-50)

6. **显眼数组 (naked-subset)** - 2-4格包含相同N个候选
7. **隐藏数组 (hidden-subset)** - N个候选仅出现在N格
8. **基础鱼 (basic-fish)** - X-Wing, Swordfish 等
9. **单数字模式 (single-digit-patterns)** - Turbot, Skyscraper
10. **XY翼 / XYZ翼 / W翼** - 翼结构消数

### 第三阶段: 高级 (难度 60-80)

11. **简单染色 (simple-coloring)** - 双色链 trap/wrap
12. **AIC (交替推理链)** - 强链-弱链交替
13. **ALS (几乎锁定集)** - ALS-XZ, Death Blossom 等

### 第四阶段: 专家 (难度 90-100)

14. **唯一性技巧 (uniqueness)** - UR, AR, BUG
15. **Sue de Coq** - 行宫交叉区域分析
16. **强制链 (forcing-chain)** - 最后手段

## 流程决策树

```
开始
  ↓
是否有已填满的单元? → yes → full-house
  ↓ no
是否有单候选格? → yes → naked-single
  ↓ no
扫描行/列/宫是否有隐藏唯一? → yes → hidden-single
  ↓ no
是否有锁定候选? → yes → locked-candidates
  ↓ no
是否有显眼数组? → yes → naked-subset
  ↓ no
是否有隐藏数组? → yes → hidden-subset
  ↓ no
是否有基础鱼? → yes → basic-fish
  ↓ no
是否有翼结构? → yes → xy-wing / xyz-wing / w-wing
  ↓ no
是否有简单染色? → yes → simple-coloring
  ↓ no
是否有 AIC? → yes → aic
  ↓ no
是否有 ALS? → yes → als
  ↓ no
是否启用唯一性技巧? → yes → uniqueness
  ↓ no
是否有 Sue de Coq? → yes → sue-de-coq
  ↓ no
是否有强制链? → yes → forcing-chain
  ↓ no
无法继续 → stuck
```

## 代表性 Trace 示例

### Easy Puzzle
```
initial: 530070000600195000098000060800060003400803001700020006060000280000419005000080079
steps:
  - hidden-single: R5C5=3
  - locked-candidates: eliminate 7 from R4C6
  - naked-subset: eliminate from R1
  ...
outcome: solved
```

### Hard Puzzle
```
initial: [hard puzzle string]
steps:
  - hidden-single: ...
  - basic-fish: ...
  - xy-wing: ...
  - simple-coloring: ...
  - aic: ...
  ...
outcome: solved or stuck
```

## 策略选择原则

1. **最小难度优先**: 选择能产生进展的最低难度策略
2. **消数效果最大化**: 优先选择消数更多的策略
3. **链可视化**: 链类策略提供 links 用于 UI 可视化
4. **健全性保证**: 所有策略必须保证不产生与真解矛盾的消除

## 流程自动化

Solver 按难度递增顺序尝试所有策略，直到:
- 盘面已解 (outcome: solved)
- 无策略可应用 (outcome: stuck)

每次策略应用后重新计算候选数，并从头开始扫描（确保简单策略有优先级）。

(End of file - total 127 lines)