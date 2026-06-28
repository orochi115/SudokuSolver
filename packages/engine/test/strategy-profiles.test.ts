/**
 * Roadmap ② gates 1 & 2: strategy profiles + frozen global priority table.
 */
import { describe, expect, it } from 'vitest';
import { STRATEGIES, CANONICAL_STRATEGY_ORDER } from '../src/strategies/index.js';
import {
  HUMAN_DEFAULT_STRATEGIES,
  LAST_RESORT_STRATEGIES,
  LAST_RESORT_IDS,
  STRATEGY_PROFILES,
  DEFAULT_PROFILE,
  strategiesForProfile,
} from '../src/strategies/profiles.js';

describe('gate 2 — frozen global priority table', () => {
  it('STRATEGIES order matches CANONICAL_STRATEGY_ORDER exactly', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual([...CANONICAL_STRATEGY_ORDER]);
  });

  it('is sorted by difficulty (ascending)', () => {
    for (let i = 1; i < STRATEGIES.length; i++) {
      expect(STRATEGIES[i]!.difficulty).toBeGreaterThanOrEqual(STRATEGIES[i - 1]!.difficulty);
    }
  });

  it('has no two strategies sharing a difficulty (strict total order)', () => {
    const diffs = STRATEGIES.map((s) => s.difficulty);
    expect(new Set(diffs).size).toBe(diffs.length);
  });

  it('has unique strategy ids', () => {
    const ids = STRATEGIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('gate 1 — strategy profiles', () => {
  it('human-default excludes every last-resort id', () => {
    const humanIds = new Set(HUMAN_DEFAULT_STRATEGIES.map((s) => s.id));
    for (const id of LAST_RESORT_IDS) {
      expect(humanIds.has(id)).toBe(false);
    }
  });

  it('human-default excludes forcing-chain specifically', () => {
    expect(HUMAN_DEFAULT_STRATEGIES.some((s) => s.id === 'forcing-chain')).toBe(false);
  });

  it('last-resort is the full registry and includes forcing-chain', () => {
    expect(LAST_RESORT_STRATEGIES.map((s) => s.id)).toEqual(STRATEGIES.map((s) => s.id));
    expect(LAST_RESORT_STRATEGIES.some((s) => s.id === 'forcing-chain')).toBe(true);
  });

  it('human-default + last-resort-only ids partition the registry', () => {
    const human = HUMAN_DEFAULT_STRATEGIES.length;
    const excluded = STRATEGIES.filter((s) => LAST_RESORT_IDS.has(s.id)).length;
    expect(human + excluded).toBe(STRATEGIES.length);
  });

  it('every last-resort id refers to a registered strategy', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    for (const id of LAST_RESORT_IDS) expect(ids.has(id)).toBe(true);
  });

  it('both profiles are sorted by difficulty', () => {
    for (const list of Object.values(STRATEGY_PROFILES)) {
      for (let i = 1; i < list.length; i++) {
        expect(list[i]!.difficulty).toBeGreaterThanOrEqual(list[i - 1]!.difficulty);
      }
    }
  });

  it('DEFAULT_PROFILE is human-default and resolves correctly', () => {
    expect(DEFAULT_PROFILE).toBe('human-default');
    expect(strategiesForProfile()).toBe(STRATEGY_PROFILES['human-default']);
    expect(strategiesForProfile('last-resort')).toBe(STRATEGY_PROFILES['last-resort']);
  });
});

describe('P3 anti-pollution gate — every P3 id is last-resort only', () => {
  const P3_IDS = [
    'forcing-chain',
    'digit-forcing-chain',
    'nishio-forcing-chain',
    'cell-forcing-chain',
    'region-forcing-chain',
    'dic',
    'forcing-net',
    'kraken-fish',
    'tabling',
    'pom',
    'templates',
    'gem',
  ] as const;

  const humanIds = new Set(HUMAN_DEFAULT_STRATEGIES.map((s) => s.id));
  const registeredIds = new Set(STRATEGIES.map((s) => s.id));

  for (const id of P3_IDS) {
    it(`${id} is in LAST_RESORT_IDS`, () => {
      expect(LAST_RESORT_IDS.has(id)).toBe(true);
    });
    it(`${id} is NOT in human-default profile`, () => {
      expect(humanIds.has(id)).toBe(false);
    });
    it(`${id} is registered in STRATEGIES`, () => {
      expect(registeredIds.has(id)).toBe(true);
    });
  }

  it('all P3 ids have difficulty >= 9000 (last-resort band)', () => {
    for (const id of P3_IDS) {
      const strategy = STRATEGIES.find((s) => s.id === id);
      expect(strategy).toBeDefined();
      expect(strategy!.difficulty).toBeGreaterThanOrEqual(9000);
    }
  });

  it('no P3 id shares a difficulty with another strategy', () => {
    const p3Diffs = P3_IDS.map((id) => STRATEGIES.find((s) => s.id === id)!.difficulty);
    expect(new Set(p3Diffs).size).toBe(p3Diffs.length);
  });
});
