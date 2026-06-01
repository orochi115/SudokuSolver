# Source Digest: HoDoKu Core Human Solving Techniques

## Metadata
- Site: HoDoKu by Bernhard Hobiger
- Main index: https://hodoku.sourceforge.net/en/techniques.php
- License note on pages: GNU FDLv1.3
- Local capture type: summarized excerpts and topic map, not full page mirror
- Access date: 2026-06-01

## URLs Captured
- Introduction: https://hodoku.sourceforge.net/en/tech_intro.php
- Singles: https://hodoku.sourceforge.net/en/tech_singles.php
- Intersections: https://hodoku.sourceforge.net/en/tech_intersections.php
- Naked Subsets: https://hodoku.sourceforge.net/en/tech_naked.php
- Hidden Subsets: https://hodoku.sourceforge.net/en/tech_hidden.php
- Basic Fish: https://hodoku.sourceforge.net/en/tech_fishb.php
- Wings: https://hodoku.sourceforge.net/en/tech_wings.php
- Chains/Loops: https://hodoku.sourceforge.net/en/tech_chains.php

## Why This Source Matters
HoDoKu is one of the strongest sources for a formula-like human Sudoku process because it explicitly frames the problem as logical candidate reduction rather than brute force. Its introduction says computer brute force is trivial, but the real challenge is solving with logic. It also states that most techniques reduce candidates until singles appear.

## Terminology Captured
- `Cell`: one square in the 9x9 grid.
- `House`: row, column, or 3x3 box.
- `Chute/Band`: three boxes in a row or column.
- `Given`: clue present at puzzle start.
- `Candidate/Pencil mark`: possible value for an empty cell.
- `Peer/See`: two cells share a row, column, or box and therefore cannot contain the same value.
- `r5c2` notation: row 5 column 2.

## Technique Notes

### Singles
- `Full House / Last Digit`: last missing value in a house.
- `Hidden Single`: a digit has only one possible cell in a house, even if that cell still contains other candidates.
- `Naked Single`: a cell has only one remaining candidate.
- Human search method: hidden singles are often found by cross-hatching a digit through rows/columns inside a box.

### Intersections / Locked Candidates
- `Locked Candidates Type 1 / Pointing`: if all candidates for digit d in a box lie on one row/column, remove d from the rest of that row/column outside the box.
- `Locked Candidates Type 2 / Claiming`: if all candidates for digit d in a row/column lie inside one box, remove d from the rest of that box.
- Useful for a procedural solver because it converts a box-line alignment into deterministic eliminations.

### Naked Subsets
- General rule: if N cells in one house contain only N candidate values in total, those N values are locked into those cells and can be removed from other cells in the house.
- Includes Naked Pair, Naked Triple, Naked Quadruple.
- Locked Pair/Triple: if the subset also lies in a second house, eliminations apply to both houses.
- HoDoKu notes that naked subsets are easiest after full candidates are filled in.

### Hidden Subsets
- General rule: if N candidates in one house appear only in N cells, those candidates must occupy those cells and all other candidates can be removed from those cells.
- Includes Hidden Pair, Hidden Triple, Hidden Quadruple.
- Larger hidden subsets are harder for humans because they require more short-term memory.

### Basic Fish
- General fish language: base sets, cover sets, fish digit.
- `X-Wing`: two base rows/columns for one digit are covered by two columns/rows; eliminate that digit in the cover sets outside the base sets.
- `Swordfish`: same structure with three base and three cover sets.
- `Jellyfish`: same with four base and four cover sets.
- Larger basic fish are unnecessary because complementary smaller fish exist.

### Wings
- `XY-Wing`: a bivalue pivot `{X,Y}` sees two pincers `{X,Z}` and `{Y,Z}`; any cell seeing both pincers cannot be `Z`.
- HoDoKu explicitly describes XY-Wing as a short XY-Chain converted into a pattern.
- `XYZ-Wing`: pivot has `{X,Y,Z}`; Z can be removed only from cells seeing both pincers and the pivot.
- `W-Wing`: two bivalue cells with same candidates connected by a strong link on one candidate; eliminate the other candidate from cells seeing both bivalue cells.

### Chains and Loops
- HoDoKu's key claim: every known Sudoku can be solved using chains of various complexity plus singles.
- Chain definition: stream of implications from a premise to a result.
- Contradiction chain: if assuming a candidate leads to contradiction, the premise is false.
- Verity/common-result chain: if opposite premises lead to the same result, that result is true.
- Reversible chain endpoint logic: if one of two endpoints must be true, eliminate the chain digit from cells seeing both endpoints.
- `Weak link`: if A is true, B is false; both may be false.
- `Strong link`: if A is false, B is true; strong links can also be used as weak links, but not vice versa.
- AIC core: links alternate weak/strong.
- `Group links`: groups of candidates can act as chain nodes.
- `ALS in chains`: an ALS can provide a strong inference because removing one candidate turns it into a locked set.
- `Chain vs Net`: HoDoKu treats a chain as linear; if a link depends on earlier non-immediate outcomes or branches, it is a net.
- Covered chain variants: Remote Pair, X-Chain, XY-Chain, Nice Loop/AIC, Grouped AIC, AIC with ALS nodes.

## Contribution to Formula-Like Workflow
- HoDoKu supports a layered algorithm: maintain candidates, apply deterministic eliminations, repeat until singles appear, escalate by families.
- It also suggests a theoretical endpoint: chains plus singles may solve all known puzzles, but chain complexity can become very high.
- For a human-friendly formula, pattern techniques can be treated as shortcuts/special cases of more general chain/subset logic.
