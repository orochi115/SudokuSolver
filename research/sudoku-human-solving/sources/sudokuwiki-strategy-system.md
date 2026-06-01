# Source Digest: SudokuWiki Strategy System

## Metadata
- Site: SudokuWiki.org by Andrew Stuart
- Main strategy page: https://www.sudokuwiki.org/strategy_families
- Local capture type: summarized excerpts and topic map, not full page mirror
- Access date: 2026-06-01

## URLs Captured
- Strategy families: https://www.sudokuwiki.org/strategy_families
- Brute force vs logical strategies: https://www.sudokuwiki.org/Brute_Force_vs_Logical_Strategies
- Intersection Removal: https://www.sudokuwiki.org/Intersection_Removal
- Naked Candidates: https://www.sudokuwiki.org/Naked_Candidates
- Hidden Candidates: https://www.sudokuwiki.org/Hidden_Candidates
- X-Wing: https://www.sudokuwiki.org/X_Wing_Strategy
- Y-Wing: https://www.sudokuwiki.org/Y_Wing_Strategy
- Alternating Inference Chains: https://www.sudokuwiki.org/Alternating_Inference_Chains

## Why This Source Matters
SudokuWiki is useful because it organizes strategies both by difficulty and by family. It also repeatedly explains why brute-force search is different from logical solving: brute force counts/fills possibilities by exhaustion, while logical strategies explain why each candidate can be placed or removed.

## Difficulty-Oriented Taxonomy
- Basic: introduction, getting started, naked candidates, hidden candidates, intersection removal.
- Tough: X-Wing, Chute Remote Pairs, Simple Colouring, W-Wing, Y-Wing, Rectangle Elimination, Swordfish, XYZ-Wing, BUG, Avoidable Rectangles.
- Diabolical: X-Cycles, 3D Medusa, Jellyfish, Unique Rectangles, Tridagons, Fireworks, SK Loops, WXYZ-Wing, XY-Chains, Aligned Pair Exclusion.
- Extreme: Grouped X-Cycles, Forcing Nets, Exocet, Finned Fish, AIC, AIC with Groups/ALS/URs, Almost Locked Sets, Death Blossom, Sue-de-Coq, Digit/Cell/Unit/Nishio Forcing Chains, Pattern Overlay.

## Family-Oriented Taxonomy
- Basic strategies: naked/hidden subsets and intersection removal.
- Bent sets: Y-Wing, W-Wing, XYZ-Wing, WXYZ-Wing, Almost Locked Pairs/Triples.
- Chaining strategies: X-Wing family, fish, coloring, Remote Pairs, X-Cycles, XY-Chains, AIC variants, forcing chains.
- Exotic: ALS, finned/franken fish, pattern overlay, aligned pair exclusion, Sue-de-Coq, Death Blossom, Exocet.
- Uniqueness: Unique Rectangles, extended/hidden rectangles, avoidable rectangles, BUG+1.

## Brute Force vs Logic
- SudokuWiki defines brute force as backtracking that can fill a board and derive all possible solutions.
- Logical strategies are preferred because they show why each cell/candidate follows from clues.
- Brute force can count solutions and handle faulty/multiple-solution puzzles; logic is for explanatory solving.
- The page notes that mixing basic logic and backtracking can work, but the site intentionally separates pattern-based logic from brute force to discover new logical strategies.

## Strategy Notes

### Intersection Removal
- If a digit appears only in one row/column within a box, remove it from the rest of that row/column outside the box.
- If a digit appears in a row/column only inside one box, remove it from the rest of that box.
- SudokuWiki calls these Pointing Pairs/Triples and Box/Line Reduction.

### Naked Candidates
- Naked Single: the only remaining candidate in a cell.
- Naked Pair: two cells in a unit contain the same two candidates, allowing removal from common unit(s).
- Naked Triple: three cells in a unit collectively contain only three candidates; each cell does not need all three.
- Naked Quad: four cells in a unit collectively contain four candidates.
- The site notes complements: larger naked sets often mirror smaller hidden sets because a unit has nine cells.

### Hidden Candidates
- Hidden Pair: two candidates occur only in two cells of a unit; remove all other candidates from those cells.
- Hidden Triple/Quad: same principle for three/four candidates.
- Hidden sets are often harder to see, but convert cluttered cells into naked sets.

### X-Wing
- Focuses on one digit at a time.
- If two rows each have only two positions for a digit and those positions lie in the same two columns, remove that digit from the rest of those columns. Reverse row/column orientation also applies.
- SudokuWiki generalizes X-Wing to units but notes box-involving versions reduce to intersection removal.

### Y-Wing
- Also known as XY-Wing in many sources.
- Three bivalue cells: pivot AB sees pincers AC and BC.
- If pivot is A then one pincer forces C; if pivot is B then the other pincer forces C. Therefore any cell seeing both pincers cannot be C.
- SudokuWiki emphasizes the pincer/common-candidate visual pattern.

### AIC
- AICs generalize prior chain-like strategies: X-Wing, XY-Chains, Forcing Chains, XYZ-Wing, X-Cycles, Nice Loops.
- Uses both bi-location links (same digit in two cells of a unit) and bi-value links (two candidates in one cell).
- Strong and weak links alternate.
- Continuous loops can produce off-chain eliminations on weak links or inside cells.
- Discontinuous loops with strong/strong discontinuity can place a candidate; weak/weak discontinuity can eliminate a candidate.
- SudokuWiki highlights that grouped cells, ALS, and unique rectangles can also become AIC links.

## Contribution to Formula-Like Workflow
- SudokuWiki reinforces that a practical human formula needs two layers: a difficulty-ordered application sequence and a unifying inference model.
- Its family taxonomy helps avoid memorizing isolated names by grouping them into subsets, intersections, fish, wings, chains, ALS, and uniqueness.
- Its brute-force article is useful for defining the boundary: no backtracking solution-count search in the intended human process.
