Title: HoDoKu: Solving Techniques - Single Digit Patterns (Skyscraper, 2-String-Kite, Turbot Fish, Empty Rectangle)

URL Source: https://hodoku.sourceforge.net/en/tech_sdp.php

Markdown Content:
## Table of Contents

*   [Skyscraper](https://hodoku.sourceforge.net/en/tech_sdp.php#sk)
*   [2-String Kite](https://hodoku.sourceforge.net/en/tech_sdp.php#t2sk)
*       *   [Standard Pattern](https://hodoku.sourceforge.net/en/tech_sdp.php#t2sk1)
    *   [Dual 2-String Kite](https://hodoku.sourceforge.net/en/tech_sdp.php#t2sk2)

*   [Turbot Fish](https://hodoku.sourceforge.net/en/tech_sdp.php#tf)
*   [Empty Rectangle](https://hodoku.sourceforge.net/en/tech_sdp.php#er)
*       *   [Standard Pattern](https://hodoku.sourceforge.net/en/tech_sdp.php#er1)
    *   [ERs with only two candidates](https://hodoku.sourceforge.net/en/tech_sdp.php#er2)
    *   [Dual Empty Rectangle](https://hodoku.sourceforge.net/en/tech_sdp.php#er3)

* * *

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Skyscraper

A Skyscraper is a simple pattern that occurs rather often in sudokus and can be easily spotted. It is nothing really new: A Skyscraper is a special form of [Turbot Fish](https://hodoku.sourceforge.net/en/tech_sdp.php#tf) and it can be seen as two [Sashimi X-Wings](https://hodoku.sourceforge.net/en/tech_fishfs.php#fbf2).

The description of the pattern sounds more complicated than it really is: Concentrate on one digit. Find two rows (or columns) that contain only two candidates for that digit. If two of those candidates are in the same column (or row), one of the other two candidates must be true. All candidates that see both of those cells can therefore be eliminated. Let's look at examples:

[![Image 1: Sudoku technique: Example for Skyscraper](https://hodoku.sourceforge.net/examples/sk01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sk01&tech=Skyscraper)[![Image 2: Sudoku technique: Example for Skyscraper](https://hodoku.sourceforge.net/examples/sk02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=sk02&tech=Skyscraper)

Take the left example: In column 6 digit 1 can only be placed in row 1 or row 5. In column 9 digit 1 can only be placed in row 3 or row 5. r5c6 and r5c9 are in the same row (the "base" of the skyscraper). We can now reason as follows: If r1c6 is not true, then r5c6 must be true (only two possible values, one of them must be true: [strong link](https://hodoku.sourceforge.net/en/tech_chains.php#strong_link)). But if r5c6 is true, r5c9 cannot be true since they are in the same row ([weak link](https://hodoku.sourceforge.net/en/tech_chains.php#weak_link)). And if r5c9 is not true, r3c9 has to be true ([strong link](https://hodoku.sourceforge.net/en/tech_chains.php#strong_link)). We have thus proved, that r3c9 has to be true, if r1c6 is not true. The same argument holds if we start with r3c9 not true: It follows, that r1c6 has to be true. Since one of r1c6 and r3c9 has to be true, all candidates that can see both cells can be eliminated (in our example: r1c78 and r3c45).

Luckily for you it is not necessary to follow through the logic everytime you look for a Skyscraper: You only have to identify the pattern.

It can be seen, that the places of the candidates are subject to a restriction: The two top cells have to be in the same band or nothing can be eliminated.

The example on the right shows a Skyscraper, that has been rotated 90 degrees clock wise: Skyscraper on 4 in r2c5,r8c4 (connected by r28c1) => r1c4<>4

If we look at the left example again we can easily identify the two Sashimi X-Wings that are contained in it: The first is c59/r35, fin in r1c6, eliminating 1 from r3c45. The second is c59/r15, fin in r3c9, eliminating 1 from r1c78.

* * *

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)2-String Kite

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Standard Pattern

A 2-String Kite is a second special form of [Turbot Fish](https://hodoku.sourceforge.net/en/tech_sdp.php#tf), that can be found in lots of sudokus. The description: Concentrate again on one digit. Find a row and a column that have only two candidates left (the "strings"). One candidate from the row and one candidate from the column have to be in the same block. The candidate that sees the two other cells can be eliminated.

2-String Kites work similar to Skyscrapers: One of the two ends of the strings must be true.

[![Image 3: Sudoku technique: Example for 2-String+Kite](https://hodoku.sourceforge.net/examples/2sk01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=2sk01&tech=2-String+Kite)[![Image 4: Sudoku technique: Example for 2-String+Kite](https://hodoku.sourceforge.net/examples/2sk02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=2sk02&tech=2-String+Kite)

Left example: Candidate is 5. The first string is in column 7 (candidates r29c7), the other is in row 8 (candidates r8c49). The end points r9c7 and r8c9 are both in box 9. If r2c7 is not true, then r9c7 has to be true, r8c9 has to be false, and r8c4 has to be true. If r8c4 is not true, the same argument leads to r2c7 true. Either way r2c4, that sees both r2c7 and r8c4, cannot be true.

Right example: Candidate 9, strings r6c16 and r47c2, connected in box 4: r7c6 cannot be 9.

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Dual 2-String Kite

Sometimes the same two connecting candidates in the common box can be tied two four different strings, forming effectively two 2-String Kites, that eliminate two candidates. Those two 2-String Kites can be considered to be one move only and can be called Dual 2-String Kite. HoDoKu supports dual forms only as an option (they can always be replicated by the two kites that build the dual form).

[![Image 5: Sudoku technique: Example for Dual+2-String+Kite](https://hodoku.sourceforge.net/examples/d2sk01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=d2sk01&tech=Dual+2-String+Kite)[![Image 6: Sudoku technique: Example for Dual+2-String+Kite](https://hodoku.sourceforge.net/examples/d2sk02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=d2sk02&tech=Dual+2-String+Kite)

Left example: The common candidates are r1c3 and r3c1 in box 1. The two kites that can be built with them are: r1c38/r36c1 (r6c8<>1) and r3c19/r14c3 (r4c9<>1).

Right example: Common candidates r7c2 and r9c1 in box 7. Kites: r29c1/r7c28 (r2c8<>4) and r17c2/r9c19 (r1c9<>4).

* * *

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Turbot Fish

A Turbot Fish is really a chain and not a fish. For a detailled description of the various techniques and terms regarding chains please see [Chains: Introduction](https://hodoku.sourceforge.net/en/tech_chains.php#in).

A Turbot Fish is an [X-Chain](https://hodoku.sourceforge.net/en/tech_chains.php#x) that is exactly four candidates long. Various shapes can be built with such a chain. One of them resembles a fish, which gave the technique its name (look at the right example: draw two lines from the red candidate to the nearest green and blue candidates to see the fish shape).

Turbot Fishes have gone a bit out of style. One of the reasons is, that most of the principle turbot patterns have been described as seperate patterns with their own names: Skyscraper, 2-String Kite and Empty Rectangle (only two candidates in the empty rectangle itself).

[![Image 7: Sudoku technique: Example for Turbot+Fish](https://hodoku.sourceforge.net/examples/tf01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=tf01&tech=Turbot+Fish)[![Image 8: Sudoku technique: Example for Turbot+Fish](https://hodoku.sourceforge.net/examples/tf02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=tf02&tech=Turbot+Fish)

The examples above show two of the possibilities: On the left is an Empty Rectangle, on the right a 2-String Kite.

[![Image 9: Sudoku technique: Example for Turbot+Fish](https://hodoku.sourceforge.net/examples/tf03.png)](https://hodoku.sourceforge.net/en/show_example.php?file=tf03&tech=Turbot+Fish)[![Image 10: Sudoku technique: Example for Turbot+Fish](https://hodoku.sourceforge.net/examples/tf04.png)](https://hodoku.sourceforge.net/en/show_example.php?file=tf04&tech=Turbot+Fish)

The examples above: On the left a Skyscraper, on the right an Empty Rectangle again (the right example really contains a Dual Empty Rectangle)

* * *

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Empty Rectangle

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Standard Pattern

Empty Rectangles have been used in lots of different forms in very advanced techniques. The pattern described here is a very basic variant.

Let's start with a definition of the Empty Rectangle (ER) itself: If one candidate is restricted to exactely one row and one column within a box, the remaining cells form an ER. Look at the two examples below: On the left candidate 9 in box 5 is restricted to row 4 and column 6. The ER is r5c45 and r6c45. On the right candidate 1 in box 5 is restricted to row 4 and column 5. The ER is r5c46 and r6c46.

If an ER has been found, it can be checked for eliminations: Find a conjugate pair (a row or column containing only two candidates) where one of the candidates is in the row (column) forming the ER. If the column (row) of the ER contains a candidate, that can see the second candidate of the conjugate pair, it can be eliminated.

An ER pattern that follows the description above can always be seen as a [Finned Mutant X-Wing](https://hodoku.sourceforge.net/en/tech_fishc.php#mf) or as a [Grouped Nice Loop](https://hodoku.sourceforge.net/en/tech_chains.php#gnl).

[![Image 11: Sudoku technique: Example for Empty+Rectangle](https://hodoku.sourceforge.net/examples/er01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=er01&tech=Empty+Rectangle)[![Image 12: Sudoku technique: Example for Empty+Rectangle](https://hodoku.sourceforge.net/examples/er02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=er02&tech=Empty+Rectangle)

On the left: Row 4 and column 6 form an ER in box 5. r48c2 form a conjugate pair. One side of the conjugate pair is in the ER row (r4c2), the other can see a candidate in the ER column (r8c6). 9 can be eliminated from r8c6.

To see why this works, let us start with candidate 9 in r8c2: If r8c2 is 9, r8c6 cannot be 9 (same row). If r8c2 is not 9, r4c2 has to be 9 (conjugate pair/strong link), which means that neither r4c5 nor r4c6 can be 9. This leaves r6c6 as last candidate 9 in box 5, it must be true and r8c6 must be false again. Since both possibilities in r8c2 lead to the same result (r8c6<>9), 9 can be eliminated from r8c6.

The equivalent Finned Mutant X-Wing: 9 c2b5 r4c6 fr8c2 => r8c6<>9.

The equivalent Grouped Nice Loop: r8c6 -9- r8c2 =9= r4c2 -9- r4c56 =9= r6c6 -9- r8c6 => r8c6<>9.

In the example on the right row 4 and column 5 form the ER, r7c59 is the conjugate pair, and r4c9 can be eliminated.

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)ERs with only two candidates

If the ER contains only two candidates the Empty Rectangle is not clearly defined. The eliminations are of course still valid. The move can be replicated as [Turbot Fish](https://hodoku.sourceforge.net/en/tech_sdp.php#tf) or as [X-Chain](https://hodoku.sourceforge.net/en/tech_chains.php#x). Some sudoku players don't consider ERs with only two candidates valid, therefore HoDoKu supports them only optionally.

**Note:** Since Turbot Fish is before ER in the standard solving order, ERs with two candidates are always found as Turbot Fishes, even if they are enabled. Please move Turbot Fish behind ER (or disable it) to find the ERs below.

[![Image 13: Sudoku technique: Example for Empty+Rectangle+%28only+two+candidates+in+the+ER%29](https://hodoku.sourceforge.net/examples/er201.png)](https://hodoku.sourceforge.net/en/show_example.php?file=er201&tech=Empty+Rectangle+%28only+two+candidates+in+the+ER%29)[![Image 14: Sudoku technique: Example for Empty+Rectangle+%28only+two+candidates+in+the+ER%29](https://hodoku.sourceforge.net/examples/er202.png)](https://hodoku.sourceforge.net/en/show_example.php?file=er202&tech=Empty+Rectangle+%28only+two+candidates+in+the+ER%29)

Left Example: Empty Rectangle: 6 in b8 (r69c1) => r6c4<>6

Right example: Empty Rectangle: 5 in b3 (r8c49) => r2c4<>5

## [](https://hodoku.sourceforge.net/en/tech_sdp.php)Dual Empty Rectangle

Sometimes the eliminated candidate and the end of the conjugate pair form a conjugate pair as well. If that is the case, both strong links can play the role of "conjugate pair" thus leading to two different eliminations. The result is called a Dual Empty Rectangle.

Dual Empty Rectangles are supported as an option in HoDoKu.

[![Image 15: Sudoku technique: Example for Dual+Empty+Rectangle](https://hodoku.sourceforge.net/examples/der01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=der01&tech=Dual+Empty+Rectangle)[![Image 16: Sudoku technique: Example for Dual+Empty+Rectangle](https://hodoku.sourceforge.net/examples/der02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=der02&tech=Dual+Empty+Rectangle)

In the example on the left the ER is formed by row 2 and column 3. r6c35 is a conjugate pair eliminating 2 from r2c5. But r26c5 is a conjugate pair as well eliminating 2 from r6c3.

On the right: Dual Empty Rectangle: 9 in b5 (r67c8/r7c48) => r6c8,r7c4<>9

* * *

Copyright © 2008-12 by Bernhard Hobiger

 All material on this page is licensed under the [GNU FDLv1.3](http://www.gnu.org/licenses/fdl-1.3.html).
