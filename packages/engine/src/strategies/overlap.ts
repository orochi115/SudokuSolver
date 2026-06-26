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
    futureMembers: ['rectangle-elimination', 'grouped-x-cycle'],
    unified: false,
    note:
      'All one single-digit strong-link pattern. Turbot Fish = skyscraper/2-string-kite/empty-rectangle unified 4-link; ' +
      'X-Cycle = single-digit Nice Loop; X-Wing = length-4 continuous X-Cycle (lives in the fish family, cross-ref only). ' +
      'Skyscraper/2-string-kite/empty-rectangle currently fire first by difficulty; x-chain is the general fallback. ' +
      'Turbot/X-Cycle must reuse this, not add a 4th independent detector.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-als', 'aic-with-ur', 'aic-with-exotic-links', 'twinned-xy-chains'],
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
    futureMembers: [],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain (E4: folded). ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS ' +
      'and is intentionally not implemented standalone. als-xz is the representative owner; als-chain is the general search.',
  },
  {
    id: 'uniqueness-rectangle',
    canonicalOwner: 'unique-rectangle-type-1',
    members: ['unique-rectangle-type-1', 'unique-rectangle-type-2', 'unique-rectangle-type-3', 'unique-rectangle-type-4', 'unique-rectangle-type-5', 'unique-rectangle-type-6', 'hidden-unique-rectangle', 'bug-plus-one', 'avoidable-rectangle-type-1', 'avoidable-rectangle-type-2', 'avoidable-rectangle-type-3', 'avoidable-rectangle-type-4', 'extended-unique-rectangle', 'unique-loop', 'bug-lite', 'bug-plus-n', 'gurth'],
    futureMembers: [],
    unified: false,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1 shares the ' +
      'unique-solution assumption. UR types currently ship as per-type detectors.',
  },
  {
    id: 'coloring',
    canonicalOwner: 'simple-coloring',
    members: ['simple-coloring', 'multi-coloring', '3d-medusa', 'gurth'],
    futureMembers: [],
    unified: false,
    note:
      'Coloring family: Simple Coloring (single-digit, one cluster), Multi-Coloring (single-digit, multiple clusters), ' +
      '3D Medusa (multi-digit bi-value/bi-location coloring). X-Colors/Weak Colors/Color Wing/Supercoloring are all ' +
      'single-digit extensions and are subsumed by Multi-Coloring.',
  },
  {
    id: 'exotic',
    canonicalOwner: 'sue-de-coq',
    members: ['sue-de-coq', 'sue-de-coq-extended', 'tridagon', 'exocet', 'sk-loop', 'msls', 'fireworks', 'aligned-pair-exclusion', 'aligned-triple-exclusion', 'subset-exclusion'],
    futureMembers: [],
    unified: false,
    note:
      'Exotic/rare techniques. Tridagon (anti-Tridagon / Thor\'s Hammer) is a 12-cell deadly pattern using parity ' +
      'contradiction (not uniqueness). Sue-De-Coq is the current owner.',
  },
  {
    id: 'wing',
    canonicalOwner: 'xy-wing',
    members: ['xy-wing', 'xyz-wing', 'w-wing', 'wxyz-wing', 'vwxyz-wing', 'bent-sets'],
    futureMembers: [],
    unified: false,
    note:
      'Wing family: XY-Wing (3-cell bivalue), XYZ-Wing (4-cell), W-Wing, WXYZ-Wing (generalised ALS wing), ' +
      'Bent Sets (ALP/ALT / Chute Remote Pairs). VWXYZ-Wing is the size-ladder extension reserved for P2.',
  },
  {
    id: 'fish',
    canonicalOwner: 'x-wing',
    members: ['x-wing', 'swordfish', 'jellyfish', 'finned-x-wing', 'finned-swordfish', 'finned-jellyfish', 'franken-fish', 'mutant-fish'],
    futureMembers: [],
    unified: false,
    note: 'Fish family: basic, finned, franken, mutant fish.',
  },
];
