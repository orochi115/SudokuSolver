---
id: technique.als
name_en: Almost Locked Sets
name_zh: 几乎锁定集
family: als
difficulty: extreme
strategyId: als-xz
sources:
  - HODOKU-ALS
  - SUDOKUWIKI-ALS
---

# Almost Locked Sets / 几乎锁定集

Covers `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, `death-blossom`, and the general `als-xy-chain`.

## One-Sentence Rule

An Almost Locked Set is N cells whose candidates total N+1 digits; whenever two or more ALS are linked by restricted common candidates, at least one ALS is forced into a Locked Set, and any digit thereby forced to occupy one of the linked ALS can be eliminated from every cell that sees all its possible positions.

## 精确模式定义

- **Locked Set / Naked Set** — N unsolved cells in one house containing only N candidates total. All N digits are confined to those N cells, so they may be removed from every other cell of the house.
- **Almost Locked Set (ALS)** — N cells in one house containing exactly **N+1** candidate digits; "one cell short of being a locked set" (SUDOPEDIA-ALS). Removing any single candidate digit from the ALS turns it into a Locked Set.
  - Smallest ALS = a single bivalue cell (1 cell, 2 candidates).
  - Largest ALS in 9×9 = 8 cells with 9 candidates.
- **Restricted Common Candidate (RCC)** — a digit `X` shared by two ALS such that **all instances of `X` in ALS₁ see all instances of `X` in ALS₂** (they share a house and mutually eliminate). Consequence (HODOKU-ALS): `X` can be true in **at most one** of the two ALS; placing it in either forces the other ALS to lose `X`, turning that ALS into a Locked Set.
- **Unrestricted common candidate** — a digit common to both ALS whose instances do **not** all mutually see each other; it is *not* an RCC and cannot drive the lock, but may be the eliminated digit `Z`.
- **ALS overlap** — two ALS may share cells, with one restriction: **the overlap region must not contain an RCC** (HODOKU-ALS). (For Death Blossom, HoDoKu disallows overlap by default.)

The strong-link semantics of an ALS: "Any move that would eliminate all candidates for a particular digit from the ALS automatically forces the remaining digits to be locked in the group of cells. This is the equivalent of a strong link, which can be used in chains and loops." (SUDOPEDIA-ALS)

## 触发判定

For an ALS node: in some house H, find N unsolved cells whose combined candidate set has size N+1.

For an **RCC link** between ALS A and ALS B on digit `X`:
1. `X ∈ digits(A) ∩ digits(B)`;
2. A and B share a house W in which the `X`-cells lie;
3. every cell of A containing `X` sees (shares a house with) every cell of B containing `X`;
4. (overlap rule) if A and B overlap, `X` is not present in the overlap region.

If conditions 1–4 hold for two distinct digits, A and B are **doubly linked**.

## 消除/落子规则（全部情形）

### 1. Singly linked ALS-XZ (`als-xz`)

Two ALS A, B share exactly one RCC `X`. Let `Z` be any *other* digit common to both A and B (`Z ≠ X`, `Z` need not be restricted). Because the RCC locks at least one ALS, the digit `Z` is forced to occupy at least one cell across A∪B.

> **Eliminate `Z` from every non-ALS cell that sees all instances of `Z` in both A and B.**

An ALS-XZ is exactly an ALS chain of length 2.

### 2. Doubly linked ALS-XZ (`als-xz-doubly-linked`)

Two ALS A, B share **two** RCCs `X₁, X₂`. One RCC must land in A (locking B), the other in B (locking A); both in one ALS is impossible (it would strip that ALS to N−1 candidates over N cells). This yields three classes of elimination (HODOKU-ALS):

- **RCC eliminations:** each RCC is locked into one ALS, so `X₁` and `X₂` may be removed from all non-ALS cells in the houses providing them.
- **Non-RCC lock (the powerful part):** every *non-RCC* digit becomes locked within its own ALS. For each such digit `d` in ALS A, remove `d` from all cells (outside A) that see every instance of `d` in A — and likewise for B. Each ALS independently behaves as a locked set on its remaining digits. Restrict eliminations to the exact house(s) the digit's instances span (e.g. a digit confined to a box ∩ column eliminates in both).
- **Cannibalistic:** an elimination may fall on a cell of the *other* ALS.

There need not be any separate `Z` digit — the doubly-linked structure alone produces eliminations.

### 3. ALS-XY-Wing (`als-xy-wing`)

Three ALS A, B, C — an ALS chain of length 3: `z– A –x– C –y– B –z`. ALS A shares RCC `X` with C; ALS B shares RCC `Y` with C (`X ≠ Y`); A and B share a common digit `Z`.

> **Eliminate `Z` from all cells that see all instances of `Z` in A and in B.**

Logic (HODOKU-ALS): if `Z ∉` solution-of-A then A must contain `X`, so C (missing `X`) must contain `Y`, so B (missing `Y`) must contain `Z`. Either A or B holds `Z`, so peers of all those `Z` are eliminated. C may itself also contain `Z` — irrelevant to the move.

### 4. Death Blossom (`death-blossom`)

A **stem cell** plus **petals**. Each petal is an ALS that shares an RCC with the stem cell, and there is one petal for **every candidate of the stem cell**. If all petal ALS share a common digit `Z`:

> **Eliminate `Z` from all cells that see all instances of `Z` in every petal.**

Logic: one stem candidate must be true; that locks `Z` into the petal connected by the corresponding RCC. Whichever stem digit wins, some petal is forced to hold `Z`, so `Z` must occur among the petals. (Note: `Z` must be a common digit that is **not** itself an RCC — an RCC common digit cannot be used for the elimination.)

With overlap forbidden it is hard to get a stem with >2 candidates (a 2-candidate stem Death Blossom is just an ALS-XY-Wing); allowing petal overlap yields much richer Death Blossoms (HODOKU-ALS).

### 5. General ALS-XY-Chain (`als-xy-chain`)

A series of ALS `A₁ … Aₖ` connected by RCCs, with the first and last ALS sharing a common digit `Z`. Adjacency rule: **no two adjacent RCCs may be the same digit** (with doubly-linked ALS in the chain the rule is subtler — see *Restricted Common Adjacency Rules*, ENJOYSUDOKU forum t6642).

> **Eliminate `Z` from all cells that see all instances of `Z` in `A₁` and in `Aₖ`.**

Logic (HODOKU-ALS): the chain proves that if `Z` is not in the start ALS it must be in the end ALS (and conversely), so `Z` is forced into one of the two endpoints; their common peers lose `Z`. Written in Nice-Loop notation with each RCC as a weak link between adjacent ALS. Some doubly-linked-ALS chains are **not reversible**, but the deduction still holds.

### Elimination target summary

For every case the target is: a cell **not** required to hold the forced digit, that sees **all** placements of that digit across the relevant ALS endpoints. Never eliminate inside the locking sets except in the explicitly cannibalistic doubly-linked case.

## 退化与边界

- **Bivalue cell** = the minimal ALS (1 cell, 2 candidates); ALS techniques over bivalue cells reduce to ordinary wings/chains.
- **ALS-XZ = ALS chain of length 2.**
- **ALS-XY-Wing = ALS chain of length 3** (`als-xy-chain` with k=3). It is therefore a degenerate special case of the general chain.
- **2-candidate-stem Death Blossom = ALS-XY-Wing** (the stem cell is itself a bivalue ALS).
- **XYZ-Wing / WXYZ-Wing are ALS cases**: SUDOKUWIKI-ALS notes ALS "is strongly related to XYZ-Wings and WXYZ-Wings which are subsets of ALS." A WXYZ-Wing is a singly-linked ALS-XZ where one ALS is a bivalue cell.
- **No-RCC degeneracy**: if two candidate ALS share no RCC, no ALS-XZ exists — but the *hidden* dual (AHS) may still fire (see `ahs.md`).
- **AALS / AAALS** (two/three cells short of locked): the rule generalises (Robert/Ymiros, SUDOKUWIKI-ALS comments) — with an "excess" e = total almost-count, if #restricted = e then unrestricted digits seen in *either* set are eliminable; if #restricted = e−1 then digits seen in *both* sets are eliminable. In practice (Robert's 341-puzzle survey) AAALS adds no eliminations beyond ALS+AALS; out of scope for the core engine but noted for completeness.

## 与其他技巧的关系

- **Naked / Hidden Subsets** (family 03): an ALS is one cell short of a Naked Subset. The hidden dual is the **Almost Hidden Set** (`ahs.md`): N digits in N+1 cells — same logic in the transposed data space; an AHS of size 1–4 digits is the complement of an ALS of 5–8 cells, often cheaper to find.
- **AIC / Nice Loops** (family 08): ALS supply strong-link nodes; "AIC with ALSs" subsumes ALS-XZ, ALS-XY-Wing, and ALS chains as special cases. ALS-XZ Rule 1/2 are special cases of AIC Rule 3 (SUDOKUWIKI-ALS comments, Robert).
- **Wings** (family 06): XY-/XYZ-/W-/WXYZ-Wing are small ALS configurations.
- **Sue de Coq** (family 11/exotic): the doubly-linked ALS-XZ generalises toward Sue de Coq / multi-sector locked sets.
- **Engine note (HoDoKu port)**: HoDoKu implements singly/doubly-linked ALS-XZ, ALS-XY-Wing, ALS Chain, and Death Blossom as distinct strategies sharing one ALS enumerator + RCC table; the chain machinery (`ALS in Chains`) reuses the AIC engine.

## Worked example

**Singly linked ALS-XZ** — source grid (David P Bird, ENJOYSUDOKU-AHS thread; from one of *bennys'* examples — used here for its ALS, the same configuration as the AHS dual in `ahs.md`). 81-char string:

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

- **ALS A** = `{r5c1=17, r6c3=13}` — 2 cells, candidates {1,3,7} (N=2, N+1=3). ✔ ALS.
- **ALS B** = `{r4c7=35, r4c9=45, r5c9=47}` — 3 cells, candidates {3,4,5,7} (N=3, N+1=4). ✔ ALS.
- **RCC X = 7**: the only 7 in A is r5c1, the only 7 in B is r5c9; they share row 5, so every `7` of A sees every `7` of B. ✔ Restricted common.
- **Z = 3**: the only 3 in A is r6c3, the only 3 in B is r4c7.

ALS-XZ deduction: the RCC `7` locks at least one of A, B → `3` must occupy r6c3 or r4c7. Cells seeing **both** r6c3 and r4c7 (and containing 3) are **r4c3** and **r6c7**.

> **Eliminations: r4c3 ≠ 3, r6c7 ≠ 3.**

Verification: r4c3 = {2,3} and r6c7 = {3,5,7}; both contain 3; both see all 3-instances of A and B. Computed directly from the 81-char grid by peer elimination — no constructed candidates. (`ahs.md` shows the identical move as an AHS-XZ, demonstrating the ALS↔AHS duality.)

Additional canonical examples (HODOKU-ALS, image-based, cited for reference):
- **Singly linked ALS-XZ:** A=r1c67 {679}, B=r3c289 {6789}, X=6, Z=7 ⇒ r3c56 ≠ 7.
- **Doubly linked ALS-XZ:** A=r2c239 {2479}, B=r4c23 {124}, X={2,4} ⇒ r1c2≠2, r16c3≠4, and (non-RCC lock) 7,9 removed elsewhere in row 2, 1 removed from box 4 / row 4.
- **ALS-XY-Wing:** A=r7c156 {3678}, B=r579c8 {2389}, C=r9c34 {179}, X,Y=7,9, Z=3 ⇒ r7c7 ≠ 3.
- **Death Blossom:** stem r7c6, petals r8c3456 {23569}, r8c4 {56}, r8c345 {2569} (overlapping), common Z=5 ⇒ r8c2 ≠ 5.

## Soundness

ALS-XZ: the RCC `X` cannot be true in both ALS (all its instances mutually see). So `X` is false in at least one ALS; that ALS, losing `X`, has N candidates over N cells and is a Locked Set, hence every one of its remaining digits (including `Z`) is placed within it. Whichever ALS is locked, `Z` is forced to occupy a cell of A∪B; therefore any cell seeing every `Z` in both ALS cannot itself be `Z`. The argument extends to chains by induction along the RCC links (each RCC passes the "forced to contain the next link digit" obligation forward), and the verity (start-or-end) gives the elimination on the common endpoints' shared peers. Doubly-linked: two RCCs cannot both sit in one ALS (would leave N−1 digits for N cells), so one is in each, locking *both* ALS on their non-RCC digits — yielding the extra internal/cannibalistic eliminations. No uniqueness assumption is used anywhere; every step is a placement/elimination forced by the count N vs N+1. Each of the worked-grid eliminations was verified against the explicit 81-char grid.

## Sources

- **HODOKU-ALS** — Bernhard Hobiger, "HoDoKu: Solving Techniques – ALS", `https://hodoku.sourceforge.net/en/tech_als.php` (GNU FDLv1.3). Primary, authoritative definitions and worked examples for ALS, RCC, overlap, singly/doubly-linked ALS-XZ, ALS-XY-Wing, ALS Chain, Death Blossom.
- **SUDOKUWIKI-ALS** — Andrew Stuart, "Almost Locked Sets", `https://www.sudokuwiki.org/Almost_Locked_Sets`. ALS-XZ Rule 1/2 (doubly-linked / David Bird extension), AALS generalisation discussion, overlap with XYZ-/WXYZ-Wings.
- **SUDOPEDIA-ALS** — Sudopedia Mirror, "Almost Locked Set", `http://sudopedia.enjoysudoku.com/Almost_Locked_Set.html` (GNU FDL 1.2). Definition and the ALS-as-strong-link framing; lists ALS-XZ, ALS-XY-Wing, ALS-XY-Chain, Death Blossom, Almost ALS.
