/**
 * Run the CURRENT working-tree engine over the full OpenSudoku corpus.
 *
 * Comparison-agnostic: it just runs `solve()` with the registered strategies
 * over puzzles/<difficulty>.opensudoku and reports per-difficulty
 * solved / validSolved / stuck / errors plus the failing puzzles. Use it to
 * measure the current engine, or to (re)generate data/failing-diabolical/.
 *
 * Usage:
 *   npm run corpus:run -- [--difficulty easy,medium,hard,diabolical]
 *                        [--limit N] [--workers N] [--out report.json]
 *   npx tsx packages/engine/scripts/full-corpus.ts --difficulty diabolical --limit 50
 *
 * For multi-difficulty / full (~893k) runs, --workers > 1 shards each
 * difficulty across child processes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { parseOpenSudoku, runCorpus, mergeStats, type CorpusStats } from './corpus-lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const ALL_DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'];

interface Options {
  difficulties: string[];
  limit: number;
  workers: number;
  out: string | null;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = { difficulties: ALL_DIFFICULTIES, limit: Infinity, workers: 1, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i]!;
    if (arg === '--difficulty' || arg === '--difficulties') {
      opts.difficulties = next().split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--limit') {
      opts.limit = Number(next());
    } else if (arg === '--workers') {
      opts.workers = Math.max(1, Number(next()));
    } else if (arg === '--out') {
      opts.out = resolve(process.cwd(), next());
    } else if (arg === '-h' || arg === '--help') {
      console.log('usage: npx tsx packages/engine/scripts/full-corpus.ts [--difficulty <csv>] [--limit N] [--workers N] [--out file.json]');
      process.exit(0);
    }
  }
  for (const d of opts.difficulties) {
    if (!ALL_DIFFICULTIES.includes(d)) throw new Error(`unknown difficulty: ${d}`);
  }
  return opts;
}

function corpusPath(diff: string): string {
  return resolve(REPO, 'puzzles', `${diff}.opensudoku`);
}

/** Run one difficulty in this process, optionally sharded across child processes. */
async function runDifficulty(diff: string, limit: number, workers: number): Promise<CorpusStats> {
  const puzzles = parseOpenSudoku(readFileSync(corpusPath(diff), 'utf8'), limit);
  if (workers <= 1 || puzzles.length <= 1) {
    return runCorpus(puzzles, { offset: 0 });
  }
  const size = Math.ceil(puzzles.length / workers);
  const shards: Array<{ start: number; count: number }> = [];
  for (let start = 0; start < puzzles.length; start += size) {
    shards.push({ start, count: Math.min(size, puzzles.length - start) });
  }
  const partials = await Promise.all(shards.map((s) => runShardChild(diff, limit, s.start, s.count)));
  const agg: CorpusStats = { n: 0, solved: 0, validSolved: 0, stuck: 0, errors: 0, failures: [] };
  for (const p of partials) mergeStats(agg, p);
  agg.failures.sort((a, b) => a.index - b.index);
  return agg;
}

/** Spawn this same script as a shard child (inherits the tsx loader via execArgv). */
function runShardChild(diff: string, limit: number, start: number, count: number): Promise<CorpusStats> {
  return new Promise((resolveP, rejectP) => {
    const args = [...process.execArgv, process.argv[1]!, '--__shard', diff, String(limit), String(start), String(count)];
    const child = spawn(process.execPath, args, { cwd: REPO, stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = '';
    child.stdout.on('data', (d) => (buf += d));
    child.on('error', rejectP);
    child.on('close', (code) => {
      if (code !== 0) return rejectP(new Error(`shard ${diff}[${start}] exited ${code}`));
      try {
        resolveP(JSON.parse(buf) as CorpusStats);
      } catch (e) {
        rejectP(e instanceof Error ? e : new Error(String(e)));
      }
    });
  });
}

/** Shard-child entry: run a slice and print its CorpusStats as JSON to stdout. */
function runAsShard(argv: string[]): void {
  const [diff, limitStr, startStr, countStr] = argv;
  const limit = Number(limitStr);
  const start = Number(startStr);
  const count = Number(countStr);
  const all = parseOpenSudoku(readFileSync(corpusPath(diff!), 'utf8'), limit);
  const slice = all.slice(start, start + count);
  const stats = runCorpus(slice, { offset: start });
  process.stdout.write(JSON.stringify(stats));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === '--__shard') {
    runAsShard(argv.slice(1));
    return;
  }
  const opts = parseArgs(argv);
  const report: Record<string, unknown> = { generatedAt: new Date().toISOString(), report: {} };
  const byDiff = report.report as Record<string, Omit<CorpusStats, never>>;
  for (const diff of opts.difficulties) {
    const stats = await runDifficulty(diff, opts.limit, opts.workers);
    byDiff[diff] = stats;
    console.error(
      `${diff.padEnd(12)}: ${stats.solved}/${stats.n} solved, validSolved ${stats.validSolved}, stuck ${stats.stuck}, errors ${stats.errors}`,
    );
  }
  if (opts.out) {
    mkdirSync(dirname(opts.out), { recursive: true });
    writeFileSync(opts.out, JSON.stringify(report, null, 2) + '\n');
    console.error(`wrote ${opts.out}`);
  } else {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  }
}

void availableParallelism; // referenced for callers picking a worker count
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
