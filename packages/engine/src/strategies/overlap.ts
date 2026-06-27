/**
 * Overlap / inclusion registry (Roadmap ② gate 3 — anti-drift).
 */

export interface OverlapFamily {
  readonly id: string;
  readonly canonicalOwner: string;
  readonly members: readonly string[];
  readonly futureMembers?: readonly string[];
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
      'All one single-digit strong-link pattern. Turbot Fish = generic 4-link strong-weak-strong; ' +
      'Skyscraper/2-string-kite/empty-rectangle are named presentations that fire earlier by difficulty. ' +
      'x-chain is the general search owner; turbot-fish reuses it for len-4 chains.',
  },
  {
    id: 'aic-chain',
    canonicalOwner: 'aic',
    members: ['aic', 'x-chain', 'w-wing', 'xy-chain', 'nice-loop'],
    futureMembers: ['remote-pairs', 'grouped-aic'],
    unified: false,
    note:
      'Chain nesting: Remote Pairs ⊂ XY-Chain ⊂ AIC; W-Wing is a short bivalue chain; X-Chain is single-digit AIC. ' +
      'nice-loop owns AicResult *-loop kinds; aic emits open chains only (type1/type2).',
  },
  {
    id: 'als-chain',
    canonicalOwner: 'als-xz',
    members: ['als-xz', 'als-xz-doubly-linked', 'als-xy-wing', 'death-blossom'],
    futureMembers: ['als-xy-chain', 'aic-with-als'],
    unified: false,
    note:
      'ALS-XY-Wing is the len-2 special case of a general ALS chain; als-xz is the representative owner.',
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
    futureMembers: ['avoidable-rectangle', 'extended-unique-rectangle'],
    unified: true,
    note:
      'Deadly-pattern family via shared ur-engine. Hidden UR ↔ UR Type 6 overlap. BUG+1 shares uniqueness assumption.',
  },
];