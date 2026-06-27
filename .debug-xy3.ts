import { Grid, PEERS_OF, popcount, maskOf } from './packages/engine/src/grid.js';
import { buildLinkGraph } from './packages/engine/src/chain/graph.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('080103070000000000001408020570001039000609000920800051030905200000000000010702060');
const graph = buildLinkGraph(grid, { grouped: false });
const targets = [rc(1,3), rc(3,7), rc(3,9)];

function seesAll(cell: number, nodeCells: readonly number[]) {
  if (nodeCells.includes(cell)) return false;
  return nodeCells.every(nc => PEERS_OF[cell]!.includes(nc));
}

const bivalue = new Set<number>();
for (let i = 0; i < graph.nodes.length; i++) {
  const n = graph.nodes[i]!;
  if (n.cells.length === 1 && popcount(grid.candidatesOf(n.cells[0]!)) === 2) bivalue.add(i);
}

function dfs(start: number, cur: number, nextType: 'strong'|'weak', path: number[], visited: Set<number>, depth: number) {
  if (depth >= 2 && nextType === 'strong') {
    const A = graph.nodes[start]!;
    const B = graph.nodes[cur]!;
    if (start !== cur && bivalue.has(cur) && A.digit === B.digit) {
      const elims: number[] = [];
      const bit = maskOf(A.digit);
      for (let c = 0; c < 81; c++) {
        if (grid.get(c)!==0 || !(grid.candidatesOf(c)&bit)) continue;
        if (A.cells.includes(c) || B.cells.includes(c)) continue;
        if (seesAll(c, A.cells) && seesAll(c, B.cells)) elims.push(c);
      }
      if (targets.every(t => elims.includes(t))) {
        const label = (i:number) => `R${Math.floor(graph.nodes[i]!.cells[0]!/9)+1}C${graph.nodes[i]!.cells[0]!%9+1}(${graph.nodes[i]!.digit})`;
        console.log('FOUND', path.map(label), 'end', label(cur), 'elims', elims.length);
      }
    }
  }
  if (depth >= 12) return;
  for (const e of graph.adjacency[cur]!) {
    if (e.type !== nextType) continue;
    if (visited.has(e.to)) continue;
    if (!bivalue.has(e.to)) continue;
    const v = new Set(visited); v.add(e.to);
    dfs(start, e.to, nextType==='strong'?'weak':'strong', [...path, e.to], v, depth+1);
  }
}

for (const s of bivalue) dfs(s, s, 'strong', [s], new Set([s]), 1);