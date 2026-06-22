# hodoku-logic — HoDoKu pure-logic solver, used as an oracle for the diabolical-727 effort

A standalone, **headless, brute-force-free** command-line driver around
[HoDoKu](https://sourceforge.net/projects/hodoku/)'s logical solver. It runs the
**727 currently-stuck diabolical puzzles** (`data/failing-diabolical/puzzles.txt`)
through HoDoKu's 70+ human-style techniques and reports, per puzzle, whether they
are solvable by pure logic, with what technique sequence, and at what difficulty.

This feeds method-skeleton step #1 of [`docs/plans/diabolical-727.md`](../../docs/plans/diabolical-727.md):
*cluster the 727 by "first missing technique family"* and pick the highest-yield
family to implement next in the TS engine.

> **It does NOT touch the SudokuSolver TS engine** (`packages/engine/`). It is a
> research probe only. No algorithm is ported here; whether to port any technique
> is a separate Roadmap ② decision.

## What "brute-force-free" means here

HoDoKu's `SudokuSolver.solve()` is a hint/apply loop over `Options.solverSteps`
(a `StepConfig[]`); `getHint` skips any step whose `isEnabled()==false`. The driver
disables the non-logical steps so the loop simply terminates ("stuck") when no human
technique applies — the backtracking engine in `generator/SudokuGenerator.java` and
the template solver are never invoked.

- **Always disabled:** `BRUTE_FORCE`, `TEMPLATE_SET`, `TEMPLATE_DEL`, `GIVE_UP`,
  `INCOMPLETE` (+ `setCheckTemplates(false)`).
- **`--strict` additionally disables:** `FORCING_NET`, `FORCING_NET_CONTRADICTION`,
  `FORCING_NET_VERITY`. Roadmap ②'s red line forbids "无约束 forcing nets" as
  non-human, while it does allow plain forcing chains. `--strict` answers *"how many
  survive on the technique set the project actually allows?"* — the more relevant census.

The driver also hard-asserts that no disabled step type ever appears in a solution
trace (it exits with code 3 if one leaks in), proving zero backtracking was used.

## Build & run

Requires a JDK (tested on Temurin 21).

```bash
./build.sh                 # javac the whole copied tree -> out/  (~589 classes)
./run.sh                   # full-logic census of the 727 -> results/
./run.sh ../../data/failing-diabolical/puzzles.txt results-strict --strict   # strict census
./run.sh /tmp/five.txt /tmp/out --verbose   # print each puzzle's step sequence
```

`run.sh` args: `[puzzles.txt] [out-dir] [--verbose] [--strict]`. Input is one
81-char puzzle per line (`0` or `.` = empty); `#` lines and blanks are ignored.

### Outputs (in the out-dir)
- `hodoku-727.tsv` — `idx  status(solved|stuck|INVALID)  level  score  techniques(name*count,…)`
- `hodoku-727-summary.md` — census counts, technique histogram (over solved
  puzzles), and the **first-missing-family** buckets (clustering signal for ②).
- `stuck-finals.txt` — the 81-char partial board for every puzzle HoDoKu could not solve.

## Layout

```
research/hodoku-logic/
  src/        # verbatim copy of HoDoKu/src (GPLv3) + src/sudoku/LogicalBatchSolver.java (our driver)
  COPYING     # GPLv3 (from HoDoKu)
  build.sh run.sh
  results/    # committed experiment outputs
```

## Provenance & license

Source copied from a local clone of HoDoKu (`github.com/PseudoFish/Hodoku`),
**GPLv3** (see `COPYING`; every upstream file keeps its GPL header). The only
non-upstream file is `src/sudoku/LogicalBatchSolver.java` (our driver), likewise
GPLv3 as a derivative work. HoDoKu runs as a **separate Java process** and is not
linked into the TS engine.

### Local modifications to upstream sources
- `src/sudoku/LogicalBatchSolver.java` — **new** driver (the only added file).
- 9 lines across `AllStepsPanel.java`, `Config{Solver,FindAllSteps,Progress,Trainig}Panel.java`,
  `CheckNode.java`: inserted a raw `(Enumeration)` intermediate cast to compile under
  JDK 9+ (`TreeNode.children()`/`elements()` now return `Enumeration<TreeNode>`).
  These are GUI files, never executed by the headless driver — a pure compile fix.

## Notes / caveats
- HoDoKu's uniqueness techniques (UR/BUG) assume a unique solution but do **not**
  read the true-solution array, so no oracle/brute-force is consulted — consistent
  with the engine's existing UR/BUG+1.
- Difficulty levels are HoDoKu's (Leicht/Mittel/Knifflig/Schwer/Extrem →
  easy/medium/hard/unfair/extreme); `score` is HoDoKu's additive technique score.
