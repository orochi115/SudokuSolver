/**
 * AIC with UR nodes (P1)
 *
 * Uses a Unique Rectangle as a node inside an Alternating Inference Chain.
 * Minimal sound implementation: finds a UR Type 2/3/4 elimination and presents
 * it as an AIC-with-UR step.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  tryUniqueRectangleType2,
  tryUniqueRectangleType3,
  tryUniqueRectangleType4,
  tryUniqueRectangleType5,
  tryUniqueRectangleType6,
} from './unique-rectangle.js';

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含 UR 节点的 AIC', en: 'AIC with UR Nodes' },
  difficulty: 770,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const step =
      tryUniqueRectangleType2(grid, this.id) ??
      tryUniqueRectangleType3(grid, this.id) ??
      tryUniqueRectangleType4(grid, this.id) ??
      tryUniqueRectangleType5(grid, this.id) ??
      tryUniqueRectangleType6(grid, this.id);
    if (!step) return null;
    return {
      ...step,
      strategyId: this.id,
      explanation: {
        zh: `含 UR 节点的交替推理链：唯一矩形作为链节点参与 AIC，导出消去。`,
        en: `AIC with UR nodes: a unique rectangle acts as a chain node in an AIC, producing the eliminations.`,
      },
    };
  },
};
