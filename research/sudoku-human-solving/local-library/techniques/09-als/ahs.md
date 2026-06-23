---
id: technique.ahs
name_en: Almost Hidden Sets
name_zh: 几乎隐藏集
family: als
difficulty: extreme
strategyId: ahs
sources:
  - ENJOYSUDOKU-AHS
  - HODOKU-ALS
  - SUDOKUWIKI-ALS
---

# Almost Hidden Sets / 几乎隐藏集

## One-Sentence Rule

An Almost Hidden Set (AHS) is N digits confined to N+1 cells of a single house — the hidden-set dual of the Almost Locked Set — and removing any one of those cells from consideration locks the N digits into the remaining N cells, giving a strong link usable as an AIC / chain node.

## 精确模式定义

Work in two complementary "data spaces" for a house (row, column, or box):

- **Naked space** `(positions) → digits`: each cell records its candidate digits. A **Naked Set** is N cells holding exactly N digits; an **Almost Naked Set (ANS / ALS)** is N cells holding N+1 digits.
- **Hidden space** `(digits) → positions`: each digit records which cells it can occupy. A **Hidden Set** is N digits confined to exactly N cells; an **Almost Hidden Set (AHS)** is **N digits confined to N+1 cells** of the house.

These are exact duals. Inside a house of K unsolved cells, the complement of a naked set of size `s` (holding `s` digits) is a hidden set of size `K − s` (the other `K − s` digits live in the other `K − s` cells). Likewise the complement of an ANS of size `s` (holding `s+1` digits) is an **AHS** built from the other `K − (s+1)` digits over `K − s` cells — i.e. an AHS of size `N = K − s − 1` digits in `N + 1 = K − s` cells. (David P Bird, ENJOYSUDOKU-AHS: "a hidden set in one representation is a naked set in the other.")

Practical consequence (StrmCkr, ENJOYSUDOKU-AHS): an ALS of size 5–8 cells has a complementary AHS of size 1–4 digits, so an AHS search up to size 4 covers the large-ALS cases at much lower runtime.

- **Smallest AHS** — 1 digit in 2 cells of a house (a conjugate pair / strong link on that digit). This is the hidden-space dual of the bivalue cell (the smallest ALS).
- **In a standard 9×9 Sudoku** an AHS can have at most 8 digits over 9 cells.

### Locked cell vs. RCC (the dual of the RCC)

In an ALS, all instances of a candidate are confined to the ALS cells, and one extra digit can leave; the lock fires when a candidate is *removed*. The AHS is dual on **cells**, not digits:

