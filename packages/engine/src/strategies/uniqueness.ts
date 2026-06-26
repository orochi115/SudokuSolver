/**
 * Uniqueness Techniques (T4) — 唯一性技巧
 *
 * UR types and BUG+1 delegate to the shared ur-engine (E3).
 */

import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import {
  tryBUGPlus1,
  tryURType1,
  tryURType2,
  tryURType3,
  tryURType4,
  tryURType5,
  tryURType6,
  tryHiddenUR,
} from './ur-engine.js';

export const bugPlusOne: Strategy = {
  id: 'bug-plus-one',
  name: { zh: 'BUG+1', en: 'BUG+1' },
  difficulty: 910,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryBUGPlus1(grid, 'bug-plus-one');
  },
};

export const uniqueRectangleType1: Strategy = {
  id: 'unique-rectangle-type-1',
  name: { zh: '唯一矩形 Type 1', en: 'Unique Rectangle Type 1' },
  difficulty: 920,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryURType1(grid, 'unique-rectangle-type-1');
  },
};

export const uniqueRectangleType2: Strategy = {
  id: 'unique-rectangle-type-2',
  name: { zh: '唯一矩形 Type 2', en: 'Unique Rectangle Type 2' },
  difficulty: 930,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryURType2(grid, 'unique-rectangle-type-2');
  },
};

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryHiddenUR(grid, 'hidden-unique-rectangle');
  },
};

export const uniqueRectangleType3: Strategy = {
  id: 'unique-rectangle-type-3',
  name: { zh: '唯一矩形 Type 3', en: 'Unique Rectangle Type 3' },
  difficulty: 940,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryURType3(grid, 'unique-rectangle-type-3');
  },
};

export const uniqueRectangleType4: Strategy = {
  id: 'unique-rectangle-type-4',
  name: { zh: '唯一矩形 Type 4', en: 'Unique Rectangle Type 4' },
  difficulty: 950,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryURType4(grid, 'unique-rectangle-type-4');
  },
};

export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryURType5(grid, 'unique-rectangle-type-5');
  },
};

export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],
  apply(grid: Grid) {
    return tryURType6(grid, 'unique-rectangle-type-6');
  },
};