Title: HoDoKu: Solving Techniques - Fish (General Explanation)

URL Source: https://hodoku.sourceforge.net/en/tech_fishg.php

Markdown Content:
## Table of Contents

*   [Introduction](https://hodoku.sourceforge.net/en/tech_fishg.php#fi)
*       *   [Principle](https://hodoku.sourceforge.net/en/tech_fishg.php#princ)
    *   [How it Works](https://hodoku.sourceforge.net/en/tech_fishg.php#how)

*   [Shapes and Sizes](https://hodoku.sourceforge.net/en/tech_fishg.php#fs)
*   [Fins and Sashiminess](https://hodoku.sourceforge.net/en/tech_fishg.php#ff)
*       *   [(Exo) Fins](https://hodoku.sourceforge.net/en/tech_fishg.php#exofin)
    *   [Sashiminess](https://hodoku.sourceforge.net/en/tech_fishg.php#sashimi)

*   [Endo Fins and Cannibalism](https://hodoku.sourceforge.net/en/tech_fishg.php#fc)
*       *   [Endo Fins](https://hodoku.sourceforge.net/en/tech_fishg.php#endofin)
    *   [Cannibalism](https://hodoku.sourceforge.net/en/tech_fishg.php#cannibal)

* * *

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Introduction

The term fish denotes a group of techniques that work from the same principle, but have spawned an incredible amount of varieties (as real fish have). They start with simple X-Wings (can be found in any tutorial) and go as far as Cannibalistic Finned Mutant Leviathans. The larger species are rather cumbersome to find manually and are more commonly used by computer programs, but the simpler ones are rather easy to spot and can advance a sudoku pretty quickly.

This sections tries to completely cover all types of fish. If you are only interested in the basic variants and find the explanations here rather cumbersum, proceed directly to the descriptions of the [Basic Fishes](https://hodoku.sourceforge.net/en/tech_fishb.php).

Fish are single digit patterns. "Single digit" means, that only candidates of the same digit are considered when looking at fish. "Pattern" means, that the location of the candidates in the grid is important. The term is used to differentiate them from [chains](https://hodoku.sourceforge.net/en/tech_chains.php).

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Principle

The principle behind fish is very simple: Look for a certain number of non overlapping houses. Those houses are called the **base sets** (set is synonymous for house here), the candidates contained within them are the **base candidates**. Non overlapping means, that any base candidate is contained only in one base set, the sets themselves can overlap. Now look for an equal number of different non overlapping houses that _cover_ all base candidates. These new sets are the **cover sets** containing the **cover candidates**. If such a combination exists, all cover candidates that are not base candidates can be eliminated.

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)How it Works

Fishes use the fact that a digit can only appear once in a house. Since we only consider candidates of the same digit, any base set must contain exactly one cell with the fish value. The same is true for the cover sets. Since all base candidates are part of a cover set as well as a base set, the possible placements of the candidates become very restricted. If we have N base sets and N cover sets, exactly N cells have to contain the fish digit. The sudoku rule ensures that in every cover set exactly one base candidate has to be set. As usually we don't know which of course, but we know it must be one, so none of the cover candidates that are not base candidates are possible placements. They can be eliminated.

* * *

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Shapes and Sizes

The number of base/cover sets define the **size** of the fish. The following names are normally used to describe the size:

*   Size 2: X-Wing (X-Wing is a fish and not a wing!)
*   Size 3: Swordfish
*   Size 4: Jellyfish
*   Size 5: Squirmbag
*   Size 6: Whale
*   Size 7: Leviathan

Examples can be found in the chapter on [Basic Fish](https://hodoku.sourceforge.net/en/tech_fishb.php).

The combinations of house types (rows, columns, blocks) used to build the base and cover sets determine the type of the fish (types are given as [base sets]/[cover sets]):

*   [rows]/[columns] or [columns]/[rows]: Basic Fish (the term "Basic" is normally omitted)
*   [rows and boxes]/[columns and boxes] or [columns and boxes]/[rows and boxes]: Franken Fish (normally only one of the sets contains at least one box)
*   arbitrary combinations of rows/columns/boxes in one or both sets: Mutant Fish

When describing fishes, the base and cover sets are usually written down and determine the type of the fish. Examples:

*   4 c39 r46: Fish for digit 4, base sets are columns 3 and 9, cover sets are rows 4 and 6 -> (Basic) X-Wing
*   4 c39b8 r469: Fish for digit 4, base sets are columns 3 and 9 and box 8, cover sets are rows 4, 6, and 9 -> Franken Swordfish
*   4 r159c9 c45b36: Fish for digit 4, base sets row 1, 5, 9 and column 9, cover sets column 4, 5 and blocks 3, 6 -> Mutant Jellyfish

Examples for Franken and Mutant Fish can be found in [Complex Fish](https://hodoku.sourceforge.net/en/tech_fishc.php).

* * *

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Fins and Sashiminess

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)(Exo) Fins

The trick with fishing is of course to find cover sets that contain really all base candidates. Unfortunately more often then not base candidates are left over. This destroys the fish premise ("in any cover set exactly one base candidate must be true") because anyone of the extra base candidates could be true. Those extra candidates are called **fins** (or more exactly: **exo fins** to differentiate them from **endo fins** - see [below](https://hodoku.sourceforge.net/en/tech_fishg.php#endofin)), the fish becomes a Finned Fish.

The good news is that eliminations are still possible under certain circumstances. The logic goes as follows: Either all fins are false, then we have a fish that eliminates all cover candidates that are not base candidates (the **possible eliminations**), or one of the fins is true thus eliminating all candidates that can see the fin cell. If we combine the two possibilities we get the following rule: In a finned fish all possible eliminations that see all the fins can be eliminated.

Examples for Finned Fish can be found in [Finned/Sashimim Fish](https://hodoku.sourceforge.net/en/tech_fishfs.php).

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Sashiminess

In descriptions available on the internet many additional conditions about fish candidates can be found (so and so many candidates at least in this or that base set). They are all unnecessary. Every fish that has an equal number of base and cover sets, where all base candidates are within the cover sets, does work. The reason for these additional rules is a discussion that is still not settled in the sudoku community: The question of degeneration. Certain types of patterns meet the fish rules, but they contain a smaller fish that could eliminate something first or they could be simulated by easier moves (normally singles and locked candidates moves). Some sudoku players call those fish "degenerate" and don't think them valid.

In some respect the discussion is academic. Whether the fish is degenerate or not, the eliminations drawn from it are always valid. There is a special case, where the difference is important to understand the various fish names: If a degenerate fish has fins, the easier moves contained in the fish cannot be executed because they are prevented by the fins. What we get is a Finned Fish, that would not even be a fish, if it were not for the fins. Such a fish is often called **Sashimi**.

A discussion is still not settled whether the term Sashimi should replace the term Finned (regularly seen in various forums) or whether it should be an additional attribute to the fish name describing its **Sashiminess**. Depending on what side of the argument you decide to be, it is either Sashimi X-Wing or Finned Sashimi X-Wing (you could of course skip the argument and stick with Finned Fish - this is exactly what HoDoKu does for all non basic fish types).

* * *

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Endo Fins and Cannibalism

One important condition for fishes was, that neither the base sets nor the cover sets are allowed to overlap (and overlap means here: no base candidate may be in more than one base set and no cover candidate may be in more than one cover set). If we lower that restriction, we get two advanced techniques: Endo Fins and Cannibalism.

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Endo Fins

If a base candidate is contained in more than one base sector our calculations are not adding up any more. If that candidate was true, we had only (N-1) candidates placed for N cover sets: One cover set would be without a placed base candidate thus destroying the fish. On the other hand we already had base candidates that when set destroy the fish: We called them fins.

The above means, that we can allow base candidates that are contained in more than one base set as long as we treat them as fins. To differentiate these new fins from the regular ones, we call them **endo fins**.

Endo Fins greatly enhance the number of possible fishes (and thus the number of eliminations possible by fish) but they greatly enhance the number of possible combinations of base sets too. Combine that with the fact that endo fins can only exist in Franken or Mutant Fish and you will see that the number of possible combinations to search for Finned Franken/Mutant Fish with endo fins makes them very hard to find for human players.

## [](https://hodoku.sourceforge.net/en/tech_fishg.php)Cannibalism

Now let's see what happens, if a base candidate is part of not only one cover set but of two cover sets. If that candidate were placed, we would still need N base candidates to satisfy the sudoku rule for the base sets. Unfortunately we would also get N candidates placed within the cover sets. This means that we would get one cover set with two cells containing the fish digit thus violating the sudoku rule.

Conclusion: If we have a valid fish, a base candidate contained in two cover sets must be false, or to put it the other way round, it can be eliminated. Because it is a part of the base set, the fish is quasi eating itself. Such a fish is consequently called a Cannibalistic Fish.

The same logic holds, if a cannibalistic fish has fins. As in any finned fish, however, the base candidate can only be eliminated, when it sees all the fins.

* * *

Copyright © 2008-12 by Bernhard Hobiger

 All material on this page is licensed under the [GNU FDLv1.3](http://www.gnu.org/licenses/fdl-1.3.html).
