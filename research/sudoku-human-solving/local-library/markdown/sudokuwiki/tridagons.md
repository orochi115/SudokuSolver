# Tridagons (Thor's Hammer)

Source: SudokuWiki.org, "Tridagons" https://www.sudokuwiki.org/Tridagons (Andrew Stuart)
Mirror captured 2026-06-23 for the SudokuSolver research library. Paraphrase/quotation for research; consult the original for the interactive examples.

## Overview

The Tridagon (a.k.a. "Thor's Hammer") is a pattern first described by Denis Berthier and much developed on the New Sudoku Player's Forum between 2022 and 2025. It relies on a spread of candidates that is very unlikely in randomly created puzzles but appears in lists of the very hardest puzzles. SudokuWiki follows the outline given on "Phil's Folly". The most convincing logical justification cited is Ryokousha's **Cyclical Parity** theory (developed in a video by rangsk).

## Cyclical Parity

The pattern concerns boxes with triples that span all three columns and all three rows in a box. There are six ways to do this. Three of these ways are said to be **rising** (reading the cells left to right, they migrate up and to the right — this is about relative adjacency, not the numbers). The other three are **falling**. All six patterns are either rising or falling, so we can think of their "parity". If rising, they cycle 1→2, 2→3, 3→1 ("cyclical parity").

For every set of three numbers, consider how to fill each stack (three vertical boxes) and band (three horizontal boxes). It is a property of Sudoku that:

- **All rising patterns have a different parity for the band and the stack.**
- **All falling patterns have the same parity for the band and the stack.**

So if you have a rising pattern in box 4 and a rising pattern in box 1 (the diagonal), you are forced to consider a falling pattern for box 2. Trying another rising pattern there leaves no way to fit {1,2,3} into box 1 without a conflict.

It turns out that if you have **four boxes in a square (or rectangle) that all possess three cells with the same triple, and three of the patterns are rising and one is falling (or three falling and one rising), then this situation blocks any solution to the whole puzzle.**

## Guardians and elimination

To save the puzzle from having zero solutions, some additional candidates are required to be present on one of the cells in the pattern. If there is one cell with any number of additional candidates, that cell can have the triple removed from it. These extra candidates are called **Guardians**.

The triples are like Naked/Hidden Triples: it matters that there are three numbers IN TOTAL across the three cells of a box, not that the same three numbers appear in each cell. So while most examples are {123}+{123}+{123}, it could be as sparse as {12}+{13}+{23}.

## More than one Guardian

A single extra candidate among the twelve cells gives a direct, useful action. If more than one cell has a guardian and they are two digits A and B, then at least one of A or B is true — but that alone is insufficient for an elimination (Phil suggests treating A and B as a new link for use in a chain such as an AIC). However, **if A and B are the same digit and can see each other, they become a Pointing Pair**, allowing eliminations in the same box, and along the row/column if suitably aligned. Useful instances are very rare: in one test of 33,600 puzzles, 15,500 useful Tridagons yielded just 22 Pointing-Pair eliminations.

## Example (from comments)

A reader's example (Phil's Folly): puzzle `........1.....2.3...4.15.......346...47..8.1.6.31.78...78...1.63...8..744.67.138.` — after basics, a tridagon on candidates 2/5/9 in boxes b4,b6,b7,b9 has two guardian digits: a 1 in r4c3 and a 1 in r8c3. Since the guardians are the same digit, and candidate 1 in r2c3 sees all the guardians, that 1 can be eliminated.
