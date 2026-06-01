import { Grid, maskOf } from '../src/grid.js';

const SOLVED_SEED = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

export function makeCandidateGrid(candidatesByCell: Record<number, number[]>): Grid {
  const grid = Grid.fromString(SOLVED_SEED);
  for (const [rawCell, digits] of Object.entries(candidatesByCell)) {
    const cell = Number(rawCell);
    grid.values[cell] = 0;
    let mask = 0;
    for (const d of digits) mask |= maskOf(d);
    grid.candidates[cell] = mask;
  }
  return grid;
}
