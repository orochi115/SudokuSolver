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
    owns: 'Digit forcing chain presentation: branch on the candidate locations for one digit in a house.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'nishio-forcing-chain',
    owns: 'Nishio presentation: assume one candidate, propagate, and reject contradiction.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'cell-forcing-chain',
    owns: 'Cell forcing chain presentation: branch over candidates of one unresolved cell.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'region-forcing-chain',
    owns: 'Region forcing chain presentation: branch over digit positions in a region / unit.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'dic',
    owns: 'Double Implication Chain presentation of forcing-chain consequences.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'forcing-net',
    owns: 'Forcing nets over cell / region / contradiction / verity branches.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  {
    strategyId: 'kraken-fish',
    owns: 'Kraken fish: fish candidates discharged by forcing-chain branches.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  // ---- reserved (gate 6 boundaries for future chain work) ----
  {
    strategyId: 'xy-chain',
    owns: 'Bivalue-cell chain (special case of AIC); owns Remote Pairs as a sub-case.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'remote-pairs',
    owns: 'Remote Pairs as a repeated bivalue-cell chain presentation under XY-Chain.',
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
    strategyId: 'aic-with-als',
    owns: 'AIC with ALS endpoint/node presentation; no multi-branch forcing.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-ur',
    owns: 'AIC with uniqueness/UR endpoint presentation; no multi-branch forcing.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'twinned-xy-chains',
    owns: 'Twinned bivalue-cell XY chains as a named AIC/XY-Chain presentation; no multi-branch forcing.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-exotic-links',
    owns: 'AIC using exotic named links/nodes as presentation metadata; no multi-branch forcing.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'als-chain',
    owns: 'General ALS chain / ALS-XY-chain family; ALS-XY-Wing is its len-2 special case.',
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
