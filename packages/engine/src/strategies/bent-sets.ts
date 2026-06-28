import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集（ALP/ALT）', en: 'Bent Sets (ALP/ALT)' },
  difficulty: 540,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    for (let lineType = 0; lineType < 2; lineType++) {
      const isRow = lineType === 0;
      const lineHouses = isRow ? HOUSES.slice(0, 9) : HOUSES.slice(9, 18);

      for (let li = 0; li < 9; li++) {
        const line = lineHouses[li]!;

        for (let bi = 0; bi < 9; bi++) {
          const intersection: number[] = [];
          for (const c of HOUSES[bi + 18]!) {
            if (isRow ? ROW_OF[c] === li : COL_OF[c] === li) {
              if (grid.get(c) === 0) intersection.push(c);
            }
          }
          if (intersection.length === 0) continue;

          const lineCells = line.filter((c) => grid.get(c) === 0 && !intersection.includes(c));
          const boxCells = HOUSES[bi + 18]!.filter((c) => grid.get(c) === 0 && !intersection.includes(c));
          if (lineCells.length < 1 || boxCells.length < 1) continue;

          for (let d1 = 1; d1 <= 8; d1++) {
            for (let d2 = d1 + 1; d2 <= 9; d2++) {
              const sMask = maskOf(d1) | maskOf(d2);

              const lineALS = lineCells.filter((c) => {
                const cm = grid.candidatesOf(c);
                return (cm & ~sMask) === 0 && popcount(cm) === 2 && (cm & sMask) === sMask;
              });
              const boxALS = boxCells.filter((c) => {
                const cm = grid.candidatesOf(c);
                return (cm & ~sMask) === 0 && popcount(cm) === 2 && (cm & sMask) === sMask;
              });

              if (lineALS.length !== 1 || boxALS.length !== 1) continue;

              const lineRemaining = lineCells.filter((c) => c !== lineALS[0]);
              const boxRemaining = boxCells.filter((c) => c !== boxALS[0]);

              const lineSFree = lineRemaining.every((c) => (grid.candidatesOf(c) & sMask) === 0);
              const boxSFree = boxRemaining.every((c) => (grid.candidatesOf(c) & sMask) === 0);

              const lineAlSCell = lineALS[0]!;
              const boxAlSCell = boxALS[0]!;

              if (lineSFree) {
                for (const d of [d1, d2]) {
                  if (!grid.hasCandidate(boxAlSCell, d)) continue;
                  const peersBox = new Set(PEERS_OF[boxAlSCell]!);
                  const peersLine = new Set(PEERS_OF[lineAlSCell]!);
                  const eliminations: { cell: number; digit: number }[] = [];
                  for (const c of HOUSES[bi + 18]!) {
                    if (c === boxAlSCell || c === lineAlSCell) continue;
                    if (intersection.includes(c)) continue;
                    if (grid.get(c) !== 0) continue;
                    if (grid.hasCandidate(c, d) && peersBox.has(c) && peersLine.has(c)) {
                      eliminations.push({ cell: c, digit: d });
                    }
                  }
                  if (eliminations.length > 0) {
                    return {
                      strategyId: 'bent-sets',
                      placements: [],
                      eliminations,
                      highlights: {
                        cells: [...new Set([...intersection, lineAlSCell, boxAlSCell, ...eliminations.map(e => e.cell)])],
                        candidates: [
                          { cell: lineAlSCell, digit: d1 }, { cell: lineAlSCell, digit: d2 },
                          { cell: boxAlSCell, digit: d1 }, { cell: boxAlSCell, digit: d2 },
                          ...eliminations,
                        ],
                        links: [],
                      },
                      explanation: {
                        zh: `弯曲集（ALP）：行列与宫各有一 {${d1},${d2}} 双值格在交叉处弯曲；消去同时可见两者的格中的候选。`,
                        en: `Bent Sets (ALP): line and box each have a {${d1},${d2}} bivalue cell bending at intersection; eliminate from cells seeing both.`,
                      },
                    };
                  }
                }
              }

              if (boxSFree) {
                for (const d of [d1, d2]) {
                  if (!grid.hasCandidate(lineAlSCell, d)) continue;
                  const peersBox = new Set(PEERS_OF[boxAlSCell]!);
                  const peersLine = new Set(PEERS_OF[lineAlSCell]!);
                  const eliminations: { cell: number; digit: number }[] = [];
                  for (const c of line) {
                    if (c === boxAlSCell || c === lineAlSCell) continue;
                    if (intersection.includes(c)) continue;
                    if (grid.get(c) !== 0) continue;
                    if (grid.hasCandidate(c, d) && peersBox.has(c) && peersLine.has(c)) {
                      eliminations.push({ cell: c, digit: d });
                    }
                  }
                  if (eliminations.length > 0) {
                    return {
                      strategyId: 'bent-sets',
                      placements: [],
                      eliminations,
                      highlights: {
                        cells: [...new Set([...intersection, lineAlSCell, boxAlSCell, ...eliminations.map(e => e.cell)])],
                        candidates: [
                          { cell: lineAlSCell, digit: d1 }, { cell: lineAlSCell, digit: d2 },
                          { cell: boxAlSCell, digit: d1 }, { cell: boxAlSCell, digit: d2 },
                          ...eliminations,
                        ],
                        links: [],
                      },
                      explanation: {
                        zh: `弯曲集（ALP）：行列与宫各有一 {${d1},${d2}} 双值格在交叉处弯曲；消去同时可见两者的格中的候选。`,
                        en: `Bent Sets (ALP): line and box each have a {${d1},${d2}} bivalue cell bending at intersection; eliminate from cells seeing both.`,
                      },
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};