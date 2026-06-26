/**
 * 727 soundness + progress judge (round2 R3).
 *
 * verify.sh copies this into the worker's worktree root and runs it with tsx.
 * For each of the 727 target puzzles, under the chosen profile (R2_PROFILE env):
 *   - brute-force the unique solution (oracle),
 *   - run the engine's solve(), and
 *   - run checkTraceSoundness against the oracle — PER-STEP soundness on the REAL
 *     target set (round2 v1 only checked the 400 ground-truth, so unsound-on-727
 *     solving slipped through).
 * Gate: ANY per-step violation => exit 1 (hard fail). Emits solved/validSolved/
 * stuck/violations as JSON for the report. (Note: this catches UNSOUND solving;
 * it does NOT catch sound-but-forcing-disguised solving — that is the pollution
 * heuristic in verify.sh + the subjective review.)
 */
import { readFileSync } from 'node:fs';
import {
  Grid,
  solve,
  checkTraceSoundness,
  solveBruteforce,
  strategiesForProfile,
  STRATEGIES,
} from './packages/engine/src/index.js';

const profile = (process.env.R2_PROFILE ?? 'human-default') as 'human-default' | 'last-resort';
const file = process.env.R2_727_FILE ?? 'data/failing-diabolical/puzzles.txt';
const strategies = strategiesForProfile(profile);

const puzzles = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length === 81 && !l.startsWith('#'));

let solved = 0;
let validSolved = 0;
let stuck = 0;
let errors = 0;
let totalViolations = 0;
const offenders: Array<{ puzzle: string; strategyId: string; violations: number }> = [];

for (const puzzle of puzzles) {
  let solution: string | null = null;
  try {
    solution = solveBruteforce(puzzle);
  } catch {
    errors++;
    continue;
  }
  if (!solution) {
    errors++;
    continue;
  }
  let trace;
  try {
    trace = solve(Grid.fromString(puzzle), strategies);
  } catch {
    errors++;
    continue;
  }
  if (trace.outcome === 'solved') solved++;
  else stuck++;

  const result = checkTraceSoundness(trace, solution);
  if (result.violations.length > 0) {
    totalViolations += result.violations.length;
    if (offenders.length < 10) {
      offenders.push({
        puzzle,
        strategyId: result.violations[0]?.strategyId ?? '?',
        violations: result.violations.length,
      });
    }
  } else if (trace.outcome === 'solved') {
    validSolved++;
  }
}

console.log(
  JSON.stringify(
    {
      profile,
      n: puzzles.length,
      solved,
      validSolved,
      stuck,
      errors,
      totalViolations,
      offenders,
      strategyIds: STRATEGIES.map((s) => s.id),
    },
    null,
    2,
  ),
);

if (totalViolations > 0) {
  console.error(`727 SOUNDNESS FAIL (${profile}): ${totalViolations} per-step violation(s) on the 727 target set`);
  process.exit(1);
}
console.error(`727 SOUNDNESS OK (${profile}): ${solved}/${puzzles.length} solved, 0 violations`);
