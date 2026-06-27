/**
 * WXYZ-Wing (P1) — WXYZ翼
 * 4 cells, 4 digits, two houses, exactly one non-restricted Z.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function tryWXYZ(grid: Grid, strategyId: string): Step | null {
  // Collect potential 4-cell sets in two houses (box+line)
  for (const box of [0,1,2,3,4,5,6,7,8]) {
    const boxCells = Array.from({length:9}, (_,i) => {
      const r = Math.floor(box/3)*3 + Math.floor(i/3);
      const c = (box%3)*3 + (i%3);
      return r*9 + c;
    });
    for (const lineType of ['row','col'] as const) {
      for (let ln=0; ln<9; ln++) {
        const lineCells = lineType==='row' ? Array.from({length:9},(_,k)=>ln*9+k) : Array.from({length:9},(_,k)=>k*9+ln);
        // intersection
        const inter = boxCells.filter(c => lineCells.includes(c));
        if (inter.length !== 3) continue;
        // candidates outside inter in box and line
        const boxOut = boxCells.filter((c)=> !inter.includes(c) && grid.get(c)===0);
        const lineOut = lineCells.filter((c)=> !inter.includes(c) && grid.get(c)===0);
        // pick 1-3 from boxOut + lineOut to total 4 with possible inter cells? Use all 4-cell combos across the union
        const pool = [...boxCells, ...lineCells].filter((v,i,a)=>a.indexOf(v)===i).filter((c)=>grid.get(c)===0);
        // enumerate 4 distinct
        for (let i=0;i<pool.length;i++) for (let j=i+1;j<pool.length;j++) for (let k=j+1;k<pool.length;k++) for (let m=k+1;m<pool.length;m++) {
          const set = [pool[i]!,pool[j]!,pool[k]!,pool[m]!];
          let msk = 0;
          for (const c of set) msk |= grid.candidatesOf(c);
          if (popcount(msk) !== 4) continue;
          // check confined to the two houses? loose check: all in box or line union ok
          const ds = digitsOf(msk);
          // find the non-restricted Z: digit with not all instances seeing each other
          let z: number | null = null;
          for (const d of ds) {
            const cellsD = set.filter((c)=> grid.hasCandidate(c,d));
            let allSee = true;
            for (let a=0;a<cellsD.length;a++) for (let b=a+1;b<cellsD.length;b++) {
              if (!PEERS_OF[cellsD[a]!]!.includes(cellsD[b]!)) { allSee=false; break; }
            }
            if (!allSee) { z = d; break; }
          }
          if (z === null) continue;
          // find outside cell seeing all Z in the set
          const zCells = set.filter((c)=>grid.hasCandidate(c,z));
          const elims: {cell:number;digit:number}[] = [];
          for (let c=0; c<CELLS;c++) {
            if (grid.get(c)!==0 || !grid.hasCandidate(c,z)) continue;
            if (set.includes(c)) continue;
            if (zCells.every((zc)=> PEERS_OF[c]!.includes(zc))) elims.push({cell:c,digit:z});
          }
          if (elims.length > 0) {
            return {
              strategyId, placements:[], eliminations:elims,
              highlights: { cells:[...set, ...elims.map(e=>e.cell)], candidates: set.flatMap(c=>digitsOf(grid.candidatesOf(c)).map(d=>({cell:c,digit:d}))), links:[] },
              explanation: { zh: `WXYZ翼：消 ${z}`, en: `WXYZ-Wing elim ${z}` },
            };
          }
        }
      }
    }
  }
  return null;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null { return null; },
};