- An AHS has exactly **one extra cell**. The N digits would be a Hidden Set if one of the N+1 cells were taken away.
- If any single cell of the AHS is **forced to a value not in the AHS digit set** (or is otherwise removed from the digit set's reach), the N digits collapse into the remaining N cells → a **Hidden Locked Set**, and every *other* candidate is purged from those N cells.
- Equivalently (the dual of "remove a digit → ALS locks"): in an AHS, **one of its N+1 cells must take a digit outside the AHS set** OR the AHS becomes a hidden set; conversely if one of the N+1 cells is locked to an AHS digit at a specific place, the remaining digits redistribute. The strong inference the AHS supplies is: *"at least one of the N+1 cells does NOT hold an AHS digit"* is impossible — the N digits occupy N of the cells, so **the (N+1)-th cell holds a non-AHS digit ⇒ all AHS digits are locked in the other N cells.**

### Restricted Common (AHS version)

Two AHSs are linked by a **restricted common digit `x`** that **MUST BE TRUE in (at least) one of them** in the shared house (the dual of the ALS RCC, which *cannot* be true in both). David P Bird's chain identity makes the duality explicit:

```
(x)AHS1 = (x)ANS1 – (x)ANS2 = (x)AHS2
```

— the AHS link and the ALS (ANS) link are the same strong/weak inference viewed in the two data spaces. Unlike the ALS RCC, the AHS restricted common **may occupy an overlap cell** shared by the two AHSs.

## 触发判定

For a single AHS node (chain use): in some house H with unsolved cells, find a set `D` of N digits and a set `S` of N+1 cells (all in H) such that **every candidate of every digit in `D`, within house H, lies in `S`** (the N digits appear *only* in those N+1 cells of H). Then:

- For each cell `c ∈ S`: the proposition "`c` does not take any digit of `D`" is a valid **premise** that strong-links to "the N digits of `D` fill `S \ {c}`."
- Predicate for an AHS-XZ pair `(A, x, z)`:
  - `A`, `B` are AHSs (possibly in different houses);
  - `x` is a digit common to both that **must be true in at least one of A, B** (restricted common — all the "x escapes" are blocked so x cannot be absent from both);
  - `z` is another digit appearing as an *unlocked* member in both A and B.

## 消除/落子规则（全部情形）

### AHS as a chain / AIC node (primary use)

Treat each cell of the AHS as a node. The strong link is:

> If AHS cell `c` is **not** one of the N AHS digits, then the N AHS digits are locked into the other N cells (a Hidden Locked Set), purging every non-`D` candidate from those N cells.

Use this exactly like an ALS node in an Alternating Inference Chain: enter the AHS through one cell's "non-member" state, exit through the forced placement of an AHS digit elsewhere. Eliminations are whatever the surrounding AIC produces (peers of the two chain endpoints losing the chain digit).

### AHS-XZ rule (singly linked)

Two AHSs `A`, `B` share restricted common digit `x` (true in at least one) and another common unlocked digit `z`.

- Because `x` must be true in one AHS, in **that** AHS the placement of `x` forces the other (unlocked) AHS digits — including `z` — to be **false** there (an AHS digit placed in one cell leaves the rest of that AHS, including `z`, without that cell).
- Therefore `z` must be **false in at least one** of A, B in its AHS role, which by duality means `z` **must be true in at least one of the complementary ANSs**.
- **Elimination (dual / cell-internal form):** AHS-XZ removes the *non-AHS* digits from the link cells. As StrmCkr summarises (ENJOYSUDOKU-AHS): *"ALS-XZ removes x from peers of x-cell (cells outside the ALS); AHS-XZ removes all digits not used in set A and B from cell x (internal cells),"* subject to **"x must see all z cells."**

The two views give the **same eliminations** (David P Bird): the ALS-XZ over the complementary ANSs and the AHS-XZ over the AHSs are one and the same deduction in two data spaces.

### Doubly linked AHS-XZ

If A and B share **two** restricted commons, the configuration is the dual of the doubly-linked ALS-XZ and "gets into the realms of Sue de Coq patterns" (David P Bird, ENJOYSUDOKU-AHS). Once the eliminations are made, the ANS and AHS cells become **two multi-sector locked sets**. Eliminations: each restricted common is locked into one AHS (so it can be removed where it would be forced into both), and the remaining digits redistribute as locked sets.

### Practical eliminations summary

- Internal: non-`D` candidates removed from AHS cells that become a Hidden Locked Set.
- Chain: peers of the chain endpoints lose the AIC's pinned digit (identical to running the dual ALS chain).

## 退化与边界

- **AHS of N=1 digit in 2 cells** = a **conjugate pair** (strong link on one digit) — the dual of the bivalue-cell ALS. Most chains already use these as grouped strong links.
- **Complement identity**: an AHS of N digits over N+1 cells is the same object as an ANS/ALS of `(K − N − 1)` cells holding `(K − N)` digits in the same house (K = unsolved cells in the house). Searching ANS up to size `s` and AHS up to size `K − s − 1` covers both — only one locked-set algorithm in two data spaces is needed.
- **Overlap**: unlike ALS-XZ (where the RCC may not lie in the overlap), the AHS restricted common **may** occupy an overlap cell between the two AHSs.
- **Two non-overlapping sectors**: StrmCkr found AHS-XZ generally cannot be applied to two sectors that do *not* overlap; bridging two intersections with two strong links yields the doubly-linked case.

## 与其他技巧的关系

- **Dual of ALS** in every respect: AHS-XZ ↔ ALS-XZ, AHS chains ↔ ALS chains, doubly-linked AHS ↔ doubly-linked ALS / Sue de Coq (see `als.md`).
- **Hidden Subsets** (Hidden Pair/Triple/Quad, family 03) are the *locked* form; AHS is one cell short of them, exactly as ALS is one cell short of Naked Subsets.
- **AIC / Nice Loops** (family 08): AHS supplies a strong-link node, written in Nice-Loop notation with the restricted common as a weak link between AHSs — the dual of how ALS nodes embed in AICs.
- **Engine note (HoDoKu)**: HoDoKu implements ALS chains/ALS-in-chains directly; AHS gives the same eliminations via the complementary data space, so an engine may choose whichever representation is cheaper (small AHS instead of large ALS).

## Worked example

Source grid (David P Bird, ENJOYSUDOKU-AHS forum thread; from one of *bennys'* examples). Givens / fully reduced single-house state — 81-char string:

```
.78.6519393..1..7.516739842.9..76.1..6539.28..4..2..69657142938.2.983.5.389657421
```

Pencil-marked (derived; verified by peer elimination):

```
 *-------------*-------------*-------------*
 | 24  7   8   | 24  6   5   | 1   9   3   |
 | 9   3   24  | 248 1   48  | 56  7   56  |
 | 5   1   6   | 7   3   9   | 8   4   2   |
 *-------------*-------------*-------------*
 | 28  9   23  | 458 7   6   | 35  1   45  |
 | 17  6   5   | 3   9   14  | 2   8   47  |
 | 178 4   13  | 58  2   18  | 357 6   9   |
 *-------------*-------------*-------------*
 | 6   5   7   | 1   4   2   | 9   3   8   |
 | 14  2   14  | 9   8   3   | 67  5   67  |
 | 3   8   9   | 6   5   7   | 4   2   1   |
 *-------------*-------------*-------------*
```

**ALS (ANS) view** — the directly verifiable chain:

```
(13=7) ANS:r5c1,r6c3  –  (7=345) ANS:r4c7,r4c9,r5c9
```

- ANS₁ `{r5c1=17, r6c3=13}` — 2 cells, digits {1,3,7}: if it is not 7, it is the naked pair {1,3}.
- ANS₂ `{r4c7=35, r4c9=45, r5c9=47}` — 3 cells, digits {3,4,5,7}.
- Restricted common `7` (box 4 / the 7-link) is false in one ⇒ the relevant set locks on {1,3} or {3,4,5}.
- Common digit `3` must occupy one of the two ANSs ⇒ remove `3` from cells seeing all 3's of both ends.

**AHS dual view** (same deduction; David P Bird's notation):

```
(3)r6c3 = (238-7)AHS:r4c13,r6c1 = (7-3)AHS:r6c7 = (3)r5c7
```

**Eliminations (both views agree):** `r4c3 ≠ 3` and `r6c7 ≠ 3`.

Verification: with the 81-char grid, r4c3 = {2,3} and r6c7 = {3,5,7}; both contain the eliminated `3`. Grid reproduces exactly under peer elimination (no constructed candidates).

This single example deliberately shows both the ALS (ANS) and AHS expressions of one move, demonstrating the duality `(x)AHS1 = (x)ANS1 – (x)ANS2 = (x)AHS2`.

## Soundness

The AHS strong link is a counting argument in the hidden data space. In house H, N digits of set `D` can appear only in the N+1 cells of `S`. Suppose one cell `c ∈ S` does not hold any digit of `D` (it takes some other digit, or D is excluded there). Then all N digits of `D` must be placed in the remaining N cells `S \ {c}` — and since they are N digits in N cells of one house, they form a Hidden Locked Set: those N cells hold exactly `D`, so no other candidate can survive there. This is a genuine strong link ("`c` excludes D" ⇒ "`D` locks in `S\{c}`"), provably equivalent (by complementation within H) to the naked-space ALS strong link on the complementary cells. The XZ rule then chains two such links through a restricted common `x` that must be true in one AHS, exactly mirroring the ALS-XZ proof; the chain identity `(x)AHS1 = (x)ANS1 – (x)ANS2 = (x)AHS2` shows the eliminations are identical to those of the dual ALS-XZ, hence sound. No uniqueness assumption is used.

## Sources

- **ENJOYSUDOKU-AHS** — "Almost hidden set - xz rule", New Sudoku Players' Forum, started by StrmCkr (2015), definitional posts by David P Bird. `http://forum.enjoysudoku.com/almost-hidden-set-xz-rule-t32268.html`. Primary source for the AHS definition, the data-space duality, the AHS restricted common, and the AHS-XZ rule. Worked example above is verbatim from David P Bird's post (with derived pencilmarks). License: forum content, cited with attribution.
- **HODOKU-ALS** — Bernhard Hobiger, `https://hodoku.sourceforge.net/en/tech_als.php` (GNU FDLv1.3). For the naked-space ALS/RCC duals and ALS-in-chains framing.
- **SUDOPEDIA-ALS** — Sudopedia Mirror, "Almost Locked Set", `http://sudopedia.enjoysudoku.com/Almost_Locked_Set.html` (GNU FDL 1.2). Confirms ALS = N cells / N+1 digits and the "Almost ALS" hierarchy underpinning the dual.
