import {
  HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);

      // Find all strong links on d: houses with exactly 2 candidates of d
      const strongLinks: [number, number][] = [];
      for (const h of HOUSES) {
        const cells = h.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cells.length === 2) {
          const u = cells[0]!;
          const v = cells[1]!;
          // Deduplicate
          if (!strongLinks.some(([s1, s2]) => s1 === u && s2 === v)) {
            strongLinks.push([u, v]);
          }
        }
      }

      // Try combining any two strong links
      for (let i = 0; i < strongLinks.length; i++) {
        for (let j = 0; j < strongLinks.length; j++) {
          if (i === j) continue;
          const [u1, u2] = strongLinks[i]!;
          const [v1, v2] = strongLinks[j]!;

          // We check the alignments
          // Alignment: u1 =d= u2 -d- v1 =d= v2
          // u2 and v1 are connected via a weak link (meaning they are peers)
          if (u2 !== v1 && u1 !== v2 && PEERS_OF[u2]!.includes(v1)) {
            const endP = u1;
            const endQ = v2;
            const elims = commonPeers(endP, endQ).filter(
              (c) => c !== u2 && c !== v1 && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0
            );

            if (elims.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims.map((c) => ({ cell: c, digit: d })),
                highlights: {
                  cells: [u1, u2, v1, v2, ...elims],
                  candidates: [
                    { cell: u1, digit: d },
                    { cell: u2, digit: d },
                    { cell: v1, digit: d },
                    { cell: v2, digit: d },
                    ...elims.map((c) => ({ cell: c, digit: d })),
                  ],
                  links: [
                    { from: { cell: u1, digit: d }, to: { cell: u2, digit: d }, type: 'strong' },
                    { from: { cell: u2, digit: d }, to: { cell: v1, digit: d }, type: 'weak' },
                    { from: { cell: v1, digit: d }, to: { cell: v2, digit: d }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `数字 ${d}：多宝鱼。格 ${cellLabel(u1)} 与 ${cellLabel(u2)}，以及 ${cellLabel(v1)} 与 ${cellLabel(v2)} 构成强链，由 ${cellLabel(u2)}-${cellLabel(v1)} 弱链相连；消去端点 ${cellLabel(u1)} 和 ${cellLabel(v2)} 共同可见格中的 ${d}。`,
                  en: `Digit ${d}: Turbot Fish. Strong links ${cellLabel(u1)}=${cellLabel(u2)} and ${cellLabel(v1)}=${cellLabel(v2)} joined by weak link ${cellLabel(u2)}-${cellLabel(v1)}; eliminate ${d} from cells seeing both endpoints ${cellLabel(u1)} and ${cellLabel(v2)}.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};
