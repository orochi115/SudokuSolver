# 未通过的 diabolical 用例集（第一轮基线）

第一轮模型对比测试的优胜者修复分支（`analysis/sonnet46-strategy-fix`，17 个策略）跑完整 OpenSudoku 语料后，diabolical 档仍有 **727 题**无法用人类解法解出（全部为 `stuck`，无 invalid）。这 727 题是下一阶段"策略拆分 + 新策略"开发的目标集合。

全语料基线：

| 难度 | solved / n | stuck | errors |
| --- | ---: | ---: | ---: |
| easy | 100000 / 100000 | 0 | 0 |
| medium | 352643 / 352643 | 0 | 0 |
| hard | 321592 / 321592 | 0 | 0 |
| diabolical | 118954 / 119681 | 727 | 0 |

## 文件

- `puzzles.txt` —— 727 行，每行一题（81 位数字字符串，`0` 表示空格），按原始 1-based `index` 升序排列。
- `failures.json` —— 完整记录：来源、目标分支元信息、diabolical 汇总，以及 727 个失败对象（`index` / `puzzle` / `outcome` / `final`）。`index` 为原始全语料 `results.json` 中 diabolical 失败列表的 1-based 序号，仅用于溯源；`puzzle` 字符串才是真相来源，不要拿 `index` 反查 `puzzles/diabolical.opensudoku`。

## 来源与复现

源数据保存在归档分支 `archive/round1/orchestration` 的
`orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
（成员 `20260602-064418/results.json` 中 `name == "analysis-sonnet46-strategy-fix"` 的 `report.diabolical.failures[]`）。

复现（在归档分支上，或还原该 tar.gz 后）：

```bash
tar -xzO -f orchestration/run-logs/full-corpus-20260602-064418.tar.gz \
  20260602-064418/results.json | python3 -c '
import json,sys
d=json.load(sys.stdin)
r=[x for x in d["results"] if x["name"]=="analysis-sonnet46-strategy-fix"][0]
fa=sorted(r["report"]["diabolical"]["failures"], key=lambda f: f["index"])
assert len(fa)==727
for x in fa: print(x["puzzle"])
' | diff - puzzles.txt && echo OK
```
