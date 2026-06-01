# Source Digest: HoDoKu Advanced and Last-Resort Techniques

## Metadata
- Site: HoDoKu by Bernhard Hobiger
- Main index: https://hodoku.sourceforge.net/en/techniques.php
- License note on pages: GNU FDLv1.3
- Local capture type: summarized excerpts and topic map, not full page mirror
- Access date: 2026-06-01

## URLs Captured
- Fish general: https://hodoku.sourceforge.net/en/tech_fishg.php
- Finned/Sashimi Fish: https://hodoku.sourceforge.net/en/tech_fishfs.php
- Single Digit Patterns: https://hodoku.sourceforge.net/en/tech_sdp.php
- Uniqueness: https://hodoku.sourceforge.net/en/tech_ur.php
- Coloring: https://hodoku.sourceforge.net/en/tech_col.php
- ALS: https://hodoku.sourceforge.net/en/tech_als.php
- Miscellaneous / Sue de Coq: https://hodoku.sourceforge.net/en/tech_misc.php
- Last Resort: https://hodoku.sourceforge.net/en/tech_last.php

## Fish Generalization
- Fish are single-digit patterns distinct from chains by presentation, but many overlap with chain logic.
- Core rule: choose N non-overlapping base houses for one digit, then N cover houses that cover all base candidates. Any cover candidate not in a base set can be eliminated.
- Size names: X-Wing size 2, Swordfish size 3, Jellyfish size 4, Squirmbag size 5, Whale size 6, Leviathan size 7.
- Type names: Basic fish use rows/columns; Franken fish include boxes; Mutant fish allow arbitrary row/column/box combinations.
- Finned fish: if extra base candidates are not covered, only eliminations that see all fins are valid.
- Sashimi fish: a finned fish whose finless version is incomplete or degenerate.
- Endo fins and cannibalism are advanced/computer-heavy fish concepts and likely low-priority for human formula unless all else fails.

## Single-Digit Patterns
- `Skyscraper`: one digit in two rows/columns, each with two candidates; one pair shares a base line, so one of the opposite endpoints must be true. Eliminate candidates seeing both endpoints.
- `2-String Kite`: one digit in a row and column, each with two candidates, with one row candidate and one column candidate connected through a box. Eliminate from the cell seeing both free endpoints.
- `Turbot Fish`: exactly four-candidate X-Chain; Skyscraper, 2-String Kite, and some Empty Rectangles are named forms.
- `Empty Rectangle`: one digit restricted to one row and one column inside a box, combined with a conjugate pair to eliminate a candidate. Equivalent to grouped chain or finned mutant fish in many cases.

## Coloring
- Coloring is a single-digit chain visualization method.
- Start from conjugate pairs, i.e. houses where the color digit has exactly two candidates.
- Opposite colors represent opposite truth states.
- `Color Trap`: uncolored candidate sees both opposite colors, so it can be removed.
- `Color Wrap`: two same-colored candidates see each other, so that color is false and all candidates with that color can be removed.
- `Multi Colors`: use multiple disconnected color pairs; has similar power to X-Chains in HoDoKu's implementation.

## Uniqueness Techniques
- Based on the extra assumption that published Sudoku puzzles have exactly one solution. This is not part of base Sudoku rules, so it should be an optional layer in a rigorous workflow.
- `Unique Rectangle`: four cells in exactly two rows, two columns, two boxes, with the same two candidates. If all four became only that pair, the puzzle would have two solutions.
- `UR Type 1`: one cell has extra candidates; eliminate the UR pair from that cell.
- `UR Type 2`: two non-diagonal cells share one extra candidate; eliminate that extra candidate from cells seeing both.
- `UR Type 3`: combine the extra candidates of two cells as a virtual cell with naked subset logic.
- `UR Type 4`: if one UR candidate is locked in a house containing the extra-candidate cells, eliminate the other UR candidate from those cells.
- `UR Type 5/6`, Hidden Rectangle, Avoidable Rectangle, and BUG+1 extend the same uniqueness logic.
- `BUG+1`: if all unsolved cells are bivalue and all candidates appear exactly twice in each house except one extra candidate, that extra candidate must be true to avoid a Binary Universal Grave.

## ALS Techniques
- `ALS / Almost Locked Set`: N cells in one house with N+1 candidates. It does nothing alone but becomes a locked set if one candidate is removed.
- `RCC / Restricted Common Candidate`: a candidate shared by two ALS such that every instance in one ALS sees every instance in the other. It can be true in only one ALS.
- `ALS-XZ`: two ALS share RCC X and both contain non-RCC Z; remove Z from cells seeing all Z instances in both ALS.
- `Doubly Linked ALS-XZ`: two RCCs create stronger locking and can eliminate RCCs and non-RCC digits.
- `ALS-XY-Wing`: three ALS connected by two RCCs; common endpoint digit can be eliminated.
- `ALS Chain`: series of ALS connected by RCCs; common digit at the endpoints can be eliminated from cells seeing all endpoint instances.
- `Death Blossom`: a stem cell connects to ALS petals; if every stem candidate maps to a petal and petals share a digit, remove that shared digit from cells seeing all petal instances.

## Sue de Coq
- A subset-counting technique at the intersection of a row/column and a box.
- Basic form: intersection cells contain extra candidates; add row-side and box-side cells whose candidates partition those extras, producing overlapping locked sets.
- Useful as an advanced grouped subset technique, but harder to turn into a simple scan procedure than ALS-XZ or AIC.

## Last Resort and Boundary With Enumeration
- `Templates`: enumerate possible placements of one digit. HoDoKu says templates are not meant for human players, but can indicate whether single-digit patterns are possible.
- `Forcing Chain`: generic term for chains producing a contradiction or a verity. Multiple forcing chains can combine all possibilities of a cell, house, or candidate to force a common result.
- `Forcing Net`: like forcing chains but branching; HoDoKu calls it a real last-resort method and difficult for humans.
- `Kraken Fish`: combines fish with chains to exploit finned fish that otherwise do not directly eliminate.
- `Brute Force`: not considered a real technique; if enabled every Sudoku can be solved.

## Contribution to Formula-Like Workflow
- Advanced fish, ALS, and AIC can be framed as deterministic elimination engines.
- For a "human all-difficulty" formula, the clean hierarchy may be: simple patterns first, optional uniqueness, then AIC/ALS chains, then multiple forcing chains/nets only if the user accepts complex proof trees.
- Templates and brute force should be excluded from the human formula unless used only as verification or pattern-search guidance.
