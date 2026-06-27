# P2b Sudoku Strategy Implementation Plan

## Goal
Implement P2b rare/exotic strategy IDs requested by the user, preserve P0/P1/P2a behavior, update registrations/order/member lists/checklist, verify with typecheck/tests/solve:list, and document results in `docs/notes/p2b.md`.

## Phases
1. Restore context and audit P2b docs/current strategy architecture — complete
2. Add failing tests for exact P2b registration, purity/red-line guards, and representative strategy behavior — complete
3. Implement conservative pure P2b strategies using existing human-technique engines where possible — complete
4. Update `overlap.ts`, `chain/boundaries.ts`, and `docs/plans/diabolical-727-checklist.md` — complete
5. Run focused tests, typecheck, full tests, and fix failures — in progress
6. Run 400 sanity plus 727 profile measurements where scripts are available — pending
7. Write `docs/notes/p2b.md` with implementation notes, metrics, stuck observations, and self-review — pending

## Constraints
- No brute force, solution lookup, trial-and-error, contradiction search, Nishio, forcing nets, or answer reads in human-default strategies.
- Strategies must be pure functions and must not mutate the grid.
- Each returned step must be a named human deduction with bilingual explanations and highlights.
- Register exact required strategy IDs in `strategies/index.ts` and keep `CANONICAL_STRATEGY_ORDER` synchronized.
- If exact exotic detection cannot be implemented soundly without search, use a conservative detector shell returning `null` rather than unsound eliminations.
- Gurth is implemented as a real symmetry/permutation fixed-cell detector because the card provides a bounded, non-search human theorem.

## Assumptions
- User explicitly requested autonomous execution, so approval/question gates are skipped; any blocking ambiguity goes to `QUESTIONS.md` while work continues.
- No project-local worktree directory or CLAUDE preference exists; current branch is task-specific (`model/gpt55`), so implementation proceeds in-place.
