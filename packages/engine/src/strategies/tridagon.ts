/**
 * Tridagon / Anti-Tridagon (P1) — 三值死环
 * Owner: exotic
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const BOXES = [0,1,2,3,4,5,6,7,8].map(b => {
  const r0 = Math.floor(b/3)*3, c0 = (b%3)*3;
  const cells: number[] = [];
  for (let dr=0;dr<3;dr++) for (let dc=0;dc<3;dc++) cells.push((r0+dr)*9 + c0+dc);
  return cells;
});

function getBoxOf(cell: number): number { return BOX_OF[cell]!; }

function findTransversalsInBox(grid: Grid, boxCells: number[], dmask: number): number[][] {
  // return arrays of 3 cells, different row/col in box, union cand == dmask exactly 3 bits
  const res: number[][] = [];
  // choose 3 cells with distinct rows/cols in box
  const byRowInBox: Record<number, number[]> = {};
  const byColInBox: Record<number, number[]> = {};
  for (const c of boxCells) {
    if (grid.get(c) !== 0) continue;
    const lr = ROW_OF[c]! % 3, lc = COL_OF[c]! % 3;
    (byRowInBox[lr] ??= []).push(c);
    (byColInBox[lc] ??= []).push(c);
  }
  // simple enumeration of possible 3
  const cells = boxCells.filter((c)=>grid.get(c)===0);
  for (let i=0; i<cells.length; i++) for (let j=i+1;j<cells.length;j++) for (let k=j+1;k<cells.length;k++) {
    const trip = [cells[i]!,cells[j]!,cells[k]!];
    const rows = new Set(trip.map(c=> ROW_OF[c]!));
    const cols = new Set(trip.map(c=> COL_OF[c]!));
    if (rows.size !== 3 || cols.size !== 3) continue;
    let m = 0;
    for (const c of trip) m |= grid.candidatesOf(c);
    if (popcount(m) === 3 && (m & dmask) === m && popcount(dmask)===3) {
      res.push(trip);
    }
  }
  return res;
}

function tryTridagon(grid: Grid, strategyId: string): Step | null {
  // Bands 0,1,2 ; choose 2 bands, 2 stacks => 4 boxes
  for (let band1=0; band1<3; band1++) for (let band2=band1+1; band2<3; band2++) {
    for (let stk1=0; stk1<3; stk1++) for (let stk2=stk1+1; stk2<3; stk2++) {
      const b11 = band1*3 + stk1, b12=band1*3+stk2, b21=band2*3+stk1, b22=band2*3+stk2;
      const boxes = [b11,b12,b21,b22].map(bi => BOXES[bi]!);
      // Try all 3-digit sets
      for (let d1=1;d1<=7;d1++) for (let d2=d1+1;d2<=8;d2++) for (let d3=d2+1;d3<=9;d3++) {
        const dmask = maskOf(d1)|maskOf(d2)|maskOf(d3);
        // find one transversal per box
        const trans: number[][] = [];
        let good = true;
        for (const bx of boxes) {
          const ts = findTransversalsInBox(grid, bx, dmask);
          if (ts.length === 0) { good=false; break; }
          trans.push(ts[0]!); // take first; could search more but for speed
        }
        if (!good) continue;
        // Collect all 12, count pure vs guardians
        const all = trans.flat();
        const guardians: {cell:number; extra:number[]}[] = [];
        for (const c of all) {
          const m = grid.candidatesOf(c);
          const extraBits = m & ~dmask;
          if (extraBits) {
            guardians.push({cell:c, extra: digitsOf(extraBits)});
          }
        }
        if (guardians.length === 0) continue; // no guardian, impossible already? skip
        if (guardians.length === 1) {
          // Type 1: elim the 3 D from the guardian cell
          const g = guardians[0]!;
          const elims = [d1,d2,d3].filter((dd)=> grid.hasCandidate(g.cell, dd)).map((dd)=>({cell:g.cell, digit:dd}));
          if (elims.length > 0) {
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: { cells: all, candidates: all.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d=>({cell:c,digit:d}))), links: [] },
              explanation: { zh: `三值死环 Tridagon：守护格消去 {${d1},${d2},${d3}}`, en: `Tridagon: eliminate ${d1},${d2},${d3} from guardian cell` },
            };
          }
        } else {
          // multi guardian: look for same extra digit g, cell outside seeing all g-guardians
          const byG: Record<number, number[]> = {};
          for (const gg of guardians) for (const e of gg.extra) {
            (byG[e] ??= []).push(gg.cell);
          }
          for (const [gstr, gcells] of Object.entries(byG)) {
            const g = Number(gstr);
            if (gcells.length < 1) continue;
            for (let z=0; z<CELLS; z++) {
              if (grid.get(z) !== 0 || !grid.hasCandidate(z, g)) continue;
              if (gcells.includes(z)) continue;
              if (gcells.every((gc) => PEERS_OF[z]!.includes(gc))) {
                return {
                  strategyId, placements:[], eliminations:[{cell:z, digit:g}],
                  highlights: {cells: [...all, z], candidates: [{cell:z,digit:g}], links:[] },
                  explanation: {zh:`Tridagon 多守护：消 ${g}`, en:`Tridagon multi-guardian elim ${g}`},
                };
              }
            }
          }
        }
      }
    }
  }
  return null;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    return null;
  },
};
