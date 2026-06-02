# 数独求解引擎 · 多模型横评报告

> 生成时间:2026-06-02 09:29:10 +0800。固定范围对比:所有模型须实现同一套必需策略(`orchestration/required-ids/`),
> 健全性(0 violation)为硬门槛,解出率/成本/耗时仅收集用于对比实现质量。

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

## 结果对比

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
2. 编辑 `orchestration/models.txt`(provider/model + 短名)。
3. `TIMEOUT=3600 MAX_PAR=4 orchestration/run-all.sh`(Bedrock/alibaba-cn 自动串行)。
4. `node orchestration/gen-report.mjs` 生成本报告。
5. 必需策略范围见 `orchestration/required-ids/{m2,m3}.txt`;评分口径见本仓库 orchestration/。
