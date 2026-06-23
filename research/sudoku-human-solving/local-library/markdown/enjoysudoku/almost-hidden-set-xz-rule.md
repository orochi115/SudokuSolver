Title: Almost hidden set - xz rule: : Software

URL Source: http://forum.enjoysudoku.com/almost-hidden-set-xz-rule-t32268.html

Source type: New Sudoku Players' Forum thread (enjoysudoku.com). Primary discussion of the Almost Hidden Set (AHS) and the AHS-XZ rule, started by StrmCkr, with definitional posts by David P Bird.

## Post 0

Reply with quote 

Almost hidden set - xz rule: 
by StrmCkr » Mon Jan 12, 2015 9:14 am 

Almost Hidden Set {ahs} - xz Rule: 

open for debate: how redundant is this function dose it have any applications or merit
{its probably been talked about before but i cannot find much information on AHS and its applications, links & info kindly welcome pls!} 

my haphazard guess:
is that since an ahs {size 2+1} < == > Als {size 8+9}, the direct benefit i can foresee from it is application is that it can be used instead of searching for a size 5+ als 

for sake of discussion some notes on my approach: 

my solver has multiple save locations for a grid, i save sectors in two different fashions:
one that saves all cells for a space by digit => naked sets
one that saves all candidates for a space by cell => hidden sets -{the rules at the end of this post are based on this type of storage system!} 

a naked sector (row 1) would save :
cell 1 as: [89], cell 2 [89], cell 3[1..9],cell 4[1..9],cell 5[1..9],cell 6[1..9],cell 7[1..9],cell 8[1..9],cell 9[1..9]
Code: Select all .---------------------------------.---------------------------------.---------------------------------.
| 89         89         123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
'---------------------------------'---------------------------------'---------------------------------' 

a naked pair function for example checks a size of 2 cells combinations against a combination of 2 digits in a sector 
resulting in Sector 1: Cells 1 & 2 = [89] =>> eliminate all candidates [8,9] from all peer cells R1C789, R23C123

this can also be viewed in terms of an als-xz rule
Col 1 searching for n cells, with n+1 candidate resulting in a hit on Cell 1 with [8,9]
Col 2 searching for n cells, with n+1 candidate resulting on a hit with cell 2 with [8,9] 
Z = 8 or 9 and x 9 or 8 =>> eliminate all candidates [8,9] from all peer cells R1C789, R23C123 

a hidden set: 
Sector row 1 digit 1[1,9], digit 2[1..9], digit 3[1..9],digit 4[1..9],digit 5[1..9] ,digit 6[1..9] ,digit 7[1..9] ,digit 8[1..9] ,digit 9[1,9] 
Code: Select all .---------------------------------.---------------------------------.---------------------------------.
| 123456789  345689     3456789   | 3456789    3456789    3456789   | 3456789    3456789    123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
'---------------------------------'---------------------------------'---------------------------------' 
a hidden pair functions by searching 2 digits combinations against a combination of 2 cells in a sector. 
in Sector 1: resulting in Digits 1 & 2 in cells[1,9] =>> eliminate all candidates not in digits[1,2] from cells[1,9] 

this can also be viewed in terms of an ahs-xz rule
Col 1 searching for n+1 digits, in n cells resulting on a hit for digits [8,9] in cell [1]
Col 2 searching for n+1 digits , in n cells resulting on a hit for digits [8,9] in cell [9]
Z = 8 or 9 and x 9 or 8 =>> eliminate all candidates not in digits[1,2] from cells[1,9]

slightly more difficult example:
xyz-wing as an:
Almost Locked Set XZ-Rule: A=r2c2 {13}, B=r15c1 {123}, X=3, Z=1 => r23c1<>1 
Code: Select all .---------------------------------.---------------------------------.---------------------------------.
| 123        123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  13         123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 12         123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
'---------------------------------'---------------------------------'---------------------------------'

AhS- xz 
{hidden xy-wing example} 

