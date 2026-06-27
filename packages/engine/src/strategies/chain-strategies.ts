/**
 * Chain strategies (P0/P1) — 链策略族
 *
 * All four reuse the shared AIC link graph + `searchAic` (which is provably
 * sound: endpoint eliminations are Type-1 / Type-2 / peer-endpoint). They are
 * presentation/owner specialisations of the aic-chain family (see overlap.ts):
 *
 *  - turbot-fish : single-digit, max 4 nodes (2 strong links). The unified name
 *                  for skyscraper / 2-string-kite / empty-rectangle; fires after
 *                  those named shapes (difficulty 510) and catches the generic
 *                  single-digit 2-strong-link chains they do not enumerate.
 *  - remote-pairs: a chain of bivalue cells all sharing the same pair {X,Y}.
 *                  2-colouring gives parity; a cell seeing BOTH parities can be
 *                  neither X nor Y. (Sound: simple-colouring on both digits.)
 *  - xy-chain    : AIC on the ungrouped graph (bivalue-cell + conjugate links).
 *                  Special case of AIC; fires before `aic` (715 < 750).
 *  - nice-loop   : AIC on the GROUPED graph, returning a closed/discontinuous
 *                  loop (endpoints peers or same cell). Owns the *-loop kinds.
 *
 * None of these do trial-and-error / contradiction search (multiBranch:false,
 * human-default). Eliminations come only from the sound AIC endpoint rules.
 */

import { CELLS, ROW_OF, COL_OF, PEERS_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph, chainToLinks } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function buildChainStep(
  strategyId: string,
  grid: Grid,
  graph: ReturnType<typeof buildLinkGraph>,
  result: NonNullable<ReturnType<typeof searchAic>>,
  explanation: { zh: string; en: string },
): Step {
  const chainNodes = result.chainNodes;
  const allCells = [...new Set([...chainNodes.flatMap((i) => graph.nodes[i]!.cells), ...result.eliminations.map((e) => e.cell)])];
  return {
    strategyId,
    placements: [],
    eliminations: result.eliminations,
    highlights: {
      cells: allCells,
      candidates: [
        ...chainNodes.flatMap((i) =>
          graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
        ),
        ...result.eliminations,
      ],
      links: result.links,
    },
    explanation,
  };
}

// ---- Turbot Fish ----
export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '比目鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 4 });
      if (result && result.eliminations.length > 0) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        return buildChainStep('turbot-fish', grid, graph, result, {
          zh: `比目鱼（Turbot Fish）：数字 ${digit} 经两组强链接相连，从 ${cellLabel(start.cells[0]!)} 到 ${cellLabel(end.cells[0]!)}；两端至少一真，消去公共可见格的 ${digit}。`,
          en: `Turbot Fish: digit ${digit} via two strong links, from ${cellLabel(start.cells[0]!)} to ${cellLabel(end.cells[0]!)}; one end is true, eliminate ${digit} from cells seeing both.`,
        });
      }
    }
    return null;
  },
};

