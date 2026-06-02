#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const GAME_RE = /<game\b[^>]*\bdata="(\d{81})"[^>]*\/?>/g;
const CANONICAL_IDS = [
  'full-house',
  'naked-single',
  'hidden-single',
  'locked-candidates',
  'naked-subset',
  'hidden-subset',
  'basic-fish',
  'single-digit-patterns',
  'xy-wing',
  'xyz-wing',
  'w-wing',
  'simple-coloring',
  'aic',
  'als',
  'uniqueness',
  'sue-de-coq',
  'forcing-chain',
];
const RESCUE_LIMITATION = 'rescue probe reconstructs candidates from grid values only; prior candidate eliminations are not preserved';

export function canonicalOrder() {
  return [...CANONICAL_IDS];
}

function sortCellDigits(items) {
  return [...(items ?? [])]
    .map(({ cell, digit }) => ({ cell, digit }))
    .sort((a, b) => a.cell - b.cell || a.digit - b.digit);
}

export function normalizeAction(step) {
  return {
    placements: sortCellDigits(step?.placements),
    eliminations: sortCellDigits(step?.eliminations),
  };
}

export function sameAction(left, right) {
  return JSON.stringify(normalizeAction(left)) === JSON.stringify(normalizeAction(right));
}

export function validateComparisonModels(models) {
  if (models.length !== 2) throw new Error('--models must contain exactly two comma-separated model names');
  return models;
}

export function worktreeRootPrefix(base, stamp, pid = process.pid) {
  return resolve(base, `${stamp}-${pid}-`);
}

function strategyId(step) {
  return step?.strategyId ?? null;
}

function finalGrid(step) {
  return step?.finalGrid ?? step?.afterGrid ?? step?.final ?? step?.after ?? null;
}

export function firstDivergence(leftSteps, rightSteps) {
  const commonLength = Math.min(leftSteps.length, rightSteps.length);
  for (let i = 0; i < commonLength; i++) {
    const left = leftSteps[i];
    const right = rightSteps[i];
    const leftStrategyId = strategyId(left);
    const rightStrategyId = strategyId(right);
    if (leftStrategyId !== rightStrategyId) {
      return { stepIndex: i, kind: 'different-strategy-selection', leftStrategyId, rightStrategyId };
    }
    if (!sameAction(left, right)) {
      return { stepIndex: i, kind: 'same-strategy-different-effect', leftStrategyId, rightStrategyId };
    }
    const leftFinal = finalGrid(left);
    const rightFinal = finalGrid(right);
    if (leftFinal != null && rightFinal != null && leftFinal !== rightFinal) {
      return { stepIndex: i, kind: 'same-strategy-different-final-grid', leftStrategyId, rightStrategyId };
    }
  }
  if (leftSteps.length !== rightSteps.length) {
    return {
      stepIndex: commonLength,
      kind: 'one-stuck',
      leftStrategyId: strategyId(leftSteps[commonLength]),
      rightStrategyId: strategyId(rightSteps[commonLength]),
    };
  }
  return {
    stepIndex: commonLength,
    kind: 'both-stuck-or-solved-identical-prefix',
    leftStrategyId: null,
    rightStrategyId: null,
  };
}

export function firstDifferentFixedPoint(leftFixedPoints, rightFixedPoints) {
  const left = leftFixedPoints ?? [];
  const right = rightFixedPoints ?? [];
  const commonLength = Math.min(left.length, right.length);
  for (let i = 0; i < commonLength; i++) {
    const leftEntry = left[i];
    const rightEntry = right[i];
    if (
      leftEntry?.strategyId !== rightEntry?.strategyId
      || leftEntry?.afterGrid !== rightEntry?.afterGrid
      || leftEntry?.afterCandidateHash !== rightEntry?.afterCandidateHash
    ) {
      return { strategyId: leftEntry?.strategyId ?? rightEntry?.strategyId ?? null, index: i };
    }
  }
  if (left.length !== right.length) {
    const entry = left[commonLength] ?? right[commonLength];
    return { strategyId: entry?.strategyId ?? null, index: commonLength };
  }
  return null;
}

