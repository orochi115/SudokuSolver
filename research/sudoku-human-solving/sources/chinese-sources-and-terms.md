# Source Digest: Chinese Sources and Terminology

## Metadata
- Sources: Sudoku.com Chinese, JWangL5 blog, sudoku.kazusa.tech, cn.sudokupuzzle.org, web search results
- Local capture type: summarized excerpts and topic map, not full page mirror
- Access date: 2026-06-01

## URLs Captured or Identified
- Sudoku.com Chinese pointing pairs: https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-shu-dui/
- Sudoku.com Chinese X-Wing: https://sudoku.com/zh/shu-du-gui-ze/x-yi-jie-fa/
- JWangL5 advanced techniques: https://jwangl5.github.io/posts/advanced_techniques_for_sudoku_solving/
- Kazusa Wing construction: https://sudoku.kazusa.tech/construction/02-wing-construction
- Kazusa Unique Rectangle: https://sudoku.kazusa.tech/full-marking-techniques/04-unique-rectangle/
- cn.sudokupuzzle X-Wing: https://cn.sudokupuzzle.org/sudoku-guide/x-wing/

## Chinese Terminology Map
- Naked Single: 唯一余数、显性唯一、裸单、单格唯一候选。
- Hidden Single: 唯一候选、隐性唯一、某数字在行/列/宫中唯一位置。
- Locked Candidates: 区块排除、区块锁定、行列消除法、宫区块数对/三数组、Pointing/Claiming。
- Naked Pair/Triple/Quad: 显性数对/三数组/四数组、裸对/裸三/裸四。
- Hidden Pair/Triple/Quad: 隐性数对/三数组/四数组、隐藏对/隐藏三/隐藏四。
- X-Wing: X翼。
- Swordfish: 剑鱼。
- Jellyfish: 水母。
- Finned Fish: 有鳍鱼。
- Sashimi Fish: 生鱼片鱼。
- Skyscraper: 摩天楼。
- 2-String Kite: 双线风筝。
- Empty Rectangle: 空矩形。
- Turbot Fish: 多宝鱼、双强链。
- Remote Pair: 远程数对。
- X-Chain: X链。
- XY-Chain: XY链。
- XY-Wing / Y-Wing: XY翼、Y翼。
- XYZ-Wing: XYZ翼。
- W-Wing: W翼。
- Nice Loop: 佳环、Nice Loop。
- AIC: 强弱交替链、交替推理链。
- ALS: 几乎锁定集、Almost Locked Set。
- RCC: 受限公共候选数。
- Unique Rectangle: 唯一矩形。
- BUG: 全双值格致死、BUG+1。
- Deadly Pattern: 致命结构。

## Captured Notes

### Sudoku.com Chinese
- Pointing pairs page states that when a note/candidate appears twice in a box and both occurrences lie in one row/column, that candidate must solve one of those cells in the box, so it can be removed from other cells in that row/column.
- X-Wing page states that X-Wing is based on two parallel rows or columns and does not rely on boxes. If two rows each have two cells containing candidate 4 and the candidates align in the same two columns, then those columns cannot contain 4 elsewhere.

### JWangL5 Blog
- Blog explicitly references HoDoKu and provides a Chinese systematic digest.
- Covers Singles, Intersections, Hidden/Naked Subsets, fish, finned/sashimi fish, wings, chains, remote pairs, X-chain, Skyscraper, 2-String Kite, Empty Rectangle, XY-chain, XY-Wing, XYZ-Wing, Nice Loops, W-Wing, ALS, and uniqueness.
- Useful Chinese explanation: strong link means two endpoints cannot both be false; weak link means two endpoints cannot both be true; strong links can be used as weak links when needed.
- Frames Wing patterns as special cases of chains, and Nice Loop as a near-general method for complex puzzles.

### Kazusa Sudoku
- Wing construction article discusses using Wing-derived strong inferences as nodes inside longer constructed chains.
- Key insight: some patterns that do not directly delete candidates can still generate a special strong link, which can be embedded into a chain.
- Unique Rectangle article frames UR as a Deadly Pattern technique based on the unique-solution requirement.

### cn.sudokupuzzle X-Wing
- Provides a detailed Chinese walkthrough of row-based X-Wing.
- Explicit mnemonic: 行基 X-Wing 删列，列基 X-Wing 删行.
- Practical scan method: choose one candidate, find rows/columns where it appears exactly twice, pair rows/columns with identical positions, then eliminate from the cover columns/rows.

## Contribution to Formula-Like Workflow
- Chinese sources are useful for terminology normalization and later Chinese-language documentation.
- JWangL5 and Kazusa are especially useful because they discuss unification: Wings as chains, Turbot Fish as X-chain, Empty Rectangle as grouped chain/fish, and pattern-derived strong links as chain components.
- For the final workflow, use Chinese terms alongside standard English names to avoid ambiguity.
