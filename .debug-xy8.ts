import { Grid, PEERS_OF, maskOf } from './packages/engine/src/grid.js';
import { buildLinkGraph } from './packages/engine/src/chain/graph.js';
import { searchAic } from './packages/engine/src/chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from './packages/engine/src/chain/policy.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const grid = Grid.fromString('080103070000000000001408020570001039000609000920800051030905200000000000010702060');
const graph = buildLinkGraph(grid, { grouped: false });
const aic = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
console.log('aic result:', JSON.stringify(aic, null, 2));

// brute: all type1 pairs with digit 5
const targets = [rc(1,3), rc(3,7), rc(3,9)];
function seesAll(cell: number, A: {cells:number[]}, B: {cells:number[]}) {
  if (A.cells.includes(cell) || B.cells.includes(cell)) return false;
  for (const ac of A.cells) for (const bc of B.cells) {
    if (ac===bc) return false;
    if (!PEERS_OF[cell]!.includes(ac) || !PEERS_OF[cell]!.includes(bc)) return false;
  }
  return true;
}
const bit = maskOf(5);
const nodes5 = graph.nodes.map((n,i) => ({n,i})).filter(x => x.n.digit===5);
for (let a=0;a<nodes5.length;a++) for (let b=a+1;b<nodes5.length;b++) {
  const A = nodes5[a]!.n, B = nodes5[b]!.n;
  const elims: number[] = [];
  for (let c=0;c<81;c++) {
    if (grid.get(c)!==0 || !(grid.candidatesOf(c)&bit)) continue;
    if (seesAll(c, A, B)) elims.push(c);
  }
  if (targets.every(t => elims.includes(t))) {
    const lab = (n: typeof A) => `R${Math.floor(n.cells[0]!/9)+1}C${n.cells[0]!%9+1}`;
    console.log('type1 pair', lab(A), lab(B), 'elims', elims.map(c=>`R${Math.floor(c/9)+1}C${c%9+1}`));
  }
}