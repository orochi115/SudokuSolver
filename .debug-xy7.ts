import { Grid, PEERS_OF, popcount, maskOf } from './packages/engine/src/grid.js';
import { buildLinkGraph } from './packages/engine/src/chain/graph.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('080103070000000000001408020570001039000609000920800051030905200000000000010702060');
const graph = buildLinkGraph(grid, { grouped: false });
const targets = [rc(1,3), rc(3,7), rc(3,9)];

function isBivalueCell(c: number) { return popcount(grid.candidatesOf(c)) === 2; }
function isInternalNode(i: number) { const c = graph.nodes[i]!.cells[0]!; return isBivalueCell(c); }

function seesAll(cell: number, nodeCells: readonly number[]) {
  if (nodeCells.includes(cell)) return false;
  return nodeCells.every(nc => PEERS_OF[cell]!.includes(nc));
}

// XY-chain relaxed: internal nodes on bivalue cells; endpoints any with same digit
interface Q { node: number; next: 'strong'|'weak'; chain: number[]; vis: Set<number> }
const n = graph.nodes.length;

for (let s = 0; s < n; s++) {
  if (graph.nodes[s]!.digit !== 5) continue;
  const q: Q[] = [{ node: s, next: 'strong', chain: [s], vis: new Set([s]) }];
  let budget = 5000;
  while (q.length && budget-- > 0) {
    const item = q.shift()!;
    if (item.chain.length >= 2 && item.next === 'strong') {
      const end = item.chain[item.chain.length-1]!;
      if (end !== s && graph.nodes[end]!.digit === 5) {
        const A = graph.nodes[s]!, B = graph.nodes[end]!;
        const bit = maskOf(5);
        const elims: number[] = [];
        for (let c = 0; c < 81; c++) {
          if (grid.get(c)!==0 || !(grid.candidatesOf(c)&bit)) continue;
          if (A.cells.includes(c) || B.cells.includes(c)) continue;
          if (seesAll(c, A.cells) && seesAll(c, B.cells)) elims.push(c);
        }
        if (targets.every(t => elims.includes(t))) {
          const lab = (i:number) => `R${Math.floor(graph.nodes[i]!.cells[0]!/9)+1}C${graph.nodes[i]!.cells[0]!%9+1}(${graph.nodes[i]!.digit})`;
          console.log('RELAXED', item.chain.map(lab).join(' -> '), 'elims', elims.length);
        }
      }
    }
    if (item.chain.length >= 10) continue;
    for (const e of graph.adjacency[item.node]!) {
      if (e.type !== item.next) continue;
      if (item.vis.has(e.to)) continue;
      // internal nodes must be bivalue
      if (item.chain.length >= 1 && e.to !== s) {
        const isEnd = false; // unknown
        if (item.chain.length >= 1 && !isBivalueCell(graph.nodes[e.to]!.cells[0]!)) continue;
      }
      const vis = new Set(item.vis); vis.add(e.to);
      q.push({ node: e.to, next: item.next==='strong'?'weak':'strong', chain: [...item.chain, e.to], vis });
    }
  }
}