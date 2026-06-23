# Multi-Sector Locked Sets (MSLS)

Source: enjoysudoku forum, "Using Multi-Sector Locked Sets" http://forum.enjoysudoku.com/using-multi-sector-locked-sets-t31222.html
Related: "SK-Loops and MSLS's" http://forum.enjoysudoku.com/sk-loops-and-msls-s-t36887.html ; Tom Collyer, "The MSLS: Revolutions" https://tcollyer.blogspot.com/2020/10/the-msls-revolutions.html
Mirror captured 2026-06-23 for the SudokuSolver research library. Paraphrase/quotation for research; consult the forum threads for the canonical posts, full worked examples and community discussion.

## Definition

An MSLS is a rank-0 set-logic pattern. It generalises naked/hidden subsets: a digit subset D considered with a multiplicity M makes up (at most) M copies of D over a collection of cells, and the digits of D squeeze out every other candidate from those cells because there is no room for anything else.

The MSLS pattern appears quite often in extreme puzzles. SK loops are simplified versions of MSLS (they were found first) and were later also called "virus patterns."

## Truth and link counting

MSLS analysis counts truths and links:

- Identify a base set of digits (e.g. `1 2 4 7`).
- Find the rows, columns, and cells that form truths and links, written for example as:
  `14r5 27r6 147r8 12r9 56c3 36c5 89c8 38c9`
- Rank 0 logic is achieved when truths and links match in count.

## Demands and supplies

In rank-0 patterns the demands and supplies exactly match, so any candidate that would reduce a supply without satisfying one of the demands can be eliminated. In MSLS every cell is considered to be either a demand or a supply, which makes the system comparatively straightforward as a general-purpose approach wherever this holds — simple fish, multi-fish, SK loops, and smaller combinations of naked or hidden sets.

## Hidden/naked duality

MSLS combines hidden and naked behaviour at once: in a worked example, digits are squeezed *out of* some cells (hidden-pair behaviour) while simultaneously being excluded *from* other areas (naked-pair behaviour). A set-addition/subtraction reformulation (add a column and a row, subtract the boxes) connects MSLS to Phistomefel's theorem and Fred's intersection theory under one framework.

## Relationship to SK Loops

Every SK-Loop always implies an MSLS, even if the SK-Loop's logic looks different and is easier to program. SK loops are the first-discovered special case; "baby SK Loop" logic on two digits was originally called "Hidden Pair Loops" by Steve K.

## Notes on definition

There is community debate over the exact MSLS definition; some argue its real value is in the *process* that helps spot typical rank-0 patterns, and that found patterns should be described with standard set-logic notation rather than a hybrid notation.
