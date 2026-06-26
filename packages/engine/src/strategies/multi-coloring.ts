import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function buildConjugatePairs(grid: Grid, d: number): Map<number, number[]> {
  const bit = maskOf(d);
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  return adj;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function tryMultiColoring(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const adj = buildConjugatePairs(grid, d);
    const visited = new Set<number>();
    const clusters: Array<{ a: number[]; b: number[] }> = [];

    for (const start of adj.keys()) {
      if (visited.has(start)) continue;
      const color = new Map<number, 0 | 1>();
      const queue: Array<{ cell: number; c: 0 | 1 }> = [{ cell: start, c: 0 }];
      visited.add(start);
      color.set(start, 0);

      while (queue.length > 0) {
        const { cell, c } = queue.shift()!;
        for (const nb of adj.get(cell) ?? []) {
          if (visited.has(nb)) continue;
          visited.add(nb);
          const nc = (1 - c) as 0 | 1;
          color.set(nb, nc);
          queue.push({ cell: nb, c: nc });
        }
      }

      if (color.size >= 3) {
        const groupA: number[] = [];
        const groupB: number[] = [];
        for (const [cell, c] of color) {
          if (c === 0) groupA.push(cell); else groupB.push(cell);
        }
        clusters.push({ a: groupA, b: groupB });
      }
    }

    if (clusters.length < 2) continue;
    const bit = maskOf(d);

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const c1 = clusters[i]!;
        const c2 = clusters[j]!;

        let weakLinkFound = false;
        let weakA: number[] = [];
        let weakB: number[] = [];
        for (const c1cell of [...c1.a, ...c1.b]) {
          for (const c2cell of [...c2.a, ...c2.b]) {
            if (PEERS_OF[c1cell]!.includes(c2cell)) {
              weakLinkFound = true;
              const c1color = c1.a.includes(c1cell) ? 0 : 1;
              const c2color = c2.a.includes(c2cell) ? 0 : 1;
              weakA = c1color === 0 ? c1.b : c1.a;
              weakB = c2color === 0 ? c2.b : c2.a;
              break;
            }
          }
          if (weakLinkFound) break;
        }
        if (!weakLinkFound) continue;

        const eliminations: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & bit)) continue;
          if ([...c1.a, ...c1.b, ...c2.a, ...c2.b].includes(c)) continue;
          const peers = new Set(PEERS_OF[c]!);
          const seesWeakA = weakA.some((x) => peers.has(x));
          const seesWeakB = weakB.some((x) => peers.has(x));
          if (seesWeakA && seesWeakB) {
            eliminations.push({ cell: c, digit: d });
          }
        }

        if (eliminations.length > 0) {
          const allClusterCells = [...new Set([...c1.a, ...c1.b, ...c2.a, ...c2.b])];
          const links: Link[] = [];
          const seen = new Set<string>();
          for (const house of HOUSES) {
            const cands = house.filter((c) => allClusterCells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
            if (cands.length !== 2) continue;
            const key = `${Math.min(cands[0]!, cands[1]!)}-${Math.max(cands[0]!, cands[1]!)}`;
            if (!seen.has(key)) {
              seen.add(key);
              links.push({
                from: { cell: cands[0]!, digit: d },
                to: { cell: cands[1]!, digit: d },
                type: 'strong',
              });
            }
          }

          return {
            strategyId: 'multi-coloring',
            placements: [],
            eliminations,
            highlights: {
              cells: [...allClusterCells, ...eliminations.map((e) => e.cell)],
              candidates: [...allClusterCells.filter((c) => grid.hasCandidate(c, d)).map((c) => ({ cell: c, digit: d })), ...eliminations],
              links,
            },
            explanation: {
              zh: `多重染色（Type 1）：数字 ${d} 的两组强链通过弱链连接；同时看到两组反色的格消去 ${d}。`,
              en: `Multi-Coloring (Type 1): digit ${d} has two clusters connected by weak link; cells seeing both opposite colors eliminate ${d}.`,
            },
          };
        }

        for (const colorGroup of [c1.a, c1.b]) {
          if (colorGroup.length < 2) continue;
          for (let k = 0; k < colorGroup.length; k++) {
            for (let l = k + 1; l < colorGroup.length; l++) {
              const ck = colorGroup[k]!;
              const cl = colorGroup[l]!;
              const seesA2 = c2.a.some((ca) => PEERS_OF[ck]!.includes(ca));
              const seesB2 = c2.b.some((cb) => PEERS_OF[cl]!.includes(cb));
              if (seesA2 && seesB2) {
                const opposite = colorGroup === c1.a ? c1.b : c1.a;
                const placements = opposite
                  .filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, d))
                  .map((c) => ({ cell: c, digit: d }));
                const allClusterCells = [...new Set([...c1.a, ...c1.b, ...c2.a, ...c2.b])];

                if (placements.length > 0) {
                  return {
                    strategyId: 'multi-coloring',
                    placements,
                    eliminations: [],
                    highlights: {
                      cells: allClusterCells,
                      candidates: allClusterCells.filter((c) => grid.hasCandidate(c, d)).map((c) => ({ cell: c, digit: d })),
                      links: [],
                    },
                    explanation: {
                      zh: `多重染色（Type 2）：${cellLabel(ck)} 和 ${cellLabel(cl)} 为同色且分别看到另一簇的不同色；该色全假，另一色全真，填入 ${placements.map((p) => cellLabel(p.cell)).join(',')}。`,
                      en: `Multi-Coloring (Type 2): ${cellLabel(ck)} and ${cellLabel(cl)} same color see opposite colors of other cluster; that whole color is false, the other is true; place ${placements.map((p) => cellLabel(p.cell)).join(',')}.`,
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
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    return tryMultiColoring(grid);
  },
};