# Round2 run4 · 评分与 KPI

> 实验内**硬门**与**评分**分离。硬门保证健全性；评分比较模型实现质量。
> 全语料 **full corpus** 为跑后人工加测，不参与自动 STOP。

## 1. 原则

| 类型 | 用途 | 示例 |
|---|---|---|
| **Hard gate** | 能否继续链 / 是否作废本 phase | 夹具失败、727 violation、污染 |
| **Primary KPI** | 横向排名主指标 | 策略利用率、有效步率 |
| **Secondary KPI** | 参考 | 727 human-default 解出增量 |
| **Post-hoc** | 深度质量 | full corpus valid%（人工触发） |

**不让模型靠抬 difficulty 刷 727 solved**；difficulty 由模型定，但排名看「策略是否被真实使用且 sound」。

## 2. 策略利用率（主 KPI）

### 2.1 定义

对给定 corpus（默认 **727 残集** + profile `human-default`）跑 `solve:list` 或专用脚本，统计：

| 指标 | 公式 / 说明 |
|---|---|
| `usage[id]` |  trace 中 `step.strategyId === id` 的步数 |
| `emptySteps` | 总步数 − 有 elimination/placement 的步数（或引擎 reported stuck 前空转步） |
| `utilization[id]` | `usage[id] / totalSteps` |
| `phaseUtilization` | 本 phase 新增 id 的 `Σ usage[id] / totalSteps` |
| `fixtureIsolation` | 夹具通过但 `usage[id]==0` → flag，供人工复核 |

### 2.2 记录位置

phase 末 `verify-phase` 后追加一行 `stats.jsonl`：

```jsonc
{
  "scope": "phase-kpi",
  "phase": "p1",
  "solveHuman": "21/727",
  "totalSteps": 12040,
  "usage": { "tridagon": 3, "als-chain": 12 },
  "phaseUtilization": 0.0012,
  "emptyStepRate": 0.05,
  "fixtureFlags": ["wxyz-wing"]
}
```

### 2.3 排名建议

1. **phase 完成度**（到达 p3 且 phase 链 complete）
2. **累计 phaseUtilization**（各 phase 加权）
3. **727 human solved**（次要）
4. **费用 / wall**（效率 tie-break）

## 3. 解出率（次要 KPI）

- `solveHuman` / `solveLast` 仍从 `verify-phase` 读取
- **不作 step 通过条件**
- p3 phase 看 `solveLast` 增量；human-default 看 `solveHuman`

## 4. 完成度与漏实现

| 状态 | 判定 |
|---|---|
| step 完成 | 存在 `step.complete` + 夹具绿 + checkpoint |
| 漏实现 | required id 无 `step.complete` |
| 摆烂嫌疑 | `step.complete` 但 `usage[id]==0` 且 `fixtureIsolation` |

phase 末 report 输出矩阵：id ×（step 状态 / usage / 夹具）。

## 5. Soft 项（不 STOP）

- `pollutionWarnFiles`（backtrack/guess 气味）
- difficulty 撞值警告（两 id 同 difficulty）
- 727 delta 低于基线（记录不闸停，除非 soundness 回退）

## 6. Full corpus（人工，跑后）

不在 `run-all` / `report.sh` 内自动执行。

```bash
# 示例：对归档分支跑全语料
node orchestration/harness/run-archive-full-corpus.mjs \
  --ref archive/round2/run4/run1/glm52 \
  --name glm52-run4 \
  --out-dir orchestration/round2/reports/full-corpus/glm52-run4 \
  --workers 16
```

结果单独 tar/LFS；在 `report-final.md` 加一节「事后全语料」，与实验内 727 指标并列。

## 7. report.sh 输出（目标）

| 节 | 数据源 |
|---|---|
| 进度总览 | `status/*.json` |
| phase × 模型 | `events.jsonl` kind=phase.* |
| 费用 / token | `stats.jsonl` 求和 |
| 利用率表 | `stats.jsonl` scope=phase-kpi |
| 漏实现 / 摆烂 flag | events + kpi |
| checkpoint 索引 | `checkpoints.jsonl` |

不生成可覆盖的单一 `summary.md` 而不保留 jsonl 真相源；若写 `summary.md`，注明「由 jsonl 生成，可再生成」。