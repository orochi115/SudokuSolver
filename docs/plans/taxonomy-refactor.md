# 人类策略 Taxonomy 重构计划（Roadmap ①）

> **For agentic workers:** REQUIRED SUB-SKILL: use systematic-debugging before proposing fixes, and test-driven-development for every implementation change. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing strategy registry and coarse strategy families so default solve traces follow human-learning-friendly technique granularity and ordering, **without intentionally adding new solving power**.

**Scope:** This is forward engineering on `master` (the current engine under `packages/engine`). The top-level solver loop is already correct — it sorts by `Strategy.difficulty`, applies the first progressing step, then restarts from the cheapest strategy. This plan focuses on strategy taxonomy, strategy IDs, intra-family splitting, and human-cost ordering. It does **not** target the remaining 727 diabolical failures (that is Roadmap ②, see [`diabolical-727.md`](./diabolical-727.md)).

**Tech stack & verification:** TypeScript engine under `packages/engine`, Vitest. Fast soundness/regression via `npm test`; full-corpus regression via `npm run corpus:run`.

**Workspace:** Implement on `master` or a short-lived feature branch off it. Before editing, sanity-check with `git status --short --branch`.

---

## Current Context

- **Current engine full-corpus baseline** (must not regress):

| Difficulty | Solved | Valid solved | Stuck | Errors |
| --- | ---: | ---: | ---: | ---: |
| easy | 100000/100000 | 100000 | 0 | 0 |
| medium | 352643/352643 | 352643 | 0 | 0 |
| hard | 321592/321592 | 321592 | 0 | 0 |
| diabolical | 118954/119681 | 118954 | 727 | 0 |
| total | 893189/893916 | 893189 | 727 | 0 |

The 727 stuck diabolical puzzles are captured in [`../../data/failing-diabolical/`](../../data/failing-diabolical/); this refactor adds no solving power, so that set should be **unchanged** afterward.

- Solver behavior to preserve: `packages/engine/src/solver.ts` sorts strategies by `difficulty`, applies the first non-empty step, records it, and restarts at the first strategy.
- Strategy contract: `packages/engine/src/strategy.ts` — `apply(grid)` returns the first applicable deduction or `null`, and must not mutate the grid.
- Strategy registry: `packages/engine/src/strategies/index.ts`.
- Coarse strategy families requiring review: `als.ts`, `aic.ts`, `naked-subset.ts`, `hidden-subset.ts`, `basic-fish.ts`, `single-digit-patterns.ts`, `uniqueness.ts`, `forcing-chain.ts`.

## Design Principles

- Order strategies by human recognition and learning cost, not implementation complexity or runtime cost.
- Default tutoring traces should prefer the simplest currently available named technique.
- A strategy step may include multiple eliminations from one concrete pattern instance.
- A strategy step should not combine unrelated instances or different sub-techniques only because they belong to the same broad family.
- **Scope of de-merging (priority order, not a blanket allowance):** First priority is removing cross-*technique* merging (e.g. ALS-XZ and Death Blossom collapsed into one `als` step via `combineSteps`). The default target remains **one trace step = one concrete pattern instance.** Cross-*instance* merging within a single technique — e.g. `locked-candidates.ts` `combineSteps(pointingSteps)` collapsing every board-wide pointing pattern into one step — is itself a tutoring-granularity problem, **not** an accepted behavior. It may be **deferred** to keep this pass bounded, but is not blessed: every place that still merges instances must be flagged as an explicit, documented exception, and reducing it to single-instance steps stays the goal.
- Broad family labels (`als`, `basic-fish`, `single-digit-patterns`, `uniqueness`) are useful in docs, but trace `strategyId` values should be specific enough for a learner.
- Do not add caching in the first pass. If split strategies create unacceptable runtime overhead later, consider per-solver-iteration analysis caching as a separate task.
- Do not add new logical power except where the existing implementation already contains that capability under a coarse strategy.
- Do not add backtracking, template enumeration, unrestricted forcing nets, or puzzle-specific guards.

## Proposed Strategy Registry Shape

Exact numeric `difficulty` values may change during implementation; the ordering intent should remain:

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

