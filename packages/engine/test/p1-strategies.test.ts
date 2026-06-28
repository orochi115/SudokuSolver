import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { solveBruteforce } from '../src/bruteforce.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { verifyDeductions } from '../src/worked-example-verify.js';
import { multiColoring } from '../src/strategies/multi-coloring.js';
import { medusa3D } from '../src/strategies/3d-medusa.js';
import { remotePairs, wxyzWing } from '../src/strategies/advanced-wings.js';
import { alsChain, ahs } from '../src/strategies/als-chain.js';
import { aicWithALS, aicWithUR } from '../src/strategies/aic-extended.js';
import { tridagon } from '../src/strategies/tridagon.js';
import {
  avoidableRectangleType1,
  bugLite,
  extendedUniqueRectangle,
  uniqueLoop,
} from '../src/strategies/uniqueness-p1.js';

const REQUIRED_P1_IDS = [
  'finned-x-wing',
  'finned-swordfish',
  'finned-jellyfish',
  'nice-loop',
  'xy-chain',
  'turbot-fish',
  'hidden-unique-rectangle',
  'unique-rectangle-type-3',
  'unique-rectangle-type-5',
  'unique-rectangle-type-6',
  'tridagon',
  'multi-coloring',
  '3d-medusa',
  'als-chain',
  'ahs',
  'wxyz-wing',
  'remote-pairs',
  'bent-sets',
  'broken-wing',
  'avoidable-rectangle-type-1',
  'avoidable-rectangle-type-2',
  'avoidable-rectangle-type-3',
  'avoidable-rectangle-type-4',
  'extended-unique-rectangle',
  'unique-loop',
  'bug-lite',
  'bug-plus-n',
  'aic-with-als',
  'aic-with-ur',
] as const;

const STRATEGIES_DIR = fileURLToPath(new URL('../src/strategies', import.meta.url));

const P1_SOURCE_FILES = [
  'multi-coloring.ts',
  '3d-medusa.ts',
  'advanced-wings.ts',
  'als-chain.ts',
  'aic-extended.ts',
  'uniqueness-p1.ts',
  'tridagon.ts',
];

function rc(row: number, col: number): number {
  return (row - 1) * 9 + (col - 1);
}

function assertSound(puzzle: string, step: NonNullable<ReturnType<typeof multiColoring.apply>>): void {
  const solution = solveBruteforce(puzzle);
  expect(solution).not.toBeNull();
  const result = checkTraceSoundness({ initial: puzzle, steps: [step], outcome: 'stuck', final: puzzle }, solution!);
  expect(result.sound).toBe(true);
}

describe('P1 strategy registration', () => {
  it('registers every required P1 strategy id exactly', () => {
    const ids = STRATEGIES.map((s) => s.id);
    for (const id of REQUIRED_P1_IDS) expect(ids.includes(id), id).toBe(true);
    for (const id of REQUIRED_P1_IDS) expect(ids.filter((registered) => registered === id).length, id).toBe(1);
  });

  it('P1 strategies are pure no-ops when they find no named pattern', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const beforeValues = [...grid.values];
    const beforeCandidates = [...grid.candidates];
    const strategies = STRATEGIES.filter((s) => REQUIRED_P1_IDS.includes(s.id as (typeof REQUIRED_P1_IDS)[number]));
    expect(strategies.length).toBe(REQUIRED_P1_IDS.length);

    for (const strategy of strategies) {
      const step = strategy.apply(grid);
      if (step) {
        expect(step.strategyId).toBe(strategy.id);
        expect(step.explanation.zh.length).toBeGreaterThan(0);
        expect(step.explanation.en.length).toBeGreaterThan(0);
        expect(Array.isArray(step.highlights.links)).toBe(true);
      }
      expect([...grid.values], strategy.id).toEqual(beforeValues);
      expect([...grid.candidates], strategy.id).toEqual(beforeCandidates);
    }
  });

  it('does not use solver/oracle APIs in P1 human-default strategy code', () => {
    for (const file of P1_SOURCE_FILES) {
      const source = readFileSync(join(STRATEGIES_DIR, file), 'utf8');
      expect(source, file).not.toMatch(/solveBruteforce|countSolutions|findGroundTruth/);
    }
  });
});

