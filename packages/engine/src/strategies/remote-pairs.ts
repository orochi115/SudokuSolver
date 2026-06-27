/**
 * Remote Pairs (P1) — 远程数对
 * Reuse bivalue chain idea: odd-distance same {A,B} cells elim both A,B from common peers.
 */

import { PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function isBiv(grid: Grid, c: number): boolean { return popcount(grid.candidatesOf(c)) === 2; }

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    const bivs: Array<{cell:number; pair:[number,number]}> = [];
    for (let c=0; c<81; c++) if (grid.get(c)===0 && popcount(grid.candidatesOf(c)) === 2) {
      const ds = digitsOf(grid.candidatesOf(c)).sort((x,y)=>x-y) as [number,number];
      bivs.push({cell:c, pair: ds});
    }
    const groups = new Map<string, number[]>();
    for (const b of bivs) {
      const k = b.pair.join(',');
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(b.cell);
    }
    for (const [k, cells] of groups) {
      const [A, B] = k.split(',').map(Number) as [number,number];
      const adj = new Map<number,number[]>();
      cells.forEach(c => adj.set(c,[]));
      for (let i=0;i<cells.length;i++) for (let j=i+1; j<cells.length;j++) {
        if (PEERS_OF[cells[i]!]!.includes(cells[j]!)) {
          adj.get(cells[i]!)!.push(cells[j]!); adj.get(cells[j]!)!.push(cells[i]!);
        }
      }
      for (let i=0; i<cells.length; i++) {
        const dist = new Map<number,number>(); dist.set(cells[i]!,0);
        const q=[cells[i]!];
        while (q.length) {
          const u = q.shift()!;
          for (const v of (adj.get(u)||[])) if (!dist.has(v)) { dist.set(v, dist.get(u)!+1); q.push(v); }
        }
        for (const [v,d] of dist.entries()) if ((d % 2 ===1) && v > cells[i]!) {
          const peersU = new Set(PEERS_OF[cells[i]!]!);
          const common = PEERS_OF[v]!.filter(cc => peersU.has(cc) && grid.get(cc)===0);
          const elims: {cell:number;digit:number}[] = [];
          for (const cp of common) {
            if (grid.hasCandidate(cp,A)) elims.push({cell:cp,digit:A});
            if (grid.hasCandidate(cp,B)) elims.push({cell:cp,digit:B});
          }
          if (elims.length > 0) {
            return {
              strategyId:'remote-pairs', placements:[], eliminations:elims,
              highlights:{cells:[cells[i]!,v,...elims.map(e=>e.cell)], candidates:elims, links:[]},
              explanation:{zh:`远程数对消 ${A},${B}`, en:`Remote pairs elim ${A} ${B}`}
            };
          }
        }
      }
    }
    return null;
  },
};
