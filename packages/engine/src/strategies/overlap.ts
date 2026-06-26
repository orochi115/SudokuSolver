/**
 * Overlap / inclusion registry (Roadmap ② gate 3 — anti-drift).
 *
 * Turns docs/plans/diabolical-727.md § 重叠/包含关系 into engineering data so the
 * engine never grows two independent default search owners for the same logical
 * family, and so de-duplication / trace naming stays unambiguous.
 *
 * Engineering rule (machine-checked in test/strategy-overlap.test.ts):
 *   - Each family has exactly one `canonicalOwner` strategy id.
 *   - An id is the `canonicalOwner` of at most one family.
 *   - Every `members` id is a registered strategy; the owner is a member.
 *   - `futureMembers` are ids reserved to this family that are NOT yet
 *     registered — when implemented they MUST reuse the owner / shared detector
 *     (move into `members`), never appear as a new independent default owner.
 *
 * `unified` records whether the owner is already a single general search that
 * subsumes the members (true), or whether the members are currently parallel
 * detectors and the owner is the representative pending unification (false). The
 * registry documents reality; it does not force premature merges.
 */

export interface OverlapFamily {
  /** Family id, e.g. 'single-digit-strong-link'. */
  readonly id: string;
  /** The strategy id that owns (or represents) the default search for this family. */
  readonly canonicalOwner: string;
  /** Currently-registered strategy ids in this family (includes the owner). */
  readonly members: readonly string[];
  /** Reserved ids not yet implemented; must reuse the owner when added. */
  readonly futureMembers?: readonly string[];
  /** True if the owner already subsumes members via one general search. */
  readonly unified: boolean;
  readonly note: string;
}

export const OVERLAP_FAMILIES: readonly OverlapFamily[] = [
  {
    id: 'single-digit-strong-link',
    canonicalOwner: 'x-chain',
    members: ['x-chain', 'skyscraper', 'two-string-kite', 'empty-rectangle', 'turbot-fish'],
    futureMembers: ['x-cycle', 'rectangle-elimination', 'grouped-x-cycle'],
    unified: true,
    note:
      'All one single-digit strong-link pattern. Turbot Fish = skyscraper/2-string-kite/empty-rectangle unified 4-link; ' +
      'X-Cycle = single-digit Nice Loop; X-Wing = length-4 continuous X-Cycle (lives in the fish family, cross-ref only). ' +
      'turbot-fish reuses x-chain search with presentation filter (E2); named patterns fire first by difficulty.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-als', 'aic-with-ur', 'twinned-xy-chains', 'aic-with-exotic-links'],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. Continuous/discontinuous Nice Loops ' +
      '(AicResult *-loop kinds) are owned by nice-loop; aic must not emit loops (E6).',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-chain',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs'],
    futureMembers: [],
    unified: false,
    note:
      'ALS-XY-Wing is the 3-ALS / 2-link special case of als-chain (E4 delegation). AHS is the hidden dual; ' +
      'AHS-XZ mirrors ALS-XZ via complementary ANS. als-chain is the canonical owner for general ALS-XY-Chain search.',
  },
  {
    id: 'uniqueness-rectangle',
    canonicalOwner: 'unique-rectangle-type-1',
    members: [
      'unique-rectangle-type-1',
      'unique-rectangle-type-2',
      'unique-rectangle-type-3',
      'unique-rectangle-type-4',
      'unique-rectangle-type-5',
      'unique-rectangle-type-6',
      'hidden-unique-rectangle',
      'bug-plus-one',
      'avoidable-rectangle-type-1',
      'avoidable-rectangle-type-2',
      'avoidable-rectangle-type-3',
      'avoidable-rectangle-type-4',
      'extended-unique-rectangle',
      'unique-loop',
      'bug-lite',
      'bug-plus-n',
      'gurth',
    ],
    unified: true,
    note:
      'Deadly-pattern (uniqueness) family. Shared ur-engine (E3). Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. ' +
      'BUG+1 shares the unique-solution assumption. Gurth exploits global clue symmetry.',
  },
  {
    id: 'fish',
    canonicalOwner: 'x-wing',
    members: ['x-wing', 'swordfish', 'jellyfish', 'finned-x-wing', 'finned-swordfish', 'finned-jellyfish', 'franken-fish', 'mutant-fish'],
    futureMembers: [],
    unified: false,
    note: 'Fish family: basic, finned, franken, and mutant fish (N≥3).',
  },
  {
    id: 'advanced-wing',
    canonicalOwner: 'xy-wing',
    members: ['xy-wing', 'xyz-wing', 'w-wing', 'wxyz-wing', 'vwxyz-wing', 'remote-pairs', 'bent-sets', 'broken-wing'],
    futureMembers: [],
    unified: false,
    note: 'Wing ladder through VWXYZ; bent sets and broken wing are advanced wing/bent family.',
  },
  {
    id: 'exotic',
    canonicalOwner: 'subset-exclusion',
    members: [
      'sue-de-coq',
      'sue-de-coq-extended',
      'tridagon',
      'exocet',
      'sk-loop',
      'msls',
      'fireworks',
      'aligned-pair-exclusion',
      'aligned-triple-exclusion',
      'subset-exclusion',
    ],
    futureMembers: [],
    unified: false,
    note: 'Exotic rank-0 / enumeration techniques. APE/ATE are aligned subset-exclusion special cases; SK-Loop ⊂ MSLS.',
  },
];