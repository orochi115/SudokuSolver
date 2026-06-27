import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FISH_NAMES: Record<number, { zh: string; en: string }> = {
  2: { zh: 'X翼', en: 'X-Wing' },
  3: { zh: '剑鱼', en: 'Swordfish' },
  4: { zh: '水母', en: 'Jellyfish' },
};

/** Generate all size-k combinations from [0..n-1]. */
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

function tryFinnedFish(
  grid: Grid,
  d: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  baseAxis: 'row' | 'col',
  size: number,
): { eliminations: { cell: number; digit: number }[]; baseCells: number[]; finCells: number[]; baseIndices: number[]; coverIndices: number[] } | null {
  const bit = maskOf(d);

  // Get eligible base indices that contain at least one candidate d
  const eligibleBases: number[] = [];
  for (let i = 0; i < 9; i++) {
    const hasCandidate = baseHouses[i]!.some(cell => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (hasCandidate) {
      eligibleBases.push(i);
    }
  }

  if (eligibleBases.length < size) return null;

  // Let's iterate over all combinations of size base houses
  for (const baseCombo of combineIndices(eligibleBases.length, size)) {
    const baseIndices = baseCombo.map(i => eligibleBases[i]!);

    // Collect all candidate cells in these base houses
    const baseCells: number[] = [];
    for (const bi of baseIndices) {
      for (const cell of baseHouses[bi]!) {
        if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
          baseCells.push(cell);
        }
      }
    }

    // Now, iterate over all combinations of size cover houses (out of 9)
    for (const coverCombo of combineIndices(9, size)) {
      const coverIndices = coverCombo;

      // Identify inside and outside cells
      const insideCells: number[] = [];
      const finCells: number[] = [];

      for (const cell of baseCells) {
        const coverCoord = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (coverIndices.includes(coverCoord)) {
          insideCells.push(cell);
        } else {
          finCells.push(cell);
        }
      }

      // 1. Must have a fin
      if (finCells.length === 0) continue;

      // 2. All fin cells must lie in a single box
      const finBoxes = new Set(finCells.map(c => BOX_OF[c]!));
      if (finBoxes.size !== 1) continue;
      const finBox = [...finBoxes][0]!;

      // 3. Check reduced fish validity:
      // Every chosen base house must contain at least one inside cell
      const baseValid = baseIndices.every(bi => {
        return insideCells.some(cell => {
          const baseCoord = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          return baseCoord === bi;
        });
      });
      if (!baseValid) continue;

      // Every chosen cover house must contain at least one inside cell
      const coverValid = coverIndices.every(ci => {
        return insideCells.some(cell => {
          const coverCoord = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
          return coverCoord === ci;
        });
      });
      if (!coverValid) continue;

      // 4. Find candidates in cover houses not in chosen base houses
      const plainTargets: number[] = [];
      for (const ci of coverIndices) {
        for (const cell of coverHouses[ci]!) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0) {
            const bi = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
            if (!baseIndices.includes(bi)) {
              plainTargets.push(cell);
            }
          }
        }
      }

      // 5. Filter plain targets: must see ALL fin cells
      const elimCells = plainTargets.filter(target => {
        return finCells.every(fin => {
          if (target === fin) return false;
          return (
            ROW_OF[target]! === ROW_OF[fin]! ||
            COL_OF[target]! === COL_OF[fin]! ||
            BOX_OF[target]! === BOX_OF[fin]!
          );
        });
      });

      if (elimCells.length === 0) continue;

      const eliminations = elimCells.map(cell => ({ cell, digit: d }));

      return {
        eliminations,
        baseCells,
        finCells,
        baseIndices,
        coverIndices,
      };
    }
  }

  return null;
}

function makeFinnedFishStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: {
      zh: `鳍鱼/寿司鱼 ${FISH_NAMES[size]!.zh}`,
      en: `Finned/Sashimi ${FISH_NAMES[size]!.en}`,
    },
    difficulty,
    tieBreak: ['digit'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        // Base = rows, cover = columns
        const step = tryFinnedFish(grid, d, ROWS, COLS, 'row', size);
        if (step) {
          const { eliminations, baseCells, finCells, baseIndices, coverIndices } = step;
          const baseNums = baseIndices.map((i) => i + 1).join(', ');
          const coverNums = coverIndices.map((i) => i + 1).join(', ');
          const baseAxisLabel = '行';
          const names = FISH_NAMES[size]!;
          return {
            strategyId: id,
            placements: [],
            eliminations,
            highlights: {
              cells: [...new Set([...baseCells, ...eliminations.map((e) => e.cell)])],
              candidates: [
                ...baseCells.map((c) => ({ cell: c, digit: d })),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在第 ${baseNums} 行（基础集）的候选数除了包含位于一个宫内的鳍之外，其余恰好覆盖了 ${size} 个列（${coverNums}号，覆盖集），构成鳍鱼/寿司鱼 ${names.zh}；可消去同时能看到所有鳍的覆盖格中的候选数。`,
              en: `Digit ${d}'s candidates in rows ${baseNums} (base) fit in exactly ${size} cover columns (${coverNums}) except for a fin confined to one box, forming a Finned/Sashimi ${names.en}; eliminate ${d} from cover cells that see all fin cells.`,
            },
          };
        }

        // Base = columns, cover = rows
        const step2 = tryFinnedFish(grid, d, COLS, ROWS, 'col', size);
        if (step2) {
          const { eliminations, baseCells, finCells, baseIndices, coverIndices } = step2;
          const baseNums = baseIndices.map((i) => i + 1).join(', ');
          const coverNums = coverIndices.map((i) => i + 1).join(', ');
          const baseAxisLabel = '列';
          const names = FISH_NAMES[size]!;
          return {
            strategyId: id,
            placements: [],
            eliminations,
            highlights: {
              cells: [...new Set([...baseCells, ...eliminations.map((e) => e.cell)])],
              candidates: [
                ...baseCells.map((c) => ({ cell: c, digit: d })),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `数字 ${d} 在第 ${baseNums} 列（基础集）的候选数除了包含位于一个宫内的鳍之外，其余恰好覆盖了 ${size} 个行（${coverNums}号，覆盖集），构成鳍鱼/寿司鱼 ${names.zh}；可消去同时能看到所有鳍的覆盖格中的候选数。`,
              en: `Digit ${d}'s candidates in columns ${baseNums} (base) fit in exactly ${size} cover rows (${coverNums}) except for a fin confined to one box, forming a Finned/Sashimi ${names.en}; eliminate ${d} from cover cells that see all fin cells.`,
            },
          };
        }
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFishStrategy(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFishStrategy(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFishStrategy(4, 'finned-jellyfish', 495);
