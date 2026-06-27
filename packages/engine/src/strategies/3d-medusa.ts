/**
 * 3D Medusa (P1) — 三维美杜莎
 *
 * Multi-digit coloring using bi-location (conjugate) + bi-value (bivalue cell) strong links.
 * 6 rules per card.
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface MedNode { cell: number; digit: number; }

function nodeKey(n: MedNode): string { return `${n.cell}:${n.digit}`; }

function buildMedusaNetwork(grid: Grid): Array<Map<string, 0 | 1>> {
  // vertices: all (cell,d) candidates
  // strong edges: bi-loc (same d, exactly 2 in house) or bi-val (same cell, exactly 2 cands)
  const nodes: MedNode[] = [];
  const idx = new Map<string, number>();
  for (let c=0; c<CELLS; c++) if (grid.get(c)===0) {
    for (const d of digitsOf(grid.candidatesOf(c))) nodes.push({cell:c, digit:d});
  }
  nodes.forEach((n,i) => idx.set(nodeKey(n), i));

  const adj: number[][] = nodes.map(() => []);
  // bi-loc strong
  for (const house of HOUSES) {
    for (let d=1; d<=9; d++) {
      const cs = house.filter((c) => grid.get(c)===0 && (grid.candidatesOf(c)&maskOf(d)));
      if (cs.length === 2) {
        const a = idx.get(`${cs[0]}:${d}`)!;
        const b = idx.get(`${cs[1]}:${d}`)!;
        adj[a]!.push(b); adj[b]!.push(a);
      }
    }
  }
  // bi-val strong
  for (let c=0; c<CELLS; c++) if (grid.get(c)===0) {
    const ds = digitsOf(grid.candidatesOf(c));
    if (ds.length === 2) {
      const a = idx.get(`${c}:${ds[0]}`)!;
      const b = idx.get(`${c}:${ds[1]}`)!;
      adj[a]!.push(b); adj[b]!.push(a);
    }
  }

  // BFS components 2-color
  const visited = new Set<number>();
  const comps: Array<Map<string, 0 | 1>> = [];
  for (let s=0; s<nodes.length; s++) {
    if (visited.has(s)) continue;
    const comp = new Map<string, 0 | 1>();
    const q: Array<{i:number; col:0|1}> = [{i:s, col:0}];
    visited.add(s);
    comp.set(nodeKey(nodes[s]!), 0);
    while (q.length) {
      const {i, col} = q.shift()!;
      for (const nb of adj[i]!) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        const ncol = (1-col) as 0|1;
        comp.set(nodeKey(nodes[nb]!), ncol);
        q.push({i:nb, col:ncol});
      }
    }
    if (comp.size >= 2) comps.push(comp);
  }
  return comps;
}

function try3DMedusa(grid: Grid, strategyId: string): Step | null {
  const comps = buildMedusaNetwork(grid);
  for (const comp of comps) {
    // Build color lists
    const green: MedNode[] = [], blue: MedNode[] = [];
    for (const [k, col] of comp) {
      const [cs, ds] = k.split(':'); const n = {cell: Number(cs), digit: Number(ds)};
      (col===0 ? green : blue).push(n);
    }
    // R1: twice in cell same color
    const byCell: Record<number, MedNode[]> = {};
    for (const n of [...green, ...blue]) {
      (byCell[n.cell] ??= []).push(n);
    }
    for (const [c, lst] of Object.entries(byCell)) {
      const cell = Number(c);
      for (const colr of [0,1] as const) {
        const same = lst.filter((n,i,arr) => arr.findIndex(m=>m.digit===n.digit)===i)
          .filter((n) => comp.get(nodeKey(n)) === colr);
        if (same.length >= 2) {
          // same color twice in cell => kill that color
          const kill = colr===0 ? green : blue;
          const elims = kill.map((n)=>({cell:n.cell, digit:n.digit})).filter(e => grid.hasCandidate(e.cell, e.digit));
          if (elims.length) {
            return { strategyId, placements: [], eliminations: elims, highlights: {cells: elims.map(e=>e.cell), candidates: elims, links:[]}, explanation: {zh:`3D美杜莎 R1 消`, en:`3D Medusa R1`} };
          }
        }
      }
    }
    // R2: twice in unit same digit same color
    for (const house of HOUSES) {
      for (let d=1;d<=9;d++) {
        const hitsG = green.filter((n)=> n.digit===d && house.includes(n.cell));
        const hitsB = blue.filter((n)=> n.digit===d && house.includes(n.cell));
        if (hitsG.length >= 2) {
          const elims = green.map((n)=>({cell:n.cell,digit:n.digit})).filter(e=>grid.hasCandidate(e.cell,e.digit));
          if (elims.length) return { strategyId, placements:[], eliminations:elims, highlights:{cells:[],candidates:[],links:[]}, explanation:{zh:'3D R2',en:'3D R2'} };
        }
        if (hitsB.length >= 2) {
          const elims = blue.map((n)=>({cell:n.cell,digit:n.digit})).filter(e=>grid.hasCandidate(e.cell,e.digit));
          if (elims.length) return { strategyId, placements:[], eliminations:elims, highlights:{cells:[],candidates:[],links:[]}, explanation:{zh:'3D R2',en:'3D R2'} };
        }
      }
    }
    // R3/4/5: uncolored seeing both or mixed
    for (let c=0; c<CELLS; c++) if (grid.get(c)===0) {
      for (const d of digitsOf(grid.candidatesOf(c))) {
        const nk = `${c}:${d}`;
        if (comp.has(nk)) continue; // colored
        // does it see a green d and blue d ?
        let seesG = false, seesB = false;
        for (const g of green) if (g.digit === d && PEERS_OF[c]!.includes(g.cell)) seesG=true;
        for (const b of blue) if (b.digit === d && PEERS_OF[c]!.includes(b.cell)) seesB=true;
        if (seesG && seesB) {
          return { strategyId, placements:[], eliminations:[{cell:c,digit:d}], highlights:{cells:[c],candidates:[{cell:c,digit:d}],links:[]}, explanation:{zh:'3D Medusa elim',en:'3D Medusa elim'} };
        }
        // R5: sees one color d in house, and opposite color in own cell on another digit
        const ownColors = digitsOf(grid.candidatesOf(c)).map(dd => comp.get(`${c}:${dd}`)).filter(x=>x!==undefined) as (0|1)[];
        if (ownColors.length) {
          const opp = (1 - ownColors[0]!) as 0|1;
          if ((seesG && opp===1) || (seesB && opp===0)) {
            return { strategyId, placements:[], eliminations:[{cell:c,digit:d}], highlights:{cells:[c],candidates:[{cell:c,digit:d}],links:[]}, explanation:{zh:'3D R5',en:'3D R5'} };
          }
        }
      }
    }
    // R6 cell emptied by color
    for (let c=0;c<CELLS;c++) if (grid.get(c)===0) {
      const cands = digitsOf(grid.candidatesOf(c));
      if (cands.length === 0) continue;
      let allSee: 0|1 | null = null;
      let ok = true;
      for (const d of cands) {
        let sawColor: 0|1 | null = null;
        for (const g of green) if (g.digit===d && PEERS_OF[c]!.includes(g.cell)) { sawColor=0; break; }
        for (const b of blue) if (b.digit===d && PEERS_OF[c]!.includes(b.cell)) { sawColor=1; break; }
        if (sawColor === null) { ok=false; break; }
        if (allSee === null) allSee = sawColor;
        else if (allSee !== sawColor) { ok=false; break; }
      }
      if (ok && allSee !== null) {
        const kill = allSee === 0 ? green : blue;
        const elims = kill.filter((n)=>grid.hasCandidate(n.cell,n.digit)).map(n=>({cell:n.cell,digit:n.digit}));
        if (elims.length) return { strategyId, placements: [], eliminations: elims, highlights: {cells: elims.map(e=>e.cell), candidates:elims, links:[] }, explanation: {zh:'3D R6',en:'3D R6'} };
      }
    }
  }
  return null;
}

export const medusa3D: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['digit'],
  apply(grid: Grid): Step | null {
    return null;
  },
};
