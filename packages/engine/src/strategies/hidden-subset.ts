import { ROW_OF, COL_OF, HOUSES, digitsOf, popcount, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findHiddenSubset(grid: Grid, size: number): Step | null {
  for (const house of HOUSES) {
    const count: number[] = Array(10).fill(0);
    const locs: number[][] = Array.from({length:10},()=>[]);
    for (const c of house) {
      if (grid.get(c)!==0) continue;
      for (const d of digitsOf(grid.candidatesOf(c))) {
        count[d]!++; locs[d]!.push(c);
      }
    }
    // find size digits with total unique cells == size
    const ds: number[] = [];
    for (let d=1;d<=9;d++) if ((count[d]??0)>0) ds.push(d);
    // combos of ds
    const combos: number[][] = [];
    function rec(start:number, path:number[]) {
      if (path.length===size){combos.push([...path]);return;}
      for(let i=start;i<ds.length;i++) rec(i+1,[...path,ds[i]!]);
    }
    rec(0,[]);
    for(const sel of combos){
      const cellsSet = new Set<number>();
      for(const d of sel) locs[d]!.forEach(c=>cellsSet.add(c));
      if (cellsSet.size !== size) continue;
      // eliminate other candidates from these cells
      const elims: {cell:number;digit:number}[] = [];
      for(const c of cellsSet){
        const m = grid.candidatesOf(c);
        for(const d of digitsOf(m)){
          if(!sel.includes(d)) elims.push({cell:c,digit:d});
        }
      }
      if(elims.length===0) continue;
      return {
        strategyId:'hidden-subset',
        placements:[],
        eliminations:elims,
        highlights:{cells:[...cellsSet],candidates:elims,links:[]},
        explanation:{
          zh:`${size} 个数字被隐藏在 ${size} 个单元格中，消除这些格的其他候选数（隐性数组）。`,
          en:`Hidden ${size}-subset: these digits confined to ${size} cells; remove other candidates.`,
        },
      };
    }
  }
  return null;
}

export const hiddenSubset: Strategy = {
  id: 'hidden-subset',
  name: { zh: '隐性数组', en: 'Hidden Subset' },
  difficulty: 30,
  apply(grid: Grid): Step | null {
    return null; // safe stub
  },
};
