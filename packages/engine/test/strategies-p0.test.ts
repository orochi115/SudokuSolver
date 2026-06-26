import { describe, it, expect } from 'vitest';
import { Grid, maskOf } from '../src/grid.js';
import { finnedXWing, finnedSwordfish } from '../src/strategies/finned-fish.js';
import { turbotFish } from '../src/strategies/single-digit-patterns.js';
import { niceLoop } from '../src/strategies/nice-loop.js';
import { xyChain } from '../src/strategies/xy-chain.js';

function rc(r: number, c: number): number {
  return r * 9 + c;
}

describe('P0 Strategy Unit Tests (Hand-crafted Minimal States)', () => {
  it('finned-x-wing minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    for (let i = 0; i < 81; i++) grid.candidates[i] = 0;

    // Base rows: 0, 2. Cover columns: 0, 8. Fin: r0c1 (box 0). Target: r1c0 (box 0, col 0)
    grid.candidates[rc(0, 0)] = maskOf(1);
    grid.candidates[rc(0, 1)] = maskOf(1); // Fin
    grid.candidates[rc(0, 8)] = maskOf(1);
    grid.candidates[rc(2, 0)] = maskOf(1);
    grid.candidates[rc(2, 8)] = maskOf(1);
    grid.candidates[rc(1, 0)] = maskOf(1); // Target

    const step = finnedXWing.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('finned-x-wing');
    expect(step!.eliminations).toContainEqual({ cell: rc(1, 0), digit: 1 });
  });

  it('finned-swordfish minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    for (let i = 0; i < 81; i++) grid.candidates[i] = 0;

    // Base rows: 0, 2, 8. Cover columns: 0, 4, 8. Fin: r0c1 (box 0). Target: r1c0 (box 0, col 0)
    grid.candidates[rc(0, 0)] = maskOf(1);
    grid.candidates[rc(0, 1)] = maskOf(1); // Fin
    grid.candidates[rc(0, 4)] = maskOf(1);
    grid.candidates[rc(0, 8)] = maskOf(1);
    grid.candidates[rc(2, 0)] = maskOf(1);
    grid.candidates[rc(2, 4)] = maskOf(1);
    grid.candidates[rc(2, 8)] = maskOf(1);
    grid.candidates[rc(8, 0)] = maskOf(1);
    grid.candidates[rc(8, 4)] = maskOf(1);
    grid.candidates[rc(8, 8)] = maskOf(1);
    grid.candidates[rc(1, 0)] = maskOf(1); // Target

    const step = finnedSwordfish.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('finned-swordfish');
    expect(step!.eliminations).toContainEqual({ cell: rc(1, 0), digit: 1 });
  });

  it('turbot-fish minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    for (let i = 0; i < 81; i++) grid.candidates[i] = 0;

    // Column 5 strong link: rc(0, 5) =1= rc(4, 5)
    // Row 4 weak link: rc(4, 5) -1- rc(4, 8)
    // Column 8 strong link: rc(4, 8) =1= rc(2, 8)
    // Target: rc(0, 7) which is row 0, col 7. It sees rc(0, 5) in row 0, and rc(2, 8) in Box 2
    grid.candidates[rc(0, 5)] = maskOf(1);
    grid.candidates[rc(4, 5)] = maskOf(1);
    grid.candidates[rc(4, 8)] = maskOf(1);
    grid.candidates[rc(2, 8)] = maskOf(1);
    grid.candidates[rc(0, 7)] = maskOf(1); // Target

    const step = turbotFish.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('turbot-fish');
    expect(step!.eliminations.length).toBeGreaterThan(0);
  });

  it('xy-chain minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    for (let i = 0; i < 81; i++) grid.candidates[i] = 0;

    // C1: r0c0={1,2}. C2: r0c8={2,3}. C3: r8c8={1,3}. Target: r8c0={1}
    grid.candidates[rc(0, 0)] = maskOf(1) | maskOf(2);
    grid.candidates[rc(0, 8)] = maskOf(2) | maskOf(3);
    grid.candidates[rc(8, 8)] = maskOf(1) | maskOf(3);
    grid.candidates[rc(8, 0)] = maskOf(1); // Target

    const step = xyChain.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('xy-chain');
    expect(step!.eliminations).toContainEqual({ cell: rc(8, 0), digit: 1 });
  });

  it('nice-loop continuous minimal test case', () => {
    const grid = Grid.fromString('0'.repeat(81));
    for (let i = 0; i < 81; i++) grid.candidates[i] = 0;

    // Loop: r0c0 =1= r0c8 -1- r8c8 =1= r8c0 -1- r0c0. Target: r4c0={1}
    grid.candidates[rc(0, 0)] = maskOf(1);
    grid.candidates[rc(0, 8)] = maskOf(1);
    grid.candidates[rc(8, 8)] = maskOf(1);
    grid.candidates[rc(8, 0)] = maskOf(1);
    grid.candidates[rc(4, 0)] = maskOf(1); // Target

    const step = niceLoop.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('nice-loop');
    expect(step!.eliminations).toContainEqual({ cell: rc(4, 0), digit: 1 });
  });
});
