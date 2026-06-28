import {
  CELLS, ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

type SymmetryType = 'diagonal' | 'anti-diagonal' | 'rotational';

interface SymmetryResult {
  type: SymmetryType;
  permutation: Map<number, number>;
  fixedCells: number[];
  selfMappedDigits: number[];
}

function getComplement(cell: number, sym: SymmetryType): number {
  const r = ROW_OF[cell]!;
  const c = COL_OF[cell]!;
  switch (sym) {
    case 'diagonal':
      return c * 9 + r;
    case 'anti-diagonal':
      return (8 - c) * 9 + (8 - r);
    case 'rotational':
      return (8 - r) * 9 + (8 - c);
  }
}

function getFixedCells(sym: SymmetryType): number[] {
  const fixed: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (getComplement(cell, sym) === cell) fixed.push(cell);
  }
  return fixed;
}

function tryGurthSymmetry(grid: Grid, sym: SymmetryType): SymmetryResult | null {
  const givens: { cell: number; value: number }[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    const v = grid.get(cell);
    if (v !== 0) givens.push({ cell, value: v });
  }

  if (givens.length === 0) return null;

  const perm = new Map<number, number>();

  for (const g of givens) {
    const comp = getComplement(g.cell, sym);
    if (comp === g.cell) continue;

    const compValue = grid.get(comp);
    if (compValue === 0) return null;

    const existing = perm.get(g.value);
    if (existing !== undefined && existing !== compValue) return null;

    const reverseExisting = perm.get(compValue);
    if (reverseExisting !== undefined && reverseExisting !== g.value) return null;

    perm.set(g.value, compValue);
    perm.set(compValue, g.value);
  }

  for (const g of givens) {
    const comp = getComplement(g.cell, sym);
    if (comp === g.cell) continue;
    const compValue = grid.get(comp);
    if (compValue === 0) return null;
    if (perm.get(g.value) !== compValue) return null;
  }

  if (perm.size < 2) return null;

  const allDigits = new Set<number>();
  for (const [k, v] of perm) {
    allDigits.add(k);
    allDigits.add(v);
  }

  for (let d = 1; d <= 9; d++) {
    if (!perm.has(d)) {
      const fixedCells = getFixedCells(sym);
      if (fixedCells.length === 1) {
        perm.set(d, d);
      } else {
        return null;
      }
    }
  }

  const fixedCells = getFixedCells(sym);
  const selfMapped: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (perm.get(d) === d) selfMapped.push(d);
  }

  if (selfMapped.length === 0) return null;
  if (sym === 'diagonal' || sym === 'anti-diagonal') {
    if (selfMapped.length < 3) return null;
  }

  return {
    type: sym,
    permutation: perm,
    fixedCells,
    selfMappedDigits: selfMapped,
  };
}

function applyGurth(grid: Grid, result: SymmetryResult): Step | null {
  const elims: { cell: number; digit: number }[] = [];
  const placements: { cell: number; digit: number }[] = [];

  for (const cell of result.fixedCells) {
    if (grid.get(cell) !== 0) continue;
    const cands = digitsOf(grid.candidatesOf(cell));
    for (const d of cands) {
      if (!result.selfMappedDigits.includes(d)) {
        elims.push({ cell, digit: d });
      }
    }

    const remaining = cands.filter((d) => result.selfMappedDigits.includes(d));
    if (remaining.length === 1) {
      placements.push({ cell, digit: remaining[0]! });
    }
  }

  if (elims.length === 0 && placements.length === 0) return null;

  const symName = result.type === 'diagonal' ? '主对角线' :
    result.type === 'anti-diagonal' ? '副对角线' : '180°旋转';
  const symNameEn = result.type === 'diagonal' ? 'main diagonal' :
    result.type === 'anti-diagonal' ? 'anti-diagonal' : '180° rotation';

  return {
    strategyId: 'gurth',
    placements,
    eliminations: elims,
    highlights: {
      cells: [...result.fixedCells, ...elims.map((e) => e.cell)],
      candidates: result.fixedCells.flatMap((c) =>
        digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
      ),
      links: [],
    },
    explanation: {
      zh: `葛斯定理（${symName}对称）：题目关于${symName}对称且数字置换为 ${formatPerm(result.permutation)}；轴上格 ${result.fixedCells.map(cellLabel).join(',')} 只能取自映射不动的数字 {${result.selfMappedDigits.join(',')}}。`,
      en: `Gurth's Theorem (${symNameEn} symmetry): puzzle is symmetric under ${symNameEn} with digit permutation ${formatPerm(result.permutation)}; axis cells ${result.fixedCells.map(cellLabel).join(',')} can only hold self-mapped digits {${result.selfMappedDigits.join(',')}}.`,
    },
  };
}

function formatPerm(perm: Map<number, number>): string {
  const seen = new Set<number>();
  const cycles: string[] = [];
  for (let d = 1; d <= 9; d++) {
    if (seen.has(d)) continue;
    const mapped = perm.get(d);
    if (mapped === undefined || mapped === d) {
      seen.add(d);
      continue;
    }
    if (mapped > d) {
      cycles.push(`${d}↔${mapped}`);
      seen.add(d);
      seen.add(mapped);
    } else {
      seen.add(d);
    }
  }
  return cycles.join(', ');
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯定理', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const sym of ['diagonal', 'anti-diagonal', 'rotational'] as SymmetryType[]) {
      const result = tryGurthSymmetry(grid, sym);
      if (result) {
        const step = applyGurth(grid, result);
        if (step) return step;
      }
    }
    return null;
  },
};
