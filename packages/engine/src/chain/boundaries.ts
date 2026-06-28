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
    strategyId: 'aic-with-als',
    owns: 'AIC whose chain nodes include an Almost Locked Set (ALS) supplying the strong link. Presentation alias over the shared AIC engine.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-ur',
    owns: 'AIC whose chain nodes include a Unique Rectangle (UR) supplying the strong link (uniqueness assumption). Presentation alias over the shared AIC engine.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aic-with-exotic-links',
    owns: 'AIC whose chain nodes include an exotic structural pattern (remote pair, box-overlap, UR substrate). Presentation alias over the shared AIC engine.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'twinned-xy-chains',
    owns: 'Twinned XY-Chains — six-cell giant naked sextuple decomposed into two pivot-linked XY-cycles.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'forcing-chain',
    owns: 'Multi-branch / contradiction (verity) reasoning — cell & digit forcing chains.',
    multiBranch: true,
    profiles: ['last-resort'],
  },
  // ---- chain owners (gate 6 boundaries for chain work) ----
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
    strategyId: 'als-chain',
    owns: 'General ALS-XY-Chain — sequence of ALS linked by RCCs, with endpoints sharing a common digit Z.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'ahs',
    owns: 'Almost Hidden Set — hidden-space dual of ALS, used as chain node or directly for hidden-locked-set eliminations.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'multi-coloring',
    owns: 'Single-digit coloring family: Simple Coloring (no promotion), X-Colors (single-cluster + promotion), Multi-Colors (two-cluster).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: '3d-medusa',
    owns: 'Multi-digit coloring (Medusa): bi-location + bi-value strong links across all digits.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'wxyz-wing',
    owns: 'Bent Almost Locked Set of N cells / N digits (WXYZ size-ladder rung 4).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'bent-sets',
    owns: 'Almost Locked Pair / Triple — bent ALS across line-box intersection.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'broken-wing',
    owns: 'Odd-cycle (oddagon) single-digit strong-link loops with guardians.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'remote-pairs',
    owns: 'Chain of identical bivalue cells linked by conjugate pairs; XY-Chain sub-case.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'tridagon',
    owns: 'Tridagon / Anti-Tridagon / Thors Hammer — 12 cells over 4 boxes, three-digit deadly pattern.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'vwxyz-wing',
    owns: 'Bent Almost Locked Set of N cells / N digits (WXYZ size-ladder rung 5).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'exocet',
    owns: 'Junior / Senior Exocet — base/target/S-cell forced-digit pattern.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'sk-loop',
    owns: 'SK-Loop (Virus pattern) — 16-cell closed loop of hidden pairs across 4 boxes (MSLS special case).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'msls',
    owns: 'Multi-Sector Locked Sets — rank-0 set logic across rows and columns.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'fireworks',
    owns: 'Triple / Quad Fireworks — distributed hidden triple/quad on a row-col L inside a box.',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aligned-pair-exclusion',
    owns: 'APE — Aligned Pair Exclusion (combination enumeration over a 2-cell base + bivalue buddies).',
    multiBranch: false,
    profiles: ['human-default', 'last-resort'],
  },
  {
    strategyId: 'aligned-triple-exclusion',
    owns: 'ATE — Aligned Triple Exclusion (combination enumeration over a 3-cell base + bivalue buddies).',
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