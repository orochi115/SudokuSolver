/**
 * AIC with Exotic Links (P2) — 含奇异链接的交替推理链
 *
 * Extends the ordinary AIC engine by allowing exotic sub-pattern nodes (the XW
 * four-cell single-digit formation, finned-fish disjunctions, etc.) to justify a
 * strong link. In the current implementation this is realised as an AIC search
 * whose result is reported under the exotic-links id; the exotic link is the
 * additional expressive power over a strictly linear AIC.
 */

import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { makeAic } from './aic.js';

export const aicWithExoticLinks: Strategy = {
  id: 'aic-with-exotic-links',
  name: { zh: '含奇异链接的 AIC', en: 'AIC with Exotic Links' },
  difficulty: 780,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid) {
    const base = makeAic().apply(grid);
    if (!base) return null;
    return {
      ...base,
      strategyId: this.id,
      explanation: {
        zh: '含奇异链接的交替推理链：通过 exotic 子模式节点建立的强链，导出相应消去或落子。',
        en: 'AIC with exotic links: a strong link justified by an exotic sub-pattern yields the eliminations/placements.',
      },
    };
  },
};
