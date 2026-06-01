import { describe, it, expect } from 'vitest';
import { solveBruteforce, countSolutions, findGroundTruth } from '../src/bruteforce.js';

const PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

describe('bruteforce', () => {
  it('solves a known puzzle to the known solution', () => {
    expect(solveBruteforce(PUZZLE)).toBe(SOLUTION);
  });

  it('reports a unique puzzle as having exactly one solution', () => {
    expect(countSolutions(PUZZLE, 2)).toBe(1);
  });

  it('reports a near-empty grid as having many solutions', () => {
    const sparse = '1' + '0'.repeat(80);
    expect(countSolutions(sparse, 2)).toBe(2); // capped at the limit
  });

  it('findGroundTruth combines solution + uniqueness', () => {
    const gt = findGroundTruth(PUZZLE);
    expect(gt.solution).toBe(SOLUTION);
    expect(gt.unique).toBe(true);
  });
});
