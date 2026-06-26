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
      'Skyscraper/2-string-kite/empty-rectangle fire first by difficulty; turbot-fish is a short-X-Cycle presentation alias ' +
      'reusing the x-chain engine (E2). Future X-Cycle/rectangle-elimination must reuse this owner.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-als', 'aic-with-ur'],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. Nice-loop owns continuous/discontinuous ' +
      'AIC-loop kinds; aic no longer emits loop results (E6). AIC-with-ALS/UR reuse chain presentation.',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs'],
    futureMembers: [],
    unified: false,
    note:
      'ALS-XY-Wing is the k=3 special case of the general ALS-chain search (E4); ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS ' +
      'and is intentionally not implemented standalone. AHS is the hidden dual and shares the ALS-chain infrastructure.',
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
    ],
    futureMembers: [],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Types 1–6 and Hidden UR share a single UR engine (E3). ' +
      'Avoidable Rectangle, Extended UR, Unique Loop, BUG-Lite and BUG+n extend the same unique-solution assumption.',
  },
  {
    id: 'coloring',
    canonicalOwner: 'simple-coloring',
    members: ['simple-coloring', 'multi-coloring', '3d-medusa'],
    futureMembers: [],
    unified: false,
    note:
      'Coloring family: Simple Coloring (single-digit, one cluster), Multi-Coloring (single-digit, multiple clusters / X-Colors), ' +
      'and 3D Medusa (multi-digit). X-Colors / Color Wing / Supercoloring are subsumed under multi-coloring.',
  },
  {
    id: 'advanced-wing',
    canonicalOwner: 'xy-wing',
    members: ['xy-wing', 'xyz-wing', 'w-wing', 'wxyz-wing', 'remote-pairs', 'bent-sets', 'broken-wing'],
    futureMembers: ['vwxyz-wing'],
    unified: false,
    note:
      'Wing family: XY/XYZ/W/WXYZ-Wing, Remote Pairs (bivalue chain), Bent Sets (ALP/ALT / chute remote pairs), and Broken Wing ' +
      '(oddagon / single-digit cycle with guardians).',
  },
  {
    id: 'exotic',
    canonicalOwner: 'sue-de-coq',
    members: ['sue-de-coq', 'tridagon'],
    futureMembers: ['exocet', 'sk-loop', 'msls', 'fireworks', 'aligned-pair-exclusion', 'aligned-triple-exclusion', 'subset-exclusion', 'sue-de-coq-extended', 'franken-fish', 'mutant-fish', 'gurth'],
    unified: false,
    note:
      'Exotic / advanced pattern family. Tridagon (anti-tridagon / Thor\'s Hammer) is the first P1 exotic addition; future P2 ' +
      'exotics reuse this family registry.',
  },
];
