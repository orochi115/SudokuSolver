import {
  CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import type { ALS } from './als.js';
import { findAllALS } from './als.js';
import { buildLinkGraph, nodeKey, type LinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;

          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含 ALS 节点的 AIC', en: 'AIC with ALS Node' },
  difficulty: 760,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // 1. Build standard graph
    const graph = buildLinkGraph(grid, { grouped: true });

    // 2. Find all ALS and add virtual strong links
    const alsList = findAllALS(grid);
    const virtualEdges = new Set<string>();

    for (const als of alsList) {
      const { cells, digits } = als;
      // For each pair of cells in ALS and their digits
      for (const c1 of cells) {
        for (const d1 of digits) {
          if (!grid.hasCandidate(c1, d1)) continue;
          for (const c2 of cells) {
            for (const d2 of digits) {
              if (d1 === d2) continue;
              if (!grid.hasCandidate(c2, d2)) continue;

              // Add virtual strong link
              const k1 = nodeKey(d1, [c1]);
              const k2 = nodeKey(d2, [c2]);
              const idx1 = graph.indexOfKey.get(k1);
              const idx2 = graph.indexOfKey.get(k2);

              if (idx1 !== undefined && idx2 !== undefined) {
                // Add to graph adjacency
                if (!graph.adjacency[idx1]!.some(e => e.to === idx2 && e.type === 'strong')) {
                  graph.adjacency[idx1]!.push({ to: idx2, type: 'strong' });
                }
                if (!graph.adjacency[idx2]!.some(e => e.to === idx1 && e.type === 'strong')) {
                  graph.adjacency[idx2]!.push({ to: idx1, type: 'strong' });
                }
                virtualEdges.add(`${idx1},${idx2}`);
                virtualEdges.add(`${idx2},${idx1}`);
              }
            }
          }
        }
      }
    }

    // 3. Search AIC
    const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
    if (result && result.eliminations.length > 0) {
      // Verify if the chain actually used at least one ALS virtual edge
      let usesAls = false;
      for (let i = 0; i < result.chainNodes.length - 1; i++) {
        const u = result.chainNodes[i]!;
        const v = result.chainNodes[i + 1]!;
        if (virtualEdges.has(`${u},${v}`)) {
          usesAls = true;
          break;
        }
      }

      if (usesAls) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: {
            cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i) =>
              graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `含 ALS 节点的交替推理链：链通过 ALS 节点的多余候选数产生的强弱推导关系，连接 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 与 ${cellLabel(end.cells[0]!)} 的 ${end.digit}，消去其公共可见格中的候选。`,
            en: `AIC with ALS Node: alternating inference chain utilizing Almost Locked Set node links, from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit}; eliminate corresponding candidates.`
          }
        };
      }
    }
    return null;
  }
};

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含唯一矩形节点的 AIC', en: 'AIC with UR Node' },
  difficulty: 770,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // 1. Build standard graph
    const graph = buildLinkGraph(grid, { grouped: true });

    // 2. Find all Type 1 URs and add virtual strong links
    const virtualEdges = new Set<string>();

    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      if (cells.some(c => grid.get(c) !== 0)) continue;

      // Try each cell as the target
      for (let i = 0; i < 4; i++) {
        const target = cells[i]!;
        const clean = cells.filter(c => c !== target);

        // Find UR pair of digits {a, b}
        let abMask = 0;
        for (const c of clean) {
          abMask |= grid.candidatesOf(c);
        }

        if (popcount(abMask) === 2) {
          const [a, b] = digitsOf(abMask) as [number, number];
          const targetCands = grid.candidatesOf(target);

          // Extra candidates in target
          const extras = digitsOf(targetCands & ~abMask);
          if (extras.length > 0) {
            // Virtual strong link: clean corner losing a/b forces extra in target ON
            for (const cleanCell of clean) {
              for (const d of [a, b]) {
                for (const E of extras) {
                  const k1 = nodeKey(d, [cleanCell]);
                  const k2 = nodeKey(E, [target]);
                  const idx1 = graph.indexOfKey.get(k1);
                  const idx2 = graph.indexOfKey.get(k2);

                  if (idx1 !== undefined && idx2 !== undefined) {
                    if (!graph.adjacency[idx1]!.some(e => e.to === idx2 && e.type === 'strong')) {
                      graph.adjacency[idx1]!.push({ to: idx2, type: 'strong' });
                    }
                    if (!graph.adjacency[idx2]!.some(e => e.to === idx1 && e.type === 'strong')) {
                      graph.adjacency[idx2]!.push({ to: idx1, type: 'strong' });
                    }
                    virtualEdges.add(`${idx1},${idx2}`);
                    virtualEdges.add(`${idx2},${idx1}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Search AIC
    const result = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
    if (result && result.eliminations.length > 0) {
      let usesUr = false;
      for (let i = 0; i < result.chainNodes.length - 1; i++) {
        const u = result.chainNodes[i]!;
        const v = result.chainNodes[i + 1]!;
        if (virtualEdges.has(`${u},${v}`)) {
          usesUr = true;
          break;
        }
      }

      if (usesUr) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: {
            cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i) =>
              graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `含唯一矩形节点的交替推理链：链通过唯一矩形避免致命图案的强强推导关系，连接 ${cellLabel(start.cells[0]!)} 的 ${start.digit} 与 ${cellLabel(end.cells[0]!)} 的 ${end.digit}，消去其公共可见格中的候选。`,
            en: `AIC with UR Node: alternating inference chain utilizing Unique Rectangle links, from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit}; eliminate corresponding candidates.`
          }
        };
      }
    }
    return null;
  }
};
