import {
  CELLS, PEERS_OF, ROW_OF, COL_OF, BOX_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';
import { findAllALS, isRCC } from './als.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含ALS节点的AIC', en: 'AIC with ALS' },
  difficulty: 760,
  tieBreak: ['chain-length'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
    if (result && result.eliminations.length > 0) {
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const sameDigit = start.digit === end.digit;
      return {
        strategyId: 'aic-with-als',
        placements: [],
        eliminations: result.eliminations,
        highlights: {
          cells: result.chainNodes.flatMap(i => graph.nodes[i]!.cells),
          candidates: result.chainNodes.flatMap(i =>
            graph.nodes[i]!.cells.map(c => ({ cell: c, digit: graph.nodes[i]!.digit })),
          ),
          links: result.links,
        },
        explanation: {
          zh: `含ALS节点的AIC：从 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 经强弱交替链推到 ${cellLabel(end.cells[0]!)} 的 ${end.digit}；利用ALS节点扩展链端点。`,
          en: `AIC with ALS nodes: from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit} using ALS nodes for extended chain endpoints.`,
        },
      };
    }

    const alsList = findAllALS(grid);
    if (alsList.length < 2) return null;

    const bivalueCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (popcount(grid.candidatesOf(c)) === 2) bivalueCells.push(c);
    }

    for (const bv of bivalueCells) {
      const bvMask = grid.candidatesOf(bv);
      for (const als of alsList) {
        if (als.cells.includes(bv)) continue;
        const commonDigits = digitsOf(bvMask & als.digitMask);
        for (const rcc of commonDigits) {
          const peers = new Set(PEERS_OF[bv]!);
          const alsRccCells = als.cells.filter(c => grid.candidatesOf(c) & maskOf(rcc));
          if (!alsRccCells.every(c => peers.has(c))) continue;

          const elimDigits = digitsOf(bvMask & als.digitMask).filter(d => d !== rcc);
          for (const z of elimDigits) {
            const zBit = maskOf(z);
            const alsZCells = als.cells.filter(c => grid.candidatesOf(c) & zBit);
            const eliminations: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              if (c === bv || als.cells.includes(c)) continue;
              const cPeeers = new Set(PEERS_OF[c]!);
              if (cPeeers.has(bv) && alsZCells.every(az => cPeeers.has(az))) {
                eliminations.push({ cell: c, digit: z });
              }
            }
            if (eliminations.length > 0) {
              return {
                strategyId: 'aic-with-als',
                placements: [],
                eliminations,
                highlights: {
                  cells: [...new Set([bv, ...als.cells, ...eliminations.map(e => e.cell)])],
                  candidates: [
                    { cell: bv, digit: rcc }, { cell: bv, digit: z },
                    ...als.cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                    ...eliminations,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `含ALS节点的AIC：双值格 ${cellLabel(bv)} 与ALS通过RCC ${rcc} 相连；消去两端公共可见格的 ${z}（含ALS）。`,
                  en: `AIC with ALS: bivalue ${cellLabel(bv)} linked to ALS via RCC ${rcc}; eliminate ${z} from common peers of both endpoints (AIC-with-ALS).`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};