Code: Select all .---------------------------------.---------------------------------.---------------------------------.
| 123456789  1456789    1456789   | 1456789    123456789  1456789   | 1456789    1456789    1456789   |
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 123456789  123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
:---------------------------------+---------------------------------+---------------------------------:
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
| 2456789    123456789  123456789 | 123456789  123456789  123456789 | 123456789  123456789  123456789 |
'---------------------------------'---------------------------------'---------------------------------' 

AHS - xz rule: 
set A is comprised of N+1 digits in N cells 
set B is comprised of N+1 digits in N cells
Z is a restricted common cell of sets A&B
X is a common cell of sets A&B

if z is a peer of x cell 
z = digits of A B || Z <> Digits not in A & B 

Doubly linked rule: 
when X is also a restricted common of sets A & B 
all X cells that are peers of all Z Cells in sets A&B = Digits of A&B

Doubly linked rule example: 

Last edited by StrmCkr on Tue Mar 22, 2016 8:02 pm, edited 4 times in total.

Some do, some teach, the rest look it up.
stormdoku

## Post 1

Reply with quote 

Re: Almost hidden set - xz rule: 
by David P Bird » Mon Jan 12, 2015 10:18 am 

StrmChkr wrote: my haphazard guess:
is that since an ahs {size 2+1} < == > Als {size 8+9}, the direct benefit i can foresee from it is application is that it can be used instead of searching for a size 5+ als 
To pick-up just on this comment: 

The standard way to store data for Sudoku grids is (digits)position,house but it's possible to use alternative 'data spaces' using (positions)digit,house. 
But a hidden set in one representation is a naked set in the other. 
Therefore an algorithm to find naked and almost naked sets in one data space will find hidden and almost hidden sets in the other. 

As an NS set size 5 has a HS of size 4 as a complement it is then only necessary to search for sets up to size 4.
Therefore it can be easier to have alternative data spaces and one locked set algorithm, than a single data space and two locked set algorithms.
The routines to translate one data format to the other are trivial and take little effort or space. 

Code: Select all Regular (digits)row,column data space
 *--------------------*--------------------*--------------------*
 | 134   136   5      | 124   1346  236    | 9     7     8      | 
 | 2     136   1346   | 78    9     78     | 1346  146   5      | 
 | 7     9     8      | 145   1346  356    | 2     146   1346   | 
 *--------------------*--------------------*--------------------*
 | 6     3578  34     | 24789 478   1      | 345   2459  2349   | 
 | 145   157   2      | 3     467   679    | 1456  8     1469   | 
 | 134   138   9      | 248   5     268    | 7    1246   12346  | 
 *--------------------*--------------------*--------------------*
 | 1589  2     16     | 15789 178   4      | 156   3     1679   | 
 | 13589 4     13     | 6     1378  35789  | 15    1259  1279   | 
 | 1359  1356  7      | 159   2     359    | 8     14569 1469   | 
 *--------------------*--------------------*--------------------* 
