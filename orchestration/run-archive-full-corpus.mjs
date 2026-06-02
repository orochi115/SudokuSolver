#!/usr/bin/env node
// Re-run archived model branches against the full OpenSudoku corpus without
// invoking opencode or any provider. The script checks out archive branches as
// temporary worktrees, copies in a local runner, and executes only the engine.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const DEFAULT_DIFFICULTIES = ['easy', 'medium', 'hard', 'diabolical'];

export function parseModels(text) {
  const models = new Map();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [model, name] = line.split(/\s+/);
    if (model && name) models.set(model, name);
  }
  return models;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function selectHardCandidates(reportText, modelMap) {
  const rows = reportText.split('\n').filter((line) => /^\|\s*`/.test(line));
  const out = [];
  for (const line of rows) {
    const cells = splitMarkdownRow(line);
    const model = cells[0]?.replace(/^`|`$/g, '');
    if (!model) continue;
    const name = modelMap.get(model);
    if (!name) continue;

    const m2 = cells[1];
    const m3 = cells[2];
    const hard = cells[5];
    const violations = Number(cells[7] ?? NaN);
    if (m2 === 'PASS' && m3 === 'PASS' && hard === '100%' && violations === 0) {
      out.push({ model, name });
    }
  }
  return out;
}

export function parsePuzzlesFromXmlText(xml, limit = Infinity) {
  const puzzles = [];
  const re = /<game\b[^>]*\bdata="(\d{81})"[^>]*\/?>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    puzzles.push(match[1]);
    if (puzzles.length >= limit) break;
  }
  return puzzles;
}

function emptyAggregate() {
  return { n: 0, solved: 0, validSolved: 0, stuck: 0, errors: 0, elapsedMs: 0 };
}

function withRates(stats) {
  const solveRate = stats.n ? stats.solved / stats.n : 0;
  const validSolveRate = stats.n ? stats.validSolved / stats.n : 0;
  return {
    ...stats,
    solveRate,
    validSolveRate,
    solveRateText: `${(solveRate * 100).toFixed(2)}%`,
    validSolveRateText: `${(validSolveRate * 100).toFixed(2)}%`,
  };
}

export function summarizeRuns(runs) {
  const rows = runs.map((run) => {
    const row = { name: run.name, model: run.model };
    const total = emptyAggregate();
    for (const [diff, stats] of Object.entries(run.report)) {
      row[diff] = withRates(stats);
      for (const key of Object.keys(total)) total[key] += typeof stats[key] === 'number' ? stats[key] : 0;
    }
    row.total = withRates(total);
    return row;
  });
  return { rows };
}

export function resolveWorkerCount(value, available = availableParallelism()) {
  if (value == null) return Math.max(1, available - 1);
  const workers = Number(value);
  if (!Number.isInteger(workers) || workers < 1) {
    throw new Error('--workers must be a positive integer');
  }
  return workers;
}

export function shouldReportProgress({ processed, nextProgress, nowMs, lastReportMs, intervalMs }) {
  return processed >= nextProgress || nowMs - lastReportMs >= intervalMs;
}

function failureCount(report) {
  return Object.values(report).reduce((sum, stats) => sum + (Array.isArray(stats.failures) ? stats.failures.length : 0), 0);
}

function reportWithoutFailureDetails(report) {
  return Object.fromEntries(
    Object.entries(report).map(([diff, stats]) => {
      const { failures, ...rest } = stats;
      return [diff, { ...rest, failures: Array.isArray(failures) ? failures.length : 0 }];
    }),
  );
}

function sh(args, opts = {}) {
  const out = execFileSync(args[0], args.slice(1), {
    cwd: opts.cwd ?? REPO,
    encoding: 'utf8',
    stdio: opts.stdio ?? ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...(opts.env ?? {}) },
  });
  return typeof out === 'string' ? out.trim() : '';
}

export function parseArgs(argv, availableParallelismOverride = availableParallelism()) {
  const opts = {
    archiveTag: 'final',
    difficulties: DEFAULT_DIFFICULTIES,
    limit: null,
    names: null,
    ref: null,
    refName: null,
    keepWorktrees: false,
    outDir: null,
    workers: resolveWorkerCount(null, availableParallelismOverride),
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--archive-tag') opts.archiveTag = next();
    else if (arg === '--difficulties') opts.difficulties = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--limit') opts.limit = Number(next());
    else if (arg === '--workers') opts.workers = resolveWorkerCount(next());
    else if (arg === '--models') opts.names = new Set(next().split(',').map((s) => s.trim()).filter(Boolean));
    else if (arg === '--ref') opts.ref = next();
    else if (arg === '--name') opts.refName = next();
    else if (arg === '--keep-worktrees') opts.keepWorktrees = true;
    else if (arg === '--out-dir') opts.outDir = resolve(REPO, next());
    else if (arg === '-h' || arg === '--help') {
      console.log(`usage: node orchestration/run-archive-full-corpus.mjs [options]\n\noptions:\n  --archive-tag <tag>       archive branch tag, default: final\n  --difficulties <csv>      default: easy,medium,hard,diabolical\n  --limit <n>               smoke-test limit per difficulty\n  --workers <n>             worker processes per model, default: CPUs - 1\n  --models <csv>            short-name allowlist\n  --ref <git-ref>           run a single explicit git ref instead of archive-selected models\n  --name <name>             display/output name for --ref\n  --out-dir <path>          output directory\n  --keep-worktrees          do not remove temporary worktrees`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if ((opts.ref && !opts.refName) || (!opts.ref && opts.refName)) throw new Error('--ref and --name must be provided together');
  if (opts.ref && opts.names) throw new Error('--ref/--name cannot be combined with --models');
  return opts;
}

function runnerSource() {
  return String.raw`import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import { Grid, solve, STRATEGIES } from './packages/engine/src/index.js';

const difficulties = (process.env.DIFFICULTIES ?? 'easy,medium,hard,diabolical').split(',').filter(Boolean);
const limit = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const modelName = process.env.MODEL_NAME ?? 'unknown';
const progressFile = process.env.PROGRESS_FILE;
const requestedWorkers = Math.max(1, Number(process.env.WORKERS ?? '1'));
const isWorkerProcess = process.env.RUNNER_WORKER === '1';
const progressIntervalMs = Math.max(1000, Number(process.env.PROGRESS_INTERVAL_MS ?? '5000'));
const gameRe = /<game\b[^>]*\bdata="(\d{81})"[^>]*\/?>/g;

async function readStdinJson() {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return JSON.parse(text);
}

function writeProgress(diff, payload) {
  const data = {
    model: modelName,
    difficulty: diff,
    updatedAt: new Date().toISOString(),
    ...payload,
  };
  if (progressFile) writeFileSync(progressFile, JSON.stringify(data, null, 2) + '\n');
  console.error(modelName + ' ' + diff + ': ' + data.processed + '/' + data.total + ' workers=' + data.workers);
}

function makeStats() {
  return { n: 0, solved: 0, validSolved: 0, stuck: 0, errors: 0, elapsedMs: 0, failures: [] };
}

function mergeStats(target, source) {
  target.n += source.n;
  target.solved += source.solved;
  target.validSolved += source.validSolved;
  target.stuck += source.stuck;
  target.errors += source.errors;
  target.failures.push(...source.failures);
}

function progressPayload(diff, aggregate, total, startedAt, workers, done = false) {
  const elapsedMs = Math.round(performance.now() - startedAt);
  const payload = {
    processed: aggregate.n,
    total,
    solved: aggregate.solved,
    stuck: aggregate.stuck,
    errors: aggregate.errors,
    elapsedMs,
    perSecond: elapsedMs > 0 ? Number((aggregate.n / (elapsedMs / 1000)).toFixed(1)) : 0,
    workers,
    done,
  };
  return payload;
}

function validSolved(initial, final) {
  if (!/^\d{81}$/.test(final) || final.includes('0')) return false;
  for (let i = 0; i < 81; i++) if (initial[i] !== '0' && initial[i] !== final[i]) return false;
  const houses = [];
  for (let r = 0; r < 9; r++) houses.push([...Array(9)].map((_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) houses.push([...Array(9)].map((_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const cells = [];
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) cells.push((br * 3 + dr) * 9 + bc * 3 + dc);
    houses.push(cells);
  }
  for (const house of houses) {
    const seen = new Set(house.map((i) => final[i]));
    if (seen.size !== 9 || seen.has('0')) return false;
  }
  return true;
}

function solveChunk(puzzles, offset, onProgress) {
  const stats = makeStats();
  let nextProgress = 10000;
  let lastReportMs = performance.now();
  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    stats.n++;
    const index = offset + i + 1;
    try {
      const trace = solve(Grid.fromString(puzzle), STRATEGIES);
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
    const nowMs = performance.now();
    if (stats.n >= nextProgress || nowMs - lastReportMs >= progressIntervalMs) {
      while (stats.n >= nextProgress) nextProgress += 10000;
      lastReportMs = nowMs;
      onProgress?.(stats);
    }
  }
  return stats;
}

function parsePuzzles(xml) {
  const puzzles = [];
  gameRe.lastIndex = 0;
  let match;
  while ((match = gameRe.exec(xml)) !== null && puzzles.length < limit) puzzles.push(match[1]);
  return puzzles;
}

function chunksFor(puzzles, workerCount) {
  const chunks = [];
  const size = Math.ceil(puzzles.length / workerCount);
  for (let i = 0; i < puzzles.length; i += size) chunks.push({ puzzles: puzzles.slice(i, i + size), offset: i });
  return chunks;
}

async function runDifficulty(diff) {
  const xml = readFileSync('puzzles/' + diff + '.opensudoku', 'utf8');
  const started = performance.now();
  const puzzles = parsePuzzles(xml);
  const workerCount = Math.min(requestedWorkers, Math.max(1, puzzles.length));
  const aggregate = makeStats();
  let nextProgress = 10000;
  let lastReportMs = started;

  if (workerCount === 1) {
    const stats = solveChunk(puzzles, 0, (partial) => {
      aggregate.n = partial.n;
      aggregate.solved = partial.solved;
      aggregate.validSolved = partial.validSolved;
      aggregate.stuck = partial.stuck;
      aggregate.errors = partial.errors;
      const nowMs = performance.now();
      if (aggregate.n >= nextProgress || nowMs - lastReportMs >= progressIntervalMs) {
        while (aggregate.n >= nextProgress) nextProgress += 10000;
        lastReportMs = nowMs;
        writeProgress(diff, progressPayload(diff, aggregate, puzzles.length, started, workerCount));
      }
    });
    mergeStats(aggregate, stats);
  } else {
    const chunks = chunksFor(puzzles, workerCount);
    const progressByWorker = Array(chunks.length).fill(0);
    const partialByWorker = Array.from({ length: chunks.length }, makeStats);
    await Promise.all(chunks.map((chunk, workerIndex) => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [...process.execArgv, process.argv[1]], {
        cwd: process.cwd(),
        env: { ...process.env, RUNNER_WORKER: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let stdoutBuffer = '';
      let stderr = '';
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (data) => {
        stdoutBuffer += data;
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const message = JSON.parse(line);
          if (message.type === 'progress') {
            progressByWorker[workerIndex] = message.processed;
            const processed = progressByWorker.reduce((sum, n) => sum + n, 0);
            const nowMs = performance.now();
            if (processed >= nextProgress || nowMs - lastReportMs >= progressIntervalMs) {
              const progressStats = { ...aggregate, n: processed };
              while (processed >= nextProgress) nextProgress += 10000;
              lastReportMs = nowMs;
              writeProgress(diff, progressPayload(diff, progressStats, puzzles.length, started, chunks.length));
            }
          } else if (message.type === 'result') {
            progressByWorker[workerIndex] = chunk.puzzles.length;
            partialByWorker[workerIndex] = message.stats;
          }
        }
      });
      child.stderr.on('data', (data) => { stderr += data; process.stderr.write(data); });
      child.on('error', reject);
      child.on('exit', (code) => {
        if (stdoutBuffer.trim()) {
          const message = JSON.parse(stdoutBuffer);
          if (message.type === 'result') partialByWorker[workerIndex] = message.stats;
        }
        code === 0 ? resolve() : reject(new Error('worker exited with ' + code + ': ' + stderr));
      });
      child.stdin.end(JSON.stringify(chunk));
    })));
    for (const stats of partialByWorker) mergeStats(aggregate, stats);
  }
  aggregate.failures.sort((a, b) => a.index - b.index);
  aggregate.elapsedMs = Math.round(performance.now() - started);
  writeProgress(diff, progressPayload(diff, aggregate, puzzles.length, started, workerCount, true));
  return aggregate;
}

if (isWorkerProcess) {
  const chunk = await readStdinJson();
  const stats = solveChunk(chunk.puzzles, chunk.offset, (partial) => console.log(JSON.stringify({ type: 'progress', processed: partial.n })));
  console.log(JSON.stringify({ type: 'result', stats }));
} else {
  const report = {};
  for (const diff of difficulties) report[diff] = await runDifficulty(diff);
  console.log(JSON.stringify({ strategies: STRATEGIES.length, strategyIds: STRATEGIES.map((s) => s.id), workers: requestedWorkers, report }, null, 2));
}
`;
}

function ensureBranch(branch) {
  try {
    sh(['git', 'rev-parse', '--verify', '--quiet', branch]);
    return true;
  } catch {
    return false;
  }
}

function runRunner(wt, env) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', '.full-corpus-runner.ts'], {
      cwd: wt,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`runner failed with exit ${code}: ${stderr || stdout}`));
      else resolve(stdout);
    });
  });
}

async function runOne(candidate, opts, wtRoot, outDir) {
  const branch = resolveRunRef(candidate, opts);
  if (!ensureBranch(branch)) throw new Error(`missing branch ${branch}`);

  const wt = resolve(wtRoot, candidate.name);
  rmSync(wt, { recursive: true, force: true });
  sh(['git', 'worktree', 'add', '--detach', wt, branch]);
  try {
    writeFileSync(resolve(wt, '.full-corpus-runner.ts'), runnerSource());
    const started = Date.now();
    const stdout = await runRunner(wt, {
      ...process.env,
      PATH: `${resolve(REPO, 'node_modules/.bin')}:${process.env.PATH ?? ''}`,
      DIFFICULTIES: opts.difficulties.join(','),
      MODEL_NAME: candidate.name,
      PROGRESS_FILE: resolve(outDir, 'progress.json'),
      WORKERS: String(opts.workers),
      ...(opts.limit ? { LIMIT: String(opts.limit) } : {}),
    });
    const parsed = JSON.parse(stdout);
    return { ...candidate, sourceRef: branch, ...parsed, elapsedMs: Date.now() - started };
  } finally {
    if (!opts.keepWorktrees) {
      sh(['git', 'worktree', 'remove', '--force', wt], { stdio: ['ignore', 'ignore', 'ignore'] });
    }
  }
}

export function resolveRunRef(candidate, opts) {
  return candidate.ref ?? `archive/${opts.archiveTag}/${candidate.name}`;
}

export function markdownReport(results, summary, opts) {
  const cols = ['model', ...opts.difficulties, 'total'];
  let md = '# Archive Full Corpus Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Archive tag: \`${opts.archiveTag}\`\n\n`;
  if (opts.limit) md += `Limit: ${opts.limit} puzzle(s) per difficulty\n\n`;
  md += `| ${cols.join(' | ')} |\n`;
  md += `|${cols.map(() => '---').join('|')}|\n`;
  for (const row of summary.rows) {
    const cells = [`\`${row.name}\``];
    for (const diff of opts.difficulties) {
      const s = row[diff];
      cells.push(s ? `${s.solved}/${s.n} (${s.solveRateText}), valid ${s.validSolved}` : '-');
    }
    cells.push(`${row.total.solved}/${row.total.n} (${row.total.solveRateText}), valid ${row.total.validSolved}`);
    md += `| ${cells.join(' | ')} |\n`;
  }
  md += '\n## Details\n\n';
  for (const result of results) {
    md += `### ${result.name} (${result.model})\n\n`;
    md += `Strategies: ${result.strategies}\n\n`;
    md += `Failures: ${failureCount(result.report)}. See \`results.json\` for full puzzle details.\n\n`;
    md += '```json\n' + JSON.stringify(reportWithoutFailureDetails(result.report), null, 2) + '\n```\n\n';
  }
  return md;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const models = parseModels(readFileSync(resolve(REPO, 'orchestration/models.txt'), 'utf8'));
  let candidates = opts.ref
    ? [{ model: opts.ref, name: opts.refName, ref: opts.ref }]
    : selectHardCandidates(readFileSync(resolve(REPO, 'orchestration/report-final.md'), 'utf8'), models);
  if (!opts.ref && opts.names) candidates = candidates.filter((c) => opts.names.has(c.name));
  if (candidates.length === 0) throw new Error('no candidate models selected');

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
  const outDir = opts.outDir ?? resolve(REPO, 'orchestration/reports/full-corpus', stamp);
  const wtRoot = resolve(REPO, '../sudoku-full-corpus-wt', stamp);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(wtRoot, { recursive: true });

  const results = [];
  try {
    for (const candidate of candidates) {
      console.log(`== ${candidate.name} (${candidate.model}) ==`);
      results.push(await runOne(candidate, opts, wtRoot, outDir));
      writeFileSync(resolve(outDir, 'results.partial.json'), JSON.stringify(results, null, 2) + '\n');
    }
  } finally {
    if (!opts.keepWorktrees) rmSync(wtRoot, { recursive: true, force: true });
  }

  const summary = summarizeRuns(results);
  writeFileSync(resolve(outDir, 'results.json'), JSON.stringify({ options: opts, results, summary }, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'summary.md'), markdownReport(results, summary, opts));
  console.log(`wrote ${outDir}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err?.stack || err);
    process.exit(1);
  });
}
