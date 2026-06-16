# Human Strategy Taxonomy Refactor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:systematic-debugging before proposing fixes, and superpowers:test-driven-development for every implementation change. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing strategy registry and coarse strategy families so default solve traces follow human-learning-friendly technique granularity and ordering, without intentionally adding new solving power.

**Architecture:** Keep planning, archive updates, and reporting work on `orchestration`; keep engine implementation work on `analysis/sonnet46-strategy-fix`. Treat the top-level solver loop as already correct: it sorts by `Strategy.difficulty`, applies the first progressing step, then restarts from the cheapest strategy. This plan focuses on strategy taxonomy, strategy IDs, intra-family splitting, and human-cost ordering.

**Tech Stack:** TypeScript engine under `packages/engine`, Vitest, orchestration scripts in `orchestration/*.mjs`, full-corpus tarball `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`.

---

## Branch and Workspace Rules

- Use `orchestration` for this document, analysis notes, report updates, and full-corpus archive updates.
- Use `analysis/sonnet46-strategy-fix` for implementation changes under `packages/engine`.
- Do not edit engine code from the `orchestration` working tree unless the branch has intentionally been switched or a separate worktree has been created.
- Recommended implementation worktree:

```bash
git worktree add ../sudoku-taxonomy-wt analysis/sonnet46-strategy-fix
```

- Recommended orchestration/reporting worktree: current repository root if it remains on `orchestration`.
- Before editing, always verify:

```bash
git status --short --branch
git worktree list
```

## Current Context and References

- Main remaining-regression plan: `orchestration/analysis/remaining-diabolical-regression-plan.md`.
- Current Phase 3 full-corpus baseline for `analysis-sonnet46-strategy-fix`:

| Difficulty | Solved | Valid solved | Stuck | Errors |
| --- | ---: | ---: | ---: | ---: |
| easy | 100000/100000 | 100000 | 0 | 0 |
| medium | 352643/352643 | 352643 | 0 | 0 |
| hard | 321592/321592 | 321592 | 0 | 0 |
| diabolical | 118954/119681 | 118954 | 727 | 0 |
| total | 893189/893916 | 893189 | 727 | 0 |

- Baseline implementation commit: `analysis/sonnet46-strategy-fix` at `1c18734` (`fix: resolve remaining gemini diabolical ALS paths`).
- Existing solver behavior to preserve: `packages/engine/src/solver.ts` sorts strategies by `difficulty`, applies the first non-empty step, records it, and restarts at the first strategy.
- Existing strategy contract: `packages/engine/src/strategy.ts` says `apply(grid)` should return the first applicable deduction, or `null`, and must not mutate the grid.
- Current strategy registry: `packages/engine/src/strategies/index.ts`.
- Current coarse strategy families requiring review:
  - `packages/engine/src/strategies/als.ts`
  - `packages/engine/src/strategies/aic.ts`
  - `packages/engine/src/strategies/naked-subset.ts`
  - `packages/engine/src/strategies/hidden-subset.ts`
  - `packages/engine/src/strategies/basic-fish.ts`
  - `packages/engine/src/strategies/single-digit-patterns.ts`
  - `packages/engine/src/strategies/uniqueness.ts`
  - `packages/engine/src/strategies/forcing-chain.ts`

## Design Principles

- Order strategies by human recognition and learning cost, not implementation complexity or runtime cost.
- Default tutoring traces should prefer the simplest currently available named technique.
- A strategy step may include multiple eliminations from one concrete pattern instance.
- A strategy step should not combine unrelated instances or different sub-techniques only because they belong to the same broad family.
- Broad family labels such as `als`, `basic-fish`, `single-digit-patterns`, and `uniqueness` are useful in documentation, but trace `strategyId` values should be specific enough for a learner.
- Do not add caching in the first pass. If split strategies create unacceptable runtime overhead later, consider per-solver-iteration analysis caching as a separate task.
- Do not add new logical power in this refactor except where the existing implementation already contains that capability under a coarse strategy.
- Do not add backtracking, template enumeration, unrestricted forcing nets, or puzzle-specific guards.

## Proposed Strategy Registry Shape

The exact numeric values may change during implementation, but the ordering intent should remain:

```ts
fullHouse                 // 4
nakedSingle               // 10
hiddenSingle              // 12

lockedCandidatesPointing  // 20
lockedCandidatesClaiming  // 22

nakedPair                 // 30
hiddenPair                // 32
nakedTriple               // 34
hiddenTriple              // 36
nakedQuad                 // 38
hiddenQuad                // 39

xWing                     // 40
skyscraper                // 44
twoStringKite             // 46
emptyRectangle            // 48
swordfish                 // 50
xyWing                    // 52
xyzWing                   // 54
wWing                     // 56
jellyfish                 // 58

simpleColoring            // 60
xChain                    // 65
aicType1                  // 70
aicType2                  // 72
groupedAic                // 76

alsXz                     // 80
alsXzDoublyLinked         // 82
alsXyWing                 // 85
deathBlossom              // 88

uniqueRectangleType1      // 90
uniqueRectangleType2      // 91
uniqueRectangleType4      // 92
bugPlusOne                // 94
sueDeCoq                  // 96
forcingChain              // 100
```

Notes:

- `xyWing`, `xyzWing`, `wWing`, `simpleColoring`, and `sueDeCoq` are already separate strategy files; only their relative positions may need adjustment.
- `AIC` should be split conservatively. Start with `xChain` versus general `aic`; only split `aicType1`, `aicType2`, and `groupedAic` if the existing helpers support the separation cleanly.
- `forcingChain` can remain a single last-resort strategy in the first pass unless review shows that cell forcing, digit forcing, bounded contradiction, and legacy fallback produce misleading tutoring traces.

## Acceptance Criteria

- No known regression test becomes stuck or unsound.
- Full test suite passes on `analysis/sonnet46-strategy-fix`.
- Full-corpus rerun shows no regression from the Phase 3 baseline:
  - easy solved remains `100000/100000`
  - medium solved remains `352643/352643`
  - hard solved remains `321592/321592`
  - diabolical solved is at least `118954/119681`
  - invalid solved grids remain `0`
  - errors remain `0`
- Default trace strategy IDs are more specific and better aligned with human technique names.
- For the same candidate state, lower human-cost techniques are tried before broader or more advanced variants.
- Related planning/docs are updated so future Phase 4 new-strategy work applies the same taxonomy and ordering principles.

## Non-Goals

- Do not target the remaining 727 diabolical failures directly.
- Do not change the solver loop semantics.
- Do not introduce caching in this task.
- Do not optimize full-corpus runtime as the primary goal.
- Do not preserve old coarse strategy IDs for backward compatibility unless a concrete consumer requires it.

---

## Phase 1: Audit and Taxonomy Lock

**Goal:** Confirm the exact split points and difficulty order before changing implementation code.

**Files:**

- Read: `packages/engine/src/strategies/*.ts` on `analysis/sonnet46-strategy-fix`
- Read: `packages/engine/test/*.test.ts` on `analysis/sonnet46-strategy-fix`
- Update: this document if the final taxonomy changes

- [ ] Step 1: Verify implementation branch and worktree

Run from the implementation worktree:

```bash
git status --short --branch
git log --oneline -5
```

Expected:

- Branch is `analysis/sonnet46-strategy-fix`.
- Recent history includes `1c18734 fix: resolve remaining gemini diabolical ALS paths` or a descendant.

- [ ] Step 2: Audit current strategy IDs and difficulty order

Inspect:

```bash
packages/engine/src/strategies/index.ts
packages/engine/src/strategy.ts
packages/engine/src/solver.ts
```

Record:

- Current `STRATEGIES` order.
- Current `difficulty` values.
- Any strategy whose display name hides multiple human techniques.

- [ ] Step 3: Produce a migration map

Create or update an analysis note on `orchestration`, for example:

```text
orchestration/analysis/human-strategy-taxonomy-migration-map.md
```

Include old-to-new mapping such as:

