import {
  CELLS,
  COL_OF,
  PEERS_OF,
  ROW_OF,
  digitsOf,
  maskOf,
  popcount,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';
import { alsXz } from './als.js';

type Name = { zh: string; en: string };
type Assignment = readonly { cell: number; digit: number }[];

function cellName(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function retitle(step: Step, id: string, name: Name): Step {
  return {
    ...step,
    strategyId: id,
    explanation: {
      zh: `${name.zh}：${step.explanation.zh}`,
      en: `${name.en}: ${step.explanation.en}`,
    },
  };
}

function aliasStrategy(
  id: string,
  name: Name,
  difficulty: number,
  base: Strategy,
  tieBreak: readonly TieBreakKey[] = base.tieBreak ?? [],
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,
    apply(grid: Grid): Step | null {
      const step = base.apply(grid);
      return step ? retitle(step, id, name) : null;
    },
  };
}

function conservativeStrategy(
  id: string,
  name: Name,
  difficulty: number,
  tieBreak: readonly TieBreakKey[] = [],
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak,
    apply: () => null,
  };
}

function everyPairSharesAHouse(cells: readonly number[]): boolean {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i]!;
      const b = cells[j]!;
      if (ROW_OF[a] !== ROW_OF[b] && COL_OF[a] !== COL_OF[b] && !PEERS_OF[a]!.includes(b)) return false;
    }
  }
  return true;
}

function commonBivalueAls(grid: Grid, baseCells: readonly number[]): number[] {
  const result: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    if (baseCells.includes(cell)) continue;
    if (popcount(grid.candidatesOf(cell)) !== 2) continue;
    if (baseCells.every((baseCell) => PEERS_OF[baseCell]!.includes(cell))) result.push(cell);
  }
  return result;
}

function assignmentsFor(grid: Grid, baseCells: readonly number[]): Assignment[] {
  const result: Assignment[] = [];
  const current: { cell: number; digit: number }[] = [];

  function visit(index: number): void {
    if (index === baseCells.length) {
      result.push(current.map((entry) => ({ ...entry })));
      return;
    }

    const cell = baseCells[index]!;
    for (const digit of digitsOf(grid.candidatesOf(cell))) {
      let repeatedInAlignedPeer = false;
      for (const assigned of current) {
        if (assigned.digit === digit && PEERS_OF[cell]!.includes(assigned.cell)) {
          repeatedInAlignedPeer = true;
          break;
        }
      }
      if (repeatedInAlignedPeer) continue;

      current.push({ cell, digit });
      visit(index + 1);
      current.pop();
    }
  }

  visit(0);
  return result;
}

function assignmentKillsBivalueAls(grid: Grid, assignment: Assignment, alsCell: number): boolean {
  const alsDigits = digitsOf(grid.candidatesOf(alsCell));
  return alsDigits.every((digit) => assignment.some((entry) => entry.digit === digit));
}

function combinations(cells: number[], size: number): number[][] {
  const result: number[][] = [];
  const current: number[] = [];

  function visit(start: number): void {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i <= cells.length - (size - current.length); i++) {
      current.push(cells[i]!);
      visit(i + 1);
      current.pop();
    }
  }

  visit(0);
  return result;
}

function tryAlignedExclusion(grid: Grid, size: 2 | 3, strategyId: string, name: Name): Step | null {
  const candidateCells: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) >= 2) candidateCells.push(cell);
  }

  for (const baseCells of combinations(candidateCells, size)) {
    if (!everyPairSharesAHouse(baseCells)) continue;
    const blockers = commonBivalueAls(grid, baseCells);
    if (blockers.length === 0) continue;

    const allowed = assignmentsFor(grid, baseCells).filter(
      (assignment) => !blockers.some((alsCell) => assignmentKillsBivalueAls(grid, assignment, alsCell)),
    );
    if (allowed.length === 0) continue;

    const eliminations: { cell: number; digit: number }[] = [];
    for (const cell of baseCells) {
      for (const digit of digitsOf(grid.candidatesOf(cell))) {
        if (!allowed.some((assignment) => assignment.some((entry) => entry.cell === cell && entry.digit === digit))) {
          eliminations.push({ cell, digit });
        }
      }
    }

    if (eliminations.length === 0) continue;

    const blockerText = blockers.map(cellName).join(', ');
    const baseText = baseCells.map(cellName).join(', ');
    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...baseCells, ...blockers],
        candidates: [
          ...baseCells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
          ...blockers.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `${name.zh}：基准格 ${baseText} 的候选组合逐一排除；共同可见的双值 ALS ${blockerText} 会被某些组合清空。剩余合法组合中从未出现的候选可删除。`,
        en: `${name.en}: enumerate the aligned base cells ${baseText}; common bivalue ALS cell(s) ${blockerText} exclude combinations that would empty them. Candidates absent from every surviving combination are eliminated.`,
      },
    };
  }

  return null;
}

