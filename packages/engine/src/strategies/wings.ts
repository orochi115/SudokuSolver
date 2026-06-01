import { CELLS, SIZE, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf, popcount, PEERS_OF, HOUSES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY-Wing', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 2) continue;
      const pivotDigits = digitsOf(pivotMask);
      const [x, y] = pivotDigits as [number, number];

      const peersA: number[] = [];
      const peersB: number[] = [];
      for (const p of PEERS_OF[pivot]!) {
        if (grid.get(p) !== 0) continue;
        const pm = grid.candidatesOf(p);
        if (popcount(pm) !== 2) continue;
        const pd = digitsOf(pm);
        if (pd.includes(x) && pd.includes(y)) continue;
        if (pd.includes(x) && pd.includes(getOther(pd, x))) {
          const z = getOther(pd, x);
          if (z !== x && z !== y) peersA.push(p);
        }
        if (pd.includes(y) && pd.includes(getOther(pd, y))) {
          const z = getOther(pd, y);
          if (z !== x && z !== y) peersB.push(p);
        }
      }

      for (const a of peersA) {
        for (const b of peersB) {
          if (!cellsSee(a, b)) continue;
          const aDigits = digitsOf(grid.candidatesOf(a));
          const bDigits = digitsOf(grid.candidatesOf(b));
          const zSet = new Set<number>();
          for (const ad of aDigits) if (ad !== x && ad !== y) zSet.add(ad);
          for (const bd of bDigits) if (bd !== x && bd !== y) zSet.add(bd);
          if (zSet.size !== 1) continue;
          const z = [...zSet][0]!;

          const elims: { cell: number; digit: number }[] = [];
          for (let cell = 0; cell < CELLS; cell++) {
            if (grid.get(cell) !== 0) continue;
            if (cell === pivot || cell === a || cell === b) continue;
            if (!grid.hasCandidate(cell, z)) continue;
            if (cellsSee(cell, a) && cellsSee(cell, b)) {
              elims.push({ cell, digit: z });
            }
          }
          if (elims.length > 0) {
            const r = ROW_OF[pivot]! + 1;
            const c = COL_OF[pivot]! + 1;
            return {
              strategyId: 'xy-wing',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [pivot, a, b],
                candidates: [
                  { cell: pivot, digit: x },
                  { cell: pivot, digit: y },
                  { cell: a, digit: z },
                  { cell: b, digit: z },
                ],
                links: [],
              },
              explanation: {
                zh: `枢纽 R${r}C${c} 为 {${x},${y}} 双值格，两翼分别含 ${z}，可排除同时看见两翼的格中的候选 ${z}（XY-Wing）。`,
                en: `Pivot R${r}C${c} is a bivalue cell {${x},${y}}, with pincers containing ${z}. Eliminate ${z} from cells seeing both pincers (XY-Wing).`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ-Wing', en: 'XYZ-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < CELLS; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;
      const pivotDigits = digitsOf(pivotMask);

      for (let di = 0; di < 3; di++) {
        const x = pivotDigits[di]!;
        const y = pivotDigits[(di + 1) % 3]!;
        const z = pivotDigits[(di + 2) % 3]!;

        const peersA: number[] = [];
        const peersB: number[] = [];
        for (const p of PEERS_OF[pivot]!) {
          if (grid.get(p) !== 0) continue;
          const pm = grid.candidatesOf(p);
          if (popcount(pm) !== 2) continue;
          const pd = digitsOf(pm);
          if (pd.includes(x) && pd.includes(z) && !pd.includes(y)) {
            peersA.push(p);
          }
          if (pd.includes(y) && pd.includes(z) && !pd.includes(x)) {
            peersB.push(p);
          }
        }

        for (const a of peersA) {
          for (const b of peersB) {
            if (!cellsSee(pivot, a) || !cellsSee(pivot, b)) continue;
            if (!cellsSee(a, b)) continue;

            const elims: { cell: number; digit: number }[] = [];
            for (let cell = 0; cell < CELLS; cell++) {
              if (grid.get(cell) !== 0) continue;
              if (cell === pivot || cell === a || cell === b) continue;
              if (!grid.hasCandidate(cell, z)) continue;
              if (cellsSee(cell, pivot) && cellsSee(cell, a) && cellsSee(cell, b)) {
                elims.push({ cell, digit: z });
              }
            }
            if (elims.length > 0) {
              const r = ROW_OF[pivot]! + 1;
              const c = COL_OF[pivot]! + 1;
              return {
                strategyId: 'xyz-wing',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [pivot, a, b],
                  candidates: [
                    { cell: pivot, digit: x },
                    { cell: pivot, digit: y },
                    { cell: pivot, digit: z },
                    { cell: a, digit: z },
                    { cell: b, digit: z },
                  ],
                  links: [],
                },
                explanation: {
                  zh: `枢纽 R${r}C${c} 为 {${x},${y},${z}} 三值格，两翼含 {${x},${z}} 和 {${y},${z}}，可排除同时看见三者之格中的候选 ${z}（XYZ-Wing）。`,
                  en: `Pivot R${r}C${c} is a trivalue cell {${x},${y},${z}}, with pincers {${x},${z}} and {${y},${z}}. Eliminate ${z} from cells seeing all three (XYZ-Wing).`,
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

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W-Wing', en: 'W-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let d1 = 1; d1 <= SIZE; d1++) {
      for (let d2 = d1 + 1; d2 <= SIZE; d2++) {
        const pairMask = maskOf(d1) | maskOf(d2);
        const bivalueCells: number[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (grid.candidatesOf(c) === pairMask) bivalueCells.push(c);
        }
        if (bivalueCells.length < 2) continue;

        for (let i = 0; i < bivalueCells.length; i++) {
          for (let j = i + 1; j < bivalueCells.length; j++) {
            const a = bivalueCells[i]!;
            const b = bivalueCells[j]!;
            if (cellsSee(a, b)) continue;

            const linkDigit = d1;
            const elimDigit = d2;

            for (const house of HOUSES) {
              const strongCells: number[] = [];
              for (const c of house) {
                if (c === a || c === b) continue;
                if (grid.get(c) !== 0) continue;
                if (grid.candidatesOf(c) & maskOf(linkDigit)) {
                  const notASee = !cellsSee(c, a);
                  const notBSee = !cellsSee(c, b);
                  if (notASee && !notBSee) strongCells.push(c);
                  else if (notBSee && !notASee) strongCells.push(c);
                }
              }
              if (strongCells.length === 0) continue;

              for (const sc of strongCells) {
                if (!(grid.candidatesOf(sc) & maskOf(linkDigit))) continue;
                let aInHouse = false;
                let bInHouse = false;
                for (const hc of house) {
                  if (hc === a) aInHouse = true;
                  if (hc === b) bInHouse = true;
                }
                if (!aInHouse || !bInHouse) continue;
                if (!cellsSee(a, sc) || !cellsSee(b, sc)) continue;

                const elims: { cell: number; digit: number }[] = [];
                for (let cell = 0; cell < CELLS; cell++) {
                  if (grid.get(cell) !== 0) continue;
                  if (cell === a || cell === b || cell === sc) continue;
                  if (!grid.hasCandidate(cell, elimDigit)) continue;
                  if (cellsSee(cell, a) && cellsSee(cell, b)) {
                    elims.push({ cell, digit: elimDigit });
                  }
                }
                if (elims.length > 0) {
                  const ra = ROW_OF[a]! + 1;
                  const ca = COL_OF[a]! + 1;
                  return {
                    strategyId: 'w-wing',
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [a, b, sc],
                      candidates: [
                        { cell: a, digit: d1 },
                        { cell: a, digit: d2 },
                        { cell: b, digit: d1 },
                        { cell: b, digit: d2 },
                        { cell: sc, digit: linkDigit },
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `两个 {${d1},${d2}} 双值格（R${ra}C${ca} 等）通过数字 ${d1} 的强链接相连，构成 W-Wing，排除两格共同可见格中的候选 ${elimDigit}。`,
                      en: `Two bivalue cells {${d1},${d2}} (R${ra}C${ca} etc.) are connected by a strong link on ${d1}, forming a W-Wing. Eliminate ${elimDigit} from cells seeing both bivalue cells.`,
                    },
                  };
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

function cellsSee(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

function getOther(digits: number[], exclude: number): number {
  for (const d of digits) if (d !== exclude) return d;
  return digits[0]!;
}