| Old strategyId | New strategyId(s) | Notes |
| --- | --- | --- |
| `als` | `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, `death-blossom` | Stop cross-family ALS combining. |
| `basic-fish` | `x-wing`, `swordfish`, `jellyfish` | Split by fish size. |
| `single-digit-patterns` | `skyscraper`, `two-string-kite`, `empty-rectangle` | Split by named pattern. |
| `naked-subset` | `naked-pair`, `naked-triple`, `naked-quad` | Ensure pair before triple before quad globally. |
| `hidden-subset` | `hidden-pair`, `hidden-triple`, `hidden-quad` | Ensure pair before triple before quad globally. |
| `uniqueness` | `unique-rectangle-type-1`, `unique-rectangle-type-2`, `unique-rectangle-type-4`, `bug-plus-one` | Split by uniqueness technique. |
| `aic` | `x-chain`, `aic` or finer variants | Split conservatively. |

- [ ] Step 4: Confirm test impact

Search for exact strategy ID expectations:

```bash
rg "strategyId|als|basic-fish|single-digit-patterns|naked-subset|hidden-subset|uniqueness|aic" packages/engine/test
```

Expected:

- Identify tests requiring updates before implementation.
- Avoid deleting regression intent; update expected IDs to more specific names.

## Phase 2: Split Low-Risk Strategy Families

**Goal:** Split families whose current code already searches by clear sub-technique or size.

**Files:**

- Modify: `packages/engine/src/strategies/naked-subset.ts` or split into separate files
- Modify: `packages/engine/src/strategies/hidden-subset.ts` or split into separate files
- Modify: `packages/engine/src/strategies/basic-fish.ts` or split into separate files
- Modify: `packages/engine/src/strategies/single-digit-patterns.ts` or split into separate files
- Modify: `packages/engine/src/strategies/uniqueness.ts` or split into separate files
- Modify: `packages/engine/src/strategies/index.ts`
- Modify: relevant tests under `packages/engine/test/`

- [ ] Step 1: Write or update failing tests for specific strategy IDs

For each split family, add tests that prove the specific sub-technique reports a specific `strategyId`.

Minimum coverage:

- `x-wing`, `swordfish`, `jellyfish`
- `skyscraper`, `two-string-kite`, `empty-rectangle`
- `naked-pair`, `naked-triple`, `naked-quad`
- `hidden-pair`, `hidden-triple`, `hidden-quad`
- `unique-rectangle-type-1`, `unique-rectangle-type-2`, `unique-rectangle-type-4`, `bug-plus-one`

- [ ] Step 2: Run targeted tests and confirm RED where IDs have not yet changed

Run:

```bash
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts packages/engine/test/diabolical-regressions.test.ts
```

Expected:

- Tests that expect new strategy IDs fail before implementation.
- Existing soundness expectations remain meaningful.

- [ ] Step 3: Implement minimal splits

Preferred implementation style:

- Reuse existing helper functions.
- Export one `Strategy` object per human-named technique.
- Keep each `apply()` returning one concrete pattern instance, not all instances of the family.
- Do not add caching.

- [ ] Step 4: Update `STRATEGIES` ordering

Update `packages/engine/src/strategies/index.ts` to use the new strategy objects in human-cost order.

- [ ] Step 5: Run targeted tests and typecheck

Run:

```bash
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts packages/engine/test/diabolical-regressions.test.ts
npm run typecheck
```

Expected:

- Tests pass.
- Typecheck passes.

- [ ] Step 6: Commit low-risk split

Run:

```bash
git status --short
git add packages/engine/src/strategies packages/engine/test
git commit -m "refactor: split strategy taxonomy by human technique"
```

## Phase 3: Split ALS Family

**Goal:** Make ALS-family traces human-readable and stop combining distinct ALS sub-techniques into one `als` step.

**Files:**

- Modify: `packages/engine/src/strategies/als.ts` or split into `als-xz.ts`, `als-xy-wing.ts`, `death-blossom.ts`
- Modify: `packages/engine/src/strategies/index.ts`
- Modify: `packages/engine/test/diabolical-regressions.test.ts`
- Modify: `packages/engine/test/strategies-m3.test.ts`

- [ ] Step 1: Write restored-state tests for each ALS sub-technique currently used by regressions

Use existing #38116 and #77633 restored-state tests as anchors.

Expected:

- Tests identify whether the intended restored-state deduction is `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, or `death-blossom`.
- Tests assert required sound eliminations rather than requiring a historical full trace path.

