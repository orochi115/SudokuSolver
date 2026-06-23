Title: Broken Wing - Sudopedia Mirror

URL Source: http://sudopedia.enjoysudoku.com/Broken_Wing.html

(Mirrored from Sudopedia, the Free Sudoku Reference Guide. Content available under GNU Free Documentation License 1.2. Page last modified 5 November 2009.)

# Broken Wing

A Broken Wing is a single-digit pattern similar to a Turbot Fish. It is also a solving technique that uses this pattern.

## How it works

A correct Sudoku cannot contain a closed loop with an **odd** number of strong links. Every candidate would contradict itself when the implications through the loop are followed. When a single-digit pattern is present that is *almost* such a closed loop, the grid must contain one or more candidates that prevent the pattern from forming an odd-sized, strong-links-only loop. These candidates are the **guardians**. One of these guardians must be true, which is the premise for the technique. Several logical deductions follow.

## Single Guardian

The cells marked with X form a loop r5c2 - r2c2 - r2c5 - r1c6 - r5c6 which already has 4 strong links. If the guardian G in r5c8 were removed, the loop of 5 strong links would be closed, making the puzzle invalid. As a result, we can place the selected digit in the single guardian.

## Multiple Guardians

The same loop forms the basis. With 2 guardians both in column 8, we know that at least one of them must be true. Therefore we can eliminate the remaining candidates for this digit from column 8 (the * cells). It is also possible to use the guardians to eliminate cells that are part of the loop.

## Alternate Broken Wing Solving Techniques

The broken wing pattern is actually a group of 6 unique patterns with anywhere from 1 to 4 conjugate pairs (strong links). The guardian technique is only rarely useful because there are frequently too many guardian cells. For 4 of these 6 patterns, simple coloring and multi-coloring / X-chains on the pattern itself can solve or partially solve the pattern:

- **Color-wrap broken wing** (4 strong links, 1 weak link): simple coloring always wraps in the two cells of the weak link; the whole pattern is solved.
- **Multi-color broken wing** (3 strong links, 2 weak links): the strong links split into a one-link chain and a two-link chain; the ends of the 2-link chain (same color) see both cells of the 1-link chain, so the center of the chain must be X. Three of the five cells are solved.
- **Color-trap broken wing** (3 strong links): the three strong links form a simple color chain; a trap occurs in the cell common to both weak links. If all five cells contain identical XY pairs the chain is valid for both digits (dual color chain).
- **AIC pattern** (two strong links separated by weak links): one cell can be eliminated with multi-coloring or X-chain.
- Two remaining patterns: one with a single strong link, one with two adjacent strong links. If the guardian technique does not apply, these do not help solve the puzzle.
