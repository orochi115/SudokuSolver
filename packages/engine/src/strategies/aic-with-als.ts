/**
 * AIC with ALS nodes (P1)
 *
 * Uses Almost Locked Sets as nodes inside an Alternating Inference Chain.
 * Minimal sound implementation: searches short ALS chains and presents the
 * result as an AIC step.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { searchALSChain } from './als-chain.js';

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含 ALS 节点的 AIC', en: 'AIC with ALS Nodes' },
  difficulty: 760,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    // Reuse ALS-chain search but emit with the aic-with-als id and AIC-style explanation.
    const step = searchALSChain(grid, 3, undefined, 3);
    if (!step) return null;
    return {
      ...step,
      strategyId: this.id,
      explanation: {
        zh: `含 ALS 节点的交替推理链：ALS 链节点形成强弱交替推理，消去相应候选数。`,
        en: `AIC with ALS nodes: ALS chain nodes form an alternating inference chain, yielding the eliminations.`,
      },
    };
  },
};
