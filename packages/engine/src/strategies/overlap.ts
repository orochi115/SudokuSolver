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
      'aic-with-als',
      'aic-with-ur',
      'twinned-xy-chains',
      'aic-with-exotic-links',
    ],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      'AIC-with-ALS/UR/exotic and Twinned XY-Chains are named node/link presentations owned by the AIC family. `grouped` is a switch on buildLinkGraph, not a separate strategy. ' +
      'Continuous/discontinuous Nice Loops (AicResult *-loop kinds) are owned by nice-loop and must not be emitted under id "aic".',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-chain',
    members: ['als-chain', 'als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'ahs', 'aic-with-als'],
    futureMembers: ['als-xy-chain'],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of the registered general ALS chain; AHS is the ALS dual node form. ' +
      'ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS and is intentionally not implemented standalone.',
  },
  {
    id: 'coloring',
    canonicalOwner: 'simple-coloring',
    members: ['simple-coloring', 'multi-coloring', '3d-medusa'],
    futureMembers: ['x-colors', 'color-wing', 'supercoloring'],
    unified: false,
    note:
      'Multi-Coloring owns X-Colors/Weak Colors/Color Wing presentations; 3D Medusa owns Supercoloring-style candidate graph coloring.',
  },
  {
    id: 'uniqueness-rectangle',
    canonicalOwner: 'unique-rectangle-type-1',
    members: [
      'unique-rectangle-type-1',
      'unique-rectangle-type-2',
      'hidden-unique-rectangle',
      'unique-rectangle-type-3',
      'unique-rectangle-type-4',
      'unique-rectangle-type-5',
      'unique-rectangle-type-6',
      'bug-plus-one',
      'avoidable-rectangle-type-1',
      'avoidable-rectangle-type-2',
      'avoidable-rectangle-type-3',
      'avoidable-rectangle-type-4',
      'extended-unique-rectangle',
      'unique-loop',
      'bug-lite',
      'bug-plus-n',
    ],
    futureMembers: ['avoidable-rectangle'],
    unified: true,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG/AR/EUR/unique-loop variants share the ' +
      'unique-solution assumption. UR types currently ship as per-type detectors/presentations.',
  },
  {
    id: 'bent-wing-oddagon',
    canonicalOwner: 'wxyz-wing',
    members: ['wxyz-wing', 'vwxyz-wing', 'bent-sets', 'broken-wing'],
    unified: false,
    note: 'Advanced wing/bent/guardian presentations. VWXYZ is the size-ladder generalization sharing the WXYZ framework.',
  },
  {
    id: 'exotic',
    canonicalOwner: 'tridagon',
    members: [
      'tridagon',
      'exocet',
      'sk-loop',
      'msls',
      'fireworks',
      'aligned-pair-exclusion',
      'aligned-triple-exclusion',
      'subset-exclusion',
      'sue-de-coq-extended',
    ],
    unified: false,
    note: 'Rare/exotic human techniques. SK-Loop is the first-found MSLS special case; APE/ATE are aligned Subset Exclusion cases; extended Sue de Coq remains an SdC-family presentation.',
  },
  {
    id: 'fish-extension',
    canonicalOwner: 'franken-fish',
    members: ['x-wing', 'swordfish', 'jellyfish', 'finned-x-wing', 'finned-swordfish', 'finned-jellyfish', 'franken-fish', 'mutant-fish'],
    unified: false,
    note:
      'Franken/Mutant Fish extend the base-cover fish family into mixed houses and named presentations including Endo Fins, Cannibalism, and Siamese cases. ' +
      'Basic and finned fish keep their lower-difficulty detectors and fire first.',
  },
  {
    id: 'uniqueness-symmetry',
    canonicalOwner: 'gurth',
    members: ['gurth'],
    unified: false,
    note: 'Gurth\'s Symmetrical Placement is tracked as a uniqueness/symmetry owner separate from rectangle-specific UR variants.',
  },
];
