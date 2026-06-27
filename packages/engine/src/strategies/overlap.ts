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
    unified: false,
    note:
      'All one single-digit strong-link pattern. Turbot Fish = skyscraper/2-string-kite/empty-rectangle unified 4-link; ' +
      'X-Cycle = single-digit Nice Loop; X-Wing = length-4 continuous X-Cycle (lives in the fish family, cross-ref only). ' +
      'Skyscraper/2-string-kite/empty-rectangle currently fire first by difficulty; turbot-fish is the general 4-link fallback; x-chain is the longer single-digit chain. ' +
      'Future X-Cycle/Rectangle-Elimination/Grouped-X-Cycle must reuse this, not add a new independent detector.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-als', 'aic-with-ur', 'twinned-xy-chains', 'aic-with-exotic-links'],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      'xy-chain reuses the AIC search on the ungrouped graph; nice-loop owns the *-loop kinds (closed/discontinuous); ' +
      'aic-with-als/ur are AIC over the grouped graph (reserved owners for chains exercising ALS/UR group nodes). ' +
      'twinned-xy-chains reuses the AIC graph for two-branch bivalue propagation; aic-with-exotic-links runs the grouped ' +
      'AIC search with extended chain length. `grouped` is a switch on buildLinkGraph, not a separate strategy.',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs'],
    futureMembers: [],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of the general ALS chain (als-chain); als-xy-wing fires first (lower ' +
      'difficulty) so the len-2 case keeps its specific name — this is the E4 fold. ALS-W-Wing is absorbed by ALS chain / ' +
      'AIC-with-ALS. als-xz remains the representative owner. ahs (Almost Hidden Set) is the row/col/box dual, provided ' +
      'as a chain node / simple AHS-XZ deduction here.',
  },
  {
    id: 'uniqueness-rectangle',
    canonicalOwner: 'unique-rectangle-type-1',
    members: [
      'unique-rectangle-type-1', 'unique-rectangle-type-2', 'unique-rectangle-type-3',
      'unique-rectangle-type-4', 'unique-rectangle-type-5', 'unique-rectangle-type-6',
      'hidden-unique-rectangle', 'bug-plus-one', 'extended-unique-rectangle', 'unique-loop', 'bug-lite', 'bug-plus-n',
      'avoidable-rectangle-type-1', 'avoidable-rectangle-type-2', 'avoidable-rectangle-type-3', 'avoidable-rectangle-type-4',
      'gurth',
    ],
    futureMembers: [],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR & UR Type 6 overlap (diagonal hidden). BUG+1 is the +1 special ' +
      'case; bug-lite / bug-plus-n are the generalised BUG variants (conservatively inactive pending sound multi-cell ' +
      'reasoning — see docs/notes/p1.md). Avoidable Rectangle 1–4 require given-vs-solved distinction; the Grid foundation ' +
      'tracks no givens, so they are registered but conservatively inactive (sound no-ops) — pending a foundation given-flag. ' +
      'gurth (Symmetrical Placement) exploits global board symmetry (automorphism), independent of the rectangle/loop family ' +
      'but classified under uniqueness because it needs the single-solution assumption.',
  },
  {
    id: 'fish-basic-extended',
    canonicalOwner: 'x-wing',
    members: ['x-wing', 'swordfish', 'jellyfish', 'finned-x-wing', 'finned-swordfish', 'finned-jellyfish', 'franken-fish', 'mutant-fish'],
    futureMembers: [],
    unified: false,
    note:
      'Fish family (base/cover constraint-set matching). Basic fish (x-wing/swordfish/jellyfish) use pure row-vs-col. ' +
      'Finned/sashimi add exo-fins. Franken fish mix one line-direction + boxes on a side. Mutant fish allow any house-type ' +
      'mix on either side. Franken/Mutant X-Wing degenerates to Locked Candidates, so Franken/Mutant start at N=3.',
  },
  {
    id: 'sue-de-coq-family',
    canonicalOwner: 'sue-de-coq',
    members: ['sue-de-coq', 'sue-de-coq-extended'],
    futureMembers: [],
    unified: false,
    note:
      'Sue de Coq family. The base SdC handles 2-3 cell box-line intersections with naked-set companions. ' +
      'sue-de-coq-extended extends to 4-cell intersections and larger companion sets; same elimination logic, ' +
      'reusing the same intersection scanner.',
  },
  {
    id: 'subset-exclusion-family',
    canonicalOwner: 'subset-exclusion',
    members: ['subset-exclusion', 'aligned-pair-exclusion', 'aligned-triple-exclusion'],
    futureMembers: [],
    unified: false,
    note:
      'Subset Exclusion (Subset Counting) family. APE (k=2 aligned) and ATE (k=3 aligned) are the specialised ' +
      'aligned forms; subset-exclusion is the general owner (any k, cells need not be aligned). All share the ' +
      'same combinatorial exclusion engine: enumerate base-cell value combinations, discard those that empty a ' +
      'commonly-seen witness (bivalue cell / ALS), eliminate candidates surviving in no allowed combination.',
  },
  {
    id: 'exotic-misc',
    canonicalOwner: 'tridagon',
    members: ['tridagon', 'exocet', 'sk-loop', 'msls', 'fireworks'],
    futureMembers: [],
    unified: false,
    note:
      'Exotic patterns that do not fit the chain/fish/ALS/uniqueness families. tridagon, exocet, sk-loop, msls, ' +
      'fireworks are each independent detectors (no shared search). Most are conservatively inactive (registered ' +
      'but return null) until full sound pattern verification is implemented — sound by construction.',
  },
];
