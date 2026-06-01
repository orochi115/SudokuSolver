import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseOpenSudoku } from '../src/parser.js';
import { findGroundTruth } from '../src/bruteforce.js';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const EASY = resolve(REPO_ROOT, 'puzzles/easy.opensudoku');
const GT_DIR = resolve(REPO_ROOT, 'data/ground-truth');

const hasCorpus = existsSync(EASY) && readFileSync(EASY, 'utf8').includes('<game');
const hasGroundTruth = existsSync(resolve(GT_DIR, 'easy.json'));

describe.skipIf(!hasCorpus)('corpus integration (AC-1)', () => {
  it('parses real puzzles and brute-force-solves a sample to unique solutions', () => {
    const xml = readFileSync(EASY, 'utf8');
    const puzzles = parseOpenSudoku(xml);
    expect(puzzles.length).toBeGreaterThan(100);

    const sample = puzzles.slice(0, 25);
    for (const p of sample) {
      expect(p.data.length).toBe(81);
      const gt = findGroundTruth(p.data);
      expect(gt.solution).not.toBeNull();
      expect(gt.solution!.length).toBe(81);
      expect(gt.unique).toBe(true);
    }
  });
});

describe.skipIf(!hasGroundTruth)('soundness regression (AC-3)', () => {
  const difficulties = ['easy', 'medium', 'hard', 'diabolical'] as const;

  for (const diff of difficulties) {
    it(`zero soundness violations on ${diff} puzzles`, () => {
      const file = resolve(GT_DIR, `${diff}.json`);
      const records: { puzzle: string; solution: string; unique: boolean }[] = JSON.parse(readFileSync(file, 'utf8'));

      let totalViolations = 0;
      for (const r of records) {
        const grid = Grid.fromString(r.puzzle);
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, r.solution);
        totalViolations += result.violations.length;
      }
      expect(totalViolations).toBe(0);
    });
  }
});
