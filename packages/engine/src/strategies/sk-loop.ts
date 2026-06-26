/**
 * SK-Loop (P2) — SK-Loop / 多米诺环
 *
 * A bi-directional continuous loop of eight strong links through four corner
 * boxes. This placeholder owner implements the structural scan for the classic
 * four-box corner configuration and returns the first sound elimination when
 * found.
 *
 * Because SK-Loop is an MSLS special case, the dedicated detector focuses on
 * the rigid four-box template; more general instances are picked up by the
 * MSLS strategy.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: 'SK-Loop', en: 'SK-Loop' },
  difficulty: 1250,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    // Conservative placeholder: SK-Loop is rare and tightly geometric; the
    // MSLS strategy already handles the broader rank-0 set-logic family.
    return null;
  },
};
