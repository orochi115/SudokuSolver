import {
  CELLS, ROW_OF, COL_OF, BOX_OF, ROWS, COLS,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function tryTwinnedXYChains(grid: Grid): Step | null {
  for (let r = 0; r < 9; r++) {
    const row = ROWS[r]!;
    const emptyInRow = row.filter((c) => grid.get(c) === 0);
    if (emptyInRow.length < 3) continue;

    for (let i = 0; i < emptyInRow.length - 2; i++) {
      for (let j = i + 1; j < emptyInRow.length - 1; j++) {
        for (let k = j + 1; k < emptyInRow.length; k++) {
          const triple = [emptyInRow[i]!, emptyInRow[j]!, emptyInRow[k]!];
          const cols = triple.map((c) => COL_OF[c]!);

          const result = trySextupleFromSpine(grid, triple, cols, 'row', r);
          if (result) return result;
        }
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    const column = COLS[col]!;
    const emptyInCol = column.filter((c) => grid.get(c) === 0);
    if (emptyInCol.length < 3) continue;

    for (let i = 0; i < emptyInCol.length - 2; i++) {
      for (let j = i + 1; j < emptyInCol.length - 1; j++) {
        for (let k = j + 1; k < emptyInCol.length; k++) {
          const triple = [emptyInCol[i]!, emptyInCol[j]!, emptyInCol[k]!];
          const rows = triple.map((c) => ROW_OF[c]!);

          const result = trySextupleFromSpine(grid, triple, rows, 'col', col);
          if (result) return result;
        }
      }
    }
  }

  return null;
}

function trySextupleFromSpine(
  grid: Grid,
  spine: number[],
  spineCross: number[],
  spineAxis: 'row' | 'col',
  _spineIdx: number,
): Step | null {
  for (let r2 = 0; r2 < 9; r2++) {
    const parallelCells = spineAxis === 'row'
      ? spineCross.map((c) => r2 * 9 + c)
      : spineCross.map((r) => r * 9 + r2);

    const parallelEmpty = parallelCells.filter((c) => c >= 0 && c < CELLS && grid.get(c) === 0);
    if (parallelEmpty.length < 2) continue;

    const spineSet = new Set(spine);
    const newCells = parallelEmpty.filter((c) => !spineSet.has(c));
    if (newCells.length < 2) continue;

    for (let a = 0; a < newCells.length; a++) {
      for (let b = a + 1; b < newCells.length; b++) {
        const sextuple = [...spine, newCells[a]!, newCells[b]!];
        if (new Set(sextuple).size !== 6) continue;

        let unionMask = 0;
        for (const c of sextuple) unionMask |= grid.candidatesOf(c);
        const unionDigits = digitsOf(unionMask);
        if (unionDigits.length !== 6) continue;

        let mutualVisibility = true;
        for (const d of unionDigits) {
          const bit = maskOf(d);
          const holders = sextuple.filter((c) => grid.candidatesOf(c) & bit);
          for (let x = 0; x < holders.length; x++) {
            for (let y = x + 1; y < holders.length; y++) {
              if (!PEERS_OF[holders[x]!]!.includes(holders[y]!)) {
                mutualVisibility = false;
                break;
              }
            }
            if (!mutualVisibility) break;
          }
          if (!mutualVisibility) break;
        }
        if (!mutualVisibility) continue;

        const elims: { cell: number; digit: number }[] = [];
        const sextSet = new Set(sextuple);

        for (const d of unionDigits) {
          const bit = maskOf(d);
          const holders = sextuple.filter((c) => grid.candidatesOf(c) & bit);
          for (let cell = 0; cell < CELLS; cell++) {
            if (sextSet.has(cell)) continue;
            if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
            const seesAll = holders.every((h) => PEERS_OF[cell]!.includes(h));
            if (seesAll) {
              elims.push({ cell, digit: d });
            }
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: 'twinned-xy-chains',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...sextuple, ...elims.map((e) => e.cell)],
              candidates: sextuple.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `孪生XY链：6 格 ${sextuple.map(cellLabel).join(',')} 含 6 个候选数 {${unionDigits.join(',')}}，每数字在六格中互见（巨裸集）；从六格外看到某数字所有位置的格中消去该数字。`,
              en: `Twinned XY-Chains: 6 cells ${sextuple.map(cellLabel).join(',')} hold 6 digits {${unionDigits.join(',')}} as a giant naked set (all same-digit candidates mutually visible); eliminate each digit from cells outside seeing all its positions in the set.`,
            },
          };
        }
      }
    }
  }

  return null;
}

export const twinnedXYChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生XY链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryTwinnedXYChains(grid);
  },
};
