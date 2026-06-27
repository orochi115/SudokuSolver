import { Grid, PEERS_OF, popcount, maskOf } from './packages/engine/src/grid.js';
import { buildLinkGraph } from './packages/engine/src/chain/graph.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('080103070000000000001408020570001039000609000920800051030905200000000000010702060');
const graph = buildLinkGraph(grid, { grouped: false });
const targets = [rc(1,3), rc(3,7), rc(3,9)];
const digit = 5;
const bit = maskOf(digit);

function isBivalueCell(c: number) { return popcount(grid.candidatesOf(c)) === 2; }
function seesAll(cell: number, nodeCells: readonly number[]) {
  if (nodeCells.includes(cell)) return false;
  return nodeCells.every(nc => PEERS_OF[cell]!.includes(nc));
}

// Nodes on bivalue cells only
const allowed = new Set<number>();
for (let i = 0; i < graph.nodes.length; i++) {
  const n = graph.nodes[i]!;
  if (n.cells.length === 1 && isBivalueCell(n.cells[0]!)) allowed.add(i);
}

// Find all endpoint pairs with digit 5
const nodes5 = [...allowed].filter(i => graph.nodes[i]!.digit === digit);
console.log('bivalue nodes with 5:', nodes5.length);

for (let a = 0; a < nodes5.length; a++) {
  for (let b = a+1; b < nodes5.length; b++) {
    const A = graph.nodes[nodes5[a]!]!;
    const B = graph.nodes[nodes5[b]!]!;
    const elims: number[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c)!==0 || !(grid.candidatesOf(c)&bit)) continue;
      if (A.cells.includes(c) || B.cells.includes(c)) continue;
      if (seesAll(c, A.cells) && seesAll(c, B.cells)) elims.push(c);
    }
    if (targets.every(t => elims.includes(t))) {
      const lab = (i:number) => `R${Math.floor(graph.nodes[i]!.cells[0]!/9)+1}C${graph.nodes[i]!.cells[0]!%9+1}`;
      console.log('pair', lab(nodes5[a]!), lab(nodes5[b]!), 'elims', elims.map(c=>`R${Math.floor(c/9)+1}C${c%9+1}`));
    }
  }
}