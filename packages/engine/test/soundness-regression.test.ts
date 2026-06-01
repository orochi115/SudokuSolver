import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'] as const;

/**
 * AC-3 regression: every step of every puzzle in the ground-truth set must
 * pass the soundness check. Zero violations across all 400 puzzles.
 */
describe('AC-3: soundness regression (all 400 puzzles)', () => {
  for (const diff of DIFFICULTIES) {
    it(`${diff}: all traces are sound`, () => {
      const file = resolve(__dirname, `../../../data/ground-truth/${diff}.json`);
      const records: { puzzle: string; solution: string }[] = JSON.parse(readFileSync(file, 'utf8'));
      const violations: { puzzleIndex: number; message: string }[] = [];

      for (let i = 0; i < records.length; i++) {
        const rec = records[i]!;
        const grid = Grid.fromString(rec.puzzle);
        const trace = solve(grid, STRATEGIES);
        const result = checkTraceSoundness(trace, rec.solution);

        if (!result.sound) {
          for (const v of result.violations) {
            violations.push({
              puzzleIndex: i,
              message: `step ${v.stepIndex} [${v.strategyId}] ${v.kind}: cell=${v.cell} digit=${v.digit} expected=${v.expected}`,
            });
          }
        }
      }

      if (violations.length > 0) {
        const summary = violations.slice(0, 5).map((v) => `  ${diff}[${v.puzzleIndex}]: ${v.message}`).join('\n');
        expect.fail(`${violations.length} soundness violations in ${diff}:\n${summary}`);
      }
    });
  }
});