Title: HoDoKu: Solving Techniques - Uniqueness (Unique Rectangle, Avoidable Rectangle, BUG+1)

URL Source: https://hodoku.sourceforge.net/en/tech_ur.php

Markdown Content:
## Table of Contents

*   [Introduction](https://hodoku.sourceforge.net/en/tech_ur.php#in)
*       *   [Uniqueness in Sudoku](https://hodoku.sourceforge.net/en/tech_ur.php#un1)
    *   [Unique Rectangle](https://hodoku.sourceforge.net/en/tech_ur.php#un2)
    *   [Binary Universal Grave (BUG)](https://hodoku.sourceforge.net/en/tech_ur.php#un3)

*   [Unique Rectangle Type 1](https://hodoku.sourceforge.net/en/tech_ur.php#u1)
*   [Unique Rectangle Type 2](https://hodoku.sourceforge.net/en/tech_ur.php#u2)
*   [Unique Rectangle Type 3](https://hodoku.sourceforge.net/en/tech_ur.php#u3)
*   [Unique Rectangle Type 4](https://hodoku.sourceforge.net/en/tech_ur.php#u4)
*   [Unique Rectangle Type 5](https://hodoku.sourceforge.net/en/tech_ur.php#u5)
*   [Unique Rectangle Type 6](https://hodoku.sourceforge.net/en/tech_ur.php#u6)
*   [Hidden Rectangle](https://hodoku.sourceforge.net/en/tech_ur.php#hr)
*   [Avoidable Rectangle](https://hodoku.sourceforge.net/en/tech_ur.php#ar)
*       *   [Avoidable Rectangle Type 1](https://hodoku.sourceforge.net/en/tech_ur.php#ar1)
    *   [Avoidable Rectangle Type 2](https://hodoku.sourceforge.net/en/tech_ur.php#ar2)

*   [BUG+1 - Binary Universal Grave + 1](https://hodoku.sourceforge.net/en/tech_ur.php#bug1)
*   [Unique Rectangles with missing candidates](https://hodoku.sourceforge.net/en/tech_ur.php#umc)

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Introduction

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Uniqueness in Sudoku

Uniqueness Techniques are based on the fact that practically every Sudoku sudoku ever published has only one solution. More than that: Most Sudoku players consider sudokus with more than one solution invalid! Thus any constellation, that would lead to two or more solutions, that don't violate the Sudoku rule, must be avoided. The problem is, that uniqueness in published sudokus is not part of the Sudoku rule itself ("any row, column, and block must contain the digits 1 through 9"). This has led to a very heated argument, whether Uniqueness Techniques are valid or not (see [Uniqueness Controversy](http://www.sudopedia.org/wiki/Uniqueness_Controversy) at [Sudopedia](http://www.sudopedia.org/)).

Whether you want to use Uniqueness Techniques or not, is entirely a matter of taste. If you solve sudokus published in books or newspapers, you can be reasonably safe that they have a unique solution (for a few exceptions see the [Hall of Shame](http://forum.enjoysudoku.com/viewtopic.php?t=3071)). If you use a computer program like HoDoKu, the number of solutions will be checked automatically and you will get a warning, if you try to solve an invalid sudoku (see the [User Manual](https://hodoku.sourceforge.net/en/docs_play.php#create_enter_2)).

Uniqueness Techniques are easy to find, versatile, and often advance sudokus that without them would require very complicated techniques. HoDoKu has therefore built in support for an extensive number of different techniques. If you don't want to use them (despite their obvious advantages), you can disable all Uniqueness Techniques with a single mouse click by going to "Edit|Preferences|Steps" (switch to tree view).

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle

A "Unique Rectangle" (UR) consists of four cells that occupy exactly two rows, two columns, and two boxes. All four cells have the same two candidates left (in real sudokus not all cells have to hold all of the UR candidates, see [below](https://hodoku.sourceforge.net/en/tech_ur.php#umc)).

[![Image 1: Sudoku technique: Example for Unique+Rectangle+%28Invalid+sudoku%21%29](https://hodoku.sourceforge.net/examples/ur01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ur01&tech=Unique+Rectangle+%28Invalid+sudoku%21%29)

The example on the left is taken from [Unique Rectangle](http://www.sudopedia.org/wiki/Unique_Rectangle) at [Sudopedia](http://www.sudopedia.org/). Take a look at cells r2c13 and r4c13: They satisfy all necessary constraints. Two rows (row 2 and 4), two columns (column 1 and 3), two blocks (blocks 1 and 4) and two candidates (candidates 6 and 8).

A situation like this is invalid, because the candidates in the cells could be exchanged, thus resulting in two different solutions that both satisfy the sudoku rule (see below). If the sudoku has only one solution, any situation that could lead to a Unique Rectangle must be avoided.

The two (valid) solutions to the UR above:

[![Image 2: Sudoku technique: Example for Unique+Rectangle+-+Solution+1+%28Invalid+sudoku%21%29](https://hodoku.sourceforge.net/examples/ur02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ur02&tech=Unique+Rectangle+-+Solution+1+%28Invalid+sudoku%21%29)[![Image 3: Sudoku technique: Example for Unique+Rectangle+-+Solution+2+%28Invalid+sudoku%21%29](https://hodoku.sourceforge.net/examples/ur03.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ur03&tech=Unique+Rectangle+-+Solution+2+%28Invalid+sudoku%21%29)

A common mistake when looking for URs is to violate the "2 blocks" rule (see the [Sudopedia article](http://www.sudopedia.org/wiki/Unique_Rectangle) for an example).

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Binary Universal Grave (BUG)

A Binary Universal Grave (BUG) is a generalization of an UR: A BUG exists if all unsolved cells have only two candidates and if every candidate appears exactly twice in any row, column, and box. Such a sudoku has two solutions as well.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle Type 1

A UR Type 1 exists, if one of the four cells of a possible UR has additional candidates. If those candidates were eliminated, the UR would exist, causing two solutions. It is therefore absolutely necessary, that one of the additional candidates has to be true. That means, that the UR candidates can be eliminated from the cell with the additional candidates. If only one additional candidate exists, it can be placed in that cell immediately.

[![Image 4: Sudoku technique: Example for Unique+Rectangle+Type+1](https://hodoku.sourceforge.net/examples/u101.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u101&tech=Unique+Rectangle+Type+1)[![Image 5: Sudoku technique: Example for Unique+Rectangle+Type+1](https://hodoku.sourceforge.net/examples/u102.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u102&tech=Unique+Rectangle+Type+1)

In the example on the left candidates 8 and 9 nearly form an UR in r2c23 and r6c23. The UR is only prevented by the additional candidate 3 in r2c2. 8 and 9 can be eliminated from r2c2 (or 3 can be placed in r2c2).

On the right: 2/3 in r2c46,r9c46 => r9c6<>23 (or r9c6=1).

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle Type 2

If in a possible UR two non diagonal cells have only one extra candidate, and that candidate is the same in both cells, all candidates seeing both extra candidates can be eliminated.

The logic is simple: To avoid the UR one of the extra candidates must be true, thus any cell seeing both candidates cannot have the same value placed.

[![Image 6: Sudoku technique: Example for Unique+Rectangle+Type+2](https://hodoku.sourceforge.net/examples/u201.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u201&tech=Unique+Rectangle+Type+2)[![Image 7: Sudoku technique: Example for Unique+Rectangle+Type+2](https://hodoku.sourceforge.net/examples/u202.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u202&tech=Unique+Rectangle+Type+2)

Look at the example on the left: We have a possible UR on 3 and 7 in r7c29 and r8c29. The two non diagonal cells r78c9 have an extra candidate 8. One of those cells must be 8, or the sudoku would have two solutions. Thus 8 can never be placed in r9c9.

An UR Type 2 can eliminate candidates in more than one house as can be seen in the example on the right: The additional 7s in r8c56 eliminate all other 7s from both row 8 and block 8.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle Type 3

This is a combination of UR with [Naked/Locked Subsets](https://hodoku.sourceforge.net/en/tech_naked.php). We look for two non diagonal cells in a possible UR that have extra candidates. Since one of those candidates has to be set to avoid the UR, we can treat both cells as one virtual cell containing only the extra candidates and try to build a Naked Subset (all additional cells have to see both UR cells with extra candidates). If such a UR/Naked Subset is found, all subset candidates can be eliminated from all cells outside the subset (but in the same house of course).

[![Image 8: Sudoku technique: Example for Unique+Rectangle+Type+3](https://hodoku.sourceforge.net/examples/u301.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u301&tech=Unique+Rectangle+Type+3)[![Image 9: Sudoku technique: Example for Unique+Rectangle+Type+3](https://hodoku.sourceforge.net/examples/u302.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u302&tech=Unique+Rectangle+Type+3)

On the left: Possible UR on 1/5 in r4c28 and r6c28. Cell r6c8 has additional candidates 6 and 9 and cell r4c8 has additional candidates 4 and 6. If we treat cells r46c8 as one cell containing only candidates 4, 6 and 9, we can build a [Naked Triple](https://hodoku.sourceforge.net/en/tech_naked.php#n3n3) on those three candidates in r1c8, r2c8, and r46c8. Since these three candidates are locked into those four cells, they cannot be placed in r8c8 or r9c8.

The example on the right shows an UR Type 3 with a [Locked Pair](https://hodoku.sourceforge.net/en/tech_naked.php#n2l2): The additional candidates 1 and 3 in r6c23 form the Locked Pair with r6c1 (locked in row 6 and block 4).

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle Type 4

We look for additional candidates in two non diagonal cells again, but this time we ignore those extra candidates and concentrate on the UR candidates themselves: If one of the UR candidates is not possible anymore in any other cell of a house that contains both cells with the extra candidates, the other UR candidate can be eliminated from those UR cells.

[![Image 10: Sudoku technique: Example for Unique+Rectangle+Type+4](https://hodoku.sourceforge.net/examples/u401.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u401&tech=Unique+Rectangle+Type+4)[![Image 11: Sudoku technique: Example for Unique+Rectangle+Type+4](https://hodoku.sourceforge.net/examples/u402.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u402&tech=Unique+Rectangle+Type+4)

To see how this works, let us take a look at the example on the left: Possible UR on 6/7 in r3c79 and r6c79. r3c7 and r3c9 have additional candidates (meaning: those are the only cells of the UR that could possible contain neither a 6 nor a 7). There are two houses that see both cells r3c7 and r3c9: Row 3 and block 3. Row 3 has candidate 6 only in the UR cells (so does block 3, but this is not necessary - one house is sufficient), so 6 must go in either r3c7 or r3c9. But that means that 7 can be neither in r3c7 nor in r3c9 or we would have two solutions. We can therefore eliminate 7 from r3c79.

The same logic applies to the example on the right: UR candidate 8 is nowhere in column 8 (or block 9), so 2 can be eliminated. Note that additional candidates 8 could be in one of the houses (column 8 or block 9) but not in both. Such a situation is not very likely, however, because the additional 8 would most probably have been eliminated before using a [Locked Candidates](https://hodoku.sourceforge.net/en/tech_intersections.php) move.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle Type 5

UR Type 5 is a variation of UR Type 2, but now the additional candidate can be in diagonal cells as well. Suppose we have a possible UR with one extra candidate in either two diagonal cells or in three cells. All occurences of that candidate can be eliminated in all cells that see all UR cells containing the additional candidate. The logic behind that move is the same as in a [UR Type 2](https://hodoku.sourceforge.net/en/tech_ur.php#u2).

[![Image 12: Sudoku technique: Example for Unique+Rectangle+Type+5](https://hodoku.sourceforge.net/examples/u501.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u501&tech=Unique+Rectangle+Type+5)[![Image 13: Sudoku technique: Example for Unique+Rectangle+Type+5](https://hodoku.sourceforge.net/examples/u502.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u502&tech=Unique+Rectangle+Type+5)

The example on the left is the only published example for a UR Type 5 with only two additional candidates so far: 1 must be set in either r7c8 or r8c5 to avoid the UR. Cell r7c4 sees both UR cells and cannot be 1 itself.

The UR Type 5 on the right has three additional candidates: 6 must be in r8c6, r8c9, or r9c9. It can be eliminated from r8c7.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangle Type 6

UR Type 6 is a variation of UR Type 4. It is not very common, but highly effective, because it always leads to two placements: Suppose we have a possible UR with two diagonal cells containing extra candidates. If one of the UR candidates is nowhere else in the two rows and two columns building the UR, it can be eliminated from the cells with the extra candidates.

[![Image 14: Sudoku technique: Example for Unique+Rectangle+Type+6](https://hodoku.sourceforge.net/examples/u601.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u601&tech=Unique+Rectangle+Type+6)[![Image 15: Sudoku technique: Example for Unique+Rectangle+Type+6](https://hodoku.sourceforge.net/examples/u602.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u602&tech=Unique+Rectangle+Type+6)

Look at the example on the left: In rows 4 and 5 and columns 3 and 4 candidate 5 appears only within the UR: It forms an [X-Wing](https://hodoku.sourceforge.net/en/tech_fishb.php#bf2). If 5 was placed in one of the cells r4c3/r5c4 that contain the extra candidates, it had to be placed in the other cell too, thus forcing the UR and causing two solutions. It is therefore safe to assume that it cannot be in either of those cells.

The example on the right shows an UR Type 6 on candidate 7. Note that every UR Type 6 is accompanied by a pair of [Hidden Rectangles](https://hodoku.sourceforge.net/en/tech_ur.php#hr), each of them leading to the same placements.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Hidden Rectangle

Hidden Rectangles are very versatile, because they can be used in possible URs that contain up to three cells with arbitrary additional candidates (the UR is _hidden_ under a clutter of additional candidates - not to be confused with Almost Unique Rectangles).

We need a possible UR with two or three cells containing additional candidates (with only one cell the UR Type 1 should be used). Now take one UR cell without additional candidates and check the row and the column containing the opposite corner of the UR. If one UR candidate is nowhere outside the UR in those two houses, the other UR candidate can be eliminated from the opposite corner.

[![Image 16: Sudoku technique: Example for Hidden+Rectangle](https://hodoku.sourceforge.net/examples/hr01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=hr01&tech=Hidden+Rectangle)[![Image 17: Sudoku technique: Example for Hidden+Rectangle](https://hodoku.sourceforge.net/examples/hr02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=hr02&tech=Hidden+Rectangle)

To see how this works, let us look at the example on the left: We have only one cell without additional candidates: r7c7, which becomes our starting point. The opposite corner is cell r9c5 contained in row 9 and column 5. Candidate 5 is nowhere outside the UR in those two houses, so 9 can be eliminated from r9c5. Why? If we look at column 5, we see that candidate 5 has to be placed in r7c5 or in r9c5. If it is placed in r9c5, that cell cannot be 9. If it is placed in r7c5, it cannot be in r9c5, and therefore has to be placed in r9c7 too. This forces r7c7 to be 9, and that means that r9c5 cannot be 9 as well or we would have two solutions. Since both possible placements of candidate 5 in column 5 lead to r9c7<>9, 9 can be eliminated from that cell.

The example on the right has only two cells with additional candidates, which means two possible starting cells to check: r2c9 and r3c2. Lets try r2c9 first: The opposite corner is contained in row 3 and column 2. We see that row 3 has a 4 and a 5 outside the UR, so no Hidden Rectangle is possible.

Now r3c2: The houses to check are row 2 and column 9. Candidate 4 appears nowhere in these houses (except in the UR of course), so 5 can be eliminated from r2c9.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Avoidable Rectangle

Avoidable Rectangles differ from Unique Rectangles in that some cells of the UR have already been placed. If placing the remaining cell(s) would cause an UR, the sudoku maker would have had to supply one of the four cells as a given to _avoid_ a possible second solution (hence the name). If therefore none of the already placed cells in the UR are givens, all UR Type x rules can be applied without change. There is one important difference though: Due to the placements sometimes only one of the UR candidates remains possible for the target cell. This can be confusing, but the logic still holds.

HoDoKu currently only supports Avoidable Rectangles Type 1 and 2.

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Avoidable Rectangle Type 1

Similar to [Unique Rectangle Type 1](https://hodoku.sourceforge.net/en/tech_ur.php#u1).

[![Image 18: Sudoku technique: Example for Avoidable+Rectangle+Type+1](https://hodoku.sourceforge.net/examples/ar101.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ar101&tech=Avoidable+Rectangle+Type+1)[![Image 19: Sudoku technique: Example for Avoidable+Rectangle+Type+1](https://hodoku.sourceforge.net/examples/ar102.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ar102&tech=Avoidable+Rectangle+Type+1)

On the left: The possible UR is for candidates 7 and 9 in cells r12c19. The only cell not placed already is r2c9, all other cells are not givens. If we put 9 in r2c9 we could interchange digits 7 and 9 in the four UR cells, thus getting two solutions. Since we know this is not possible, r2c9 cannot be 9.

Please note that the logic only applies, if none of the UR cells are givens. If only one of the cells was a given, the digits could not be exchanged and the sudoku still had only one solution.

On the right: Avoidable Rectangle Type 1: 6/3 in r57c78 => r5c7<>3

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Avoidable Rectangle Type 2

Similar to [Unique Rectangle Type 2](https://hodoku.sourceforge.net/en/tech_ur.php#u2). Type 2 is easier to spot, because both UR candidates are visible as candidates.

[![Image 20: Sudoku technique: Example for Avoidable+Rectangle+Type+2](https://hodoku.sourceforge.net/examples/ar201.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ar201&tech=Avoidable+Rectangle+Type+2)[![Image 21: Sudoku technique: Example for Avoidable+Rectangle+Type+2](https://hodoku.sourceforge.net/examples/ar202.png)](https://hodoku.sourceforge.net/en/show_example.php?file=ar202&tech=Avoidable+Rectangle+Type+2)

On the left: UR on candidates 3 and 7 in r78c37, neither r7c7 nor r8c7 is a given. Additional candidate 9 in r78c3, 9 can be eliminated from all cells seeing both r8c3 and r9c3.

On the right: Avoidable Rectangle Type 2: 2/8 in r45c37 => r18c7,r456c9,r56c8<>9

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)BUG+1 - Binary Universal Grave + 1

A BUG+1 is a possible BUG, where exactly one cell has one additional candidate. That candidate has to be placed to avoid the BUG.

[![Image 22: Sudoku technique: Example for BUG+%2B+1](https://hodoku.sourceforge.net/examples/bug101.png)](https://hodoku.sourceforge.net/en/show_example.php?file=bug101&tech=BUG+%2B+1)[![Image 23: Sudoku technique: Example for This+is+not+a+BUG%2B1%21](https://hodoku.sourceforge.net/examples/bug102.png)](https://hodoku.sourceforge.net/en/show_example.php?file=bug102&tech=This+is+not+a+BUG%2B1%21)

Left side: The additional candidate is candidate 6 in r1c8 (it appears more than two times in at least one house). It can be placed (or 3 and 5 can be eliminated).

Right side: **This is not a BUG+1!** We have only cells with two candidates left (exception: r7c6), but the BUG condition is not satisfied: In row 7 candidate 9 appears three times (r7c147). The same is true for column 6.

* * *

## [](https://hodoku.sourceforge.net/en/tech_ur.php)Unique Rectangles with missing candidates

For a Unique rectangle to work, it is not necessary, that all UR cells hold all UR candidates. The only real necessary condition is, that any UR cell **could have held** all UR candidates (meaning: no UR candidate in an UR cell may be blocked by a given). This can be important, when UR candidates have already been eliminated by a prior step, which would invalidate the UR.

HoDoKu allows for missing candidates, when the "Allow missing candidates in URs" option is set in "Preferences|Steps" (see [Solver options](https://hodoku.sourceforge.net/en/docs_solv.php#options) in the User Manual).

Some examples:

[![Image 24: Sudoku technique: Example for UR+Type+1+with+missing+candidate](https://hodoku.sourceforge.net/examples/u101a.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u101a&tech=UR+Type+1+with+missing+candidate)[![Image 25: Sudoku technique: Example for UR+Type+2+with+missing+candidate](https://hodoku.sourceforge.net/examples/u201a.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u201a&tech=UR+Type+2+with+missing+candidate)

Left side: r3c4 doesn't contain the UR candidate 2, but 2 is not blocked by any given in this cell, so the UR Type 1 is still valid. Right side: UR candidate 5 is missing from r3c8.

[![Image 26: Sudoku technique: Example for UR+Type+6+with+missing+candidate](https://hodoku.sourceforge.net/examples/u601a.png)](https://hodoku.sourceforge.net/en/show_example.php?file=u601a&tech=UR+Type+6+with+missing+candidate)[![Image 27: Sudoku technique: Example for Hidden+Rectangle+with+missing+candidate](https://hodoku.sourceforge.net/examples/h101a.png)](https://hodoku.sourceforge.net/en/show_example.php?file=h101a&tech=Hidden+Rectangle+with+missing+candidate)

Left side: UR Type 6, UR candidate 8 is missing from r3c9 and r6c7; the eliminations are still valid. Right side: Hidden Rectangle, candidate 3 missing from r2c9 and r3c6.

* * *

Copyright © 2008-12 by Bernhard Hobiger

 All material on this page is licensed under the [GNU FDLv1.3](http://www.gnu.org/licenses/fdl-1.3.html).
