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
  {
    strategyId: 'digit-forcing-chain',
    owns: 'Forcing-chain presentation starting from digit alternatives in a house.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'nishio-forcing-chain',
    owns: 'Forcing-chain presentation where a candidate assumption reaches contradiction.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'cell-forcing-chain',
    owns: 'Forcing-chain presentation starting from alternatives in one cell.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'region-forcing-chain',
    owns: 'Forcing-chain presentation starting from row/column/box alternatives.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'dic',
    owns: 'Double Implication Chain presentation: both forcing branches imply the same conclusion.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'forcing-net',
    owns: 'Multi-branch forcing net presentations (cell, region, contradiction, verity kinds).',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'kraken-fish',
    owns: 'Kraken Fish red-line presentation: fish alternatives connected by forcing chains.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'xy-chain',
    owns: 'Bivalue-cell chain (special case of AIC); owns Remote Pairs as a sub-case.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'nice-loop',
    owns: 'Continuous / discontinuous single-digit & general Nice Loops (AicResult *-loop kinds).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'remote-pairs',
    owns: 'Remote Pairs as the fixed two-digit, bivalue-cell sub-case of XY-Chain.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-als',
    owns: 'AIC presentation that treats ALS-chain deductions as named ALS nodes, without branching.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-ur',
    owns: 'AIC presentation reserved for UR/grouped nodes, without contradiction or multi-branch forcing.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'twinned-xy-chains',
    owns: 'Two coordinated bivalue XY chains; registered as a non-branching XY-chain family presentation.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-exotic-links',
    owns: 'AIC presentation for named exotic link nodes; no contradiction, forcing, or multi-branch search.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
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
