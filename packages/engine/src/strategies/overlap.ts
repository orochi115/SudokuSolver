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
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-als', 'aic-with-ur'],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      'xy-chain reuses the AIC search on the ungrouped graph; nice-loop owns the *-loop kinds (closed/discontinuous); ' +
      'aic-with-als/ur are AIC over the grouped graph (reserved owners for chains exercising ALS/UR group nodes). ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy.',
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
    ],
    futureMembers: [],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR & UR Type 6 overlap (diagonal hidden). BUG+1 is the +1 special ' +
      'case; bug-lite / bug-plus-n are the generalised BUG variants (conservatively inactive pending sound multi-cell ' +
      'reasoning — see docs/notes/p1.md). Avoidable Rectangle 1–4 require given-vs-solved distinction; the Grid foundation ' +
      'tracks no givens, so they are registered but conservatively inactive (sound no-ops) — pending a foundation given-flag.',
  },
];
