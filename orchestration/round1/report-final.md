# 数独求解引擎 · 多模型横评报告

> 生成时间:2026-06-02 09:29:10 +0800。固定范围对比:所有模型须实现同一套必需策略(`orchestration/harness/required-ids/`),
> 健全性(0 violation)为硬门槛,解出率/成本/耗时仅收集用于对比实现质量。
> 补充:hard 样本 100% 且健全性为 0 的模型已在 `archive/round1/final/*` 上完成全量题库复测;结果归档见
> `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`(Git LFS)。

## 环境(便于复现)

| 项 | 版本 |
|---|---|
| OS | macOS 15.7.2 (arm64, Darwin 24.6.0) |
| opencode | 1.15.13 |
| Node | v24.8.0 |
| npm | 11.6.0 |
| TypeScript | 5.9.3 |
| tsx | 4.22.4 |
| Vitest | 2.1.9 |
| @types/node | 22.19.19 |
| Git LFS | git-lfs/3.7.1 |
| python3 | Python 3.14.5 (未用于引擎,仅记录) |

## 100题样本结果对比

| 模型 | M2 | M3 | strat | medium | hard | diabolical | viol | cost$ | min | att(m2/m3) |
|---|---|---|---|---|---|---|---|---|---|---|
| `anthropic/claude-opus-4-8` | PASS | PASS | 17 | 100% | 100% | 88% | 0 | $12.63 | 41 | 1/1 |
| `anthropic/claude-sonnet-4-6` | PASS | PASS | 17 | 100% | 100% | 99% | 0 | $10.43 | 57 | 1/2 |
| `openai/gpt-5.5` | PASS | PASS | 17 | 100% | 100% | 97% | 0 | $16.41 | 27 | 1/1 |
| `openai/gpt-5.3-codex` | PASS | PASS | 17 | 100% | 100% | 78% | 0 | $3.37 | 25 | 1/1 |
| `google/gemini-3.5-flash` | PASS | PASS | 17 | 100% | 100% | 81% | 0 | $5.55 | 32 | 1/1 |
| `xai/grok-4.3` | PASS | PASS | 17 | 67% | 0% | 0% | 0 | $1.67 | 5 | 2/1 |
| `alibaba-cn/qwen3-coder-plus` | FAIL | SKIP | 11 | 100% | 100% | 76% | 1876 | $8.94 | 65 | 3/- |
| `alibaba-cn/deepseek-v4-flash` | PASS | PASS | 17 | 100% | 100% | 72% | 0 | $0.34 | 29 | 1/1 |
| `minimax-cn-coding-plan/MiniMax-M2.7` | PASS | PASS | 17 | 100% | 64% | 1% | 0 | $0 | 46 | 3/2 |
| `alibaba-cn/glm-5.1` | PASS | PASS | 17 | 100% | 83% | 9% | 0 | $5.64 | 58 | 2/1 |
| `alibaba-cn/kimi-k2.6` | PASS | PASS | 17 | 100% | 98% | 60% | 0 | $0.79 | 50 | 1/1 |

> 已省略所有模型取值相同的列:easy = 100%。

> 解出率按 100 题/档计;`att` 为 M2/M3 各自的尝试次数;`min`/`cost` 为 M2+M3 合计(模型活跃时长 / token 成本,订阅制模型成本可能为 0)。

## 全量题库复测(hard 样本 100% 候选)

> 复测范围:仅包含 100 题样本中 `hard=100%`、`M2=PASS`、`M3=PASS`、`viol=0` 的 6 个模型。运行方式为 `node orchestration/harness/run-archive-full-corpus.mjs --workers 16`,只在 `archive/round1/final/<shortname>` 分支运行引擎,不调用大模型。
> 下表采用更严格的 **valid solved** 口径:最终盘面必须填满、保留 givens、行/列/宫合法。`stuck` 表示引擎停在未解状态;`invalid` 表示 trace 声称 solved 但终盘校验失败。

| 模型 | easy valid | medium valid | hard valid | diabolical valid | total valid | stuck | invalid | runtime |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `anthropic/claude-opus-4-8` | 100.000% (100000/100000) | 100.000% (352643/352643) | 99.992% (321566/321592) | 85.806% (102694/119681) | 98.097% (876903/893916) | 17013 | 0 | 9.8 min |
| `anthropic/claude-sonnet-4-6` | 100.000% (100000/100000) | 100.000% (352643/352643) | 99.999% (321588/321592) | 98.949% (118423/119681) | 99.859% (892654/893916) | 1262 | 0 | 20.9 min |
| `openai/gpt-5.5` | 100.000% (100000/100000) | 100.000% (352643/352643) | 99.993% (321569/321592) | 96.841% (115900/119681) | 99.574% (890112/893916) | 3804 | 0 | 6.5 min |
| `openai/gpt-5.3-codex` | 100.000% (100000/100000) | 100.000% (352643/352643) | 99.745% (320771/321592) | 75.109% (89891/119681) | 96.576% (863305/893916) | 30611 | 0 | 3.6 min |
| `google/gemini-3.5-flash` | 100.000% (100000/100000) | 100.000% (352643/352643) | 99.924% (321349/321592) | 79.352% (94969/119681) | 97.208% (868961/893916) | 24955 | 0 | 3.8 min |
| `alibaba-cn/deepseek-v4-flash` | 100.000% (100000/100000) | 100.000% (352643/352643) | 97.835% (314628/321592) | 64.415% (77093/119681) | 94.457% (844364/893916) | 49141 | 411 | 2.1 min |

