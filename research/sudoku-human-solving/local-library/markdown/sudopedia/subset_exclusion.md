# Subset Exclusion

Source: Sudopedia (mirror) http://sudopedia.enjoysudoku.com/Subset_Exclusion.html — original sudopedia.org/wiki/Subset_Exclusion
Mirror captured 2026-06-23 for the SudokuSolver research library. Content is available under the GNU Free Documentation License 1.2. Paraphrase/quotation for research.

## Definition

The name "Subset Exclusion" is not commonly used in the Sudoku community. The Sudopedia article is created as a bridge between Aligned Pair Exclusion and Death Blossom.

Aligned Pair Exclusion (APE) can be extended to Aligned Triple Exclusion (ATE) and so on. In fact, the set of cells to be enumerated does not need to be aligned at all. Lacking a better name, the resultant technique is called **Subset Exclusion**.

## Example

We can enumerate the possible combinations of the (blue) base cells just as in Aligned Pair Exclusion. The following list shows the possible combinations for a 3-cell base, from top to bottom:

```
5+2+4
5+2+6
5+6+4
5+7+4*
5+7+6*
5+9+4*
5+9+6*
7+2+4
7+2+6
7+6+4
7+9+4
7+9+6
```

The starred combinations are those that cause one of the (yellow) commonly-seen cells to have no candidates left at all, so these combinations can be removed from the list. As a result, we find that **7 can be eliminated from r2c4**.

## Death Blossom

The Death Blossom technique is actually an instance of Subset Exclusion where all but one of the cells to be enumerated falls neatly into Almost Locked Sets (ALSs).
