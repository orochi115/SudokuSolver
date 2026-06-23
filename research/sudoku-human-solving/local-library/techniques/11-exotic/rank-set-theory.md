---
id: technique.rank-set-theory
name_en: Rank Logic, SET, Phistomefel, and Oddagon Boundary
name_zh: Rank/SET/Phistomefel/Oddagon 理论边界
family: exotic-frameworks
difficulty: extreme
strategyId: null
sources:
  - SUDOKUONE-RANK-LOGIC
  - ENJOYSUDOKU-SET-EXPLANATIONS
  - JORDAN-PHISTOMEFEL
  - ENJOYSUDOKU-BIVALUE-ODDAGON
  - ENJOYSUDOKU-MSLS
---

# Rank Logic, SET, Phistomefel, and Oddagon Boundary / 现代理论边界

## One-Sentence Rule

Rank logic and Set Equivalence Theory are broad set-counting frameworks that can explain many named Sudoku techniques; in this roadmap they are taxonomy and exclusion guidance, not default standalone solver strategies.

## 精确模式定义

- **Rank logic / base-cover logic**: choose base sets (truths) and cover sets (links). `rank = coverCount - baseCount`; rank 0 eliminates non-base candidates in cover sets, rank 1 eliminates candidates at overlaps of two cover sets, and rank `R` requires overlap of `R+1` cover sets.
- **SET (Set Equivalence Theory)**: compare two equal-size combinations of rows/columns/boxes/cells. Their non-overlapping cells must contain equivalent digit multisets, possibly plus or minus full `1..9` sets when the selected unit counts differ.
- **Phistomefel ring**: a classic SET theorem: the 2x2 corner cells contain the same multiset of digits as the ring around the center box.
- **Oddagon / Bivalue Oddagon**: an odd loop of strong/bivalue constraints that would become illegal without guardians; guardians become a virtual truth/strong relation.
- **AALS / AAALS**: almost-almost locked sets and larger "almost" set extensions; useful in general rank logic but high branching and usually absorbed by ALS/AIC/MSLS in this roadmap.

## 触发判定

This card intentionally does not define one default detector. A direct detector would require searching large combinations of units, cover sets, or dark/illegal substructures and would behave like a meta-solver.

If implementation is ever requested, it must be split into named bounded subproblems:

- `msls`: already has a dedicated card; search balanced multi-sector locked sets.
- `sk-loop`: already has a dedicated card; search the known domino-loop special case.
- `broken-wing`: already has a dedicated card; search single-digit odd loops with guardians.
- `tridagon`: already has a dedicated card; search the three-digit oddagon/deadly-loop special case.
- `set-equivalence`: only after a separate design, with explicit bounds on unit combinations and restored-state examples.

## 消除/落子规则（全部情形）

This is a boundary card, so it records framework rules rather than an implementation contract:

- Rank 0: any non-base candidate in a cover set can be removed.
- Rank 1: any non-base candidate in the intersection of two cover sets can be removed.
- Rank `R`: any non-base candidate in the intersection of `R+1` cover sets can be removed.
- SET: if the non-overlap cells of two selected unit combinations must contain the same digit multiset, candidates inconsistent with that multiset equivalence can be removed.
- Oddagon/dark logic: if removing guardians would expose an impossible odd loop or deadly structure, at least one guardian is true; that guardian set can act as a virtual truth in a subsequent chain/set proof.

## 退化与边界

- **Meta-framework, not a named human step**: SET/rank logic can explain fish, chains, MSLS, SK-Loop, Phistomefel, and some uniqueness/dark-logic moves. Do not add a generic `rank-logic` trace step without a narrower presentation name.
- **Search explosion**: unconstrained base/cover or SET search approaches template/tabling territory; bound it or exclude it.
- **Classic 9x9 only**: SET is popular in variants, but variant-only deductions remain outside this roadmap.
- **AALS/AAALS**: noted for completeness; keep out of the default engine until ALS/AIC/MSLS coverage is exhausted and a concrete corpus need appears.

## 与其他技巧的关系

- **MSLS**: practical rank-0/multi-sector realization; keep as the implementable representative.
- **SK-Loop**: a named MSLS/rank-0 special case.
- **Phistomefel**: a SET theorem; often explains SK/MSLS-style eliminations but is not by itself a candidate-level detector.
- **Broken Wing / Guardians / Oddagon**: odd-loop/dark-logic family; existing `broken-wing.md` and `tridagon.md` cover implementable named cases.
- **Constraint Subsets**: similar meta-level umbrella; keep excluded as a framework rather than a step.

## Worked example

### SET / Phistomefel exemplar

Jordan Eldredge summarizes the Phistomefel ring theorem: the four 2x2 corner blocks of any regular 9x9 Sudoku grid contain exactly the same digit multiset as the ring around box 5. This is a theorem-level example, not a restored-state elimination.

### Bivalue Oddagon exemplar

EnjoySudoku's bivalue oddagon thread gives a concrete candidate-state example: if both `r6c3(5)` and `r9c3(5)` are removed, the marked `#` cells become a five-cell bivalue odd loop on digits `{2,9}`, an illegal/deadly loop. Therefore `r6c3(5)` and `r9c3(5)` form a strong relation, allowing `r2c3<>5` and then `r2c3=1` in that example.

FLAG: these examples are framework examples, not implementation fixtures. They need reconstruction into 81-char restored states before being used as tests.

## Soundness

Rank/SET soundness follows from exact-cover counting: every selected row/column/box/cell truth must contain a fixed number of true candidates, and cover sets constrain where those truths can appear. If the number of required truths equals or exceeds the cover capacity in a way that forces overlap, candidates outside the base that occupy required cover positions contradict the count. Oddagon soundness follows from illegality: an odd loop of mutually alternating bivalue/strong constraints cannot be satisfied; therefore at least one guardian preventing that loop must be true. Uniqueness-based dark logic must explicitly declare the uniqueness assumption; pure odd-loop broken-wing logic does not.

## Sources

SUDOKUONE-RANK-LOGIC (rank/base-cover definitions and dark logic); ENJOYSUDOKU-SET-EXPLANATIONS (forum discussion of SET as a broad property, MSLS overlap, and programmability concerns); JORDAN-PHISTOMEFEL (plain-language Phistomefel theorem summary); ENJOYSUDOKU-BIVALUE-ODDAGON (bivalue oddagon examples); ENJOYSUDOKU-MSLS (MSLS/rank-0 practical representative).