- [ ] Step 2: Run targeted ALS tests and confirm RED for new IDs

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "38116|77633|ALS"
```

Expected:

- New ID expectations fail until implementation is split.

- [ ] Step 3: Refactor ALS helpers

Implementation requirements:

- Keep shared ALS discovery helpers local or in a small shared module only if needed.
- `als-xz` returns ordinary ALS-XZ deductions from one pattern instance.
- `als-xz-doubly-linked` returns doubly-linked ALS-XZ deductions from one pattern instance.
- `als-xy-wing` returns ALS-XY-Wing deductions from one pattern instance.
- `death-blossom` returns Death Blossom deductions from one pattern instance.
- Do not combine results across ALS sub-techniques.
- Do not combine unrelated ALS instances.

- [ ] Step 4: Register ALS sub-techniques in human-cost order

Update `STRATEGIES` near the advanced section:

```ts
alsXz,
alsXzDoublyLinked,
alsXyWing,
deathBlossom,
```

- [ ] Step 5: Verify targeted ALS regressions

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts -t "38116|77633|ALS"
npm test -- packages/engine/test/diabolical-regressions.test.ts
npm run typecheck
```

Expected:

- #38116 and #77633 remain solved and sound.
- ALS strategy IDs are specific.
- Typecheck passes.

- [ ] Step 6: Commit ALS split

Run:

```bash
git status --short
git add packages/engine/src/strategies packages/engine/test
git commit -m "refactor: split ALS techniques for tutoring traces"
```

## Phase 4: Split AIC Conservatively

**Goal:** Separate easier chain techniques from general AIC without destabilizing existing chain coverage.

**Files:**

- Modify: `packages/engine/src/strategies/aic.ts` or split into `x-chain.ts` plus `aic.ts`
- Possibly modify: `packages/engine/src/chain/aic-search.ts`
- Modify: `packages/engine/src/strategies/index.ts`
- Modify: relevant tests under `packages/engine/test/`

- [ ] Step 1: Identify current AIC sub-paths

Inspect `aic.ts` and classify current returns:

- Single-digit grouped `X-Chain`
- General AIC endpoint Type 1
- General AIC endpoint Type 2
- Peer-endpoint legacy AIC
- Legacy fallback AIC

- [ ] Step 2: Write minimal ID tests for `x-chain`

Add tests that prove a single-digit chain uses `x-chain`, not broad `aic`.

- [ ] Step 3: Split only the low-risk `x-chain` first

Implementation requirements:

- `x-chain` should cover the existing single-digit branch.
- General `aic` should remain as a fallback for broader alternating inference chains.
- Do not split Type 1/Type 2/grouped AIC unless the current result classification is precise enough.

- [ ] Step 4: Re-register chain strategies

Update order:

```ts
xChain,
aic,
```

or finer variants if implemented safely.

- [ ] Step 5: Verify chain tests

Run:

```bash
npm test -- packages/engine/test/strategies-m3.test.ts packages/engine/test/diabolical-regressions.test.ts
npm run typecheck
```

Expected:

- Existing AIC/chain regressions remain sound.
- New `x-chain` ID appears where expected.

- [ ] Step 6: Commit AIC split

Run:

```bash
git status --short
git add packages/engine/src packages/engine/test
git commit -m "refactor: separate x-chain from general AIC"
```

## Phase 5: Full Engine Verification

**Goal:** Confirm taxonomy refactor did not break unit, regression, soundness, or type checks before any corpus run.

**Files:**

- No planned edits unless tests reveal issues.

- [ ] Step 1: Run targeted regression suite

Run:

```bash
npm test -- packages/engine/test/diabolical-regressions.test.ts
```

Expected:

- All diabolical regression tests pass.

- [ ] Step 2: Run strategy tests

Run:

```bash
npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts
```

Expected:

- All strategy tests pass.

- [ ] Step 3: Run full test suite and typecheck

Run:

```bash
npm test
npm run typecheck
git diff --check
```

Expected:

- Full suite passes.
- Typecheck passes.
- No whitespace errors.

## Phase 6: Full-Corpus Regression Gate

**Goal:** Verify the taxonomy refactor has no solved-count, validity, or error regression across the full OpenSudoku corpus.

**Files:**

- Update on `orchestration` only after successful run:
  - `orchestration/run-logs/full-corpus-20260602-064418.tar.gz`
  - relevant `orchestration/analysis/*.md` reports

