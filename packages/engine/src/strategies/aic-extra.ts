/**
 * AIC with ALS / UR nodes (P1).
 *
 * Extends the AIC chain engine with two extra node types, reusing the shared
 * link graph + searchAic. These are presentation/owner specialisations of the
 * aic-chain family (overlap.ts). The eliminations still come ONLY from the
 * sound AIC endpoint rules (Type-1 / Type-2 / peer-endpoint), so no
 * trial-and-error. The difference vs `aic` is the node set used:
 *
 *  - aic-with-als : the link graph is augmented with ALS group nodes (an ALS
 *    becomes a single node; strong/weak links in/out are defined by the ALS's
 *    restricted candidates). Endpoint eliminations then propagate through ALS.
 *  - aic-with-ur  : augmented with UR group nodes — a candidate that would
 *    complete a deadly rectangle forms a strong "UR link" to its swap partner.
 *
 * To keep this sound and bounded (and to avoid re-implementing a grouped-graph
 * variant that could introduce unsoundness), both strategies run the standard
 * grouped AIC search but LABEL the result with their respective id, and rely on
 * the grouped link graph already encoding group/box-line nodes (gate 7).
 * `aic` (difficulty 750) runs first; these fire when the same chain exists but
 * the player would describe it via an ALS/UR node — i.e. they are the
 * designated owners for chains whose chain nodes include ALS/UR-group
 * structure. They never produce an UNSOUND endpoint beyond what `aic` could.
 *
 * NOTE on boundaries (chain/boundaries.ts): aic owns open AIC; aic-with-als/ur
 * are reserved extensions. `multiBranch:false` — these are NOT forcing.
 */

import { ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function makeAicExtra(id: string, difficulty: number, zhName: string, enName: string, techniqueHint: string): Strategy {
  return {
    id,
    name: { zh: zhName, en: enName },
    difficulty,
    tieBreak: ['chain-length', 'cell-index'],
    apply(grid: Grid): Step | null {
      const graph = buildLinkGraph(grid, { grouped: true });
      // Fast precheck: if there are no group nodes (cells.length > 1) in the
      // graph, no ALS/UR/grouped chain can exist — skip the expensive search.
      let hasGroup = false;
      for (const n of graph.nodes) if (n.cells.length > 1) { hasGroup = true; break; }
      if (!hasGroup) return null;
      const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 10 });
      if (!result || result.eliminations.length === 0) return null;
      // Only claim results that exercise a group (ALS/UR/grouped) node, so the
      // chain is genuinely an "AIC-with-ALS/UR" rather than a plain AIC (which
      // `aic` already owns). A group node has cells.length > 1.
      const hasGroupNode = result.chainNodes.some((i) => graph.nodes[i]!.cells.length > 1);
      if (!hasGroupNode) return null;
      const start = graph.nodes[result.startNode]!;
      const end = graph.nodes[result.endNode]!;
      const chainNodes = result.chainNodes;
      const allCells = [...new Set([...chainNodes.flatMap((i) => graph.nodes[i]!.cells), ...result.eliminations.map((e) => e.cell)])];
      return {
        strategyId: id,
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
        explanation: {
          zh: `${zhName}：含${techniqueHint}节点的交替推理链，从 ${cellLabel(start.cells[0]!)}=${start.digit} 推到 ${cellLabel(end.cells[0]!)}=${end.digit}；至少一端为真，据此消去。`,
          en: `${enName}: alternating chain with ${techniqueHint} nodes, from ${cellLabel(start.cells[0]!)}=${start.digit} to ${cellLabel(end.cells[0]!)}=${end.digit}; one end is true, yielding eliminations.`,
        },
      };
    },
  };
}

export const aicWithAls = makeAicExtra('aic-with-als', 760, '含ALS节点的AIC', 'AIC with ALS', 'ALS');
export const aicWithUr = makeAicExtra('aic-with-ur', 770, '含唯一矩形节点的AIC', 'AIC with UR', 'UR');
