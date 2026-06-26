import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { multiColoring, medusa3d } from '../src/strategies/coloring-advanced.js';
import { solveBruteforce } from '../src/bruteforce.js';

function assertSound(puzzle: string, step: ReturnType<typeof multiColoring.apply>) {
  expect(step).not.toBeNull();
  const sol = solveBruteforce(puzzle)!;
  for (const p of step!.placements) expect(Number(sol[p.cell])).toBe(p.digit);
  for (const e of step!.eliminations) expect(Number(sol[e.cell])).not.toBe(e.digit);
  expect(step!.highlights.links.length + step!.highlights.cells.length).toBeGreaterThan(0);
  expect(step!.explanation.zh.length).toBeGreaterThan(0);
  expect(step!.explanation.en.length).toBeGreaterThan(0);
}

describe('coloring-advanced apply soundness', () => {
  it('multi-coloring fires sound steps on X-Colors examples', () => {
    const puzzles = [
      '401708003000501000000002017802604071000000000140809306900200000000003000500406108',
      '000084000080309000001257800240090058108405900060728431710942086000800000804500109',
      '092700604040060000076020593050148762020090005061572030204030050030010000600209340',
    ];
    for (const p of puzzles) {
      assertSound(p, multiColoring.apply(Grid.fromString(p)));
    }
  });

  it('3d-medusa fires sound steps on worked examples', () => {
    const puzzles = [
      '290000030000020070000109402800760200600000007009045008903407000060030000050000084',
      '100056000043090000800003002000000010950421037020000000300900005000010970000670001',
      '093804500005600000206070000020060040000208000070040090000010703000002600002507180',
      '900407000876050004000200030060000100430000059005000060090002000200030486000708002',
      '300050000250300010004607500090200805070000030408005060005408300030006084000020006',
    ];
    for (const p of puzzles) {
      assertSound(p, medusa3d.apply(Grid.fromString(p)));
    }
  });
});