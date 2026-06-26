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
    // E2: turbot-fish moved from futureMembers to members (P0 implementation complete)
    members: ['x-chain', 'skyscraper', 'two-string-kite', 'empty-rectangle', 'turbot-fish'],
    futureMembers: ['x-cycle', 'rectangle-elimination', 'grouped-x-cycle'],
    unified: false,
    note:
      'All one single-digit strong-link pattern. Turbot Fish = skyscraper/2-string-kite/empty-rectangle unified 4-link; ' +
      'X-Cycle = single-digit Nice Loop; X-Wing = length-4 continuous X-Cycle (lives in the fish family, cross-ref only). ' +
      'Skyscraper/2-string-kite/empty-rectangle currently fire first by difficulty; turbot-fish is the generic fallback; ' +
      'x-chain is the longer-chain fallback. (E2: unified=false retained; turbot added as member P0)',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    // E6: xy-chain and nice-loop moved from futureMembers to members (P0 implementation complete)
    // P1: remote-pairs moved from futureMembers to members (P1 implementation complete)
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs'],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. Continuous/discontinuous Nice Loops ' +
      '(AicResult *-loop kinds) are owned by nice-loop (E6) and must not be emitted under id "aic". ' +
      'XY-Chain is the bivalue-only AIC (P0 implementation). Nice Loop owns all *-loop AIC results (E6). ' +
      'Remote Pairs is the XY-Chain subcase where all chain cells share the same bivalue pair (P1).',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    // E4: als-chain implemented in P1; als-xy-wing is its len-2 special case (alias).
    // P1: als-chain, ahs, aic-with-als moved from futureMembers to members.
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs', 'aic-with-als'],
    futureMembers: [],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain (E4: als-xy-wing is alias/folded under als-chain). ' +
      'als-chain implements the general N-node ALS chain. ahs is the dual (Almost Hidden Set). ' +
      'aic-with-als uses ALS nodes in AIC chains. als-xz is the representative owner.',
  },
  {
    id: 'uniqueness-rectangle',
    canonicalOwner: 'unique-rectangle-type-1',
    // E3: UR type-3/5/6 and hidden-ur moved from futureMembers to members (P0 implementation complete)
    // P1: AR types 1-4, EUR, unique-loop, bug-lite, bug-plus-n moved from futureMembers to members
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
    ],
    futureMembers: [],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1 shares the ' +
      'unique-solution assumption. UR types ship as per-type detectors sharing allRectangles() generator (E3). ' +
      'AR types require given-cell tracking (implemented as stubs pending Grid.isGiven() API). ' +
      'EUR (2x3), unique-loop, bug-lite, bug-plus-n added in P1.',
  },
];
