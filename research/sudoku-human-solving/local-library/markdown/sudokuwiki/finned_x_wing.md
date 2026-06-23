Title: finned_x_wing - SudokuWiki.org
URL Source: https://www.sudokuwiki.org/Finned_X_Wing

Markdown Content:
Finned X-Wing - SudokuWiki.org 
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
 Finned X-Wing This is a very subtle yet beautiful extension of logic. We're looking at formations that could potentially be X-Wings but have a corner that's not quite right. In an X-Wing we are looking for four cells in a rectangle which contain a candidate N that exists just twice in either the two rows that form the rectangle or the two columns. Our Finned version is still a rectangle but it has extra candidates of the number in question that prevent one of the two pairs we need from existing. 
 Finned X-Wing Example
Let's look at the distribution of 8 candidates on the board in Figure 1. We have a potential X-Wing marked with the green X. The two blue lines show the top pair of 8s and the potential pair of 8s on the bottom row, F. It's not a real X-Wing because two cells have gotten in the way. These are the green +8s marked in F8 and F9 . If these cells didn't exist, we'd be able to eliminate 8s in columns 1 and 7 (marked with a green strike-out line). These +8 cells are the ' fin '. The ' fin ' or ' fillet ' rule goes as follows: If you can form an X-Wing by ignoring the fin cells, then you can keep your elimination of any cell that shares the same unit as all the cells in the fin. 
 It's important to remember we can only have one fin at a time! In our example, the -8 is the only cell that shares a box with the +8 cells. It would have been eliminated anyway if the X-Wing were real. However, none of the other X-Wing eliminations are valid. 
 Finned X-Wing Example
: Load Example 
 or : From the Start 
 Turning to a real example, consider the potential X-Wing on 7 marked in yellow in Figure 2. We would dearly like to remove all the 7s marked with a green circle. However, there are extra 7s in box 9, marked in green. These are the fin cells. But the fin rule allows us to remove the 7 on H9 at least (red circle). Turn Grouped X-Cycles off 
 Sashimi Finned X-Wings Grouped X-Cycles will be found in the solver before Sashimis so uncheck them to see the examples here. 
 Sashimi Finned X-Wing
: Load Example 
 or : From the Start 
Now there is more to the idea of Finned X-Wings as I demonstrate in this example. It so happens, that when using the "fin" or 'filleting' rule, it is permissible for the X-Wing to be missing a corner in the finned box. The logic can still be applied! It's going to be fun to explain how and why it works, but first lets look at the example on the right. We are looking at candidate 4 . The fin is again marked in green but the corner of the X-Wing missing. There is no 4 at D6 - which so happens to be a clue, and therefore was never a candidate 4 there at any time! But it doesn't matter, we can remove the 4s from E6 and F6 because they are in the same box as the fin AND in the same column as the odd corner of the X-Wing, H6 , in this example. Where the Finned X-Wing is missing the candidate in the finned box, the type is called a Sashimi Finned X-Wing. 
 It is possible to consider this example in another way. Either there will be a 4 in D9 or there will be a 4 in one of the two cells {D4,D5}. If the later then the 4s in E6/F6 must go (same box situation) or the 4 in D9 forces a chain giving us 6 in H9 and 4 in H6 - which also eliminates the 4s in E6/F6. 
 Exemplar 
