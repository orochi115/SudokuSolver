import { Grid } from './packages/engine/src/grid.js';
import { HUMAN_DEFAULT_STRATEGIES } from './packages/engine/src/strategies/profiles.js';
const grid = Grid.fromString('900374185457218693183695472534867219619542308278931564700480051395726840840153726');
for (const strat of HUMAN_DEFAULT_STRATEGIES) {
  const t0 = Date.now();
  const step = strat.apply(grid);
  const dt = Date.now() - t0;
  console.log(strat.id, dt, 'ms', step ? (step.placements.length + step.eliminations.length) : 0);
}
