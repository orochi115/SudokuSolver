# 数独求解引擎 · Round2 多模型横评报告

> 生成时间：2026-06-30。权威数据来源：**run3**（`archive/round2/run3/*` + `run-logs/run-round2-run3-20260629-081109.tar.gz`）。
> 阶段链 P0→P1→P2a→P2b→E→P3；soft-gate（required-ids 缺失可软过，727-delta 评分）。
> 主观评测提纲见 [`EVAL-RUBRIC.md`](./EVAL-RUBRIC.md)（待另开会话执行）。

## 环境（便于复现）

| 项 | 版本 |
|---|---|
| OS | macOS 15.x (arm64, Darwin 24.6.0) |
| 地基分支 | `foundation`（33 策略，727 = 0/727） |
| 阶段 | P0→P1→P2a→P2b→E→P3（6 步，累积 required-ids） |
| Harness | v2（launch.sh detach、watchdog、verify 槽位、grok productive-idle、verify:r2 自检） |
| 并发 | MAX_PAR=8，SERIAL_CAP=1（alibaba-cn/siliconflow-cn/grok/bedrock），VERIFY_MAX=3 |
| 重试 | RETRIES=3，TIMEOUT=3600s/attempt |

## run3 通关总览

| 模型 | runner | 结果 | 727 human | 727 last-resort | 累计费用$ | 备注 |
|---|---|---|---:|---:|---:|---|
| `siliconflow-cn/zai-org/GLM-5.2` | opencode | **P3 通关** | **21** | **118** | ~2.4 | human-default 增量最高 |
| `openai/gpt-5.5` | opencode | **P3 通关** | 14 | 61 | ~16.0 | 稳定全链 |
| `alibaba-cn/qwen3.7-max` | opencode | **P3 通关** | 10 | 49 | ~22.4 | p3 先 STOP 后过 |
| `anthropic/claude-sonnet-4-6` | opencode | **P3 通关** | 8 | 77 | ~21.2 | p2 多 id 软过；污染警告⚠ |
| `grok-build` | grok | **P3 通关** | 0 | 65 | N/A | 全链一次过居多；human 增量 0 |
| `google/gemini-3.5-flash` | opencode | P1 后中断 | 45 | — | ~9.7 | p2a watchdog 杀（归档时未跑完） |
| `grok-composer-2.5-fast` | grok | P1 STOP | 17 | — | N/A | grok p1 验收未过 |
| `minimax-cn-coding-plan/MiniMax-M3` | opencode | P2b STOP | 13 | — | 0 | p2b typecheck 失败 |
| `alibaba-cn/deepseek-v4-flash` | opencode | P1 STOP | 2 | — | ~0.8 | 19 个 required-id 缺失 |
| `siliconflow-cn/moonshotai/Kimi-K2.7-Code` | opencode | E STOP | 14 | — | 0 | franken-fish 727 非法消除 |
| `amazon-bedrock/mistral.devstral-2-123b` | opencode | P0 STOP | — | — | ~2.4 | typecheck+test+健全性全挂 |

> grok 模型费用：CLI 不暴露 token/cost，表中为 N/A；精确花费查 xAI 控制台。

## 分阶段明细

完整表格见 [`reports/run3-summary.md`](./reports/run3-summary.md)（含每阶段用时、tokens、verify 秒数）。

### P3 通关模型 · 最终 727 计数

| 模型 | human-default | last-resort | 合计有效覆盖 |
|---|---:|---:|---|
| glm52 | 21/727 | 118/727 | last-resort 解出最多 |
| gpt55 | 14/727 | 61/727 | 均衡 |
| qwen37max | 10/727 | 49/727 | |
| sonnet46 | 8/727 | 77/727 | last-resort 较高 |
| grokbuild | 0/727 | 65/727 | 增量全在 last-resort |

## 失败 / 未达标（run3）

### P0 失败

- **devstral2**：三次运行均卡 P0。最终 attempt 硬门：`typecheck; tests; gt400-soundness; 727-soundness-human`（见 `logs/devstral2/p0.verify.json`）。