- [ ] Step 1: Run full corpus from orchestration branch

From the `orchestration` worktree, run the implementation ref:

```bash
node orchestration/run-archive-full-corpus.mjs \
  --ref analysis/sonnet46-strategy-fix \
  --name analysis-sonnet46-strategy-fix \
  --out-dir orchestration/reports/full-corpus/analysis-sonnet46-strategy-taxonomy-rerun \
  --workers 12
```

Expected minimum result:

- easy solved: `100000/100000`
- medium solved: `352643/352643`
- hard solved: `321592/321592`
- diabolical solved: at least `118954/119681`
- invalid solved: `0`
- errors: `0`

- [ ] Step 2: Compare against Phase 3 baseline

Record per-difficulty deltas in a new or existing analysis note.

If any solved count drops, any invalid solved grid appears, or any error appears:

- Stop.
- Do not update archive.
- Trace the first regression using `orchestration/trace-archive-case.mjs`.
- Fix root cause on `analysis/sonnet46-strategy-fix` before rerunning.

- [ ] Step 3: Update full-corpus archive only if the gate passes

Replace only the `analysis-sonnet46-strategy-fix` entry inside:

- `20260602-064418/results.json`
- `20260602-064418/results.partial.json`
- `20260602-064418/summary.md`

Archive path:

```text
orchestration/run-logs/full-corpus-20260602-064418.tar.gz
```

- [ ] Step 4: Verify archive contents

Run:

```bash
tar -xOf orchestration/run-logs/full-corpus-20260602-064418.tar.gz 20260602-064418/results.json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const p=JSON.parse(s); const r=p.results.find(x=>x.name==="analysis-sonnet46-strategy-fix"); console.log(r.report.easy.solved, r.report.medium.solved, r.report.hard.solved, r.report.diabolical.solved, r.report.diabolical.failures.length);})'
```

Expected:

- Printed values match the accepted rerun.

## Phase 7: Documentation Updates for Future Strategy Expansion

**Goal:** Ensure future Phase 4 new-strategy work applies the same human-taxonomy principles instead of adding broad mixed strategy buckets.

**Files:**

- Modify: `orchestration/analysis/remaining-diabolical-regression-plan.md`
- Modify or create: `orchestration/analysis/human-strategy-taxonomy-migration-map.md`
- Optionally modify: any strategy authoring notes under `research/sudoku-human-solving/` if they are used as implementation guidance

- [ ] Step 1: Update remaining diabolical Phase 4 guidance

Add guidance that new strategy expansion must:

- Introduce specific human-named strategy IDs.
- Avoid grouping multiple techniques only because they share a broad family.
- Assign `difficulty` by human recognition cost.
- Prefer one concrete pattern instance per tutoring step.
- Add tests that assert the specific strategy ID and sound deductions.

- [ ] Step 2: Update taxonomy migration note

Record final strategy order and old-to-new mapping after implementation settles.

- [ ] Step 3: Document non-goals for future workers

Explicitly restate:

- Full-corpus performance is secondary to tutoring trace quality.
- Caching is a separate future optimization, not part of taxonomy correctness.
- Backtracking, unrestricted forcing nets, and template enumeration are not acceptable under human-strategy labels.

- [ ] Step 4: Commit orchestration documentation updates

Run from `orchestration`:

```bash
git status --short
git add orchestration/analysis/human-strategy-taxonomy-refactor-plan.md orchestration/analysis/human-strategy-taxonomy-migration-map.md orchestration/analysis/remaining-diabolical-regression-plan.md orchestration/run-logs/full-corpus-20260602-064418.tar.gz
git commit -m "docs: add human strategy taxonomy refactor plan"
```

Only include the full-corpus archive in this commit if Phase 6 passed and the archive was intentionally updated.

## Stop Conditions

- Stop if any full-corpus solved count drops below the Phase 3 baseline.
- Stop if any invalid solved grid appears.
- Stop if any strategy split changes a regression test from solved to stuck.
- Stop after three failed attempts to preserve a split strategy's behavior; reconsider whether that split needs a shared helper or a smaller first step.
- Stop if a proposed split requires caching to be correct. Caching may be useful for performance, but taxonomy correctness must not depend on it.
