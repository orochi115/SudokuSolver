Title: Twinned XY-Chains - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/Twinned_XY_Chains

Author: Andrew Stuart (original pattern by Nils Leder, Germany)
Created: 14-May-2025
Last Modified: 14-May-2025

Markdown Content:
# Twinned XY-Chains

Regretfully this has been in my inbox for three years but I'm glad I don't throw things away lightly. Nils Leder from Germany wrote to me with a novel pattern I think is worth including in the solver. He's doing some sophisticated puzzle variant stuff on logic-masters.de. This pattern is not terribly common but that might mean my implementation of the idea is too tightly coded and I'm not finding other valid instances — or my understanding of the pattern isn't sufficiently broad. I was getting more hits at one point but also false positives which we don't want.

## Original example by Nils Leder

Load Example / From the Start grid:
`080402000000065001600100000070000300058200970300000002800010003500000009000907480`

The pattern is six cells arranged in a 3 by 2 or 2 by 3 formation. Being in different boxes does not appear to matter. So this isn't like some other patterns (eg Unique Rectangles). The pattern requires there are six candidates found in those six cells but because not all cells can see all other cells in the formation we can't assume all six must appear once in those cells. That would be too easy.

In Nils' example E1, E5, E9, J1, J5 and J9 have two candidates taken from a set {1,2,3,4,5,6} except for J5 which has three {2,3,5}. There are no two candidates N which are not paired (i.e. could be a link).

As Nils writes:

> "The interesting thing is that the cells always are forced to contain each of the numbers 1 to 6. One could describe them as intertwined XY-Cycles since, if the option 5 is removed from J5, the cells E1, E5, J1 and J5 form an XY-cycle on the numbers {1,2,3,4}. And if, on the other hand, the option 2 is removed from J5, then the cells E5, E9, J5 and J9 form an XY-cycle on {3,4,5,6}."
>
> "So there definitely exists an XY-cycle although one cannot tell if it's on the left or on the right side in rows E and J. But as the digit 4 appears in both potential XY-cycles, one XY-cycle will also 'activate' the other one."

I'd also add because all candidates of the same value can see each other there will never be two of N in these cells and five in total candidates. That (and the Twinned XY-Cycles) make this a giant Naked set. We can eliminate off-chain in the direction of all pairs of numbers.

In finding similar patterns I'm drawn to looking first for a triple of bi-value cells in one row or column. Checking [if] one candidate is in all three cells (as 4 is in E1, E5 and E9). Then looking for another row with 2 and 3 candidate cells to make 6. I'm not specifically looking for strong links and if they were all strong (bi-location) there would be no eliminations.

## Example 2

Load Example / From the Start grid:
`850900000000010000067030400020300009003050600600001070006040510000070000000003082`

Found in Ruud's top 50k test list. The inclusion of this strategy knocks the puzzle down from an extreme (659) to a diabolical (223). Oriented in the column we have 6 as the common candidate in cells A5, D5 and J5. These look onto cells A7 with {1,2,7}, D7 and J7. The two XY-Chains must be traced from row A which is the shared row, unlike the first example where the triple was in the middle.

## Example 3

Load Example / From the Start grid:
`270000400009120300000009080000300509000010000620007000002500000080074050040000906`

And to finish lets consider a pattern which does not follow the single triple cell examples looked at so far. This shows that the solver is looking a bit wider than the original example but I still think there is room for improvement. The critical aspect that makes this work [is] that all of the candidates of the same value are still visible to each other. That means we can work with three 4s, three 8s and three 2s as they are sticking to their respective rows. The other numbers 1, 3 and 9 are paired in their columns. The XY-Chain is more of an analogy now as the necessity of a candidate in one place removes two in two other cells, which is not typical of XY-Chains.

## Comment (Jan Bouwman, 27-Jan-2026)

Your sentence "...there will never be two of N in these cells" made me wonder if this could be used as an extended locked set. So instead of looking for 6 cells in a 3 by 2 or 2 by 3 formation, I just search for any group of 6 cells that have 6 candidates and where all candidates of the same value can see each other. I have tried this with thousands of puzzles, also with 4, 5 and 7 cells in a group and that gave a lot of hits and never a false positive. Such a group of cells is not bound to a single row, column or square.

(Navigation: Go back to Fireworks — Continue to SK Loops.)
