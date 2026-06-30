# Round2 对比测试 · 结果摘要

> 完整报告见 [`./report-final.md`](./report-final.md)。客观数据明细见 [`./reports/run3-summary.md`](./reports/run3-summary.md)。
> 归档分支：`archive/round2/run3/<short>`；运行日志：`run-logs/run-round2-run3-20260629-081109.tar.gz`（Git LFS）。

## 测试设计（一句话）

11 个模型从 `foundation`（33 策略、727=0/727）出发，按 P0→P1→P2a→P2b→E→P3 六阶段链独立实现 ~50 个新策略；硬门 = typecheck + test + 400&727 逐步健全性 + 无污染（+ P3 隔离）。

## run3 最终结果（权威）

| 模型 | 最高阶段 | P3 通关 | 727(human) | 727(last) | 费用$（估） |
|---|---|---|---|---:|---:|
| **glm52** | P3 | ✅ | **21**/727 | 118/727 | ~2.4 |
| **gemini35flash** | P1 | ❌ | 45/727 | — | ~9.7 |
| **composer25** | P1 | ❌ | 17/727 | — | N/A |
| **gpt55** | P3 | ✅ | 14/727 | 61/727 | ~16.0 |
| **qwen37max** | P3 | ✅ | 10/727 | 49/727 | ~22.4 |
| **minimax-m3** | P2b | ❌ | 13/727 | — | 0 |
| **sonnet46** | P3 | ✅ | 8/727 | 77/727 | ~21.2 |
| **deepseekv4** | P1 | ❌ | 2/727 | — | ~0.8 |
| **kimi-k27** | E | ❌ | 14/727（E 时 139） | — | 0 |
| **grokbuild** | P3 | ✅ | 0/727 | 65/727 | N/A |
| **devstral2** | P0 | ❌ | — | — | ~2.4 |

**P3 完成率：5/11（45%）**。human-default 727 增量最高：**glm52（21）**；last-resort 增量最高：**glm52（118）**。

## 三次运行对比

| Run | 日期 | P3 完成 | 备注 |
|---|---|---:|---|
| run1 | 2026-06-27 | 1/11 (gpt55) | v1 harness；727 门控未启用 |
| run2 | 2026-06-27 | 0/11 | 会话 SIG 杀整组 ~40min；基础设施中断 |
| **run3** | 2026-06-28~29 | **5/11** | v2 harness 完整跑；**本报告以此为准** |

## 失败分布（run3）

| 卡点阶段 | 模型 | 主要原因 |
|---|---|---|
| P0 | devstral2 | typecheck + test + 400/727 soundness 全挂 |
| P1 | deepseekv4, composer25 | deepseekv4：19 个 required-id 缺失（软门但 STOP）；composer25：watchdog 杀 + grok p1 未过验收 |
| P2a | gemini35flash | watchdog 杀（verify rc=137 后重试中静默） |
| P2b | minimax-m3 | typecheck 失败 |
| E | kimi-k27 | franken-fish 等策略 727 非法消除 |

## 分支与日志归档

| 资产 | 路径 |
|---|---|
| run3 模型分支 | `archive/round2/run3/{gpt55,sonnet46,glm52,grokbuild,qwen37max,...}` |
| run3 地基快照 | `archive/round2/run3/foundation` |
| run1/run2 历史 | `archive/round2/run{1,2}/*` |
| 下次跑测地基 | `foundation`（已含 `npm run verify:r2`） |
| 运行日志 | `orchestration/round2/run-logs/run-round2-*.tar.gz` |

## 下一步（改进方向摘要）

详见复盘计划：① `launch.sh` detached + `pmset disablesleep`；② 拆分 P0/P1 阶段 scope；③ `RETRIES=5`；④ pilot run 后再 full 11 模型。