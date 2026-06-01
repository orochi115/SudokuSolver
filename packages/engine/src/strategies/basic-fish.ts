import { COLS, ROWS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';
import { combinations } from './_common.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      for (const size of [2, 3, 4] as const) {
        const rowFish = findFish(grid, digit, size, 'row', this.id);
        if (rowFish) return rowFish;

        const colFish = findFish(grid, digit, size, 'col', this.id);
        if (colFish) return colFish;
      }
    }
    return null;
  },
};

function findFish(
  grid: Grid,
  digit: number,
  size: 2 | 3 | 4,
  orientation: 'row' | 'col',
  strategyId: string,
): Step | null {
  const bases = orientation === 'row' ? ROWS : COLS;
  const covers = orientation === 'row' ? COLS : ROWS;

  const eligibleBaseIndexes = [...Array(9).keys()].filter((i) => {
    const cands = bases[i]!.filter((cell) => grid.hasCandidate(cell, digit));
    return cands.length >= 2 && cands.length <= size;
  });

  if (eligibleBaseIndexes.length < size) return null;

  for (const baseCombo of combinations(eligibleBaseIndexes, size)) {
    const coverSet = new Set<number>();
    const fishCells: number[] = [];

    for (const b of baseCombo) {
      const rowOrColCells = bases[b]!.filter((cell) => grid.hasCandidate(cell, digit));
      for (const cell of rowOrColCells) {
        fishCells.push(cell);
        coverSet.add(orientation === 'row' ? cell % 9 : Math.floor(cell / 9));
      }
    }

    if (coverSet.size !== size) continue;

    const coversChosen = [...coverSet];
    const baseSet = new Set(baseCombo);
    const eliminations = coversChosen.flatMap((coverIndex) => {
      return covers[coverIndex]!
        .filter((cell) => {
          const baseIndex = orientation === 'row' ? Math.floor(cell / 9) : cell % 9;
          return !baseSet.has(baseIndex) && grid.hasCandidate(cell, digit);
        })
        .map((cell) => ({ cell, digit }));
    });

    if (eliminations.length === 0) continue;
    const fishName = size === 2 ? 'X-Wing' : size === 3 ? 'Swordfish' : 'Jellyfish';
    const baseLabel = orientation === 'row' ? 'rows' : 'columns';
    const coverLabel = orientation === 'row' ? 'columns' : 'rows';

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: fishCells,
        candidates: fishCells.map((cell) => ({ cell, digit })),
        links: [],
      },
      explanation: {
        zh: `数字 ${digit} 构成 ${fishName}（${baseLabel} 与 ${coverLabel} 的 base/cover 模型），可从 cover 上其它位置删除 ${digit}。`,
        en: `Digit ${digit} forms a ${fishName} (base/cover model on ${baseLabel} and ${coverLabel}); remove ${digit} from other cover cells.`,
      },
    };
  }

  return null;
}