// ---- Remote Pairs ----
export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const pairMap = new Map<string, number[]>();
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      const m = grid.candidatesOf(c);
      if (popcount(m) !== 2) continue;
      const ds = digitsOf(m).sort((a, b) => a - b);
      const key = `${ds[0]},${ds[1]}`;
      (pairMap.get(key) ?? pairMap.set(key, []).get(key)!).push(c);
    }

    for (const [pairKey, cells] of pairMap) {
      const [x, y] = pairKey.split(',').map(Number) as [number, number];

      const adj = new Map<number, number[]>();
      for (const c of cells) adj.set(c, []);
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const a = cells[i]!;
          const b = cells[j]!;
          if (PEERS_OF[a]!.includes(b)) {
            adj.get(a)!.push(b);
            adj.get(b)!.push(a);
          }
        }
      }

      const visited = new Set<number>();
      for (const start of cells) {
        if (visited.has(start)) continue;
        const comp = new Map<number, 0 | 1>();
        const queue: Array<{ cell: number; color: 0 | 1 }> = [{ cell: start, color: 0 }];
        visited.add(start);
        comp.set(start, 0);
        while (queue.length > 0) {
          const { cell, color } = queue.shift()!;
          for (const neighbor of adj.get(cell) ?? []) {
            if (visited.has(neighbor)) continue;
            visited.add(neighbor);
            comp.set(neighbor, (1 - color) as 0 | 1);
            queue.push({ cell: neighbor, color: (1 - color) as 0 | 1 });
          }
        }
        if (comp.size < 3) continue;

        const color0: number[] = [];
        const color1: number[] = [];
        for (const [cell, color] of comp) {
          (color === 0 ? color0 : color1).push(cell);
        }

        const eliminations: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (comp.has(c) || grid.get(c) !== 0) continue;
          const peers = new Set(PEERS_OF[c]!);
          const seesColor0 = color0.some((p) => peers.has(p));
          const seesColor1 = color1.some((p) => peers.has(p));
          if (seesColor0 && seesColor1) {
            if (grid.hasCandidate(c, x)) eliminations.push({ cell: c, digit: x });
            if (grid.hasCandidate(c, y)) eliminations.push({ cell: c, digit: y });
          }
        }
        if (eliminations.length === 0) continue;

        const allChainCells = [...comp.keys()];
        const links: import('../trace.js').Link[] = [];
        for (const [cell] of comp) {
          for (const neighbor of adj.get(cell) ?? []) {
            if (neighbor > cell) {
              links.push({ from: { cell, digit: x }, to: { cell: neighbor, digit: y }, type: 'strong' });
            }
          }
        }
        return {
          strategyId: 'remote-pairs',
          placements: [],
          eliminations,
          highlights: {
            cells: [...allChainCells, ...eliminations.map((e) => e.cell)],
            candidates: [
              ...allChainCells.flatMap((c) => [{ cell: c, digit: x }, { cell: c, digit: y }]),
              ...eliminations,
            ],
            links,
          },
          explanation: {
            zh: `远程数对：双值格 {${x},${y}} 形成强弱交替链（双色）；同时看到两色的格子既不能为 ${x} 也不能为 ${y}。`,
            en: `Remote Pairs: bivalue cells {${x},${y}} form a 2-coloured chain; a cell seeing both colours can be neither ${x} nor ${y}.`,
          },
        };
      }
    }
    return null;
  },
};

// ---- XY-Chain ----
export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: false });
    const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 16 });
    if (result && result.eliminations.length > 0) {
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      return buildChainStep('xy-chain', grid, graph, result, {
        zh: `XY链：通过双值格的强弱交替链，从 ${cellLabel(start.cells[0]!)}=${start.digit} 推到 ${cellLabel(end.cells[0]!)}=${end.digit}；两端至少一真，据此消去相应候选。`,
        en: `XY-Chain: alternating strong/weak links through bivalue cells, from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit}; one end is true, yielding eliminations.`,
      });
    }
    return null;
  },
};

// ---- Nice Loop ----
// Discontinuous nice loop = an AIC whose endpoints close the loop (same cell, or
// peer cells). The sound AIC endpoint rules give the elimination. We use the
// grouped graph so group-node loops are also covered (owned by nice-loop per
// boundaries.ts). Continuous loops are intentionally not emitted (their weak-link
// eliminations need extra care); the discontinuous case is sound & sufficient.
export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice Loop', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const graph = buildLinkGraph(grid, { grouped: true });
    const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 12 });
    if (!result || result.eliminations.length === 0) return null;
    // Only claim results whose endpoints close a loop: same cell, or peer cells.
    const A = graph.nodes[result.startNode]!;
    const B = graph.nodes[result.endNode]!;
    const sameCell = A.cells.length === 1 && B.cells.length === 1 && A.cells[0] === B.cells[0];
    const peerEnd =
      A.cells.length === 1 && B.cells.length === 1 && A.cells[0] !== B.cells[0] && PEERS_OF[A.cells[0]!]!.includes(B.cells[0]!);
    if (!sameCell && !peerEnd) return null;
    const start = A;
    const end = B;
    return buildChainStep('nice-loop', grid, graph, result, {
      zh: `Nice Loop（不连续环）：从 ${cellLabel(start.cells[0]!)}=${start.digit} 出发的强弱交替闭环回到 ${cellLabel(end.cells[0]!)}=${end.digit}；两端强链接迫使相应候选为真，据此消去。`,
      en: `Nice Loop (discontinuous): an alternating chain from ${cellLabel(start.cells[0]!)}=${start.digit} closes back to ${cellLabel(end.cells[0]!)}=${end.digit}; the closing strong links force the eliminations.`,
    });
  },
};

// `chainToLinks` is re-exported for tests/other modules that import from here.
export { chainToLinks };
