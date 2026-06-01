# Forcing Chain Boundary Rules (FR-8)

> 版本：1.0 — 对应 M3 实现

## 目的

本文档定义"人类可接受逻辑"的边界，区分何种链推理属于可展示给用户的正当技巧，何种属于伪装的枚举搜索，应禁用或显式标记。

This document defines the boundary between "human-acceptable logic" and "disguised enumeration" for chain-based deductions. It governs the `forcing-chain` strategy and the wider AIC engine.

---

## 一、核心原则 / Core Principle

**人类可接受（Human-Acceptable）**: 推理链从单一前提出发，沿有限步的强/弱交替推进，无分叉；任何受过训练的求解者都能用铅笔在棋盘上追踪并验证。

**伪装枚举（Disguised Enumeration）**: 通过多分叉树形搜索寻找矛盾，本质上是试错回溯，即使有链式外表，仍属于暴力方法。

---

## 二、人类可接受的推理 / Allowed

### 2.1 交替推理链（AIC）—— `aic`
- **定义**：候选数节点之间的强/弱交替链，深度 ≤ 14 个节点（本引擎上限）。
- **允许的端点推论**：
  - Type 1：相同数字两端 → 消去公共可见格中的该数字
  - Type 2：不同数字同格两端 → 消去该格的其余候选
  - 不连续回路（起点 via 强链回路）→ 确认该起点为真（填入）
- **条件**：链不分叉，严格交替，起点和终点均连接于强链。

### 2.2 简单染色（Simple Coloring）—— `simple-coloring`
- **定义**：单数字强链的双色染色，组件内颜色交替。
- **允许的推论**：
  - 颜色陷阱（Trap）：某格同时看到两种颜色 → 消去该格该数字
  - 颜色矛盾（Wrap）：同色两格互相可见 → 该色全为假，另一色全为真
- **条件**：组件连通，颜色严格交替。

### 2.3 ALS 推理 —— `als`
- **定义**：几乎锁定集，N 格含 N+1 候选数。
- **允许的推论**：
  - ALS-XZ：两个 ALS 通过受限公共候选 X 连接 → 消去外部 Z
  - ALS-XY 翼：三个 ALS 链式连接
  - 死亡之花（2 瓣）：双值茎格连接两个 ALS 花瓣
- **条件**：ALS 必须在单个宫/行/列内（或互相可见）；受限公共候选必须非空（非空判断）。

### 2.4 强制链（有界）—— `forcing-chain`
- **定义**：从一个格（2–4 候选）或一个宫/行/列中数字的各位置出发，各自假设并传播裸单。
- **允许的推论**：
  - 假设某候选导致矛盾（某格 0 个候选）→ 消去该候选
  - 所有候选均推出相同的某格填数 → 填入该数
  - 宫/行/列中某数 2 个位置，一个导致矛盾 → 另一个为真
- **传播限制**：仅传播裸单（Naked Single），最多 50 步；禁止传播隐藏单数（避免复杂错误）。

---

## 三、禁用 / 显式标记的推理 / Forbidden or Must-Be-Marked

### 3.1 Nishio（试错反证）
- **描述**：假设某候选，若最终导致矛盾（任意深度），则消去该候选。
- **禁用原因**：深度无限制，本质等同于暴力搜索，对用户不可追踪。
- **引擎处置**：未实现；若需实现，必须标记 `kind: 'nishio'` 并通过 `allowNishio` 配置项控制（默认关）。

### 3.2 多分叉强制网络（Forcing Nets）
- **描述**：从多个前提同时分叉，形成树形搜索。
- **禁用原因**：非线性，人类无法手工追踪。
- **引擎处置**：本引擎 `forcing-chain` 仅允许单分支（cell 或 house 的各候选 **独立** 传播，然后 **归并** 结论，不形成树）。

### 3.3 任意深度回溯（Backtracking）
- **描述**：通过 DFS + 撤销实现的完全回溯求解器。
- **禁用原因**：非人类逻辑，属于计算机算法。
- **引擎处置**：`bruteforce.ts` 提供此功能，但不注册为 Strategy，不参与 `solve()` 流程。

### 3.4 模板枚举（Template Enumeration）
- **描述**：枚举所有可能的数字放置模板，取交集得出结论。
- **禁用原因**：指数复杂度，不对应任何人类思维过程。
- **引擎处置**：未实现。

---

## 四、引擎配置项 / Engine Configuration

以下配置项通过 `solve()` 的 `strategies` 参数控制：

```typescript
// 包含唯一性策略（假设唯一解）
import { uniqueness } from './strategies/uniqueness.js';
const withUniqueness = [...STRATEGIES]; // 默认包含

// 排除强制链（仅人类风格，不含任何回溯）
const withoutFC = STRATEGIES.filter(s => s.id !== 'forcing-chain');

// 排除唯一性（不假设唯一解）
const withoutUniqueness = STRATEGIES.filter(s => s.id !== 'uniqueness');
```

**难度评级边界**（difficulty 字段）：

| 策略 | 难度 | 边界说明 |
|------|------|----------|
| simple-coloring | 60 | 人类可接受，短链 |
| aic | 70 | 人类可接受，交替链 ≤14节点 |
| als | 80 | 人类可接受，集合逻辑 |
| uniqueness | 90 | 依赖唯一解假设（可选）|
| sue-de-coq | 95 | 人类可接受，局部分析 |
| forcing-chain | 100 | 边界地带：有界枚举 |

> `forcing-chain` 处于边界地带：每分支独立传播（非树形）+ 仅裸单 + 最多50步。
> 仍属于人类可追踪范围，但已是本引擎最后手段。

---

## 五、实现验证 / Soundness Guarantee

所有策略均通过以下验证：
- `npm test` — 400 题标准答案集零 violation（AC-3）
- `checkTraceSoundness()` — 每步逐一验证消去/填入与真解一致

引用：`packages/engine/src/soundness.ts`
