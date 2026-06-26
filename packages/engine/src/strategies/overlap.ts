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
      'Skyscraper/2-string-kite/empty-rectangle/turbot-fish fire first by difficulty; x-chain is the general fallback. ' +
      'E2 (P0): turbot-fish moved from futureMembers to members. unified remains false (parallel detectors by difficulty tier).',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop'],
    futureMembers: ['remote-pairs', 'grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. ' +
      'E6 (P0): nice-loop now owns all *-loop kinds from AicResult; aic must not emit loop kinds. ' +
      'xy-chain and nice-loop moved from futureMembers to members.',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom'],
    futureMembers: ['als-xy-chain', 'aic-with-als'],
    unified: false,
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
    ],
    futureMembers: [
      'avoidable-rectangle',
      'extended-unique-rectangle',
    ],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1 shares the ' +
      'unique-solution assumption. E3 (P0): UR3/5/6 and Hidden UR moved from futureMembers to members. ' +
      'Each type ships as a separate per-type detector (uniqueness-extended.ts); allRectangles() is shared logic.',
  },
];
