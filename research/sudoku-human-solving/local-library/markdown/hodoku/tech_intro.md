Title: HoDoKu: Solving Techniques - Introduction

URL Source: https://hodoku.sourceforge.net/en/tech_intro.php

Markdown Content:
## Table of Contents

*   [Preface](https://hodoku.sourceforge.net/en/tech_intro.php#ss)
*   [Terminology](https://hodoku.sourceforge.net/en/tech_intro.php#te)

* * *

## [](https://hodoku.sourceforge.net/en/tech_intro.php)Preface

**Every** sudoku program claims to be able to solve _all_ sudokus ... well, big deal! Since for every sudoku the number of ways in which digits can be inserted into the grid is finite a computer can just try all of them and see which one fits (this approach is usually called "Brute Force" or "Guessing") - and a good implementation on a modern computer should only need a few milliseconds to do that.

The real challenge is of course to solve the sudoku using only logic. For all but the easiest sudokus that requires more than just staring at the grid and hoping for a revelation. Many techniques have been developed to aid humans in finding possible next steps. Most of these techniques focus on reducing the number of candidates in order to find Singles that really advance the sudoku towards the solution.

The best source for all kinds of information concerning Sudoku (including solving techniques) is still [Sudopedia's Solving Technique Index](http://www.sudopedia.org/wiki/Solving_Technique) which has not only in depth descriptions of a large number of different techniques but lot's of additional information not easily found elsewhere too (e.g. descriptions and techniques for Sudoku variants).

In this guide about **70 techniques** and variants are described in detail and illustrated with over **170 examples**.

* * *

## [](https://hodoku.sourceforge.net/en/tech_intro.php)Terminology

Throughout this guide the following terms are used: A sudoku consists of **cells**, cells are grouped into **houses**. There are three different types of houses: **rows**, **columns** and **boxes** (under certain circumstances a cell can be seen as a house as well). Three boxes in a row are called a **chute** (a horizontal chute is a **floor**, a vertical chute is a **tower**) or a **band**. Cells are filled with **values**, the values present at the beginning of the game are called **givens**, possible values for unfilled cells are **candidates**. The whole sudoku area is sometimes called **grid**. If pencil and paper players write candidates into the grid these are sometimes called **pencil marks**, a grid with all candidates filled in is therefore a **pencil mark grid** or **PM**.

Rows and columns are numbered from 1 to 9 (left to right/top to bottom), a cell is specified by it's row and column (e.g.: r5c2 means the cell at row 5 and column 2; r57c2 means cells r5c2 and r7c2). Blocks are numbered from 1 to 9 too (top most floor from left to right, then the next floor and so on).

If two cells are in the same house (same row, same column, or same block) they are said to **see** each other, or to be **peers**. This is important in many techniques since two cells that see each other cannot have the same value.

* * *

Copyright © 2008-12 by Bernhard Hobiger

 All material on this page is licensed under the [GNU FDLv1.3](http://www.gnu.org/licenses/fdl-1.3.html).
