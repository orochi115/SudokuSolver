import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function tryGeneralWing(grid: Grid, size: number): Step | null {
  const cellsN: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) cellsN.push(c);
  }

  function* combos(arr: number[], k: number): Generator<number[]> {
    if (k === 0) { yield []; return; }
    if (arr.length < k) return;
    const [first, ...rest] = arr;
    for (const c of combos(rest, k - 1)) yield [first!, ...c];
    yield* combos(rest, k);
  }

  for (const group of combos(cellsN, size)) {
    let unionMask = 0;
    for (const c of group) unionMask |= grid.candidatesOf(c);
    const unionDigits = digitsOf(unionMask);
    if (unionDigits.length !== size) continue;

    for (const z of unionDigits) {
      const nonZ = unionDigits.filter((d) => d !== z);
      const restricted = nonZ.every((d) => {
        const cellsWithD = group.filter((c) => grid.hasCandidate(c, d));
        if (cellsWithD.length < 2) return true;
        for (let i = 0; i < cellsWithD.length; i++) {
          for (let j = i + 1; j < cellsWithD.length; j++) {
            const ci = cellsWithD[i]!;
            const cj = cellsWithD[j]!;
            if (ROW_OF[ci] !== ROW_OF[cj] && COL_OF[ci] !== COL_OF[cj] && BOX_OF[ci] !== BOX_OF[cj]) {
              return false;
            }
          }
        }
        return true;
      });
      if (!restricted) continue;

      const cellsWithZ = group.filter((c) => grid.hasCandidate(c, z));
      const targets: number[] = [];
      for (let t = 0; t < CELLS; t++) {
        if (t === group[0]) continue;
        if (group.includes(t)) continue;
        if (grid.get(t) !== 0 || !grid.hasCandidate(t, z)) continue;
        const seesAllZ = cellsWithZ.every((c) => {
          return ROW_OF[c] === ROW_OF[t] || COL_OF[c] === COL_OF[t] || BOX_OF[c] === BOX_OF[t];
        });
        if (seesAllZ) targets.push(t);
      }
      if (targets.length === 0) continue;

      const wingName = size === 5 ? 'VWXYZ' : `Size${size}`;
      return {
        strategyId: 'vwxyz-wing',
        placements: [],
        eliminations: targets.map((t) => ({ cell: t, digit: z })),
        highlights: {
          cells: [...group, ...targets],
          candidates: [
            ...group.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...targets.map((t) => ({ cell: t, digit: z })),
          ],
          links: [],
        },
        explanation: {
          zh: `${wingName}-Wing：${size} 格 {${group.map((c) => cellLabel(c)).join(',')}} 含 ${size} 候选数 {${unionDigits.join(',')}}，非限制数字 ${z} 消去同时可见所有 ${z} 的格。`,
          en: `${wingName}-Wing: ${size} cells {${group.map((c) => cellLabel(c)).join(',')}} with ${size} candidates {${unionDigits.join(',')}}, non-restricted digit ${z} eliminates from cells seeing all ${z}.`,
        },
      };
    }
  }
  return null;
}

export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ 翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryGeneralWing(grid, 5);
  },
};