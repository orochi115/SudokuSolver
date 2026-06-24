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