bugPlusOne                // 90   // uniqueness cluster (assumption-free default = late)
uniqueRectangleType1      // 91
uniqueRectangleType2      // 92
uniqueRectangleType4      // 93
sueDeCoq                  // 96
forcingChain              // 100
```

Notes:

- `xyWing`, `xyzWing`, `wWing`, `simpleColoring`, `sueDeCoq` are already separate files; only their relative positions may need adjustment.
- **Uniqueness ordering is a solver-temperament choice, kept as two profiles (open decision — placement not yet locked).** Uniqueness techniques rely on the unique-solution assumption, a different *kind* of inference from assumption-free fish/wings, so position is a style choice rather than a pure recognition-cost ranking:
  - **Default profile = assumption-free.** Uniqueness sits late (~90+), so default traces prefer assumption-free deductions.
  - **Optional "uniqueness-aware" profile.** Pulls easy `bugPlusOne` / `uniqueRectangleType1` early (~41/43) for solvers who accept the uniqueness premise; harder UR types stay mid-to-late.
  - This refactor implements only the **id split** and the assumption-free default placement. The selectable profile/mode is a **future task** — do NOT build a toggle here (out of scope; would add behavior). Record both profiles; lock neither numeric ordering as final.
- **`aicType1` / `aicType2` / `groupedAic` are a target shape, not Phase 4 scope.** Phase 4 commits only to splitting `xChain` from a general `aic`. The finer split happens only if existing helpers support it cleanly; until then those three rows collapse to a single `aic` around difficulty 70.
- `forcingChain` can remain a single last-resort strategy in the first pass unless review shows cell/digit/bounded-contradiction/legacy forcing produce misleading tutoring traces.

## Acceptance Criteria

- No known regression test becomes stuck or unsound.
- Full test suite passes (`npm test`, `npm run typecheck`).
- Full-corpus rerun (`npm run corpus:run`) shows **no regression** from the baseline above: easy `100000/100000`, medium `352643/352643`, hard `321592/321592`, diabolical ≥ `118954/119681`, invalid solved `0`, errors `0`. (The 727-stuck set should be identical.)
- Default trace strategy IDs are more specific and better aligned with human technique names.
- For the same candidate state, lower human-cost techniques are tried before broader/advanced variants.
- The Roadmap ② plan ([`diabolical-727.md`](./diabolical-727.md)) is updated so future new-strategy work applies the same taxonomy/ordering principles.

## Non-Goals

- Do not target the 727 diabolical failures directly (Roadmap ②).
- Do not change the solver loop semantics.
- Do not introduce caching in this task.
- Do not optimize full-corpus runtime as the primary goal.
- Do not preserve old coarse strategy IDs for backward compatibility unless a concrete consumer requires it.

---

## Phase 1: Audit and Taxonomy Lock

**Goal:** Confirm the exact split points and difficulty order before changing implementation code.

- [x] Step 1: Confirm the engine baseline. `git status --short --branch`; `npm test` green; record the full-corpus baseline (above) so deltas are measurable.
- [x] Step 2: Audit current strategy IDs and difficulty order. Inspect `strategies/index.ts`, `strategy.ts`, `solver.ts`. Record current `STRATEGIES` order, `difficulty` values, and any strategy whose display name hides multiple human techniques.
- [x] Step 3: Produce a migration map (record it in this doc, or a `docs/plans/taxonomy-migration-map.md`). Old→new mapping such as:

| Old strategyId | New strategyId(s) | Notes |
| --- | --- | --- |
| `locked-candidates` | `locked-candidates-pointing`, `locked-candidates-claiming` | Split by named sub-technique. |
| `als` | `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, `death-blossom` | Stop cross-family ALS combining. |
| `basic-fish` | `x-wing`, `swordfish`, `jellyfish` | Split by fish size. |
| `single-digit-patterns` | `skyscraper`, `two-string-kite`, `empty-rectangle` | Split by named pattern. |
| `naked-subset` | `naked-pair`, `naked-triple`, `naked-quad` | Pair before triple before quad globally. |
| `hidden-subset` | `hidden-pair`, `hidden-triple`, `hidden-quad` | Pair before triple before quad globally. |
| `uniqueness` | `bug-plus-one`, `unique-rectangle-type-1/2/4` | Id split settled. **Difficulty placement is an OPEN decision:** default = assumption-free (late, ~90+); optional uniqueness-aware profile pulls BUG+1/UR-1 early. Record both; fossilize neither. |
| `aic` | `x-chain`, `aic` (or finer) | Split conservatively. |

- [x] Step 4: Confirm test impact. `rg "strategyId|als|basic-fish|single-digit-patterns|naked-subset|hidden-subset|uniqueness|aic" packages/engine/test`. Identify tests needing updated expected IDs; don't delete regression intent.

Phase 1 audit output is recorded in [`taxonomy-migration-map.md`](./taxonomy-migration-map.md).

## Phase 2: Split Low-Risk Strategy Families

**Goal:** Split families whose code already searches by clear sub-technique or size.

**Risk note:** `locked-candidates`, `naked-subset`, `hidden-subset`, `basic-fish`, `single-digit-patterns` are low-risk (clear internal boundary, own `Step`). `uniqueness` is **medium-risk**: `tryURType1/2/4` and `tryBUGPlus1` are separate helpers but all currently return `strategyId: 'uniqueness'` with no discriminator, and BUG+1 is a placement pattern unlike elimination-based URs — the split must add a per-technique id, not just relocate code. Do the five mechanical families first, then `uniqueness`.

