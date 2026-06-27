/**
 * Subset Exclusion family (P2a/P2b) — 子集排除族
 *
 *  - aligned-pair-exclusion    (APE, k=2 aligned)
 *  - aligned-triple-exclusion  (ATE, k=3 aligned)
 *  - subset-exclusion          (owner, general k, non-aligned)
 *
 * Key optimization: instead of O(n²) or O(n³) over all cells, we precompute
 * bivalue cells and their peers, then only try base sets that share a common
 * bivalue witness. This reduces the search to a few dozen candidates.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function sees(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

interface Witness {
  cells: number[];
  mask: number;
}

/** Collect bivalue cells seen by ALL base cells + small ALSs in one house. */
function collectWitnesses(grid: Grid, baseCells: number[]): Witness[] {
  const witnesses: Witness[] = [];
  const baseSet = new Set(baseCells);

  // Bivalue buddy cells seen by all base cells
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || baseSet.has(c)) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    if (baseCells.every((b) => sees(b, c))) {
      witnesses.push({ cells: [c], mask: m });
    }
  }

  // 2-cell ALS (3 cands) in one house, all base cells see all witness cells
  for (const house of HOUSES) {
    const empty = house.filter((c) => grid.get(c) === 0 && !baseSet.has(c));
    for (let i = 0; i < empty.length; i++) {
      for (let j = i + 1; j < empty.length; j++) {
        const c1 = empty[i]!, c2 = empty[j]!;
        const m = grid.candidatesOf(c1) | grid.candidatesOf(c2);
        if (popcount(m) !== 3) continue;
        if (baseCells.every((b) => sees(b, c1) && sees(b, c2))) {
          witnesses.push({ cells: [c1, c2], mask: m });
        }
      }
    }
  }

  return witnesses;
}

function emptiesWitness(
  assignment: number[],
  witness: Witness,
): boolean {
  let covered = 0;
  for (const d of assignment) {
    if (witness.mask & maskOf(d)) covered |= maskOf(d);
  }
  return covered === witness.mask;
}

interface ExclusionResult {
  eliminations: { cell: number; digit: number }[];
  baseCells: number[];
  witnesses: Witness[];
}

function runExclusion(grid: Grid, baseCells: number[]): ExclusionResult | null {
  const witnesses = collectWitnesses(grid, baseCells);
  if (witnesses.length === 0) return null;

  const candLists = baseCells.map((c) => digitsOf(grid.candidatesOf(c)));
  let totalCombos = 1;
  for (const cl of candLists) {
    totalCombos *= cl.length;
    if (totalCombos > 128) return null;
  }

  const baseSeen: Array<[number, number]> = [];
  for (let i = 0; i < baseCells.length; i++) {
    for (let j = i + 1; j < baseCells.length; j++) {
      if (sees(baseCells[i]!, baseCells[j]!)) baseSeen.push([i, j]);
    }
  }

  const survivors: Set<number>[] = baseCells.map(() => new Set<number>());
  const indices = new Array(baseCells.length).fill(0);
  let hasAllowed = false;

  while (true) {
    const assignment = indices.map((idx, i) => candLists[i]![idx]!);

    let legal = true;
    for (const [i, j] of baseSeen) {
      if (assignment[i] === assignment[j]) { legal = false; break; }
    }

    if (legal) {
      let excluded = false;
      for (const w of witnesses) {
        if (emptiesWitness(assignment, w)) { excluded = true; break; }
      }
      if (!excluded) {
        hasAllowed = true;
        for (let i = 0; i < baseCells.length; i++) survivors[i]!.add(assignment[i]!);
      }
    }

    let pos = baseCells.length - 1;
    while (pos >= 0) {
      indices[pos]!++;
      if (indices[pos]! < candLists[pos]!.length) break;
      indices[pos] = 0;
      pos--;
    }
    if (pos < 0) break;
  }

  if (!hasAllowed) return null;

  const eliminations: { cell: number; digit: number }[] = [];
  for (let i = 0; i < baseCells.length; i++) {
    const cell = baseCells[i]!;
    for (const d of candLists[i]!) {
      if (!survivors[i]!.has(d)) eliminations.push({ cell, digit: d });
    }
  }

  if (eliminations.length === 0) return null;
  return { eliminations, baseCells, witnesses };
}

