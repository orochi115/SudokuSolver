/**
 * Avoidable Rectangle strategies (AR Type 1–4).
 *
 * Same deadly pattern as Unique Rectangles, detected via solved non-given cells.
 */

import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import { tryARType1, tryARType2, tryARType3, tryARType4 } from './ur-engine.js';

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 945,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryARType1(grid, 'avoidable-rectangle-type-1');
  },
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 946,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryARType2(grid, 'avoidable-rectangle-type-2');
  },
};

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 947,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryARType3(grid, 'avoidable-rectangle-type-3');
  },
};

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 948,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryARType4(grid, 'avoidable-rectangle-type-4');
  },
};