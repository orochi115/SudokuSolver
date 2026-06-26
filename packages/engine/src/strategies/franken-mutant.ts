import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

type HouseType = 'row' | 'col' | 'box';

function* combineIndices(n: number, size: number): Generator<number[]> {
  if (n < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield [...idx];
    let i = size - 1;
    while (i >= 0 && idx[i]! === n - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function getHouseCells(houseType: HouseType, index: number): readonly number[] {
  if (houseType === 'row') return ROWS[index]!;
  if (houseType === 'col') return COLS[index]!;
  return BOXES[index]!;
}

function tryFrankenMutantFish(grid: Grid, d: number): { step: Step; isMutant: boolean } | null {
  const bit = maskOf(d);

  for (const size of [3, 4]) {
    for (const pureType of ['row', 'col'] as HouseType[]) {
      const oppositeType: HouseType = pureType === 'row' ? 'col' : 'row';

      for (const basePureCombo of combineIndices(9, size)) {
        for (const baseBoxCount of [0, 1, 2]) {
          const baseRowCount = size - baseBoxCount;
          if (baseRowCount < 0 || baseRowCount > size) continue;
          if (baseBoxCount > 0 && baseRowCount < 1) continue;

          for (const baseBoxIndices of combineIndices(9, baseBoxCount)) {
            const frankenBases: { type: HouseType; index: number }[] = [
              ...basePureCombo.slice(0, baseRowCount).map((i) => ({ type: pureType, index: i })),
              ...baseBoxIndices.map((i) => ({ type: 'box' as const, index: i })),
            ];

            for (const coverPureCombo of combineIndices(9, size)) {
              for (const coverBoxCount of [0, 1, 2]) {
                const coverRowCount = size - coverBoxCount;
                if (coverRowCount < 0 || coverRowCount > size) continue;
                if (coverBoxCount > 0 && coverRowCount < 1) continue;

                for (const coverBoxIndices of combineIndices(9, coverBoxCount)) {
                  const coverHouses: { type: HouseType; index: number }[] = [
                    ...coverPureCombo.slice(0, coverRowCount).map((i) => ({ type: oppositeType, index: i })),
                    ...coverBoxIndices.map((i) => ({ type: 'box' as const, index: i })),
                  ];

                  const baseCellSet = new Set<number>();
                  const baseCells: number[] = [];
                  const finCells: number[] = [];
                  const endoFinCells: number[] = [];

                  for (const bh of frankenBases) {
                    const hc = getHouseCells(bh.type, bh.index);
                    for (const c of hc) {
                      if (grid.get(c) !== 0) continue;
                      if ((grid.candidatesOf(c) & bit) === 0) continue;
                      const inCover = coverHouses.some((ch) => getHouseCells(ch.type, ch.index).includes(c));
                      if (baseCellSet.has(c)) {
                        endoFinCells.push(c);
                        continue;
                      }
                      if (!inCover) {
                        finCells.push(c);
                        continue;
                      }
                      baseCellSet.add(c);
                      baseCells.push(c);
                    }
                  }

                  if (baseCellSet.size < size - 1) continue;
                  const allFinCells = [...new Set([...finCells, ...endoFinCells])];
                  if (allFinCells.length === 0) continue;

                  const finBoxes = new Set(allFinCells.map((c) => BOX_OF[c]!));
                  if (finBoxes.size > 1) continue;

                  const eliminations: { cell: number; digit: number }[] = [];
                  for (const ch of coverHouses) {
                    const hc = getHouseCells(ch.type, ch.index);
                    for (const c of hc) {
                      if (grid.get(c) !== 0) continue;
                      if ((grid.candidatesOf(c) & bit) === 0) continue;
                      if (baseCellSet.has(c)) continue;
                      const seesAllFins = allFinCells.every((fc) => {
                        if (fc === c) return false;
                        return ROW_OF[fc] === ROW_OF[c] || COL_OF[fc] === COL_OF[c] || BOX_OF[fc] === BOX_OF[c];
                      });
                      if (seesAllFins) eliminations.push({ cell: c, digit: d });
                    }
                  }

                  if (eliminations.length === 0) continue;

                  const hasBoxInBases = frankenBases.some((fb) => fb.type === 'box');
                  const hasBoxInCovers = coverHouses.some((ch) => ch.type === 'box');

                  const isMutant = hasBoxInBases && hasBoxInCovers;
                  const isFranken = (hasBoxInBases || hasBoxInCovers) && !isMutant;

                  if (!isFranken && !isMutant) continue;

                  const nameZh = isMutant ? '变异鱼' : '弗兰肯鱼';
                  const nameEn = isMutant ? 'Mutant Fish' : 'Franken Fish';
                  const strategyId = isMutant ? 'mutant-fish' : 'franken-fish';

                  const step: Step = {
                    strategyId,
                    placements: [],
                    eliminations,
                    highlights: {
                      cells: [...new Set([...baseCells, ...allFinCells, ...eliminations.map((e) => e.cell)])],
                      candidates: [
                        ...baseCells.map((c) => ({ cell: c, digit: d })),
                        ...allFinCells.map((c) => ({ cell: c, digit: d })),
                        ...eliminations,
                      ],
                      links: [],
                    },
                    explanation: {
                      zh: `数字 ${d}：${nameZh}，鳍在 B${[...finBoxes][0]! + 1}；消除覆盖集中同时见鳍的 ${d}。`,
                      en: `Digit ${d}: ${nameEn}, fin in box ${[...finBoxes][0]! + 1}; eliminate ${d} from cover cells seeing fin.`,
                    },
                  };

                  return { step, isMutant };
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
}

export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '弗兰肯鱼', en: 'Franken Fish' },
  difficulty: 1080,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const result = tryFrankenMutantFish(grid, d);
      if (result && !result.isMutant) return result.step;
    }
    return null;
  },
};

export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '变异鱼', en: 'Mutant Fish' },
  difficulty: 1090,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const result = tryFrankenMutantFish(grid, d);
      if (result && result.isMutant) return result.step;
    }
    return null;
  },
};