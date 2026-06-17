# 未解出的 diabolical 用例集

当前引擎在完整 OpenSudoku 语料上跑完后，diabolical 档仍有 **727 题**无法用人类解法解出（全部停在 `stuck`，无 invalid）。这 727 题是下一阶段"策略拆分 + 新策略"开发的目标集合（见 [`../../docs/development-plan.md`](../../docs/development-plan.md)）。

全语料基线（当前引擎）：

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

对当前工作区引擎跑全语料 diabolical 档、筛出 `stuck` 即可重建本集（与模型对比无关）：

```bash
npm run corpus:run -- --difficulty diabolical --out /tmp/diabolical.json
# /tmp/diabolical.json 的 report.diabolical.failures[] 即未解出题;取其 puzzle 字段
```

> 注：随着后续新增策略，能解出的题增多，这 727 题会逐步减少；届时重新生成本集以反映最新目标。
