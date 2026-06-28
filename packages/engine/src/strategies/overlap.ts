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
      'Turbot Fish is a presentation alias reusing the same strong-link search.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop', 'remote-pairs', 'aic-with-exotic-links', 'twinned-xy-chains'],
    futureMembers: ['grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      '`grouped` is a switch on buildLinkGraph, not a separate strategy. Nice Loop handles continuous/discontinuous loops ' +
      '(AicResult *-loop kinds); aic does not emit loop results. AIC-with-exotic-links uses XW 4-cell nodes. ' +
      'Twinned XY-Chains is a 6-cell locked-set node decomposed as twin XY-cycles.',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom', 'aic-with-als'],
    futureMembers: ['als-xy-chain'],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain; ALS-W-Wing is absorbed by ALS chain / AIC-with-ALS ' +
      'and is intentionally not implemented standalone. als-xz is the representative owner pending a general ALS-chain search.',
  },
  {
    id: 'uniqueness-rectangle',
    canonicalOwner: 'unique-rectangle-type-1',
    members: [
      'unique-rectangle-type-1', 'unique-rectangle-type-2', 'unique-rectangle-type-4',
      'bug-plus-one', 'hidden-unique-rectangle',
      'unique-rectangle-type-3', 'unique-rectangle-type-5', 'unique-rectangle-type-6',
      'extended-unique-rectangle',
      'avoidable-rectangle-type-1', 'avoidable-rectangle-type-2',
      'avoidable-rectangle-type-3', 'avoidable-rectangle-type-4',
      'gurth',
    ],
    futureMembers: [],
    unified: true,
    note:
      'Deadly-pattern (uniqueness) family. Hidden UR ↔ UR Type 6 (diagonal hidden) overlap. BUG+1 shares the ' +
      'unique-solution assumption. UR types share a common rectangle-finding engine with per-type extensions. ' +
      'Gurth uses global board symmetry (automorphism) under the same unique-solution assumption.',
  },
  {
    id: 'fish',
    canonicalOwner: 'x-wing',
    members: [
      'x-wing', 'swordfish', 'jellyfish',
      'finned-x-wing', 'finned-swordfish', 'finned-jellyfish',
      'franken-fish', 'mutant-fish',
    ],
    futureMembers: [],
    unified: false,
    note:
      'Fish family: basic fish (X-Wing/Swordfish/Jellyfish) compare rows vs columns. ' +
      'Finned fish add exo-fins. Franken fish mix boxes into one side. ' +
      'Mutant fish freely mix rows, columns, and boxes in defining/secondary sets.',
  },
  {
    id: 'subset-exclusion',
    canonicalOwner: 'subset-exclusion',
    members: ['subset-exclusion', 'aligned-pair-exclusion', 'aligned-triple-exclusion'],
    futureMembers: [],
    unified: false,
    note:
      'Subset Exclusion generalises APE/ATE by dropping the alignment requirement. ' +
      'APE (k=2 aligned) and ATE (k=3 aligned) are special cases. ' +
      'Subset Counting (Extended Subset Principle) is the dual counting form.',
  },
  {
    id: 'sue-de-coq',
    canonicalOwner: 'sue-de-coq',
    members: ['sue-de-coq', 'sue-de-coq-extended'],
    futureMembers: [],
    unified: true,
    note:
      'Sue de Coq family: basic SdC handles 2-cell/4-candidate and 3-cell/5-candidate forms. ' +
      'Extended SdC handles larger companion groups and extension candidates.',
  },
];