AHS (d29+3457#1)r4c489 

Alternative (columns)row,digit data space 
      D1     D2     D3        D4     D5     D6        D7     D8     D9       
    *-----------------------*-----------------------*-----------------------*
 R1 | 1245   46     1256    | 145    3      256     | 8      9      7       | 
 R2 | 2378   1      237     | 378    9      2378    | 46     46     5       | 
 R3 | 4589   7      569     | 4589   46     5689    | 1      3      2       | 
    *-----------------------*-----------------------*-----------------------*
 R4 | 6      489    2379    | 345789 278    1       | 245    245    489     | 
 R5 | 1279   3      4       | 1579   127    5679    | 256    8      69      | 
 R6 | 1289   4689   129     | 1489   5      689     | 7      246    3       | 
    *-----------------------*-----------------------*-----------------------*
 R7 | 134579 2      8       | 6      147    379     | 459    145    149     | 
 R8 | 135789 89     1356    | 2      1678   4       | 569    156    1689    | 
 R9 | 12489  5      126     | 89     12468  289     | 3      7      14689   | 
    *-----------------------*-----------------------*-----------------------*  
ANS (c489)r4d29 
Being a chains man, I can't comment on how you might combine the AHSs you find into patterns.

## Post 2

Reply with quote 

Re: Almost hidden set - xz rule: 
by blue » Thu Jan 15, 2015 12:23 am 

Picture worth a thousand words ?

AHS-XZ.jpg

## Post 3

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Sat Mar 19, 2016 9:20 am 

attempting to program this function: 

my data storage for hidden sets is 

hidden_Sector [Sector, Digit]: saving [0..8] which represents Col/Row/Box position based on the sector selected. 

{specifically : in this sequence }
Row 1: 0..8 { left to right} 
Col 1: 0..8 {top down} 
Box1: first row {0..2}, 2nd row {3..5}, 3rd row { 6..8} 

{i can convert this data into "cells" pretty easily} 

my general idea: 

part 1:
search [0..26 ] sectors for: 
Group A ->> selecting N "digit" of a range of [1..8] digits combinations using digits [1..9 ]
verify group "A" N digits are in N+1 cells 

part2:
search [0..26 sectors} which has peer {visible} cells of group A 
Group B ->> selecting N "digit" of a range of [1..8] digits combinations using digits [1..9 ]
verify group "B" N digits are in N+1 cells 

Part 3: this is where i get stuck~ {aHs-xz rule} 
"Q" search for a [0..26] sector that is peer of group A & B 
identify all digit common to both A & B 
verify all cells of A & B of that digit are in the common sector "Q": label all these cells as "x" 
identify all digits not common to both A & B and label all these cells as "z" 

rule: all "x" cells may contain only digits from A & B 

Part 4: Double link rule. 

Some do, some teach, the rest look it up.
stormdoku

## Post 4

Reply with quote 

Re: Almost hidden set - xz rule: 
by David P Bird » Sat Mar 19, 2016 5:33 pm 

StrmCkr , I'm still a bit unsure of your intentions but have the feeling that you would need to use cell truth and link sets in the style of XSudo to reach them. 

However to go back to basics when two ANSs have a single restricted common digit in combination they make a 2sector ANS, and when they have two restricted commons (ie are double linked) they make a 2sector Naked Set. 

For the benefit of lurkers, when two ANSs have a restricted common digit (x) that CAN'T BE TRUE in both it must be false in one of them. 
In the ANS where (x) is false all the other candidates will be true, so if (z) is another common candidate, it must be true in at least one of the ANSs and can be eliminated from any cell seeing all its possible positions. 
Here (x) cannot occupy an overlap cell between the two ANSs as if it were true there it wouldn't restricted to one of them. 

Translating this logic to consider a possible AHS XZRule: 

Two AHSs have a restricted common digit (x) that MUST BE TRUE in one of them
In the ANS where (x) is true all the unlocked candidates will be false, so if (z) is another common unlocked candidate it must be false in at least one of them. 
In turn this means it must be true in at least one of the complementary ANSs. 
In this case (x) may occupy an overlap cell between the two AHSs.

The outcome is that both rules provide the same eliminations the reason being obvious when this simple chain is considered.
(x)AHS1 = (x)ANS1 – (x)ANS2 = (x)AHS2 

What this points up is that if there are no restricted common digits sharing a house between the ANSs, players should check if any digits must be true in at least one of the AHSs before giving up.

Taking one of < bennys' > examples
.78.6519393..1..7.516739842.9..76.1..6539.28..4..2..69657142938.2.983.5.389657421
Code: Select all  *-------------*-------------*-------------*
 | 24  7   8   | 24  6   5   | 1   9   3   |
 | 9   3   24  | 248 1   48  | 56  7   56  |
 | 5   1   6   | 7   3   9   | 8   4   2   |
 *-------------*-------------*-------------*
 | 28  9   23  | 458 7   6   | 35  1   45  |
 | 17  6   5   | 3   9   14  | 2   8   47  |
 | 178 4   13  | 58  2   18  | 357 6   9   |
 *-------------*-------------*-------------*
 | 6   5   7   | 1   4   2   | 9   3   8   |
 | 14  2   14  | 9   8   3   | 67  5   67  |
 | 3   8   9   | 6   5   7   | 4   2   1   |
 *-------------*-------------*-------------* 
ANS:XZ.. (13=7)ANS:r5c1,r6c3 - (7=345)ANS:r4c79,r5c9 

Mixed... (13=7)ANS:r5c1,r6c3 – (7)r6c1 = (7)r6c7 - (7=345)ANS:r4c79,r5c9 

AHS:XZ.. (3)r6c3 = (238-7)AHS:r4c13,r6c1 = (7-3)AHS:r6c7 = (3)r5c7 

In each case => r4c3,r6c7 <> 3

For the doubly linked case we get into the realms of Sue de Coq patterns which caused a discussion < here > that should be of interest to you. Once the eliminations are made the ANS and AHS cells become two multi-sector locked sets.

David

## Post 5

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Sun Mar 20, 2016 6:07 am 

Dave, for clarity 

I already have Als-xz with double linked rule up and running in my solver. 
I have a few diffrent ways of storing how and in what locations digits are active. 

For normal Als - xz my program stores 
Sectors 0..26 by cell position in sector(0..8)
Saving digits 

For als xz rule my code
Searches(0..26) sectors for group a for N cells
Where 'n cells contain n+1 digits 

Searches( 0..26) sectors that is a peer of a for group b 
For 'n cells containing n+1 digits. 

Sector q searchs for a sector (0..26) that is peer to both a and b groups. 
If all cells for digit z are held in sector q *a and q*b, and z Is a digit in both a and b
Then z Is a restricted common

If digit x is contained in both a and b groups and all cells of x are not located in a q and b*q
Then x is a non restricted common 

All peers cells of all x cells from a&b cannot contain digit x. 

My double link code adds a second q and repeats the same process. 

My attempt currently is to get almost hidden set - xz rule to work 
Data storage for hidden sets is diffrent 
I have sector(0..26) by digit(1..9) saving cell position(0..8)

The diffrence in storage 
consider a naked pair at cells 1 and 9 for digit 1, 2
Naked set storage reads
0,0:[1,2]
0,8;[1,2] 
(the other 7 cells would be a hidden set) 
Hidden pair at cells 1&9 for digits 1,2
Hidden set storage reads
0,1:[0,8]
0,2:[0,8]
( the other 7 digits would be a naked set) 

Some do, some teach, the rest look it up.
stormdoku

## Post 6

Reply with quote 

Re: Almost hidden set - xz rule: 
by David P Bird » Sun Mar 20, 2016 12:39 pm 

StrmChkr , I took it that because you were posting in the 'Advanced Solving Techniques' section you were having problems understanding the logic when investigating if the ANS XY Rule had an AHS counterpart. However I think your problems are far more concerned about the coding issues and should probably have been posted in the 'Software' section (perhaps Jason could move this thread there).

Perhaps our programmers can help you further.
.
[Edit irrelevant material deleted] 

Last edited by David P Bird on Sun Mar 20, 2016 7:21 pm, edited 1 time in total.

## Post 7

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Sun Mar 20, 2016 3:39 pm 

Well, the deductions are inverse of each other 
each other 
Als-xz removes x from peers of x cell (cells outside the als
Ahs-xz removes all digits not used in set a and b from cell x, (internal cells) 

( this thread is still on Ahs-xz application, figured I'd keep a coding question regarding it on the same thread) 
Pretty sure i figured out what I'm missing from the function which is
X must see all z cells. 

Thanks for the older link to stuff I read along time ago 

Some do, some teach, the rest look it up.
stormdoku

## Post 8

Reply with quote 

Re: Almost hidden set - xz rule: 
by JasonLion-Admin » Mon Mar 21, 2016 2:05 am 

Moved to the software area, as suggested.

## Post 9

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Sat Dec 23, 2017 2:24 am 

finally: 
got it to work using my 

row/box/col conversion to show hidden sets directly. {which i used for other shorter solving techniques earlier in my program} 

Row digit saving col 
Col digit saving row 
box col saving square 

as a bonus i realized what i did to make my als engine unable to be flipped into these directly and acted more comber-sum have an impending upgrade for it as well 

hind site...
had this project on the shelf for 2 years finally had time to do it lol 

Some do, some teach, the rest look it up.
stormdoku

## Post 10

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Sun Dec 24, 2017 2:59 am 

Code: Select all +--------------------------+-----------------------+-----------------+
| 124579    1579-2  1579-4 | 2468   246789  24689  | 45679  3   5679 |
| 6         (279)   (479)  | 5      234-79  234-9  | 1      8   (79) |
| 4579      8       3      | 46     1       469    | 45679  2   5679 |
+--------------------------+-----------------------+-----------------+
| 248-1     (12)    (14)   | 9      5       7      | 3      46  68-1 |
| 34578-1   6       57-14  | 148    348     1348   | 578    9   2    |
| 345789-1  3579-1  579-14 | 12468  23468   123468 | 578    47  1578 |
+--------------------------+-----------------------+-----------------+
| 37        37      6      | 18     89      189    | 2      5   4    |
| 59        4       8      | 7      26      256    | 69     1   3    |
| 1579      1579    2      | 3      46      456    | 6789   67  6789 |
+--------------------------+-----------------------+-----------------+ 

anyone know if its possible to invert this als-xz to showcase it as an ahs-xz

so far i don't think its possible to use AHS-xz rules on two sectors that don't overlap. 

bridging the intersections with 2 strong links on 2 & 4 makes it double linked ahs-xz style elimination... 

Some do, some teach, the rest look it up.
stormdoku

## Post 11

Reply with quote 

Re: Almost hidden set - xz rule: 
by yzfwsf » Tue Jan 28, 2020 2:15 am 

StrmCkr wrote: Code: Select all +--------------------------+-----------------------+-----------------+
| 124579    1579-2  1579-4 | 2468   246789  24689  | 45679  3   5679 |
| 6         (279)   (479)  | 5      234-79  234-9  | 1      8   (79) |
| 4579      8       3      | 46     1       469    | 45679  2   5679 |
+--------------------------+-----------------------+-----------------+
| 248-1     (12)    (14)   | 9      5       7      | 3      46  68-1 |
| 34578-1   6       57-14  | 148    348     1348   | 578    9   2    |
| 345789-1  3579-1  579-14 | 12468  23468   123468 | 578    47  1578 |
+--------------------------+-----------------------+-----------------+
| 37        37      6      | 18     89      189    | 2      5   4    |
| 59        4       8      | 7      26      256    | 69     1   3    |
| 1579      1579    2      | 3      46      456    | 6789   67  6789 |
+--------------------------+-----------------------+-----------------+ 

anyone know if its possible to invert this als-xz to showcase it as an ahs-xz

so far i don't think its possible to use AHS-xz rules on two sectors that don't overlap. 

bridging the intersections with 2 strong links on 2 & 4 makes it double linked ahs-xz style elimination... 
Would you please provide an example of ahs-xz, thank you！

## Post 12

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Fri Jan 31, 2020 1:29 pm 

Code: Select all +--------------------------------+----------------------------+--------------------+
| -178(3469)  -178(346)  -78(69) | -7(246)  -7(1468)  -7(124) | 158   157    1578  |
| 2           1678       678     | 67       -67(158)  -7(15)  | 3     4      9     |
| 5           1478       78      | 47       3         9       | 2     6      178   |
+--------------------------------+----------------------------+--------------------+
| 13678       9          25678   | 23467    467       2347    | 156   12357  12357 |
| 367         23567      4       | 1        67        237     | 9     8      2357  |
| 1367        12367      267     | 5        9         8       | 16    1237   4     |
+--------------------------------+----------------------------+--------------------+
| 479         457        1       | 8        2         3457    | 45    359    6     |
| 4689        24568      25689   | 349      145       1345    | 7     12359  12358 |
| 4789        24578      3       | 479      1457      6       | 1458  1259   1258  |
+--------------------------------+----------------------------+--------------------+ 
A) 2,3,4,6,9 @ R1C123456
B) 1,5,8 @ R1C56,R2C56
X: R1C5,R1C4 
Z: R1C5,R1C4 
=>> r1c123<>8, r1c12<>1, r2c5<>6, R1C123456,r2c56<>7

Code: Select all +-----------------------------+-----------------------+--------------------+
| 78(13469)  78(1346)  78(69) | 2467   14678    1247  | 158   157    1578  |
| 2          -7(168)   7(68)  | 67     67(158)  7(15) | 3     4      9     |
| 5          78(14)    78     | 47     3        9     | 2     6      178   |
+-----------------------------+-----------------------+--------------------+
| 13678      9         25678  | 23467  467      2347  | 156   12357  12357 |
| 367        23567     4      | 1      67       237   | 9     8      2357  |
| 1367       12367     267    | 5      9        8     | 16    1237   4     |
+-----------------------------+-----------------------+--------------------+
| 479        457       1      | 8      2        3457  | 45    359    6     |
| 4689       24568     25689  | 349    145      1345  | 7     12359  12358 |
| 4789       24578     3      | 479    1457     6     | 1458  1259   1258  |
+-----------------------------+-----------------------+--------------------+ 
A) 1,5,8 @ R2C2345
B) 1,3,4,6,9 @ R1C12,R2C12,C3R2 
x: R2C3 
Z: R2C2 
=> R2C2 <> 7

