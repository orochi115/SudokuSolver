import { ROWS, COLS, CELLS, SIZE, ROW_OF, COL_OF, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xWing: Strategy = fishStrategy('x-wing', 'X-Wing', 'X翼', 2);
export const swordfish: Strategy = fishStrategy('swordfish', 'Swordfish', '剑鱼', 3);
export const jellyfish: Strategy = fishStrategy('jellyfish', 'Jellyfish', '水母', 4);

function fishStrategy(id: string, enName: string, zhName: string, size: number): Strategy {
  return {
    id,
    name: { zh: zhName, en: enName },
    difficulty: 40 + (size - 2) * 5,

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= SIZE; d++) {
        const bit = maskOf(d);

        const result = findFish(grid, d, bit, size, ROWS, COLS, true, id, zhName);
        if (result) return result;
        const result2 = findFish(grid, d, bit, size, COLS, ROWS, false, id, zhName);
        if (result2) return result2;
      }
      return null;
    },
  };
}

function findFish(
  grid: Grid,
  digit: number,
  bit: number,
  fishSize: number,
  baseSets: readonly (readonly number[])[],
  coverSets: readonly (readonly number[])[],
  baseIsRow: boolean,
  strategyId: string,
  zhName: string,
): Step | null {
  const lineCount = 9;

  const baseIndices: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    const line = baseSets[i]!;
    let count = 0;
    for (const c of line) {
      if (grid.get(c) !== 0) continue;
      if (grid.candidatesOf(c) & bit) count++;
    }
    if (count >= 2 && count <= fishSize) baseIndices.push(i);
  }

  if (baseIndices.length < fishSize) return null;

  const combos = combinations(baseIndices, fishSize);
  for (const combo of combos) {
    const coverUsed = new Set<number>();
    for (const bi of combo) {
      const line = baseSets[bi]!;
      for (const c of line) {
        if (grid.get(c) !== 0) continue;
        if (grid.candidatesOf(c) & bit) {
          const ci = baseIsRow ? COL_OF[c]! : ROW_OF[c]!;
          coverUsed.add(ci);
        }
      }
    }
    if (coverUsed.size !== fishSize) continue;

    const elims: { cell: number; digit: number }[] = [];
    const patternCells: number[] = [];
    for (const ci of coverUsed) {
      const coverLine = coverSets[ci]!;
      for (const c of coverLine) {
        if (grid.get(c) !== 0) continue;
        if (grid.candidatesOf(c) & bit) {
          const inBase = combo.some((bi) => baseSets[bi]!.includes(c));
          if (!inBase) elims.push({ cell: c, digit });
          else patternCells.push(c);
        }
      }
    }
    if (elims.length === 0) continue;

    const patternCands = patternCells.map((c) => ({ cell: c, digit }));
    const r = ROW_OF[patternCells[0]!]! + 1;
    const c = COL_OF[patternCells[0]!]! + 1;
    const fishName = ['', '', 'X-Wing', 'Swordfish', 'Jellyfish'][fishSize]!;
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: { cells: patternCells, candidates: patternCands, links: [] },
      explanation: {
        zh: `数字 ${digit} 在 ${fishSize} 个${baseIsRow ? '行' : '列'}中的候选恰好被 ${fishSize} 个${baseIsRow ? '列' : '行'}覆盖（包含 R${r}C${c}），构成${zhName}，从覆盖集非基础格中排除 ${digit}。`,
        en: `Digit ${digit} in ${fishSize} ${baseIsRow ? 'rows' : 'cols'} is covered by ${fishSize} ${baseIsRow ? 'cols' : 'rows'} (including R${r}C${c}), forming ${fishName}. Eliminate ${digit} from cover cells outside base.`,
      },
    };
  }
  return null;
}

function combinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  function helper(start: number, chosen: number[]) {
    if (chosen.length === k) {
      result.push([...chosen]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]!);
      helper(i + 1, chosen);
      chosen.pop();
    }
  }
  helper(0, []);
  return result;
}