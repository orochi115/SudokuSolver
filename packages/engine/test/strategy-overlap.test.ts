/**
 * Roadmap ② gates 3 & 6: overlap canonical-owner registry + chain-engine boundaries.
 */
import { describe, expect, it } from 'vitest';
import { STRATEGIES } from '../src/strategies/index.js';
import { OVERLAP_FAMILIES } from '../src/strategies/overlap.js';
import {
  HUMAN_DEFAULT_STRATEGIES,
} from '../src/strategies/profiles.js';
import { CHAIN_OWNERSHIP, MULTI_BRANCH_IDS } from '../src/chain/boundaries.js';

const registeredIds = new Set(STRATEGIES.map((s) => s.id));

describe('gate 3 — overlap canonical-owner registry', () => {
  it('each family owner is a registered strategy', () => {
    for (const fam of OVERLAP_FAMILIES) {
      expect(registeredIds.has(fam.canonicalOwner), `owner ${fam.canonicalOwner}`).toBe(true);
    }
  });

  it('every member is a registered strategy and includes the owner', () => {
    for (const fam of OVERLAP_FAMILIES) {
      expect(fam.members).toContain(fam.canonicalOwner);
      for (const m of fam.members) {
        expect(registeredIds.has(m), `member ${m} of ${fam.id}`).toBe(true);
      }
    }
  });

  it('an id is the canonical owner of at most one family', () => {
    const owners = OVERLAP_FAMILIES.map((f) => f.canonicalOwner);
    expect(new Set(owners).size).toBe(owners.length);
  });

  it('futureMembers are reserved — not yet registered as independent strategies', () => {
    for (const fam of OVERLAP_FAMILIES) {
      for (const fm of fam.futureMembers ?? []) {
        expect(
          registeredIds.has(fm),
          `${fm} is reserved to family ${fam.id}; if implemented, move it into members`,
        ).toBe(false);
      }
    }
  });
});

describe('gate 6 — chain-engine boundaries', () => {
  it('multi-branch (forcing) strategies never appear in human-default', () => {
    for (const s of HUMAN_DEFAULT_STRATEGIES) {
      expect(MULTI_BRANCH_IDS.has(s.id), `${s.id} is multi-branch`).toBe(false);
    }
  });

  it('forcing-chain is multi-branch and last-resort only', () => {
    expect(MULTI_BRANCH_IDS.has('forcing-chain')).toBe(true);
    const forcing = CHAIN_OWNERSHIP.find((c) => c.strategyId === 'forcing-chain')!;
    expect(forcing.profiles).toEqual(['last-resort']);
  });

  it('non-reserved chain owners are registered strategies', () => {
    for (const c of CHAIN_OWNERSHIP) {
      if (c.reserved) continue;
      expect(registeredIds.has(c.strategyId), `chain owner ${c.strategyId}`).toBe(true);
    }
  });
});
