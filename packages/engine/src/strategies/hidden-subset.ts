import { HOUSES, SIZE, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_MAX = 4;

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    for (let hi = 0; hi < HOUSES.length; hi++) {
      const house = HOUSES[hi]!;
      const unsolved = house.filter((c) => grid.get(c) === 0);

      for (let size = 2; size <= SUBSET_MAX; size++) {
        const digitCombos = combinations([1, 2, 3, 4, 5, 6, 7, 8, 9], size);
        for (const digitCombo of digitCombos) {
          const candidateCellSet = new Set<number>();
          const digitAppears = new Array<boolean>(SIZE + 1).fill(false);
          for (const c of unsolved) {
            const cm = grid.candidatesOf(c);
            let hasAny = false;
            for (const d of digitCombo) {
              if (cm & maskOf(d)) {
                digitAppears[d] = true;
                hasAny = true;
              }
            }
            if (hasAny) candidateCellSet.add(c);
          }
          const candidateCells = [...candidateCellSet];
          if (candidateCells.length !== size) continue;
          if (!digitCombo.every((d) => digitAppears[d])) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (const c of candidateCells) {
            const cm = grid.candidatesOf(c);
            const allDigits = digitsOf(cm);
            for (const ad of allDigits) {
              if (!digitCombo.includes(ad)) elims.push({ cell: c, digit: ad });
            }
          }
          if (elims.length === 0) continue;

          const r = ROW_OF[candidateCells[0]!]! + 1;
          const c = COL_OF[candidateCells[0]!]! + 1;
          const sizeNames: Record<number, [string, string]> = {
            2: ['数对', 'Pair'],
            3: ['三数组', 'Triple'],
            4: ['四数组', 'Quad'],
          };
          const [zhSize, enSize] = sizeNames[size]!;
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: candidateCells,
              candidates: candidateCells.flatMap((cell) =>
                digitCombo.filter((d) => grid.hasCandidate(cell, d)).map((digit) => ({ cell, digit }))
              ),
              links: [],
            },
            explanation: {
              zh: `数字 ${digitCombo.join(',')} 在同单元中仅出现在 ${candidateCells.length} 个格中（包含 R${r}C${c}），构成隐性${zhSize}，从这些格中排除其他候选数。`,
              en: `Digits ${digitCombo.join(',')} appear only in ${candidateCells.length} cells (including R${r}C${c}) as a Hidden ${enSize}, removing other candidates from those cells.`,
            },
          };
        }
      }
    }
    return null;
  },
};

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