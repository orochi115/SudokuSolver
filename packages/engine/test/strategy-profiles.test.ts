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

const P3_LAST_RESORT_IDS = [
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

describe('gate 2 — frozen global priority table', () => {
  it('registers every required P0 strategy id', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual(expect.arrayContaining([
      'finned-x-wing',
      'finned-swordfish',
      'finned-jellyfish',
      'turbot-fish',
      'xy-chain',
      'nice-loop',
      'hidden-unique-rectangle',
      'unique-rectangle-type-3',
      'unique-rectangle-type-5',
      'unique-rectangle-type-6',
    ]));
  });

  it('registers every required P1 strategy id exactly', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual(expect.arrayContaining([
      'tridagon',
      'multi-coloring',
      '3d-medusa',
      'als-chain',
      'ahs',
      'wxyz-wing',
      'remote-pairs',
      'bent-sets',
      'broken-wing',
      'avoidable-rectangle-type-1',
      'avoidable-rectangle-type-2',
      'avoidable-rectangle-type-3',
      'avoidable-rectangle-type-4',
      'extended-unique-rectangle',
      'unique-loop',
      'bug-lite',
      'bug-plus-n',
      'aic-with-als',
      'aic-with-ur',
    ]));
  });

  it('registers every required P2 strategy id exactly', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual(expect.arrayContaining([
      'vwxyz-wing',
      'exocet',
      'sk-loop',
      'msls',
      'fireworks',
      'aligned-pair-exclusion',
      'aligned-triple-exclusion',
      'subset-exclusion',
      'sue-de-coq-extended',
      'aic-with-exotic-links',
      'twinned-xy-chains',
      'franken-fish',
      'mutant-fish',
      'gurth',
    ]));
  });

  it('registers every required P3 last-resort strategy id exactly', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual(expect.arrayContaining([...P3_LAST_RESORT_IDS]));
  });

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

  it('P3 red-line ids are last-resort only and cannot pollute human-default', () => {
    const humanIds = new Set(HUMAN_DEFAULT_STRATEGIES.map((s) => s.id));
    for (const id of P3_LAST_RESORT_IDS) {
      expect(LAST_RESORT_IDS.has(id), `${id} must be listed in LAST_RESORT_IDS`).toBe(true);
      expect(humanIds.has(id), `${id} must not appear in human-default`).toBe(false);
    }
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
