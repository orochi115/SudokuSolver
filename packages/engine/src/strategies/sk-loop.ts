import {
  CELLS, HOUSES, BOXES, ROWS, COLS,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: 'SK环', en: 'SK-Loop' },
  difficulty: 1250,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const bandPairs = [[0, 1], [0, 2], [1, 2]];
    const stackPairs = [[0, 1], [0, 2], [1, 2]];

    for (const [b1, b2] of bandPairs) {
      for (const [s1, s2] of stackPairs) {
        const result = trySKLoop(grid, b1!, b2!, s1!, s2!, this.id);
        if (result) return result;
      }
    }
    return null;
  },
};

function trySKLoop(
  grid: Grid, band1: number, band2: number, stack1: number, stack2: number,
  strategyId: string,
): Step | null {
  const boxIndices = [
    band1 * 3 + stack1, band1 * 3 + stack2,
    band2 * 3 + stack1, band2 * 3 + stack2,
  ];

  const pivotRows = [band1 * 3, band1 * 3 + 2, band2 * 3, band2 * 3 + 2];
  const pivotCols = [stack1 * 3, stack1 * 3 + 2, stack2 * 3, stack2 * 3 + 2];

  const pivots: number[] = [];
  for (let i = 0; i < 4; i++) {
    const r = pivotRows[i]!;
    const c = pivotCols[i]!;
    const cell = r * 9 + c;
    if (grid.get(cell) === 0) return null;
    pivots.push(cell);
  }

  const loopCells: number[] = [];
  const links: { cells: number[]; digits: number[]; type: 'inner' | 'outer' }[] = [];

  for (let i = 0; i < 4; i++) {
    const boxIdx = boxIndices[i]!;
    const box = BOXES[boxIdx]!;
    const pivot = pivots[i]!;
    const pivotRow = ROW_OF[pivot]!;
    const pivotCol = COL_OF[pivot]!;

    const miniRow = box.filter((c) => ROW_OF[c] === pivotRow && c !== pivot);
    const miniCol = box.filter((c) => COL_OF[c] === pivotCol && c !== pivot);

    for (const c of [...miniRow, ...miniCol]) {
      if (grid.get(c) !== 0) return null;
      loopCells.push(c);
    }

    const innerDigitsRow = digitsOf(miniRow.reduce((m, c) => m | grid.candidatesOf(c), 0));
    const innerDigitsCol = digitsOf(miniCol.reduce((m, c) => m | grid.candidatesOf(c), 0));
    const innerDigits = innerDigitsRow.filter((d) => innerDigitsCol.includes(d));

    if (innerDigits.length >= 2) {
      links.push({ cells: [...miniRow, ...miniCol], digits: innerDigits.slice(0, 2), type: 'inner' });
    }
  }

  if (links.length < 4) return null;

  const totalLinkSize = links.reduce((s, l) => s + l.digits.length, 0);
  if (totalLinkSize > 16) return null;

  const elims: { cell: number; digit: number }[] = [];
  const loopSet = new Set(loopCells);

  for (const link of links) {
    if (link.type === 'inner') {
      const boxIdx = BOX_OF[link.cells[0]!]!;
      const box = BOXES[boxIdx]!;
      for (const c of box) {
        if (grid.get(c) !== 0) continue;
        if (loopSet.has(c)) continue;
        for (const d of link.digits) {
          if (grid.hasCandidate(c, d)) {
            elims.push({ cell: c, digit: d });
          }
        }
      }
    }
  }

  if (elims.length === 0) return null;

  return {
    strategyId,
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...pivots, ...loopCells],
      candidates: [
        ...loopCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        ...elims,
      ],
      links: [],
    },
    explanation: {
      zh: `SK环：4个宫角格为已知数，16个环格通过8条链连接；消去宫内环外格的链数字。`,
      en: `SK-Loop: 4 pivot givens, 16 loop cells connected by 8 links; eliminate link digits from non-loop box cells.`,
    },
  };
}
