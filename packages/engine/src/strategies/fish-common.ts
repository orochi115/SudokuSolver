import { COL_OF, COLS, ROW_OF, ROWS, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import { combinations, uniqueCells, uniqueEliminations } from './common.js';

interface FishSearchResult {
  readonly digit: number;
  readonly baseType: 'row' | 'col';
  readonly baseIndexes: readonly number[];
  readonly coverIndexes: readonly number[];
  readonly patternCells: readonly number[];
  readonly eliminationCells: readonly number[];
}

function bitIndexes(mask: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) {
    if ((mask & (1 << i)) !== 0) out.push(i);
  }
  return out;
}

function findFish(grid: Grid, size: number): FishSearchResult | null {
  for (let digit = 1; digit <= 9; digit++) {
    const bit = maskOf(digit);

    // Base rows, cover columns.
    const rowMasks: number[] = [];
    for (let r = 0; r < 9; r++) {
      let colsMask = 0;
      for (const cell of ROWS[r]!) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) colsMask |= 1 << COL_OF[cell]!;
      }
      rowMasks.push(colsMask);
    }

    const candidateRows = rowMasks
      .map((mask, idx) => ({ idx, count: popcount(mask), mask }))
      .filter((x) => x.count >= 2 && x.count <= size);
    for (const rows of combinations(candidateRows, size)) {
      let coverMask = 0;
      for (const r of rows) coverMask |= r.mask;
      if (popcount(coverMask) !== size) continue;
      const coverCols = bitIndexes(coverMask);
      const baseRows = rows.map((r) => r.idx);
      const eliminationCells = coverCols
        .flatMap((c) => COLS[c]!.filter((cell) => !baseRows.includes(ROW_OF[cell]!) && grid.hasCandidate(cell, digit)));
      if (eliminationCells.length === 0) continue;
      const patternCells = baseRows.flatMap((r) => ROWS[r]!.filter((cell) => grid.hasCandidate(cell, digit) && coverCols.includes(COL_OF[cell]!)));
      return {
        digit,
        baseType: 'row',
        baseIndexes: baseRows,
        coverIndexes: coverCols,
        patternCells,
        eliminationCells: uniqueCells(eliminationCells),
      };
    }

    // Base columns, cover rows.
    const colMasks: number[] = [];
    for (let c = 0; c < 9; c++) {
      let rowsMask = 0;
      for (const cell of COLS[c]!) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) rowsMask |= 1 << ROW_OF[cell]!;
      }
      colMasks.push(rowsMask);
    }

    const candidateCols = colMasks
      .map((mask, idx) => ({ idx, count: popcount(mask), mask }))
      .filter((x) => x.count >= 2 && x.count <= size);
    for (const cols of combinations(candidateCols, size)) {
      let coverMask = 0;
      for (const c of cols) coverMask |= c.mask;
      if (popcount(coverMask) !== size) continue;
      const coverRows = bitIndexes(coverMask);
      const baseCols = cols.map((c) => c.idx);
      const eliminationCells = coverRows
        .flatMap((r) => ROWS[r]!.filter((cell) => !baseCols.includes(COL_OF[cell]!) && grid.hasCandidate(cell, digit)));
      if (eliminationCells.length === 0) continue;
      const patternCells = baseCols.flatMap((c) => COLS[c]!.filter((cell) => grid.hasCandidate(cell, digit) && coverRows.includes(ROW_OF[cell]!)));
      return {
        digit,
        baseType: 'col',
        baseIndexes: baseCols,
        coverIndexes: coverRows,
        patternCells,
        eliminationCells: uniqueCells(eliminationCells),
      };
    }
  }
  return null;
}

export function basicFishStep(
  grid: Grid,
  strategyId: string,
  size: number,
  nameEn: string,
  nameZh: string,
): Step | null {
  const hit = findFish(grid, size);
  if (!hit) return null;
  const eliminations = uniqueEliminations(hit.eliminationCells.map((cell) => ({ cell, digit: hit.digit })));

  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: uniqueCells([...hit.patternCells, ...hit.eliminationCells]),
      candidates: [
        ...hit.patternCells.map((cell) => ({ cell, digit: hit.digit })),
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: `${nameZh}：数字 ${hit.digit} 在 ${size} 个${hit.baseType === 'row' ? '行' : '列'}基集中只落在 ${size} 个${hit.baseType === 'row' ? '列' : '行'}覆盖集，因此可在覆盖集其余位置删除该候选。`,
      en: `${nameEn}: digit ${hit.digit} forms a size-${size} base/cover fish (${hit.baseType === 'row' ? 'rows to columns' : 'columns to rows'}), so eliminate ${hit.digit} from cover cells outside the base houses.`,
    },
  };
}