function makeExclusionStep(
  grid: Grid,
  result: ExclusionResult,
  strategyId: string,
  zhName: string,
  enName: string,
): Step {
  const { eliminations, baseCells, witnesses } = result;
  const allCells = [...new Set([
    ...baseCells,
    ...witnesses.flatMap((w) => w.cells),
    ...eliminations.map((e) => e.cell),
  ])];
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: allCells,
      candidates: [
        ...baseCells.flatMap((c) =>
          digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
        ),
        ...witnesses.flatMap((w) =>
          w.cells.flatMap((c) =>
            digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
          ),
        ),
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: `${zhName}：基集 ${baseCells.map(cellLabel).join(', ')} 的所有候选组合中，凡会清空见证集（双值格/ALS）的组合皆排除；${eliminations.map((e) => `${cellLabel(e.cell)}≠${e.digit}`).join(', ')} 在无剩余组合中出现，故消去。`,
      en: `${enName}: enumerating all candidate combinations of base cells ${baseCells.map(cellLabel).join(', ')}; combinations that empty a witness (bivalue cell/ALS) are excluded; ${eliminations.map((e) => `${cellLabel(e.cell)}≠${e.digit}`).join(', ')} survive in no allowed combination and are eliminated.`,
    },
  };
}

/** Collect bivalue cells — the minimal witnesses for exclusion. */
function getBivalueCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) out.push(c);
  }
  return out;
}

// ---- Aligned Pair Exclusion (APE) ----
export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const bivalues = getBivalueCells(grid);
    if (bivalues.length < 1) return null;

    // For each bivalue witness, try pairs of its peers as base cells
    for (const w of bivalues) {
      const peers = PEERS_OF[w]!.filter((c) => grid.get(c) === 0);
      for (let i = 0; i < peers.length; i++) {
        for (let j = i + 1; j < peers.length; j++) {
          const a = peers[i]!, b = peers[j]!;
          const ci = digitsOf(grid.candidatesOf(a));
          const cj = digitsOf(grid.candidatesOf(b));
          if (ci.length * cj.length > 36) continue;
          const result = runExclusion(grid, [a, b]);
          if (result) {
            return makeExclusionStep(grid, result, 'aligned-pair-exclusion', '对齐数对排除', 'Aligned Pair Exclusion');
          }
        }
      }
    }
    return null;
  },
};

// ---- Aligned Triple Exclusion (ATE) ----
export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const bivalues = getBivalueCells(grid);
    if (bivalues.length < 1) return null;

    // For each house, try triples that share a common bivalue peer
    for (const house of HOUSES) {
      const empty = house.filter((c) => grid.get(c) === 0);
      if (empty.length < 3) continue;
      for (let i = 0; i < empty.length - 2; i++) {
        for (let j = i + 1; j < empty.length - 1; j++) {
          for (let k = j + 1; k < empty.length; k++) {
            const triple = [empty[i]!, empty[j]!, empty[k]!];
            // Precheck: must have a common bivalue peer
            const peers0 = new Set(PEERS_OF[triple[0]!]);
            const peers1 = new Set(PEERS_OF[triple[1]!]);
            const peers2 = new Set(PEERS_OF[triple[2]!]);
            let hasCommon = false;
            for (const w of bivalues) {
              if (peers0.has(w) && peers1.has(w) && peers2.has(w)) { hasCommon = true; break; }
            }
            if (!hasCommon) continue;

            const cands = triple.map((c) => digitsOf(grid.candidatesOf(c)));
            let total = 1;
            for (const cs of cands) { total *= cs.length; if (total > 64) break; }
            if (total > 64) continue;

            const result = runExclusion(grid, triple);
            if (result) {
              return makeExclusionStep(grid, result, 'aligned-triple-exclusion', '对齐三数排除', 'Aligned Triple Exclusion');
            }
          }
        }
      }
    }
    return null;
  },
};

// ---- Subset Exclusion (general owner) ----
// k=3, cells need NOT be aligned (at least one pair doesn't see each other)
export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['size', 'cell-index'],

  apply(grid: Grid): Step | null {
    const bivalues = getBivalueCells(grid);
    if (bivalues.length < 1) return null;

    // For each bivalue witness, try triples of its peers
    let budget = 3000;
    for (const w of bivalues) {
      if (budget <= 0) break;
      const peers = PEERS_OF[w]!.filter((c) => grid.get(c) === 0);
      for (let i = 0; i < peers.length - 2; i++) {
        if (budget <= 0) break;
        for (let j = i + 1; j < peers.length - 1; j++) {
          if (budget <= 0) break;
          for (let k = j + 1; k < peers.length; k++) {
            if (--budget <= 0) break;
            const triple = [peers[i]!, peers[j]!, peers[k]!];
            // At least one pair should NOT see each other (otherwise it's ATE)
            const allAligned = sees(triple[0]!, triple[1]!) && sees(triple[0]!, triple[2]!) && sees(triple[1]!, triple[2]!);
            if (allAligned) continue;

            const cands = triple.map((c) => digitsOf(grid.candidatesOf(c)));
            let total = 1;
            for (const cs of cands) { total *= cs.length; if (total > 81) break; }
            if (total > 81) continue;

            const result = runExclusion(grid, triple);
            if (result) {
              return makeExclusionStep(grid, result, 'subset-exclusion', '子集排除', 'Subset Exclusion');
            }
          }
        }
      }
    }
    return null;
  },
};
