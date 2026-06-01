import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

/**
 * AC-3 soundness regression: across ALL ground-truth puzzles (400 = 4 × 100),
 * every step the engine takes must agree with the unique solution — no bad
 * placement, no bad elimination. This is the project's strongest guard.
 */

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');

interface GTRecord {
  puzzle: string;
  solution: string;
  unique: boolean;
}

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

function loadAll(): { diff: string; rec: GTRecord }[] {
  const out: { diff: string; rec: GTRecord }[] = [];
  for (const diff of DIFFICULTIES) {
    const file = resolve(GT_DIR, `${diff}.json`);
    if (!existsSync(file)) continue;
    const records = JSON.parse(readFileSync(file, 'utf8')) as GTRecord[];
    for (const rec of records) out.push({ diff, rec });
  }
  return out;
}

describe('AC-3 soundness regression over all ground-truth puzzles', () => {
  const all = loadAll();

  it('loads the full 400-puzzle ground-truth set', () => {
    expect(all.length).toBe(400);
  });

  it('produces zero soundness violations on every puzzle', () => {
    const failures: { diff: string; puzzle: string; violations: number; detail: unknown }[] = [];
    for (const { diff, rec } of all) {
      const trace = solve(Grid.fromString(rec.puzzle), STRATEGIES);
      const result = checkTraceSoundness(trace, rec.solution);
      if (!result.sound) {
        failures.push({ diff, puzzle: rec.puzzle, violations: result.violations.length, detail: result.violations[0] });
      }
    }
    expect(failures).toEqual([]);
  });

  it('solves all easy puzzles with human strategies', () => {
    const easy = all.filter((x) => x.diff === 'easy');
    const solved = easy.filter((x) => solve(Grid.fromString(x.rec.puzzle), STRATEGIES).outcome === 'solved');
    expect(solved.length).toBe(easy.length);
  });
});
