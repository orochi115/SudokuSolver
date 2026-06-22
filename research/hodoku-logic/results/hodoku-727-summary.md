# HoDoKu pure-logic census of the 727 diabolical puzzles

Source puzzles: `../../data/failing-diabolical/puzzles.txt`

Mode: **full HoDoKu logic**

Disabled (never "human logic"): [enum SolutionType: 模板集(Template Set) (1201|ts), enum SolutionType: 模板删除(Template Delete) (1202|td), enum SolutionType: 暴力猜解(Brute Force) (xxxx|bf), enum SolutionType: 不完整的解! (xxxx|in), enum SolutionType: 放弃 (xxxx|gu)]

Brute force / templates / give-up: **disabled** (zero backtracking).

| metric | count |
|---|---|
| total | 727 |
| solved (pure logic) | 727 |
| stuck | 0 |
| invalid | 0 |

## Technique histogram (over solved puzzles)

| technique | total uses |
|---|---|
| Naked Single | 15578 |
| Full House | 14797 |
| 隐藏唯一数(Hidden Single) | 8546 |
| Locked Candidates Type 1 (Pointing) | 3072 |
| Forcing Chain Contradiction | 2984 |
| Discontinuous Nice Loop | 2615 |
| 成组不连续环(Grouped Discontinuous Nice Loop) | 1721 |
| Locked Candidates Type 2 (Claiming) | 975 |
| Almost Locked Set XY-Wing | 774 |
| Naked Pair | 660 |
| 双线风筝(2-String Kite) | 652 |
| AIC | 651 |
| Almost Locked Set XZ-Rule | 599 |
| XY链(XY-Chain) | 575 |
| Naked Triple | 540 |
| W-Wing | 463 |
| 隐式矩形(Hidden Rectangle) | 397 |
| 空矩形(Empty Rectangle) | 354 |
| Sue de Coq | 318 |
| 摩天楼(Skyscraper) | 312 |
| X-Wing | 295 |
| Forcing Net Verity | 291 |
| Forcing Chain Verity | 289 |
| Finned Swordfish | 282 |
| 隐藏数对(Hidden Pair) | 276 |
| XY-Wing | 258 |
| Finned X-Wing | 241 |
| Locked Pair | 207 |
| XYZ-Wing | 202 |
| Almost Locked Set Chain | 187 |
| Continuous Nice Loop | 183 |
| 多宝鱼(Turbot Fish) | 146 |
| 成组 AIC | 138 |
| 三链列(Swordfish) | 89 |
| Forcing Net Contradiction | 86 |
| 唯一性测试 4 | 51 |
| Finned Franken Swordfish | 50 |
| Sashimi Swordfish | 50 |
| Sashimi X-Wing | 42 |
| Hidden Triple | 41 |
| 唯一性测试 1 | 38 |
| Multi Colors 1 | 35 |
| Bivalue Universal Grave + 1 | 30 |
| 唯一性测试 3 | 30 |
| X链(X-Chain) | 28 |
| 成组连续环(Grouped Continuous Nice Loop) | 26 |
| Simple Colors Trap | 19 |
| 唯一性测试 2 | 18 |
| 唯一性测试 6 | 18 |
| Remote Pair | 17 |
| Locked Triple | 15 |
| Finned Jellyfish | 13 |
| Naked Quadruple | 6 |
| 可避免的矩形(Avoidable Rectangle) 类型 1 | 6 |
| 唯一性测试 5 | 4 |
| Hidden Quadruple | 1 |
| Jellyfish | 1 |

## First technique HoDoKu used that the TS engine lacks

(per-puzzle: the earliest step whose technique is not yet in the engine — the clustering signal for Roadmap ②)

| first-missing family | puzzles |
|---|---|
| Discontinuous Nice Loop | 220 |
| 成组不连续环(Grouped Discontinuous Nice Loop) | 141 |
| Finned Swordfish | 84 |
| Finned X-Wing | 75 |
| 隐式矩形(Hidden Rectangle) | 65 |
| Forcing Net Verity | 37 |
| 多宝鱼(Turbot Fish) | 34 |
| Forcing Net Contradiction | 15 |
| Almost Locked Set Chain | 9 |
| Continuous Nice Loop | 7 |
| Sashimi X-Wing | 7 |
| Finned Franken Swordfish | 6 |
| 成组 AIC | 5 |
| Finned Jellyfish | 4 |
| Multi Colors 1 | 4 |
| XY链(XY-Chain) | 4 |
| Sashimi Swordfish | 3 |
| 唯一性测试 3 | 2 |
| 成组连续环(Grouped Continuous Nice Loop) | 2 |
| Remote Pair | 1 |
| 唯一性测试 6 | 1 |
