import { ALL_CANDIDATES, Grid, maskOf } from '../src/grid.js';

export function makeCandidateGrid(candidatesByCell: Record<number, number[]>): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  for (let cell = 0; cell < 81; cell++) grid.candidates[cell] = 0;
  for (const [k, digits] of Object.entries(candidatesByCell)) {
    const cell = Number(k);
    let mask = 0;
    for (const d of digits) mask |= maskOf(d);
    grid.candidates[cell] = mask;
  }
  return grid;
}

export function withDefaultCandidates(
  candidatesByCell: Record<number, number[]>,
  defaults: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9],
): Grid {
  const grid = Grid.fromString('0'.repeat(81));
  let defaultMask = 0;
  for (const d of defaults) defaultMask |= maskOf(d);
  for (let cell = 0; cell < 81; cell++) grid.candidates[cell] = defaultMask || ALL_CANDIDATES;
  for (const [k, digits] of Object.entries(candidatesByCell)) {
    const cell = Number(k);
    let mask = 0;
    for (const d of digits) mask |= maskOf(d);
    grid.candidates[cell] = mask;
  }
  return grid;
}
