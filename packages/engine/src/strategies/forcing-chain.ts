import { PEERS_OF, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Link, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { cellName } from './common.js';

const MAX_PROPAGATION = 24;

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '迫链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(grid): Step | null {
    for (let cell = 0; cell < 81; cell++) {
      if (grid.get(cell) !== 0 || popcount(grid.candidatesOf(cell)) < 2) continue;
      for (const digit of digitsOf(grid.candidatesOf(cell))) {
        const contradiction = assumptionContradiction(grid, cell, digit);
        if (!contradiction) continue;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: [{ cell, digit }],
          highlights: { cells: [...new Set([cell, contradiction.cell, ...contradiction.links.flatMap((link) => [link.from.cell, link.to.cell])])], candidates: [{ cell, digit }, { cell: contradiction.cell, digit: contradiction.digit }], links: contradiction.links },
          explanation: {
            zh: `若 ${cellName(cell)} 放入 ${digit}，会在 ${cellName(contradiction.cell)} 造成无候选矛盾；按边界规则这是单前提、有限传播的迫链，因此删除该候选。`,
            en: `Assuming ${digit} in ${cellName(cell)} leaves ${cellName(contradiction.cell)} without candidates. This is a single-premise bounded forcing chain, so that candidate is removed.`,
          },
        };
      }
    }
    return null;
  },
};

function assumptionContradiction(grid: Grid, cell: number, digit: number): { cell: number; digit: number; links: Link[] } | null {
  const values = grid.values.slice();
  const candidates = grid.candidates.slice();
  const paths = new Map<number, Link[]>();
  values[cell] = digit;
  candidates[cell] = 0;
  paths.set(cell, []);
  const queue = [cell];
  let steps = 0;
  while (queue.length > 0 && steps++ < MAX_PROPAGATION) {
    const placed = queue.shift()!;
    const placedDigit = values[placed]!;
    const placedPath = paths.get(placed) ?? [];
    const bit = maskOf(placedDigit);
    for (const peer of PEERS_OF[placed]!) {
      if (values[peer] !== 0) {
        if (values[peer] === placedDigit) return { cell: peer, digit: placedDigit, links: [...placedPath, { from: { cell: placed, digit: placedDigit }, to: { cell: peer, digit: placedDigit }, type: 'weak' }] };
        continue;
      }
      if ((candidates[peer]! & bit) === 0) continue;
      const before = candidates[peer]!;
      candidates[peer]! &= ~bit;
      const weak: Link = { from: { cell: placed, digit: placedDigit }, to: { cell: peer, digit: placedDigit }, type: 'weak' };
      if (candidates[peer] === 0) return { cell: peer, digit: placedDigit, links: [...placedPath, weak] };
      if (popcount(candidates[peer]!) === 1) {
        const single = digitsOf(candidates[peer]!)[0]!;
        values[peer] = single;
        candidates[peer] = 0;
        const path = [...placedPath, weak];
        if (popcount(before) === 2) path.push({ from: { cell: peer, digit: placedDigit }, to: { cell: peer, digit: single }, type: 'strong' });
        paths.set(peer, path);
        queue.push(peer);
      }
    }
  }
  return null;
}