### P1 失败

- **deepseekv4**：p1 软过（19 个 required-id 缺失）但链上记 STOP；727 human 仅 2/727。
- **composer25**：p0 经 3 attempt 通过后 p1 STOP；grok runner，p1 阶段 watchdog 介入（长时间静默）。

### 中后期失败

- **gemini35flash**：p0/p1 全过（human 达 45/727），p2a 被 watchdog 强杀（verify rc=137 后重试静默 >2400s）。归档时 run 已结束，后续阶段 SKIP。
- **minimax-m3**：进步至 p2b；最终 p2b `typecheck` 硬失败。
- **kimi-k27**：p0–p2b 均过（多阶段软过缺 id）；E 阶段 `tests; gt400-soundness; 727-soundness-human`，offender 含 `franken-fish` 38 处非法消除。

## 三次运行演进

| Run | Tarball | P3 完成 | 关键事件 |
|---|---|---:|---|
| run1 | `run-round2-20260627-004321.tar.gz` | 1/11 | v1；仅 gpt55 全链；727 逐步门控未启用 |
| run2 | `run-round2-run2-20260627-074107.tar.gz` | 0/11 | ~40min 会话杀整组；composer25/grokbuild 零产出 |
| run3 | `run-round2-run3-20260629-081109.tar.gz` | **5/11** | harness v2 完整；mid-run 合入 verify:r2 |

run1 中 sonnet46 曾 p2 FAIL（v1 门控漏检 727）；run3 同模型 P3 通关，说明 v2 门控有效。

## 基础设施观察

1. **run2 归零**：未用 `launch.sh` detached；控制会话断开时整进程组同时死亡。
2. **watchdog 误杀**（已修）：gemini35flash p2a 在 verify 重试间隙被 reap；run3 末已加 heartbeat + 多文件 liveness。
3. **grok 空转**（已修）：composer25 run2 曾 40min 纯 thought 无 tool；现用 productive-output idle。
4. **verify:r2 滞后**：run3 前半 worker 无法本地复现 727/污染门控，mid-run 才 merge；`foundation` 现已含 `npm run verify:r2`（`0ee279e`）。

## 分支归档状态

```
archive/round2/run1/  — 10 模型 + foundation（无 grokbuild，该模型 run1 未纳入）
archive/round2/run2/  — 9 模型 + foundation（run2 基础设施中断，多为 P0）
archive/round2/run3/  — 11 模型 + foundation（权威结果）
foundation            — 下次跑测地基（已 merge verify:r2）
master                — 总控 + orchestration/（对 worker 不可见）
```

工作区已清理：无 `model/*` 分支、无 `sudoku-wt-r2` worktree。

## 主观评测（待执行）

按 [`EVAL-RUBRIC.md`](./EVAL-RUBRIC.md) 另开会话，对 `archive/round2/run3/<short>` 逐项评估：

1. checklist 勾选是否诚实（有无虚勾）
2. P3 是否污染 human-default
3. 策略排序 / overlap 合理性

## 复现与查阅

```bash
# 查看某模型最终代码
git checkout archive/round2/run3/glm52

# 解压 run3 日志
tar -xzf orchestration/round2/run-logs/run-round2-run3-20260629-081109.tar.gz -C /tmp/r2-run3
cat /tmp/r2-run3/reports/summary.md

# 读某模型失败原因
tar -xzf orchestration/round2/run-logs/run-round2-run3-*.tar.gz -O logs/kimi-k27/e.verify.json
```

## 改进建议（下次跑测）

1. **运维**：`launch.sh` + `pmset disablesleep 1`；跑完再 `archive-run.sh`。
2. **设计**：拆分 P0/P1 scope；E 项独立微阶段；P1+ `RETRIES=5`。
3. **流程**：pilot 2–3 模型验证 harness → full 11 模型。
4. **地基**：从已含 `verify:r2` 的 `foundation` 开跑，禁止 mid-run 改地基。