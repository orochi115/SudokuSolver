Title: HoDoKu: Solving Techniques - Sue de Coq

URL Source: https://hodoku.sourceforge.net/en/tech_misc.php

Markdown Content:
## Miscellaneous

## Table of Contents

*   [Sue de Coq](https://hodoku.sourceforge.net/en/tech_misc.php#sdc)
*       *   [Basic Variants](https://hodoku.sourceforge.net/en/tech_misc.php#sdc1)
    *   [Extended Types](https://hodoku.sourceforge.net/en/tech_misc.php#sdc2)

* * *

Sue de Coq is a variant of [Subset Counting](http://www.sudopedia.org/wiki/Subset_Counting) and was first introduced by a user with nickname "Sue de Coq" under the somewhat cumbersome name of ["Two-Sector Disjoint Subsets"](http://forum.enjoysudoku.com/viewtopic.php?t=2033). Other users soon started to call the technique by the inventor's nickname "Sue de Coq" (SDC), and that name has been used ever since. The technique in its basic form is rather simple, but it has been enhanced several times. These enhanced versions can be found under [Extended Types](https://hodoku.sourceforge.net/en/tech_misc.php#sdc2) in this guide.

## [](https://hodoku.sourceforge.net/en/tech_misc.php)Basic Variants

The basic variant is rather simple: Look for cells at the intersection of a row and a block. You have to find either two cells containing 4 candidates or three cells containing 5 candidates. Now find a bivalue cell in the row outside of the intersection whose candidates are draw entirely from the intersection candidates. Find another bivalue cell in the block with candidates drawn from the intersection too, but different from the candidates in the row cell.

This constellation is a Sue de Coq: You can eliminate all row cell candidates from the rest of the cells in the row, all block cell candidates from the rest of the cells in the block and any intersection candidate that is left from both the row and the block. This can amount in some rather impressive steps.

The term "row" in the definition above can be replaced throughout with "column".

[![Image 1: Sudoku technique: Example for Sue+de+Coq+%28basic+variant%29](https://hodoku.sourceforge.net/examples/sdc01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sdc01&tech=Sue+de+Coq+%28basic+variant%29)[![Image 2: Sudoku technique: Example for Sue+de+Coq+%28basic+variant%29](https://hodoku.sourceforge.net/examples/sdc02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sdc02&tech=Sue+de+Coq+%28basic+variant%29)

Example on the left: The intersection cells are r7c13. They contain the candidates {3459}. The row cell is r7c7 containing {45}, the block cell is r8c3 containing {39}. 4 and 5 can be eliminated from the rest of the row and 3 and 9 can be eliminated from the rest of the block.

If we look at the intersection alone, we find we have two candidates to many (4 candidates for only 2 cells). But since the row cell r7c7 has to contain one of those candidates, we are left with only 3 candidates for 2 cells (3, 9, and 4 or 5). The block cell r8c3 removes another possibility: The intersection cells can now be 3 or 9 and 4 or 5 (2 candidates in 2 cells).

The SDC more or less produces two overlapping locked sets: Candidates 3 and 9 are locked into (r7c13, r8c3). Since all those cells are in block 6, 3 and 9 cannot be in another cell of that block. Candidates 4 and 5 are locked into (r7c13,r7c7). Since all of those cells are in the same row, 4 and 5 cannot be elsewhere in that row.

The example on the right shows an intersection with three cells containing five candidates: Cells r789c9 contain candidates {24567}. The column cell r2c9 contains candidates {56}, the block cell r9c7 contains candidates {27}. The logic is the same as above, but the result is three candidates in three cells: The intersection cells can be {2 or 7, 4, and 5 or 6}. That means that candidate 4 gets locked within the intersection and can be eliminated from both block and column.

## [](https://hodoku.sourceforge.net/en/tech_misc.php)Extended Types

Sue de Coq can be enhanced in two possible ways:

1.   The intersection cells can contain additional candidates. For every additional candidate an additional cell in the row/column or in the block must be found.
2.   The row cells (column cells) and the block cells can contain candidates not drawn from the intersection set. For any such additional candidate one additional cell is necessary.

It is important to note, that the SDC can have only two cells in the intersection with the possible third cell being part of either the row or the block cells. Likewise, if additional candidates are used, that are not drawn from the intersection set, the same candidate can be used in row cells and block cells.

A more formal definition of SDC is given in the original Two-Sector Disjoint Subsets thread:

Consider the set of unfilled cells C that lies at the intersection of Box B and Row (or Column) R. Suppose |C|>=2. Let V be the set of candidate values to occur in C. Suppose |V|>=|C|+2. The pattern requires that we find |V|-|C|+n cells in B and R, with at least one cell in each, with at least |V|-|C| candidates drawn from V and with n the number of candidates not drawn from V. Label the sets of cells CB and CR and their candidates VB and VR. Crucially, no candidate from V is allowed to appear in VB and VR. Then C must contain V\(VB U VR) [possibly empty], |VB|-|CB| elements of VB and |VR|-|CR| elements of VR. The construction allows us to eliminate candidates VB U (V\VR) from B\(C U CB), and candidates VR U (V\VB) from R\(C U CR).

Some examples:

[![Image 3: Sudoku technique: Example for Sue+de+Coq+%28extended+variant%29](https://hodoku.sourceforge.net/examples/sdc04.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sdc04&tech=Sue+de+Coq+%28extended+variant%29)[![Image 4: Sudoku technique: Example for Sue+de+Coq+%28extended+variant%29](https://hodoku.sourceforge.net/examples/sdc03.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sdc03&tech=Sue+de+Coq+%28extended+variant%29)

On the left: Intersection cells r46c8 with candidates {3578}, column cell r8c8 {35} and block cells r4c7,r5c9 {789}. This is pretty much our standard case, except that the block cells contain candidate 9, which is not drawn from the intersection. That's why two block cells are necessary.

On the right: Intersection r456c1 - {123479}. 6 candidates in three cells is one to many. One of the additional sets has to be three candidates in two cells. In the example it is the column: r89c1 containing {234}. The block set has an additional candidate 5 not drawn from the intersection.

[![Image 5: Sudoku technique: Example for Sue+de+Coq+%28extended+variant%29](https://hodoku.sourceforge.net/examples/sdc05.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sdc05&tech=Sue+de+Coq+%28extended+variant%29)[![Image 6: Sudoku technique: Example for Sue+de+Coq+%28extended+variant%29](https://hodoku.sourceforge.net/examples/sdc06.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sdc06&tech=Sue+de+Coq+%28extended+variant%29)

The example on the left was posted on the Player's Forum: It is a standard 4 candidates in two cells variant, but both additional sets (column cells and block cells) contain an additional candidate, which is the same in both cases (candidate 1).

The example on the right is 5 candidates in two cells, but it demonstrates a combination of all enhancements:

1.   Although the intersection of column 4 with block 2 has three unsolved cells, only two of them form the intersection set: r23c4 - {13689}. Cell r1c4 is part of the block cells.
2.   The column cell r5c2 has two candidates {39} drawn from the intersection set: This is standard.
3.   We still have two candidates too many, so we need two block cells. Unfortunately a fitting set that covers candidates {168} can only be found by including an additional digit 7. The block set thus consists of three cells: r1c46,r2c6 with candidates {1678}.

The resulting Sue de Coq eliminates 13 candidates.

* * *

Copyright © 2008-12 by Bernhard Hobiger

 All material on this page is licensed under the [GNU FDLv1.3](http://www.gnu.org/licenses/fdl-1.3.html).
