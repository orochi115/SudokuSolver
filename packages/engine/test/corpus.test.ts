import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseOpenSudoku } from '../src/parser.js';
import { findGroundTruth } from '../src/bruteforce.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const EASY = resolve(REPO_ROOT, 'puzzles/easy.opensudoku');

// Integration check against the real corpus. Skipped automatically when the
// LFS-backed puzzle files are not materialised (e.g. a shallow/lfs-less clone).
const hasCorpus = existsSync(EASY) && readFileSync(EASY, 'utf8').includes('<game');

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
