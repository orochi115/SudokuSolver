#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const TAR_MAX_BUFFER = 220 * 1024 * 1024;

export function selectMutualComparisonCases({ loserFailures, winnerFailures }) {
  return selectMutualComparisonFailures({ loserFailures, winnerFailures }).map((failure) => failureIndex(failure));
}

export function selectMutualComparisonFailures({ loserFailures, winnerFailures }) {
  const winnerFailureSet = new Set(winnerFailures.map(failureIndex));
  return loserFailures
    .filter((failure) => !winnerFailureSet.has(failureIndex(failure)))
    .sort((a, b) => failureIndex(a) - failureIndex(b));
}

export function selectFailuresSolvedByAnyWinner({ loserFailures, winnerFailuresByName }) {
  const winnerFailureSets = [...winnerFailuresByName.entries()].map(([name, failures]) => [
    name,
    new Set(failures.map(failureIndex)),
  ]);
  return [...loserFailures]
    .sort((a, b) => failureIndex(a) - failureIndex(b))
    .map((failure) => {
      const index = failureIndex(failure);
      const solvedBy = winnerFailureSets
        .filter(([, failureSet]) => !failureSet.has(index))
        .map(([name]) => name);
      if (solvedBy.length === 0) return null;
      return typeof failure === 'object' && failure !== null
        ? { ...failure, index, solvedBy }
        : { index, solvedBy };
    })
    .filter(Boolean);
}

export function buildWinnerCasePairs({ cases, loser }) {
  return cases.flatMap((failure) => failure.solvedBy.map((winner) => ({
    winner,
    loser,
    index: failureIndex(failure),
    puzzle: failure.puzzle,
  })));
}

function failureIndex(failure) {
  return typeof failure === 'object' && failure !== null ? failure.index : failure;
}

function parseArgs(argv) {
  const opts = { archive: null, difficulty: null, loser: null, winner: null, winners: null, refs: new Map(), out: null, keepWorktrees: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--archive') opts.archive = next();
    else if (arg === '--difficulty') opts.difficulty = next();
    else if (arg === '--loser') opts.loser = next();
    else if (arg === '--winner') opts.winner = next();
    else if (arg === '--winners') opts.winners = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--refs') opts.refs = parseRefMap(next());
    else if (arg === '--out') opts.out = next();
    else if (arg === '--keep-worktrees') opts.keepWorktrees = true;
    else if (arg === '-h' || arg === '--help') {
      console.log('usage: node orchestration/analyze-opus-sonnet-cases.mjs --archive <tar.gz> --difficulty <name> --loser <model> (--winner <model> | --winners <models>) [--refs model=git-ref,...] --out <dir> [--keep-worktrees]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  for (const key of ['archive', 'difficulty', 'loser', 'out']) {
    if (!opts[key]) throw new Error(`--${key} is required`);
  }
  if (opts.winner && opts.winners) throw new Error('use either --winner or --winners, not both');
  if (!opts.winner && !opts.winners?.length) throw new Error('--winner or --winners is required');
  opts.winners ??= [opts.winner];
  return opts;
}

export function parseRefMap(value = '') {
  const refs = new Map();
  for (const entry of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    const eq = entry.indexOf('=');
    if (eq <= 0 || eq === entry.length - 1) throw new Error(`invalid --refs entry: ${entry}`);
    refs.set(entry.slice(0, eq), entry.slice(eq + 1));
  }
  return refs;
}

export function formatRefMap(refs = new Map()) {
  return [...refs.entries()].map(([name, ref]) => `${name}=${ref}`).join(',');
}

function runTar(args, archive) {
  const result = spawnSync('tar', args, { encoding: 'utf8', maxBuffer: TAR_MAX_BUFFER });
  if (result.status !== 0) throw new Error(`tar failed for ${archive}: ${result.stderr || result.error?.message || 'unknown error'}`);
  return result.stdout;
}

function findResultsMember(archive) {
  const entries = runTar(['-tf', archive], archive).split('\n').filter(Boolean);
  const resultsMember = entries.find((entry) => /(^|\/)results\.json$/.test(entry));
  if (!resultsMember) throw new Error(`results.json not found in ${archive}`);
  return resultsMember;
}

function readArchiveResults(archive) {
  const archivePath = resolve(REPO, archive);
  const resultsMember = findResultsMember(archivePath);
  const text = runTar(['-xOf', archivePath, resultsMember], archivePath);
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.results)) throw new Error(`${resultsMember} does not contain a results array`);
  return { payload, resultsMember, archivePath };
}

