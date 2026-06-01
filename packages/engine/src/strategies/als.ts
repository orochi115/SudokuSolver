import { CELLS, HOUSES, PEERS_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { CellDigit, Step } from '../trace.js';
import { combinations } from './_common.js';

interface Als {
  cells: number[];
  mask: number;
  digits: number[];
  byDigit: Map<number, number[]>;
}

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Sets' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    const sets = buildAls(grid);
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const step = findAlsPairElimination(grid, sets[i]!, sets[j]!, this.id);
        if (step) return step;
      }
    }
    return null;
  },
};

function buildAls(grid: Grid): Als[] {
  const out: Als[] = [];
  for (const house of HOUSES) {
    const cells = house.filter((cell) => grid.get(cell) === 0);
    for (let size = 1; size <= Math.min(3, cells.length); size++) {
      for (const subset of combinations(cells, size)) {
        let mask = 0;
        for (const c of subset) mask |= grid.candidatesOf(c);
        const digitCount = popcount(mask);
        if (digitCount !== subset.length + 1) continue;
        const digits = digitsOf(mask);
        const byDigit = new Map<number, number[]>();
        for (const d of digits) {
          byDigit.set(
            d,
            subset.filter((c) => grid.hasCandidate(c, d)),
          );
        }
        out.push({ cells: subset, mask, digits, byDigit });
      }
    }
  }
  return out;
}

function disjoint(a: readonly number[], b: readonly number[]): boolean {
  const setA = new Set(a);
  return b.every((x) => !setA.has(x));
}

function areAllPeers(cellsA: readonly number[], cellsB: readonly number[]): boolean {
  for (const a of cellsA) {
    for (const b of cellsB) {
      if (a === b) return false;
      if (!PEERS_OF[a]!.includes(b)) return false;
    }
  }
  return true;
}

function seesAll(cell: number, targets: readonly number[]): boolean {
  const ps = new Set(PEERS_OF[cell]!);
  return targets.every((t) => ps.has(t));
}

function findAlsPairElimination(grid: Grid, a: Als, b: Als, strategyId: string): Step | null {
  if (!disjoint(a.cells, b.cells)) return null;

  const common = a.digits.filter((d) => b.byDigit.has(d));
  if (common.length < 2) return null;

  const restricted: number[] = [];
  for (const d of common) {
    const aCells = a.byDigit.get(d) ?? [];
    const bCells = b.byDigit.get(d) ?? [];
    if (aCells.length === 0 || bCells.length === 0) continue;
    if (areAllPeers(aCells, bCells)) restricted.push(d);
  }
  if (restricted.length === 0) return null;

  const nonRestricted = common.filter((d) => !restricted.includes(d));
  if (nonRestricted.length === 0) return null;

  const eliminations: CellDigit[] = [];
  for (const z of nonRestricted) {
    const zCells = [...(a.byDigit.get(z) ?? []), ...(b.byDigit.get(z) ?? [])];
    if (zCells.length < 2) continue;
    for (let cell = 0; cell < CELLS; cell++) {
      if (a.cells.includes(cell) || b.cells.includes(cell)) continue;
      if (!grid.hasCandidate(cell, z)) continue;
      if (!seesAll(cell, zCells)) continue;
      eliminations.push({ cell, digit: z });
    }
  }

  if (eliminations.length === 0) return null;

  const links = restricted.flatMap((d) => {
    const as = a.byDigit.get(d) ?? [];
    const bs = b.byDigit.get(d) ?? [];
    const out: Step['highlights']['links'] = [];
    for (const ac of as) {
      for (const bc of bs) {
        out.push({
          from: { cell: ac, digit: d },
          to: { cell: bc, digit: d },
          type: 'strong',
        });
      }
    }
    return out;
  });

  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: Array.from(new Set([...a.cells, ...b.cells, ...eliminations.map((e) => e.cell)])),
      candidates: [
        ...a.cells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
        ...b.cells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
      ],
      links,
    },
    explanation: {
      zh: `发现 ALS 关联（含 ALS-XZ / doubly-linked ALS 形态）：受限公共候选锁定后，可删除同时看见两侧非受限候选的数字。`,
      en: `An ALS relation (including ALS-XZ / doubly-linked forms) is found: restricted common digits lock the sets, so non-restricted common digits are eliminated from cells seeing both sides.`,
    },
  };
}
