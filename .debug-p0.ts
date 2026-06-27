import { Grid, ROW_OF, COL_OF, BOX_OF, maskOf } from './packages/engine/src/grid.js';
import { finnedXWing, finnedSwordfish } from './packages/engine/src/strategies/finned-fish.js';
import { xyChain } from './packages/engine/src/strategies/chains.js';
import { xWing } from './packages/engine/src/strategies/basic-fish.js';
import { buildLinkGraph } from './packages/engine/src/chain/graph.js';
import { searchXyChain } from './packages/engine/src/chain/xy-chain-search.js';
import { DEFAULT_CHAIN_POLICY } from './packages/engine/src/chain/policy.js';
import { rc } from './packages/engine/src/worked-example-verify.js';

const p1 = '300002500000080060080700041700001300000070000008200005510008020030090000004500009';
const g1 = Grid.fromString(p1);
console.log('finned x-wing:', JSON.stringify(finnedXWing.apply(g1), null, 2));
console.log('basic x-wing:', JSON.stringify(xWing.apply(g1)?.eliminations));

const bit4 = maskOf(4);
console.log('digit 4 candidates:');
for (let c = 0; c < 81; c++) {
  if (g1.get(c) === 0 && (g1.candidatesOf(c) & bit4)) {
    console.log(`  R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1} box${BOX_OF[c]! + 1}`);
  }
}

const p2 = '420000095000000000001903400060802010042010980090406030007604800000000000680000041';
console.log('\nfinned swordfish:', JSON.stringify(finnedSwordfish.apply(Grid.fromString(p2))?.eliminations));

const p3 = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';
const g3 = Grid.fromString(p3);
console.log('\nxy-chain:', JSON.stringify(xyChain.apply(g3)?.eliminations));
const graph = buildLinkGraph(g3, { grouped: false });
const xy = searchXyChain(g3, graph, DEFAULT_CHAIN_POLICY);
console.log('searchXyChain:', xy?.eliminations, 'endDigit:', xy?.endDigit);