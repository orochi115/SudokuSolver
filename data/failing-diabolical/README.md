# 未解出的 diabolical 用例集（727）

这 727 题是 diabolical 档中**连 last-resort 解法（含 `forcing-chain`）都解不出**的最难残集（全部停在 `stuck`，无 invalid），是 Roadmap ② 「策略拆分 + 新策略」开发的**终极目标集**：理想状态是**不依赖 forcing chain / net** 就能 100% 解出（见 [`../../docs/plans/diabolical-727.md`](../../docs/plans/diabolical-727.md) 与配套 [执行清单](../../docs/plans/diabolical-727-checklist.md)）。

> **两个残集，别混淆**（自 2026-06 引擎引入 strategy profile 起）：
> - **last-resort 残集 = 本目录的 727**：用全部策略（含 forcing-chain）仍 stuck。这是固定的「最难」基线 / 终极目标，仅随**新增人类技巧**而缩小。
> - **human-default 残集（更大）**：默认 profile（**不含** forcing-chain）下 stuck 的题，含「目前只能靠 forcing-chain 解」的那些。这是**进度工作集**，随 P0→P2 落地缩小；727 进度即看它向 727 收敛。

全语料基线（last-resort profile，= 727 的来源口径）：

| 难度 | solved / n | stuck | errors |
| --- | ---: | ---: | ---: |
| easy | 100000 / 100000 | 0 | 0 |
| medium | 352643 / 352643 | 0 | 0 |
| hard | 321592 / 321592 | 0 | 0 |
| diabolical | 118954 / 119681 | 727 | 0 |

## 文件

- `puzzles.txt` —— 727 行，每行一题（81 位数字字符串，`0` 表示空格）。
- `failures.json` —— 完整记录：来源、diabolical 汇总，以及 727 个失败对象（`index` / `puzzle` / `outcome` / `final`）。`puzzle` 字符串是真相来源；`index` 仅为生成时失败列表的序号，勿用它反查 `puzzles/diabolical.opensudoku`。

## 重新生成

727（last-resort 残集）—— 用全部策略跑全语料 diabolical 档、筛出 `stuck`：

```bash
npm run corpus:run -- --difficulty diabolical --profile last-resort --out /tmp/diabolical-727.json
# report.diabolical.failures[] 即未解出题；取其 puzzle 字段（应为 727）
```

human-default 进度工作集 —— 把 `--profile` 换成 `human-default`（或省略，human-default 即默认）：

```bash
npm run corpus:run -- --difficulty diabolical --profile human-default --out /tmp/diabolical-human-default.json
```

> 注：① 必须指定 `--profile last-resort` 才能复现本集的 727；默认 profile 已是 human-default，会给出更大的残集。② 随后续新增人类技巧，727 会逐步减少；届时（用 last-resort 口径）重新生成本集以反映最新目标。
