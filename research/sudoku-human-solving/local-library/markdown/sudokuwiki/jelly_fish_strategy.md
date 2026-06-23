Title: jelly_fish_strategy - SudokuWiki.org
URL Source: https://www.sudokuwiki.org/Jelly_Fish_Strategy

Markdown Content:
Jellyfish Strategy - SudokuWiki.org 
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
 Jellyfish Strategy 
 Jellyfish Diagram
Jellyfish extends Swordfish one further row and column. We are looking for either four rows such that, in total , four cells are occupied in the row by a candidate number; or four columns such that, in total , four cells are occupied in the column by a candidate number If this configuration is found then we can look in the opposite direction (if by row then down the column, if by column then across the row. If any candidates are found they can be eliminated. After the elimination both conditions above will hold. This diagram shows a full Jellyfish with four X found in four columns and aligned on four rows. It means we can remove any X found in the columns and it leaves behind a 4 by 4 grid. 
 How does it work? Pick any yellow cell in the example above that contains an X. Keeping an eye on it. Pretend the solution actually is X. All others Xs in the row and columns are suppressed. What we're left with is a Swordfish. The Swordfish logic then applies. Pick any X in the Swordfish and it reduces to an X-Wing. Since any combination of Xs on the grid are possible there is no room for Xs outside the grid - that align on the grid rows and columns. 
 Partial Jellyfish
Finding exactly candidate X in all sixteen cells (a 4-4-4-4 formation) is extremely unlikely. But the logic of Jellyfish (and Swordfish) is that we only need four X in total over the four rows and columns. Here is a minimal spread of a particular candidate X - a 2-2-2-2 formation. Most of the time you will have a mixture of two, three or four candidates lined up. One way to double check the logic is to pretend any of the crossed out Xs is a solution. When you do that and trace the consequences you will find at least one row (or column) with no X left - clearly a bad consequence. 
 Example Jellyfish
: Load Example 
 or : From the Start 
This is a real Jellyfish example, one of the very few I have that does actually show up in the solver - a crazy hard extreme. It is based on the candidate 7 as show by the green highlighted candidates. The cells in the pattern are orange. The pattern establishes that we have 7 common to four rows (B,D,E and H) which are aligned on four columns (1,5,7 and 9). Therefore four 7s must go in those yellow cells. This is a 2-3-3-2 formation Jelly Fish since there are 7s absent in B1 and H2. 
 18 elimination Jellyfish
: From the Start 
 I am pleased to report a massive catch by Klaus Brenner from Germany. He has created a 31 clue Sudoku with a required JellyFish containing an amazing 18 eliminations. Well done Klaus! 8th October 2012 (Turn off Rectangle Elimination) 
 Perfect Jellyfish
: Load Example 
 or : From the Start 
 To my knowledge this is the first Perfect 4-4-4-4 Jellyfish. Perfect in the sense that every 2 in the sixteen cells that form the pattern - the 2 is still a candidate. In the examples above, each contain some cells that are clues or solutions. This type of formation is pretty rare in Swordfishes, let alone Jellyfish. Klaus Brenner also found this puzzle. 13th July 2014 
 20 eliminations
: From the Start 
 I have a new crop of Jelly-Fish discovered by Klaus. This one is a maximally eliminating pattern taking off all twenty 9s. 
 Jellyfish Exemplars 
These puzzles require the Jellyfish strategy at early on (but are diabolical puzzles overall). 
They make good practice puzzles. 
All discovered by Klaus Brenner
 Exemplar 3 x2 (score 8.0) 
 Exemplar 2 x2 (score 8.7) 
 Exemplar 4 x1 (score 8.8, 19/20 eliminations) 
 Exemplar 5 x1 (score 9.2, 19/20 eliminations) 
 Exemplar 1 x1 (score 10.2, perfect JF) 
 Exotic variations of the Swordfish continue with the Finned Swordfish and Franken Swordfish . 
 Go back to Swordfish Strategy Continue to Singles Chains 
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
 ... by: Jonesvan Thursday 2-Nov-2017 
 Regarding the 3-2-3-3 formation above why did you select rows 1,4,6 & 9 and columns 1,3,7,9. Could you not have selected row 3 &7 and columns 3&8? Or rows 2&8 and columns 4&6? Iâ€™m confused which rows and columns to select to make the patter? Iâ€™m having a mentally block with this pattern as it seems there are multiple options? 
 Andrew Stuart writes: (Example has been replaced) 
 Add to this Thread 
 ... by: speter Monday 22-May-2017 
 In your first example (top row = ..17538..); I can't work out how to discard candidate 2's at B1, G1, H1 & H9; and unless they are eliminated the jellyfish isn't there. ;-) Can you please explain how the candidate 2 at B1 (for example) is eliminated!? 
 REPLY TO THIS POST ... by: Pieter, Newtown, Oz Monday 29-Oct-2012 
 Hi Andrew I found an interesting Jelly-Fish (my first ever, actually) in the local paper [Load Puzzle] . It's interesting cuz there are 2 simultaneous Jelly-Fish on 4's! The Solver finds CDFG2357 (a 3-4-2-3 J/F), but there is also one at ABEJ1469 (a 3-4-4-3), and also interestingly, the same 7 eliminations are made by both. BTW - Since I use Letters & Numbers to define cells, I found the rYcX notation totally confused me at first! "JF=r3467c2357"??? 
 Andrew Stuart writes: This is an interesting example. To see the second Jelly Fish, use the [ 
 Add to this Thread 
 ... by: John Francis Saturday 23-Jan-2010 
 John White observes: You can extend all of these in the following ways: A. You are not restricted to rows and colums. B. As with X-Wing and Swordfish, you can 'Fin' Jellyfish. C. Why stop at 4...... The reason for stopping at 4 is because of the symmetry between possible candidates in a cell and potential sites for a given digit. It's best explained by considering Naked and Hidden n-tuples. Consider a Naked heptuple. This is a set of seven cells in one set (row, col or box) which between them only have seven different candidates. This means that these seven cells will contain those seven values in some order. Now describe that situation it another way. The cells *not* in the n-tuple are the only ones which can include numbers not in those n candidates. This is the description of a hidden (9-n)-tuple (hidden pair, in this case). This means there's no need to go beyond 4 in describing a strategy; Naked quints are the same as hidden quads, and so on. For a strategy described using numbers greater than four there is an equivalent description using smaller numbers (and interchanging the roles of candidates in a cell and positions for a digit). 
 REPLY TO THIS POST ... by: John White Friday 24-Jul-2009 
 Jelly fish is a sub category of a more general system: Take any group of N disjoint (not overlapping) sets(row,column or box) and compare them to any other group of N disjoint sets. If the overlap of these two groups contains all the possible candidates for any given number then you can remove all the candidates in the other group that are not in the overlapping area. If N=2 you get X-Wing If N=3 you get Swordfish If N=4 you get Jellyfish What this means is that you can extend all of these in the following ways: A. You are not restricted to rows and colums. B. As with X-Wing and Swordfish, you can 'Fin' Jellyfish. C. Why stop at 4...... (Finning: if all candidates from one of the groups that are not contained in the overlap can be contained by one more set (row, colum or box) (the set must not be in the original 2 groups!), then the candidates contained in overlap of this extra set and the second group can be removed. 
 Philipp Huebner replies: Saturday 22-Aug-2009 
 Shouldn't John White's main sentence be: "If the overlap of these two groups contains all the possible candidates for any given number in one of the groups then you can remove all the candidates in the other group that are not in the overlapping area." (I added: "... in one of the groups ...") 
 Add to this Thread 
 Article created on 11-April-2008. Views: 284453 
 This page was last modified on 31-December-2018. 
 All text is copyright and for personal use only but may be reproduced with the permission of the author. 
 Copyright Andrew Stuart @ Syndicated Puzzles , Privacy , 2007-2026