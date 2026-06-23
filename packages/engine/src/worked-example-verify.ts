/**
 * Utilities for verifying research-card worked examples against brute-force ground truth.
 */

import { countSolutions, solveBruteforce } from './bruteforce.js';
import { CELLS, Grid, ROW_OF, COL_OF } from './grid.js';
import { applyStep, solve } from './solver.js';
import { checkTraceSoundness } from './soundness.js';
import type { Strategy } from './strategy.js';
import type { Step } from './trace.js';

export interface CellDigit {
  cell: number;
  digit: number;
}

/** 1-based row/col → 0-based cell index. */
export function rc(row: number, col: number): number {
  return (row - 1) * 9 + (col - 1);
}

export function cellLabel(cell: number): string {
  return `r${ROW_OF[cell]! + 1}c${COL_OF[cell]! + 1}`;
}

export function normalizePuzzle(s: string): string {
  return s.replace(/\s/g, '').replace(/\./g, '0');
}

export interface PuzzleCheck {
  unique: boolean;
  solvable: boolean;
  solution: string | null;
}

export function checkPuzzle(puzzle: string): PuzzleCheck {
  const normalized = normalizePuzzle(puzzle);
  const solution = solveBruteforce(normalized);
  const unique = countSolutions(normalized, 2) === 1;
  return { unique, solvable: solution !== null, solution };
}

/** Advance grid with strategies until stuck or maxSteps reached. */
export function advanceWithStrategies(
  puzzle: string,
  strategies: readonly Strategy[],
  maxSteps = 200,
): { grid: Grid; steps: Step[] } {
  const grid = Grid.fromString(normalizePuzzle(puzzle));
  const ordered = [...strategies].sort((a, b) => a.difficulty - b.difficulty);
  const steps: Step[] = [];
  while (!grid.isSolved() && steps.length < maxSteps) {
    let progressed = false;
    for (const strat of ordered) {
      const step = strat.apply(grid);
      if (step && (step.placements.length > 0 || step.eliminations.length > 0)) {
        applyStep(grid, step);
        steps.push(step);
        progressed = true;
        break;
      }
    }
    if (!progressed) break;
  }
  return { grid, steps };
}

export interface VerificationResult {
  ok: boolean;
  puzzle: string;
  solution: string | null;
  solvable: boolean;
  unique: boolean;
  violations: string[];
}

/** Verify eliminations/placements are consistent with the puzzle's solution. */
export function verifyDeductions(
  puzzle: string,
  opts: {
    eliminations?: readonly CellDigit[];
    placements?: readonly CellDigit[];
  },
): VerificationResult {
  const normalized = normalizePuzzle(puzzle);
  const check = checkPuzzle(normalized);
  const violations: string[] = [];

  if (!check.solvable) {
    return {
      ok: false,
      puzzle: normalized,
      solution: null,
      solvable: false,
      unique: false,
      violations: ['puzzle has no solution'],
    };
  }

  const solution = check.solution!;

  for (const e of opts.eliminations ?? []) {
    if (Number(solution[e.cell]) === e.digit) {
      violations.push(
        `bad elimination: ${cellLabel(e.cell)}<>${e.digit} but solution has ${solution[e.cell]}`,
      );
    }
  }

  for (const p of opts.placements ?? []) {
    if (Number(solution[p.cell]) !== p.digit) {
      violations.push(
        `bad placement: ${cellLabel(p.cell)}=${p.digit} but solution has ${solution[p.cell]}`,
      );
    }
  }

  return {
    ok: violations.length === 0,
    puzzle: normalized,
    solution,
    solvable: true,
    unique: check.unique,
    violations,
  };
}

