# HoDoKu pure-logic census of the 727 diabolical puzzles

Source puzzles: `../../data/failing-diabolical/puzzles.txt`

Mode: **STRICT (no forcing nets)**

Disabled (never "human logic"): [enum SolutionType: 模板集(Template Set) (1201|ts), enum SolutionType: 模板删除(Template Delete) (1202|td), enum SolutionType: Forcing Net (xxxx|fn), enum SolutionType: Forcing Net Contradiction (1303|fnc), enum SolutionType: Forcing Net Verity (1304|fnv), enum SolutionType: 暴力猜解(Brute Force) (xxxx|bf), enum SolutionType: 不完整的解! (xxxx|in), enum SolutionType: 放弃 (xxxx|gu)]

Brute force / templates / give-up: **disabled** (zero backtracking).

| metric | count |
|---|---|
| total | 727 |
| solved (pure logic) | 424 |
| stuck | 303 |
| invalid | 0 |

## Technique histogram (over solved puzzles)

| technique | total uses |
|---|---|
| Naked Single | 9267 |
| Full House | 8609 |
| 隐藏唯一数(Hidden Single) | 4952 |
| Locked Candidates Type 1 (Pointing) | 1894 |
| Discontinuous Nice Loop | 1711 |
| Forcing Chain Contradiction | 1694 |
| 成组不连续环(Grouped Discontinuous Nice Loop) | 1140 |
| Locked Candidates Type 2 (Claiming) | 586 |
| Almost Locked Set XY-Wing | 510 |
| AIC | 422 |
| 双线风筝(2-String Kite) | 391 |
| Naked Pair | 380 |
| Almost Locked Set XZ-Rule | 371 |
| XY链(XY-Chain) | 365 |
| Naked Triple | 319 |
| W-Wing | 283 |
| 隐式矩形(Hidden Rectangle) | 250 |
| 空矩形(Empty Rectangle) | 213 |
| Sue de Coq | 200 |
| 摩天楼(Skyscraper) | 187 |
| 隐藏数对(Hidden Pair) | 174 |
| X-Wing | 173 |
| Forcing Chain Verity | 171 |
| Finned Swordfish | 164 |
| Finned X-Wing | 145 |
| Almost Locked Set Chain | 135 |
| XY-Wing | 134 |
| Locked Pair | 127 |
| XYZ-Wing | 117 |
| Continuous Nice Loop | 111 |
| 成组 AIC | 102 |
| 多宝鱼(Turbot Fish) | 85 |
| 三链列(Swordfish) | 56 |
| Sashimi X-Wing | 34 |
| Sashimi Swordfish | 32 |
| Finned Franken Swordfish | 30 |
| Hidden Triple | 28 |
| 唯一性测试 4 | 28 |
| 唯一性测试 1 | 24 |
| 成组连续环(Grouped Continuous Nice Loop) | 20 |
| Multi Colors 1 | 17 |
| 唯一性测试 3 | 17 |
| X链(X-Chain) | 14 |
| Remote Pair | 13 |
| Locked Triple | 12 |
| Bivalue Universal Grave + 1 | 11 |
| Simple Colors Trap | 11 |
| 唯一性测试 2 | 11 |
| 唯一性测试 6 | 10 |
| Finned Jellyfish | 5 |
| Naked Quadruple | 3 |
| Hidden Quadruple | 1 |
| Jellyfish | 1 |
| 唯一性测试 5 | 1 |

## First technique HoDoKu used that the TS engine lacks

(per-puzzle: the earliest step whose technique is not yet in the engine — the clustering signal for Roadmap ②)

| first-missing family | puzzles |
|---|---|
| Discontinuous Nice Loop | 220 |
| 成组不连续环(Grouped Discontinuous Nice Loop) | 141 |
| Finned Swordfish | 84 |
| Finned X-Wing | 75 |
| 隐式矩形(Hidden Rectangle) | 65 |
| (stuck, no new family) | 52 |
| 多宝鱼(Turbot Fish) | 34 |
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
