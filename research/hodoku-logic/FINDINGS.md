# Findings — HoDoKu pure-logic census of the 727 diabolical puzzles

Run date: 2026-06-22. Solver: HoDoKu (GPLv3) logical engine, **no brute force /
templates / give-up** (zero backtracking; the driver hard-asserts no disabled step
type ever appears). Input: `data/failing-diabolical/puzzles.txt` (727 puzzles the
TS engine currently leaves `stuck`). Raw per-puzzle data in
[`results/`](results/) (full logic) and [`results-strict/`](results-strict/) (no forcing nets).

## Headline

| mode | solved | stuck | invalid |
|---|---|---|---|
| **Full HoDoKu logic** (incl. forcing chains **and** forcing nets) | **727 / 727 (100%)** | 0 | 0 |
| **Strict** (forcing **nets** disabled; forcing chains kept) | **424 / 727 (58.3%)** | 303 (41.7%) | 0 |

- **Every** one of the 727 is solvable by HoDoKu with pure logic and no guessing.
- `invalid = 0` across all 727 solved boards (each passes an independent
  row/col/box check) → the no-brute-force claim holds; nothing leaked through.
- Dropping forcing **nets** alone costs 303 puzzles → roughly **40% of the 727
  genuinely need net-strength logic**, which Roadmap ②'s red line classifies as
  non-human ("无约束 forcing nets").

## Clustering signal: first technique HoDoKu used that the TS engine lacks

Per puzzle, the earliest step whose technique is not in the engine's current set
(see `engineHas()` in the driver). Because the engine is `stuck` on all 727, every
puzzle is expected to surface ≥1 gap — and it does (≈727 rows, ~0 solvable with
only existing techniques). Grouped by family (full-logic run):

| family | puzzles | engine status |
|---|---|---|
| **Chains / Nice Loops** — Discontinuous 220, Grouped-Discontinuous 141, Grouped-AIC 5, Continuous 7+2, XY-Chain 4, Remote Pair 1 | **~380** | engine has `AIC`+`X-Chain` but its chain search misses these (no **group nodes**, no **discontinuous-nice-loop** rule) |
| **Finned / Sashimi / Franken fish** — Finned Swordfish 84, Finned X-Wing 75, Sashimi X-Wing 7, Finned Franken Swordfish 6, Finned Jellyfish 4, Sashimi Swordfish 3 | **~179** | engine has plain X-Wing/Swordfish/Jellyfish only |
| **Hidden Rectangle** | **65** | engine has UR 1/2/4 but not Hidden Rectangle |
| **Forcing Nets** (Verity 37 + Contradiction 15) | **52** | **red-lined** — the genuinely hardest tail |
| **Turbot Fish** | **34** | partially covered (engine has skyscraper / 2-string-kite / empty-rectangle, which are turbot subtypes) |
| ALS-XY-Chain 9, Multi-Colors 4, UR3 2, misc | ~16 | mostly absent |

## What this means for Roadmap ② (`docs/plans/diabolical-727.md`)

1. **Highest-yield lever by far is the chain engine, not a brand-new strategy.**
   ~380 puzzles' first gap is a (grouped) Discontinuous Nice Loop. The engine
   already has `AIC`/`X-Chain`, so the win is *strengthening* the existing chain
   search: add **group nodes** and the **discontinuous-nice-loop deduction**
   (an AIC whose endpoints coincide, forcing a placement/elimination). This single
   area unblocks the largest cluster.
2. **Finned/Sashimi fish (~179)** is the next coherent family — a contained
   extension of the existing fish strategies (cover set + fin cells).
3. **Hidden Rectangle (65)** is a small, well-scoped uniqueness addition.
4. **~52 puzzles need forcing nets.** Under the project's "no forcing nets" red
   line these are the hardest tail; they may stay `stuck` unless an *allowed*
   technique (longer AIC / ALS chain) happens to crack the same board. Decide
   explicitly whether ≤~7% residual is acceptable, or whether the red line needs
   revisiting for this corpus. (Strict mode already shows 303 stuck without nets,
   but many of those 303 are blocked first on chains/fish above, not nets — so
   implementing #1–#3 will reclaim a large share before nets ever matter.)

### Caveats
- "First-missing family" is HoDoKu's *technique ordering*, not a proof the engine
  can't reach the same board another way — but since the engine is `stuck` on all
  727, each genuinely needs something beyond its current set.
- Families use HoDoKu's taxonomy/naming. Map to the engine's own technique IDs
  (Roadmap ① taxonomy) before implementing; e.g. "Discontinuous Nice Loop" is an
  AIC-family deduction, not necessarily a separate strategy object.
- The 52 net-dependent puzzles are an upper bound on "needs nets": a stronger
  *allowed* chain/ALS search might still solve some of them.

## Reproduce

```bash
cd research/hodoku-logic
./build.sh
./run.sh ../../data/failing-diabolical/puzzles.txt results            # full logic
./run.sh ../../data/failing-diabolical/puzzles.txt results-strict --strict
```