describe('multi-coloring', () => {
  it('fires sound eliminations on HoDoKu mc01', () => {
    const puzzle = '000006000007030040106080095700900850900040020400008000093050010000007000000060002';
    const step = multiColoring.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('multi-coloring');
    expect(step?.eliminations.length).toBeGreaterThan(0);
    assertSound(puzzle, step!);
  });
});

describe('3d-medusa', () => {
  it('fires sound eliminations on SudokuWiki Rule 3 puzzle', () => {
    const puzzle = '290000030000020070000109402800760200600000007009045008903407000060030000050000084';
    const step = medusa3D.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('3d-medusa');
    expect(step?.eliminations.length).toBeGreaterThan(0);
    assertSound(puzzle, step!);
  });
});

describe('wxyz-wing', () => {
  it('eliminates 4 from r8c2 (Sudopedia subset counting)', () => {
    const puzzle = '861423975000789641900615823695842137000367589000591264239176458000250396006930712';
    const step = wxyzWing.apply(Grid.fromString(puzzle));
    expect(step?.strategyId).toBe('wxyz-wing');
    expect(step?.eliminations).toEqual(expect.arrayContaining([{ cell: rc(8, 2), digit: 4 }]));
    assertSound(puzzle, step!);
  });
});

describe('research-card soundness (verifyDeductions)', () => {
  it('remote-pairs eliminations are sound on xy-chain fixture', () => {
    const result = verifyDeductions(
      '080103070000000000001408020570001039000609000920800051030905200000000000010702060',
      {
        eliminations: [
          { cell: rc(1, 3), digit: 5 },
          { cell: rc(3, 7), digit: 5 },
          { cell: rc(3, 9), digit: 5 },
        ],
      },
    );
    expect(result.ok).toBe(true);
  });

  it('avoidable rectangle type 1 ar101 elimination is sound', () => {
    const puzzle = '.5........6.5.42....8.71...4....36.8.........89.1..7..3...........2.7.1..72.3..9.'.replace(/\./g, '0');
    const result = verifyDeductions(puzzle, { eliminations: [{ cell: rc(2, 9), digit: 9 }] });
    expect(result.ok).toBe(true);
  });

  it('aic-with-ur Example A placement is sound', () => {
    const result = verifyDeductions(
      '010070050004000000600100003009435800020800100008002004050009030300080009000000500',
      { placements: [{ cell: rc(3, 5), digit: 2 }] },
    );
    expect(result.ok).toBe(true);
  });

  it('bent-sets ALP elimination is sound', () => {
    const puzzle = '6....7..4..45..7...9..4..8..8.2....3..3...2..5....3.1...1.9..6.4....51...6.3....2'.replace(/\./g, '0');
    const result = verifyDeductions(puzzle, { eliminations: [{ cell: rc(3, 1), digit: 3 }] });
    expect(result.ok).toBe(true);
  });
});

describe('als-chain / ahs', () => {
  it('als-chain does not mutate grid on empty board', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    alsChain.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });

  it('ahs does not mutate grid on empty board', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    ahs.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });
});

describe('uniqueness P1 extensions', () => {
  it('avoidable-rectangle-type-1 is registered and pure', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    avoidableRectangleType1.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });

  it('bug-lite, unique-loop, extended-ur are registered', () => {
    const ids = new Set(STRATEGIES.map((s) => s.id));
    expect(ids.has('bug-lite')).toBe(true);
    expect(ids.has('unique-loop')).toBe(true);
    expect(ids.has('extended-unique-rectangle')).toBe(true);
  });

  it('bug-lite does not mutate grid on empty board', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    bugLite.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });
});

describe('aic-with-als / aic-with-ur', () => {
  it('aic-with-als does not mutate grid on empty board', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    aicWithALS.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });

  it('aic-with-ur does not mutate grid on empty board', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    aicWithUR.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });
});

describe('tridagon', () => {
  it('does not mutate grid on empty board', () => {
    const grid = Grid.fromString('0'.repeat(81));
    const before = [...grid.candidates];
    tridagon.apply(grid);
    expect([...grid.candidates]).toEqual(before);
  });
});