import { ROWS, COLS, ROW_OF, COL_OF, PEERS_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function tryBrokenWing(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);

    const strongLinks: { c1: number; c2: number; house: number }[] = [];

    for (let h = 0; h < 18; h++) {
      const house = h < 9 ? ROWS[h]! : COLS[h - 9]!;
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length === 2) {
        strongLinks.push({ c1: cands[0]!, c2: cands[1]!, house: h });
      }
    }

    if (strongLinks.length < 3) continue;

    const adj = new Map<number, number[]>();
    const edgeSet = new Set<string>();

    for (const link of strongLinks) {
      const key = `${Math.min(link.c1, link.c2)}-${Math.max(link.c1, link.c2)}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);

      if (!adj.has(link.c1)) adj.set(link.c1, []);
      if (!adj.has(link.c2)) adj.set(link.c2, []);
      adj.get(link.c1)!.push(link.c2);
      adj.get(link.c2)!.push(link.c1);
    }

    const visited = new Set<number>();
    for (const start of adj.keys()) {
      if (visited.has(start)) continue;

      const path: number[] = [start];
      visited.add(start);

      function dfs(current: number): number[][] {
        const cycles: number[][] = [];
        for (const next of adj.get(current) ?? []) {
          if (next === path[0]! && path.length >= 4 && path.length % 2 === 1) {
            cycles.push([...path]);
            continue;
          }
          if (visited.has(next)) continue;
          visited.add(next);
          path.push(next);
          const found = dfs(next);
          path.pop();
          visited.delete(next);
          cycles.push(...found);
        }
        return cycles;
      }

      const cycles = dfs(start);

      for (const cycle of cycles) {
        const degree = new Map<number, number>();
        for (const c of cycle) degree.set(c, (degree.get(c) ?? 0) + 1);

        const oddNodes = [...degree.entries()].filter(([, count]) => count % 2 === 1);
        if (oddNodes.length === 0) continue;

        const guardians = oddNodes.map(([c]) => c);

        if (guardians.length === 1) {
          return {
            strategyId: 'broken-wing',
            placements: [{ cell: guardians[0]!, digit: d }],
            eliminations: [],
            highlights: {
              cells: [...cycle, guardians[0]!],
              candidates: cycle.filter((c) => grid.hasCandidate(c, d)).map((c) => ({ cell: c, digit: d })),
              links: [],
            },
            explanation: {
              zh: `Broken Wing（奇数环）：数字 ${d} 的奇数环中唯一守护格 ${cellLabel(guardians[0]!)} 必须为 ${d}。`,
              en: `Broken Wing: digit ${d} has an odd-cycle with sole guardian ${cellLabel(guardians[0]!)}; must place ${d}.`,
            },
          };
        }

        const commonPeers = guardians.reduce<Set<number> | null>((acc, gc) => {
          const s = new Set(PEERS_OF[gc]!);
          return acc === null ? s : new Set([...acc].filter((x) => s.has(x)));
        }, null);

        if (commonPeers) {
          const eliminations: { cell: number; digit: number }[] = [];
          for (const p of commonPeers) {
            if (cycle.includes(p)) continue;
            if (grid.hasCandidate(p, d)) eliminations.push({ cell: p, digit: d });
          }
          if (eliminations.length > 0) {
            return {
              strategyId: 'broken-wing',
              placements: [],
              eliminations,
              highlights: {
                cells: [...cycle, ...eliminations.map((e) => e.cell)],
                candidates: [
                  ...cycle.filter((c) => grid.hasCandidate(c, d)).map((c) => ({ cell: c, digit: d })),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `Broken Wing（多守护格）：数字 ${d} 的奇数环中守护格 ${guardians.map((c) => cellLabel(c)).join(',')} 必有一处为 ${d}；消去同时可见所有守护格的格中的 ${d}。`,
                en: `Broken Wing: digit ${d} odd-cycle guardians ${guardians.map((c) => cellLabel(c)).join(',')} share a common peer; eliminate ${d} from it.`,
              },
            };
          }
        }
      }
    }
  }

  return null;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    return tryBrokenWing(grid);
  },
};