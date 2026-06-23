Title: Extended Unique Rectangles - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/Extended_Unique_Rectangles

Markdown Content (mirror, nav stripped):

# Extended Unique Rectangles
Extended Unique Rectangles

Unique Rectangles can be larger structures than simple 2 by 2. 
In this extension I show how the solver can now detect 2 by 3. 
Just as a Naked Pair or Hidden Pair can be extended to a Triple, so can the cells that form Unique Rectangles. 

A Triple is any three cells with a total of three candidates left. That doesn't always mean
[1,2,3] + [1,2,3] + [1,2,3]
Which is exactly three candidates in three cells. Other Triples will have some digits missing, like
[1,2,3] + [1,2,3] + [2,3]
[1,2] + [1,2,3] + [1,2,3]
[1,2,3] + [1,2] + [2,3]
And the ultimate skinny triple will have two out of three in each cell:
[1,2] + [1,3] + [2,3]
But all of these have - in total - three candidates in three cells.

## Type 1

Extended Deadly Pattern

Now, 2 by 3 is a bit of an odd shape. Other extensions, like X-Wing to Swordfish jump from 2 by 2 (four cells) to 3 by 3 (nine cells). We don't need to search for a nine-cell 3 by 3 although they do theoretically exist. Take a look at the diagram to the right. In the left hand side marked A I've drawn the full 3 by 3 Deadly Rectangle. 

Note: it must occupy exactly three rows, three columns and three boxes. 

To the right labelled B I've marked out a candidate distribution of 1s, 4s and 8s. For each row and each column you'll see a Triple. If we've arrived at this state we're in trouble because there are many ways to settle those cells in all combinations of 1, 4 and 8. The only thing that saves us are the extra candidates marked in green.

Here's how we go from the 3 by 3 ideal pattern to the much more likely 2 by 3 version: Take away any one of the columns with numbers and you still have a multiple solution problem. For example, if we took away column 8 (and ignored the green extra candidates for a moment), we could still fill column 7 with 1 + 8 + 4 (going down the rows), 4 + 1 + 8 and 4 + 8 + 1. Same for column 9. We could fill it with 4 + 1 + 8 or 4 + 8 + 1 or 8 + 4 + 1. If you take any column away it looks like the problem stays a problem. So conclusion - don't worry about looking for 3 by 3 Deadly Patterns - they will come out in the wash when you find 2 by 3.

Example Extended UR
: Load Example
 or : From the Start

In this first example we have an Extended Deadly Pattern based on the three candidates {1,3,5}. The yellow cells mark the pattern. Notice this pattern is vertical like the theory example above - but as we are not looking for (and don't have) a 3 by 3, we need to look out for the pattern working horizontally as well. One of these is below.

The only type of UR I've implemented in the solver, so far, is Unique Rectangle Type 1.

This says that the odd cell out - the cell with an extra candidate or two - is the key. Those extra candidates must be part of the solution. If they didn't exist we've have a full Deadly Pattern and we need to avoid that at all costs. So 6 in C1 is the extra candidate - it must be the solution, so we can remove 1 and 5 from C1 and progress.

Example Extended UR 2
: Load Example
 or : From the Start

Here is a similar Extended Unique Rectangle based on the cells AEH78 (which just means cells on rows A, E and H and columns 7 and 8). The Triple is {4,7,9} and we have 1 and 6 - on cell E8. That's the get-out-of jail card avoiding the bigger Deadly Pattern. Take away the 4 and 7 from E8 and we're back into single solution territory.

Example Extended UR 3
: Load Example
 or : From the Start

Finally a horizontal example. 

The Triple {3,7,8} sits over the two rows D and E. There is a mixture of bi-value and tri-value cells but we clearly have two triples with the same values very close to each other. We have to use the extra candidates provided. There is a lone 1 in D2 that gets us out of trouble. 

## Type 2

EUR Type 2
: Load Example
 or : From the Start

Type 2 extends the same idea found in Unique Rectangles to three boxes and three candidates. The Floor (yellow cells) is now four cells instead of two. Some of these cells can only have two candidates in them, but all four must have exactly three in total. 

We can look in both the row and the column for the Roof cells (orange). We need to find two more cells that are in a different box and have exactly one extra candidate in both. In the example our Deadly Rectangle triple is {2/3/4}. The extra candidate in G12 is 6. The logic is that 6 must appear in either of G1 OR G2 since without it a deadly Rectangle on {2/3/4} would be created. Knowing this allows us to remove all 6s in the row and box.

If the orientation of the Type 2 was the other way round we'd eliminate in the box and column.

Many thanks to prompts in the comments below and to Ross Trusler for the example he found in the first puzzle in the Fireworks strategy. Turn off Fireworks to get it to show.

## Type 4 

Pieter's Type 4 EUR
: Load Example
 or : From the Start

We can extend the Type 4 Unique Rectangle in an interesting way as decribed in a comment below by Pieter. I'm going to use his example first. 

Instead of a single locked pair of cells we can have two - if they are in different boxes and the roof is in a different box as well.

To see this example you do need to turn off the Tough and XY Chain strategies so the solver can find it. The double Locked Pairs on DF35 (locked by the 4's) which effectively solve to a 1/3 Locked Pair, which then become a UR Type 4 with D7/F7 locked by the 1's, eliminating the 3's. You can see there are no other 1s in column 7 or box 6.

I will admit, instances of the Extended Unique Rectangle are not common, but if you are just getting into Unique Rectangle you'll be looking for the very common Type 1. I think it's worth keeping an eye out for this formation at the same time. You will notice a similar cluster of common candidates and it's just possible - if you remember the three boxes spread rule - that you'll find one when you're looking for the 2 by 2 version.

Go back to Unique RectanglesContinue to Hidden Unique Rectangles
