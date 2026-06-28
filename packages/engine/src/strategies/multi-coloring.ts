import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  maskOf, digitsOf, PEERS_OF,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface Cluster {
  color0: number[];
  color1: number[];
  cells: Set<number>;
  byColor: Map<number, 0 | 1>;
}

function buildCluster(grid: Grid, d: number): Cluster[] {
  const bit = maskOf(d);
  const adj = new Map<number, number[]>();
  for (const house of HOUSES) {
    const cands = house.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  const visited = new Set<number>();
  const result: Cluster[] = [];

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const byColor = new Map<number, 0 | 1>();
    const queue: { cell: number; color: 0 | 1 }[] = [{ cell: start, color: 0 }];
    visited.add(start);
    byColor.set(start, 0);
    let conflict = false;

    while (queue.length > 0 && !conflict) {
      const { cell, color } = queue.shift()!;
      for (const neighbor of adj.get(cell) ?? []) {
        if (byColor.has(neighbor)) {
          if (byColor.get(neighbor) === color) {
            conflict = true;
            break;
          }
          continue;
        }
        visited.add(neighbor);
        byColor.set(neighbor, (1 - color) as 0 | 1);
        queue.push({ cell: neighbor, color: (1 - color) as 0 | 1 });
      }
    }

    if (conflict || byColor.size < 2) continue;

    const color0: number[] = [];
    const color1: number[] = [];
    for (const [c, col] of byColor) {
      if (col === 0) color0.push(c);
      else color1.push(c);
    }

    result.push({ color0, color1, cells: new Set(byColor.keys()), byColor });
  }

  return result;
}

function sameHouse(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const clusters = buildCluster(grid, d);
      if (clusters.length === 0) continue;

      let result = tryColorTrap(grid, d, clusters, bit);
      if (result) return result;

      result = tryInterChain(grid, d, clusters, bit);
      if (result) return result;

      // result = tryWrap(grid, d, clusters, bit);
      // if (result) return result;
    }
    return null;
  },
};

function tryColorTrap(grid: Grid, d: number, clusters: Cluster[], bit: number): Step | null {
  const allCells = new Set<number>();
  for (const cl of clusters) for (const c of cl.cells) allCells.add(c);

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (!(grid.candidatesOf(c) & bit)) continue;
    if (allCells.has(c)) continue;

    const cPeers = new Set(PEERS_OF[c]!);
    for (const cl of clusters) {
      if (cl.color0.some(x => cPeers.has(x)) && cl.color1.some(x => cPeers.has(x))) {
        return {
          strategyId: 'multi-coloring',
          placements: [],
          eliminations: [{ cell: c, digit: d }],
          highlights: {
            cells: [...cl.cells, c],
            candidates: [
              ...[...cl.cells].map(cc => ({ cell: cc, digit: d })),
              { cell: c, digit: d },
            ],
            links: [],
          },
          explanation: {
            zh: `多重染色（颜色陷阱）：数字 ${d} 的染色簇中，${cellLabel(c)} 同时看到两种颜色→消去该格的 ${d}。`,
            en: `Multi-Coloring (Color Trap): digit ${d}'s cluster; ${cellLabel(c)} sees both colors → eliminate ${d}.`,
          },
        };
      }
    }
  }
  return null;
}

