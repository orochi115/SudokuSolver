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
    id: 'fish-base-cover',
    canonicalOwner: 'x-wing',
    members: [
      'x-wing',
      'swordfish',
      'jellyfish',
      'finned-x-wing',
      'finned-swordfish',
      'finned-jellyfish',
      'franken-fish',
      'mutant-fish',
    ],
    futureMembers: [],
    unified: false,
    note:
      'Base/cover fish family including finned/sashimi variants. Franken and Mutant fish are reserved for a future fish-extension owner.',
  },
  {
    id: 'single-digit-strong-link',
    canonicalOwner: 'x-chain',
    members: ['x-chain', 'skyscraper', 'two-string-kite', 'empty-rectangle', 'turbot-fish'],
    futureMembers: ['x-cycle', 'rectangle-elimination', 'grouped-x-cycle'],
    unified: true,
    note:
      'All one single-digit strong-link pattern. Turbot Fish = skyscraper/2-string-kite/empty-rectangle unified 4-link; ' +
      'X-Cycle = single-digit Nice Loop; X-Wing = length-4 continuous X-Cycle (lives in the fish family, cross-ref only). ' +
      'Skyscraper/2-string-kite/empty-rectangle currently fire first by difficulty; x-chain is the general fallback. ' +
      'Future Turbot/X-Cycle must reuse this, not add a 4th independent detector.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: [
      'aic',
      'x-chain',
      'w-wing',
      'xy-chain',
      'nice-loop',
      'remote-pairs',
      'aic-with-ur',
      'twinned-xy-chains',
      'aic-with-exotic-links',
    ],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. Continuous/discontinuous Nice Loops ' +
      '(AicResult *-loop kinds) are reserved for a future nice-loop strategy and must not be emitted under id "aic".',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs', 'aic-with-als'],
    futureMembers: ['als-xy-chain'],
    unified: true,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain; ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS ' +
      'and is intentionally not implemented standalone. als-xz is the representative owner pending a general ALS-chain search.',
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
    futureMembers: ['avoidable-rectangle'],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1 shares the ' +
      'unique-solution assumption. UR types currently ship as per-type detectors.',
  },
  {
    id: 'coloring-advanced',
    canonicalOwner: 'simple-coloring',
    members: ['simple-coloring', 'multi-coloring', '3d-medusa'],
    unified: true,
    note: 'Multi-Coloring / X-Colors / Color Wing and 3D Medusa / Supercoloring are coloring-family presentations; implemented without multi-branch forcing.',
  },
  {
    id: 'advanced-wing-bent',
    canonicalOwner: 'wxyz-wing',
    members: ['wxyz-wing', 'vwxyz-wing', 'bent-sets', 'broken-wing'],
    unified: true,
    note: 'Advanced wing and bent-set family. WXYZ/VWXYZ/Bent Sets reuse ALS-family sound eliminations where applicable; Broken Wing is reserved as a conservative detector shell.',
  },
  {
    id: 'sue-de-coq',
    canonicalOwner: 'sue-de-coq',
    members: ['sue-de-coq', 'sue-de-coq-extended'],
    futureMembers: [],
    unified: true,
    note: 'Sue de Coq owner for row/column-box intersection ALS patterns. Extended forms stay reserved.',
  },
  {
    id: 'exotic-tridagon',
    canonicalOwner: 'tridagon',
    members: ['tridagon'],
    unified: true,
    note: 'Tridagon / anti-Tridagon owner; conservative detector shell until a non-search pattern matcher is added.',
  },
  {
    id: 'exocet',
    canonicalOwner: 'exocet',
    members: ['exocet'],
    unified: true,
    note: 'Exocet owner for Junior/Senior Exocet. Kept conservative until target/base/S-cell checks can be implemented without search.',
  },
  {
    id: 'msls-exotic',
    canonicalOwner: 'msls',
    members: ['msls', 'sk-loop'],
    unified: true,
    note: 'MSLS is the rank-0 set-logic owner; SK-Loop is its hand-scannable first-discovered special case.',
  },
  {
    id: 'fireworks',
    canonicalOwner: 'fireworks',
    members: ['fireworks'],
    unified: true,
    note: 'Fireworks owner for distributed hidden-set patterns; conservative until a full non-search matcher is added.',
  },
  {
    id: 'aligned-exclusion',
    canonicalOwner: 'aligned-pair-exclusion',
    members: ['aligned-pair-exclusion', 'aligned-triple-exclusion', 'subset-exclusion'],
    futureMembers: [],
    unified: true,
    note: 'APE/ATE are aligned special cases of Subset Exclusion. Subset Exclusion stays reserved for a future P2b owner.',
  },
];
