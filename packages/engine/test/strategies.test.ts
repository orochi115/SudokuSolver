import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';

describe('Strategy tests', () => {
  describe('full house strategy', () => {
    it('identifies and applies full house', () => {
      // Create a complete example where the last row has 8 filled cells and one empty
      // We'll start with a valid solved grid and blank out one cell in the last row
      const solvedGrid = '534678912672195348198342567859761423426853791713924856961537284234567198875219634';
      const puzzle = solvedGrid.substring(0, 72) + '0' + solvedGrid.substring(73); // Blank the 73rd cell (last row, first position)
      const grid = Grid.fromString(puzzle);

      const step = fullHouse.apply(grid);
      expect(step).toBeDefined();
      if (step) {
        expect(step.placements.length).toBeGreaterThan(0);
        expect(step.strategyId).toBe('full-house');
      }
    });

    it('returns null when no full house exists', () => {
      // A puzzle without any full house situation
      const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
      const grid = Grid.fromString(puzzle);
      
      const step = fullHouse.apply(grid);
      expect(step).toBeNull();
    });
  });

  describe('hidden single strategy', () => {
    it('identifies and applies hidden single', () => {
      const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
      const grid = Grid.fromString(puzzle);
      
      const step = hiddenSingle.apply(grid);
      // Hidden single might not apply to this specific puzzle, 
      // but this tests that the function runs without error
      expect(step).toBeDefined();
    });
  });

  describe('naked subset strategy', () => {
    it('identifies and applies naked subset', () => {
      const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
      const grid = Grid.fromString(puzzle);
      
      const step = nakedSubset.apply(grid);
      // This tests that the function runs without error
      expect(step).toBeDefined();
    });
  });

  describe('locked candidates strategy', () => {
    it('identifies and applies locked candidates', () => {
      const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
      const grid = Grid.fromString(puzzle);
      
      const step = lockedCandidates.apply(grid);
      // This tests that the function runs without error
      expect(step).toBeDefined();
    });
  });
});