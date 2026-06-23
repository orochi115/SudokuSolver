---
id: technique.franken-mutant-fish
name_en: Franken & Mutant Fish
name_zh: 弗兰肯鱼与变异鱼
family: fish
difficulty: extreme
strategyId:
  - franken-swordfish
  - franken-jellyfish
  - mutant-swordfish
  - mutant-jellyfish
sources:
  - SUDOPEDIA-FRANKEN-FISH
  - SUDOPEDIA-MUTANT-FISH
  - SUDOPEDIA-FISH
  - HODOKU-COMPLEX-FISH
---

# Franken & Mutant Fish / 弗兰肯鱼与变异鱼

## One-Sentence Rule

Generalise basic fish by letting boxes join the base or cover sets: a **Franken** fish keeps one orientation pure but mixes boxes into the *other* (or same) side, while a **Mutant** fish lets either side freely mix rows, columns and boxes — the elimination logic (a perfect digit-matching between two equal, overlapping constraint sets) is unchanged.

## 精确模式定义 (Exact pattern definition)

A fish compares two equal-size **constraint sets** of houses for one digit `d`:

- **Defining set** `D` (a.k.a. base set) and **secondary set** `S` (cover set), `|D| = |S| = N`.
- House types: **row, column, box** (in standard Sudoku).
- Selection rules (Sudopedia Fish):
  - Houses may overlap *within* a set, but in the **defining set the overlapping cell must not carry `d`** — each candidate satisfies exactly one defining house.
  - Every defining house overlaps ≥1 secondary house, and vice versa.
  - Every `d`-candidate in the defining set also belongs to a secondary house.
  - Surplus `d`-candidates in the secondary set (in `S` but not `D`) are the eliminations.

Classification by house-type mix:

- **Basic fish**: `D` all rows & `S` all columns, or vice versa.
- **Franken fish**: one or more lines in `D` or `S` is replaced by an equal number of **boxes**, while the rest of that side and the opposite side stay one pure orientation. Allowed configurations (Sudopedia Franken Fish): `N rows vs N cols+boxes`, `N rows+boxes vs N cols`, `N cols vs N rows+boxes`, `N cols+boxes vs N rows`. *One line direction + boxes on a side.*
- **Mutant fish**: **either** the defining set **or** the secondary set contains a *mixture* of rows, columns **and/or** boxes that is not a Franken layout — i.e. a side mixing both line directions (or both sides mixing). "Any type of fish which does not fit the other categories" (Sudopedia Fish).

Fin terms:
- **Exo-fin** (ordinary fin): a base candidate outside the secondary set, in a single box — as in finned basic fish.
- **Endo-fin**: a base candidate that lies in **two defining houses at once** (the overlap cell that *does* carry `d`). Allowed only if treated as a fin. Endo-fins occur only in Franken/Mutant fish (because only there do defining houses overlap on a `d`).

## 触发判定 (Detection predicate)

For size `N ∈ {3,4}` (see boundaries — no Franken/Mutant X-Wing):

1. Enumerate defining sets `D` = N houses drawn from {rows, cols, boxes}, and secondary sets `S` = N houses, per the overlap rules above.
2. Collect `baseCands` = `d`-candidates in `D`. Split into:
   - **endo-fins** = candidates in ≥2 defining houses,
   - **cover-covered** = candidates in some secondary house,
   - **exo-fins** = candidates in no secondary house (must lie in a single box for the fin rule).
3. The fish is valid when, ignoring all fins (endo + exo), every remaining base candidate maps one-to-one into `S` (perfect matching), and all fins together are "seen" by some target cells.
4. Classify `D∪S` into Franken vs Mutant by the house-type mix. Emit smallest/simplest first (basic → finned → Franken → Mutant).

## 消除/落子规则（全部情形）(Elimination rule — all cases)

Eliminations only.

1. **Fin-free Franken/Mutant**: remove `d` from every **surplus** candidate — cells in a secondary house that are **not** in any defining house. (Surplus candidates may belong to more than one secondary house.)
2. **With fins (exo and/or endo)**: a target candidate is eliminable iff it is a surplus cover candidate **AND it sees every fin cell** (all exo-fins and all endo-fins). With fins all in one box this collapses to "surplus cover cells inside the fin box".
3. **Cannibalism**: a candidate that belongs to **two secondary houses** is itself an eliminable surplus candidate, *even though it is also a base/pattern candidate* — it eliminates itself. This "cannibalistic elimination" is a legitimate target unique to box-using fish.

