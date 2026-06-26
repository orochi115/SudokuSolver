import { CELLS, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

const MAX_DEPTH = 10;

function searchXYChain(grid: Grid): Step | null {
  for (let startCell = 0; startCell < CELLS; startCell++) {
    if (grid.get(startCell) !== 0) continue;
    const startMask = grid.candidatesOf(startCell);
    if (popcount(startMask) !== 2) continue;
    const startDigits = digitsOf(startMask);
    if (startDigits.length !== 2) continue;

    for (const z of startDigits) {
      const a = startDigits.find((d) => d !== z)!;
      const path: { cell: number; digit: number }[] = [
        { cell: startCell, digit: z },
        { cell: startCell, digit: a },
      ];

      function buildStep(endCell: number, zDigit: number, pathCopy: { cell: number; digit: number }[]): Step {
        const sharedPeers = commonPeers(startCell, endCell).filter(
          (cp) => cp !== startCell && cp !== endCell && grid.hasCandidate(cp, zDigit),
        );
        const links: Link[] = [];
        for (let i = 0; i < pathCopy.length - 1; i++) {
          links.push({
            from: { cell: pathCopy[i]!.cell, digit: pathCopy[i]!.digit },
            to: { cell: pathCopy[i + 1]!.cell, digit: pathCopy[i + 1]!.digit },
            type: i % 2 === 0 ? 'strong' : 'weak',
          });
        }
        return {
          strategyId: 'xy-chain',
          placements: [],
          eliminations: sharedPeers.map((cp) => ({ cell: cp, digit: zDigit })),
          highlights: {
            cells: [...new Set([...pathCopy.map((p) => p.cell), ...sharedPeers])],
            candidates: [...pathCopy, ...sharedPeers.map((cp) => ({ cell: cp, digit: zDigit }))],
            links,
          },
          explanation: {
            zh: `XY链：从 ${cellLabel(startCell)} 的 ${zDigit} 起，沿双值格链传至 ${cellLabel(endCell)} 的 ${zDigit}；两端至少其一为 ${zDigit}，消除同时可见两端的格中的 ${zDigit}。`,
            en: `XY-Chain: from ${cellLabel(startCell)}(${zDigit}) along bivalue cells to ${cellLabel(endCell)}(${zDigit}); eliminate ${zDigit} from peers of both ends.`,
          },
        };
      }

      function dfs(cell: number, hopDigit: number): Step | null {
        if (path.length >= MAX_DEPTH * 2) return null;

        const neighbors: number[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (c === cell || c === startCell || path.some((p) => p.cell === c)) continue;
          if (grid.get(c) !== 0) continue;
          if (!PEERS_OF[cell]!.includes(c)) continue;
          if (!grid.hasCandidate(c, hopDigit)) continue;
          if (popcount(grid.candidatesOf(c)) !== 2) continue;
          neighbors.push(c);
        }

        for (const nextCell of neighbors) {
          const nextMask = grid.candidatesOf(nextCell);
          const nextDigits = digitsOf(nextMask);
          if (nextDigits.length !== 2) continue;
          const otherDigit = nextDigits[0] === hopDigit ? nextDigits[1]! : nextDigits[0]!;

          path.push({ cell: nextCell, digit: hopDigit });
          path.push({ cell: nextCell, digit: otherDigit });

          if (otherDigit === z && path.length >= 4) {
            const pathCopy = [...path];
            path.pop();
            path.pop();
            const step = buildStep(nextCell, z, pathCopy);
            if (step.eliminations.length > 0) return step;
            continue;
          }

          const result = dfs(nextCell, otherDigit);
          path.pop();
          path.pop();
          if (result) return result;
        }

        return null;
      }

      const result = dfs(startCell, a);
      if (result) return result;
    }
  }
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY 链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid: Grid): Step | null {
    return searchXYChain(grid);
  },
};