#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAR_MAX_BUFFER = 220 * 1024 * 1024;

export function buildFailureIndex(results, difficulty) {
  return Object.fromEntries(results.map((result) => {
    const failures = result.report?.[difficulty]?.failures ?? [];
    return [result.name, new Map(failures.map((failure) => [failure.index, failure]))];
  }));
}

export function compareFailureOverlap(index, loserName, winnerName) {
  const loserFailuresMap = index[loserName] ?? new Map();
  const winnerFailuresMap = index[winnerName] ?? new Map();
  const bothFailed = [];
  const winnerSolvedLoserFailed = [];

  for (const failureIndex of loserFailuresMap.keys()) {
    if (winnerFailuresMap.has(failureIndex)) bothFailed.push(failureIndex);
    else winnerSolvedLoserFailed.push(failureIndex);
  }

  return {
    loser: loserName,
    winner: winnerName,
    loserFailures: loserFailuresMap.size,
    bothFailed: bothFailed.sort(sortAscending),
    winnerSolvedLoserFailed: winnerSolvedLoserFailed.sort(sortAscending),
  };
}

function sortAscending(a, b) {
  return Number(a) - Number(b);
}

function parseArgs(argv) {
  const opts = { archive: null, models: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--archive') opts.archive = next();
    else if (arg === '--models') opts.models = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--out') opts.out = next();
    else if (arg === '-h' || arg === '--help') {
      console.log('usage: node orchestration/analyze-full-corpus-results.mjs --archive <tar.gz> --models <winner,loser> --out <dir>');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!opts.archive) throw new Error('--archive is required');
  if (!opts.models || opts.models.length !== 2) throw new Error('--models must contain exactly two comma-separated model names');
  if (!opts.out) throw new Error('--out is required');
  return opts;
}

function runTar(args, archive) {
  const result = spawnSync('tar', args, {
    encoding: 'utf8',
    maxBuffer: TAR_MAX_BUFFER,
  });
  if (result.status !== 0) {
    throw new Error(`tar failed for ${archive}: ${result.stderr || result.error?.message || 'unknown error'}`);
  }
  return result.stdout;
}

function findResultsMember(archive) {
  const entries = runTar(['-tf', archive], archive).split('\n').filter(Boolean);
  const resultsMember = entries.find((entry) => /(^|\/)results\.json$/.test(entry));
  if (!resultsMember) throw new Error(`results.json not found in ${archive}`);
  return resultsMember;
}

function readArchiveResults(archive) {
  const archivePath = resolve(archive);
  const resultsMember = findResultsMember(archivePath);
  const text = runTar(['-xOf', archivePath, resultsMember], archivePath);
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.results)) throw new Error(`${resultsMember} does not contain a results array`);
  return { payload, resultsMember };
}

function selectedResults(results, names) {
  const selected = names.map((name) => results.find((result) => result.name === name));
  const missing = names.filter((_, i) => !selected[i]);
  if (missing.length) throw new Error(`missing selected models in results: ${missing.join(', ')}`);
  return selected;
}

function analyze(results, models) {
  const [winner, loser] = models;
  const selected = selectedResults(results, models);
  const difficulties = [...new Set(selected.flatMap((result) => Object.keys(result.report ?? {})))];
  const overlaps = Object.fromEntries(difficulties.map((difficulty) => {
    const index = buildFailureIndex(selected, difficulty);
    const overlap = compareFailureOverlap(index, loser, winner);
    return [difficulty, {
      ...overlap,
      bothFailedCount: overlap.bothFailed.length,
      winnerSolvedLoserFailedCount: overlap.winnerSolvedLoserFailed.length,
    }];
  }));

  return { models: { winner, loser }, difficulties: overlaps };
}

function markdownReport(analysis, { archive, resultsMember }) {
  const lines = [
    '# Full-Corpus Failure Overlap Analysis',
    '',
    `Archive: \`${archive}\``,
    `Results: \`${resultsMember}\``,
    `Winner: \`${analysis.models.winner}\``,
    `Loser: \`${analysis.models.loser}\``,
    '',
    '## Summary',
    '',
  ];

  for (const [difficulty, overlap] of Object.entries(analysis.difficulties)) {
    lines.push(`- ${difficulty} ${overlap.loser} failures: ${overlap.loserFailures}`);
    lines.push(`- ${difficulty} ${overlap.winner} also failed ${overlap.loser} failures: ${overlap.bothFailedCount}`);
    lines.push(`- ${difficulty} ${overlap.winner} solved ${overlap.loser} failures: ${overlap.winnerSolvedLoserFailedCount}`);
  }

  return `${lines.join('\n')}\n`;
}

function runCli(argv) {
  const opts = parseArgs(argv);
  const { payload, resultsMember } = readArchiveResults(opts.archive);
  const analysis = analyze(payload.results, opts.models);
  const outDir = resolve(opts.out);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'analysis.json'), JSON.stringify({
    archive: opts.archive,
    resultsMember,
    ...analysis,
  }, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'summary.md'), markdownReport(analysis, {
    archive: opts.archive,
    resultsMember,
  }));
  console.log(`Wrote ${basename(outDir)}/analysis.json and ${basename(outDir)}/summary.md`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
