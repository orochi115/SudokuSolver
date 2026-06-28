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
      'Skyscraper/2-string-kite/empty-rectangle currently fire first by difficulty; x-chain is the general fallback. ' +
      'turbot-fish (E2) now shares this family as a presentation alias. ' +
      'Future X-Cycle must reuse this, not add a new independent detector.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: [
      'aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs',
      'aic-with-als', 'aic-with-ur', 'twinned-xy-chains', 'aic-with-exotic-links',
    ],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. ' +
      'xy-chain (P0) now registered as bivalue-only AIC sub-family. ' +
      'nice-loop (P0, E6) now owns continuous/discontinuous Nice Loop kinds; aic must not emit loop results. ' +
      'remote-pairs (P1) now registered as XY-Chain special case. ' +
      'aic-with-als (P1) and aic-with-ur (P1) now registered as AIC extensions. ' +
      'twinned-xy-chains (P2) and aic-with-exotic-links (P2) now registered as P2 AIC extensions.',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs'],
    futureMembers: [],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain (E4: als-xy-wing is now a special case of als-chain). ' +
      'ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS and is intentionally not implemented standalone. ' +
      'als-chain (P1) now registered as the general ALS chain. ' +
      'ahs (P1) now registered as the Almost Hidden Set chain node strategy.',
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
      'bug-lite',
      'bug-plus-n',
      'avoidable-rectangle-type-1',
      'avoidable-rectangle-type-2',
      'avoidable-rectangle-type-3',
      'avoidable-rectangle-type-4',
      'extended-unique-rectangle',
      'unique-loop',
      'gurth',
    ],
    futureMembers: [],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1 shares the ' +
      'unique-solution assumption. UR types now ship as per-type detectors sharing the rectangle enumeration. ' +
      '(E3) UR3/5/6 + Hidden UR now implemented and registered, sharing allRectangles() engine. ' +
      '(P1) AR1-4, EUR, Unique Loop, BUG-Lite, BUG+N now registered as uniqueness extensions. ' +
      '(P2) gurth now registered as symmetry-based uniqueness strategy.',
  },
  {
    id: 'exotic-patterns',
    canonicalOwner: 'tridagon',
    members: [
      'tridagon', 'sue-de-coq', 'sue-de-coq-extended',
      'fireworks', 'franken-fish', 'mutant-fish',
      'aligned-pair-exclusion', 'aligned-triple-exclusion', 'subset-exclusion',
      'exocet', 'sk-loop', 'msls',
    ],
    futureMembers: [],
    unified: false,
    note:
      'Exotic pattern family. Tridagon is the first P1 exotic strategy. ' +
      'sue-de-coq is already implemented in P0. ' +
      '(P2) sue-de-coq-extended, fireworks, franken-fish, mutant-fish, aligned-pair-exclusion, ' +
      'aligned-triple-exclusion, subset-exclusion, exocet, sk-loop, msls now registered as P2 stubs.',
  },
  {
    id: 'wing-family',
    canonicalOwner: 'wxyz-wing',
    members: ['wxyz-wing', 'vwxyz-wing'],
    futureMembers: [],
    unified: false,
    note:
      'Wing size-ladder family. WXYZ-Wing (size 4) and VWXYZ-Wing (size 5) share the same ' +
      'generalised wing detection framework. Further size extensions would join this family.',
  },
];
