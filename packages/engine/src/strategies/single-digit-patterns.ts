/**
 * T3: Single-digit patterns — Skyscraper, 2-String Kite, Empty Rectangle.
 *
 * STUB — currently disabled because the pattern-detection logic produces
 * unsound eliminations (eliminating candidates that the solution uses).
 * The core idea is sound but the implementation needs careful review.
 * TODO: re-enable once the elimination logic is fixed.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single-Digit Patterns' },
  difficulty: 45,

  apply(_grid: Grid): Step | null {
    return null; // disabled — produces unsound eliminations
  },
};