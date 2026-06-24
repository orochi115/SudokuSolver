/**
 * Strategy contract — the interface every human-solving technique implements.
 *
 * This is the engine's extension point. The foundation provides this contract,
 * the solver loop, the grid, the brute-force ground truth, and one reference
 * strategy (naked-single). The remaining strategies (M2: hidden single, locked
 * candidates, subsets; M3: fish, wings, coloring, AIC, ALS, uniqueness, forcing
 * chains) are added against THIS interface, so the solver and UI never change.
 */

import type { Grid } from './grid.js';
import type { Step } from './trace.js';

/**
 * Rough cost ordering for the solver loop. Cheaper strategies run first so the
 * trace prefers the simplest available deduction (FR-7). Suggested bands:
 *   10 singles · 20 intersections · 30 subsets · 40 fish · 50 wings ·
 *   60 coloring · 70 chains/AIC · 80 ALS · 90 uniqueness · 100 forcing
 */
/**
 * Declared internal tie-break keys (Roadmap ② gate 4). When a strategy can match
 * multiple pattern instances on the same grid, it MUST rank the instances by a
 * stable, declared order and return the canonical (first-ranked) one — never let
 * "the first loop hit" be the implicit semantics. This array documents, in
 * priority order, the keys a strategy ranks by (for transparency and tests).
 * Common keys: 'digit', 'house', 'size', 'chain-length', 'node-type',
 * 'cell-index' (row-major). All strategies must be deterministic regardless of
 * whether they declare this.
 */
export type TieBreakKey =
  | 'digit'
  | 'house'
  | 'size'
  | 'chain-length'
  | 'node-type'
  | 'cell-index';

export interface Strategy {
  /** Stable id, also used as Step.strategyId, e.g. 'naked-single'. */
  readonly id: string;
  /** Bilingual display name; terms should match glossary.zh-en.md. */
  readonly name: { zh: string; en: string };
  /** Cost band (see above). Lower runs earlier. */
  readonly difficulty: number;
  /**
   * Declared internal tie-break order (gate 4). Optional metadata documenting how
   * this strategy ranks multiple instances before returning the canonical one.
   */
  readonly tieBreak?: readonly TieBreakKey[];
  /**
   * Inspect the grid and return the FIRST applicable deduction, or null if the
   * strategy does not apply. MUST NOT mutate the grid — the solver applies the
   * returned Step.
   *
   * Contract (gates 4 & 5):
   *  - DETERMINISM: for a given grid, `apply` must always return the same Step
   *    (same instance, same eliminations/placements order).
   *  - TIE-BREAK: if multiple instances match, rank by the declared `tieBreak`
   *    order and return the canonical one; do not rely on iteration accident.
   *  - GRANULARITY: one returned Step corresponds to ONE concrete pattern
   *    instance. Cross-instance / cross-sub-technique merging is only allowed for
   *    the explicit deferred exceptions in strategies/granularity-exceptions.ts;
   *    new strategies must not introduce new merges.
   */
  apply(grid: Grid): Step | null;
}
