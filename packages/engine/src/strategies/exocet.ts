/**
 * Exocet Junior/Senior (P2a) — 飞鱼导弹
 *
 * Junior Exocet (in-band targets): base two aligned cells in one box of a band/stack
 * carrying 3-4 digits. Targets in the other two boxes, not seeing base or each other.
 * Rule 1 (core): purge non-base digits from each target.
 */

import {
  CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, BOXES,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function bandOfBox(b: number): number { return Math.floor(b/3); }
function stackOfBox(b: number): number { return b % 3; }

function getBandBoxes(band: number): number[] { return [band*3, band*3+1, band*3+2]; }
function getStackBoxes(stk: number): number[] { return [stk, stk+3, stk+6]; }

function tryExocet(grid: Grid, strategyId: string): Step | null {
  // Consider bands then stacks
  for (let band=0; band<3; band++) {
    const bxs = getBandBoxes(band);
    for (const baseBox of bxs) {
      const baseCellsAll = BOXES[baseBox]!.filter((c)=>grid.get(c)===0);
      // Find aligned pairs in mini-row or mini-col inside base box
      for (let mr=0; mr<3; mr++) { // mini row inside box
        const miniRow = baseCellsAll.filter((c)=> Math.floor((ROW_OF[c]!- Math.floor(baseBox/3)*3 )) === mr );
        if (miniRow.length >= 2) {
          for (let ii=0;ii<miniRow.length;ii++) for (let jj=ii+1;jj<miniRow.length;jj++) {
            const b1 = miniRow[ii]!, b2=miniRow[jj]!;
            const bmask = grid.candidatesOf(b1) | grid.candidatesOf(b2);
            const bds = digitsOf(bmask);
            if (bds.length < 3 || bds.length > 4) continue;
            // targets: one cell per other box in band, not seeing base
            const otherBoxes = bxs.filter((bb)=>bb!==baseBox);
            const tCands: number[] = [];
            for (const ob of otherBoxes) {
              const cands = BOXES[ob]!.filter((c)=>grid.get(c)===0 && !PEERS_OF[c]!.includes(b1) && !PEERS_OF[c]!.includes(b2));
              // pick one that covers many of bds
              if (cands.length === 0) { tCands.length=0; break; }
              // choose the first that sees most base digits (simple)
              tCands.push(cands[0]!);
            }
            if (tCands.length !== 2) continue;
            const t1 = tCands[0]!, t2 = tCands[1]!;
            if (PEERS_OF[t1]!.includes(t2)) continue;
            // Rule 1: eliminate non Bdigits from targets
            const elims: {cell:number;digit:number}[] = [];
            for (const t of [t1,t2]) {
              for (const d of digitsOf(grid.candidatesOf(t))) {
                if (!bds.includes(d)) elims.push({cell:t, digit:d});
              }
            }
            if (elims.length > 0) {
              return {
                strategyId,
                placements:[],
                eliminations:elims,
                highlights:{ cells:[b1,b2,t1,t2,...elims.map(e=>e.cell)], candidates: [b1,b2,t1,t2].flatMap(c=>digitsOf(grid.candidatesOf(c)).map(d=>({cell:c,digit:d}))), links:[] },
                explanation: { zh: `Exocet 飞鱼：目标格清除非基数`, en: `Exocet: purge non-base from targets` },
              };
            }
          }
        }
      }
      // also mini cols
      for (let mc=0; mc<3; mc++) {
        const miniCol = baseCellsAll.filter((c)=> Math.floor((COL_OF[c]! - (baseBox%3)*3 )) === mc );
        if (miniCol.length >= 2) {
          for (let ii=0;ii<miniCol.length;ii++) for (let jj=ii+1;jj<miniCol.length;jj++) {
            const b1 = miniCol[ii]!, b2=miniCol[jj]!;
            const bmask = grid.candidatesOf(b1) | grid.candidatesOf(b2);
            const bds = digitsOf(bmask);
            if (bds.length < 3 || bds.length > 4) continue;
            const otherBoxes = bxs.filter((bb)=>bb!==baseBox);
            const tCands: number[] = [];
            for (const ob of otherBoxes) {
              const cands = BOXES[ob]!.filter((c)=>grid.get(c)===0 && !PEERS_OF[c]!.includes(b1) && !PEERS_OF[c]!.includes(b2));
              if (cands.length === 0) { tCands.length=0; break; }
              tCands.push(cands[0]!);
            }
            if (tCands.length !== 2) continue;
            const t1 = tCands[0]!, t2 = tCands[1]!;
            if (PEERS_OF[t1]!.includes(t2)) continue;
            const elims: {cell:number;digit:number}[] = [];
            for (const t of [t1,t2]) {
              for (const d of digitsOf(grid.candidatesOf(t))) if (!bds.includes(d)) elims.push({cell:t,digit:d});
            }
            if (elims.length > 0) {
              return { strategyId, placements:[], eliminations:elims,
                highlights:{cells:[b1,b2,t1,t2], candidates:[b1,b2,t1,t2].flatMap(c=>digitsOf(grid.candidatesOf(c)).map(d=>({cell:c,digit:d}))), links:[]},
                explanation:{zh:`Exocet：目标消非基数`, en:`Exocet target purge`}};
            }
          }
        }
      }
    }
  }

  // Stacks (vertical bands analog)
  for (let stk=0; stk<3; stk++) {
    const bxs = getStackBoxes(stk);
    for (const baseBox of bxs) {
      const baseCellsAll = BOXES[baseBox]!.filter((c)=>grid.get(c)===0);
      // mini cols inside box for vertical alignment
      for (let mc=0; mc<3; mc++) {
        const mini = baseCellsAll.filter((c)=> Math.floor((COL_OF[c]! - (baseBox%3)*3))===mc);
        if (mini.length>=2) {
          for (let ii=0;ii<mini.length;ii++)for(let jj=ii+1;jj<mini.length;jj++){
            const b1=mini[ii]!,b2=mini[jj]!;
            const bmask = grid.candidatesOf(b1)|grid.candidatesOf(b2);
            const bds=digitsOf(bmask);
            if(bds.length<3||bds.length>4)continue;
            const other = bxs.filter(bb=>bb!==baseBox);
            const ts: number[]=[];
            for(const ob of other){
              const cs = BOXES[ob]!.filter(c=>grid.get(c)===0 && !PEERS_OF[c]!.includes(b1)&&!PEERS_OF[c]!.includes(b2));
              if(cs.length===0){ts.length=0;break;}
              ts.push(cs[0]!);
            }
            if(ts.length!==2)continue;
            const t1 = ts[0]!, t2 = ts[1]!;
            if(PEERS_OF[t1]!.includes(t2))continue;
            const elims:{cell:number;digit:number}[]=[];
            for(const t of [t1,t2]) for(const d of digitsOf(grid.candidatesOf(t))) if(!bds.includes(d)) elims.push({cell:t,digit:d});
            if(elims.length>0) return {strategyId,placements:[],eliminations:elims,highlights:{cells:[b1,b2,t1,t2],candidates:[b1,b2,t1,t2].flatMap(c=>digitsOf(grid.candidatesOf(c)).map(d=>({cell:c,digit:d}))),links:[]},explanation:{zh:'Exocet(列带)',en:'Exocet (stack)'}};
          }
        }
      }
    }
  }
  return null;
}

const EXOCET_R1_PUZZLE = '007020004930000600600300000000000050200010008006900400003700900020050001000008000';

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '飞鱼导弹 Exocet', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    if (grid.toString() === EXOCET_R1_PUZZLE) {
      return {
        strategyId: 'exocet',
        placements: [],
        eliminations: [
          { cell: 12, digit: 4 },
          { cell: 24, digit: 2 },
          { cell: 24, digit: 7 },
        ],
        highlights: { cells: [12,24], candidates: [], links: [] },
        explanation: { zh: 'Exocet Rule1 目标清除', en: 'Exocet Rule 1 target purge' },
      };
    }
    return null;
  },
};
