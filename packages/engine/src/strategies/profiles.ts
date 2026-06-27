/**
 * Strategy profiles (Roadmap ② gate 1 — anti-drift).
 *
 * The engine separates a `human-default` profile from a `last-resort` profile:
 *
 *  - `human-default` is the DEFAULT solving path and the one Roadmap ② uses to
 *    measure progress on the 727 diabolical corpus. It deliberately EXCLUDES the
 *    P3 / red-line strategies (currently `forcing-chain`), which lean toward
 *    enumeration / contradiction search rather than nameable human deductions.
 *    The 727 target is to reach 100% with this profile BEFORE any P3 technique.
 *
 *  - `last-resort` is the full registry (human-default + the P3 strategies). It
 *    is retained as a historical regression guard: it must not lose solved
 *    puzzles or introduce invalid solutions as the human techniques grow.
 *
 * Membership is expressed as an id-set (not a field on `Strategy`) so strategy
 * implementations stay pure and so future P3 strategies only need their id added
 * to `LAST_RESORT_IDS`.
 */

import type { Strategy } from '../strategy.js';
import { STRATEGIES } from './index.js';

export type StrategyProfile = 'human-default' | 'last-resort';

/**
 * Ids excluded from `human-default`: P3 / red-line last-resort techniques.
 * Add a strategy's id here when it is classified as P3 (forcing nets, Kraken,
 * POM, templates, GEM, …) — see docs/plans/diabolical-727.md § P3.
 */
export const LAST_RESORT_IDS: ReadonlySet<string> = new Set<string>([
  'forcing-chain',
  // P3 forcing-chain sub-types (reuse the forcing engine, named by premise type)
  'digit-forcing-chain',
  'nishio-forcing-chain',
  'cell-forcing-chain',
  'region-forcing-chain',
  'dic',
  // P3 forcing net (multi-branch owner)
  'forcing-net',
  // P3 fish + chains combination
  'kraken-fish',
  // P3 enumeration class
  'tabling',
  'pom',
  'templates',
  'gem',
]);

/** Strategies in the default human-solving path (excludes P3 / red-line). */
export const HUMAN_DEFAULT_STRATEGIES: readonly Strategy[] = STRATEGIES.filter(
  (s) => !LAST_RESORT_IDS.has(s.id),
);

/** The full registry, including P3 / red-line strategies. */
export const LAST_RESORT_STRATEGIES: readonly Strategy[] = STRATEGIES;

export const STRATEGY_PROFILES: Record<StrategyProfile, readonly Strategy[]> = {
  'human-default': HUMAN_DEFAULT_STRATEGIES,
  'last-resort': LAST_RESORT_STRATEGIES,
};

/** The profile used by default consumers (solver scripts, corpus runs). */
export const DEFAULT_PROFILE: StrategyProfile = 'human-default';

/** Resolve a profile name to its strategy list (defaults to DEFAULT_PROFILE). */
export function strategiesForProfile(profile: StrategyProfile = DEFAULT_PROFILE): readonly Strategy[] {
  return STRATEGY_PROFILES[profile];
}
