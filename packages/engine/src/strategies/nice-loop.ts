import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, maskOf, popcount, digitsOf, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, type LinkGraph, type ChainNode, type GraphEdge, chainToLinks } from '../chain/graph.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function getCommonHousesOfGroups(cellsA: number[], cellsB: number[]): number[] {
  const common: number[] = [];
  for (let h = 0; h < 27; h++) {
    const house = HOUSES[h]!;
    const containsAllA = cellsA.every(c => house.includes(c));
    const containsAllB = cellsB.every(c => house.includes(c));
    if (containsAllA && containsAllB) {
      common.push(h);
    }
  }
  return common;
}

export function searchNiceLoop(grid: Grid, graph: LinkGraph, maxLen: number): Step | null {
  const n = graph.nodes.length;
  const perStartBudget = 4000;

  // 1. Continuous Loops (Rule 1)
  for (let s = 0; s < n; s++) {
    const sNode = graph.nodes[s]!;
    const queue: { node: number; nextType: 'strong' | 'weak'; path: number[]; edgeTypes: LinkType[] }[] = [
      { node: s, nextType: 'strong', path: [s], edgeTypes: [] }
    ];
    let budget = perStartBudget;
    while (queue.length > 0 && budget-- > 0) {
      const { node, nextType, path, edgeTypes } = queue.shift()!;

      if (path.length >= 4 && path.length % 2 === 0) {
        const edgesToS = graph.adjacency[node]!.filter(e => e.to === s && e.type === 'weak');
        if (edgesToS.length > 0 && nextType === 'weak') {
          const loopNodes = [...path];
          const loopEdges = [...edgeTypes, 'weak'];

          const eliminations: CellDigit[] = [];
          const elimKeys = new Set<string>();

          for (let i = 0; i < loopNodes.length; i++) {
            const edgeType = loopEdges[i]!;
            if (edgeType === 'weak') {
              const u = graph.nodes[loopNodes[i]!]!;
              const v = graph.nodes[loopNodes[(i + 1) % loopNodes.length]!]!;

              if (u.digit === v.digit) {
                const d = u.digit;
                const commonHouses = getCommonHousesOfGroups(u.cells, v.cells);
                for (const hIdx of commonHouses) {
                  const house = HOUSES[hIdx]!;
                  for (const cell of house) {
                    if (grid.get(cell) === 0 && grid.hasCandidate(cell, d)) {
                      const inLoop = loopNodes.some(lnIdx => graph.nodes[lnIdx]!.cells.includes(cell));
                      if (!inLoop) {
                        const key = `${cell}:${d}`;
                        if (!elimKeys.has(key)) {
                          elimKeys.add(key);
                          eliminations.push({ cell, digit: d });
                        }
                      }
                    }
                  }
                }
              } else if (u.cells.length === 1 && v.cells.length === 1 && u.cells[0] === v.cells[0]) {
                const cell = u.cells[0]!;
                for (let d = 1; d <= 9; d++) {
                  if (d !== u.digit && d !== v.digit && grid.hasCandidate(cell, d)) {
                    const key = `${cell}:${d}`;
                    if (!elimKeys.has(key)) {
                      elimKeys.add(key);
                      eliminations.push({ cell, digit: d });
                    }
                  }
                }
              }
            }
          }

          if (eliminations.length > 0) {
            const chain = path.map((idx, index) => ({
              node: idx,
              incoming: index === 0 ? null : edgeTypes[index - 1]!
            }));
            const links = chainToLinks(graph, chain);
            links.push({
              from: { cell: graph.nodes[node]!.cells[0]!, digit: graph.nodes[node]!.digit },
              to: { cell: sNode.cells[0]!, digit: sNode.digit },
              type: 'weak'
            });

            const singleDigit = loopNodes.every(idx => graph.nodes[idx]!.digit === sNode.digit);

            return {
              strategyId: 'nice-loop',
              placements: [],
              eliminations,
              highlights: {
                cells: [...new Set(loopNodes.flatMap(idx => graph.nodes[idx]!.cells))],
                candidates: loopNodes.flatMap(idx => graph.nodes[idx]!.cells.map(c => ({ cell: c, digit: graph.nodes[idx]!.digit }))),
                links,
              },
              explanation: {
                zh: singleDigit
                  ? `连续 X-Cycle（Nice Loop Rule 1）：数字 ${sNode.digit} 构成完美交替闭合环；消去弱链所在单元内的非环候选数。`
                  : `连续 Nice 环（Rule 1）：完美交替闭合环，所有弱链在环内均表现为强关联；消去弱链所在单元/格内的非环候选数。`,
                en: singleDigit
                  ? `Continuous X-Cycle (Nice Loop Rule 1): digit ${sNode.digit} forms a perfectly alternating loop; eliminate off-loop candidates from weak-link units.`
                  : `Continuous Nice Loop (Rule 1): perfectly alternating loop, all weak links act as strong within the loop; eliminate off-loop candidates from weak-link units/cells.`,
              }
            };
          }
        }
      }

      if (path.length >= maxLen) continue;

      for (const edge of graph.adjacency[node]!) {
        if (edge.type !== nextType) continue;
        if (path.includes(edge.to)) continue;
        queue.push({
          node: edge.to,
          nextType: nextType === 'strong' ? 'weak' : 'strong',
          path: [...path, edge.to],
          edgeTypes: [...edgeTypes, edge.type],
        });
      }
    }
  }

  // 2. Discontinuous Loops Rule 2 (Double Strong meet at s)
  for (let s = 0; s < n; s++) {
    const sNode = graph.nodes[s]!;
    if (sNode.cells.length !== 1) continue;

    const queue: { node: number; nextType: 'strong' | 'weak'; path: number[]; edgeTypes: LinkType[] }[] = [
      { node: s, nextType: 'strong', path: [s], edgeTypes: [] }
    ];
    let budget = perStartBudget;
    while (queue.length > 0 && budget-- > 0) {
      const { node, nextType, path, edgeTypes } = queue.shift()!;

      if (path.length >= 3) {
        const edgesToS = graph.adjacency[node]!.filter(e => e.to === s && e.type === 'strong');
        if (edgesToS.length > 0 && nextType === 'strong') {
          const cell = sNode.cells[0]!;
          const digit = sNode.digit;

          const eliminations: CellDigit[] = [];
          for (let d = 1; d <= 9; d++) {
            if (d !== digit && grid.hasCandidate(cell, d)) {
              eliminations.push({ cell, digit: d });
            }
          }

          if (eliminations.length > 0) {
            const chain = path.map((idx, index) => ({
              node: idx,
              incoming: index === 0 ? null : edgeTypes[index - 1]!
            }));
            const links = chainToLinks(graph, chain);
            links.push({
              from: { cell: graph.nodes[node]!.cells[0]!, digit: graph.nodes[node]!.digit },
              to: { cell: sNode.cells[0]!, digit: sNode.digit },
              type: 'strong'
            });

            const singleDigit = path.every(idx => graph.nodes[idx]!.digit === digit);

            return {
              strategyId: 'nice-loop',
              placements: [{ cell, digit }],
              eliminations,
              highlights: {
                cells: [...new Set(path.flatMap(idx => graph.nodes[idx]!.cells))],
                candidates: path.flatMap(idx => graph.nodes[idx]!.cells.map(c => ({ cell: c, digit: graph.nodes[idx]!.digit }))),
                links,
              },
              explanation: {
                zh: singleDigit
                  ? `不连续 X-Cycle（Nice Loop Rule 2）：格 ${cellLabel(cell)} 处有两条强链交汇；强制填入 ${digit}。`
                  : `不连续 Nice 环（Rule 2）：格 ${cellLabel(cell)} 处对候选数 ${digit} 有两条强推理交汇；强制填入该候选数。`,
                en: singleDigit
                  ? `Discontinuous X-Cycle (Nice Loop Rule 2): two strong links meet at ${cellLabel(cell)}; place ${digit}.`
                  : `Discontinuous Nice Loop (Rule 2): two strong links meet for candidate ${digit} at ${cellLabel(cell)}; place ${digit}.`,
              }
            };
          }
        }
      }

      if (path.length >= maxLen) continue;

      for (const edge of graph.adjacency[node]!) {
        if (edge.type !== nextType) continue;
        if (path.includes(edge.to)) continue;
        queue.push({
          node: edge.to,
          nextType: nextType === 'strong' ? 'weak' : 'strong',
          path: [...path, edge.to],
          edgeTypes: [...edgeTypes, edge.type],
        });
      }
    }
  }

  // 3. Discontinuous Loops Rule 3 (Double Weak meet at s)
  for (let s = 0; s < n; s++) {
    const sNode = graph.nodes[s]!;
    if (sNode.cells.length !== 1) continue;

    const queue: { node: number; nextType: 'strong' | 'weak'; path: number[]; edgeTypes: LinkType[] }[] = [
      { node: s, nextType: 'weak', path: [s], edgeTypes: [] }
    ];
    let budget = perStartBudget;
    while (queue.length > 0 && budget-- > 0) {
      const { node, nextType, path, edgeTypes } = queue.shift()!;

      if (path.length >= 3) {
        const edgesToS = graph.adjacency[node]!.filter(e => e.to === s && e.type === 'weak');
        if (edgesToS.length > 0 && nextType === 'weak') {
          const cell = sNode.cells[0]!;
          const digit = sNode.digit;

          if (grid.hasCandidate(cell, digit)) {
            const chain = path.map((idx, index) => ({
              node: idx,
              incoming: index === 0 ? null : edgeTypes[index - 1]!
            }));
            const links = chainToLinks(graph, chain);
            links.push({
              from: { cell: graph.nodes[node]!.cells[0]!, digit: graph.nodes[node]!.digit },
              to: { cell: sNode.cells[0]!, digit: sNode.digit },
              type: 'weak'
            });

            const singleDigit = path.every(idx => graph.nodes[idx]!.digit === digit);

            return {
              strategyId: 'nice-loop',
              placements: [],
              eliminations: [{ cell, digit }],
              highlights: {
                cells: [...new Set(path.flatMap(idx => graph.nodes[idx]!.cells))],
                candidates: path.flatMap(idx => graph.nodes[idx]!.cells.map(c => ({ cell: c, digit: graph.nodes[idx]!.digit }))),
                links,
              },
              explanation: {
                zh: singleDigit
                  ? `不连续 X-Cycle（Nice Loop Rule 3）：格 ${cellLabel(cell)} 处有两条弱链交汇，产生矛盾；消去其候选数 ${digit}。`
                  : `不连续 Nice 环（Rule 3）：格 ${cellLabel(cell)} 处对候选数 ${digit} 有两条弱推理交汇，产生矛盾；消去其候选数。`,
                en: singleDigit
                  ? `Discontinuous X-Cycle (Nice Loop Rule 3): two weak links meet at ${cellLabel(cell)}; eliminate ${digit}.`
                  : `Discontinuous Nice Loop (Rule 3): two weak links meet for candidate ${digit} at ${cellLabel(cell)}; eliminate ${digit}.`,
              }
            };
          }
        }
      }

      if (path.length >= maxLen) continue;

      for (const edge of graph.adjacency[node]!) {
        if (edge.type !== nextType) continue;
        if (path.includes(edge.to)) continue;
        queue.push({
          node: edge.to,
          nextType: nextType === 'strong' ? 'weak' : 'strong',
          path: [...path, edge.to],
          edgeTypes: [...edgeTypes, edge.type],
        });
      }
    }
  }

  return null;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice 环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    return searchNiceLoop(grid, graph, DEFAULT_CHAIN_POLICY.maxChainLength);
  }
};
