/**
 * Chain-engine boundaries (Roadmap ② gate 6 — anti-drift).
 *
 * Before implementing Grouped AIC / Nice Loop / XY-Chain / AIC-with-ALS|UR|exotic
 * nodes, the ownership and search switches of the chain engine are frozen here so
 * that: (a) AIC does not keep swallowing nameable special cases, and (b) forcing /
 * contradiction / multi-branch reasoning never masquerades as an ordinary chain in
 * the human-default profile.
 *
 * This module is contract + data (no runtime behaviour). It is consumed by
 * test/strategy-overlap.test.ts to assert the boundaries hold.
 */

import type { StrategyProfile } from '../strategies/profiles.js';

/** What each chain-family strategy id owns, and whether it is multi-branch. */
export interface ChainOwnership {
  readonly strategyId: string;
  /** Plain-language scope of this owner. */
  readonly owns: string;
  /**
   * True if the technique reasons by exploring multiple branches / contradiction
   * (forcing). Such techniques are red-line (P3) and MUST be last-resort only.
   */
  readonly multiBranch: boolean;
  /** Profiles this strategy is allowed to appear in. */
  readonly profiles: readonly StrategyProfile[];
  /** Reserved (not yet implemented) chain strategies, for documentation. */
  readonly reserved?: boolean;
}

export const CHAIN_OWNERSHIP: readonly ChainOwnership[] = [
  {
    strategyId: 'x-chain',
    owns: 'Single-digit alternating inference chain (open chain).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic',
    owns: 'General (multi-digit) alternating inference chain, open chain, Type-1/Type-2 endpoints.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'forcing-chain',
    owns: 'Multi-branch / contradiction (verity) reasoning — cell & digit forcing chains.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  // ---- P0 chain strategies (gate 6: now implemented) ----
  {
    strategyId: 'xy-chain',
    owns: 'Bivalue-cell chain (special case of AIC); owns Remote Pairs as a sub-case.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    // E6: nice-loop takes over *-loop kinds from AicResult; aic must not emit loop results.
    strategyId: 'nice-loop',
    owns: 'Continuous / discontinuous single-digit & general Nice Loops (AicResult *-loop kinds).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  // ---- P3 last-resort chain strategies (all multiBranch: true) ----
  {
    strategyId: 'digit-forcing-chain',
    owns: 'Forcing chain starting from the two positions of a digit in a house (conjugate pair).',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'nishio-forcing-chain',
    owns: 'Single-branch contradiction search (Nishio): assume a digit in a cell, propagate naked/hidden singles until contradiction.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'cell-forcing-chain',
    owns: 'Forcing chain from all candidates of a cell; conclusions common to ALL branches are deduced.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'region-forcing-chain',
    owns: 'Forcing chain from all positions of a digit in a house; conclusions common to ALL branches are deduced.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'dic',
    owns: 'Double Implication Chain: two-branch forcing over any bivalue cell or conjugate pair.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'forcing-net',
    owns: 'Multi-branch forcing tree (DAG); each branch may itself fork. Kinds: cell/region/contradiction/verity.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'kraken-fish',
    owns: 'Fish pattern combined with forcing chains through fin cells. Types: Type1 (fin→cover) and Type2 (fin→victim).',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'tabling',
    owns: 'Trebor\'s Tables: two-level nested implication table; enumeration technique.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'pom',
    owns: 'Pattern Overlay Method: enumerate all valid digit patterns per digit; overlay to find universal placements/eliminations.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'templates',
    owns: 'Template method: enumerate and maintain all valid templates per digit across deduction steps.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'gem',
    owns: 'Graded Equivalence Marks (Braid Analysis): three-valued T/F/B propagation over the candidate graph.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
];

/**
 * `grouped` is a SWITCH on buildLinkGraph (group nodes for box/line reductions),
 * NOT a separate strategy. Grouped AIC / grouped X-Cycle reuse x-chain / aic /
 * nice-loop with this switch on; they must never be registered as their own
 * default search owner.
 */
export const GROUPED_IS_A_SWITCH = true as const;

/** Strategy ids that reason by multi-branch / contradiction (red-line). */
export const MULTI_BRANCH_IDS: ReadonlySet<string> = new Set(
  CHAIN_OWNERSHIP.filter((c) => c.multiBranch).map((c) => c.strategyId),
);
