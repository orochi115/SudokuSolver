# SK Loops

Source: https://www.sudokuwiki.org/SK_Loops (SudokuWiki.org, Andrew Stuart)
Mirror captured 2026-06-23 for the SudokuSolver research library. Paraphrase/quotation for research; consult the source page for the canonical text, diagrams and worked Easter Monster example.

## Definition

SK Loops are advanced ("diabolical"/extreme) solving patterns. They are bi-directional continuous loops: the loop can be started at any point and the links traced in either direction. They were discovered during attempts to solve the "Easter Monster" puzzle and consist of a continuous chain of hidden pairs.

## Structure

- The loop requires 4 boxes arranged in 2 bands and 2 stacks, forming a rectangle.
- There are 8 links: one link in each box, one link in each participating row, and one link in each participating column.
- In each box, the cell at the intersection of the row-cells and the column-cells is a given.
- Of the two cells involved in a row- or column-link within a box, one of the two can be solved, but it is not a given.
- Links may be single, double, or triple, as long as the sum of the link sizes is ≤ 16. In the classic Easter Monster case there are eight hidden pairs spread over eight pairs of cells, so sixteen numbers fill those cells.

## Outer and inner links

- Outer links: two boxes that lie in the same band (or stack) share a pair of candidates in common.
- Inner links: the mini-row and mini-column through the pivot of a box share two further candidates that are not part of the outer links.

## Loop notation

The loop is written as a chain of strong links progressing around the rectangle, e.g.
`(27=38)B13- (38=16)B79- (16=39)AC8- ...`

## Eliminations

Because the sixteen cells are identified as a locked set, eliminations are made along the units of alignment:

- Outer-link candidates can be eliminated from the rest of the shared row/column outside the pivot squares.
- Inner-link candidates can be eliminated from the rest of the box outside the mini-row and mini-column.

## Relationship to MSLS

Every SK-Loop always implies an MSLS, even though the SK-Loop's logic is presented differently and is easier to program/recognise. SK loops are simplified versions of MSLS (they were found first), later also nicknamed "virus patterns."

## See also (non-HoDoKu)

- SudokuWiki SK Loops: https://www.sudokuwiki.org/SK_Loops
- enjoysudoku forum, "Domino Loops (SK Loops & Beyond)": http://forum.enjoysudoku.com/domino-loops-sk-loops-beyond-t32789.html
- Steve K's Solution to Easter Monster, the SK-Loop: https://sudoku.allanbarker.com/sweb/extra/steaster/steaster.htm
- sudoku.coach / taupierbw SK Loop: https://www.taupierbw.be/SudokuCoach/SC_SKLoop.shtml
