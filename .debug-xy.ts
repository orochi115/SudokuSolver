import { Grid, ROW_OF, COL_OF, popcount } from './packages/engine/src/grid.js';
import { buildLinkGraph } from './packages/engine/src/chain/graph.js';
import { searchAic } from './packages/engine/src/chain/aic-search.js';
import { searchXyChain } from './packages/engine/src/chain/xy-chain-search.js';
import { DEFAULT_CHAIN_POLICY } from './packages/engine/src/chain/policy.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
const grid = Grid.fromString(puzzle);
const graph = buildLinkGraph(grid, { grouped: false });

console.log('nodes', graph.nodes.length);
let bivalue = 0;
for (let i = 0; i < graph.nodes.length; i++) {
  const n = graph.nodes[i]!;
  if (n.cells.length === 1 && popcount(grid.candidatesOf(n.cells[0]!)) === 2) bivalue++;
}
console.log('bivalue nodes', bivalue);

const aic = searchAic(grid, graph, DEFAULT_CHAIN_POLICY);
console.log('aic:', aic?.eliminations?.length, aic?.kind, aic?.chainNodes?.length);

const xy = searchXyChain(grid, graph, DEFAULT_CHAIN_POLICY);
console.log('xy:', xy?.eliminations, xy?.endDigit);

// Check if digit 5 eliminations exist via aic
if (aic) {
  const targets = [rc(1,3), rc(3,7), rc(3,9)];
  for (const t of targets) {
    console.log('aic has', t, aic.eliminations.some(e => e.cell===t && e.digit===5));
  }
}