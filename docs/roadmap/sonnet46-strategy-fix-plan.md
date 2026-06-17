# Sonnet46 Strategy Fix Plan

## Goal

Fix the strategy-strength gaps that made `archive/final/sonnet46` fail four hard puzzles solved by `archive/final/opus48`, without modifying archive refs directly.

## Difficulty Assessment

The fix is feasible, but the two suspect strategy families have different risk levels.

- `single-digit-patterns` / Empty Rectangle: medium-low difficulty. The root cause is localized: `sonnet46` only checks the Empty Rectangle hinge row/column for conjugate pairs, while `opus48` scans crossing external rows/columns. This can be fixed in one strategy file with focused tests.
- `aic`: medium-high difficulty. `sonnet46` implements AIC as a direct DFS over single candidate nodes. `opus48` has a reusable chain graph that supports grouped nodes and grouped same-digit strong links. The safer fix is to port the `opus48` chain graph/search substrate into a derived `sonnet46` branch rather than patching grouped links into the existing DFS ad hoc.

## Safety Rules

- Do not modify `archive/final/sonnet46` or `archive/final/opus48`.
- Create a derived repair branch, for example `analysis/sonnet46-strategy-fix`, from `archive/final/sonnet46`.
- Use a separate worktree under `~/LLM_Work`, for example `/Users/sakura/LLM_Work/SudokuSolver-sonnet46-strategy-fix`.
- Keep orchestration/reporting changes on `orchestration`; keep model implementation changes on the derived repair branch.
- Use TDD for every behavior change: add failing tests first, verify RED, implement minimal code, verify GREEN, then commit.

## Evidence From Phase 2

Phase 2 generated `divergence-probe.json` files for the four hard cases. All four probes found:

- `candidateHashesMatchAtDivergence: true`
- `winnerProbe.candidateStateRestored: true`
- `loserProbe.candidateStateRestored: true`
- `summary.label: winner-only-detection`

Case-level findings:

| Case | Suspect | Missing detection in `sonnet46` |
| ---: | --- | --- |
| hard #52302 | `aic` | digit 6 X-Chain-style AIC elimination `R9C9=6` |
| hard #114282 | `aic` | digit 7 X-Chain-style AIC eliminations `R4C7=7`, `R4C8=7`, `R6C4=7` |
| hard #272709 | `single-digit-patterns` | Empty Rectangle digit 4 elimination `R4C8=4` |
| hard #305612 | `aic` | digit 4 X-Chain-style AIC elimination `R1C3=4` |

See also `orchestration/analysis/opus-sonnet-root-cause-notes.md`.

## Implementation Tasks

### Task 1: Create Derived Repair Branch

Create the worktree from the archive snapshot:

```bash
git branch analysis/sonnet46-strategy-fix archive/final/sonnet46
git worktree add /Users/sakura/LLM_Work/SudokuSolver-sonnet46-strategy-fix analysis/sonnet46-strategy-fix
```

Run the baseline tests in the repair worktree:

```bash
npm install
npm test
```

### Task 2: Fix Empty Rectangle Coverage

Files in the repair branch:

- Modify: `packages/engine/src/strategies/single-digit-patterns.ts`
- Modify: `packages/engine/test/strategies-m3.test.ts` or `packages/engine/test/strategies.test.ts`

TDD target:

- Restore the candidate state from hard #272709 at the divergence point.
- Assert `singleDigitPatterns.apply(grid)` returns a step with `strategyId: 'single-digit-patterns'` and elimination `{ cell: 34, digit: 4 }`.
- Verify the test fails before the fix because `sonnet46` currently returns no Empty Rectangle step for that state.
- Implement crossing external row/column scans for Empty Rectangle.
- Verify the new test and full engine tests pass.

Expected commit message:

```bash
git commit -m "Fix empty rectangle crossing links"
```

### Task 3: Fix AIC Grouped-Link Coverage

Files in the repair branch:

- Create or port: `packages/engine/src/chain/graph.ts`
- Create or port: `packages/engine/src/chain/aic-search.ts`
- Create or port: `packages/engine/src/chain/policy.ts`
- Modify: `packages/engine/src/strategies/aic.ts`
- Modify: `packages/engine/test/strategies-m3.test.ts` or `packages/engine/test/strategies.test.ts`

TDD target:

- Restore candidate states from hard #52302, #114282, and #305612 at the divergence point.
- Assert `aic.apply(grid)` produces the expected eliminations for each case.
- Verify tests fail before the fix because `sonnet46` currently produces no AIC step from those states.
- Port the `opus48` grouped chain graph/search implementation with minimal integration changes.
- Verify strategy tests and full engine tests pass.

Expected commit message:

```bash
git commit -m "Add grouped AIC link detection"
```

### Task 4: Rerun Four Hard Cases Against Fixed Branch

Use orchestration from the `orchestration` branch. Either:

- Add a minimal `trace-archive-case.mjs` option to map model names to arbitrary refs/worktrees, or
- Generate and run `.trace-case-runner.ts` directly in the repair worktree for the four known puzzles.

Preferred reusable option:

```bash
node orchestration/trace-archive-case.mjs \
  --difficulty hard \
  --index 52302 \
  --models opus48,sonnet46-fixed \
  --refs opus48=archive/final/opus48,sonnet46-fixed=analysis/sonnet46-strategy-fix \
  --out orchestration/reports/analysis/sonnet46-fix-hard-52302
```

Repeat for hard #114282, #272709, and #305612, or use a batch wrapper.

Success criteria:

- The previous `winner-only-detection` gaps disappear.
- `sonnet46-fixed` either solves the four cases or reaches a later, different divergence.
- No solved trace reports `finalGridValid: false`.
- `npm test` still passes in both relevant worktrees.

### Task 5: Save Results Report

Create `orchestration/analysis/sonnet46-strategy-fix-results.md` with:

- Repair branch commit hashes.
- Test and rerun commands.
- Per-case before/after outcomes.
- Any remaining gaps.
- Whether the repair should be considered a model fix, a strategy-strength import, or still experimental.

Expected orchestration commit message:

```bash
git commit -m "Document sonnet46 strategy fix results"
```

## Risk Notes

- Empty Rectangle changes are narrow but must preserve soundness by only eliminating candidates seen through a valid conjugate interaction.
- AIC changes can alter many advanced solves. Keep tests focused on the known missing cases and run the full suite.
- The grouped AIC evidence is a static-code explanation plus restored-state probe result; exact internal chain nodes were not emitted in Phase 2, so the AIC fix should be validated through failing regression tests and rerun traces.
