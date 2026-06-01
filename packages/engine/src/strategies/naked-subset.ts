import { HOUSES, SIZE, ROW_OF, COL_OF, popcount, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const SUBSET_MAX = 4;

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 25,

  apply(grid: Grid): Step | null {
    for (let hi = 0; hi < HOUSES.length; hi++) {
      const house = HOUSES[hi]!;
      const unsolved = house.filter((c) => grid.get(c) === 0);

      for (let size = 2; size <= SUBSET_MAX; size++) {
        const combos = combinations(unsolved, size);
        for (const combo of combos) {
          let unionMask = 0;
          for (const c of combo) unionMask |= grid.candidatesOf(c);
          if (popcount(unionMask) !== size) continue;

          const elims: { cell: number; digit: number }[] = [];
          const elimDigits = digitsOf(unionMask);
          for (const c of unsolved) {
            if (combo.includes(c)) continue;
            const cm = grid.candidatesOf(c);
            for (const d of elimDigits) {
              if (cm & maskOf(d)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;

          const r = ROW_OF[combo[0]!]! + 1;
          const c = COL_OF[combo[0]!]! + 1;
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
            highlights: { cells: combo, candidates: combo.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))), links: [] },
            explanation: {
              zh: `${combo.length} 个格（包含 R${r}C${c} 等）共有 ${size} 个候选数，构成显性${zhSize}，从同单元其他格中排除这些候选数。`,
              en: `${combo.length} cells (including R${r}C${c}) contain only ${size} candidates (Naked ${enSize}), eliminating them from other cells in the house.`,
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