- [x] Step 1: Write/extend failing tests asserting each split sub-technique reports its specific `strategyId` (coverage: pointing/claiming; x-wing/swordfish/jellyfish; skyscraper/two-string-kite/empty-rectangle; naked & hidden pair/triple/quad; UR type-1/2/4 + bug-plus-one).
- [x] Step 2: Run targeted tests, confirm RED where IDs not yet changed:
  `npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts packages/engine/test/diabolical-regressions.test.ts`
- [x] Step 3: Implement minimal splits — reuse existing helpers; export one `Strategy` per human-named technique; each `apply()` returns one concrete pattern instance; no caching.
- [x] Step 4: Update `strategies/index.ts` ordering to human-cost order.
- [x] Step 5: Re-run targeted tests + `npm run typecheck`.
- [x] Step 6: Commit (`refactor: split strategy taxonomy by human technique`).

Progress note (2026-06-18): Phase 2A completed for `locked-candidates` only. The implementation now exports and registers `locked-candidates-pointing` (difficulty 20) and `locked-candidates-claiming` (difficulty 22), with RED/GREEN tests for both IDs. Same-technique board-wide combining is intentionally preserved as the existing documented deferred exception; the remaining Phase 2 families are still pending.

Progress note (2026-06-18): Phase 2B completed for the low-risk mechanical families `naked-subset`, `hidden-subset`, `basic-fish`, and `single-digit-patterns`. The implementation now exports/registers `naked-pair`, `hidden-pair`, `naked-triple`, `hidden-triple`, `naked-quad`, `hidden-quad`, `x-wing`, `skyscraper`, `two-string-kite`, `empty-rectangle`, `swordfish`, and `jellyfish` in the intended human-cost order, with RED/GREEN tests asserting specific IDs. `uniqueness` remains pending as the remaining Phase 2 medium-risk family.

Progress note (2026-06-18): Phase 2C completed for `uniqueness`. The implementation now exports/registers `bug-plus-one`, `unique-rectangle-type-1`, `unique-rectangle-type-2`, and `unique-rectangle-type-4` in the assumption-free late default order (90-93), with RED/GREEN tests asserting each specific ID. Existing helper logic was reused without adding solving power.

## Phase 3: Split ALS Family

**Goal:** Make ALS traces human-readable; stop combining distinct ALS sub-techniques into one `als` step.

- [x] Step 1: Write restored-state tests per ALS sub-technique used by regressions, anchored on the existing #38116 / #77633 tests.
  **Critical precondition:** `als.apply()` currently merges sub-technique results via `combineSteps()` (dedup by `cell:digit`). #38116 asserts one step with both `{cell:53,d:3}` and `{cell:9,d:4}`; #77633 asserts 9 eliminations. Before splitting, map each **test-asserted** elimination to the specific sub-technique (`als-xz` / `als-xz-doubly-linked` / `als-xy-wing` / `death-blossom`) that produces it. If a regression's asserted eliminations span multiple sub-techniques, re-anchor (split) the assertion. Contract after splitting: **full-puzzle still solved + trace sound + the specific protected deductions still produced (re-anchored to their sub-technique)** — not that the whole incidental old batch be reproduced as one unit.