function tryInterChain(grid: Grid, d: number, clusters: Cluster[], bit: number): Step | null {
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i]!;
      const b = clusters[j]!;

      let weakLink = false;
      for (const ai of a.color0) {
        for (const bj of b.color0) {
          if (PEERS_OF[ai]!.includes(bj)) { weakLink = true; break; }
        }
        if (weakLink) break;
      }
      if (!weakLink) {
        for (const ai of a.color1) {
          for (const bj of b.color1) {
            if (PEERS_OF[ai]!.includes(bj)) { weakLink = true; break; }
          }
          if (weakLink) break;
        }
      }
      if (!weakLink) continue;

      const eliminations: CellDigit[] = [];
      const elimSet = new Set<string>();

      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        if (!(grid.candidatesOf(c) & bit)) continue;
        if (a.cells.has(c) || b.cells.has(c)) continue;

        const cPeers = new Set(PEERS_OF[c]!);
        if (a.color1.some(x => cPeers.has(x)) && b.color1.some(x => cPeers.has(x))) {
          const key = `${c},${d}`;
          if (!elimSet.has(key)) {
            elimSet.add(key);
            eliminations.push({ cell: c, digit: d });
          }
        }
      }

      if (eliminations.length > 0) {
        return {
          strategyId: 'multi-coloring',
          placements: [],
          eliminations,
          highlights: {
            cells: [...new Set([...a.cells, ...b.cells, ...eliminations.map(e => e.cell)])],
            candidates: [
              ...[...a.cells, ...b.cells].map(c => ({ cell: c, digit: d })),
              ...eliminations,
            ],
            links: [],
          },
          explanation: {
            zh: `多重染色：数字 ${d} 的 ${i+1}#和${j+1}#颜色簇弱链连接；某格同时看到两簇异色→消去该格的 ${d}。`,
            en: `Multi-Coloring: digit ${d}'s clusters ${i+1} and ${j+1} weakly linked; a cell sees both clusters' opposite colors → eliminate ${d}.`,
          },
        };
      }
    }
  }
  return null;
}

function tryWrap(grid: Grid, d: number, clusters: Cluster[], bit: number): Step | null {
  for (const cl of clusters) {
    for (let ci = 0; ci < 2; ci++) {
      const testColor = ci === 0 ? cl.color0 : cl.color1;
      const otherColor = ci === 0 ? cl.color1 : cl.color0;

      let contradiction = false;

      for (let i = 0; i < testColor.length && !contradiction; i++) {
        for (let j = i + 1; j < testColor.length && !contradiction; j++) {
          if (sameHouse(testColor[i]!, testColor[j]!)) {
            contradiction = true;
          }
        }
      }

      if (!contradiction) {
        for (const cell of testColor) {
          for (const houseIdx of [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!]) {
            const house = HOUSES[houseIdx]!;
            const otherInHouse = otherColor.filter(c => house.includes(c));
            if (otherInHouse.length === 0) continue;

            let allDigitCandidatesInOther = true;
            for (const hc of house) {
              if (hc === cell) continue;
              if (grid.get(hc) !== 0 && grid.get(hc) === d) continue;
              if (grid.get(hc) === 0 && (grid.candidatesOf(hc) & bit) !== 0) {
                if (!otherInHouse.includes(hc) && !cl.cells.has(hc)) {
                  allDigitCandidatesInOther = false;
                  break;
                }
              }
            }

            if (allDigitCandidatesInOther) {
              contradiction = true;
              break;
            }
          }
          if (contradiction) break;
        }
      }

      if (!contradiction) continue;

      const placements: CellDigit[] = [];
      for (const oc of otherColor) {
        if (grid.hasCandidate(oc, d)) {
          placements.push({ cell: oc, digit: d });
        }
      }

      if (placements.length === 0) continue;

      const eliminations: CellDigit[] = [];
      if (placements.length > 0) {
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (!(grid.candidatesOf(c) & bit)) continue;
          if (cl.cells.has(c)) continue;
          const cPeers = new Set(PEERS_OF[c]!);
          if (otherColor.some(x => cPeers.has(x))) {
            eliminations.push({ cell: c, digit: d });
          }
        }
      }

      return {
        strategyId: 'multi-coloring',
        placements,
        eliminations,
        highlights: {
          cells: [...new Set([...cl.cells, ...placements.map(p => p.cell), ...eliminations.map(e => e.cell)])],
          candidates: [
            ...[...cl.cells].map(c => ({ cell: c, digit: d })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `X-Colors（包裹）：数字 ${d} 的染色簇中一色导致矛盾，另一色全真；填入 ${placements.map(p => cellLabel(p.cell) + '=' + d).join('、')}。`,
          en: `X-Colors (Wrap): digit ${d}'s cluster, one color leads to contradiction; the other is true; place ${placements.map(p => cellLabel(p.cell) + '=' + d).join(', ')}.`,
        },
      };
    }
  }
  return null;
}