import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function tryMSLS(grid: Grid): Step | null {
  const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function* subsets(arr: number[], k: number): Generator<number[]> {
    if (k === 0) { yield []; return; }
    if (arr.length < k) return;
    const [first, ...rest] = arr;
    for (const c of subsets(rest, k - 1)) yield [first!, ...c];
    yield* subsets(rest, k);
  }

  for (const dSubset of subsets(allDigits, 4)) {
    const dSet = new Set(dSubset);

    const possibleTruthRows: number[] = [];
    const possibleTruthCols: number[] = [];

    for (let r = 0; r < 9; r++) {
      const hasDigit = ROWS[r]!.some((c) => grid.hasCandidateAnyOf(c, dSet));
      if (hasDigit) possibleTruthRows.push(r);
    }
    for (let c = 0; c < 9; c++) {
      const hasDigit = COLS[c]!.some((cc) => grid.hasCandidateAnyOf(cc, dSet));
      if (hasDigit) possibleTruthCols.push(c);
    }

    for (const truthCount of [3, 4]) {
      if (possibleTruthRows.length < truthCount && possibleTruthCols.length < truthCount) continue;

      const rowsChoices = possibleTruthRows.length >= truthCount
        ? [...subsets(possibleTruthRows, truthCount)]
        : [];
      const colsChoices = possibleTruthCols.length >= truthCount
        ? [...subsets(possibleTruthCols, truthCount)]
        : [];

      const allChoices = [...rowsChoices.map((r) => ({ type: 'row' as const, indices: r })),
        ...colsChoices.map((c) => ({ type: 'col' as const, indices: c }))];

      for (const choice of allChoices) {
        const { type, indices } = choice;
        const houses = type === 'row'
          ? indices.map((i) => ROWS[i]!)
          : indices.map((i) => COLS[i]!);

        const loopCells: number[] = [];
        let cellMask = 0;
        for (const house of houses) {
          for (const c of house) {
            if (grid.get(c) !== 0) continue;
            if (dSet.size > 0) {
              const hasD = dSubset.some((d) => grid.hasCandidate(c, d));
              if (!hasD) continue;
            }
            if (!loopCells.includes(c)) {
              loopCells.push(c);
              cellMask |= grid.candidatesOf(c);
            }
          }
        }

        const cellsWithDSubset = loopCells.filter((c) =>
          dSubset.some((d) => grid.hasCandidate(c, d)),
        );

        const eliminations: { cell: number; digit: number }[] = [];
        for (const c of cellsWithDSubset) {
          for (const d of digitsOf(grid.candidatesOf(c))) {
            if (!dSet.has(d)) {
              eliminations.push({ cell: c, digit: d });
            }
          }
        }

        if (eliminations.length === 0) continue;

        const seen = new Set<number>();
        const uniqueElims = eliminations.filter((e) => {
          const key = e.cell * 10 + e.digit;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          strategyId: 'msls',
          placements: [],
          eliminations: uniqueElims,
          highlights: {
            cells: [...new Set([...loopCells, ...uniqueElims.map((e) => e.cell)])],
            candidates: [
              ...cellsWithDSubset.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...uniqueElims,
            ],
            links: [],
          },
          explanation: {
            zh: `MSLS：数字子集 {${dSubset.join(',')}} 在 ${type === 'row' ? '行' : '列'} ${indices.map((i) => i + 1).join(',')} 上形成多扇区锁定集；消去需求格中的非子集候选。`,
            en: `MSLS: digit subset {${dSubset.join(',')}} on ${type === 'row' ? 'rows' : 'cols'} ${indices.map((i) => i + 1).join(',')} forms Multi-Sector Locked Set; eliminate non-subset candidates.`,
          },
        };
      }
    }
  }
  return null;
}

export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区数组', en: 'MSLS' },
  difficulty: 1300,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryMSLS(grid);
  },
};