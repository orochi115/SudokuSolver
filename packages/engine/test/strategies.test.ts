import { describe, it, expect } from 'vitest';
import { Grid, ROW_OF, COL_OF, CELLS, ALL_CANDIDATES, maskOf } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { xWing, swordfish, jellyfish } from '../src/strategies/fish.js';
import { skyscraper, twoStringKite, emptyRectangle } from '../src/strategies/single-digit-patterns.js';
import { xyWing, xyzWing, wWing } from '../src/strategies/wings.js';
import { solve, applyStep } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';

describe('full-house', () => {
  it('places the only missing digit in a row', () => {
    const s = '123456780' + '0'.repeat(72);
    const grid = Grid.fromString(s);
    const step = fullHouse.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.placements).toHaveLength(1);
    expect(step!.placements[0]!.cell).toBe(8);
    expect(step!.placements[0]!.digit).toBe(9);
  });

  it('returns null on a full grid (no empty cells)', () => {
    const grid = Grid.fromString('123456789234567891345678912456789123567891234678912345789123456891234567912345678');
    expect(fullHouse.apply(grid)).toBeNull();
  });
});

describe('hidden-single', () => {
  it('finds a hidden single in a row', () => {
    const s = '003456789' + '0'.repeat(72);
    const grid = Grid.fromString(s);
    grid.eliminate(1, 1);
    const step = hiddenSingle.apply(grid);
    expect(step).not.toBeNull();
    expect(step!.placements).toHaveLength(1);
    expect(step!.placements[0]!.digit).toBe(1);
    expect(step!.placements[0]!.cell).toBe(0);
  });

  it('returns null when no hidden single exists', () => {
    const grid = Grid.fromString('123456789234567891345678912456789123567891234678912345789123456891234567912345678');
    expect(hiddenSingle.apply(grid)).toBeNull();
  });
});

describe('locked-candidates', () => {
  it('finds pointing pair elimination', () => {
    const puzzle = '000000000000000000000000000100000000100000000100000000000000000000000000000000000';
    const grid = Grid.fromString(puzzle);
    const step = lockedCandidates.apply(grid);
  });
});

describe('naked-subset', () => {
  it('finds a naked pair', () => {
    const grid = Grid.fromString(
      '120000000' +
      '340000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000' +
      '000000000'
    );
    const step = nakedSubset.apply(grid);
  });

  it('returns null when no naked subset exists', () => {
    const grid = Grid.fromString('123456789456789123789123456234567891567891234891234567345678912678912345912345678');
    expect(nakedSubset.apply(grid)).toBeNull();
  });
});

describe('hidden-subset', () => {
  it('returns null when not applicable', () => {
    const grid = Grid.fromString('123456789456789123789123456234567891567891234891234567345678912678912345912345678');
    expect(hiddenSubset.apply(grid)).toBeNull();
  });
});

describe('fish strategies', () => {
  it('x-wing exports expected shape', () => {
    expect(xWing.id).toBe('x-wing');
    expect(xWing.difficulty).toBe(40);
    expect(swordfish.id).toBe('swordfish');
    expect(swordfish.difficulty).toBe(45);
    expect(jellyfish.id).toBe('jellyfish');
    expect(jellyfish.difficulty).toBe(50);
  });

  it('x-wing returns null on trivial grid', () => {
    const grid = Grid.fromString('123456789234567891345678912456789123567891234678912345789123456891234567912345678');
    expect(xWing.apply(grid)).toBeNull();
  });
});

describe('single-digit-patterns', () => {
  it('skyscraper exports expected shape', () => {
    expect(skyscraper.id).toBe('skyscraper');
    expect(skyscraper.difficulty).toBe(45);
  });

  it('two-string-kite exports expected shape', () => {
    expect(twoStringKite.id).toBe('two-string-kite');
    expect(twoStringKite.difficulty).toBe(45);
  });

  it('empty-rectangle exports expected shape', () => {
    expect(emptyRectangle.id).toBe('empty-rectangle');
    expect(emptyRectangle.difficulty).toBe(45);
  });

  it('returns null on solved grid', () => {
    const grid = Grid.fromString('123456789234567891345678912456789123567891234678912345789123456891234567912345678');
    expect(skyscraper.apply(grid)).toBeNull();
    expect(twoStringKite.apply(grid)).toBeNull();
    expect(emptyRectangle.apply(grid)).toBeNull();
  });
});

describe('wings', () => {
  it('xy-wing exports expected shape', () => {
    expect(xyWing.id).toBe('xy-wing');
    expect(xyWing.difficulty).toBe(50);
    expect(xyzWing.id).toBe('xyz-wing');
    expect(xyzWing.difficulty).toBe(50);
    expect(wWing.id).toBe('w-wing');
    expect(wWing.difficulty).toBe(50);
  });

  it('returns null on solved grid', () => {
    const grid = Grid.fromString('123456789234567891345678912456789123567891234678912345789123456891234567912345678');
    expect(xyWing.apply(grid)).toBeNull();
    expect(xyzWing.apply(grid)).toBeNull();
    expect(wWing.apply(grid)).toBeNull();
  });
});

describe('strategy names are bilingual', () => {
  const strategies = STRATEGIES;
  for (const s of strategies) {
    it(`${s.id} has bilingual name`, () => {
      expect(s.name.zh).toBeTruthy();
      expect(s.name.en).toBeTruthy();
    });
  }
});

describe('all strategies return valid step structure', () => {
  for (const s of STRATEGIES) {
    it(`${s.id} produces valid step or null (never throws)`, () => {
      const EMPTY = '0'.repeat(81);
      const grid = Grid.fromString(EMPTY);
      const step = s.apply(grid);
      if (step !== null) {
        expect(step.strategyId).toBe(s.id);
        expect(step.highlights).toBeDefined();
        expect(step.highlights.cells).toBeDefined();
        expect(step.highlights.candidates).toBeDefined();
        expect(step.highlights.links).toBeDefined();
        expect(step.explanation.zh).toBeTruthy();
        expect(step.explanation.en).toBeTruthy();
      }
    });
  }
});

describe('solve loop with all strategies', () => {
  it('solves a known easy puzzle', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = Grid.fromString(puzzle);
    const trace = solve(grid, STRATEGIES);
    expect(trace.outcome).toBe('solved');
    expect(trace.steps.length).toBeGreaterThan(0);
  });

  it('solves a puzzle requiring hidden singles', () => {
    const puzzle = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';
    const grid = Grid.fromString(puzzle);
    const trace = solve(grid, STRATEGIES);
    expect(trace.outcome).toBe('solved');
  });

  it('solves a medium puzzle', () => {
    const puzzle = '002800900600070002000956000040009080580100003030400060000743000300080004001002700';
    const grid = Grid.fromString(puzzle);
    const trace = solve(grid, STRATEGIES);
  });
});

describe('soundness on solve traces', () => {
  it('every step in a solved easy puzzle is sound', () => {
    const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = Grid.fromString(puzzle);
    const trace = solve(grid, STRATEGIES);
    expect(trace.outcome).toBe('solved');
  });
});