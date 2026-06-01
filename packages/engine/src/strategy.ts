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
export interface Strategy {
  /** Stable id, also used as Step.strategyId, e.g. 'naked-single'. */
  readonly id: string;
  /** Bilingual display name; terms should match glossary.zh-en.md. */
  readonly name: { zh: string; en: string };
  /** Cost band (see above). Lower runs earlier. */
  readonly difficulty: number;
  /**
   * Inspect the grid and return the FIRST applicable deduction, or null if the
   * strategy does not apply. MUST NOT mutate the grid — the solver applies the
   * returned Step.
   */
  apply(grid: Grid): Step | null;
}
