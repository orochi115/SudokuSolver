import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

describe('soundness regression (NFR-1 / AC-3)', () => {
  for (const diff of DIFFICULTIES) {
    it(`guarantees zero violations on ${diff} puzzles`, () => {
      const filePath = resolve(REPO_ROOT, `data/ground-truth/${diff}.json`);
      if (!existsSync(filePath)) {
        return;
      }
      const content = readFileSync(filePath, 'utf8');
      const records = JSON.parse(content);

      for (const record of records) {
        const grid = Grid.fromString(record.puzzle);
        const trace = solve(grid, STRATEGIES);
        const soundnessResult = checkTraceSoundness(trace, record.solution);
        expect(soundnessResult.sound).toBe(true);
        expect(soundnessResult.violations.length).toBe(0);
      }
    });
  }
});
