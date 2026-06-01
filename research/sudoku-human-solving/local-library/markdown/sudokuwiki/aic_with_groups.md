Title: AIC with Groups - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/AIC_with_Groups

Markdown Content:
Grouped nodes were discussed on the [Grouped X-Cycles page](https://www.sudokuwiki.org/Grouped_X_Cycles) and it is very relevant to Alternating Inference Chains. Luckily, there’s nothing too scary about them although they may be harder to spot.

Note: Examples here will show up if [Forcing Nets](https://www.sudokuwiki.org/Forcing_nets) are turned off.

## Rule 1 - Off-Chain Elimination

![Image 1: Grouped AIC](https://www.sudokuwiki.org/PuzImages/GAIC1b.png)

Grouped AIC : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9B050f2e0i46015y020466026212064i0a095u0i4601070b0d4m0f4m4a4j4q027n03bu0g06360936164a4i0o010o02474u067n07bu4q4i464i0b0u0g09064q0a4y040i0a051g5w035w01071y080u1g181609) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=500001024020060090001700000000203006090000010200607000000009600040050030170800009)

Kicking off with a relatively short and 'continuous' loop. This means there is no start or end, nor any 'discontinuity' where two weak links join or two strong links join - and where we'd be looking for an elimination. Instead one can trace a route in either direction and the ON and OFF could be swapped. This type of loop allows us to make eliminations on all weak links, shown in yellow/red. One end or other of each link must be the highlighted candidate.

What makes this a **'Grouped'** AIC chain is the double cell D3/F3. If you start with +8[D1] that potentially removes all other 8s in box 4. If that were so the only remaining 8 in column 3 is on B3. In order to make that link we combine D3 and F3 into a single pseudo-cell DF3. Note that if we use two or three cells in a group it has a specific orientation or alignment. It can only be useful in the direction the cells are aligned on. In this case it points along the column. The solver gives us:

AIC (w.Groups) Rule 1:

+4[B1]-4[D1]+8[D1]-8[D3|F3]+8[B3]-4[B3]+4[B1]

 - Off-chain 8 taken off D2 - weak link: (8)D1 - to (8)D3|F3 = 

 - Off-chain 8 taken off F2 - weak link: (8)D1 - to (8)D3|F3 = 

 - Off-chain 7 taken off B3 - weak link between 8 and 4 in B3

## Rule 2 - Strong Link Assertion

![Image 2: Grouped Cell AIC](https://www.sudokuwiki.org/PuzImages/GAIC2b.png)

Grouped Cell AIC : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9B091o014y055a0u1g073u3u0c8i1m02178z082224088m070a1a8410082m062c0w2i090z0z2i0i0b014a050f5u0c2b2f0536520i0b5u041v1v0d3o0936080c11035f0g041g4y0z0l09024i0i4m0146070d06) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=901050007000002008008070000806000900000105000005000004000090800300400009200010706)

Rule 2 loops are 'discontinuous' in that they have a kink or point where the alternating weak/strong inferences break down. The thick blue line from 2[H5] to 2[H8] is very visible. A bit harder to see is the other link between 2 and 6 in the same cell H5. Rule 2 says we can assert that 2 must be the solution to H5.

But making this a **'Grouped'** AIC is the pseudo-cell GH6. If A6 is not 6 then one/either 6s in G6 or H6 must be ON. The orientation coming in from the column means we must continue the loop by looking in the box. We can turn OFF 6s there including H5. The logic on those links works in reverse as well, box to column. The solver gives us:

AIC on 2 ((w.Groups) Discontinuous Alternating Nice Loop, length 8):

-2[H5]+2[H8]-2[A8]+6[A8]-6[A6]+6[G6|H6]-6[H5]+2[H5]

 - Contradiction: When 2 is removed from H5 the chain implies it must be 2 - other candidates 6 can be removed

## Rule 3 - Weak Link Elimination

![Image 3: Rule 3 Grouped Link example](https://www.sudokuwiki.org/PuzImages/GAIC3.png)

Rule 3 Grouped Link example : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9Bbe060g7u7w0o4f050v03b6bu07960156021m020a1622081i1q0g098r058r02070h8u1q1q1m2e1s011u093g0h24c2cyc41u0304ac011w077q8n8q8t1g0e1q08c302c3038r051n1m070e041j0h1f0g1l091l) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=060000050300701020200080009050270000000109000000034010700000008020305007040000090)

Finally we have the weak-link version of the 'discontinuous' loop where we can remove the candidate which forms the discontinuity. This is probably the most common type of elimination, followed by Rule 1 off-chains.

There is a very clear Grouped Cell in AC7. We can follow the solver's chain which comes in from the box and A3 with a -3. The 3s in AC7 are the only ones left in box 3 so we can combine them into a link cell if we follow their alignment down the column. This takes us to the -3 in J7.

To figure out we have a discontinuity we note we started with asserting J7 was 3 and the loop proves this assertion didn't work out. So the assertion was wrong and we can remove 3 from J7.

AIC on 3 ((w.Groups) Discontinuous Alternating Nice Loop, length 8):

+3[J7]-2[J7]+2[J9]-1[J9]+1[A9]-3[A9]+3[A7|C7]-3[J7]

 - Contradiction: When J7 is set to 3 the chain implies it cannot be 3 - it can be removed

* * *
