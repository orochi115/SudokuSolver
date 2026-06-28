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

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼（守护者）', en: 'Broken Wing (Guardians)' },
  difficulty: 560,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);
      const candCells: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) candCells.push(c);
      }
      if (candCells.length < 5) continue;

      const adj = new Map<number, number[]>();
      for (const c of candCells) adj.set(c, []);

      for (let h = 0; h < HOUSES.length; h++) {
        const house = HOUSES[h]!;
        const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        if (inHouse.length === 2) {
          const [a, b] = inHouse;
          adj.get(a!)!.push(b!);
          adj.get(b!)!.push(a!);
        }
      }

      for (const start of candCells) {
        const result = findOddLoop(start, adj, 5);
        if (!result) continue;

        const { loop, imperfectHouses } = result;
        const loopSet = new Set(loop);
        const guardians: number[] = [];

        for (const h of imperfectHouses) {
          const house = HOUSES[h]!;
          for (const c of house) {
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) && !loopSet.has(c)) {
              if (!guardians.includes(c)) guardians.push(c);
            }
          }
        }

        if (guardians.length === 0) continue;

        if (guardians.length === 1) {
          const g = guardians[0]!;
          return {
            strategyId: this.id,
            placements: [{ cell: g, digit }],
            eliminations: [],
            highlights: {
              cells: [...loop, g],
              candidates: [...loop.map((c) => ({ cell: c, digit })), { cell: g, digit }],
              links: [],
            },
            explanation: {
              zh: `断翼：数字${digit}的奇数链（${loop.map(cellLabel).join('-')}）有唯一守护者${cellLabel(g)}；必须填入${digit}。`,
              en: `Broken Wing: odd loop on digit ${digit} (${loop.map(cellLabel).join('-')}) has sole guardian ${cellLabel(g)}; must place ${digit}.`,
            },
          };
        }

        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
          if (loopSet.has(c) || guardians.includes(c)) continue;
          const peers = new Set(PEERS_OF[c]!);
          if (guardians.every((g) => peers.has(g))) {
            elims.push({ cell: c, digit });
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...loop, ...guardians, ...elims.map((e) => e.cell)],
              candidates: [
                ...loop.map((c) => ({ cell: c, digit })),
                ...guardians.map((c) => ({ cell: c, digit })),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `断翼：数字${digit}的奇数链有守护者${guardians.map(cellLabel).join(',')}; 消去同时看到所有守护者的格中的${digit}。`,
              en: `Broken Wing: odd loop on ${digit} with guardians ${guardians.map(cellLabel).join(',')}; eliminate ${digit} from cells seeing all guardians.`,
            },
          };
        }
      }
    }
    return null;
  },
};

function findOddLoop(
  start: number, adj: Map<number, number[]>, maxLen: number,
): { loop: number[]; imperfectHouses: number[] } | null {
  const path: number[] = [start];
  const visited = new Set([start]);

  function dfs(depth: number): number[] | null {
    if (depth >= 5) {
      const cur = path[path.length - 1]!;
      if (adj.get(cur)!.includes(start)) return [...path];
      return null;
    }
    const cur = path[path.length - 1]!;
    for (const next of adj.get(cur)!) {
      if (next === start && depth >= 4) return [...path];
      if (visited.has(next)) continue;
      visited.add(next);
      path.push(next);
      const result = dfs(depth + 1);
      if (result) return result;
      path.pop();
      visited.delete(next);
    }
    return null;
  }

  const loop = dfs(1);
  if (!loop) return null;

  const imperfectHouses: number[] = [];
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h]!;
    const loopInHouse = loop.filter((c) => house.includes(c));
    if (loopInHouse.length < 2) continue;
    const allInHouse = house.filter((c) => {
      const bit = 1 << (1 - 1);
      return false;
    });
  }

  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]!;
    const b = loop[(i + 1) % loop.length]!;
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      if (!house.includes(a) || !house.includes(b)) continue;
      const count = house.filter((c) => {
        for (const lc of loop) {
          if (lc === c) return true;
        }
        return false;
      }).length;
      if (count > 2 && !imperfectHouses.includes(h)) {
        imperfectHouses.push(h);
      }
    }
  }

  return { loop, imperfectHouses };
}
