/**
 * Kraken Fish (P3 — last resort) — 海怪鱼.
 *
 * A Kraken Fish is a (finned) fish whose elimination is reinforced by forcing
 * chains: each fin, taken as a true candidate, implies (via a chain) that the
 * fish's base elimination candidate is false; and with the fish itself false the
 * same candidate is also false — so it is eliminated in all cases.
 *
 * Full Kraken-Fish detection requires (a) a sound finned-fish finder and (b) a
 * forcing-chain endpoint search from each fin — a large surface for unsound edge
 * cases. To stay SOUND on the 400 ground-truth set without calling the
 * brute-force solver, this strategy is registered but CONSERVATIVELY INACTIVE:
 * it returns null. This mirrors the existing conservative pattern used by
 * `exocet` / `sk-loop` / `msls` / `fireworks` (see exotic-extra.ts): registered
 * id, last-resort only, sound by construction (no eliminations).
 *
 * It remains the named owner so the engine knows the strategyId and so a future
 * full detector can fill it in. It is in LAST_RESORT_IDS and never enters the
 * human-default profile.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const krakenFish: Strategy = {
  id: 'kraken-fish',
  name: { zh: '海怪鱼', en: 'Kraken Fish' },
  difficulty: 9200,
  tieBreak: ['size', 'digit', 'cell-index'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};
