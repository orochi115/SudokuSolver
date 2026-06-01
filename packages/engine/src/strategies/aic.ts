/**
 * AIC (T4) — 交替推理链 (Alternating Inference Chains) + 链类统一框架.
 *
 * This strategy is the general chain engine. It builds the strong/weak link
 * graph (`chain/graph.ts`) over candidate nodes (with grouped links) and runs a
 * bounded alternating search (`chain/aic-search.ts`) to find:
 *
 *   - X-Chain         (single digit, conjugate strong links)
 *   - XY-Chain        (bivalue-cell strong links)
 *   - Nice Loops      (alternating cycles)
 *   - AIC Type 1 / 2  (strong-strong endpoints, same / different digit)
 *   - discontinuous / continuous loop deductions
 *
 * Named short chains (Skyscraper / Kite / Turbot / Empty Rectangle) are subsumed
 * by this framework but kept as the cheaper `single-digit-patterns` strategy so
 * the trace prefers the simpler explanation first (FR-7).
 *
 * The search is bounded by `ChainPolicy` (forcing-boundary, FR-8): only
 * non-branching alternating chains up to `maxChainLength` nodes are explored;
 * forcing nets are NOT produced here (that is the bounded `forcing-chain`).
 */

import { cellLabel } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';

export function makeAic(policy: ChainPolicy = DEFAULT_CHAIN_POLICY): Strategy {
  return {
    id: 'aic',
    name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
    difficulty: 70,

    apply(grid: Grid): Step | null {
      // First pass: single-digit graph (X-Chains) — cheaper & clearer.
      for (let digit = 1; digit <= 9; digit++) {
        const g = buildLinkGraph(grid, { digit, grouped: true });
        const res = searchAic(grid, g, policy);
        if (res && res.eliminations.length > 0) {
          const a = g.nodes[res.startNode]!;
          const b = g.nodes[res.endNode]!;
          return {
            strategyId: this.id,
            placements: [],
            eliminations: res.eliminations,
            highlights: {
              cells: res.chainNodes.flatMap((i) => g.nodes[i]!.cells),
              candidates: res.chainNodes.flatMap((i) =>
                g.nodes[i]!.cells.map((c) => ({ cell: c, digit: g.nodes[i]!.digit })),
              ),
              links: res.links,
            },
            explanation: {
              zh: `X-Chain(单数字交替链):数字 ${digit} 沿强弱交替链连接 ${cellLabel(a.cells[0]!)} 与 ${cellLabel(b.cells[0]!)},两端必有其一为真,故可见两端的格可排除 ${digit}。`,
              en: `X-Chain: digit ${digit} forms an alternating strong/weak chain between ${cellLabel(a.cells[0]!)} and ${cellLabel(b.cells[0]!)}; one end must be true, so cells seeing both can drop ${digit}.`,
            },
          };
        }
      }

      // Second pass: full multi-digit graph (XY-chains, general AIC).
      const g = buildLinkGraph(grid, { grouped: true });
      const res = searchAic(grid, g, policy);
      if (res && res.eliminations.length > 0) {
        const a = g.nodes[res.startNode]!;
        const b = g.nodes[res.endNode]!;
        const sameDigit = a.digit === b.digit;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: res.eliminations,
          highlights: {
            cells: res.chainNodes.flatMap((i) => g.nodes[i]!.cells),
            candidates: res.chainNodes.flatMap((i) =>
              g.nodes[i]!.cells.map((c) => ({ cell: c, digit: g.nodes[i]!.digit })),
            ),
            links: res.links,
          },
          explanation: {
            zh: `交替推理链 AIC(${sameDigit ? 'Type 1' : 'Type 2'}):从 ${cellLabel(a.cells[0]!)} 的 ${a.digit} 经强弱交替链推到 ${cellLabel(b.cells[0]!)} 的 ${b.digit};两端至少其一为真,据此可消除相应候选。`,
            en: `Alternating Inference Chain (${sameDigit ? 'Type 1' : 'Type 2'}): from ${cellLabel(a.cells[0]!)}=${a.digit} along an alternating chain to ${cellLabel(b.cells[0]!)}=${b.digit}; at least one end is true, yielding the eliminations.`,
          },
        };
      }
      return null;
    },
  };
}

export const aic: Strategy = makeAic();
