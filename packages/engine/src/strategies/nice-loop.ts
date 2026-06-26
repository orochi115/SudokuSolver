import {
  HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, chainToLinks, type LinkGraph } from '../chain/graph.js';
import type { LinkType } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function collectContinuousLoopEliminations(
  grid: Grid,
  graph: LinkGraph,
  path: number[],
  linkTypes: LinkType[],
): CellDigit[] {
  const elims: CellDigit[] = [];
  const elimSet = new Set<string>();

  function addElim(cell: number, digit: number) {
    if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
      const key = `${cell}:${digit}`;
      if (!elimSet.has(key)) {
        elimSet.add(key);
        elims.push({ cell, digit });
      }
    }
  }

  // All cells on the loop per digit
  const loopCellsByDigit = new Map<number, Set<number>>();
  for (const nodeIdx of path) {
    const node = graph.nodes[nodeIdx]!;
    if (!loopCellsByDigit.has(node.digit)) {
      loopCellsByDigit.set(node.digit, new Set());
    }
    for (const c of node.cells) {
      loopCellsByDigit.get(node.digit)!.add(c);
    }
  }

  // Iterate over weak links on the loop
  for (let i = 0; i < path.length - 1; i++) {
    if (linkTypes[i] === 'weak') {
      const uIdx = path[i]!;
      const vIdx = path[i + 1]!;
      const u = graph.nodes[uIdx]!;
      const v = graph.nodes[vIdx]!;

      if (u.digit === v.digit) {
        const digit = u.digit;
        const loopCells = loopCellsByDigit.get(digit)!;
        for (const h of HOUSES) {
          const uInHouse = u.cells.every(c => h.includes(c));
          const vInHouse = v.cells.every(c => h.includes(c));
          if (uInHouse && vInHouse) {
            for (const cell of h) {
              if (!loopCells.has(cell)) {
                addElim(cell, digit);
              }
            }
          }
        }
      } else {
        // In-cell weak link: u.digit !== v.digit. Since they are linked, they must share a cell C.
        if (u.cells.length === 1 && v.cells.length === 1 && u.cells[0] === v.cells[0]) {
          const cell = u.cells[0]!;
          for (let d = 1; d <= 9; d++) {
            if (d !== u.digit && d !== v.digit) {
              addElim(cell, d);
            }
          }
        }
      }
    }
  }

  return elims;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const n = graph.nodes.length;
    const maxLen = 14;

    for (let s = 0; s < n; s++) {
      const startNode = graph.nodes[s]!;
      // Nice Loops are searched for single-cell nodes or group nodes.
      // Let's do DFS starting with 'strong' and 'weak' links
      const path: number[] = [s];
      const linkTypes: LinkType[] = [];
      const visited = new Set<number>([s]);

      const result = dfs(s, 'strong') || dfs(s, 'weak');
      if (result) return result;

      function dfs(u: number, nextType: LinkType): Step | null {
        if (path.length > maxLen) return null;

        // Try to close loop to start node s
        for (const edge of graph.adjacency[u]!) {
          if (edge.to === s && edge.type === nextType && path.length >= 4) {
            const tLast = edge.type;
            const t0 = linkTypes[0]!;
            const tPrev = linkTypes[linkTypes.length - 1]!;

            if (tLast !== tPrev) {
              const fullPath = [...path, s];
              const fullLinks = [...linkTypes, tLast];

              if (tLast !== t0) {
                // Continuous loop (must be even length)
                if (fullPath.length % 2 === 1) { // L is even, so path of nodes L+1 has odd count
                  const elims = collectContinuousLoopEliminations(grid, graph, fullPath, fullLinks);
                  if (elims.length > 0) {
                    const links = chainToLinks(graph, fullPath.map((node, i) => ({ node, incoming: i === 0 ? null : fullLinks[i - 1]! })));
                    return {
                      strategyId: 'nice-loop',
                      placements: [],
                      eliminations: elims,
                      highlights: {
                        cells: [...new Set(fullPath.flatMap(nodeIdx => graph.nodes[nodeIdx]!.cells))],
                        candidates: [
                          ...fullPath.flatMap(nodeIdx => {
                            const node = graph.nodes[nodeIdx]!;
                            return node.cells.map(c => ({ cell: c, digit: node.digit }));
                          }),
                          ...elims,
                        ],
                        links,
                      },
                      explanation: {
                        zh: `连续 Nice 环：首尾相连的交替推理链。每个弱链对应的区域中，非环上的候选数均可消除。消去：${elims.map(e => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join(', ')}。`,
                        en: `Continuous Nice Loop: closed alternating chain. Eliminate candidates outside the loop sharing a weak-link unit. Eliminate: ${elims.map(e => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join(', ')}.`,
                      },
                    };
                  }
                }
              } else {
                // Discontinuous loop at s
                if (t0 === 'strong') {
                  // Rule 2: two strong links meet at s. Place s.
                  if (startNode.cells.length === 1) {
                    const cell = startNode.cells[0]!;
                    const digit = startNode.digit;
                    if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                      const otherCands: CellDigit[] = [];
                      for (let d = 1; d <= 9; d++) {
                        if (d !== digit && grid.hasCandidate(cell, d)) {
                          otherCands.push({ cell, digit: d });
                        }
                      }
                      if (otherCands.length > 0) {
                        const links = chainToLinks(graph, fullPath.map((node, i) => ({ node, incoming: i === 0 ? null : fullLinks[i - 1]! })));
                        return {
                          strategyId: 'nice-loop',
                          placements: [{ cell, digit }],
                          eliminations: otherCands,
                          highlights: {
                            cells: [...new Set([...fullPath.flatMap(nodeIdx => graph.nodes[nodeIdx]!.cells), cell])],
                            candidates: [
                              ...fullPath.flatMap(nodeIdx => {
                                const node = graph.nodes[nodeIdx]!;
                                return node.cells.map(c => ({ cell: c, digit: node.digit }));
                              }),
                              ...otherCands,
                            ],
                            links,
                          },
                          explanation: {
                            zh: `不连续 Nice 环（Rule 2）：在 ${cellLabel(cell)} 的 ${digit} 处由两条强链交汇；强制在该格填入 ${digit}（消除其他候选数）。`,
                            en: `Discontinuous Nice Loop (Rule 2): two strong links meet at ${cellLabel(cell)} on ${digit}; place ${digit} in ${cellLabel(cell)}.`,
                          },
                        };
                      }
                    }
                  }
                } else {
                  // Rule 3: two weak links meet at s. Eliminate s.
                  if (startNode.cells.length === 1) {
                    const cell = startNode.cells[0]!;
                    const digit = startNode.digit;
                    if (grid.get(cell) === 0 && grid.hasCandidate(cell, digit)) {
                      const links = chainToLinks(graph, fullPath.map((node, i) => ({ node, incoming: i === 0 ? null : fullLinks[i - 1]! })));
                      return {
                        strategyId: 'nice-loop',
                        placements: [],
                        eliminations: [{ cell, digit }],
                        highlights: {
                          cells: [...new Set([...fullPath.flatMap(nodeIdx => graph.nodes[nodeIdx]!.cells), cell])],
                          candidates: [
                            ...fullPath.flatMap(nodeIdx => {
                              const node = graph.nodes[nodeIdx]!;
                              return node.cells.map(c => ({ cell: c, digit: node.digit }));
                            }),
                            { cell, digit },
                          ],
                          links,
                        },
                        explanation: {
                          zh: `不连续 Nice 环（Rule 3）：在 ${cellLabel(cell)} 的 ${digit} 处由两条弱链交汇；消除在该格的候选数 ${digit}。`,
                          en: `Discontinuous Nice Loop (Rule 3): two weak links meet at ${cellLabel(cell)} on ${digit}; eliminate ${digit} from ${cellLabel(cell)}.`,
                        },
                      };
                    }
                  }
                }
              }
            }
          }
        }

        // Try to continue path
        for (const edge of graph.adjacency[u]!) {
          if (edge.type === nextType && !visited.has(edge.to)) {
            visited.add(edge.to);
            path.push(edge.to);
            linkTypes.push(edge.type);

            const res = dfs(edge.to, nextType === 'strong' ? 'weak' : 'strong');
            if (res) return res;

            visited.delete(edge.to);
            path.pop();
            linkTypes.pop();
          }
        }

        return null;
      }
    }

    return null;
  },
};
