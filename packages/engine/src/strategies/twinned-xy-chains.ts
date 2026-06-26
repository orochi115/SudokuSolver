import { CELLS, PEERS_OF, ROW_OF, COL_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function searchTwinnedChains(grid: Grid): Step | null {
  for (let start = 0; start < CELLS; start++) {
    if (grid.get(start) !== 0) continue;
    const startMask = grid.candidatesOf(start);
    if (popcount(startMask) !== 2) continue;
    const startDigits = digitsOf(startMask);
    const z = startDigits[0]!;
    const a = startDigits[1]!;

    const path1: { cell: number; digit: number }[] = [
      { cell: start, digit: z },
      { cell: start, digit: a },
    ];

    const endCandidates: { cell: number; digit: number; path: { cell: number; digit: number }[] }[] = [];

    function dfs(cell: number, hopDigit: number, path: { cell: number; digit: number }[]): void {
      if (path.length >= 20) return;

      const neighbors: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (c === cell || c === start || path.some((p) => p.cell === c)) continue;
        if (grid.get(c) !== 0) continue;
        if (!PEERS_OF[cell]!.includes(c)) continue;
        if (!grid.hasCandidate(c, hopDigit)) continue;
        if (popcount(grid.candidatesOf(c)) !== 2) continue;
        neighbors.push(c);
      }

      for (const nextCell of neighbors) {
        const nextDigits = digitsOf(grid.candidatesOf(nextCell));
        const otherDigit = nextDigits[0] === hopDigit ? nextDigits[1]! : nextDigits[0]!;
        path.push({ cell: nextCell, digit: hopDigit });
        path.push({ cell: nextCell, digit: otherDigit });

        if (otherDigit === z && path.length >= 4) {
          endCandidates.push({ cell: nextCell, digit: z, path: [...path] });
        } else {
          dfs(nextCell, otherDigit, path);
        }
        path.pop();
        path.pop();
      }
    }

    dfs(start, a, path1);

    for (const end1 of endCandidates) {
      for (const end2 of endCandidates) {
        if (end1.cell === end2.cell) continue;
        if (end1.digit !== end2.digit) continue;
        const d = end1.digit;
        const sharedPeers = commonPeers(end1.cell, end2.cell).filter(
          (cp) => cp !== start && cp !== end1.cell && cp !== end2.cell && grid.hasCandidate(cp, d),
        );
        if (sharedPeers.length === 0) continue;

        const fullPath = [...end1.path.slice(0, -1), ...end2.path.slice(1)];
        const links: Link[] = [];
        for (let i = 0; i < fullPath.length - 1; i++) {
          links.push({
            from: { cell: fullPath[i]!.cell, digit: fullPath[i]!.digit },
            to: { cell: fullPath[i + 1]!.cell, digit: fullPath[i + 1]!.digit },
            type: i % 2 === 0 ? 'strong' : 'weak',
          });
        }

        return {
          strategyId: 'twinned-xy-chains',
          placements: [],
          eliminations: sharedPeers.map((cp) => ({ cell: cp, digit: d })),
          highlights: {
            cells: [...new Set([...fullPath.map((p) => p.cell), ...sharedPeers])],
            candidates: [
              ...fullPath,
              ...sharedPeers.map((cp) => ({ cell: cp, digit: d })),
            ],
            links,
          },
          explanation: {
            zh: `孪生 XY 链：起点 ${cellLabel(start)} 的值 ${z} 沿两条双值链传至 ${cellLabel(end1.cell)} 和 ${cellLabel(end2.cell)} 的 ${d}；消除公共影响格的 ${d}。`,
            en: `Twinned XY-Chains: ${cellLabel(start)}'s digit ${z} propagates along two bivalue paths to ${cellLabel(end1.cell)} and ${cellLabel(end2.cell)}'s ${d}; eliminate ${d} from common peers.`,
          },
        };
      }
    }
  }
  return null;
}

export const twinnedXyChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生 XY 链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid: Grid): Step | null {
    return searchTwinnedChains(grid);
  },
};