Target sets must be stated precisely: "secondary-set cells not in any defining house" (fin-free) intersected with "sees ALL fins" (finned). Never "relevant cells".

## 退化与边界 (Degeneracy & boundaries)

- **No Franken/Mutant X-Wing (N=2)**: a fish using one box + one line of size 2 is fully covered by **Locked Candidates** (Pointing/Claiming). Sudopedia: "There are no mutant X-Wings"; "a Franken X-Wing degenerates into ... Claiming." So Franken/Mutant start at **N = 3**.
- **Size cap on 9×9**: by complementation, fish of size N ≡ fish of size `9 − N`, so meaningful sizes are 3 (Swordfish) and 4 (Jellyfish); size-5 Squirmbag etc. are mirrors of smaller fish and excluded (same argument as basic fish).
- **Maximum vs minimum patterns**: a Mutant Swordfish maxes at 10 cells (group conjugates on 3 sides) but 4 cells are redundant, giving 5 sub-patterns of 6–10 cells; the minimum is 6 cells (three conjugate pairs). The maximum is by far the rarest (Sudopedia Mutant Fish).
- **Box overlaps**: a defining house and secondary house may overlap; the overlap cell either carries `d` (becomes an endo-fin) or must be empty of `d`.
- **Collapse to simpler fish**: if the box-houses contribute no extra reach, the Franken/Mutant fish reduces to a basic or finned fish — emit the simpler one.

## 与其他技巧的关系 (Relationships)

- **Strictly generalises** basic fish (`fish-base-cover.md`) and finned/sashimi fish (`finned-sashimi.md`); endo-fins generalise exo-fins.
- **Franken/Mutant X-Wing = Locked Candidates** — never emitted as fish.
- **Sashimi Swordfish vs Franken Swordfish**: a sashimi finned fish can sometimes be re-read as a Franken fish by promoting the fin's box into a constraint set (the "box belonged to the pattern" insight, Sudopedia Franken Fish).
- **Kraken fish**: a fish whose fin connects via a chain to an eliminable candidate (an AIC overlay) — a further generalisation, out of scope here.
- **Siamese fish (presentation note)**: when two distinct fish of the same digit share the same base lines but use **different cover sets / different fins** and yield different eliminations, they are presented together as a *Siamese* pair. Siamese is not a new pattern — it is a *display* convention for two co-located fish on one digit; engines should emit each as its own fish step.

## Worked example

### Finned Franken Swordfish (HoDoKu `fff301`, cite `HODOKU-COMPLEX-FISH`)

Givens (81 chars, row-major, '0' = empty):

```
006700091009000062300000000000030004007200010400001000031008075000900000065000030
```

- **Digit**: `8`.
- **Fish notation** (HoDoKu): `8 c34b6 r346 fr5c7` — cover sets columns 3+4+box 6, base sets rows 3+4+6, fin at `r5c7`.
- **Elimination**: `8` removed from `r3c7`.

Verified (2026-06-23, `packages/engine/test/worked-examples.test.ts`): `r3c7<>8` is sound against the brute-force solution.

### Schematic reference (Sudopedia Mutant Fish — pattern geometry only)

Sudopedia "Mutant Fish" also gives a *Finned Mutant Swordfish* schematic (defining row 1 + column 7 + one box; fin at the pattern corner). That page has no 81-char puzzle — use the HoDoKu grid above for regression fixtures.

## Soundness

Treat `d` as a 0/1 assignment. The defining set forces exactly `N` placements of `d` (one per defining house, since within `D` each candidate satisfies a single house and overlaps carrying `d` are the endo-fins). Every non-fin base candidate lies in the secondary set, so those N placements inject into the N secondary houses. Endo-fins and exo-fins are the only base candidates *not* guaranteed inside `S`; treating them as fins yields the disjunction "a fin is true, OR the reduced fish is exact". In the reduced-fish world, the N secondary houses are saturated by the matching, so every surplus secondary candidate is false. A target that additionally sees all fins is also false in the fin-true world. Hence eliminations hold in all worlds. Cannibalistic targets (in two secondary houses) are surplus by the same accounting and self-eliminate validly. The proof is exact; no guessing.

## Sources

- SUDOPEDIA-FRANKEN-FISH — `markdown/sudopedia/franken_fish.md`
- SUDOPEDIA-MUTANT-FISH — `markdown/sudopedia/mutant_fish.md`
- SUDOPEDIA-FISH — `markdown/sudopedia/fish.md`