export function modelFailures(results, model, difficulty) {
  const result = results.find((entry) => entry.name === model);
  if (!result) throw new Error(`missing model in archive results: ${model}`);
  const difficultyReport = result.report?.[difficulty];
  if (!difficultyReport) throw new Error(`missing difficulty ${difficulty} for model ${model}`);
  if (!Array.isArray(difficultyReport.failures)) throw new Error(`missing failures array for ${model} ${difficulty}`);
  return difficultyReport.failures;
}

export function traceCommandArgs({ difficulty, index, puzzle, winner, loser, outDir, refs = new Map(), keepWorktrees }) {
  const args = [
    resolve(HERE, 'trace-archive-case.mjs'),
    '--models', `${winner},${loser}`,
    '--out', outDir,
  ];
  if (puzzle) args.push('--puzzle', puzzle);
  else args.push('--difficulty', difficulty, '--index', String(index));
  if (keepWorktrees) args.push('--keep-worktrees');
  if (refs.size > 0) args.push('--refs', formatRefMap(refs));
  return args;
}

function runTrace({ difficulty, index, puzzle, winner, loser, outDir, refs, keepWorktrees }) {
  const args = traceCommandArgs({ difficulty, index, puzzle, winner, loser, outDir, refs, keepWorktrees });

  const result = spawnSync(process.execPath, args, {
    cwd: REPO,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`trace failed for ${difficulty}-${index}`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function summarizeCase({ difficulty, index, winner, loser, caseDir, outDir }) {
  const comparison = readJson(resolve(caseDir, 'comparison.json'));
  const saturation = readJson(resolve(caseDir, 'saturation-comparison.json'));
  const rescue = readJson(resolve(caseDir, 'rescue-comparison.json'));
  const firstDivergence = comparison.firstDivergence ?? null;
  const firstDifferentFixedPoint = saturation.firstDifferentFixedPoint ?? null;
  const detailFiles = [
    'comparison.json',
    'saturation-comparison.json',
    'rescue-comparison.json',
    `trace-${winner}.json`,
    `trace-${loser}.json`,
    `saturation-${winner}.json`,
    `saturation-${loser}.json`,
  ].map((name) => relative(outDir, resolve(caseDir, name)));

  return {
    difficulty,
    puzzleIndex: index,
    winner,
    loser,
    firstDivergence: {
      stepIndex: firstDivergence?.stepIndex ?? null,
      kind: firstDivergence?.kind ?? null,
      winnerStrategyId: firstDivergence?.leftStrategyId ?? null,
      loserStrategyId: firstDivergence?.rightStrategyId ?? null,
    },
    firstDifferentFixedPoint,
    rescue: {
      winnerRescueStrategyId: rescue.winnerRescueStrategyId ?? null,
      loserRescueStrategyId: rescue.loserRescueStrategyId ?? null,
    },
    classification: rescue.classification ?? null,
    detailFiles,
  };
}

function valueOrNone(value) {
  return value == null ? 'none' : String(value);
}

function markdownSummary(summary) {
  const lines = [
    '# Opus/Sonnet Failure Case Analysis',
    '',
    `Archive: \`${summary.archive}\``,
    `Results: \`${summary.resultsMember}\``,
    `Difficulty: \`${summary.difficulty}\``,
    `Winner: \`${summary.winners.join(', ')}\``,
    `Loser: \`${summary.loser}\``,
    '',
    '## Cases',
    '',
    '| Puzzle index | Winner | Loser | First divergence step | First divergence strategy | First different saturation fixed point | Rescue strategy | Classification | Details |',
    '| ---: | --- | --- | ---: | --- | --- | --- | --- | --- |',
  ];

  for (const item of summary.cases) {
    const divergenceStrategy = `winner: ${valueOrNone(item.firstDivergence.winnerStrategyId)}; loser: ${valueOrNone(item.firstDivergence.loserStrategyId)}; kind: ${valueOrNone(item.firstDivergence.kind)}`;
    const fixedPoint = item.firstDifferentFixedPoint
      ? `${item.firstDifferentFixedPoint.strategyId ?? 'unknown'} @ ${item.firstDifferentFixedPoint.index}`
      : 'none';
    const rescueStrategy = `winner: ${valueOrNone(item.rescue.winnerRescueStrategyId)}; loser: ${valueOrNone(item.rescue.loserRescueStrategyId)}`;
    const details = item.detailFiles.map((file) => `\`${file}\``).join('<br>');
    lines.push(`| ${item.puzzleIndex} | ${item.winner} | ${item.loser} | ${valueOrNone(item.firstDivergence.stepIndex)} | ${divergenceStrategy} | ${fixedPoint} | ${rescueStrategy} | ${valueOrNone(item.classification)} | ${details} |`);
  }

  return `${lines.join('\n')}\n`;
}

function runCli(argv) {
  const opts = parseArgs(argv);
  const { payload, resultsMember, archivePath } = readArchiveResults(opts.archive);
  const loserFailures = modelFailures(payload.results, opts.loser, opts.difficulty);
  const winnerFailuresByName = new Map(opts.winners.map((winner) => [
    winner,
    modelFailures(payload.results, winner, opts.difficulty),
  ]));
  const candidateCases = selectFailuresSolvedByAnyWinner({ loserFailures, winnerFailuresByName });
  const winnerCasePairs = buildWinnerCasePairs({ cases: candidateCases, loser: opts.loser });
  const selectedCases = candidateCases.map(failureIndex);
  const outDir = resolve(REPO, opts.out);
  const casesDir = resolve(outDir, 'cases');
  mkdirSync(casesDir, { recursive: true });
  writeFileSync(resolve(outDir, 'candidate-cases.json'), JSON.stringify(candidateCases, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'winner-case-pairs.json'), JSON.stringify(winnerCasePairs, null, 2) + '\n');

  const cases = [];
  for (const pair of winnerCasePairs) {
    const index = failureIndex(pair);
    const caseDir = resolve(casesDir, `${opts.difficulty}-${index}`, `${pair.winner}-vs-${pair.loser}`);
    mkdirSync(caseDir, { recursive: true });
    runTrace({
      difficulty: opts.difficulty,
      index,
      puzzle: pair.puzzle ?? null,
      winner: pair.winner,
      loser: pair.loser,
      outDir: caseDir,
      refs: opts.refs,
      keepWorktrees: opts.keepWorktrees,
    });
    cases.push(summarizeCase({
      difficulty: opts.difficulty,
      index,
      winner: pair.winner,
      loser: pair.loser,
      caseDir,
      outDir,
    }));
  }

  const summary = {
    archive: relative(REPO, archivePath),
    resultsMember,
    difficulty: opts.difficulty,
    winner: opts.winner,
    winners: opts.winners,
    loser: opts.loser,
    selectedCases,
    candidateCases,
    winnerCasePairs,
    cases,
  };
  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'summary.md'), markdownSummary(summary));
  console.log(`Wrote ${basename(outDir)}/summary.json and ${basename(outDir)}/summary.md`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error?.stack || error);
    process.exit(1);
  }
}
