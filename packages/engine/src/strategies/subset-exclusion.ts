/**
 * Subset Exclusion / Aligned Pair Exclusion / Aligned Triple Exclusion (P2)
 * 子集排除 / 对齐数对排除 / 对齐三数排除
 *
 * Enumerates the candidate combinations of a chosen base set of cells, drops
 * combinations that would empty a commonly-seen witness cell (typically a
 * bivalue buddy), and eliminates any base candidate that survives in no
 * allowed combination.
 */

import { CELLS, PEERS_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

interface Witness {
  cell: number;
  digits: number[];
  /** Indices of base cells that see this witness. */
  sees: number[];
}

function findWitnesses(grid: Grid, baseCells: number[]): Witness[] {
  const witnesses: Witness[] = [];
  const baseSet = new Set(baseCells);
  for (let w = 0; w < CELLS; w++) {
    if (grid.get(w) !== 0) continue;
    if (baseSet.has(w)) continue;
    const wDigits = digitsOf(grid.candidatesOf(w));
    if (wDigits.length === 0) continue;
    const sees = baseCells
      .map((b, idx) => ({ idx, sees: PEERS_OF[b]!.includes(w) }))
      .filter((x) => x.sees)
      .map((x) => x.idx);
    if (sees.length === 0) continue;
    witnesses.push({ cell: w, digits: wDigits, sees });
  }
  return witnesses;
}

export interface SubsetExclusionResult {
  strategyId: string;
  name: { zh: string; en: string };
  baseCells: number[];
  eliminations: { cell: number; digit: number }[];
}

export function searchSubsetExclusion(
  grid: Grid,
  baseCells: number[],
  strategyId: string,
  name: { zh: string; en: string },
): SubsetExclusionResult | null {
  const baseDigits = baseCells.map((c) => digitsOf(grid.candidatesOf(c)));
  if (baseDigits.some((ds) => ds.length === 0)) return null;

  const witnesses = findWitnesses(grid, baseCells);
  if (witnesses.length === 0) return null;

  // Precompute which base cells see each other.
  const sees: boolean[][] = baseCells.map((a) => baseCells.map((b) => PEERS_OF[a]!.includes(b)));

  const allowed: number[][] = [];

  function dfs(idx: number, combo: number[]): boolean {
    if (idx === baseCells.length) {
      allowed.push([...combo]);
      return allowed.length < 5000; // budget
    }
    for (const d of baseDigits[idx]!) {
      // Alignment: no two mutually-seeing base cells share a digit.
      let ok = true;
      for (let j = 0; j < idx; j++) {
        if (sees[idx]![j] && combo[j] === d) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      combo.push(d);
      // Witness-kill check: does this partial assignment already empty a witness?
      for (const w of witnesses) {
        if (!w.sees.includes(idx)) continue;
        const assignedToWitness = new Set<number>();
        for (const bidx of w.sees) {
          if (bidx <= idx) assignedToWitness.add(combo[bidx]!);
        }
        if (assignedToWitness.size === w.digits.length && w.digits.every((x) => assignedToWitness.has(x))) {
          ok = false;
          break;
        }
      }
      if (ok) {
        if (!dfs(idx + 1, combo)) return false;
      }
      combo.pop();
    }
    return true;
  }

  dfs(0, []);
  if (allowed.length === 0) return null;

  const eliminations: { cell: number; digit: number }[] = [];
  for (let i = 0; i < baseCells.length; i++) {
    const cell = baseCells[i]!;
    for (const d of baseDigits[i]!) {
      if (!allowed.some((combo) => combo[i] === d)) {
        eliminations.push({ cell, digit: d });
      }
    }
  }

  if (eliminations.length === 0) return null;
  return { strategyId, name, baseCells, eliminations };
}

function buildStep(
  grid: Grid,
  result: SubsetExclusionResult,
): Step {
  const { strategyId, name, baseCells, eliminations } = result;
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: [...baseCells, ...eliminations.map((e) => e.cell)],
      candidates: [
        ...baseCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: `${name.zh}：基底格 ${baseCells.map(cellLabel).join(',')} 的所有合法赋值中某些候选数均导致见证格为空，故消去这些候选数。`,
      en: `${name.en}: for base cells ${baseCells.map(cellLabel).join(',')}, some candidates empty every legal assignment, so they are eliminated.`,
    },
  };
}

function scanBaseSets(
  grid: Grid,
  size: number,
  strategyId: string,
  name: { zh: string; en: string },
): Step | null {
  const empties: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && digitsOf(grid.candidatesOf(c)).length > 0) empties.push(c);
  }

  function* combinations(start: number, chosen: number[]): Generator<number[]> {
    if (chosen.length === size) {
      yield [...chosen];
      return;
    }
    for (let i = start; i < empties.length; i++) {
      chosen.push(empties[i]!);
      yield* combinations(i + 1, chosen);
      chosen.pop();
    }
  }

  for (const base of combinations(0, [])) {
    const result = searchSubsetExclusion(grid, base, strategyId, name);
    if (result) return buildStep(grid, result);
  }
  return null;
}

export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    const step = scanBaseSets(grid, 2, this.id, this.name);
    if (!step) return null;
    return step;
  },
};

export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    const step = scanBaseSets(grid, 3, this.id, this.name);
    if (!step) return null;
    return step;
  },
};

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['cell-index', 'digit', 'size'],
  apply(grid: Grid): Step | null {
    // Try sizes 2..4; larger bases are too rare and expensive by hand.
    for (const size of [2, 3, 4]) {
      const step = scanBaseSets(grid, size, this.id, this.name);
      if (step) return step;
    }
    return null;
  },
};
