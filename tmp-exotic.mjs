import { Grid } from './packages/engine/src/grid.js';
import { frankenFish, mutantFish, tridagon, alignedPairExclusion, alignedTripleExclusion, subsetExclusion, exocet, skLoop, msls } from './packages/engine/src/strategies/p2a-exotic.js';
const grid = Grid.fromString('900374185457218693183695472534867219619542308278931564700480051395726840840153726');
const list = [
  { name: 'franken-fish', fn: frankenFish },
  { name: 'mutant-fish', fn: mutantFish },
  { name: 'tridagon', fn: tridagon },
  { name: 'aligned-pair-exclusion', fn: alignedPairExclusion },
  { name: 'aligned-triple-exclusion', fn: alignedTripleExclusion },
  { name: 'subset-exclusion', fn: subsetExclusion },
  { name: 'exocet', fn: exocet },
  { name: 'sk-loop', fn: skLoop },
  { name: 'msls', fn: msls },
];
for (const { name, fn } of list) {
  const t0 = Date.now();
  const to = setTimeout(() => { console.log(name, 'TIMEOUT'); process.exit(0); }, 10000);
  const step = fn.apply(grid);
  clearTimeout(to);
  console.log(name, Date.now() - t0, 'ms', step ? step.placements.length + step.eliminations.length : 0);
}
