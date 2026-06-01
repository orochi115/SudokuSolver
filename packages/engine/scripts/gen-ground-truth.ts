/**
 * Ground-truth generation (AC-1).
 *
 * Samples a fixed, reproducible subset of each difficulty file and writes
 * { puzzle, solution, unique } records to data/ground-truth/<difficulty>.json.
 *
 * The committed sample is the SHARED, FROZEN grading set every model branch
 * scores against (see docs/milestones/M1.md and the multi-model rubric), so the
 * sampling here is deterministic (fixed stride, fixed count) — no randomness.
 *
 * Usage:  npm run gen:ground-truth            # default 100/difficulty
 *         SAMPLE=300 npm run gen:ground-truth  # override sample size
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { findGroundTruth } from '../src/bruteforce.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '../../..');
const OUT_DIR = resolve(REPO_ROOT, 'data/ground-truth');

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;
const SAMPLE = Number(process.env.SAMPLE ?? '100');

const DATA_RE = /\bdata="(\d{81})"/g;

/** Pull up to `count` puzzle strings spread evenly across a file's games. */
function sampleData(xml: string, count: number): string[] {
  const all: string[] = [];
  let m: RegExpExecArray | null;
  DATA_RE.lastIndex = 0;
  while ((m = DATA_RE.exec(xml)) !== null) all.push(m[1]!);
  if (all.length <= count) return all;
  const stride = Math.floor(all.length / count);
  const picked: string[] = [];
  for (let i = 0; i < all.length && picked.length < count; i += stride) picked.push(all[i]!);
  return picked;
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const summary: Record<string, { sampled: number; solved: number; unique: number }> = {};

  for (const diff of DIFFICULTIES) {
    const file = resolve(REPO_ROOT, `puzzles/${diff}.opensudoku`);
    if (!existsSync(file)) {
      console.warn(`skip ${diff}: ${file} not found (Git LFS not pulled?)`);
      continue;
    }
    const xml = readFileSync(file, 'utf8');
    const puzzles = sampleData(xml, SAMPLE);
    const records = puzzles.map((puzzle) => findGroundTruth(puzzle));
    const solved = records.filter((r) => r.solution !== null).length;
    const unique = records.filter((r) => r.unique).length;
    summary[diff] = { sampled: records.length, solved, unique };

    const outFile = resolve(OUT_DIR, `${diff}.json`);
    writeFileSync(outFile, JSON.stringify(records, null, 0) + '\n');
    console.log(`${diff}: sampled=${records.length} solved=${solved} unique=${unique} -> ${outFile}`);
  }

  writeFileSync(resolve(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log('summary written to data/ground-truth/summary.json');
}

main();
