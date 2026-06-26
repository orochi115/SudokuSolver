import {
  PEERS_OF, maskOf, popcount, digitsOf, ROW_OF, COL_OF
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const bivalueCells: { cell: number; digits: [number, number] }[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) === 0) {
        const cands = digitsOf(grid.candidatesOf(c));
        if (cands.length === 2) {
          bivalueCells.push({ cell: c, digits: [cands[0]!, cands[1]!] });
        }
      }
    }

    for (const start of bivalueCells) {
      for (const Z of start.digits) {
        const hopDigit = start.digits[0] === Z ? start.digits[1] : start.digits[0];
        const visited = new Set<number>([start.cell]);
        const path = [start.cell];
        const leavingDigits = [hopDigit]; // leavingDigits[i] is assumed-true in path[i]

        const step = dfs(start.cell, hopDigit, Z);
        if (step) return step;

        function dfs(currentCell: number, currentDigit: number, endDigit: number): Step | null {
          if (path.length >= 14) return null;

          if (currentDigit === endDigit && path.length >= 3) {
            // Found a potential XY-Chain!
            const elims: CellDigit[] = [];
            const bit = maskOf(endDigit);
            const common = commonPeers(start.cell, currentCell);
            for (const cell of common) {
              if (!path.includes(cell) && grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit)) {
                elims.push({ cell, digit: endDigit });
              }
            }

            if (elims.length > 0) {
              const links: Link[] = [];
              for (let i = 0; i < path.length; i++) {
                const u = path[i]!;
                const dIn = i === 0 ? endDigit : leavingDigits[i - 1]!;
                const dOut = leavingDigits[i]!;
                // Inner strong link
                links.push({
                  from: { cell: u, digit: dIn },
                  to: { cell: u, digit: dOut },
                  type: 'strong',
                });
                if (i < path.length - 1) {
                  // Weak link between cell i and cell i+1 on dOut
                  const v = path[i + 1]!;
                  links.push({
                    from: { cell: u, digit: dOut },
                    to: { cell: v, digit: dOut },
                    type: 'weak',
                  });
                }
              }

              return {
                strategyId: 'xy-chain',
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...path, ...elims.map((e) => e.cell)],
                  candidates: [
                    ...path.flatMap((c) => {
                      const candsOfCell = bivalueCells.find((b) => b.cell === c)!.digits;
                      return [
                        { cell: c, digit: candsOfCell[0] },
                        { cell: c, digit: candsOfCell[1] },
                      ];
                    }),
                    ...elims,
                  ],
                  links,
                },
                explanation: {
                  zh: `XY 链：从格子 ${cellLabel(start.cell)} 的 ${endDigit} 开始，经过双值格链 ${path.map((c) => cellLabel(c)).join(' -> ')} 连到 ${cellLabel(currentCell)} 的 ${endDigit}；首尾必有一端为 ${endDigit}，消去共同能看到的格子中的 ${endDigit}。`,
                  en: `XY-Chain: starting with ${endDigit} at ${cellLabel(start.cell)} along bivalue cells ${path.map((c) => cellLabel(c)).join(' -> ')} to ${cellLabel(currentCell)} on ${endDigit}; at least one end must be ${endDigit}, eliminate ${endDigit} from common peers.`,
                },
              };
            }
          }

          const peers = PEERS_OF[currentCell]!;
          for (const peer of peers) {
            if (visited.has(peer)) continue;
            const peerBivalue = bivalueCells.find((b) => b.cell === peer);
            if (!peerBivalue) continue;
            if (peerBivalue.digits.includes(currentDigit)) {
              const nextDigit = peerBivalue.digits[0] === currentDigit ? peerBivalue.digits[1] : peerBivalue.digits[0];
              visited.add(peer);
              path.push(peer);
              leavingDigits.push(nextDigit);

              const res = dfs(peer, nextDigit, endDigit);
              if (res) return res;

              visited.delete(peer);
              path.pop();
              leavingDigits.pop();
            }
          }

          return null;
        }
      }
    }

    return null;
  },
};
