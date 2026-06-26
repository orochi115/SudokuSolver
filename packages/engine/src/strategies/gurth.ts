import { CELLS, ROW_OF, COL_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function toRC(cell: number): [number, number] {
  return [ROW_OF[cell]!, COL_OF[cell]!];
}

function fromRC(r: number, c: number): number {
  return r * 9 + c;
}

function tryGurth(grid: Grid): Step | null {
  const givens: [number, number][] = [];
  for (let c = 0; c < CELLS; c++) {
    const v = grid.get(c);
    if (v !== 0) givens.push([c, v]);
  }

  const symmetries: Array<{
    name: string;
    nameZh: string;
    map: (r: number, c: number) => [number, number] | null;
    fixedCells: (r: number, c: number) => boolean;
  }> = [
    {
      name: 'Diagonal (A1-J9)',
      nameZh: '主对角线',
      map: (r, c) => [c, r],
      fixedCells: (r, c) => r === c,
    },
    {
      name: 'Anti-Diagonal',
      nameZh: '反对角线',
      map: (r, c) => [8 - c, 8 - r],
      fixedCells: (r, c) => r + c === 8,
    },
    {
      name: '180° Rotation',
      nameZh: '180度旋转',
      map: (r, c) => [8 - r, 8 - c],
      fixedCells: (r, c) => r === 4 && c === 4,
    },
  ];

  for (const sym of symmetries) {
    const perm: Record<number, number> = {};
    let valid = true;

    for (const [cell, digit] of givens) {
      const [r, c] = toRC(cell);
      const mapped = sym.map(r, c);
      if (!mapped) { valid = false; break; }
      const [mr, mc] = mapped;
      const mCell = fromRC(mr, mc);
      const mDigit = grid.get(mCell);
      if (mDigit === 0) { valid = false; break; }
      if (perm[digit] !== undefined) {
        if (perm[digit] !== mDigit) { valid = false; break; }
      } else {
        if (Object.values(perm).includes(mDigit)) { valid = false; break; }
        perm[digit] = mDigit;
      }
    }

    if (!valid || Object.keys(perm).length === 0) continue;

    const selfMappedDigits = Object.entries(perm)
      .filter(([k, v]) => parseInt(k) === v)
      .map(([k]) => parseInt(k));

    if (selfMappedDigits.length === 0) continue;

    const fixedCells: number[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (sym.fixedCells(r, c)) fixedCells.push(fromRC(r, c));
      }
    }

    const selfMapSet = new Set(selfMappedDigits);
    const eliminations: { cell: number; digit: number }[] = [];

    for (const fc of fixedCells) {
      if (grid.get(fc) !== 0) continue;
      for (const d of digitsOf(grid.candidatesOf(fc))) {
        if (!selfMapSet.has(d)) {
          eliminations.push({ cell: fc, digit: d });
        }
      }
    }

    if (eliminations.length === 0) continue;

    return {
      strategyId: 'gurth',
      placements: [],
      eliminations,
      highlights: {
        cells: fixedCells,
        candidates: fixedCells.flatMap((fc) =>
          digitsOf(grid.candidatesOf(fc)).map((d) => ({ cell: fc, digit: d }))
        ),
        links: [],
      },
      explanation: {
        zh: `Gurth 对称占位：谜题呈${sym.nameZh}对称，自映射数字 {${selfMappedDigits.join(',')}}；对称轴格只能为自映射数字，消去轴格上的非自映射候选。`,
        en: `Gurth's Symmetrical Placement: puzzle has ${sym.name} symmetry, self-mapped digits {${selfMappedDigits.join(',')}}; axis cells must hold self-mapped digits, eliminate others.`,
      },
    };
  }

  return null;
}

export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: '葛斯对称', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryGurth(grid);
  },
};