Title: Gurth's Theorem - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/Gurths_Theorem

Markdown Content (mirror, nav stripped):

# Gurth's Theorem
Gurth's Symmetrical Placement Theorem

I have been inspired to add a strategy to the solver by the excellent video by Cracking The Cryptic, posted in August 2019 on YouTube. The first instance of this technique was documented by the discussants on this thread way back in 2007, so it's been known about for a long time, but as the video mentions, few solvers test for it. 

However, my investigations show this is only a useful strategy in a very limited number of puzzles and, within the subset of qualifying boards, not all can be progressed with this knowledge. More later. Wikipedia has a good page on the mathematics of Sudoku and a section in Automorphic Sudokus which is the type of puzzle we are going to discuss. 

Top-Left to Bottom Right Symmetry
: Load Example

Lets begin with 'Shining Mirror', the example from Simon and Mark's video which is also in the example list on the solver. 

With the colouring I've employed it's clear that something very symmetrical is going on across the diagonal red line (top left to bottom right). Every clue matches either to itself or to exactly one other number. 
3 maps onto 5, 
6 maps onto 7 and 
1 maps onto 9. 
The remaining three numbers 2, 4 and 8 map onto themselves.

Gurth's Symmetrical Placement idea states that
- if a puzzles clues are symmetrical and
- the puzzle has a unique solution, then
- The solution will also be symmetrical.Which means that ALL the numbers will continue to map in the same way across the whole board. Sounds like a gold mine for solving!

An important point first. All the clues must have a complement - it's no good if there is a stray clue somewhere with an empty cell on the opposite side. Nor can only some be mapped 1:1, every number must map 1:1 only once. That's quite a restriction.

Second point: What is a symmetry? If you rotate a puzzle 90 degrees it will look like a completely different puzzle, especially if is on a different page in a book. However, it will have the same grade and will solve in exactly the same way in a solver. Changing all the numbers, eg from 9s into 1s, 8s into 2s, will have the same non-effect. Same puzzle in essence. The technical word for this is Automorphism. 

Vertical symmetry does not work

In the example of Shining Mirror we can use the diagonal reflection from top left to bottom right. Because the cells A1, B2 to J9 are complements of themselves (they do not reflect elsewhere) it is inevitable that the numbers on that line map to themselves. Which is why 2=2, 4=4 and 8=8. For a diagonal reflection there must be at least 3 numbers that behave like this, which makes it useful for solving this particular puzzle.

Lets briefly consider vertical and horizontal reflection. Because the axis of the reflection is along an entire row, row E, every number 1 to 9 must be in that row and along that axis. That means that the 1:1 mapping for each number will be for all numbers. That makes it impossible to have a full board with that property though-out. So we can forget vertical and horizontal as potential symmetries.

Rotational Symmetry
: Load Example

Lets take a look at a rotational symmetry, this one a full half turn or 180°. This is more difficult to spot in the wild, it takes some staring to see that every clue apart from 9, maps only onto one other number, if you rotate around the center cell by a half turn. I have coloured the mappings. We can see that since 9 alone maps to itself, the center cell E5 must be 9. This cell is the only cell that stands still under the rotation. We'd have spotted that anyway, since it is the last available number in that cell (Naked Single). Elswhere
1 maps onto 8, 
2 maps onto 7,
3 maps onto 6 and
4 maps onto 5. 

## Why is the Theorem True?

If a true symmetrical placement exists then we will get back the original puzzle after doing both the reflection or rotation and then the mapping (permutation). These two steps done in sequence will return the puzzle to the original state. Gurth's observation is that if the subset of the board which are the clues have this property, then the entire solved puzzle will as well.

In order for this assertion to be false, we have to show that there is a way of filling in the puzzle in such a way that the symmetry is broken. This can only be done if there is more than one solution. If that argument sounds a little circular, then do have a watch of the video which shows a proof by contradiction. 

## How useful is this strategy?

Shining Mirror
: Load Example

Somewhat. In my original implementation in 2019 I only concentrated on direct eliminations. However in late 2025 it was improved to removed all mirrored candidates after any successful strategy. This considerably reduces the complexity of Gurth-compliant puzzles. But these puzzles are still few and far between.

Take a look at Shining Mirror when the new board is freshly loaded and "Take Step" has been clicked once to get to "Show Possibles". This is the first initial clear out of candidates based on the clues. If the puzzle is Gurth-compatible then not only will the clues and the solution be symmetrical and map 1:1 but the entire candidate distribution will as well! This means that we can make no more useful eliminations anywhere on the board that have not already been eliminated by the clues!

An example is A7 which maps by reflection into G1. The remaining candidates in A7 are {3,5,6,9} and these map 1:1 to G1's possibles {5,3,7,1}

The only cells where eliminations are useful are in the cells that map to themselves in reflection, in this case the diagonal. Now, for Shining Mirror, it is necessary to use Gurth's idea to crack open the puzzle. But it is only possible because these cells are restricted to 3 numbers. The eliminations are shown in yellow.

For the rotated puzzle we only have one cell that maps to itself (E5). I believe this example was specially created to show a possible Gurth-compatible example in rotation, but it solves trivially. I would love to find more examples and I hope readers can send them in. I suspect that hard puzzles that can use Gurth's idea are very few and far between.

Update: Riddle of Sho is a rotational 'Gurth' puzzle and the solver finds three eliminations in different steps.

I've done a search through my databases and lists, collections of puzzles from the internet and all the ones I've made myself for stock. It is alarming to find not a single example of a symmetrical puzzle anywhere. I'm also looking at 90° rotations as well. Firstly I thought maybe I was making puzzles with a bias such that certain types of patterns were very unlikely to be produced. That is possible. 

To give an idea of the search space I've reproduced this table from the wikipedia page. These figures are for canonical puzzles - which is really the entire universe of possible boards. Since this is the total for every kind of symmetry it would be better to know what fraction are diagonal and rotational symmetries only. Perhaps readers can help and it would improve the estimate how often this likely to be seen.

So while Gurth's observation is facinating, I suspect it is too esoteric to be useful, but it does deepen our understanding of the nature of the puzzle. In any case, the solver will now alert the user to a compatible puzzle and insert the strategy into this list.

## Update November 2019

E5 is interesting
: From the Start

This puzzle is interesting. I was sent it by someone viewing another video from Cracking Cryptic. Before the Nov 17th update it crashed the solver as 5 was mapping to 0. This is because the puzzle seems Gurth Compatible (180° rotation) except that 5 is not a clue at the start, and therefore has no mapping. However, 5 is an available candidate in E5 and if you manually set this clue it will detect and some eliminations are made. This is the only square where a "ghost" mapping can be made - and it is onto itself.

I was wondering how to alert the user to a potential Gurth puzzle when it lacks one mapping. To be safe and not crash the solver I've put in a test to negate detection in this case.

(Also fixed a bug with the mirrored Gurth eliminations)

Dominique Provent has sent me a nice example set of puzzles that use Gurth's Theorem. All are unsolvable without the trick being employed.

- Puzzle 1

- Puzzle 2

- Puzzle 3

- Puzzle 4

- Puzzle 5

- Puzzle 6

- Puzzle 7

- Puzzle 8

- Puzzle 9

- Puzzle 10

- Puzzle 11

- Puzzle 12

- Puzzle 13

- Puzzle 14

- Puzzle 15

- Puzzle 16

Go back to BUGContinue to Sudoku X Pitfalls
