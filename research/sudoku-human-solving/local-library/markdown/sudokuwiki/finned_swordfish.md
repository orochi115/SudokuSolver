Title: finned_swordfish - SudokuWiki.org
URL Source: https://www.sudokuwiki.org/Finned_Swordfish

Markdown Content:
Finned Swordfish - SudokuWiki.org 
 SudokuWiki.org 
 Strategies for Popular Number Puzzles 
 Sign up for more 
 Main Page 
 What's New 
 Strategy Overview 
 9x9 Solvers 
 Sudoku 
 Jigsaw 
 Sudoku X 
 Windoku 
 Colour Sudoku 
 Killer 
 Killer Jigsaw 
 6x6 Solvers 
 6x6 Sudoku 
 6x6 Killer 
 6x6 KenKen 
 6x6 KenDoku 
 Weekly 'Unsolvable' 
 Unsolvable Sudoku 
 Unsolvable Jigsaw 
 Unsolvable Str8ts 
 Puzzles to Play 
 The Daily Sudoku 
 Daily 6x6 Sudoku New! 
 The Jigsaw Sudoku 
 The Daily Sudoku X 
 The Daily Killer 
 Daily Mini Killer 
 Daily Killer Jigsaw 
 The Daily Kakuro 
 The Daily KenKen 
 Daily Codewords 
 1 to 25 
 The Daily Binairo 
 Letterlicious 
 Puzzle Packs 
 Basic Strategies 
 Introduction 
 Getting Started 
 Naked Candidates 
 Hidden Candidates 
 Intersection Removal 
 Tough Strategies 
 X-Wing 
 Chute Remote Pairs 
 Simple Colouring 
 W-Wing 
 Y-Wing 
 Rectangle Elimination 
 Swordfish 
 XYZ-Wing 
 BUG 
 Avoidable Rectangles 
 Diabolical Strategies 
 X-Cycles (Part 1) 
 X-Cycles (Part 2) 
 3D Medusa 
 Jellyfish 
 Unique Rectangles 
 Tridagons 
 Fireworks 
 Twinned XY-Chains 
 SK Loops 
 Extended Rectangles 
 Hidden URs 
 WXYZ-Wing 
 XY-Chains 
 Aligned Pair Exclusion 
 Extreme Strategies 
 Grouped X-Cycles 
 Forcing Nets 
 Exocet 
 Finned X-Wing 
 Finned Swordfish 
 Inference Chains 
 AIC with Groups 
 AIC with ALSs 
 AIC with URs 
 Almost Locked Sets 
 Death Blossom 
 Sue-de-Coq 
 Digit Forcing Chains 
 Nishio Forcing Chains 
 Cell Forcing Chains 
 Unit Forcing Chains 
 Double Exocet 
 Pattern Overlay 
 Deprecated Strategies 
 Remote Pairs 
 Y-Wing Chain 
 Multivalue X-Wing 
 Multi-Colouring 
 Empty Rectangles 
 Guardians 
 Str8ts 
 Home & Rules 
 The Daily Str8ts 
 Weekly Extreme Str8ts 
 Str8ts Solver 
 Str8ts Sample Pack 
 Other 
 What's New 
 Latest Articles 
 Feedback 
 Donate 
 Syndicated Puzzles 
 Print Version 
 Page Index 
 Finned Swordfish 
 Finned SwordFish Example 1
: Load Example 
 or : From the Start 
This is a particularly extreme Sudoku puzzle but the Finned Swordfish is nicely arranged. As discussed in the article on SwordFish it is not necessary for every cell in the 3 by 3 formation to contain the candidate, in this example candidate 3. This SwordFish is a 2-2-3 version since we have 3 twice in the first column, twice in the second column and three times in the third column. It is orientated on the columns since they are the units where candidate 3 occurs no more than three times. We are eliminating in the rows. Now, that said it is not a perfect Swordfish because the centre column 5 contains an extra 3 in J5, which ruins the whole formation. However, the Finned Rule says we can ignore it if we confine the eliminations to the box where the fin is, namely box 8. There is one 3 that we can remove, on G4. 
 Sashimi Variety 
 Finned Sashimi Example 1
: Load Example 
 or : From the Start 
 Two examples now of the Sashimi variety of Finned SwordFishies. Figure two is a little more bunched up but we have a 2-2-3 formation based on eliminations in rows. The exceptional candidate 3 which blocks this from being a perfect SwordFish is on G2. But we can invoke the Sashimi observation to ignore the lack of a 3 on H2, one of the corners of the SwordFish. Eliminating in row H and box 7 we an remove the 3 from H1. 
 Finned Sashimi Example 2
