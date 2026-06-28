import { Grid } from './src/grid.js';
import { STRATEGIES } from './src/strategies/index.js';

const puzzle = '060040900000369000904050206005624800600915407009783000090070050006431700001590300';
const grid = Grid.fromString(puzzle);

const strategyTimes: Record<string, number> = {};
for (const s of STRATEGIES) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < 10; i++) s.apply(grid);
  const t = Number(process.hrtime.bigint() - start) / 1e6;
  if (t > 5) strategyTimes[s.id] = t / 10;
}
console.log('slow strategies:', strategyTimes);
