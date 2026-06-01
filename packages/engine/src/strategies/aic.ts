import { PEERS_OF, HOUSES, ROW_OF, COL_OF, SIZE, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface Node {
  cell: number;
  digit: number;
}

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'Alternating Inference Chain (AIC)' },
  difficulty: 70, // Suggested difficulty: 70 chains/AIC

  apply(grid: Grid): Step | null {
    const MAX_DEPTH = 10; // Max nodes in chain (9 transitions)

    // Collect all active candidate nodes in the grid
    const candidateNodes: Node[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) === 0) {
        const mask = grid.candidatesOf(cell);
        const digits = digitsOf(mask);
        for (const digit of digits) {
          candidateNodes.push({ cell, digit });
        }
      }
    }

    // Helper to get strong link neighbors
    function getStrongNeighbors(node: Node): Node[] {
      const neighbors: Node[] = [];
      const { cell, digit } = node;

      // 1. Same cell bivalue link
      if (popcount(grid.candidatesOf(cell)) === 2) {
        const digits = digitsOf(grid.candidatesOf(cell));
        const other = digits.find(d => d !== digit);
        if (other !== undefined) {
          neighbors.push({ cell, digit: other });
        }
      }

      // 2. Same digit conjugate link in houses
      for (const house of HOUSES) {
        if (house.includes(cell)) {
          const cellsWithDigit = house.filter(c => grid.get(c) === 0 && grid.hasCandidate(c, digit));
          if (cellsWithDigit.length === 2) {
            const otherCell = cellsWithDigit.find(c => c !== cell);
            if (otherCell !== undefined) {
              neighbors.push({ cell: otherCell, digit });
            }
          }
        }
      }

      return neighbors;
    }

    // Helper to get weak link neighbors
    function getWeakNeighbors(node: Node): Node[] {
      const neighbors: Node[] = [];
      const { cell, digit } = node;

      // 1. Same cell links to all other candidates
      const digits = digitsOf(grid.candidatesOf(cell));
      for (const other of digits) {
        if (other !== digit) {
          neighbors.push({ cell, digit: other });
        }
      }

      // 2. Same digit links to all peer cells
      for (const peer of PEERS_OF[cell]!) {
        if (grid.get(peer) === 0 && grid.hasCandidate(peer, digit)) {
          neighbors.push({ cell: peer, digit });
        }
      }

      return neighbors;
    }

    // DFS search function
    let resultStep: Step | null = null;
    const path: Node[] = [];
    const visited = new Set<string>();

    function dfs(curr: Node, isNextLinkStrong: boolean) {
      if (resultStep) return;

      // Check if we can make an elimination with current path
      if (path.length >= 4 && path.length % 2 === 0) {
        const n0 = path[0]!;
        const nK = path[path.length - 1]!;

        // 1. Discontinuous Loop (Placement)
        if (n0.cell === nK.cell && n0.digit === nK.digit) {
          // Both ends meet at the same candidate. Since both start and end links are strong:
          // if n0 is false, nK is true -> n0 is true. Contradiction, so n0 must be true!
          resultStep = {
            strategyId: 'aic',
            placements: [{ cell: n0.cell, digit: n0.digit }],
            eliminations: [],
            highlights: {
              cells: path.map(n => n.cell),
              candidates: path.map(n => ({ cell: n.cell, digit: n.digit })),
              links: buildLinks(path),
            },
            explanation: {
              zh: `通过交替推理链（AIC），首尾格子 R${ROW_OF[n0.cell]! + 1}C${COL_OF[n0.cell]! + 1} 的候选数 ${n0.digit} 产生不连续环冲突。因此该候选数必定为真。`,
              en: `Alternating Inference Chain (AIC) forms a discontinuous loop at R${ROW_OF[n0.cell]! + 1}C${COL_OF[n0.cell]! + 1} for candidate ${n0.digit}. Thus, this candidate must be true.`,
            },
          };
          return;
        }

        // 2. Type 1 AIC (Same digit, different cells)
        if (n0.digit === nK.digit && n0.cell !== nK.cell) {
          // If n0 and nK see each other, then any peer X containing digit can be eliminated
          const d = n0.digit;
          const commonPeers = PEERS_OF[n0.cell]!.filter(c => PEERS_OF[nK.cell]!.includes(c));
          const eliminations: CellDigit[] = [];
          for (const cell of commonPeers) {
            if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }
          // Also, if they are peers themselves, we can eliminate each other, but wait,
          // if they are peers, they also see each other, which is covered by commonPeers or direct elimination
          if (PEERS_OF[n0.cell]!.includes(nK.cell)) {
            // Wait, if they see each other, they are effectively a weak link, which is valid for Type 1
          }

          if (eliminations.length > 0) {
            resultStep = {
              strategyId: 'aic',
              placements: [],
              eliminations,
              highlights: {
                cells: Array.from(new Set([...path.map(n => n.cell), ...eliminations.map(e => e.cell)])),
                candidates: [
                  ...path.map(n => ({ cell: n.cell, digit: n.digit })),
                  ...eliminations,
                ],
                links: buildLinks(path),
              },
              explanation: {
                zh: `交替推理链（AIC）连接了 R${ROW_OF[n0.cell]! + 1}C${COL_OF[n0.cell]! + 1} 和 R${ROW_OF[nK.cell]! + 1}C${COL_OF[nK.cell]! + 1} 的候选数 ${d}。它们不能同时为假，因此可以消除它们共同可见格子中的候选数 ${d}。`,
                en: `Alternating Inference Chain (AIC) connects candidate ${d} at R${ROW_OF[n0.cell]! + 1}C${COL_OF[n0.cell]! + 1} and R${ROW_OF[nK.cell]! + 1}C${COL_OF[nK.cell]! + 1}. They cannot both be false, so ${d} can be eliminated from cells seeing both.`,
              },
            };
            return;
          }
        }

        // 3. Same cell, different digits (Type 1 Cell)
        if (n0.cell === nK.cell && n0.digit !== nK.digit) {
          // Since either n0 or nK must be true, no other candidate can be true in this cell
          const cell = n0.cell;
          const otherDigits = digitsOf(grid.candidatesOf(cell)).filter(d => d !== n0.digit && d !== nK.digit);
          const eliminations = otherDigits.map(d => ({ cell, digit: d }));
          if (eliminations.length > 0) {
            resultStep = {
              strategyId: 'aic',
              placements: [],
              eliminations,
              highlights: {
                cells: [cell],
                candidates: [
                  ...path.map(n => ({ cell: n.cell, digit: n.digit })),
                  ...eliminations,
                ],
                links: buildLinks(path),
              },
              explanation: {
                zh: `交替推理链（AIC）表明格子 R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} 的候选数 ${n0.digit} 和 ${nK.digit} 至少有一个为真。因此可以排除该格子的其他所有候选数。`,
                en: `Alternating Inference Chain (AIC) shows that either ${n0.digit} or ${nK.digit} in cell R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1} must be true. Thus, all other candidates in this cell can be eliminated.`,
              },
            };
            return;
          }
        }

        // 4. Type 2 AIC (Different cells, different digits)
        if (n0.cell !== nK.cell && n0.digit !== nK.digit) {
          // If n0 and nK see each other, then:
          // - n0.cell cannot contain nK.digit
          // - nK.cell cannot contain n0.digit
          if (PEERS_OF[n0.cell]!.includes(nK.cell)) {
            const eliminations: CellDigit[] = [];
            if (grid.hasCandidate(n0.cell, nK.digit)) {
              eliminations.push({ cell: n0.cell, digit: nK.digit });
            }
            if (grid.hasCandidate(nK.cell, n0.digit)) {
              eliminations.push({ cell: nK.cell, digit: n0.digit });
            }

            if (eliminations.length > 0) {
              resultStep = {
                strategyId: 'aic',
                placements: [],
                eliminations,
                highlights: {
                  cells: [n0.cell, nK.cell],
                  candidates: [
                    ...path.map(n => ({ cell: n.cell, digit: n.digit })),
                    ...eliminations,
                  ],
                  links: buildLinks(path),
                },
                explanation: {
                  zh: `交替推理链（AIC）连接了 R${ROW_OF[n0.cell]! + 1}C${COL_OF[n0.cell]! + 1} 上的 ${n0.digit} 和 R${ROW_OF[nK.cell]! + 1}C${COL_OF[nK.cell]! + 1} 上的 ${nK.digit}。因它们相互看见，可相互排除对角候选数。`,
                  en: `Alternating Inference Chain (AIC) connects ${n0.digit} at R${ROW_OF[n0.cell]! + 1}C${COL_OF[n0.cell]! + 1} and ${nK.digit} at R${ROW_OF[nK.cell]! + 1}C${COL_OF[nK.cell]! + 1}. Since they see each other, diagonal candidates can be eliminated.`,
                },
              };
              return;
            }
          }
        }
      }

      if (path.length >= MAX_DEPTH) return;

      if (isNextLinkStrong) {
        const strongs = getStrongNeighbors(curr);
        for (const next of strongs) {
          const key = `${next.cell}-${next.digit}`;
          if (!visited.has(key)) {
            visited.add(key);
            path.push(next);
            dfs(next, false);
            path.pop();
            visited.delete(key);
            if (resultStep) return;
          }
        }
      } else {
        const weaks = getWeakNeighbors(curr);
        for (const next of weaks) {
          const key = `${next.cell}-${next.digit}`;
          if (!visited.has(key)) {
            visited.add(key);
            path.push(next);
            dfs(next, true);
            path.pop();
            visited.delete(key);
            if (resultStep) return;
          }
        }
      }
    }

    function buildLinks(p: Node[]): Link[] {
      const links: Link[] = [];
      for (let i = 0; i < p.length - 1; i++) {
        links.push({
          from: { cell: p[i]!.cell, digit: p[i]!.digit },
          to: { cell: p[i + 1]!.cell, digit: p[i + 1]!.digit },
          type: i % 2 === 0 ? 'strong' : 'weak',
        });
      }
      return links;
    }

    // Try starting DFS from every candidate node with a strong link
    for (const start of candidateNodes) {
      const key = `${start.cell}-${start.digit}`;
      visited.add(key);
      path.push(start);
      // First link MUST be strong
      dfs(start, true);
      path.pop();
      visited.delete(key);
      if (resultStep) return resultStep;
    }

    return null;
  },
};
