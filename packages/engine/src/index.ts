/**
 * @sudoku/engine — public surface.
 *
 * Pure TypeScript, no DOM. Consumed by tests, scripts, and (later) the web app.
 */

export * from './grid.js';
export * from './trace.js';
export * from './strategy.js';
export * from './solver.js';
export * from './soundness.js';
export * from './parser.js';
export * from './bruteforce.js';
export {
  STRATEGIES,
  basicFish,
  fullHouse,
  hiddenSingle,
  hiddenSubset,
  lockedCandidates,
  nakedSingle,
  nakedSubset,
  singleDigitPatterns,
  wWing,
  xyWing,
  xyzWing,
} from './strategies/index.js';