Here is a puzzle found by Klaus Brenner with two Finned X-Wings and no other strategies apart from Hidden Singles. 
 Exemplar 1, x1 (score 232) 
 Go back to Almost Locked Sets Continue to Finned Sword-Fish 
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
 ... by: Generalist Monday 21-Apr-2025 
 For some reason, in 030006000002400030800000004020600090700050000006020408500000070040005900009300546 after trivial deductions, the solver does not find available finned sashimi X-Wings when using only this strategy. XZF_Sudoku sees four of them, but the remaining three follows trvially when any of them is found (e.g. r6c2 != 5 due to the candidates in r24). 
 Andrew Stuart writes: Could use a more pin-pointed step in the puzzle. Use "Email/Export". Thanks! 
 Add to this Thread 
 ... by: Bob Thursday 16-Nov-2023 
 Consider an example similar to the “ Sashimi Finned X-Wings” example but without the 4 in cell B6. How then do we know if the D4 & D5 are the fibs and we should remove the 4s in cells E6 and F6 as in the example. Or If the cells E6 & F6 are the fins when looking at the pattern from the side and we should remove the 4s in cells D4 & D5? 
 REPLY TO THIS POST ... by: Dawn Sunday 2-Apr-2023 
 Hi, Andrew! First of all, thank you for the amazing site and the work you keep putting in year after year. I noticed something with the solver, which seems to have been spotted by Anton Delprado earlier as well. Namely, the fact that the solver finds finned x-wing but does not find the corresponding grouped x-cycle, even when the box is ticked. This is the grid with which I spotted this behavior: https://www.sudokuwiki.org/sudoku.htm?bd=000100000100000000000000004020000000000000000030000000040000003050000002000000000 Interestingly, making the x-wing sashimi does let the solver find the grouped x-cycle(s): https://www.sudokuwiki.org/sudoku.htm?bd=000100000100000000000000004020000000000000005030000000040000003050000002000000000 Is this intentional, so that the finned x-wing technique does show up even if grouped x-cycles are ticked on? Until now, I usually ticked off ERs and Finned X-Wings because I think they're grouped x-cycles, but maybe I was wrong to do that? 
 Andrew Stuart writes: Not sure if this was the case in 2023 but since you wrote the solver does see the grouped X-Cycle if Finned X-Wing is unchecked. Good example 
 Add to this Thread 
 ... by: Robert Tuesday 2-Feb-2021 
 Just like an X-wing is a special case of a "nice loop", this one can be viewed as a nice loop with groups. In the example, the loop is D7-weak-B7-strong-B1-weak-F1-strong-F789-weak-D7 So D7 is at the discontinuity between two weak links, it can be eliminated. I have to think about whether all finned X-wings are special cases of nice loops with groups. 
 Anonymous replies: Friday 31-Dec-2021 
 Wait, you're actually right 
 Add to this Thread 
 ... by: Kamil Wednesday 13-Jul-2016 
 Hi! I'm not very advanced solver, but I'm wondering why finned swordfish and finned X-wing are considered as extreme strategies. They are very easy to find and easy to understand. Also I want to thank you for this amazing website. 
 REPLY TO THIS POST ... by: ElrATiff Monday 7-Sep-2015 
 Hi, Andrew! Excelent site! Now I'm fully addicted to Sudoku World :) Some typo in the end of article "Finned X-Wing" (wrong link for Exemplar 1, x1 (score 232)): there is: http://www.sudokuwiki.org/sudoku0htm?bd=... must be: http://www.sudokuwiki.org/sudoku.htm?bd=... 
 Andrew Stuart writes: Fixed! Thanks! 
 Add to this Thread 
 ... by: Orion Tuesday 26-May-2015 
 Like David, I am confused concerning the reason the 7's in J7 & J8 are not being eliminated when I use the General rule: "If you can form an X-Wing by ignoring the fin cells, then you can keep your elimination of any cell that shares the same unit as all the cells in the fin." The only thing that seems to make sense to me when I see these not eliminated would be if I interpreted the rule as follows: "If you can form an X-Wing by ignoring the fin cells, then you can keep your elimination of any cell (that would be eliminated in a true X-wing) that shares the same unit as all the cells in the fin" Any clarification you could provide would be appreciated. Thank you for the Great site. 
 REPLY TO THIS POST ... by: Ate no basil Thursday 2-Apr-2015 
 Is it *required* that the fin be immediately adjacent to a corner of the x-wing? For example, in the 4s example, could the fin be in D3 and D4? (rather than D4 and D5) If that is indeed the case, then in my example we could still eliminate 4s in E6 and F6 (but not if the fin were shifted further left completely into box 4) 
 REPLY TO THIS POST ... by: Banjo Wednesday 26-Dec-2012 
 In your example of Finned Exwings, why is it that neither row D or H complete the Exwing with row B, instead of relying upon row F? In fact, the combination of rows B, D, and H would seem to give a 2 x 3 situation would seem cannot exist. 
 REPLY TO THIS POST ... by: sean t Tuesday 27-Mar-2012 
 David, In the example, the 7 in J7 and J8 cannot be eliminated because it is possible that G6 contains a 7. If that's the case, then C9 does as well, but none of G7, G8, G9 or H9 do. That leaves only J7 and J8 as candidates for the 7 in box 9. Therefore, the 7 in J7 and J8 cannot be eliminated. In general, for a finned x-wing, only those cells that can see all the fin cells AND are cells that would be eligible for elimination if it were just a regular x-wing can be eliminated. In this example, without the fin cells present, J7 and J8 would not be eligible for elimination via the regular x-wing. 
 REPLY TO THIS POST ... by: Anton Delprado Wednesday 1-Feb-2012 
 I agree with Roland that Finned X-Wings are just a specific form of Grouped X-Cycles. Also they are underneath Grouped X-Cycles in the solver. So why does the solver find them at all? Shouldn't it find them as Grouped X-Cycles first? or does the solver deliberately avoid classing them as Grouped X-Cycles? 
 Andrew Stuart writes: Hi Anton There are no restrictions on Grouped X-Cycles or any other strategy, especially in terms of 'letting through' to any other strategy. However, what I am searching for may be limited to how I search and the generalization I've made. I'll look again at the correspondance to X-Cycles and see if there is something the solver is missing. 
 Add to this Thread 
 ... by: David Wednesday 28-Dec-2011 
 In the "real example" given following the Finned X-Wing explanation, the rule that is stated is: "If you can form an X-Wing by ignoring the fin cells, then you can keep your elimination of any cell that shares the same unit as all the cells in the fin." Why, then is only the red-circled 7 eliminated as sharing the same unit, but not the 7s at cells J7 and J8, which appear also to share the same unit (i.e. the box being the unit in which the two yelleo fin cells are located). I thought I understood the fin strategy, but if the 7s at J7 and J8 cannot be eliminated, the theory is completely lost on me! Someone please explain why only the red-circled 7 is elinated but not that other two at J7 and J8. Thx. 
 REPLY TO THIS POST ... by: SueinOz Thursday 28-Apr-2011 
 I think in this example that the fin is green not yellow, and also the E5/F6 reference at the end should be E6/F6. This site is so amazing! I'm learning so much. A few typos should be expected when your mind is full of all these incredible strategies. My head hurts just reading them! 
 Andrew Stuart writes: Typos fixed - many thanks for spotting them and letting me know :) 
 Add to this Thread 
 ... by: John Wilcox Saturday 26-Feb-2011 
 Above, under Sashimi Finned X-Wings, 5th paragraph, 2nd line, I think the reference to E5/F6 should be E6/F6. Same correction at the very end of the sentence. 
 REPLY TO THIS POST ... by: chanda Thursday 31-Dec-2009 
 It seems that all fins tend to be in a row inside a box??? If a fin is in a corner like... d4, d5, and e4 instead of d4 and d5 only as if "8" is unsolved? Also, which way does the fin point outwards? If I'm going to do a X-wing column first (not row first like yours) then my fin would be pointing downward (not sideward like yours). So this is invalid? I understand this but which number is safe to remove? I've been testing this and every strategy in a sudoku with an answer key and most strategies are invalid because the answer key has different number than it would be if I used this strategy... 
 Andrew Stuart writes: The fin is in the opposite direction to eliminations. If the fins didn't exist it would be a normal X-Wing. 
 Add to this Thread 
 ... by: suneet Tuesday 3-Nov-2009 
 Despite removing tick mark solver does use this strategy. which normally it should not use in that case. I request you to remove this anomaly thanks, love your site 
 REPLY TO THIS POST ... by: Roland Zito-Wolf Saturday 18-Apr-2009 
 It's worth mentioning that the finned x-wings can be explained as grouped x-cycles of the rule-3 nice loop variety, the kind with 2 weak links in a row. For example 1, we have C6=C9-H9-[G7,G8,G9]=G6-C6, allowing 7 at H9 to be removed. This clarifies why the 7 at H9 can be removed but not the ones at J7 and J8: only H9 has a link to C9. The sashimi variation works because it uses exactly the same kind of grouped x-cycle: H9=H6-E4-[D4,D5]=D9-H9 and likewise for F5. That raises the question of whether the Swordfish and Jellyfish can be related to more general strategies as well... love your site! 
 REPLY TO THIS POST 
 Article created on 12-April-2008. Views: 296176 
 This page was last modified on 29-March-2015. 
 All text is copyright and for personal use only but may be reproduced with the permission of the author. 
 Copyright Andrew Stuart @ Syndicated Puzzles , Privacy , 2007-2026