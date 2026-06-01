import type { Strategy } from '../strategy.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import {
  BOXES,
  COLS,
  ROWS,
  candidatesInHouse,
  cellName,
  cellsSeeingBoth,
  digitsFromMask,
  isPeer,
  uniqueCells,
} from './_utils.js';

interface StrongLink {
  digit: number;
  ends: [number, number];
}

function bivalueDigits(grid: Grid, cell: number): number[] {
  if (grid.get(cell) !== 0) return [];
  const digits = digitsFromMask(grid.candidatesOf(cell));
  return digits.length === 2 ? digits : [];
}

function buildStrongLinks(grid: Grid, digit: number): StrongLink[] {
  const links: StrongLink[] = [];
  for (let i = 0; i < 9; i++) {
    const row = candidatesInHouse(grid, ROWS[i]!, digit);
    if (row.length === 2) links.push({ digit, ends: [row[0]!, row[1]!] });
    const col = candidatesInHouse(grid, COLS[i]!, digit);
    if (col.length === 2) links.push({ digit, ends: [col[0]!, col[1]!] });
    const box = candidatesInHouse(grid, BOXES[i]!, digit);
    if (box.length === 2) links.push({ digit, ends: [box[0]!, box[1]!] });
  }
  return links;
}

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,
  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      const p = bivalueDigits(grid, pivot);
      if (p.length !== 2) continue;
      const x = p[0]!;
      const y = p[1]!;

      for (let p1 = 0; p1 < 81; p1++) {
        if (!isPeer(pivot, p1)) continue;
        const d1 = bivalueDigits(grid, p1);
        if (d1.length !== 2) continue;
        if (!d1.includes(x)) continue;
        const z = d1[0] === x ? d1[1]! : d1[0]!;
        if (z === y) continue;

        for (let p2 = 0; p2 < 81; p2++) {
          if (p2 === p1 || !isPeer(pivot, p2)) continue;
          const d2 = bivalueDigits(grid, p2);
          if (d2.length !== 2) continue;
          if (!d2.includes(y) || !d2.includes(z)) continue;

          const eliminations = cellsSeeingBoth(grid, p1, p2, z).map((cell) => ({ cell, digit: z }));
          if (eliminations.length === 0) continue;

          return {
            strategyId: this.id,
            placements: [],
            eliminations,
            highlights: {
              cells: uniqueCells([pivot, p1, p2, ...eliminations.map((e) => e.cell)]),
              candidates: [
                { cell: pivot, digit: x },
                { cell: pivot, digit: y },
                { cell: p1, digit: x },
                { cell: p1, digit: z },
                { cell: p2, digit: y },
                { cell: p2, digit: z },
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `XY翼: ${cellName(pivot)} 为枢纽 ${x}/${y}，两翼分别含 ${x}/${z} 与 ${y}/${z}，所以同时看见两翼的格可删除 ${z}。`,
              en: `XY-Wing: ${cellName(pivot)} is the ${x}/${y} pivot, with pincers ${x}/${z} and ${y}/${z}; therefore cells seeing both pincers cannot contain ${z}.`,
            },
          };
        }
      }
    }
    return null;
  },
};

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 51,
  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotDigits = digitsFromMask(grid.candidatesOf(pivot));
      if (pivotDigits.length !== 3) continue;

      for (const z of pivotDigits) {
        const others = pivotDigits.filter((d) => d !== z);
        if (others.length !== 2) continue;
        const x = others[0]!;
        const y = others[1]!;

        for (let p1 = 0; p1 < 81; p1++) {
          if (!isPeer(pivot, p1)) continue;
          const d1 = bivalueDigits(grid, p1);
          if (d1.length !== 2 || !d1.includes(x) || !d1.includes(z)) continue;

          for (let p2 = 0; p2 < 81; p2++) {
            if (p2 === p1 || !isPeer(pivot, p2)) continue;
            const d2 = bivalueDigits(grid, p2);
            if (d2.length !== 2 || !d2.includes(y) || !d2.includes(z)) continue;

            const eliminations: { cell: number; digit: number }[] = [];
            for (let cell = 0; cell < 81; cell++) {
              if (cell === pivot || cell === p1 || cell === p2) continue;
              if (!grid.hasCandidate(cell, z)) continue;
              if (isPeer(cell, pivot) && isPeer(cell, p1) && isPeer(cell, p2)) {
                eliminations.push({ cell, digit: z });
              }
            }
            if (eliminations.length === 0) continue;

            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: uniqueCells([pivot, p1, p2, ...eliminations.map((e) => e.cell)]),
                candidates: [
                  ...pivotDigits.map((digit) => ({ cell: pivot, digit })),
                  ...d1.map((digit) => ({ cell: p1, digit })),
                  ...d2.map((digit) => ({ cell: p2, digit })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `XYZ翼: ${cellName(pivot)} 含 ${pivotDigits.join('/')}，两翼分别提供 ${x}/${z} 与 ${y}/${z}，所以同时看见枢纽与两翼的格可删除 ${z}。`,
                en: `XYZ-Wing: ${cellName(pivot)} has ${pivotDigits.join('/')}, with pincers ${x}/${z} and ${y}/${z}; any cell seeing pivot and both pincers cannot contain ${z}.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 52,
  apply(grid: Grid): Step | null {
    const bivalueCells: { cell: number; digits: [number, number] }[] = [];
    for (let cell = 0; cell < 81; cell++) {
      const d = bivalueDigits(grid, cell);
      if (d.length === 2) bivalueCells.push({ cell, digits: [d[0]!, d[1]!] });
    }

    for (const pairA of bivalueCells) {
      for (const pairB of bivalueCells) {
        if (pairB.cell <= pairA.cell) continue;
        if (pairA.digits[0] !== pairB.digits[0] || pairA.digits[1] !== pairB.digits[1]) continue;
        const [d1, d2] = pairA.digits;

        for (const bridgeDigit of [d1, d2]) {
          const eliminateDigit = bridgeDigit === d1 ? d2 : d1;
          for (const link of buildStrongLinks(grid, bridgeDigit)) {
            const [u, v] = link.ends;
            const canBridge = (isPeer(pairA.cell, u) && isPeer(pairB.cell, v))
              || (isPeer(pairA.cell, v) && isPeer(pairB.cell, u));
            if (!canBridge) continue;

            const eliminations = cellsSeeingBoth(grid, pairA.cell, pairB.cell, eliminateDigit)
              .map((cell) => ({ cell, digit: eliminateDigit }));
            if (eliminations.length === 0) continue;

            return {
              strategyId: this.id,
              placements: [],
              eliminations,
              highlights: {
                cells: uniqueCells([pairA.cell, pairB.cell, u, v, ...eliminations.map((e) => e.cell)]),
                candidates: [
                  { cell: pairA.cell, digit: d1 },
                  { cell: pairA.cell, digit: d2 },
                  { cell: pairB.cell, digit: d1 },
                  { cell: pairB.cell, digit: d2 },
                  { cell: u, digit: bridgeDigit },
                  { cell: v, digit: bridgeDigit },
                  ...eliminations,
                ],
                links: [
                  {
                    from: { cell: u, digit: bridgeDigit },
                    to: { cell: v, digit: bridgeDigit },
                    type: 'strong',
                  },
                ],
              },
              explanation: {
                zh: `W翼: ${cellName(pairA.cell)} 与 ${cellName(pairB.cell)} 同为 ${d1}/${d2}，并由数字 ${bridgeDigit} 的强链接桥接，因此可在同时看见两翼的格删除 ${eliminateDigit}。`,
                en: `W-Wing: ${cellName(pairA.cell)} and ${cellName(pairB.cell)} share ${d1}/${d2}, bridged by a strong link on ${bridgeDigit}; remove ${eliminateDigit} from cells seeing both wings.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};
