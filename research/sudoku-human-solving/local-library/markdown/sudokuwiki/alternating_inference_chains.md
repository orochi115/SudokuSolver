Title: Alternating Inference Chains - SudokuWiki.org

URL Source: https://www.sudokuwiki.org/Alternating_Inference_Chains

Markdown Content:
Chaining strategies now take a new leap with **Alternating Inference Chains**. These extend [X-Cycle](https://www.sudokuwiki.org/X_Cycles) into a new dimension - where X-Cycles stuck to a single number, AICs use any candidate number.

For those interested in the origins of this strategy and a great deal more detail, [this post from 2006](http://forum.enjoysudoku.com/alternating-inference-chains-t3865.html) by Myth Jellies is worth a visit.

AICs encapsulate all the discussion of chaining strategies so far. It's very useful to split out chain-like strategies into X-Wings, XY-Chains, Forcing Chains, XYZ-Wings, X-Cycles, Nice Loops and so on, since they have special characteristics which make them spottable. But it turns out they are all part of a larger extended family.

As we saw in the [previous chapter](https://www.sudokuwiki.org/X_Cycles), alternation is just what X-Cycles are about. However, you'll remember that X-Cycles are applied only to a single candidate number. AICs, on the other hand, take everything from an X-Cycle and extend the logic to as many different candidate numbers as necessary.

AICs ask the question "How many ways are there to make a strong or a weak link?" If there is more than one way, we can join them up in an alternating manner and make deductions leading to eliminations. Let's look back on the previous chain-like strategies and note the following:

*   We can link two candidates of the same value in a unit - this is called "bi-location" (X-Cycles).

*   We can link two different candidates in the same cell - this is called "bi-value".

There are also other ways (see later articles), but for now let's keep it simple and stick to these two dimensions - links between cells and within cells.

You should also be armed with the ideas of [Strong and Weak links](https://www.sudokuwiki.org/Weak_and_Strong_Links) - and how they alternate and how some bi-value links can be used as weak links despite looking strong.

## Nice Loops Rule 1

Nice Loops that alternate all the way round are said to be 'continuous', and they must have an even number of nodes. With a continuous AIC, candidates are not removed from the loop since the loop does not have any flaws. Instead we are looking to eliminate on the units that can be seen by two or more cells that belong to the loop.

![Image 1: AIC Rule 1](https://www.sudokuwiki.org/PuzImages/AIC1c.png)

AIC Rule 1 : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9B1v8j4i6a046b83030b020c074j0z09060d4j0z7v4q02030683074j090r0c4j0f4q020z071v3f162b0b2i0h0i0c082b020c0i2r0z0f040c050a0907020d0h0f0g0h06040z0z030b090d020i0f080c0g0z0z) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=000040030207009600000236070900000207000000000802000004050972000006400309020080000)

Specifically, if a unit has an ON number X and an OFF number X then one or other will be the solution. All other candidates X in that unit can be removed. These are called _off-chain_ eliminations. Take this example:

(Now the 4th in the 'explore' options)

AIC (Alternating Inference Chain) Rule 1:

-5[A3]+8[A3]-8[A6]

+8[D6]-4[D6]+4[E6]

-4[E3]+5[E3]-5[A3]

- Off-chain 8 taken off A4 - weak link: +8[A3] to -8[A6]

- Off-chain 5 taken off D6 - weak link between 8 and 4 in D6

- Off-chain 4 taken off E2 - weak link: +4[E6] to -4[E3]

- Off-chain 5 taken off C3 - weak link: +5[E3] to -5[A3]

Four off-chain eliminations occur on the weak links including the weak link between candidates on cell D6.

This is a classic and pleasingly short Continuous Alternating Inference Chain. 

Starting a A3 we turn 8 ON. 

This removes the 8 in A6 turning on forcing 8 in D6 ON.

That turns OFF 4 in the same cell.

4 in E6 must be 6 ON.

That turns on 4 in E3 making 5 in E3

Which confirms 5 must be OFF in A3

Thus...there is no contradiction in the loop. The nice thing about Nice Loops is they can be reversed. Try starting with 5 ON in A3 and turning 5 OFF in E3 - it will come back round with the same conclusion. In fact, the loop is especially "Nice" because you can start with any candidate in the loop and work your way round, provided it is the same On/Off state as described in the example.

So having proved the loop we can look for extra candidates on any unit linked by the chain - or indeed, extra candidates in the same cell where an ON/OFF has occurred.

![Image 2: Off-chain eliminations in cells](https://www.sudokuwiki.org/PuzImages/AIC5b.png)

Off-chain eliminations in cells : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9B05be8q4d074c0t8s037q019q061a1c3008a25262024v4v092z223v0p061b6o4v6o091a2y078a8f1b9b260826027s8c08349a3232013u456c2r094u6m061c17c4038y4q5m0118078a049uar2u023q138608) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=500070003010600080002009000060000900700000002008000010000900600030001070400020008)

Off-chain eliminations can also occur within a cell. In this excellent example sent to me by **Andreas von Delius**, there is a fine Nice Loop. It can start anywhere and can be traced in either direction, but the solver picks it up on A3. The loop picks out a series of 6s and 2s that alternate on and off. All the links between cells are strong links, but there are two switches between 2 and 6 in the loop. In those cells, A8 and H1, other candidates exist. 2 or 6 will be the answer - we don't know which yet, but one or other, so other candidates in those cells can be removed.

AIC (Alternating Inference Chain) Rule 1:

+6[A3]-6[C1]+6[H1]-2[H1]

+2[H7]-2[G8]+2[A8]-6[A8]+6[A3]

- Off-chain candidates 8/9 taken off cell H1, link is between 6 and 2 in H1

- Off-chain candidates 4/9 taken off cell A8, link is between 2 and 6 in A8

## Nice Loops Rule 2

Now we turn to flawed loops - ones that show a discontinuity. In terms of strong/weak links, there are two types, as described in the article on [X-Cycles](https://www.sudokuwiki.org/X_Cycles). Those where two strong links join up and those where two weak links join up.

**If the adjacent links are links with strong inference (solid line), a candidate can be fixed in the cell at the discontinuity.** It removes all other candidates as is the solution to that cell. This type is unfortunately much rarer than the Nice Loop Rule 3, two weak links.

![Image 3: AIC Rule 2](https://www.sudokuwiki.org/PuzImages/AIC2c.png)

AIC Rule 2 : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9B0504037n0h7n0b0g060bdudu0c2216014q82b60ac2072202be4q0c074o4i11090z4y52047y86010616080g7q0b06b8be0s030g05b6017uaaay080b038q0a82464602820a968q220g018y968a0g96030208) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=543000006000000100000702000700090004001608000600030501000803000002000000100000328)

This AIC starts and ends in B9. Setting 9 to be OFF creates a loop and a contradiction - that 9 must be ON if 9 is OFF. So removing the 9 forces it to reappear! We can safely place 9 in B9 - removing the other candidate 5.

AIC on 9 (Discontinuous Alternating Nice Loop, length 10):

-9[B9]+9[G9]-5[G9]+5[G3]

-5[D3]+8[D3]-8[D7]+8[C7]

-9[C7]+9[B9]

- Contradiction: When 9 is removed from B9 the chain implies it must be 9 - other candidates 5 can be removed

In terms of strong/weak links, we have a candidate where two strong link join up, hence the thick lines drawn by the solver.

## Nice Loops Rule 3

Our third rule dictates what happens when two weak links form a discontinuity in a loop:

If the adjacent links are links with weak inference (broken line), a candidate can be eliminated from the cell at the discontinuity. In terms of ON/OFF this is where you try and set a candidate to be ON but the loop comes round and shows that doing so forces that candiate to be turned OFF.

![Image 4: AIC Rule 3](https://www.sudokuwiki.org/PuzImages/AIC3.png)

AIC Rule 3 : [Load Example](https://www.sudokuwiki.org/sudoku.htm?bd=S9Bbu4q060a039m2q02cyb6030a9e0e020604cy070b8a8i0h8q0c820102067u050g01087q0u832q080d0f0c029f9e0r2i03020i082j0605034q18cy0l9u2z2r06220907030l1u17080s5e01106q043m092u0o) or : [From the Start](https://www.sudokuwiki.org/sudoku.htm?bd=006030020030002640700000001260501800008000200003208065300000006097300080010040900)

We'll consider A2 the start and end of the loop. By setting A2 to be 5 (+5[A2]) we turn off 5 in A7. That leaves 7 in A7 turning off 7 in F7. The strong (bi-location) link makes 7 on in F2. That removes 7 in E2 making 5 the solution in that cell. If 5 is ON in E2 it has to be OFF in A2....

Contradiction!

AIC on 5 (Discontinuous Alternating Nice Loop, length 8):

+5[A2]-5[A7]+7[A7]

-7[F7]+7[F2]-7[E2]

+5[E2]-5[A2]

- Contradiction: When A2 is set to 5 the chain implies it cannot be 5 - it can be removed

## In summary...

AICs are chains of links going across a unit and within a cell.

If a candidate is turned ON you create a weak link turning OFF any other candidates in that cell and across the units it can see.

If you turn a candidate OFF you can turn ON other candidates in that cell (if there are only two candidates in the cell - **bi-value**) or across the unit if candidate X occurs just twice (bi-location).

Note: Since we must alternate a strong link will be weak if the previous link was strong even if they all look 'strong'.

However, bi-value and bi-location are just two ways of making chain links. There are other interesting ways of making chain links: [Grouped Cells](https://www.sudokuwiki.org/AIC_with_Groups) and [Almost Locked Sets](https://www.sudokuwiki.org/AIC_with_ALSs) are documented here and other patterns as well can be made into links, even [Unique Rectangles](https://www.sudokuwiki.org/Unique_Rectangles).

* * *
