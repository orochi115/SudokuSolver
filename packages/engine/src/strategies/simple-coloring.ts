import { ROWS, COLS, BOXES, ROW_OF, COL_OF, PEERS_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = findColoring(grid, d);
      if (step) return step;
    }
    return null;
  },
};

function conjugatePairsForDigit(grid: Grid, bit: number): [number, number][] {
  const pairs: [number, number][] = [];
  const allHouses = [...ROWS, ...COLS, ...BOXES];
  for (const house of allHouses) {
    const locs: number[] = [];
    for (const c of house) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) locs.push(c);
    }
    if (locs.length === 2) pairs.push([locs[0]!, locs[1]!]);
  }
  return pairs;
}

interface ColoringResult {
  colorMap: Map<number, 0 | 1>;
  isConsistent: boolean;
}

function buildConsistentColoring(pairs: [number, number][]): ColoringResult[] {
  const adj = new Map<number, number[]>();
  for (const [a, b] of pairs) {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  const visited = new Set<number>();
  const results: ColoringResult[] = [];

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;

    const colorMap = new Map<number, 0 | 1>();
    const queue: [number, 0 | 1][] = [[start, 0]];
    let isConsistent = true;

    while (queue.length > 0) {
      const [cell, color] = queue.shift()!;
      if (colorMap.has(cell)) {
        if (colorMap.get(cell) !== color) {
          isConsistent = false;
        }
        continue;
      }
      colorMap.set(cell, color);
      visited.add(cell);

      for (const neighbor of adj.get(cell)!) {
        if (!visited.has(neighbor) || !colorMap.has(neighbor)) {
          queue.push([neighbor, color === 0 ? 1 : 0]);
        } else if (colorMap.has(neighbor) && colorMap.get(neighbor) === color) {
          isConsistent = false;
        }
      }
    }

    if (isConsistent && colorMap.size >= 2) {
      results.push({ colorMap, isConsistent: true });
    }
  }

  return results;
}

function findColoring(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);
  const pairs = conjugatePairsForDigit(grid, bit);
  if (pairs.length === 0) return null;

  const results = buildConsistentColoring(pairs);

  for (const { colorMap } of results) {
    const cells0: number[] = [];
    const cells1: number[] = [];
    for (const [cell, color] of colorMap) {
      if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
      if (color === 0) cells0.push(cell);
      else cells1.push(cell);
    }
    if (cells0.length === 0 || cells1.length === 0) continue;

    const componentPairs = pairs.filter(([a, b]) => colorMap.has(a) && colorMap.has(b));

    const wrapResult = checkWrap(grid, d, bit, cells0, cells1, componentPairs);
    if (wrapResult) return wrapResult;

    const trapResult = checkTrap(grid, d, bit, cells0, cells1, componentPairs);
    if (trapResult) return trapResult;
  }

  return null;
}

function checkWrap(grid: Grid, d: number, bit: number, cells0: number[], cells1: number[], pairs: [number, number][]): Step | null {
  for (const cells of [cells0, cells1]) {
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        if (PEERS_OF[cells[i]!]!.includes(cells[j]!)) {
          const eliminations = cells.map(c => ({ cell: c, digit: d }));
          const links = pairs.map(([a, b]) => ({
            from: { cell: a, digit: d },
            to: { cell: b, digit: d },
            type: 'strong' as const,
          }));
          const allCells = [...cells0, ...cells1];
          return {
            strategyId: 'simple-coloring',
            placements: [],
            eliminations,
            highlights: {
              cells: allCells,
              candidates: [...allCells.map(c => ({ cell: c, digit: d })), ...eliminations],
              links,
            },
            explanation: {
              zh: `数字 ${d} 的染色链中，同色格互见(Color Wrap)，排除同色候选数。`,
              en: `In coloring chain for digit ${d}, same-colored cells see each other (Color Wrap), eliminating same-colored candidates.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function checkTrap(grid: Grid, d: number, bit: number, cells0: number[], cells1: number[], pairs: [number, number][]): Step | null {
  const eliminations: { cell: number; digit: number }[] = [];

  for (let c = 0; c < 81; c++) {
    if (grid.get(c) !== 0) continue;
    if ((grid.candidatesOf(c) & bit) === 0) continue;
    if (cells0.includes(c) || cells1.includes(c)) continue;

    const sees0 = cells0.some(cc => PEERS_OF[c]!.includes(cc));
    const sees1 = cells1.some(cc => PEERS_OF[c]!.includes(cc));
    if (sees0 && sees1) {
      eliminations.push({ cell: c, digit: d });
    }
  }

  if (eliminations.length === 0) return null;

  const links = pairs.map(([a, b]) => ({
    from: { cell: a, digit: d },
    to: { cell: b, digit: d },
    type: 'strong' as const,
  }));
  const allCells = [...cells0, ...cells1];

  return {
    strategyId: 'simple-coloring',
    placements: [],
    eliminations,
    highlights: {
      cells: [...allCells, ...eliminations.map(e => e.cell)],
      candidates: [...allCells.map(c => ({ cell: c, digit: d })), ...eliminations],
      links,
    },
    explanation: {
      zh: `数字 ${d} 的染色链中未染色格同时看见双色(Color Trap)，排除候选数 ${d}。`,
      en: `In coloring chain for digit ${d}, uncolored cells see both colors (Color Trap), eliminating candidate ${d}.`,
    },
  };
}