/** Build a one-step trace and run the project's soundness checker. */
export function verifyStepSoundness(puzzle: string, step: Step): VerificationResult {
  const normalized = normalizePuzzle(puzzle);
  const check = checkPuzzle(normalized);
  if (!check.solvable || !check.solution) {
    return {
      ok: false,
      puzzle: normalized,
      solution: null,
      solvable: false,
      unique: false,
      violations: ['puzzle has no solution'],
    };
  }
  const trace = {
    initial: normalized,
    steps: [step],
    outcome: 'stuck' as const,
    final: normalized,
  };
  const sound = checkTraceSoundness(trace, check.solution);
  return {
    ok: sound.sound,
    puzzle: normalized,
    solution: check.solution,
    solvable: true,
    unique: check.unique,
    violations: sound.violations.map(
      (v) => `${v.kind} step ${v.stepIndex} ${cellLabel(v.cell)} digit ${v.digit}`,
    ),
  };
}

/** Decoded SudokuWiki S9B (version B) board string. */
export interface S9BDecoded {
  /** 81-char givens only (0 = non-clue empty). */
  givens: string;
  /** 81-char placements: clues and solved cells; 0 = unsolved empty. */
  values: string;
  /** Per-cell candidate bitmask (0 for clues/solved). */
  candidateMasks: number[];
  /** True where the cell is an original clue. */
  isClue: readonly boolean[];
}

/**
 * Decode a SudokuWiki `S9B` compressed board (v2 "B" format).
 * @see https://www.sudokuwiki.org/Sudoku_String_Definitions
 */
export function decodeS9B(bd: string): S9BDecoded {
  const body = bd.startsWith('S9B') ? bd.slice(3) : bd;
  if (body.length !== 162) {
    throw new Error(`S9B body must be 162 chars, got ${body.length}`);
  }
  const givensArr: string[] = [];
  const valuesArr: string[] = [];
  const candidateMasks: number[] = [];
  const isClue: boolean[] = [];

  for (let i = 0; i < CELLS; i++) {
    const chunk = body.slice(i * 2, i * 2 + 2);
    const p = parseInt(chunk, 36);
    if (Number.isNaN(p)) {
      throw new Error(`invalid S9B cell token at index ${i}: ${chunk}`);
    }
    const n = p & 1023;
    if (n < 10) {
      givensArr.push(String(n));
      valuesArr.push(String(n));
      candidateMasks.push(0);
      isClue.push(true);
    } else if (n <= 18) {
      const solved = n - 9;
      givensArr.push('0');
      valuesArr.push(String(solved));
      candidateMasks.push(0);
      isClue.push(false);
    } else {
      givensArr.push('0');
      valuesArr.push('0');
      candidateMasks.push(n - 18);
      isClue.push(false);
    }
  }

  return {
    givens: givensArr.join(''),
    values: valuesArr.join(''),
    candidateMasks,
    isClue,
  };
}

/** Givens-only 81-char puzzle extracted from an `S9B…` or plain `bd=` parameter. */
export function puzzleFromBd(bd: string): string {
  if (bd.startsWith('S9B')) return decodeS9B(bd).givens;
  return normalizePuzzle(bd);
}

/** Build a grid from an `S9B` restored state (givens + solved cells + candidate masks). */
export function gridFromS9B(bd: string): Grid {
  const d = decodeS9B(bd);
  const grid = Grid.fromString(d.givens);
  for (let i = 0; i < CELLS; i++) {
    if (!d.isClue[i] && Number(d.values[i]) !== 0) {
      grid.place(i, Number(d.values[i]));
    }
  }
  for (let i = 0; i < CELLS; i++) {
    if (grid.values[i] === 0 && d.candidateMasks[i] !== 0) {
      grid.candidates[i] = d.candidateMasks[i];
    }
  }
  return grid;
}

/** Like `verifyStepSoundness`, but checks eliminations against the final solution only. */
export function verifyRestoredStepSoundness(bd: string, step: Step): VerificationResult {
  const givens = puzzleFromBd(bd);
  return verifyStepSoundness(givens, step);
}

/** True if candidate is still present on the grid at the given state. */
export function hasCandidateAtState(
  puzzle: string,
  candidateMasks: readonly number[] | undefined,
  cell: number,
  digit: number,
): boolean {
  const grid = Grid.fromString(normalizePuzzle(puzzle));
  if (candidateMasks) grid.candidates.set(candidateMasks);
  return grid.hasCandidate(cell, digit);
}