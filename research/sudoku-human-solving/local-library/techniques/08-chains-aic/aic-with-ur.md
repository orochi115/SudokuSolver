---
id: technique.aic-with-ur
name_en: AIC with Unique Rectangle Node
name_zh: 含唯一矩形节点的交替推理链
family: chains-aic
difficulty: extreme
strategyId:
  - aic-with-ur
sources:
  - SUDOKUWIKI-AIC-URS
  - SUDOKUWIKI-UNIQUE-RECTANGLES
  - SUDOKUWIKI-AIC
  - CHINESE-JWANGL5-ADVANCED
---

# AIC with Unique Rectangle Node / 含唯一矩形节点的交替推理链

## One-Sentence Rule

An AIC with a UR node is an ordinary AIC / Nice Loop that links through a **Type-1 Unique Rectangle**: four cells in two rows × two columns × two boxes all sharing the same pair `[a,b]`, with **extra candidates only in one corner** — uniqueness forbids the rectangle collapsing to bare `[a,b]`, so turning OFF the extra candidate(s) in that corner forces another corner's extra candidate ON, giving the chain a strong link "across" the deadly-rectangle pattern; the same Rule 1/2/3 outcomes apply.

## 精确模式定义

**单节点 single node.** `digit[cell]`, as in plain AIC.

**Deadly Rectangle / Unique Rectangle (UR) substrate.** Four cells `C1,C2,C3,C4` forming a rectangle that spans exactly **two rows, two columns and two boxes**, all four containing a common pair `[a,b]`. If all four were reduced to just `{a,b}`, the two solutions obtained by swapping a↔b would both be valid — a puzzle with a unique solution cannot allow this ("deadly pattern"). So **at least one** of the four cells must end up holding a digit *other* than a/b.

**UR-as-node (Type 1 form).** The chain-usable case is the **Type 1 UR**: three corners are the bare pair `[a,b]` and the **fourth corner** carries the pair *plus* extra candidates. More generally for chains, two diagonally-opposite corners may carry extra candidates. The UR contributes a strong-link node written with the pattern code `(UR[...])`, e.g. `-9(UR[DF28])` = "the extra digit 9 across the UR on cells D2,F2,D8,F8". Semantics:
- **Entry (weak link IN):** a chain turns ON a digit that removes one corner's extra candidate (say corner C2 loses its extra digit, leaving C2 = `[a,b]`).
- **Strong link OUT:** with that corner reduced to the bare pair, the *deadly pattern* threatens, so **at least one of the remaining extra candidates elsewhere in the rectangle must be ON**. In the simplest two-extra-corner case, "extra-of-C2 OFF ⇒ extra-of-C4 ON" — a strong link the chain rides through. From that forced extra candidate the chain continues.

**Strong link supplied by the UR.** Concretely `¬(extra@one corner) ⇒ (extra@opposite corner)`, justified by "the rectangle may not become the bare deadly pair `[a,b]`".

## 触发判定

1. Build an alternating AIC/loop. At a point where a single cell cannot supply the strong link, look for a Type-1 UR (two rows × two cols × two boxes, common pair `[a,b]`, extra candidates confined appropriately).
2. **Admissibility of the UR node:**
   - the four cells form a genuine 2-box rectangle and share pair `[a,b]`;
   - extra candidates sit so that removing the entering corner's extra digit(s) leaves that corner = `[a,b]`, and the *only* way to avoid the deadly pattern is to keep an extra candidate alive at the exit corner;
   - incoming link is a weak link onto the entry corner's extra candidate; outgoing link is the forced extra candidate at the exit corner.
3. Classify the result exactly as a Nice Loop: continuous (Rule 1), discontinuous-two-strong (Rule 2), discontinuous-two-weak (Rule 3).

## 消除/落子规则（全部情形）

Outcomes are the standard AIC / Nice Loop outcomes (see `aic.md`, `nice-loops.md`); the UR node only changes *how* one strong link is justified.

**Rule 2 — Discontinuity, two strong links → placement.** (The headline case for URs.)
Asserting the discontinuity candidate OFF forces it back ON via the loop, the UR supplying one strong link. **Place the digit** in the discontinuity cell, removing its other candidates.

**Rule 1 — Continuous loop (off-chain elimination).**
On each weak link remove the off-chain candidates of that link's shared unit; the loop simply happens to route through the UR strong link. Sources show two continuous-loop variants over the *same* path with different off-chain removals depending on which corner's extra digit is taken as the entry.

**Rule 3 — Discontinuity, two weak links → elimination.**
Asserting the discontinuity candidate ON forces it OFF → **eliminate** that candidate from the discontinuity cell.

## 退化与边界

- **Not a true 2-box rectangle.** If the four cells do not span exactly two boxes (e.g. all in one band/stack), the uniqueness argument fails — no deadly pattern, no strong link. Invalid.
- **Bare pair already broken.** If some corner already cannot be `[a,b]` (a clue/solved value), the deadly threat is gone and the UR supplies nothing.
- **Uniqueness dependence.** Unlike plain AIC/ALS nodes, the UR node *assumes the puzzle has a unique solution* — it is a **uniqueness technique**. Eliminations are valid only for properly-posed (single-solution) puzzles. Flag accordingly when chaining.
- **Simpler AIC may exist.** The source notes the second example's eliminations are also reachable by ordinary AICs; the UR node is used for illustration. URs as chain links never *create* solutions a uniqueness-aware solver couldn't, but they extend chain reach.
- **Type ≥ 2 URs.** Stuart implements the Type-1 form ("relatively simple… for the basic Type 1 most often found"); higher UR types as chain nodes are possible but out of scope here.
- **Continuity parity.** Continuous loops are even; a single discontinuity gives Rule 2/3.

