import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';

describe('full-house strategy', () => {
  it('places the only missing digit in a house', () => {
    const puzzle =
      '123456780' +
      '000000000'.repeat(8);
    const step = fullHouse.apply(Grid.fromString(puzzle));

    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('full-house');
    expect(step!.placements).toEqual([{ cell: 8, digit: 9 }]);
    expect(step!.eliminations).toEqual([]);
  });
});