: Load Example 
 or : From the Start 
 The second example illustrates that the Sashimi cell doesn't have to be a clue or a solved cell. The brown cell A6 simply lacks the candidate 7, which had been removed using previous logical strategies. The double fin is in green, A4 and A5. This is quite a restricted SwordFish, which in row orientation is a 1-2-2 formation - but it works! (Turn Grouped X-Cycles off) 
 Here is a lovely Sudoku made by Klaus Brenner (April 2012). Try loading this one . It contains 1 X-Wing on 6 1 Finned-X-Wing on 6 1 Swordfish on 9 1 Finned Swordfish on 6, brown cell H9 never contained a 6 1 Finned Sashimi Swordfish on 6, brown cell G8 never contained a 6 
 Double Sashimi
: Load Example 
 or : From the Start 
 As of August 2025 a slightly more subtle pattern is detected thanks to an old post by Reetou. If the Sashimi ignores the missing X value in one corner then the double Sashimi ignores X in two! I've found a number in my stock. Here is one based on BEJ268 . The missing 5s are in J2 and J8 . It may be worth checking both boxes for fins and eliminations - if not one then the other. 
 Go back to Finned X-Wing Continue to Franken Sword Fish 
 Comments 
 Your Name/Handle 
 Email Address 
 - required for confirmation (it will not be displayed here) 
 Your Comment 
 Please enter the letters you see: 
 Remember me 
 Please ensure your comment is relevant to this article. 
 Email addresses are never displayed, but they are required to confirm your comments. 
 When you enter your name and email address, you'll be sent a link to confirm your comment.
 Line breaks and paragraphs are automatically converted - no need
 to use <p> or <br> tags. 
 Comments Talk 
 ... by: Robert Sunday 22-Aug-2021 
 I like this strategy very much, and have found it useful. I have implemented it in my own solver, along with finned x-wing and finned jellyfish - no need to go to larger fish, because the existence of a larger fish (finned or not) requires the existence of a conjugate fish which is of jellyfish size or smaller. On the "Aligned Pair Exclusion" page, I have described a strategy I have implemented in my solver, which I call "dynamic locked sets" - it is a generalisation of the idea of an ALS in an alternating inference chain. Most useful in a forcing net, but it could come up in an AIC as well. I have similarly implemented, within my "forcing net" algorithm, dynamic groups, dynamic finless fish, and dynamic finned fish. Here are the statistics on how many puzzles in my small database of 245 can be solved using my forcing net software, with its various dynamic options. Every combination is shown, except that there is no easy way to include finned fish without also including unfinned fish. Basic (no "dynamic" options) - 165 With dynamic groups only - 168 With dynamic locked sets only - 169 With dynamic finless fish only - 167 With dynamic finless fish and dynamic finned fish only - 195 With dynamic groups and dynamic locked sets only - 173 With dynamic groups and dynamic finless fish only - 169 With dynamic groups, dynamic finless fish, and dynamic finned fish only - 203 With dynamic locked sets and dynamic finless fish only - 172 With dynamic locked sets, dynamic finless fish, and dynamic finned fish only - 206 With dynamic groups, dynamic locked sets, and dynamic finless fish only - 173 With dynamic groups, dynamic locked sets, dynamic finless fish, and dynamic finned fish - 209 The final 209 number includes a good number of the "unsolveables", although this technique definitely remains stumped by some other unsolveables. Granted, 245 is not a huge sample, but based on the results above, I feel like there could be a lot of mileage to be had by incorporating the concept of an "almost (finned) fish" into the AIC algorithm, or its generalisation, a "dynamic (finned) fish" (either in an AIC, or in a general forcing net). Something to consider :) 
 REPLY TO THIS POST ... by: dontsaymyid Monday 11-Jan-2021 
 I used my own solver to find some examples on finned/sashimi sudoku and found something interesting. While solving puzzle 080040070000005800040700020063500002200000005800002760010007030009300000050080010 after some singles and finned X-Wing, puzzle gets into this state: +---------------+------------------+-----------------+ | 1569 8 2 | 169 4 1369 | 13569 7 169 | | 169 3 7 | 16 2 5 | 8 49 1469 | | 1569 4 16 | 7 1369 8 | 1356 2 136 | +---------------+------------------+-----------------+ | 14 6 3 | 5 7 149 | 149 8 2 | | 2 7 14 | 8 1369 13469 | 1349 49 5 | | 8 9 5 | 14 13 2 | 7 6 134 | +---------------+------------------+-----------------+ | 46 1 8 | 2469 5 7 | 2469 3 469 | | 7 2 9 | 3 16 146 | 46 5 8 | | 3 5 46 | 2469 8 469 | 2469 1 7 | +---------------+------------------+-----------------+ My solver printed "Finned Swordfish On candidate 4. A fish goes from Column 1, 8, and 9 to Row B, D, and G. On Box 6, the fish has two fins E8 and F9. Therefore... 4 taken off from Cell D7." (Actually this is a sashimi, but it was meaningless to tell sashimi apart from finned one.) A sashimi swordfish with two non-aligned fins. I used your solver to see how it solves the puzzle, (turned off GXC and ER) but seems like the finned swordfish algorithm does not find this case. 
 Andrew Stuart writes: This looks good. Next chance I have I'll see what I need to do to detect it. 
 Add to this Thread 
 ... by: Reetou Friday 10-Feb-2017 
 I'm trying to implement finned/sashimi swordfish in my own solver and using your solver to verify results. While solving puzzle 7.9.........4..2.7.2....3...72......3...17.6.9..2...345347..1.929.........1...... After some other steps, puzzle gets into this state: +--------------+-----------------------+------------------+ | 7 568 9 | 13568 23568 123568 | 4568 1458 1568 | | 1 568 3 | 4 5689 5689 | 2 589 7 | | 4 2 68 | 15689 7 15689 | 3 1589 1568 | +--------------+-----------------------+------------------+ | 68 7 2 | 35689 345689 345689 | 589 158 158 | | 3 4 58 | 589 1 7 | 589 6 2 | | 9 1 568 | 2 568 568 | 7 3 4 | +--------------+-----------------------+------------------+ | 5 3 4 | 7 68 68 | 1 2 9 | | 2 9 7 | 135 345 1345 | 4568 458 3568 | | 68 68 1 | 359 23459 23459 | 45 7 35 | +--------------+-----------------------+------------------+ There is a sashimi swordfish in rows 2, 6, 7 and columns 3, 5, 6 with fin in r2c2 which eliminates 6 from r3c3. Am I missing something or just found space for improvement of your solver? Which is brilliant anyway. 
 Andrew Stuart writes: Excellent example. As of August 2025 the solver now detects this type. Before I was ignoring Sword-Fish were there were too many fins (more than 1). If you consider column 2 instead of 3 there is another Sashimi where the fin is F3. However there is no elimination. But that was causing the no-show. 
 Add to this Thread 
 ... by: Ludi Wednesday 17-Oct-2012 
 In order not to miss out on possible finned swordfish scenarios I would just like to confirm that I do understand the exact definition of this configuration correctly. Does the "fin" have to be the a second or third candidate in one of the defining columns (or rows) of the swordfish, or can it actually be a fourth candidate in a defining column (or row)? 
 Andrew Stuart writes: The fin sticks out from the formation, so it is not one of the 9 candidate positions in the 3x3 formation. Ie, not one of the yellow cells in my examples. But it has to be aligned in the direction of the formation (so that it's absence would create a proper Sword-Fish). Hope that helps 
 Add to this Thread 
 ... by: Rainer Friday 3-Jun-2011 
 The explanation of example 2 is flawed or the description of the rule is wrong. Applying the same logic as in the Finned Sashimi Example 1 to Example 2, I find an 'imperfect' 2-1-2 SwordFish in columns 1, 6 and 7. Accordingly, A6 in Example 2 has the same role than H2 in Example 1; a cell of the SwordFish that does not contain the candidate. Thinking in columns the 'fin' would be B6; restricting elimination to the box of the SwordFish, A4 and A5 could be deleted. The example argues the other way round: A4 and A5 being a 'double fin' and B6 to be deleted! Where is the fault? 
 Andrew Stuart writes: This sword-fish can't be rotated just using the same cells, ADE167, because there are numerous other 7s in those columns, J6, B7, F7, H7 and J7. That torpedoes a sword-fish in that direction. 
 Add to this Thread 
 Article created on 12-April-2008. Views: 256017 
 This page was last modified on 27-August-2025. 
 All text is copyright and for personal use only but may be reproduced with the permission of the author. 
 Copyright Andrew Stuart @ Syndicated Puzzles , Privacy , 2007-2026