- [x] Step 2: Run `npm test -- packages/engine/test/diabolical-regressions.test.ts -t "38116|77633|ALS"`; confirm RED for new IDs.
- [x] Step 3: Refactor ALS helpers — `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, `death-blossom` each return deductions from one pattern instance; do not combine across sub-techniques or unrelated instances.
- [x] Step 4: Register `alsXz, alsXzDoublyLinked, alsXyWing, deathBlossom` in human-cost order.
- [x] Step 5: Verify (`-t "38116|77633|ALS"`, then full regression file, `npm run typecheck`); #38116/#77633 remain solved+sound.
- [x] Step 6: Commit (`refactor: split ALS techniques for tutoring traces`).

Progress note (2026-06-18): Phase 3 completed. `als` is no longer registered as a broad default strategy; `als-xz`, `als-xz-doubly-linked`, `als-xy-wing`, and `death-blossom` are exported/registered separately at difficulties 80/82/85/88. The old #38116/#77633 combined ALS assertions were re-anchored to specific sub-techniques, and ALS helpers now return one found pattern instance rather than combining across ALS sub-techniques or unrelated instances.

## Phase 4: Split AIC Conservatively

**Goal:** Separate easier chain techniques from general AIC without destabilizing chain coverage.

- [x] Step 1: Classify current `aic.ts` returns (single-digit grouped X-Chain / AIC endpoint Type 1 / Type 2 / peer-endpoint legacy / legacy fallback). Possibly inspect `chain/aic-search.ts`.
- [x] Step 2: Add minimal ID tests proving a single-digit chain uses `x-chain`, not broad `aic`.
- [x] Step 3: Split only the low-risk `x-chain` first; keep general `aic` as fallback. Do not split Type1/2/grouped unless classification is precise enough.
- [x] Step 4: Re-register `xChain, aic` (or finer variants if safe).
- [x] Step 5: Verify (`strategies-m3.test.ts`, `diabolical-regressions.test.ts`, `npm run typecheck`).
- [x] Step 6: Commit (`refactor: separate x-chain from general AIC`).

Progress note (2026-06-18): Phase 4 conservative split completed for `x-chain` only. The existing single-digit grouped AIC/X-Chain search is now exported and registered as `x-chain` at difficulty 65 before broad `aic` at difficulty 70. The broad `aic` strategy remains as the peer-endpoint/general grouped/legacy fallback; Type 1/Type 2/grouped AIC were intentionally not split in this pass.

## Phase 5: Full Engine Verification

- [x] Step 1: `npm test -- packages/engine/test/diabolical-regressions.test.ts` (all pass).
- [x] Step 2: `npm test -- packages/engine/test/strategies.test.ts packages/engine/test/strategies-m3.test.ts` (all pass).
- [x] Step 3: `npm test`, `npm run typecheck`, `git diff --check` (full suite + types pass, no whitespace errors).

Progress note (2026-06-18): Phase 5 completed. Targeted diabolical regressions, targeted strategy taxonomy tests, the full Vitest suite, TypeScript typecheck, and `git diff --check` all passed on the post-Phase-4 working tree.

## Phase 6: Full-Corpus Regression Gate

**Goal:** Verify no solved-count / validity / error regression across the full OpenSudoku corpus.

- [x] Step 1: Run the full corpus on the current working tree:

```bash
npm run corpus:run -- --out /tmp/taxonomy-rerun.json --workers 12
```

Expected minimum: easy `100000/100000`, medium `352643/352643`, hard `321592/321592`, diabolical ≥ `118954/119681`, invalid `0`, errors `0`.

- [x] Step 2: Compare against the baseline. If any solved count drops, any invalid appears, or any error appears: **STOP.** Reproduce the first regressing puzzle directly with the engine, add a failing case to `packages/engine/test/diabolical-regressions.test.ts`, fix the root cause, rerun.
- [x] Step 3: Confirm the stuck set is unchanged — regenerate `data/failing-diabolical/` per its README and expect **no diff** (this refactor adds no solving power). If it changed, investigate before proceeding.

Progress note (2026-06-19): Phase 6 completed on the current working tree. `npm run corpus:run -- --out /tmp/taxonomy-rerun.json --workers 12` matched the baseline exactly: easy `100000/100000`, medium `352643/352643`, hard `321592/321592`, diabolical `118954/119681`, invalid solved `0`, errors `0`. The diabolical failure set from `/tmp/taxonomy-rerun.json` contains 727 puzzles and matches `data/failing-diabolical/puzzles.txt` exactly (`missing=0`, `added=0`).

## Phase 7: Documentation Updates for Future Strategy Expansion

**Goal:** Ensure Roadmap ② new-strategy work applies the same human-taxonomy principles.

- [x] Step 1: Update [`diabolical-727.md`](./diabolical-727.md): new strategies must use specific human-named IDs, avoid grouping techniques by broad family, assign `difficulty` by human recognition cost, prefer one concrete pattern instance per step, and add tests asserting the specific ID + sound deductions.
- [x] Step 2: Record the final strategy order and old→new mapping (in this doc or `taxonomy-migration-map.md`).
- [x] Step 3: Restate non-goals for future workers (full-corpus performance secondary to trace quality; caching is a separate optimization; no backtracking/forcing-nets/template enumeration under human-strategy labels).
- [x] Step 4: Commit the documentation updates.

Progress note (2026-06-18): Phase 7 documentation updates completed locally. `diabolical-727.md` now carries the taxonomy constraints for future strategy work, and `taxonomy-migration-map.md` records the final default order plus deferred exceptions. Commit remains intentionally unchecked until these documentation changes are committed.

Progress note (2026-06-18): Phase 7 documentation updates were committed in `52150f8` (`docs: close taxonomy refactor planning loop`).

## Stop Conditions

- Stop if any full-corpus solved count drops below the baseline.
- Stop if any invalid solved grid appears.
- Stop if any strategy split changes a regression test from solved to stuck.
- Stop after three failed attempts to preserve a split strategy's behavior; reconsider whether that split needs a shared helper or a smaller first step.
- Stop if a proposed split requires caching to be correct (caching is a perf option, not a correctness dependency).
