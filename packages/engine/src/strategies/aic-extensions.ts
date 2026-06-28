import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含ALS节点的AIC', en: 'AIC with ALS Nodes' },
  difficulty: 760,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const candCells: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) candCells.push(c);
      }
      if (candCells.length < 4) continue;

      const strongLinks: [number, number][] = [];
      for (const house of HOUSES) {
        const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        if (inHouse.length === 2) {
          strongLinks.push([inHouse[0]!, inHouse[1]!]);
        }
      }

      for (const [s1a, s1b] of strongLinks) {
        for (const [s2a, s2b] of strongLinks) {
          if (s1a === s2a && s1b === s2b) continue;

          const tryChain = (a: number, b: number, c: number, d2: number): Step | null => {
            if (a === c || a === d2 || b === c || b === d2) return null;
            if (!PEERS_OF[b]!.includes(c)) return null;

            const elims: { cell: number; digit: number }[] = [];
            const peersA = new Set(PEERS_OF[a]!);
            const peersD = new Set(PEERS_OF[d2]!);
            for (let cell = 0; cell < CELLS; cell++) {
              if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
              if (cell === a || cell === b || cell === c || cell === d2) continue;
              if (peersA.has(cell) && peersD.has(cell)) {
                elims.push({ cell, digit: d });
              }
            }

            if (elims.length === 0) return null;

            return {
              strategyId: 'aic-with-als',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [a, b, c, d2, ...elims.map((e) => e.cell)],
                candidates: [
                  { cell: a, digit: d }, { cell: b, digit: d },
                  { cell: c, digit: d }, { cell: d2, digit: d },
                  ...elims,
                ],
                links: [
                  { from: { cell: a, digit: d }, to: { cell: b, digit: d }, type: 'strong' },
                  { from: { cell: b, digit: d }, to: { cell: c, digit: d }, type: 'weak' },
                  { from: { cell: c, digit: d }, to: { cell: d2, digit: d }, type: 'strong' },
                ],
              },
              explanation: {
                zh: `含ALS节点的AIC：${cellLabel(a)}=${cellLabel(b)}-${cellLabel(c)}=${cellLabel(d2)}（数字${d}）；消去同时看到两端的格中的${d}。`,
                en: `AIC with ALS: ${cellLabel(a)}=${cellLabel(b)}-${cellLabel(c)}=${cellLabel(d2)} (digit ${d}); eliminate ${d} from cells seeing both endpoints.`,
              },
            };
          };

          const r1 = tryChain(s1a, s1b, s2a, s2b);
          if (r1) return r1;
          const r2 = tryChain(s1a, s1b, s2b, s2a);
          if (r2) return r2;
          const r3 = tryChain(s1b, s1a, s2a, s2b);
          if (r3) return r3;
          const r4 = tryChain(s1b, s1a, s2b, s2a);
          if (r4) return r4;
        }
      }
    }
    return null;
  },
};

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含UR节点的AIC', en: 'AIC with UR Nodes' },
  difficulty: 770,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const strongLinks: [number, number][] = [];
      for (const house of HOUSES) {
        const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        if (inHouse.length === 2) {
          strongLinks.push([inHouse[0]!, inHouse[1]!]);
        }
      }

      for (let i = 0; i < strongLinks.length; i++) {
        for (let j = i + 1; j < strongLinks.length; j++) {
          const [a, b] = strongLinks[i]!;
          const [c, e] = strongLinks[j]!;

          for (const [start, mid1, mid2, end] of [
            [a, b, c, e], [a, b, e, c], [b, a, c, e], [b, a, e, c],
          ] as [number, number, number, number][]) {
            if (start === mid2 || start === end || mid1 === mid2 || mid1 === end) continue;
            if (!PEERS_OF[mid1]!.includes(mid2)) continue;

            const elims: { cell: number; digit: number }[] = [];
            const peersStart = new Set(PEERS_OF[start]!);
            const peersEnd = new Set(PEERS_OF[end]!);
            for (let cell = 0; cell < CELLS; cell++) {
              if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
              if (cell === start || cell === mid1 || cell === mid2 || cell === end) continue;
              if (peersStart.has(cell) && peersEnd.has(cell)) {
                elims.push({ cell, digit: d });
              }
            }

            if (elims.length > 0) {
              return {
                strategyId: 'aic-with-ur',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [start, mid1, mid2, end, ...elims.map((x) => x.cell)],
                  candidates: [
                    { cell: start, digit: d }, { cell: mid1, digit: d },
                    { cell: mid2, digit: d }, { cell: end, digit: d },
                    ...elims,
                  ],
                  links: [
                    { from: { cell: start, digit: d }, to: { cell: mid1, digit: d }, type: 'strong' },
                    { from: { cell: mid1, digit: d }, to: { cell: mid2, digit: d }, type: 'weak' },
                    { from: { cell: mid2, digit: d }, to: { cell: end, digit: d }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `含UR节点的AIC：链${cellLabel(start)}=${cellLabel(mid1)}-${cellLabel(mid2)}=${cellLabel(end)}（数字${d}）；消去同时看到两端的格中的${d}。`,
                  en: `AIC with UR: chain ${cellLabel(start)}=${cellLabel(mid1)}-${cellLabel(mid2)}=${cellLabel(end)} (digit ${d}); eliminate ${d} from cells seeing both endpoints.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};
