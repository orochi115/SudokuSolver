# P1 Sudoku Strategy Implementation Plan

## Goal
Implement all P1 strategy IDs requested by the user, update registration/overlap/boundaries/docs, verify typecheck/tests/soundness/727 profiles, and document results in `docs/notes/p1.md`.

## Phases
1. Context audit — complete
2. Identify existing P0/P1 reusable detectors and registration gaps — complete
3. Add failing tests for missing P1 IDs and contract behavior — complete
4. Implement minimal sound human-strategy detectors or aliases using existing engines — complete
5. Update overlap/boundaries/checklist and E4 status — in progress
6. Run verification loops and fix failures — pending
7. Record 727 metrics and write `docs/notes/p1.md` — pending

## Constraints
- No brute force, solution lookup, trial-and-error, contradiction search, Nishio, or forcing nets in human-default strategies.
- Strategies must be pure, deterministic, named human deductions with bilingual explanations and highlights including `links`.
- Preserve existing behavior except explicitly coupled E4 ALS folding.