## 与其他技巧的关系

These EXTEND the AIC engine of `aic.md`: the UR node is one more way to justify a single strong link inside the same alternating walk and Rule 1/2/3 classifier. Stuart: "Anywhere where chains can be used this type of link is valid."

- **Group node** (`grouped-aic.md`) and **ALS node** (`aic-with-als.md`) are sibling exotic-node types; UR nodes use the `(UR[corners])` code, ALS uses `{..}`, groups use `[..|..]`.
- **Unique Rectangles** (standalone Type 1–6) are the parent technique; this card embeds one as a chain link rather than firing it directly.
- **Avoidable Rectangles, Hidden URs, Extended URs, BUG** are related uniqueness patterns that could in principle serve as exotic nodes by the same logic.
- Plain forms: `aic.md` (engine), `nice-loops.md` (loops), `xy-chain.md` (bivalue-only). Credit: David Hollenberg supplied the Y-Wing-chain examples that prompted the implementation.

## Worked example

**Example A — UR node, Rule 2 placement (source grid, SUDOKUWIKI-AIC-URS).**
Grid (From the Start): `010070050004000000600100003009435800020800100008002004050009030300080009000000500`

The four shaded cells **D2,F2,D8,F8** all contain `6/7` plus the two extra candidates `2` and `9` — a deadly-rectangle threat on `[6,7]`. The chain reaches F8 and removes 9 there; this leaves F8 a step closer to the bare pair, so to avoid the deadly pattern **D8 is forced to 2**, and the chain jumps `-9[F8] +2[D8]` straight across the UR and continues to D9.

AIC on 2 ((w.UR) Discontinuous Alternating Nice Loop, length 8):
```
-2[C5]+9[C5]-9[E5]+9[F4]-9(UR[DF28])+2[D8]-2[C8]+2[C5]
```
- Contradiction: when 2 is removed from C5 the chain implies it must be 2 → **place 2 in C5** (remove its other candidate, 9).

**Example B — UR node inside a loop, off-chain eliminations (source grid, SUDOKUWIKI-AIC-URS).** *(FLAG: source gives the path and the deadly-rectangle reasoning but quotes the off-chain removals as diagram-only, not as an explicit chain string; reproduced here as the source presents it.)*
Grid (From the Start): `006050900100263007000800000020000008500000070009310600000030000700981006001700400`

The UR threat is on cells around **D6 / G6**: removing the 9 from D6 "endangers the solution by exposing the unique rectangle," so we can confidently turn **ON the 6 in G6**, which lets the loop close. A second `explore` option runs the *same path* with the dual threat — losing the 6 in G6 forces ON the 9 in D6 — yielding different off-chain eliminations along the loop's weak links.

**Verified — Example A:** `r3c5=2` placement (`worked-examples.test.ts`).

**Verified — Example B** (From the Start):
Grid: `006050900100263007000800000020000008500000070009310600000030000700981006001700400`

UR-threat loop (explore option 3): `r4c6<>9`, `r7c6=6`.

**Verified — Example B explore option 4** (SudokuWiki Load Example `S9B`, restored state):
Dual UR-threat (ON 9 in D6 instead of 6 in G6) weak-link eliminations ⇒ **`r9c5<>5`**, **`r9c6<>6`**.

## Soundness

The new inference is the strong link the UR supplies, valid **given the puzzle has a unique solution**:

Take four cells forming a 2-row × 2-col × 2-box rectangle all containing pair `[a,b]`. If every one of the four held only `{a,b}`, swapping a↔b across the rectangle would map one solution to a second, equally valid solution — contradicting uniqueness. Therefore at least one corner must hold a digit outside `{a,b}` (an "extra" candidate). When the chain's incoming weak link drives the entry corner down to the bare pair `{a,b}`, the burden of avoiding the deadly pattern falls on the surviving extra candidate(s): `(extra@entry OFF) ⇒ (extra@exit ON)` — a genuine strong link **conditional on uniqueness**. Substituting it into the AIC chain preserves every other inference, and the Rule 1/2/3 derivations are identical to plain AIC / Nice Loops (`aic.md`, `nice-loops.md`). Because the deduction relies on the no-deadly-pattern axiom, AIC-with-UR is a **uniqueness technique**: sound for properly-posed puzzles, but it must not be used to *test* whether a grid has a unique solution.

## Sources

- SUDOKUWIKI-AIC-URS — *Using Unique Rectangles as Links in Chains*, sudokuwiki.org/Using_Unique_Rectangles_as_Links_in_Chains (UR-as-link definition, `(UR[...])` notation, Example A grid/chain/placement, Example B dual-threat loop; David Hollenberg credit).
- SUDOKUWIKI-UNIQUE-RECTANGLES — *Unique Rectangles*, sudokuwiki.org/Unique_Rectangles (Type 1 UR substrate, deadly-pattern argument).
- SUDOKUWIKI-AIC — *Alternating Inference Chains*, sudokuwiki.org/Alternating_Inference_Chains (Nice Loop Rules 1/2/3 the outcomes reuse).
- CHINESE-JWANGL5-ADVANCED — Chinese advanced reference (唯一矩形 / 链 terminology).