export const vwxyzWing = aliasStrategy(
  'vwxyz-wing',
  { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  530,
  alsXz,
  ['house', 'size', 'cell-index'],
);

export const fireworks = conservativeStrategy(
  'fireworks',
  { zh: '烟花', en: 'Fireworks' },
  1050,
  ['house', 'cell-index', 'digit'],
);

export const exocet = conservativeStrategy(
  'exocet',
  { zh: 'Exocet / 飞鱼导弹', en: 'Exocet' },
  1200,
  ['house', 'cell-index', 'digit'],
);

export const skLoop = conservativeStrategy(
  'sk-loop',
  { zh: 'SK-Loop / 多米诺环', en: 'SK-Loop' },
  1250,
  ['house', 'cell-index', 'digit'],
);

export const msls = conservativeStrategy(
  'msls',
  { zh: 'MSLS / 多扇区数组', en: 'Multi-Sector Locked Sets' },
  1300,
  ['house', 'size', 'digit'],
);

export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    return tryAlignedExclusion(grid, 2, this.id, this.name);
  },
};

export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三数排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    return tryAlignedExclusion(grid, 3, this.id, this.name);
  },
};

function legalAssignmentForSubset(
  assignment: readonly { cell: number; digit: number }[],
): boolean {
  for (let i = 0; i < assignment.length; i++) {
    for (let j = i + 1; j < assignment.length; j++) {
      const a = assignment[i]!;
      const b = assignment[j]!;
      if (a.digit === b.digit && PEERS_OF[a.cell]!.includes(b.cell)) return false;
    }
  }
  return true;
}

function assignmentEmptiesWitnessForSubset(
  grid: Grid,
  assignment: Assignment,
  alsCell: number,
): boolean {
  const alsDigits = digitsOf(grid.candidatesOf(alsCell));
  return alsDigits.every((digit) => assignment.some((entry) => entry.digit === digit && PEERS_OF[entry.cell]!.includes(alsCell)));
}

function trySubsetExclusion(grid: Grid, strategyId: string, name: Name): Step | null {
  const candidateCells: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) >= 2) candidateCells.push(cell);
  }

  for (const baseCells of combinations(candidateCells, 3)) {
    const blockers = candidateCells.filter(
      (cell) =>
        !baseCells.includes(cell) &&
        popcount(grid.candidatesOf(cell)) === 2 &&
        baseCells.every((base) => PEERS_OF[base]!.includes(cell)),
    );
    if (blockers.length === 0) continue;

    const allowed = assignmentsFor(grid, baseCells).filter(
      (assignment) =>
        legalAssignmentForSubset(assignment) &&
        !blockers.some((alsCell) => assignmentEmptiesWitnessForSubset(grid, assignment, alsCell)),
    );
    if (allowed.length === 0) continue;

    const eliminations: { cell: number; digit: number }[] = [];
    for (const cell of baseCells) {
      for (const digit of digitsOf(grid.candidatesOf(cell))) {
        if (!allowed.some((assignment) => assignment.some((entry) => entry.cell === cell && entry.digit === digit))) {
          eliminations.push({ cell, digit });
        }
      }
    }

    if (eliminations.length === 0) continue;

    const blockerText = blockers.map(cellName).join(', ');
    const baseText = baseCells.map(cellName).join(', ');
    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...baseCells, ...blockers],
        candidates: [
          ...baseCells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
          ...blockers.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `${name.zh}：基准格 ${baseText} 的候选组合逐一排除；共同可见的双值 ALS ${blockerText} 会被某些组合清空。剩余合法组合中从未出现的候选可删除。`,
        en: `${name.en}: enumerate base cells ${baseText}; common bivalue ALS cells ${blockerText} exclude combinations that would empty them. Candidates absent from every surviving combination are eliminated.`,
      },
    };
  }

  return null;
}

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['cell-index', 'digit'],
  apply(grid: Grid): Step | null {
    return trySubsetExclusion(grid, this.id, this.name);
  },
};
