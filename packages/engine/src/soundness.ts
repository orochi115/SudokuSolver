/**
 * Soundness check (NFR-1 / AC-3) — the project's strongest automated guard and
 * the primary scoring signal for the multi-model comparison.
 *
 * Given a trace and the puzzle's ground-truth solution, a SOUND solver never:
 *   - places a digit that disagrees with the solution, nor
 *   - eliminates a candidate that the solution actually uses.
 *
 * Either violation means the solver "guessed wrong" or reasoned unsoundly —
 * which is exactly what separates a teaching solver from a broken one.
 */

import type { SolveTrace } from './trace.js';

export interface SoundnessViolation {
  stepIndex: number;
  strategyId: string;
  kind: 'bad-placement' | 'bad-elimination';
  cell: number;
  digit: number;
  /** The digit the solution actually has in that cell. */
  expected: number;
}

export interface SoundnessResult {
  sound: boolean;
  violations: SoundnessViolation[];
}

/** Check a trace against an 81-char solution string. */
export function checkTraceSoundness(trace: SolveTrace, solution: string): SoundnessResult {
  const violations: SoundnessViolation[] = [];
  trace.steps.forEach((step, stepIndex) => {
    for (const p of step.placements) {
      const expected = Number(solution[p.cell]);
      if (p.digit !== expected) {
        violations.push({ stepIndex, strategyId: step.strategyId, kind: 'bad-placement', cell: p.cell, digit: p.digit, expected });
      }
    }
    for (const e of step.eliminations) {
      const expected = Number(solution[e.cell]);
      if (e.digit === expected) {
        violations.push({ stepIndex, strategyId: step.strategyId, kind: 'bad-elimination', cell: e.cell, digit: e.digit, expected });
      }
    }
  });
  return { sound: violations.length === 0, violations };
}
