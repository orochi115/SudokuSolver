Title: Chute Remote Pairs - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/Chute_Remote_Pairs

Markdown Content (cleaned from raw HTML):
Print Version 
 Page Index 
 Chute Remote Pairs Added 24-Jan-2025 This is an excellent and simple pattern we can employ just with eye-balling some cells with the same pair of numbers in them. I've placed it near the start of the 'tough' strategies after X-Wing as it is quite common, doesn't require us to think about strong and weak links, and does not take long to evaluate. Very grateful for Andy Potvin from the United States for promoting the idea to me and sending examples. The idea goes way back and is a break out from W-Wings. I think it is sufficiently distinct to be worth having on it's own but I will be re-evaluating W-Wings soon to see how much they are worth including in their own right. If you want to see what CRP replaces, untick it and [ All these examples are from tough puzzles and each has two Chute Remote Pairs in them. In testing I've found some 620 examples in 2000 random diabolicals and I've gained an overall speed increase of about 2%. So it is simplifying the solve paths for more than a quarter of puzzles. 
 Example 1
: Load Example 
 or : From the Start 
 The first example gives the classic pattern. We're looking for two bi-value cells with the same candidates in the same Chute , which is a horizontal or vertical set of the three boxes. There are six chutes in a 9x9 Sudoku. Both the green cells A8 and C1 here have {4/7}. The next step is to check they can't 'see' each other, ie they are not a Naked Pair but instead a Remote Pair . Given that pattern there will exist exactly three cells in the unused box in the same chute and I have marked these in yellow { B4 , B5 , B6 ). The rule says, If the yellow cells have only ONE of the candidates in the green cells then that candidate can be eliminated from all cells seen by both green cells. I've marked these in pink . 
 Example 2
: Load Example 
 or : From the Start 
 Later on in the puzzle the pattern is found again. We'll try and prove the rule with this second example. 2 and 8 exist in C6 and E5 . 2 exists in the third box in J4 . Note - it does not matter that this is a clue or solved cell. What is important is the 8 is no where in any of the yellow cells. If 2 really was the solution to C5 or D6 (the elimination cells) that would force an 8 in both of the green cells. However looking down the column that would remove all 8s from box 8 and we can already see there is no 8 in column 4. 
 Example 3
: Load Example 
 or : From the Start 
The third example contains two Chute Remote Pairs and I've displayed one here. {7,9} in D6 and F2 form a Remote Pair. Looking horizontally along the chute to box 6 we see 9 is present in the yellow cells but 7 is not. This gives us two eliminations of 9 in D2 and D3 . The solver reports: Chute Remote Pair 7 cannot be set in the yellow cells {E7,E8,E9} and with the Remote Pair in D6 and F2 it means: 9 can be taken off D2 9 can be taken off D3 
 Double Eliminaton 
 Double Elimination
: Load Example 
 or : From the Start 
Now it is possible to extend the rule to eliminate both numbers found in the Remote Pair - but it is much rarer. Normally the puzzle will have made these eliminations with simpler strategies. I found eight double eliminations in 2000 tough puzzles where the single version occured about 245 times. In the final example {4,7} is not present in any of the yellow cells. It is a coincidence this example has all the yellow cells as clues and solved numbers but it makes checking a little easier We look around for any 4 or 7 that can be seen by B9 AND C1 and B3 fits the bill. Chute Remote Pair Neither 4/7 can be set in the yellow cells {A4,A5,A6} and with the Remote Pair in B9 and C1 it means: 4/7 can be taken off B3 
 Bonus Eliminations 
 Bonus Eliminations
: Load Example 
While you are looking at the common cells in a double elimination there are in fact more cells to check. In the example shown here I've coloured in some purple cells. The simple rule is that if one green cell is X the other is Y. And vice versa. This eliminates not just common cells (pink) but in cells the same box as the green cells box and along the row (or column). Check the following: If J5 is 7, then 7 is removed from J123 thus 7 must be somewhere in G123 , and so 7 cannot be in the rest of row G which means G9 is 9 Likewise, if J5 is 9, 9 is removed from J123 , so 9 must be somewhere in G123 - so 9 cannot be in the rest of row G which means G9 is 7. All this is possible because 7 and 9 do NOT appear in the yellow cells. The solver will report these eliminations with the note 'either end' rule Neither 7/9 can be set in the yellow cells {H1,H2,H3} and with the Remote Pair in G9 and J5 it means: 7/9 can be taken off J7 7/9 can be taken off G8 ('either end' rule) 
 Some further testing running 'Ruud's Top 50,000' through the offline solver I get a 1% speed increase - less than 2% because these have so many more AIC searches to do and AIC dwarfs all other strategies in terms of cost. 16,814 CRPs were used in 14,384 puzzles (28.8%) - a lot but there is a bias since CRP benefits from being so close to the top of the strategy ordering. The strategies that reduce the most are Y-Wings (>3k), XY-Chains (2k), 3D Medusa (1k). Simple Colouring and Rectangle Elimination down by only about ~500. 
 Chute Remote Pair Exemplars 
 These puzzles require the CRP strategy at some point but are otherwise trivial or have a few other similar level strategies. 
They make good practice puzzles.
 Exemplar 1, x3 (uncheck UR1) (score 6.5) 
 Exemplar 2, x3 (score 6.6) 
 Exemplar 3, x3 (score 6.6) 
 Exemplar 4, x3 (score 6.9) 
 Exemplar 5, x3 (score 6.9) 
 Exemplar 6, x3 (score 7.2) 
 Exemplar 7, x3 (score 7.6) 
 Exemplar 8, x3 (score 7.8) 
 Exemplar 9, x3 (score 7.8) 
 Exemplar 10, x3 (score 8.5) 
 Go back to Intersection Removal Continue to Y-Wings