Code: Select all +-------------------+----------------------+-----------------+
| 3       158  2458 | 6       458     7    | 9    24    14   |
| 69      7    46   | 49      1       2    | 3    8     5    |
| 2589    158  2458 | 4589    3       4589 | 146  2467  147  |
+-------------------+----------------------+-----------------+
| 7       6    125  | 3       245     145  | 8    9     24   |
| 258     58   9    | 4578    6       458  | 247  1     3    |
| 4       3    128  | 789     278     189  | 27   5     6    |
+-------------------+----------------------+-----------------+
| 168     9    678  | 2       -8(47)  3    | 5    467   1478 |
| 568     4    5678 | 1       9       58   | 26   3     278  |
| -1(58)  2    3    | (4578)  (4578)  6    | 14   47    9    |
+-------------------+----------------------+-----------------+ 
a) 5,8 @ R9C145 
B) 4,7 @ R7C5,R9C45
X: R9C45
Z:R9C454
R9C1 <> 1 , R7C5 <> 8

Code: Select all +-----------------+------------------+-----------------------+
| 3     158  2458 | 6     458   7    | 9       24    14      |
| 69    7    46   | 49    1     2    | 3       8     5       |
| 2589  158  2458 | 4589  3     4589 | 14(6)   2467  147     |
+-----------------+------------------+-----------------------+
| 7     6    125  | 3     245   145  | 8       9     24      |
| 258   58   9    | 4578  6     458  | 247     1     3       |
| 4     3    128  | 789   278   189  | 27      5     6       |
+-----------------+------------------+-----------------------+
| 168   9    678  | 2     478   3    | 5       467   47(18)  |
| 568   4    5678 | 1     9     58   | (26)    3     7(28)   |
| 158   2    3    | 4578  4578  6    | -4(+1)  47    9       |
+-----------------+------------------+-----------------------+ 
A) 24,39,78 @ 1,6
b) 62.69.71.78 @ 1,2,8
x:69
z: 78 
=> 78 <> 4 

Last edited by StrmCkr on Wed Nov 02, 2022 2:51 am, edited 1 time in total.

Some do, some teach, the rest look it up.
stormdoku

## Post 13

Reply with quote 

Re: Almost hidden set - xz rule: 
by yzfwsf » Mon Apr 06, 2020 12:27 am 

What are the advantages of ahs-xz over als-xz? In my opinion, ahs-xz deletion number is not as large as als-xz deletion number which complements each other. In addition, are ahs-xz all rank0 logic structures?

als-xz.png (65.39 KiB) Viewed 8241 times

## Post 14

Reply with quote 

Re: Almost hidden set - xz rule: 
by StrmCkr » Mon Apr 06, 2020 2:06 am 

The advantages is run time 

Als size 5 - 8 (cells per sector) 
Has a complementary ahs size 1-4 (digits per sector) 

Yes they tend to leave blr move set after completion unless you add the complexity to it
But that is also relative to an als functions as well. 

Last edited by StrmCkr on Fri Apr 10, 2020 4:28 am, edited 1 time in total.

Some do, some teach, the rest look it up.
stormdoku
