/**
 * Shared corpus-running helpers (comparison-agnostic).
 *
 * Parses OpenSudoku puzzle files and runs the engine over them, reporting
 * per-difficulty solved / validSolved / stuck / errors plus a failure list.
 * Reused by:
 *   - packages/engine/scripts/full-corpus.ts  (current working-tree engine)
 *   - the model-comparison harness, which copies this file into a temporary
 *     worktree to run an archived branch's engine the same way.
 *
 * No model names, scoring, or comparison logic lives here — this is purely
 * "run the engine over a puzzle set and report what it solved".
 */
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';
import type { Strategy } from '../src/strategy.js';

export interface CorpusFailure {
  /** 1-based position within the parsed difficulty file (provenance only). */
  index: number;
  puzzle: string;
  outcome: string;
  final?: string;
  error?: string;
}

export interface CorpusStats {
  n: number;
  solved: number;
  validSolved: number;
  stuck: number;
  errors: number;
  failures: CorpusFailure[];
}

const GAME_RE = /<game\b[^>]*\bdata="(\d{81})"[^>]*\/?>/g;

/** Extract 81-char puzzle strings from an OpenSudoku XML document. */
export function parseOpenSudoku(xml: string, limit = Infinity): string[] {
  const out: string[] = [];
  GAME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = GAME_RE.exec(xml)) !== null && out.length < limit) out.push(m[1]!);
  return out;
}

/** A solved grid is valid iff it is fully filled, preserves givens, and every house holds 1..9. */
export function validSolved(initial: string, final: string): boolean {
  if (!/^\d{81}$/.test(final) || final.includes('0')) return false;
  for (let i = 0; i < 81; i++) if (initial[i] !== '0' && initial[i] !== final[i]) return false;
  const houses: number[][] = [];
  for (let r = 0; r < 9; r++) houses.push([...Array(9)].map((_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) houses.push([...Array(9)].map((_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
      const cells: number[] = [];
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) cells.push((br * 3 + dr) * 9 + bc * 3 + dc);
      houses.push(cells);
    }
  for (const house of houses) {
    const seen = new Set(house.map((i) => final[i]));
    if (seen.size !== 9 || seen.has('0')) return false;
  }
  return true;
}

export interface RunCorpusOptions {
  /** Added to the 0-based slice position to produce a stable 1-based `index`. */
  offset?: number;
  /** Strategy list to solve with. Defaults to the human-default profile (no P3 / forcing-chain). */
  strategies?: readonly Strategy[];
  /** Called every `progressEvery` puzzles with the running stats. */
  onProgress?: (stats: CorpusStats) => void;
  progressEvery?: number;
}

/** Run the engine over `puzzles` and accumulate solve statistics + failures. */
export function runCorpus(puzzles: string[], opts: RunCorpusOptions = {}): CorpusStats {
  const offset = opts.offset ?? 0;
  const strategies = opts.strategies ?? HUMAN_DEFAULT_STRATEGIES;
  const progressEvery = opts.progressEvery ?? 10000;
  const stats: CorpusStats = { n: 0, solved: 0, validSolved: 0, stuck: 0, errors: 0, failures: [] };
  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i]!;
    stats.n++;
    const index = offset + i + 1;
    try {
      const trace = solve(Grid.fromString(puzzle), strategies);
      if (trace.outcome === 'solved') {
        stats.solved++;
        if (validSolved(puzzle, trace.final)) stats.validSolved++;
        else stats.failures.push({ index, puzzle, outcome: 'invalid-solved', final: trace.final });
      } else {
        stats.stuck++;
        stats.failures.push({ index, puzzle, outcome: trace.outcome, final: trace.final });
      }
    } catch (err) {
      stats.errors++;
      stats.failures.push({ index, puzzle, outcome: 'error', error: err instanceof Error ? err.message : String(err) });
    }
    if (opts.onProgress && stats.n % progressEvery === 0) opts.onProgress(stats);
  }
  return stats;
}

export function mergeStats(target: CorpusStats, source: CorpusStats): void {
  target.n += source.n;
  target.solved += source.solved;
  target.validSolved += source.validSolved;
  target.stuck += source.stuck;
  target.errors += source.errors;
  target.failures.push(...source.failures);
}
