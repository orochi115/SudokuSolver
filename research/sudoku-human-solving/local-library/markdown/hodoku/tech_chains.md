Title: HoDoKu: Solving Techniques - Chains and Loops

URL Source: https://hodoku.sourceforge.net/en/tech_chains.php

Markdown Content:
## Table of Contents

*   [Introduction](https://hodoku.sourceforge.net/en/tech_chains.php#in)
*       *   [What is a Chain?](https://hodoku.sourceforge.net/en/tech_chains.php#in1)
    *   [Links and Inferences](https://hodoku.sourceforge.net/en/tech_chains.php#in2)
    *   [Group Links](https://hodoku.sourceforge.net/en/tech_chains.php#in3)
    *   [ALS in Chains](https://hodoku.sourceforge.net/en/tech_chains.php#in4)
    *   [Chains versus Nets](https://hodoku.sourceforge.net/en/tech_chains.php#in7)
    *   [Notation](https://hodoku.sourceforge.net/en/tech_chains.php#in5)
    *   [Displaying Chains in HoDoKu](https://hodoku.sourceforge.net/en/tech_chains.php#in6)

*   [Remote Pair](https://hodoku.sourceforge.net/en/tech_chains.php#rp)
*   [X-Chain](https://hodoku.sourceforge.net/en/tech_chains.php#x)
*   [XY-Chain](https://hodoku.sourceforge.net/en/tech_chains.php#xyc)
*   [Nice Loop/AIC](https://hodoku.sourceforge.net/en/tech_chains.php#nl)
*       *   [Nice Loop Propagation Rules](https://hodoku.sourceforge.net/en/tech_chains.php#nl1)
    *   [Discontinuous Nice Loop](https://hodoku.sourceforge.net/en/tech_chains.php#nl2)
    *   [Alternate Inference Chains Type 1](https://hodoku.sourceforge.net/en/tech_chains.php#nl3)
    *   [Alternate Inference Chains Type 2](https://hodoku.sourceforge.net/en/tech_chains.php#nl4)
    *   [Continuous Nice Loops/AIC Loops](https://hodoku.sourceforge.net/en/tech_chains.php#nl5)

*   [Grouped Nice Loop/AIC](https://hodoku.sourceforge.net/en/tech_chains.php#gnl)
*       *   [Group Nodes Only](https://hodoku.sourceforge.net/en/tech_chains.php#gnl1)
    *   [Group Nodes and ALS](https://hodoku.sourceforge.net/en/tech_chains.php#gnl2)

* * *

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Introduction

## [](https://hodoku.sourceforge.net/en/tech_chains.php)What is a Chain?

Chains are the most basic and the most advanced sudoku solving technique at the same time. Every known sudoku can be solved using only chains of various degrees of complexity and singles. Since chaining is such a potent technique, many people have contributed to methods, notation, and nomenclature alike. This has led to very advanced techniques, but to great confusion too. Plus war like discussions have been (and are still) carried on, which flavor of chaining is better than all others and should therefore be used exclusively. For beginners the variety (chaos?) of techniques can be a bit overwhelming. It still pays off to try it. A good strategy is to start with easy variants like [Remote Pairs](https://hodoku.sourceforge.net/en/tech_chains.php#rp), [X-Chains](https://hodoku.sourceforge.net/en/tech_chains.php#x), or [XY-Chains](https://hodoku.sourceforge.net/en/tech_chains.php#xyc) and advance from there.

A chain is simply a stream of implications that lead from a premise (e.g. candidate x in cell y is not set) to a result. If a chain produces a contradiction (e.g. premise x is set in y leads to x is not set in y), then the original premise is proved to be false (if it was "if candidate x is set", x can be eliminated; if it was "if candidate x is not set", x can be placed immediately).

If a chain does not produce a contradiction, it proves nothing. It is then necessary to combine more than one chain to get a result. For example two chains starting with opposite premises ("x is set in y" and "x is not set in y") could lead to the same result: That result has to be true (this is sometimes called a _verity_). Another possibility would be that chains starting with the same premise eliminate all candidates from a cell (or all instances of a candidate from a house). This forms a contradiction that proves the premise to be false.

A third group of chain techniques uses the fact that many (but not all!) chains are reversible: if "x is not set in y" leads to "x is set in z", then "x is not set in z" leads to "x is set in y" using the same logic in reverse order. This eliminates x from all cells that see both ends of the chain.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Links and Inferences

The basis of all chains are two types of basic implications, normally called "links" or "inferences" (in this guide the term "link" is used as synonym for both).

### [](https://hodoku.sourceforge.net/en/tech_chains.php)Weak Links

If two entities are weakly linked, they cannot be true at the same time. That means: If one of them is true, then the other has to be false (but both can be false as well, so if one is false, nothing can be concluded). In simple chains the entities are normally simply candidates, that share a house or a cell.

### [](https://hodoku.sourceforge.net/en/tech_chains.php)Strong Links

If two entities are strongly linked, they cannot be false at the same time. That means: If one of them is false, then the other has to be true (both true is only possible in very advanced types of links). If we use candidates, we would need exactly two candidates sharing a cell, or exactly two instances of the same candidate sharing a house (a conjugate pair in coloring terms).

Those two link types are the basis for every type of chains, so the difference between them has to be understood completely. To sum it up:

*   Weak Link: If a is true then b is false
*   Strong Link: If a is false then b is true

To form a chain out of links the type of link has to be alternated (hence the name "Alternating Inference Chain" or AIC). Every chain is an AIC at its heart. A chain can then be read as "if a is false, b has to true, so c has to be false, d has to be true etc.". To make matters a bit more complicated, two candidates that are strongly linked are always weakly linked too. That means that a strong link can be used as a weak link in chains (the other way round is not possible).

The above is enough to understand basic chains, and it is probably best to start with some concrete examples immediately (you could for example jump to [Remote Pairs](https://hodoku.sourceforge.net/en/tech_chains.php#rp) right now). For a complete understanding of the topics in this chapter the following paragraphs are important too. Come back and read them, when you have a basic understanding of simple chains.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Group Links

Group Links form inferences between more than two candidates. Normally we use only two candidates to form a link: If they are the only instances within their house, they are strongly linked, if there are other instances left, they are weakly linked. If we consider intersections between houses as well, we can build a slightly more advanced type of link. Consider the example below (taken from [Locked Candidates](https://hodoku.sourceforge.net/en/tech_intersections.php)):

[![Image 1: Sudoku technique: Example for Group+nodes](https://hodoku.sourceforge.net/examples/lc101.png)](https://hodoku.sourceforge.net/en/show_example.php?file=lc101&tech=Group+nodes)

Look at candidates 5 in row 3 (ignore the colors for now, they are from the Locked Candidates move). We have three instances of candidate 5 in that row (columns 1, 2, and 7). Any two of those candidates are weakly linked, a strong link cannot be built in row 3 (too many candidates). A strong link does exist in block 1 between r3c1 and r3c2 (only two instances of candidate 5 in block 1), but not between one of r3c12 and r3c7. That changes, if we consider r3c12 as one node, a _Group Node_. We can then make the following conclusions:

*   If **both** r3c12 are not 5, r3c7 has to be 5 (grouped strong link)
*   If r3c7 is not 5, **one of** r3c12 has to be 5 (grouped strong link)

As with any strong link they can form a weak link too:

*   If **one of** r3c12 is 5, r3c7 cannot be 5 (grouped weak link)
*   If r3c7 is 5, **neither** r3c1 **nor** r3c2 can be 5 (grouped weak link)

Links can exist between group nodes too as can be seen in the example below:

[![Image 2: Sudoku technique: Example for Group+nodes](https://hodoku.sourceforge.net/examples/gn101.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gn101&tech=Group+nodes)

Let's look at candidate 2 in row 9, column 4, and block 8 (to make following the explanation easier, the cells have been colored): We have a grouped strong link in row 9 between r9c9 and r9c56 and another in column 4 between r6c4 and r78c4. Both links work as described above.

Within block 8 another weak link exists between group node r9c56 and group node r78c4 (weak link, because there are other instances of candidate 2 in block 8):

*   If **one of** r9c56 is 2, **neither** r7c4 **nor** r8c4 can be 2 (grouped weak link)
*   If **one of** r78c4 is 2, **neither** r9c5 **nor** r9c6 can be 2 (grouped weak link)

The three links can be combined into a short chain (that chain has no effect on its own, but it can become part of a longer chain as demonstrated in [Grouped Nice Loops](https://hodoku.sourceforge.net/en/tech_chains.php#gnl1)):

r6c4 =2= r78c4 -2- r9c56 =2= r9c9

## [](https://hodoku.sourceforge.net/en/tech_chains.php)ALS in Chains

ALS stands for "Almost Locked Set" and is described in detail in the [ALS Chapter](https://hodoku.sourceforge.net/en/tech_als.php) of this guide. For now it is sufficient to know, that an ALS is a group of cells within one house, that has N+1 candidates in N cells. ALSes themselves prove nothing, but very interesting things can be done with them. If one candidate is removed from the ALS, it becomes a Locked Set (aka a [Naked Subset](https://hodoku.sourceforge.net/en/tech_naked.php)). But this is exactly the definition of a strong link. Take for example an imaginary ALS with candidates {1234} in three cells:

*   If candidate 1 is not set in the ALS, the ALS becomes a Locked Set for candidates {234} (strong link)
*   If the ALS is not a Locked Set for candidates {234}, candidate 1 has to be set within the ALS (strong link)

An ALS is reached via a weak link (a candidate has to be removed from the ALS) and left via a weak link (the resulting Locked Set eliminates some candidate outside the ALS). The necessary strong link between those two weak links is the fact, that the ALS becomes a Locked Set as shown above.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Chains versus Nets

What's a chain and what's a net has been the topic of many heated discussions amongst sudoku players. HoDoKu uses the following definition: In a chain every link relies only on the step immediately before it. If a link only works, if it depends on the outcome of a link further up the chain, the chain becomes a net. The same is true, if the chain forks into branches that meet again further down the chain.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Notation

To communicate chains to other players, notation systems have been developed. Three types of notations are still commonly used:

*   Forcing Chain notation (used for Forcing Chains/Nets in HoDoKu)
*   Nice Loop notation (used for everything else in HoDoKu)
*   AIC (or Eureka) notation (currently not implemented in HoDoKu)

### [](https://hodoku.sourceforge.net/en/tech_chains.php)Forcing Chain Notation

Forcing Chain notation uses expressions of type [cell]=[value] (or [cell]<>[value]) to follow the chain. The left Remote Pair example would read:

r2c7<>4 => r2c7=5 => r2c2<>5 => r2c2=4 => r3c1<>4 => r3c1=5 => r6c1<>5 => r6c1=4

For brevity the "<>" expressions are often ommited except in the endpoints of the chain:

r2c7<>4 => r2c7=5 => r2c2=4 => r3c1=5 => r6c1=4

The brevity can make Forcing Chain notation a bit hard to follow.

### [](https://hodoku.sourceforge.net/en/tech_chains.php)Nice Loop Notation

Nice loop notation uses "-x-" for weak links and "=x=" for strong links. Links are only written down between cells (links within cells are implied). The Remote Pair in Nice Loop notation:

r2c7 -5- r2c2 -4- r3c1 -5- r6c1

To clarify, how the chain starts and ends (the first and last links on 4 are completely left out), those links can be appended to the notation:

4- r2c7 -5- r2c2 -4- r3c1 -5- r6c1 -4

### [](https://hodoku.sourceforge.net/en/tech_chains.php)AIC Notation

AIC notation doesn't omit anything. "-" is used for weak links, "=" for strong links, candidates are written in parenthesis before the affected cell. If a link occurs within a cell, it is included in the parenthesis. The Remote Pair:

(4=5)r2c7-(5=4)r2c2-(4=5)r3c1-(5=4)r6c1

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Displaying Chains in HoDoKu

When HoDoKu displays a chain, it symbolizes the links between cells with arrows (dashed for weak links, solid for strong links). Green background means "candidate set", blue background means "candidate not set". In cannibalistic chains (the chain eliminates candidates, that are part of the chain itself), the elimination takes precedence before the chain. In complicated Forcing Chains/Nets the same candidate can be part of different chains and thus have different colors. The resulting color for such a candidate is entirely a matter of chance.

* * *

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Remote Pair

Remote Pair is the simplest chaining technique. It considers only bivalue cells that contain the same two candidates. Since the cells are bivalue, a strong link exists within every cell between the two candidates. The links between the cells can therefore be weak (the cells have to see each other). To eliminate something, the chain has to be at least four cells long. The Remote Pair ensures, that any cell within the chain has the opposite value of the cell before it. Any cell outside the Remote Pair that sees two cells with different values cannot have one of the Remote Pair digits set.

Remote Pairs can be replicated by one or two Simple Color moves.

[![Image 3: Sudoku technique: Example for Remote+Pair](https://hodoku.sourceforge.net/examples/rp01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=rp01&tech=Remote+Pair)[![Image 4: Sudoku technique: Example for Remote+Pair](https://hodoku.sourceforge.net/examples/rp02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=rp02&tech=Remote+Pair)

Example on the left: If r2c7 is 5, r3c1 must be 5 as well and r2c2 and r6c1 must be 4 or vice versa. In other words: If r2c7 is 5, r6c1 is 4; if r2c7 is 4, r6c1 is 5 (the cells r2c7 and r6c1 have opposite polarity). Any cell that sees those two cells (in the example r6c7) can be neither 4 nor 5.

The example on the right starts with r7c8 and ends with r8c4. The chain is 8 cells long. All cells that see Remote Pair cells with opposite polarity can be neither 2 nor 8.

* * *

## [](https://hodoku.sourceforge.net/en/tech_chains.php)X-Chain

X-Chains are chains that use one digit only. X-Chains of length 4 are sometimes called [Turbot Fishes](https://hodoku.sourceforge.net/en/tech_sdp.php#tf) and can be found using the appropriate Turbot variants ([Skyscraper](https://hodoku.sourceforge.net/en/tech_sdp.php#sk), [2-String Kite](https://hodoku.sourceforge.net/en/tech_sdp.php#t2sk), or [Empty Rectangle](https://hodoku.sourceforge.net/en/tech_sdp.php#er)).

The important thing with X-Chains is, that they have to start and end with a strong link. This ensures that one of the endpoints actually contains the chain digit. That digit can be removed from any cell that sees both ends of the chain.

[![Image 5: Sudoku technique: Example for X-Chain](https://hodoku.sourceforge.net/examples/x01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=x01&tech=X-Chain)[![Image 6: Sudoku technique: Example for X-Chain](https://hodoku.sourceforge.net/examples/x02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=x02&tech=X-Chain)

On the left: If r1c2 is not 7, r1c9 has to be 7, r2c8 cannot be 7, r7c8 has to be 7, r7c3 cannot be 7 and r4c3 has to be 7. If on the other hand r4c3 is not 7, then r7c3 has to be 7, r7c8 cannot be 7, r2c8 has to be 7, r1c9 cannot be 7, and r1c2 has to be 7. Conclusion: One of r1c2 and r4c3 must be 7. r4c2 sees both cells and can't be 7 as well.

On the right: The X-Chain proves, that either r4c2 or r6c5 is 3. 3 can be eliminated from r6c123.

* * *

## [](https://hodoku.sourceforge.net/en/tech_chains.php)XY-Chain

An XY-Chain is a chain that uses only bivalue cells (similar to Remote Pairs), but the cells can have arbitrary candidates. The only restriction (besides the obvious necessities for the links) is, that the XY-Chain starts and ends with a strong link on the same digit. As with X-Chains this proves that one of the endpoints must have that candidate placed, and it can be eliminated from all cells that see both ends of the chain.

As with Remote Pairs all strong links are within the cells, all weak links are between the cells.

[![Image 7: Sudoku technique: Example for XY-Chain](https://hodoku.sourceforge.net/examples/xyc01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=xyc01&tech=XY-Chain)[![Image 8: Sudoku technique: Example for XY-Chain](https://hodoku.sourceforge.net/examples/xyc02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=xyc02&tech=XY-Chain)

Example on the left: 3- r7c4 -9- r5c4 -8- r5c6 -2- r2c6 -3 (read: if r7c4 is not 3 it has to be 9; r5c4 cannot be 9 and has to be 8; r5c6 cannot be 8 and has to be 2; r2c6 cannot be 2 and has to be 3; try the other way round yourself). If you look at column 6 you can see, that it has only two instances of candidate 2 left. r5c6 and r2c6 are therefore strongly linked by candidate 2. For the XY-Chain we don't need that strong link, we need a weak one here. We can take the strong link and use it as weak link as stated [above](https://hodoku.sourceforge.net/en/tech_chains.php#strong_link).

Example on the right: 8- r6c5 -4- r8c5 -1- r8c4 -9- r3c4 -8

* * *

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Nice Loop/AIC

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Nice Loop Propagation Rules

Nice Loops are chains that link back to the cell where they started. To make finding the chain easier, a set of propagation rules has been defined. As with Nice Loop notation (see above), what happends inside the cells is completely ignored, only links between cells are considered:

*   When a node has two strong links, the digits must be different
*   When a node has two weak links, the cell must be bivalue and the digits must be different
*   When a node has two different links (one weak, one strong), the digits must be the same

Take rule number two: If a cell is reached and left on a weak link, the necessary strong link has to occur inside the cell. The cell must therefore be bivalue and the leaving link must have a different digit.

Whether you use those propagation rules or just try to alternate the link types, is of course up to you. The following link leads to a [Nice Loop tutorial](http://www.paulspages.co.uk/sudokuxp/howtosolve/niceloops.htm), that explains the rules in detail and provides lots of examples.

The link back to the original cell decides the type of the loop: Discontinuous or Continuous. If it provides a contradiction, the loop is discontinuous. Depending on how the loop started, the start digit can either be placed or eliminated. If the loop closes nicely (you could follow the loop around over and over again without detecting an end), the loop is continuous.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Discontinuous Nice Loop

If the loop closes with a contradiction, it is discontinuous. The effects can best be seen using the examples below.

[![Image 9: Sudoku technique: Example for Discontinuous+Nice+Loop+%28delete+candidate%29](https://hodoku.sourceforge.net/examples/dnl01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=dnl01&tech=Discontinuous+Nice+Loop+%28delete+candidate%29)[![Image 10: Sudoku technique: Example for Discontinuous+Nice+Loop+%28set+cell%29](https://hodoku.sourceforge.net/examples/dnl02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=dnl02&tech=Discontinuous+Nice+Loop+%28set+cell%29)

Example on the left: r1c8 -7- r7c8 -8- r7c9 -4- r4c9 -5- r4c8 =5= r1c8. The loop starts with a weak link on 7 (the initial premise is "if r1c8 is 7"), but the start cell is reached again via a strong link on 5. That means: "if r1c8 is 7 it is 5", or (since 5 and 7 share a cell and are therefore weakly linked) "if r1c8 is 7 it is not 7" - a clear contradiction, that proves that the premise was false. 7 can be eliminated from r1c8.

Example on the right: r8c2 =4= r8c9 -4- r9c9 -2- r9c3 =2= r7c2 =4= r8c2. The loop starts with a strong link on 4 (premise: "if r8c2 is not 4") and it ends with a strong link on 4 as well. That means: "if r8c2 is not 4, it is 4" - a contradiction that proves that r8c2 has indeed to be 4. 4 can be placed in r8c2 (HoDoKu doesn't make placements with Nice Loops, it eliminates all other candidates instead, which leaves a single). Another way to look at that type of loop is as a verity: The loop proves, that if r8c2 is not 4, it is in fact 4. But if it is 4, it is of course 4 as well. Both possibilities (r8c2=4 and r8c2<>4) lead to the same result: r8c2=4, which has thus to be true.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Alternate Inference Chain Type 1

Any AIC can be seen as a combination of one or more Discontinuous Nice Loops (HoDoKu will show an AIC only, if it provides more than one elimination; AICs with only one elimination are always shown as Discontinuous Nice Loops). AICs start and end with a strong link and have alternating links in between without any further restrictions.

An AIC Type 1 starts and ends on a strong link for the same digit, thus proving that that digit has to be placed in one of the end cells of the AIC. This eliminates that digit from all cells that can see both ends of the AIC.

[![Image 11: Sudoku technique: Example for Alternate+Inference+Chain+Type+1](https://hodoku.sourceforge.net/examples/aic101.png)](https://hodoku.sourceforge.net/en/show_example.php?file=aic101&tech=Alternate+Inference+Chain+Type+1)[![Image 12: Sudoku technique: Example for Alternate+Inference+Chain+Type+1+%28cannibalistic%29](https://hodoku.sourceforge.net/examples/aic102.png)](https://hodoku.sourceforge.net/en/show_example.php?file=aic102&tech=Alternate+Inference+Chain+Type+1+%28cannibalistic%29)

On the left: 5- r1c2 -3- r1c4 =3= r3c4 =9= r7c4 =2= r7c2 -2- r8c3 -5. Either r1c2 or r8c3 is 5, so none of r123c3,r78c2 can be 5.

On the right: 6- r2c5 -7- r2c1 =7= r6c1 =6= r6c7 -6- r2c7 =6= r3c8 -6. What's special here is that one of the eliminated candidates (6 in r2c7) is actually part of the chain. That is perfectly legal. The AIC is called cannibalistic.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Alternate Inference Chain Type 2

An AIC Type 2 starts and ends on a strong link for two different digits in two cells, that see each other. This proves that the end digit can't be in the start cell and the start digit cannot be in the end cell.

[![Image 13: Sudoku technique: Example for Alternate+Inference+Chain+Type+2](https://hodoku.sourceforge.net/examples/aic201.png)](https://hodoku.sourceforge.net/en/show_example.php?file=aic201&tech=Alternate+Inference+Chain+Type+2)[![Image 14: Sudoku technique: Example for Alternate+Inference+Chain+Type+2](https://hodoku.sourceforge.net/examples/aic202.png)](https://hodoku.sourceforge.net/en/show_example.php?file=aic202&tech=Alternate+Inference+Chain+Type+2)

On the left: 4- r6c2 =4= r9c2 -4- r9c5 -9- r5c5 =9= r5c4 =8= r6c4 -8. We start with 4 in r6c2 and end with 8 in r6c4. 4 cannot be in r6c4 and 8 cannot be in r6c2. Prove for candidate 4: If r6c2<>4 then r6c4=8, which means r6c4 cannot be 4. But if r6c2=4, r6c4 cannot be 4 either, because the cells see each other. We have a verity that proves, that r6c4 cannot be 4.

On the right: 8- r1c8 -2- r1c7 =2= r6c7 =6= r6c3 =5= r4c2 =2= r4c8 -2. 2 cannot be in r1c8 and 8 cannot be in r4c8.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Continuous Nice Loops (AIC Loops)

Continuous Nice Loops and AIC Loops are exactly the same thing. They occur not as often as Discontinuous Loops, but if present, they usually are very effective. A loop is continuous, if the link back to the original cell plus the first link obey the propagation rules, or put in another way, if no contradiction occurs in the start/end cell.

What makes Continuous Nice Loops so effective is that all weak links in the loop are converted into strong links. That means that all additional candidates in the houses or cells providing the weak links can be eliminated.

[![Image 15: Sudoku technique: Example for Continuous+Nice+Loop%2FAIC+Loop](https://hodoku.sourceforge.net/examples/cnl01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=cnl01&tech=Continuous+Nice+Loop%2FAIC+Loop)[![Image 16: Sudoku technique: Example for Continuous+Nice+Loop%2FAIC+Loop](https://hodoku.sourceforge.net/examples/cnl02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=cnl02&tech=Continuous+Nice+Loop%2FAIC+Loop)

Example on the left: 5= r7c6 =2= r6c6 -2- r4c5 -3- r8c5 =3= r8c6 =5= r7c6 =2. Cell r7c6 is left on a strong link on 2 and reached again on a strong link on 5 (first propagation rule). A weak link exists between candidates 2 and 5 in cell r7c6, all rules for building AICs are complied with. The eliminations: The first weak link is within the start cell between candidates 2 and 5, all other candidates in that cell can be eliminated (6 and 8). The next weak link is in block 5 between 2 in r6c6 and 2 in r4c5, all other candidates 2 in block 5 can be eliminated. Next weak link on candidate 3 in column 5 (eliminates 3 from r26c5), and last but not least weak link between 3 and 5 in r8c6 (eliminates 8 in that cell).

Example on the right: 9= r7c5 =1= r7c9 =7= r3c9 -7- r3c3 =7= r1c3 =5= r1c6 -5- r8c6 =5= r8c4 =7= r7c4 =9= r7c5 =1. Weak links within cells are in r7c5, r7c9, r1c3, r8c4 and r7c4. Weak links between cells are in row 3 (nothing to eliminate) and column 6.

* * *

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Grouped Nice Loop/AIC

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Group Nodes Only

The only difference between (normal) Nice Loops/AICs and Grouped Nice Loops/Grouped AICs is, that the latter use [group links](https://hodoku.sourceforge.net/en/tech_chains.php#in3).

[![Image 17: Sudoku technique: Example for Grouped+Discontinuous+Nice+Loop+%28set+cell%29](https://hodoku.sourceforge.net/examples/gdnl01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gdnl01&tech=Grouped+Discontinuous+Nice+Loop+%28set+cell%29)[![Image 18: Sudoku technique: Example for Grouped+Continuous+Nice+Loop%2FAIC+Loop](https://hodoku.sourceforge.net/examples/gcnl01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gcnl01&tech=Grouped+Continuous+Nice+Loop%2FAIC+Loop)

On the left: Grouped Discontinuous Nice Loop r7c1 =2= r2c1 -2- r2c5 =2= r1c5 =8= r13c4 -8- r5c4 -3- r5c3 -2- r79c3 =2= r7c1. The two group links are for candidate 8 in cells r13c4 and for candidate 2 in r79c3. The logic for the first group link goes as follows: If r1c5 is not 8 then either r1c4 or r3c4 has to be 8; that means that r5c3 cannot be 8. For the second group link: If r5c3 is 2, then neither r7c3 nor r9c3 can be 2; that means that r7c1 has to be 2.

On the right: Grouped Continuous Nice Loop 2= r6c4 =1= r6c3 -1- r9c3 =1= r9c9 =2= r9c56 -2- r78c4 =2= r6c4 =1. The group links are both on candidate 2: Intersection of row 9 with block 8 (r9c56) and intersection of column 4 with block 8 (r78c4). The logic: If r9c9 is not 2, then either r9c5 or r9c6 has to be two; that means that neither r8c4 nor r7c4 can be 2 and it follows that r6c4 has to be 2. The weak link between the group nodes r9c56 and r78c4 occurs in block 8 and eliminates all other candidates 2 from that block.

[![Image 19: Sudoku technique: Example for Grouped+Alternate+Inference+Chain+Type+1](https://hodoku.sourceforge.net/examples/gaic01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gaic01&tech=Grouped+Alternate+Inference+Chain+Type+1)[![Image 20: Sudoku technique: Example for Grouped+Alternate+Inference+Chain+Type+2](https://hodoku.sourceforge.net/examples/gaic02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gaic02&tech=Grouped+Alternate+Inference+Chain+Type+2)

On the left: Grouped AIC 5- r7c2 -6- r6c2 -3- r6c4 -7- r45c5 =7= r3c5 =6= r3c6 -6- r9c6 -5 (group link on 7 in r45c5 - same logic as above).

On the right: Grouped AIC 4- r2c5 =4= r9c5 -4- r9c9 -1- r89c8 =1= r2c8 -1- r2c456 =1= r1c4 -1. This example has two group links. One of them (r2c456) has three cells (the maximum for a group link). One of those cells happens to be the start cell. This doesn't form a loop: A group node is not the same as a simple node. However it leads to the elimination of one of the group link members, making the chain cannibalistic.

## [](https://hodoku.sourceforge.net/en/tech_chains.php)Group Nodes and ALS

If we allow ALS as nodes in chains and loops, things get really interesting (and it does by no means stop there: AURs, Almost Fish, etc. can be nodes as well). To see such chains, the appropriate option has to be enabled in HoDoKu (starting with release 1.2, ALS nodes are disabled by default).

ALS nodes in Grouped Continuous Nice Loops are especially interesting: If we take all ALS candidates, subtract the candidates used to enter and to leave the ALS (they are normal weak links that become strong links as usual in continuous loops), the remaining candidates become locked within the ALS cells and can provide eliminations in all cells, that see all instances of one of the locked candidates within the ALS. Please note that this possible only in continuous loops.

[![Image 21: Sudoku technique: Example for Grouped+Discontinuous+Nice+Loop+with+ALS+node](https://hodoku.sourceforge.net/examples/gdnlals01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gdnlals01&tech=Grouped+Discontinuous+Nice+Loop+with+ALS+node)[![Image 22: Sudoku technique: Example for Grouped+Continuous+Nice+Loop%2FAIC+Loop+with+ALS+node](https://hodoku.sourceforge.net/examples/gcnlals01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gcnlals01&tech=Grouped+Continuous+Nice+Loop%2FAIC+Loop+with+ALS+node)

On the left: Grouped Discontinuous Nice Loop r8c2 -5- r7c12 =5= r7c5 =2= r8c5 -2- ALS:r8c34 -5- r8c2. We start simple: If 5 is set in r8c2 (premise), neither r7c1 nor r7c2 can be 5, r7c5 has to be 5 and can't be 2, r8c5 has to be 2 and r8c3 cannot be 2. But r8c3 was the only candidate 2 in the ALS r8c34 {256}. That reduces the ALS to a locked set on candidates {56} in r8c34. Possible eliminations by that Locked Set (and thus possible weak links for our chain) are 5 in r8c2 and r8c5 and 6 in r8c6. We are only interested in r8c2, since this is our start cell. The weak link contradicts the premise, 5 can be eliminated from r8c2.

On the right: The sudoku is the same as for our Grouped Continuous Nice Loop example above. If we allow ALS nodes, we can squeaze a few more eliminations out of it (not that it matters: the sudoku is solved after any of the two loops).

The loop: Grouped Continuous Nice Loop 2= r9c9 =3= r9c6 -3- ALS:r6c56 -2- r6c4 =2= r78c4 -2- r9c56 =2= r9c9 =3. The weak link within cell r9c9 eliminates candidate 1, the weak link into the ALS (candidate 3) eliminates all other 3s from column 6. The ALS is left using candidate 2, which would eliminate other 2s from row 6 if there were any. But the ALS has still one candidate left: candidate 8. It gets locked within the ALS cells r6c56 and eliminates 8 from all cells that see both those cells (8 eliminations total). The eliminations for candidate 2 each see one ALS cell as well, but they are cannot be eliminated by the ALS: Firstly each cell would have to see all instances of canddiate 2 within the ALS and secondly 2 is not locked within the ALS, it is the exit candidate. The 2s are eliminated by the weak link between group node r78c4 and group node r9c56 (both in block 8).

[![Image 23: Sudoku technique: Example for Grouped+Alternate+Inference+Chain+Type+1+with+ALS+node](https://hodoku.sourceforge.net/examples/gaic1als02.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gaic1als02&tech=Grouped+Alternate+Inference+Chain+Type+1+with+ALS+node)[![Image 24: Sudoku technique: Example for Grouped+Alternate+Inference+Chain+Type+1+with+ALS+node](https://hodoku.sourceforge.net/examples/gaic1als01.png)](https://hodoku.sourceforge.net/en/show_example.php?file=gaic1als01&tech=Grouped+Alternate+Inference+Chain+Type+1+with+ALS+node)

Finally two examples of AICs with ALS nodes:

On the left: Grouped AIC 4- r8c6 -3- ALS:r78c7,r8c89,r9c8 -6- r9c4 -9- r6c4 -4. This is nothing new, only the ALS is fairly large: 6 candidates ({123469}) in 5 cells (r78c7,r8c89,r9c8).

On the right: Grouped AIC 6- r7c1 -8- ALS:r29c3 =6= r5c3 -6. This one is interesting, because it shows a forcing by an ALS node. The ALS is r29c3 {189}. It is reached via candidate 8 in r9c3, which leaves the locked pair {19}. The next node r5c3 has candidates {169}: 1 and 9 are eliminated by the Locked Set, leaving 6 as only candidate in that cell, thus forcing it.

Since HoDoKu currently doesn't support links on more than one candidate, the chain is written as shown above. A more complete notation would be: 6- r7c1 -8- ALS:r29c3 -19- r5c3 -6 (the ALS has to be reached and left on a weak link).

* * *

Copyright © 2008-12 by Bernhard Hobiger

 All material on this page is licensed under the [GNU FDLv1.3](http://www.gnu.org/licenses/fdl-1.3.html).