### 样本 vs 全量

| 模型 | hard 100题 | hard 全量 valid | hard fail(stuck/invalid) | diabolical 100题 | diabolical 全量 valid | diabolical fail(stuck/invalid) |
|---|---:|---:|---:|---:|---:|---:|
| `anthropic/claude-opus-4-8` | 100% | 99.992% | 26/0 | 88% | 85.806% | 16987/0 |
| `anthropic/claude-sonnet-4-6` | 100% | 99.999% | 4/0 | 99% | 98.949% | 1258/0 |
| `openai/gpt-5.5` | 100% | 99.993% | 23/0 | 97% | 96.841% | 3781/0 |
| `openai/gpt-5.3-codex` | 100% | 99.745% | 821/0 | 78% | 75.109% | 29790/0 |
| `google/gemini-3.5-flash` | 100% | 99.924% | 243/0 | 81% | 79.352% | 24712/0 |
| `alibaba-cn/deepseek-v4-flash` | 100% | 97.835% | 6801/163 | 72% | 64.415% | 42340/248 |

### 全量复测观察

- 100 题样本对 `hard` 的区分度不足:6 个候选全为 100%,但全量 hard 从 97.835% 到 99.999% 拉开差距。
- `diabolical` 更能反映高级策略实现质量:sonnet46 全量 valid 98.949%,gpt-5.5 为 96.841%,opus48 为 85.806%。
- `deepseekv4` 在 100 题样本中健全性为 0,但全量复测出现 411 个 invalid-solved,说明样本闸门不足以覆盖全部 soundness 风险。
- 运行时间不可直接等同于“更强/更弱”:失败越多的实现往往更快,因为 solver 更早进入 `stuck` 并停止;能解出的困难题通常需要更多策略步骤。

## 失败 / 未达标

- **qwen3coder** (`alibaba-cn/qwen3-coder-plus`):M2=FAIL M3=SKIP,健全性违例 1876,缺失必需策略 6 个:simple-coloring, aic, als, uniqueness, sue-de-coq, forcing-chain

## 各模型实际使用的工具/技能

> 来自各 attempt 日志的 `tool_use` 事件(工具名: 调用次数)。

- **opus48**: bash×50, read×43, write×30, edit×26, todowrite×4
- **sonnet46**: read×70, bash×69, write×31, edit×18, todowrite×14
- **gpt55**: read×49, bash×43, glob×24, apply_patch×21, skill×15, task×3
- **gpt53codex**: apply_patch×63, read×51, bash×27, glob×12, skill×7, todowrite×6, grep×1
- **gemini35flash**: read×45, todowrite×26, write×26, bash×25, edit×17, glob×15
- **grok43**: read×24, bash×24, write×21, edit×10, glob×4, skill×2
- **qwen3coder**: bash×67, edit×62, read×29, write×26, glob×1
- **deepseekv4**: read×64, bash×45, write×44, todowrite×10, edit×10, glob×6, task×1
- **minimax-m27**: bash×91, read×83, write×61, edit×41, glob×7, todowrite×2, grep×2
- **glm51**: read×94, bash×63, write×56, edit×29, glob×12, todowrite×11
- **kimi-k26**: bash×82, read×69, write×54, edit×12, glob×6, todowrite×2, skill×1

## 复现方法

1. 配好 opencode 及各 provider 凭据;`git lfs pull` 拉取谜题。
2. 编辑 `orchestration/round1/models.txt`(provider/model + 短名)。
3. `TIMEOUT=3600 MAX_PAR=4 orchestration/harness/run-all.sh`(Bedrock/alibaba-cn 自动串行)。
4. `node orchestration/harness/gen-report.mjs` 生成本报告。
5. 全量复测:`node orchestration/harness/run-archive-full-corpus.mjs --workers 16`;结果包:`orchestration/run-logs/full-corpus-20260602-064418.tar.gz`。
6. 必需策略范围见 `orchestration/harness/required-ids/{m2,m3}.txt`;评分口径见本仓库 orchestration/。
