/**
 * Broken Wing (P1) — 断翼 / 守护者
 * Single digit odd loop of strong links + guardians.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF,
  maskOf, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function peers(a:number,b:number): boolean { /* use HOUSE share */ return ROW_OF[a]===ROW_OF[b] || COL_OF[a]===COL_OF[b] || ((Math.floor(a/27)===Math.floor(b/27)) && (Math.floor((a%9)/3)===Math.floor((b%9)/3))); } // rough

function tryBrokenWing(grid: Grid, strategyId: string): Step | null {
  for (let d=1; d<=9; d++) {
    const bit = maskOf(d);
    const cands: number[] = [];
    for (let c=0;c<CELLS;c++) if (grid.get(c)===0 && (grid.candidatesOf(c)&bit)) cands.push(c);
    // Build possible odd cycle of length 5+ using strong-link houses
    // Simplified: look for odd-length candidate cycles via houses
    // For practicality, find houses with >=3 d-cands (imperfect) and link via strong elsewhere
    // Heuristic: find 5-cell oddagons with 4 strong
    for (let i=0; i<cands.length; i++) {
      // very limited search
      for (let j=i+1; j<cands.length && j<i+12; j++) {
        for (let k=j+1; k<cands.length && k<j+12; k++) {
          for (let m=k+1; m<cands.length && m<k+12; m++) {
            for (let n=m+1; n<cands.length && n<m+12; n++) {
              const loop = [cands[i]!,cands[j]!,cands[k]!,cands[m]!,cands[n]!];
              // check consecutive peer and close
              let strongCount = 0;
              let impCells: number[] = [];
              const checkLink = (a:number,b:number) => {
                let cnt = 0;
                for (const h of HOUSES) if (h.includes(a) && h.includes(b)) {
                  cnt = h.filter((c)=>grid.get(c)===0 && (grid.candidatesOf(c)&bit)).length;
                }
                return cnt;
              };
              let valid = true;
              for (let p=0; p<5; p++) {
                const a = loop[p]!, b = loop[(p+1)%5]!;
                if (! (ROW_OF[a]===ROW_OF[b] || COL_OF[a]===COL_OF[b] || Math.floor(a/9/3)===Math.floor(b/9/3) && Math.floor((a%9)/3)===Math.floor((b%9)/3)) ) { valid=false; break; }
                const cnt = checkLink(a,b) || 3; // default imperfect
                if (cnt === 2) strongCount++;
                else impCells.push(... (HOUSES.find(h=>h.includes(a)&&h.includes(b))||[]).filter((c)=> grid.get(c)===0 && (grid.candidatesOf(c)&bit) && c!==a && c!==b ));
              }
              if (!valid || strongCount === 5) continue; // even/closed or full strong not broken
              // guardians = impCells dedup
              const G = Array.from(new Set(impCells));
              if (G.length === 0) continue;
              if (G.length === 1) {
                // placement
                return { strategyId, placements: [{cell:G[0]!, digit:d}], eliminations: [], highlights: {cells: [...loop, G[0]!], candidates:[{cell:G[0]!,digit:d}], links:[]}, explanation: {zh:'断翼放置',en:'Broken wing place'} };
              }
              // elim from common see all G
              const elims: any[] = [];
              for (let z=0;z<CELLS;z++) if (grid.get(z)===0 && (grid.candidatesOf(z)&bit) && !G.includes(z) && !loop.includes(z)) {
                if (G.every((g)=> PEERS_OF[z]!.includes(g))) elims.push({cell:z,digit:d});
              }
              if (elims.length) return { strategyId, placements:[], eliminations:elims, highlights:{cells:[...loop,...G,...elims.map(e=>e.cell)], candidates:elims, links:[]}, explanation:{zh:'断翼消',en:'Broken wing elim'} };
            }
          }
        }
      }
    }
  }
  return null;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null { return null; },
};
