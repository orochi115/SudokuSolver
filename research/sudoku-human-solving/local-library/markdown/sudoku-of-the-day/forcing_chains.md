Title: Techniques: Forcing Chains - Sudoku Of The Day

URL Source: https://www.sudokuoftheday.com/techniques/forcing-chains

Markdown Content:
Discover more

Puzzles & Brainteasers

Puzzles

puzzle

Games

game

puzzles

Casual Games

Puzzle Video Games

puzzle game

Discover more

puzzle

game

puzzle game

This technique (thankfully!) is quite easy to understand, but can take quite some time to work out within a puzzle. This is a technique where having a separate copy or notepad overlay really helps, because you'll be making lots of notes!

A simple forcing chain is when you have lots of cells with just 2 candidates - and whichever value you would choose for one cell forces another cell to be just one of its two values. (It'll be clearer with an example!)

A number of people have been in touch to say that they’ve seen an error in the example below, and most of them are right! Since you’d have to understand the concept of forcing chains to see where the error lies, this example is still somewhat valid as a learning example, even if it isn’t correct. If I get time, I’ll put together a different (and hopefully correct) example!

### The First Choice

Take a look at this puzzle, which shows an example of a forcing chain.

![Image 1: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=(4678)(1267)W(12)5(68)(27)(14)39(68)39(68)41257(47)(127)5(27)3968(14)W(57)9(14)32(47)(18)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(48)(79)(2468))

It doesn't matter which value - 1 or 2 - was in the top cell (at coordinate C3,R1), they would force the value 5 into the other cell (C1,R4).

Discover more

puzzle game

Puzzles & Brainteasers

Puzzles

Now before starting, its worthwhile mentioning that some of these chains can be short, and sometimes they can be quite long! This example has one of each.

First of all, imagine if the top cell is a 1. This in turn would force the `{14}` a few cells below it to be a 4, and so on. Can you follow the chain?

![Image 2: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=AI3134(4678)(1267)W(i1s2)5(68)(27)(14)39(68)39(68)41257(47)(127)5(27)3968(14)W(57)9(s1i4)32(47)(18)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(48)(79)(2468))

![Image 3: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=AI3464(4678)(1267)W(i1s2)5(68)(27)(14)39(68)39(68)41257(47)(127)5(27)3968(14)W(57)9(s1i4)32(s4i7)(18)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(48)(79)(2468))

![Image 4: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=AI6414(4678)(1267)W(i1s2)5(68)(27)(14)39(68)39(68)41257(47)(127)5(27)3968(14)W(i5s7)9(s1i4)32(s4i7)(18)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(48)(79)(2468))

So, the 1 forces the 5:

![Image 5: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=AG3114(4678)(1267)W(i1s2)5(68)(27)(14)39(68)39(68)41257(47)(127)5(27)3968(14)W(i5s7)9(s1i4)32(s4i7)(18)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(48)(79)(2468))

Discover more

puzzle

Puzzles

Puzzles & Brainteasers

Casual Games

puzzles

Puzzle Video Games

game

Games

### The Second Choice

Now start again, but instead of a 1, this time make the top cell a 2.

![Image 6: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=(4678)(1267)W(s1i2)5(68)(s2i7)(i1s4)39(68)39(68)41257(s4i7)(127)5(27)3968(s1i4)W(i5s7)9(i1s4)32(i4s7)(s1i8)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(i4s8)(79)(2468))

Again crossing out the values which get ruled out - you'll see its quite a long chain!

Here's what it looks like with the arrows...

![Image 7: Sudoku puzzle](https://www.sudokuoftheday.com/image.svg?sg=AI3161AI6164AI6434AJB3474AI7479AJB7971AI7193AI9313AI1314(4678)(1267)W(s1i2)5(68)(s2i7)(i1s4)39(68)39(68)41257(s4i7)(127)5(27)3968(s1i4)W(i5s7)9(i1s4)32(i4s7)(s1i8)6(158)(123)(12)895674(13)(567)(67)(34)(47)1892(35)(29)461(78)53(79)(28)(23)87(246)9(234)51(246)(1239)5(123)(2468)(678)(234)(i4s8)(79)(2468))

The two chains have different paths starting with each of the two values for the first cell, but either one means there'll be a 5 in the second cell.

As soon as you find a situation like this, even though you don't know what the first cell will be, you definitely know the value in the second cell, so you can write it in!

### Is this the same as guessing?

Not quite - what you're doing is simultaneously looking at the implications of either choice, and seeing if any other cells will turn out the same whichever your choice would be. If you were to have just guessed one, and worked from there, you would actually fill in the same result for the second cell, but depending on whether you guessed correctly or not, you might have made a whole batch of mistakes on the way.

### Can this one get harder too?

What makes this method hard is that you might have to follow chains a long way, and you will have a lot of testing to do. Longer chains don't make it conceptually any harder, but they do make it more likely that you'll make mistakes along the way.

Sticking to working with just the pairs generally keeps it fairly simple, but there's nothing stopping you considering the effects of triples or other techniques as you go!

When using an overlay (tracing paper or computer overlay), here's a method which makes finding the chains a bit easier.

Pick your starting cell, and make a small u shape (a little smiley curve) _underneath_ the first pencilmark. From there, look around, but instead of crossing out pencilmarks (otherwise it gets too messy!), when you find a value that it forces somewhere else, put the same u shape underneath the forced value. Ignore any that the first choice eliminated - you might need them later!

Carry on doing this until you can't make any more "u" forces.

Now choose the second value in your original cell - and this time put a little "n" symbol (a downturned mouth) _above_ the second pencilmark. Like before, look at the implications and forces that this makes, continuing on until you can't find any more.

If there's a forcing chain, at some point you'll find a pencilmark with both a "u" and "n" on the same mark (in which case they'll almost join up!). When you see this its a sure sign that whichever candidate you picked for the first cell, you've found the right value for the second cell. Fill in that value, because it means you don't need to look any further!

Some people use colours to make it easier too - but it isn't essential.
