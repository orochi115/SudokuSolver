# Task Plan: M2 — Human Sudoku Solving Strategies

## Goal
Implement T1~T3 human solving strategies for the Sudoku engine, pass all tests, achieve zero soundness violations on 400 ground-truth puzzles, and produce a solve-rate report.

## Phases

### Phase 1: T1 Strategies (difficulty 10)
- [x] full-house.ts — last cell in a house
- [x] hidden-single.ts — digit has one location in a house
- [x] Register in STRATEGIES

### Phase 2: T2 Strategies (difficulty 20-30)
- [x] locked-candidates.ts — pointing + claiming
- [x] naked-subsets.ts — pair/triple/quad
- [x] hidden-subsets.ts — pair/triple/quad
- [x] Register in STRATEGIES

### Phase 3: T3 Strategies (difficulty 40-50)
- [x] basic-fish.ts — X-Wing/Swordfish/Jellyfish (unified base/cover model)
- [x] single-digit-patterns.ts — Skyscraper/2-String Kite/Empty Rectangle
- [x] wings.ts — XY-Wing/XYZ-Wing/W-Wing
- [x] Register in STRATEGIES

### Phase 4: Tests
- [x] hidden-single.test.ts
- [x] locked-candidates.test.ts
- [x] naked-subsets.test.ts
- [x] hidden-subsets.test.ts
- [x] basic-fish.test.ts
- [x] single-digit-patterns.test.ts
- [x] wings.test.ts
- [x] soundness-regression.test.ts (AC-3)

### Phase 5: Solve Rate Script
- [x] packages/engine/scripts/solve-rate.ts
- [x] data/reports/solve-rate.json

### Phase 6: Design Notes
- [x] docs/notes/m2.md

### Phase 7: Verification
- [x] npm run typecheck
- [x] npm test

## Files Created
- packages/engine/src/strategies/full-house.ts
- packages/engine/src/strategies/hidden-single.ts
- packages/engine/src/strategies/locked-candidates.ts
- packages/engine/src/strategies/naked-subsets.ts
- packages/engine/src/strategies/hidden-subsets.ts
- packages/engine/src/strategies/basic-fish.ts
- packages/engine/src/strategies/single-digit-patterns.ts
- packages/engine/src/strategies/wings.ts
- packages/engine/src/strategies/index.ts (updated)
- packages/engine/test/hidden-single.test.ts
- packages/engine/test/locked-candidates.test.ts
- packages/engine/test/naked-subsets.test.ts
- packages/engine/test/hidden-subsets.test.ts
- packages/engine/test/basic-fish.test.ts
- packages/engine/test/single-digit-patterns.test.ts
- packages/engine/test/wings.test.ts
- packages/engine/test/soundness-regression.test.ts
- packages/engine/scripts/solve-rate.ts
- data/reports/solve-rate.json
- docs/notes/m2.md

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| | | |
