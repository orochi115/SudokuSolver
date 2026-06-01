/**
 * The main solving loop (FR-5, FR-6).
 *
 * Repeatedly: try strategies in cost order, apply the first one that yields a
 * step, record it, and restart from the cheapest strategy. Stop when solved or
 * when no strategy applies (stuck). The ordered strategy list IS the
 * "systematised flow" (FR-7).
 */

import type { Grid } from './grid.js';
import type { Strategy } from './strategy.js';
import type { Step, SolveTrace } from './trace.js';

const MAX_STEPS = 1000; // safety bound; a real human solve is far shorter

/** Apply a step's placements and eliminations to a grid (mutates). */
export function applyStep(grid: Grid, step: Step): void {
  for (const p of step.placements) grid.place(p.cell, p.digit);
  for (const e of step.eliminations) grid.eliminate(e.cell, e.digit);
}

/**
 * Solve `grid` using `strategies`, producing a full trace. Does not mutate the
 * input grid (works on a clone). Strategies are tried in ascending difficulty.
 */
export function solve(grid: Grid, strategies: readonly Strategy[]): SolveTrace {
  const work = grid.clone();
  const initial = work.toString();
  const ordered = [...strategies].sort((a, b) => a.difficulty - b.difficulty);
  const steps: Step[] = [];

  while (!work.isSolved() && steps.length < MAX_STEPS) {
    let progressed = false;
    for (const strat of ordered) {
      const step = strat.apply(work);
      if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
        applyStep(work, step);
        steps.push(step);
        progressed = true;
        break;
      }
    }
    if (!progressed) break;
  }

  return {
    initial,
    steps,
    outcome: work.isSolved() ? 'solved' : 'stuck',
    final: work.toString(),
  };
}