export function isCompleteValidGrid(grid) {
  if (!/^\d{81}$/.test(grid) || grid.includes('0')) return false;
  const units = [];
  for (let row = 0; row < 9; row++) units.push([...Array(9)].map((_, col) => row * 9 + col));
  for (let col = 0; col < 9; col++) units.push([...Array(9)].map((_, row) => row * 9 + col));
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      units.push([...Array(9)].map((_, i) => (boxRow * 3 + Math.floor(i / 3)) * 9 + boxCol * 3 + (i % 3)));
    }
  }
  return units.every((unit) => unit.map((idx) => grid[idx]).sort().join('') === '123456789');
}

export function isSolvedGridValid(initialGrid, finalGrid) {
  if (!isCompleteValidGrid(finalGrid)) return false;
  for (let i = 0; i < initialGrid.length; i++) {
    if (initialGrid[i] !== '0' && initialGrid[i] !== finalGrid[i]) return false;
  }
  return true;
}

export function classifyCase({ invalidSolvedRisk, finalGridValid, rescueApplicable, winnerRescueStrategyId, loserRescueStrategyId, firstDivergence } = {}) {
  if (invalidSolvedRisk || finalGridValid === false) return 'invalid-solved-risk';
  if (rescueApplicable === false) return 'inconclusive';
  if (winnerRescueStrategyId && !loserRescueStrategyId) return 'missing-detection';
  if (winnerRescueStrategyId && loserRescueStrategyId) return 'inconclusive';
  if (firstDivergence?.kind === 'same-strategy-different-effect') return 'same-strategy-different-effect';
  if (firstDivergence) return 'early-path-dependency';
  return 'inconclusive';
}

