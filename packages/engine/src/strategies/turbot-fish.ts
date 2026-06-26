import { HOUSES, PEERS_OF, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function label(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeerElims(grid: Grid, a: number, b: number, digit: number): { cell: number; digit: number }[] {
  const peers = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!
    .filter((cell) => cell !== a && cell !== b && peers.has(cell) && grid.hasCandidate(cell, digit))
    .map((cell) => ({ cell, digit }));
}

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'cell-index'],
  apply(grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = maskOf(digit);
      const pairs: Array<[number, number]> = [];
      for (const house of HOUSES) {
        const cells = house.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
        if (cells.length === 2) pairs.push([cells[0]!, cells[1]!]);
      }
      for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
          const first = pairs[i]!;
          const second = pairs[j]!;
          if (new Set([...first, ...second]).size !== 4) continue;
          for (const [outerA, innerA] of [[first[0], first[1]], [first[1], first[0]]] as Array<[number, number]>) {
            for (const [innerB, outerB] of [[second[0], second[1]], [second[1], second[0]]] as Array<[number, number]>) {
              if (!PEERS_OF[innerA]!.includes(innerB)) continue;
              const eliminations = commonPeerElims(grid, outerA, outerB, digit);
              if (eliminations.length === 0) continue;
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [outerA, innerA, innerB, outerB, ...eliminations.map((e) => e.cell)],
                  candidates: [outerA, innerA, innerB, outerB].map((cell) => ({ cell, digit })).concat(eliminations),
                  links: [
                    { from: { cell: outerA, digit }, to: { cell: innerA, digit }, type: 'strong' },
                    { from: { cell: innerA, digit }, to: { cell: innerB, digit }, type: 'weak' },
                    { from: { cell: innerB, digit }, to: { cell: outerB, digit }, type: 'strong' },
                  ],
                },
                explanation: {
                  zh: `多宝鱼：数字 ${digit} 的两条强链 ${label(outerA)}-${label(innerA)} 与 ${label(innerB)}-${label(outerB)} 由弱链连接；两外端至少一端为真，公共可见格可删 ${digit}。`,
                  en: `Turbot Fish: two strong links on ${digit}, ${label(outerA)}-${label(innerA)} and ${label(innerB)}-${label(outerB)}, are joined by a weak link; one outer end is true, so common peers lose ${digit}.`,
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
