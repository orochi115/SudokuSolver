/**
 * Run the engine over a plain newline-separated puzzle list (81-char rows,
 * '0' = empty) under a chosen strategy profile, and report solve stats.
 *
 * Purpose: a cheap per-iteration progress meter for the 727 target set
 * (data/failing-diabolical/puzzles.txt) — measure "how many of the 727 the
 * human-default profile now solves" after each new strategy, WITHOUT re-running
 * the full ~119k diabolical corpus. Reuses runCorpus() from corpus-lib; it does
 * NOT touch full-corpus.ts.
 *
 * Usage:
 *   npm run solve:list                                  # 727 set, human-default
 *   npm run solve:list -- --profile last-resort          # 727 set, full registry
 *   npm run solve:list -- --file path/to/puzzles.txt --profile human-default
 *   npm run solve:list -- --out /tmp/727.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCorpus } from './corpus-lib.js';
import { strategiesForProfile, type StrategyProfile } from '../src/strategies/profiles.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const DEFAULT_FILE = resolve(REPO, 'data/failing-diabolical/puzzles.txt');
const PROFILES: StrategyProfile[] = ['human-default', 'last-resort'];

interface Options {
  file: string;
  profile: StrategyProfile;
  limit: number;
  out: string | null;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = { file: DEFAULT_FILE, profile: 'human-default', limit: Infinity, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i]!;
    if (arg === '--file') opts.file = resolve(process.cwd(), next());
    else if (arg === '--profile') opts.profile = next() as StrategyProfile;
    else if (arg === '--limit') opts.limit = Number(next());
    else if (arg === '--out') opts.out = resolve(process.cwd(), next());
    else if (arg === '-h' || arg === '--help') {
      console.log('usage: npm run solve:list -- [--file <path>] [--profile human-default|last-resort] [--limit N] [--out file.json]');
      process.exit(0);
    }
  }
  if (!PROFILES.includes(opts.profile)) throw new Error(`unknown profile: ${opts.profile}`);
  return opts;
}

/** Read 81-char puzzle rows from a file, ignoring blank lines / comments. */
export function readPuzzleList(file: string, limit = Infinity): string[] {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const puzzles: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    if (line.length !== 81) throw new Error(`expected 81-char puzzle row, got length ${line.length}: ${line.slice(0, 20)}…`);
    puzzles.push(line);
    if (puzzles.length >= limit) break;
  }
  return puzzles;
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const puzzles = readPuzzleList(opts.file, opts.limit);
  const stats = runCorpus(puzzles, {
    strategies: strategiesForProfile(opts.profile),
    progressEvery: 50,
    onProgress: (pStats) => {
      console.log(`Progress: ${pStats.n}/${puzzles.length} checked. Solved: ${pStats.solved}`);
    }
  });

  console.error(`file:    ${opts.file}`);
  console.error(`profile: ${opts.profile}`);
  console.error(
    `${stats.solved}/${stats.n} solved (validSolved ${stats.validSolved}), stuck ${stats.stuck}, errors ${stats.errors}`,
  );
  if (stats.validSolved !== stats.solved) {
    console.error(`WARNING: ${stats.solved - stats.validSolved} solved-but-invalid — investigate`);
  }

  if (opts.out) {
    mkdirSync(dirname(opts.out), { recursive: true });
    const report = { generatedAt: new Date().toISOString(), file: opts.file, profile: opts.profile, stats };
    writeFileSync(opts.out, JSON.stringify(report, null, 2) + '\n');
    console.error(`wrote ${opts.out}`);
  }
}

// Run only as a script, not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
