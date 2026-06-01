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
  nakedSingle,
  hiddenSingle,
  lockedCandidates,
  nakedPair,
  hiddenPair,
  nakedTriple,
  hiddenTriple,
  nakedQuad,
  hiddenQuad,
  xWing,
  swordfish,
  jellyfish,
  skyscraper,
  twoStringKite,
  emptyRectangle,
  xyWing,
  xyzWing,
  wWing,
} from './strategies/index.js';
