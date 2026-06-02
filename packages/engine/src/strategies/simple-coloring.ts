/**
 * T3: Simple Coloring (Single-Digit Coloring).
 *
 * For one digit, find conjugate pairs (strong links) — cells in the same house
 * that are the only two cells with that digit. Build a bipartite graph by
 * alternating colors across strong links. Two elimination types:
 * - Color Trap: an uncolored candidate seeing both colors can be removed.
 * - Color Wrap: if two same-colored candidates see each other, that color is false.
 */

import { PEERS_OF, HOUSES, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

    for (let digit = 1; digit <= 9; digit++) {
      const result = findColoringEliminations(grid, digit, emptyCells);
      if (result) return result;
    }

    return null;
  },
};

function findColoringEliminations(grid: Grid, digit: number, emptyCells: number[]): Step | null {
  const conjugatePairs = findConjugatePairs(grid, digit, emptyCells);
  if (conjugatePairs.length === 0) return null;

  const adj = buildConjugateGraph(conjugatePairs);
  const colors = twoColorGraph(adj);
  if (!colors) return null;

  const trapResult = tryColorTrap(grid, digit, conjugatePairs, colors, emptyCells);
  if (trapResult) return trapResult;

  const wrapResult = tryColorWrap(grid, digit, conjugatePairs, colors, emptyCells);
  if (wrapResult) return wrapResult;

  return null;
}

interface ConjugatePair {
  cell1: number;
  cell2: number;
}

function findConjugatePairs(grid: Grid, digit: number, emptyCells: number[]): ConjugatePair[] {
  const pairs: ConjugatePair[] = [];
  const bit = maskOf(digit);

  for (const house of HOUSES) {
    const cellsWithDigit: number[] = [];
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
        cellsWithDigit.push(c);
      }
    }
    if (cellsWithDigit.length === 2) {
      pairs.push({ cell1: cellsWithDigit[0]!, cell2: cellsWithDigit[1]! });
    }
  }

  return pairs;
}

type AdjList = Map<number, number[]>;

function buildConjugateGraph(pairs: ConjugatePair[]): AdjList {
  const adj = new Map<number, number[]>();
  for (const { cell1, cell2 } of pairs) {
    if (!adj.has(cell1)) adj.set(cell1, []);
    if (!adj.has(cell2)) adj.set(cell2, []);
    adj.get(cell1)!.push(cell2);
    adj.get(cell2)!.push(cell1);
  }
  return adj;
}

function twoColorGraph(adj: AdjList): Map<number, 0 | 1> | null {
  const colors = new Map<number, 0 | 1>();
  const allCells = [...adj.keys()];

  for (const start of allCells) {
    if (colors.has(start)) continue;
    const queue: number[] = [start];
    colors.set(start, 0);

    while (queue.length > 0) {
      const cell = queue.shift()!;
      const neighbors = adj.get(cell);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (!colors.has(neighbor)) {
          const currentColor = colors.get(cell)!;
          colors.set(neighbor, (1 - currentColor) as 0 | 1);
          queue.push(neighbor);
        } else if (colors.get(neighbor) === colors.get(cell)) {
          return null;
        }
      }
    }
  }

  return colors;
}

function tryColorTrap(
  grid: Grid,
  digit: number,
  pairs: ConjugatePair[],
  colors: Map<number, 0 | 1>,
  emptyCells: number[]
): Step | null {
  const coloredCells = new Set(colors.keys());
  const color0Cells: number[] = [];
  const color1Cells: number[] = [];

  for (const [cell, color] of colors) {
    if (color === 0) color0Cells.push(cell);
    else color1Cells.push(cell);
  }

  const eliminations: CellDigit[] = [];

  for (const cell of emptyCells) {
    if (coloredCells.has(cell)) continue;
    if (!grid.hasCandidate(cell, digit)) continue;

    let seesColor0 = false;
    let seesColor1 = false;

    for (const c0 of color0Cells) {
      if (PEERS_OF[cell]!.includes(c0)) {
        seesColor0 = true;
        break;
      }
    }
    if (!seesColor0) continue;

    for (const c1 of color1Cells) {
      if (PEERS_OF[cell]!.includes(c1)) {
        seesColor1 = true;
        break;
      }
    }

    if (seesColor0 && seesColor1) {
      eliminations.push({ cell, digit });
    }
  }

  if (eliminations.length === 0) return null;

  const links: Link[] = [];
  for (const { cell1, cell2 } of pairs) {
    links.push({
      from: { cell: cell1, digit },
      to: { cell: cell2, digit },
      type: 'strong',
    });
  }

  const color0r = Math.floor(color0Cells[0]! / 9) + 1;
  const color0c = (color0Cells[0]! % 9) + 1;
  const color1r = Math.floor(color1Cells[0]! / 9) + 1;
  const color1c = (color1Cells[0]! % 9) + 1;

  return {
    strategyId: 'simple-coloring',
    placements: [],
    eliminations,
    highlights: {
      cells: [...coloredCells],
      candidates: [...coloredCells].flatMap((c) => [{ cell: c, digit }]),
      links,
    },
    explanation: {
      zh: `数字 ${digit} 的候选格形成双色图，格 R${color0r}C${color0c} 与 R${color1r}C${color1c} 为其中两格，${eliminations.length} 个候选格同时看到两色，可消除 ${digit}（染色法-trap）。`,
      en: `Digit ${digit} forms a 2-color graph; cells R${color0r}C${color0c} and R${color1r}C${color1c} are part of it; ${eliminations.length} candidates seeing both colors can eliminate ${digit} (Simple Coloring trap).`,
    },
  };
}

function tryColorWrap(
  grid: Grid,
  digit: number,
  pairs: ConjugatePair[],
  colors: Map<number, 0 | 1>,
  emptyCells: number[]
): Step | null {
  const colorGroups: number[][] = [[], []];
  for (const [cell, color] of colors) {
    colorGroups[color]!.push(cell);
  }

  for (let color = 0; color < 2; color++) {
    const group = colorGroups[color]!;
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const c1 = group[i]!;
        const c2 = group[j]!;
        if (PEERS_OF[c1]!.includes(c2)) {
          const eliminations: CellDigit[] = [
            { cell: c1, digit },
            { cell: c2, digit },
          ];

          const links: Link[] = [];
          for (const { cell1, cell2 } of pairs) {
            links.push({
              from: { cell: cell1, digit },
              to: { cell: cell2, digit },
              type: 'strong',
            });
          }

          const c1r = Math.floor(c1 / 9) + 1;
          const c1c = (c1 % 9) + 1;
          const c2r = Math.floor(c2 / 9) + 1;
          const c2c = (c2 % 9) + 1;

          return {
            strategyId: 'simple-coloring',
            placements: [],
            eliminations,
            highlights: {
              cells: [c1, c2],
              candidates: [{ cell: c1, digit }, { cell: c2, digit }],
              links,
            },
            explanation: {
              zh: `数字 ${digit} 的同色格 R${c1r}C${c1c} 与 R${c2r}C${c2c} 相互可见，两色均为假，消去两格的 ${digit}（染色法-wrap）。`,
              en: `Same-color cells R${c1r}C${c1c} and R${c2r}C${c2c} for digit ${digit} see each other; that color is false, eliminate ${digit} from both (Simple Coloring wrap).`,
            },
          };
        }
      }
    }
  }

  return null;
}
