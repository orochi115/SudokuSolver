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
      'Skyscraper/2-string-kite/empty-rectangle fire first by difficulty; x-chain + turbot-fish share the general ' +
      'single-digit alternating-chain detector. (E2 — single-digit strong-link family unified.)',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'aic-with-als', 'aic-with-ur', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs'],
    futureMembers: ['grouped-aic'],
    unified: true,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. Continuous/discontinuous Nice Loops ' +
      'are owned by `nice-loop`; `aic` only emits open-chain Type-1/Type-2 findings. AIC-with-ALS and AIC-with-UR ' +
      'are presentation aliases over the same search engine, labelling chains that pass through ALS / UR nodes. ' +
      '(E6 — chain engine ownership settled: AicResult *-loop kinds emitted under nice-loop, never under aic.)',
  },
  {
    id: 'fish',
    canonicalOwner: 'x-wing',
    members: ['x-wing', 'swordfish', 'jellyfish', 'finned-x-wing', 'finned-swordfish', 'finned-jellyfish', 'franken-fish', 'mutant-fish'],
    futureMembers: [],
    unified: true,
    note:
      'Basic fish (size 2/3/4) and their Finned/Sashimi variants share the base/cover + fin detector. ' +
      'Franken/Mutant fish reuse the same owner when added.',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-chain',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'als-chain', 'ahs'],
    futureMembers: [],
    unified: true,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain; ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS ' +
      'and is intentionally not implemented standalone. `als-chain` is the canonical owner (general ALS chain search). ' +
      '`ahs` (Almost Hidden Set) is the dual of ALS and shares the same chain engine. ' +
      '(E4 — ALS family unified around als-chain as the canonical owner; als-xy-wing remains as a registered id for ' +
      'precedence / labelling but its underlying logic is the len-3 case of als-chain.)',
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
      'bug-plus-n',
      'bug-lite',
      'unique-loop',
      'avoidable-rectangle-type-1',
      'avoidable-rectangle-type-2',
      'avoidable-rectangle-type-3',
      'avoidable-rectangle-type-4',
      'extended-unique-rectangle',
    ],
    futureMembers: [],
    unified: true,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1, BUG+N, BUG-Lite, ' +
      'and Unique Loop share the unique-solution assumption. Avoidable Rectangle Types 1–4 mirror UR Types 1–4 ' +
      'using solved cells instead of pencilmarks. Extended UR is the 2×3 / 3-digit generalisation. ' +
      '(E3 — UR family unified around a shared UR-context predicate.)',
  },
  {
    id: 'coloring',
    canonicalOwner: 'multi-coloring',
    members: ['simple-coloring', 'multi-coloring', '3d-medusa'],
    futureMembers: [],
    unified: true,
    note:
      'Coloring family: Simple Coloring (single-digit, no promotion); Multi-Coloring (X-Colors with promotion; ' +
      'subsumes Multi-Colors, Weak Colors, Color Wing, Supercoloring per Sudopedia); 3D Medusa is the multi-digit ' +
      'generalisation (medusa cells/digits with bi-location + bi-value strong links). All rules fire under ' +
      '`multi-coloring` or `3d-medusa`.',
  },
  {
    id: 'exotic',
    canonicalOwner: 'tridagon',
    members: [
      'tridagon',
      'sue-de-coq',
      'sue-de-coq-extended',
      'fireworks',
      'franken-fish',
      'mutant-fish',
      'aligned-pair-exclusion',
      'aligned-triple-exclusion',
      'subset-exclusion',
      'gurth',
      'exocet',
      'sk-loop',
      'msls',
    ],
    futureMembers: [],
    unified: false,
    note:
      'Exotic family: rare techniques on the hardest puzzles. `tridagon` (Thors Hammer) and `sue-de-coq` are the ' +
      'currently implemented P1 / P2 members. Franken/Mutant fish are in the fish family as well; Subset Exclusion ' +
      'is the canonical owner of APE/ATE generalisation; Gurth is the symmetry-based uniqueness technique. ' +
      'All members reuse the canonical owner family pattern.',
  },
];