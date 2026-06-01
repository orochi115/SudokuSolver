import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Grid } from '../src/grid.js';
import { fullHouse } from '../src/strategies/full-house.js';
import { hiddenSingle } from '../src/strategies/hidden-single.js';
import { lockedCandidates } from '../src/strategies/locked-candidates.js';
import { nakedSubset } from '../src/strategies/naked-subset.js';
import { hiddenSubset } from '../src/strategies/hidden-subset.js';
import { basicFish } from '../src/strategies/basic-fish.js';
import { singleDigitPatterns } from '../src/strategies/single-digit-patterns.js';
import { xyWing } from '../src/strategies/xy-wing.js';
import { xyzWing } from '../src/strategies/xyz-wing.js';
import { wWing } from '../src/strategies/w-wing.js';
import { solve } from '../src/solver.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { checkTraceSoundness } from '../src/soundness.js';
import { solveBruteforce } from '../src/bruteforce.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('full-house', () => {
  it('finds the last empty cell in a house', () => {
    const s = Grid.fromString(
      '123456780' +
      '123456789'.repeat(8)
    );
    const step = fullHouse.apply(s);
    expect(step).not.toBeNull();
    expect(step!.placements).toHaveLength(1);
    expect(step!.placements[0]!.cell).toBe(8);
    expect(step!.placements[0]!.digit).toBe(9);
    expect(step!.strategyId).toBe('full-house');
  });

  it('returns null when no full house', () => {
    const s = Grid.fromString(
      '530070000' +
      '600195000' +
      '098000060' +
      '800060003' +
      '400803001' +
      '700020006' +
      '060000280' +
      '000419005' +
      '000080079'
    );
    expect(fullHouse.apply(s)).toBeNull();
  });
});

describe('hidden-single', () => {
  it('finds a hidden single on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = hiddenSingle.apply(g);
    expect(step).not.toBeNull();
    expect(step!.strategyId).toBe('hidden-single');
    expect(step!.placements).toHaveLength(1);
  });
});

describe('locked-candidates', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = lockedCandidates.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('locked-candidates');
      expect(step.eliminations.length).toBeGreaterThan(0);
    }
  });
});

describe('naked-subset', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = nakedSubset.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('naked-subset');
    }
  });
});

describe('hidden-subset', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = hiddenSubset.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('hidden-subset');
    }
  });
});

describe('basic-fish', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = basicFish.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('basic-fish');
    }
  });
});

describe('single-digit-patterns', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = singleDigitPatterns.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('single-digit-patterns');
    }
  });
});

describe('xy-wing', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = xyWing.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('xy-wing');
    }
  });
});

describe('xyz-wing', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = xyzWing.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('xyz-wing');
    }
  });
});

describe('w-wing', () => {
  it('returns a valid step or null on an easy puzzle', () => {
    const p = '050703060007000800000816000000030000005000100730040086906000204840572093000409000';
    const g = Grid.fromString(p);
    const step = wWing.apply(g);
    if (step !== null) {
      expect(step.strategyId).toBe('w-wing');
    }
  });
});

describe('strategy registry', () => {
  it('all required strategy ids are registered', () => {
    const ids = STRATEGIES.map((s) => s.id);
    const required = [
      'full-house',
      'naked-single',
      'hidden-single',
      'locked-candidates',
      'naked-subset',
      'hidden-subset',
      'basic-fish',
      'single-digit-patterns',
      'xy-wing',
      'xyz-wing',
      'w-wing',
    ];
    for (const id of required) {
      expect(ids).toContain(id);
    }
  });

  it('strategies are ordered by difficulty ascending', () => {
    for (let i = 1; i < STRATEGIES.length; i++) {
      expect(STRATEGIES[i]!.difficulty).toBeGreaterThanOrEqual(STRATEGIES[i - 1]!.difficulty);
    }
  });
});

describe('soundness: first 10 easy puzzles', () => {
  it('produces only sound traces', () => {
    const file = resolve(__dirname, '../../../data/ground-truth/easy.json');
    const records: { puzzle: string; solution: string }[] = JSON.parse(readFileSync(file, 'utf8'));
    for (let i = 0; i < 10; i++) {
      const rec = records[i]!;
      const grid = Grid.fromString(rec.puzzle);
      const trace = solve(grid, STRATEGIES);
      const result = checkTraceSoundness(trace, rec.solution);
      expect(result.sound).toBe(true);
    }
  });
});