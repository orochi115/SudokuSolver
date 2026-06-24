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
export { STRATEGIES, CANONICAL_STRATEGY_ORDER, nakedSingle } from './strategies/index.js';
export {
  type StrategyProfile,
  STRATEGY_PROFILES,
  HUMAN_DEFAULT_STRATEGIES,
  LAST_RESORT_STRATEGIES,
  LAST_RESORT_IDS,
  DEFAULT_PROFILE,
  strategiesForProfile,
} from './strategies/profiles.js';
export { type OverlapFamily, OVERLAP_FAMILIES } from './strategies/overlap.js';
export {
  type GranularityException,
  GRANULARITY_EXCEPTIONS,
  GRANULARITY_EXCEPTION_IDS,
} from './strategies/granularity-exceptions.js';
export {
  type ChainOwnership,
  CHAIN_OWNERSHIP,
  MULTI_BRANCH_IDS,
  GROUPED_IS_A_SWITCH,
} from './chain/boundaries.js';
