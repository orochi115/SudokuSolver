/**
 * R2 self-check — lets a worker verify the gate's NON-test hard gates LOCALLY
 * before finishing, instead of flying blind and discovering failures only when the
 * harness judge runs. It mirrors orchestration/round2/harness/{verify.sh,
 * judge/verify-727.ts, judge/check-p3-isolation.ts}:
 *
 *   1. 727 PER-STEP soundness vs the brute oracle (human-default; + last-resort on p3)
 *   2. pollution (a): no strategy/chain code may call the brute oracle
 *   3. pollution (b): human-default 727 solved must not exceed POLLUTION_HUMAN_MAX
 *      (forcing disguised as human technique)
 *   4. P3 isolation (p3 only): no last-resort id may appear in human-default
 *
 * The AUTHORITATIVE gate is still verify.sh; this is a faithful preview. typecheck,
 * unit tests, and 400 ground-truth soundness are NOT repeated here — they are covered
 * by `npm run typecheck` and `npm test`, which you must also run green.
 *
 * Usage:  npm run verify:r2 -- --phase p1     (phase ∈ p0 p1 p2a p2b e p3; default p1)
 * Exit 0 = sound + unpolluted. Exit 1 = would HARD-FAIL the judge.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Grid,
  solve,
  checkTraceSoundness,
  solveBruteforce,
  strategiesForProfile,
  HUMAN_DEFAULT_STRATEGIES,
  LAST_RESORT_IDS,
  type StrategyProfile,
} from '../src/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const PUZZLE_FILE = process.env.R2_727_FILE
  ? resolve(process.cwd(), process.env.R2_727_FILE)
  : resolve(REPO, 'data/failing-diabolical/puzzles.txt');
const POLLUTION_HUMAN_MAX = Number(process.env.POLLUTION_HUMAN_MAX ?? 480);

let phase = 'p1';
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--phase') phase = argv[i + 1] ?? phase;
}

const puzzles = readFileSync(PUZZLE_FILE, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length === 81 && !l.startsWith('#'));

interface Offender { puzzle: string; strategyId: string; violations: number; }
interface SoundReport { solved: number; violationsTotal: number; offenders: Offender[]; }

function checkSoundness(profile: StrategyProfile): SoundReport {
  const strategies = strategiesForProfile(profile);
  let solved = 0;
  let violationsTotal = 0;
  const offenders: Offender[] = [];
  for (const puzzle of puzzles) {
    let solution: string | null = null;
    try { solution = solveBruteforce(puzzle); } catch { continue; }
    if (!solution) continue;
    let trace;
    try { trace = solve(Grid.fromString(puzzle), strategies); } catch { continue; }
    if (trace.outcome === 'solved') solved++;
    const result = checkTraceSoundness(trace, solution);
    if (result.violations.length > 0) {
      violationsTotal += result.violations.length;
      if (offenders.length < 10) {
        offenders.push({ puzzle, strategyId: result.violations[0]?.strategyId ?? '?', violations: result.violations.length });
      }
    }
  }
  return { solved, violationsTotal, offenders };
}

function listTs(dir: string): string[] {
  let out: string[] = [];
  let entries: string[] = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(listTs(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

let hard = false;

// 1. 727 human-default per-step soundness
const human = checkSoundness('human-default');
console.log(`\n[verify:r2] 727 human-default: solved ${human.solved}/${puzzles.length}, 非法消除 ${human.violationsTotal}`);
if (human.violationsTotal > 0) {
  hard = true;
  console.log('  违规明细(请逐一修复其非法消除/摆放):');
  for (const o of human.offenders) console.log(`   puzzle ${o.puzzle}: 策略 ${o.strategyId} 有 ${o.violations} 处非法消除`);
}

// 2. pollution (a): brute oracle used inside strategies/chain
const SRC = resolve(REPO, 'packages/engine/src');
const ORACLE = /solveBruteforce|countSolutions|findGroundTruth/;
const oracleHits: string[] = [];
for (const sub of ['strategies', 'chain']) {
  for (const file of listTs(join(SRC, sub))) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((ln, i) => { if (ORACLE.test(ln)) oracleHits.push(`${file.replace(REPO + '/', '')}:${i + 1}`); });
  }
}
if (oracleHits.length > 0) {
  hard = true;
  console.log('\n[verify:r2] 污染: 策略/链代码调用了暴力求解器(禁止——这是作弊不是技巧):');
  oracleHits.slice(0, 8).forEach((h) => console.log('   ' + h));
}

// 3. pollution (b): implausible human-default coverage
if (human.solved > POLLUTION_HUMAN_MAX) {
  hard = true;
  console.log(`\n[verify:r2] 污染: human-default 解出 ${human.solved}/727 > ${POLLUTION_HUMAN_MAX} — 疑似把搜索/回溯伪装成人类技巧`);
}

// 4. p3 only: last-resort soundness + isolation
if (phase === 'p3') {
  const last = checkSoundness('last-resort');
  console.log(`\n[verify:r2] 727 last-resort: solved ${last.solved}/${puzzles.length}, 非法消除 ${last.violationsTotal}`);
  if (last.violationsTotal > 0) {
    hard = true;
    for (const o of last.offenders) console.log(`   puzzle ${o.puzzle}: 策略 ${o.strategyId} 有 ${o.violations} 处非法消除`);
  }
  const humanIds = new Set(HUMAN_DEFAULT_STRATEGIES.map((s) => s.id));
  const leaked = [...LAST_RESORT_IDS].filter((id) => humanIds.has(id));
  if (leaked.length > 0) {
    hard = true;
    console.log(`\n[verify:r2] P3 隔离失败: last-resort 策略泄漏进 human-default: ${leaked.join(', ')}`);
  }
}

console.log('\n[verify:r2] 提醒: typecheck / 单测 / 400 健全性 不在本脚本范围 —— 另跑 `npm run typecheck` 与 `npm test` 到全绿。');
if (hard) {
  console.error('\n[verify:r2] ✗ 上述问题会被判官 HARD-FAIL —— 修复后再结束本阶段。');
  process.exit(1);
}
console.log('\n[verify:r2] ✓ 727 健全性 + 无污染 通过(判官的 typecheck/test 请另行确认)。');