function parsePuzzlesFromXmlText(xml) {
  const puzzles = [];
  GAME_RE.lastIndex = 0;
  let match;
  while ((match = GAME_RE.exec(xml)) !== null) puzzles.push(match[1]);
  return puzzles;
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

function parseArgs(argv) {
  const opts = { puzzle: null, difficulty: null, index: null, models: ['opus48', 'sonnet46'], out: null, keepWorktrees: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--puzzle') opts.puzzle = next();
    else if (arg === '--difficulty') opts.difficulty = next();
    else if (arg === '--index') opts.index = Number(next());
    else if (arg === '--models') opts.models = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--out') opts.out = resolve(REPO, next());
    else if (arg === '--keep-worktrees') opts.keepWorktrees = true;
    else if (arg === '-h' || arg === '--help') {
      console.log('usage: node orchestration/trace-archive-case.mjs (--puzzle <81 chars> | --difficulty <difficulty> --index <number>) --models opus48,sonnet46 --out <dir> [--keep-worktrees]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (opts.puzzle && (opts.difficulty || opts.index != null)) throw new Error('use either --puzzle or --difficulty/--index, not both');
  if (!opts.puzzle && (!opts.difficulty || opts.index == null)) throw new Error('provide either --puzzle or --difficulty <difficulty> --index <number>');
  if (!opts.out) throw new Error('--out is required');
  validateComparisonModels(opts.models);
  return opts;
}

function resolvePuzzle(opts) {
  if (opts.puzzle) {
    const puzzle = opts.puzzle.replace(/\./g, '0');
    if (!/^\d{81}$/.test(puzzle)) throw new Error('--puzzle must be exactly 81 digits or dots');
    return { puzzle, source: { type: 'literal' } };
  }
  if (!Number.isInteger(opts.index) || opts.index < 1) throw new Error('--index must be a one-based positive integer');
  const file = resolve(REPO, 'puzzles', `${opts.difficulty}.opensudoku`);
  const puzzles = parsePuzzlesFromXmlText(readFileSync(file, 'utf8'));
  const puzzle = puzzles[opts.index - 1];
  if (!puzzle) throw new Error(`no ${opts.difficulty} puzzle at one-based index ${opts.index}`);
  return { puzzle, source: { type: 'opensudoku', difficulty: opts.difficulty, index: opts.index, file } };
}

export function runnerSource() {
  return `import { Grid, STRATEGIES } from './packages/engine/src/index.js';

const canonicalIds = ${JSON.stringify(CANONICAL_IDS)};

function applyStep(grid, step) {
  for (const p of step.placements) grid.place(p.cell, p.digit);
  for (const e of step.eliminations) grid.eliminate(e.cell, e.digit);
}

function candidateHash(grid) {
  return Array.from(grid.candidates ?? []).join(',');
}

function isCompleteValidGrid(grid) {
  if (!/^\\d{81}$/.test(grid) || grid.includes('0')) return false;
  const units = [];
  for (let row = 0; row < 9; row++) units.push([...Array(9)].map((_, col) => row * 9 + col));
  for (let col = 0; col < 9; col++) units.push([...Array(9)].map((_, row) => row * 9 + col));
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      units.push([...Array(9)].map((_, i) => (boxRow * 3 + Math.floor(i / 3)) * 9 + boxCol * 3 + (i % 3)));
    }
  }
  return units.every((unit) => unit.map((idx) => grid[idx]).sort().join('') === '123456789');
}

function isSolvedGridValid(initialGrid, finalGrid) {
  if (!isCompleteValidGrid(finalGrid)) return false;
  for (let i = 0; i < initialGrid.length; i++) {
    if (initialGrid[i] !== '0' && initialGrid[i] !== finalGrid[i]) return false;
  }
  return true;
}

function rescueScan(puzzle) {
  const rescueGrid = Grid.fromString(puzzle);
  for (const strategy of ordered) {
    const rawStep = strategy.apply(rescueGrid);
    const placements = rawStep?.placements ?? [];
    const eliminations = rawStep?.eliminations ?? [];
    if (rawStep && (placements.length > 0 || eliminations.length > 0)) {
      const beforeGrid = rescueGrid.toString();
      const step = { ...rawStep, strategyId: rawStep.strategyId ?? strategy.id, placements, eliminations };
      applyStep(rescueGrid, step);
      const afterGrid = rescueGrid.toString();
      return {
        strategyId: step.strategyId,
        placements: step.placements,
        eliminations: step.eliminations,
        explanation: {
          en: step.explanation?.en ?? null,
          zh: step.explanation?.zh ?? null,
        },
        beforeGrid,
        afterGrid,
      };
    }
  }
  return null;
}

const byId = new Map(STRATEGIES.map((s) => [s.id, s]));
const ordered = canonicalIds.map((id) => byId.get(id)).filter(Boolean);
const missingCanonicalIds = canonicalIds.filter((id) => !byId.has(id));
const grid = Grid.fromString(process.env.PUZZLE!);
const steps = [];
const rescueStep = process.env.RESCUE_PUZZLE ? rescueScan(process.env.RESCUE_PUZZLE) : null;

while (!grid.isSolved() && steps.length < 1000) {
  let progressed = false;
  for (const strategy of ordered) {
    const rawStep = strategy.apply(grid);
    const placements = rawStep?.placements ?? [];
    const eliminations = rawStep?.eliminations ?? [];
    if (rawStep && (placements.length > 0 || eliminations.length > 0)) {
      const beforeGrid = grid.toString();
      const step = { ...rawStep, strategyId: rawStep.strategyId ?? strategy.id, placements, eliminations };
      applyStep(grid, step);
      const afterGrid = grid.toString();
      steps.push({
        stepIndex: steps.length,
        strategyId: step.strategyId,
        beforeGrid,
        placements: step.placements,
        eliminations: step.eliminations,
        afterGrid,
        finalGrid: afterGrid,
        explanation: {
          en: step.explanation?.en ?? null,
          zh: step.explanation?.zh ?? null,
        },
      });
      progressed = true;
      break;
    }
  }
  if (!progressed) break;
}

const saturationGrid = Grid.fromString(process.env.PUZZLE!);
const saturation = [];
for (const strategy of ordered) {
  const beforeGrid = saturationGrid.toString();
  const beforeCandidateHash = candidateHash(saturationGrid);
  let stepsForStrategy = 0;
  let placementCount = 0;
  let eliminationCount = 0;

  while (!saturationGrid.isSolved() && stepsForStrategy < 1000) {
    const rawStep = strategy.apply(saturationGrid);
    const placements = rawStep?.placements ?? [];
    const eliminations = rawStep?.eliminations ?? [];
    if (!rawStep || (placements.length === 0 && eliminations.length === 0)) break;
    applyStep(saturationGrid, { ...rawStep, placements, eliminations });
    stepsForStrategy += 1;
    placementCount += placements.length;
    eliminationCount += eliminations.length;
  }

  saturation.push({
    strategyId: strategy.id,
    steps: stepsForStrategy,
    placements: placementCount,
    eliminations: eliminationCount,
    beforeGrid,
    afterGrid: saturationGrid.toString(),
    beforeCandidateHash,
    afterCandidateHash: candidateHash(saturationGrid),
  });
}

console.log(JSON.stringify({
  model: process.env.MODEL_NAME ?? 'unknown',
  outcome: grid.isSolved() ? 'solved' : 'stuck',
  initial: process.env.PUZZLE,
  final: grid.toString(),
  finalGridValid: grid.isSolved() ? isSolvedGridValid(process.env.PUZZLE, grid.toString()) : null,
  steps,
  saturation: {
    outcome: saturationGrid.isSolved() ? 'solved' : 'stuck',
    initial: process.env.PUZZLE,
    final: saturationGrid.toString(),
    fixedPoints: saturation,
  },
  rescueScan: process.env.RESCUE_PUZZLE ? {
    initial: process.env.RESCUE_PUZZLE,
    limitation: ${JSON.stringify(RESCUE_LIMITATION)},
    strategyId: rescueStep?.strategyId ?? null,
    step: rescueStep,
  } : null,
  strategyIds: STRATEGIES.map((s) => s.id),
  missingCanonicalIds,
}, null, 2));
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

function runRunner(worktree, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('npx', ['tsx', '.trace-case-runner.ts'], {
      cwd: worktree,
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
      else resolvePromise(JSON.parse(stdout));
    });
  });
}

async function runModel(model, puzzle, opts, worktreeRoot) {
  const branch = `archive/final/${model}`;
  if (!ensureBranch(branch)) throw new Error(`missing branch ${branch}`);
  const worktree = resolve(worktreeRoot, model);
  sh(['git', 'worktree', 'add', '--detach', worktree, branch]);
  try {
    writeFileSync(resolve(worktree, '.trace-case-runner.ts'), runnerSource());
    return await runRunner(worktree, {
      ...process.env,
      PATH: `${resolve(REPO, 'node_modules/.bin')}:${process.env.PATH ?? ''}`,
      MODEL_NAME: model,
      PUZZLE: puzzle,
    });
  } finally {
    if (!opts.keepWorktrees) sh(['git', 'worktree', 'remove', '--force', worktree], { stdio: ['ignore', 'ignore', 'ignore'] });
  }
}

async function runRescueScan(model, rescueGrid, opts, worktreeRoot) {
  const branch = `archive/final/${model}`;
  if (!ensureBranch(branch)) throw new Error(`missing branch ${branch}`);
  const worktree = resolve(worktreeRoot, `${model}-rescue`);
  sh(['git', 'worktree', 'add', '--detach', worktree, branch]);
  try {
    writeFileSync(resolve(worktree, '.trace-case-runner.ts'), runnerSource());
    const result = await runRunner(worktree, {
      ...process.env,
      PATH: `${resolve(REPO, 'node_modules/.bin')}:${process.env.PATH ?? ''}`,
      MODEL_NAME: model,
      PUZZLE: rescueGrid,
      RESCUE_PUZZLE: rescueGrid,
    });
    return result.rescueScan;
  } finally {
    if (!opts.keepWorktrees) sh(['git', 'worktree', 'remove', '--force', worktree], { stdio: ['ignore', 'ignore', 'ignore'] });
  }
}

function markdownReport({ results, comparison, source }) {
  const lines = [
    '# Archive Trace Case Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Puzzle source: ${source.type === 'opensudoku' ? `${source.difficulty} #${source.index}` : 'literal --puzzle'}`,
    '',
    '## Outcomes',
    '',
  ];
  for (const result of results) {
    lines.push(`- ${result.model}: ${result.outcome} (${result.steps.length} steps)`);
    lines.push(`- ${result.model} missing canonical IDs: ${result.missingCanonicalIds.length ? result.missingCanonicalIds.join(', ') : 'none'}`);
  }
  lines.push('', '## First Divergence', '', '```json', JSON.stringify(comparison.firstDivergence, null, 2), '```', '');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { puzzle, source } = resolvePuzzle(opts);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
  const worktreeBase = resolve(REPO, '../sudoku-trace-wt');
  mkdirSync(worktreeBase, { recursive: true });
  const worktreeRoot = mkdtempSync(worktreeRootPrefix(worktreeBase, stamp));
  mkdirSync(opts.out, { recursive: true });

  const results = [];
  try {
    for (const model of opts.models) {
      console.log(`== ${model} ==`);
      const result = await runModel(model, puzzle, opts, worktreeRoot);
      results.push(result);
      const { saturation, ...traceResult } = result;
      writeFileSync(resolve(opts.out, `trace-${model}.json`), JSON.stringify(traceResult, null, 2) + '\n');
      writeFileSync(resolve(opts.out, `saturation-${model}.json`), JSON.stringify({
        model: result.model,
        ...saturation,
        missingCanonicalIds: result.missingCanonicalIds,
      }, null, 2) + '\n');
    }

    const comparison = {
      models: opts.models,
      leftModel: opts.models[0],
      rightModel: opts.models[1],
      firstDivergence: firstDivergence(results[0].steps, results[1].steps),
    };
    writeFileSync(resolve(opts.out, 'comparison.json'), JSON.stringify(comparison, null, 2) + '\n');
    const firstDifferent = firstDifferentFixedPoint(results[0].saturation.fixedPoints, results[1].saturation.fixedPoints);
    writeFileSync(resolve(opts.out, 'saturation-comparison.json'), JSON.stringify({
      models: opts.models,
      leftModel: opts.models[0],
      rightModel: opts.models[1],
      firstDifferentFixedPoint: firstDifferent,
      fixedPointsMatch: firstDifferent === null,
    }, null, 2) + '\n');

    const solved = results.filter((result) => result.outcome === 'solved');
    const stuck = results.filter((result) => result.outcome === 'stuck');
    const winner = solved.length === 1 && stuck.length === 1 ? solved[0] : null;
    const loser = solved.length === 1 && stuck.length === 1 ? stuck[0] : null;
    const winnerRescue = winner && loser ? await runRescueScan(winner.model, loser.final, opts, worktreeRoot) : null;
    const loserRescue = winner && loser ? await runRescueScan(loser.model, loser.final, opts, worktreeRoot) : null;
    const invalidSolvedRisk = results.some((result) => result.outcome === 'solved' && result.finalGridValid === false);
    const rescueComparison = {
      models: opts.models,
      winnerModel: winner?.model ?? null,
      loserModel: loser?.model ?? null,
      loserFinalGrid: loser?.final ?? null,
      limitation: RESCUE_LIMITATION,
      winnerRescueStrategyId: winnerRescue?.strategyId ?? null,
      loserRescueStrategyId: loserRescue?.strategyId ?? null,
      classification: classifyCase({
        invalidSolvedRisk,
        rescueApplicable: Boolean(winner && loser),
        winnerRescueStrategyId: winnerRescue?.strategyId ?? null,
        loserRescueStrategyId: loserRescue?.strategyId ?? null,
        firstDivergence: comparison.firstDivergence,
      }),
      scans: {
        winner: winner ? { model: winner.model, scan: winnerRescue } : null,
        loser: loser ? { model: loser.model, scan: loserRescue } : null,
      },
    };
    writeFileSync(resolve(opts.out, 'rescue-comparison.json'), JSON.stringify(rescueComparison, null, 2) + '\n');
    writeFileSync(resolve(opts.out, 'summary.md'), markdownReport({ results, comparison, source }));
    console.log(`wrote ${opts.out}`);
  } finally {
    if (!opts.keepWorktrees) rmSync(worktreeRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error?.stack || error);
    process.exit(1);
  });
}
