/**
 * Turbot Fish (T4) — 涡轮鱼
 *
 * A Turbot Fish is a single-digit chain that wraps around one or more houses
 * like a cycle. In essence, it is a continuous loop of strong links (on the
 * same digit) that forms a self-contained cycle within a set of houses.
 *
 * The Turbot Fish is a presentation alias for single-digit strong chains
 * (x-chains). We reuse the x-chain search engine and just rebrand the output.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { xChain } from './aic.js';

export function makeTurbotFishStrategy(): Strategy {
  return {
    id: 'turbot-fish',
    name: { zh: '涡轮鱼', en: 'Turbot Fish' },
    difficulty: 510,
    tieBreak: ['digit', 'cell-index'],

    apply(grid: Grid): Step | null {
      // Delegate to xChain and rebrand its Step as turbot-fish
      const xChainResult = xChain.apply(grid);
      if (!xChainResult || xChainResult.eliminations.length === 0) return null;
      
      // For turbot-fish specifically, we often consider wrapped cycles
      // Check if we have a single-digit cycle (grouped chain with same digit start/end)
      const { eliminations, highlights, placements } = xChainResult;
      const hasCycle = false; // TODO: checking for cycle presentation
      
      return {
        strategyId: this.id,
        placements,
        eliminations,
        highlights,
        explanation: {
          zh: hasCycle
            ? '涡轮鱼：单数字强链形成自闭环路，可消去相应候选。'
            : '涡轮鱼：单数字交替强链产生消除。',
          en: hasCycle
            ? 'Turbot Fish: single-digit strong chain forms a closed cycle, yielding eliminations.'
            : 'Turbot Fish: single-digit alternating strong chain opens eliminations.',
        },
      };
    },
  };
}

export const turbotFish: Strategy = makeTurbotFishStrategy();