import { ROW_OF, COL_OF, HOUSES, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findNakedSubset(grid: Grid, size: number): Step | null {
  for (const house of HOUSES) {
    const empties = house.filter(c => grid.get(c) === 0);
    if (empties.length < size) continue;
    // simple O(n^size) for size<=4 on 9 cells ok for engine
    const combos: number[][] = [];
    function rec(start: number, path: number[]) {
      if (path.length === size) { combos.push([...path]); return; }
      for (let i=start; i<empties.length; i++) rec(i+1, [...path, empties[i]!]);
    }
    rec(0, []);
    for (const cells of combos) {
      let union = 0;
      for (const c of cells) union |= grid.candidatesOf(c);
      if (popcount(union) !== size) continue;
      // found naked subset: eliminate union from other cells in house
      const elims: {cell:number;digit:number}[] = [];
      for (const c of empties) {
        if (cells.includes(c)) continue;
        const m = grid.candidatesOf(c);
        for (const d of digitsOf(m & union)) elims.push({cell:c, digit:d});
      }
      if (elims.length === 0) continue;
      return {
        strategyId: 'naked-subset',
        placements: [],
        eliminations: elims,
        highlights: { cells, candidates: cells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(d=>({cell,digit:d}))), links: [] },
        explanation: {
          zh: `${size} 个单元格形成显性 ${size} 数组，消除同行/列/宫其他位置的这些候选数。`,
          en: `Naked ${size}-subset found; eliminate these candidates from peers in the house.`,
        },
      };
    }
  }
  return null;
}

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,
  apply(grid: Grid): Step | null {
    return null; // safe stub
  },
};
