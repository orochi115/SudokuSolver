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
    id: 'coloring',
    canonicalOwner: 'simple-coloring',
    members: ['simple-coloring', 'multi-coloring', '3d-medusa'],
    futureMembers: [],
    unified: false,
    note: 'P1: multi-coloring (X-Colors incl) and 3D Medusa (multi-digit) under coloring owner.',
  },
  {
    id: 'exotic',
    canonicalOwner: 'tridagon',
    members: ['tridagon', 'sue-de-coq', 'fireworks', 'exocet', 'sk-loop', 'msls', 'aligned-pair-exclusion', 'aligned-triple-exclusion', 'subset-exclusion', 'sue-de-coq-extended', 'aic-with-exotic-links'],
    futureMembers: [],
    unified: false,
    note: 'P2b: subset-exclusion (general, incl APE/ATE aligned special cases), sue-de-coq-extended, aic-with-exotic-links added; subset-exclusion is owner for subset family.',
  },
  {
    id: 'single-digit-strong-link',
    canonicalOwner: 'x-chain',
    members: ['x-chain', 'skyscraper', 'two-string-kite', 'empty-rectangle', 'turbot-fish'],
    futureMembers: ['x-cycle', 'rectangle-elimination', 'grouped-x-cycle'],
    unified: true,
    note:
      'All one single-digit strong-link pattern. Turbot Fish = skyscraper/2-string-kite/empty-rectangle unified 4-link (E2); ' +
      'X-Cycle = single-digit Nice Loop (alias of nice-loop); X-Wing = length-4 continuous X-Cycle (lives in the fish family, cross-ref only). ' +
      'Skyscraper/2-string-kite/empty-rectangle currently fire first by difficulty; x-chain is the general fallback. ' +
      'Turbot now reuses owner (unified).',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-als', 'aic-with-ur', 'aic-with-exotic-links', 'twinned-xy-chains'],
    futureMembers: ['grouped-aic'],
    unified: true,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      'E6: nice-loop owns *-loop kinds; aic no longer emits loops. `grouped` is a switch on buildLinkGraph, not a separate strategy. P1: aic-with-als/ur added. P2b: aic-with-exotic-links, twinned-xy-chains (reuse xy/aic engine).',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-chain',
    members: ['als-chain', 'als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'ahs', 'aic-with-als'],
    futureMembers: ['als-xy-chain'],
    unified: false,
    note:
      'E4: als-chain is now canonical owner (general ALS-XY-Chain); als-xy-wing is documented len-2 special case (alias/fold). ' +
      'AHS for chain node reuse. aic-with-als reuses the family.',
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
    futureMembers: [
      'avoidable-rectangle',
    ],
    unified: true,
    note:
      'Deadly-pattern (uniqueness) family. E3: shared engine. P1: AR1-4, EUR, UniqueLoop, BUG variants added. P2b: gurth (symmetrical placement) added under uniqueness/symmetry.',
  },
  {
    id: 'fish',
    canonicalOwner: 'x-wing',
    members: ['x-wing', 'finned-x-wing', 'swordfish', 'finned-swordfish', 'jellyfish', 'finned-jellyfish', 'franken-fish', 'mutant-fish'],
    futureMembers: [],
    unified: false,
    note: 'P2b: franken-fish and mutant-fish added as fish family extensions (incl endo-fins, cannibalism, siamese presentation). Basic and finned fish listed for family grouping.',
  },
  {
    id: 'subset-exclusion',
    canonicalOwner: 'subset-exclusion',
    members: ['aligned-pair-exclusion', 'aligned-triple-exclusion', 'subset-exclusion'],
    futureMembers: [],
    unified: false,
    note: 'P2b: subset-exclusion is owner (general subset counting/exclusion); APE/ATE are its aligned k=2/3 special cases (P2a).',
  },
];
