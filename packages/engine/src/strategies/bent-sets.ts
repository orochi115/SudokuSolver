/**
 * Bent Sets / Almost Locked Pair/Triple (P1)
 */

import {
  CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function tryBent(grid: Grid, strategyId: string): Step | null {
  // For each box and crossing line
  for (let b=0; b<9; b++) {
    const br = Math.floor(b/3)*3, bc = (b%3)*3;
    const boxC = [] as number[];
    for (let i=0;i<9;i++) boxC.push( (br + Math.floor(i/3))*9 + bc + (i%3) );
    for (let r=br; r<br+3; r++) {
      const line = Array.from({length:9}, (_,k)=> r*9 +k );
      const inter = boxC.filter(c=>line.includes(c));
      const boxOut = boxC.filter(c=>!inter.includes(c) && grid.get(c)===0);
      const lineOut = line.filter(c=>!inter.includes(c) && grid.get(c)===0);
      // Try ALP / ALT: find same S size |S|-1 cells
      for (let sz=2; sz<=3; sz++) {
        // simple: look for |boxOut|>=sz-? pick sets of sz-1 from each
        if (boxOut.length < sz-1 || lineOut.length < sz-1) continue;
        // enumerate small sets
        // For sz=2: 1 cell each
        if (sz===2) {
          for (const bo of boxOut) for (const lo of lineOut) {
            const m = grid.candidatesOf(bo) | grid.candidatesOf(lo);
            if (popcount(m) !== 2) continue;
            // elim from common peers outside
            const ds = digitsOf(m);
            const elims: any[] = [];
            for (let c=0;c<CELLS;c++) if (grid.get(c)===0) {
              if ([bo,lo].includes(c)) continue;
              if (ds.some((d)=>grid.hasCandidate(c,d)) && PEERS_OF[c]!.includes(bo) && PEERS_OF[c]!.includes(lo)) {
                for (const d of ds) if (grid.hasCandidate(c,d)) elims.push({cell:c,digit:d});
              }
            }
            if (elims.length) {
              return { strategyId, placements:[], eliminations:elims, highlights:{cells:[bo,lo],candidates:[],links:[]}, explanation:{zh:'弯曲集 ALP',en:'Bent ALP'} };
            }
          }
        }
      }
    }
  }
  return null;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null { return null; },
};
