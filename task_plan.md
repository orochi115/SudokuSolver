# P2a Sudoku Strategy Implementation Plan

## Goal
Implement P2a rare/exotic strategy IDs requested by the user, preserve P0/P1 behavior, update registrations/overlap/boundaries/checklist, verify with typecheck/tests/solve:list, and document results in `docs/notes/p2a.md`.

## Phases
1. Restore context and audit P2a docs/current strategy architecture — in progress
2. Add failing tests for exact P2a registration, purity/red-line guards, and representative strategy behavior — pending
3. Implement conservative pure P2a strategies using existing human-technique engines where possible — pending
4. Update `overlap.ts`, `chain/boundaries.ts`, and `docs/plans/diabolical-727-checklist.md` — pending
5. Run focused tests, typecheck, full tests, and fix failures — pending
6. Run 400 ground-truth plus 727 profile measurements where scripts are available — pending
7. Write `docs/notes/p2a.md` with implementation notes, metrics, stuck observations, and self-review — pending

## Constraints
- No brute force, solution lookup, trial-and-error, contradiction search, Nishio, forcing nets, or answer reads in human-default strategies.
- Strategies must be pure functions and must not mutate the grid.
- Each returned step must be a named human deduction with bilingual explanations and highlights.
- Register exact required strategy IDs in `strategies/index.ts` and keep `CANONICAL_STRATEGY_ORDER` synchronized.
- If exact exotic detection cannot be implemented soundly without search, use a conservative detector shell returning `null` rather than unsound eliminations.

## Assumptions
- User explicitly requested autonomous execution, so approval/question gates are skipped; any blocking ambiguity goes to `QUESTIONS.md` while work continues.
