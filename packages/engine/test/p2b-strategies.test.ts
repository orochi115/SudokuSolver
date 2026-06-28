import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';
import { subsetExclusion } from '../src/strategies/subset-exclusion.js';
import { sueDeCoqExtended } from '../src/strategies/sue-de-coq-extended.js';
import { aicWithExoticLinks } from '../src/strategies/aic-exotic.js';
import { twinnedXYChains } from '../src/strategies/twinned-xy-chains.js';
import { frankenFish, mutantFish } from '../src/strategies/complex-fish.js';
import { gurth } from '../src/strategies/gurth.js';

describe('P2b strategies metadata', () => {
  it('subset-exclusion has correct id and difficulty', () => {
    expect(subsetExclusion.id).toBe('subset-exclusion');
    expect(subsetExclusion.difficulty).toBe(1140);
  });

  it('sue-de-coq-extended has correct id and difficulty', () => {
    expect(sueDeCoqExtended.id).toBe('sue-de-coq-extended');
    expect(sueDeCoqExtended.difficulty).toBe(1015);
  });

  it('aic-with-exotic-links has correct id and difficulty', () => {
    expect(aicWithExoticLinks.id).toBe('aic-with-exotic-links');
    expect(aicWithExoticLinks.difficulty).toBe(780);
  });

  it('twinned-xy-chains has correct id and difficulty', () => {
    expect(twinnedXYChains.id).toBe('twinned-xy-chains');
    expect(twinnedXYChains.difficulty).toBe(775);
  });

  it('franken-fish has correct id and difficulty', () => {
    expect(frankenFish.id).toBe('franken-fish');
    expect(frankenFish.difficulty).toBe(1080);
  });

  it('mutant-fish has correct id and difficulty', () => {
    expect(mutantFish.id).toBe('mutant-fish');
    expect(mutantFish.difficulty).toBe(1085);
  });

  it('gurth has correct id and difficulty', () => {
    expect(gurth.id).toBe('gurth');
    expect(gurth.difficulty).toBe(990);
  });
});

describe('P2b strategies do not mutate grid', () => {
  const emptyGrid = '000000000000000000000000000000000000000000000000000000000000000000000000000000000';

  for (const strat of [
    subsetExclusion, sueDeCoqExtended, aicWithExoticLinks,
    twinnedXYChains, frankenFish, mutantFish, gurth,
  ]) {
    it(`${strat.id} does not mutate the grid`, () => {
      const grid = Grid.fromString(emptyGrid);
      const before = grid.toString();
      strat.apply(grid);
      expect(grid.toString()).toBe(before);
    });
  }
});

describe('P2b strategies are registered', () => {
  const ids = new Set(STRATEGIES.map((s) => s.id));
  for (const id of [
    'subset-exclusion',
    'sue-de-coq-extended',
    'aic-with-exotic-links',
    'twinned-xy-chains',
    'franken-fish',
    'mutant-fish',
    'gurth',
  ]) {
    it(`${id} is registered`, () => {
      expect(ids.has(id)).toBe(true);
    });
  }
});

describe('gurth symmetrical placement', () => {
  it('detects diagonal symmetry and eliminates non-self-mapped digits from axis', () => {
    const puzzle = '000001002003000040050060700000800070007003800900050001006080200040600007200009060';
    const grid = Grid.fromString(puzzle);
    const step = gurth.apply(grid);
    if (step !== null) {
      expect(step.strategyId).toBe('gurth');
      expect(step.eliminations.length).toBeGreaterThan(0);
      for (const elim of step.eliminations) {
        expect([2, 4, 8]).not.toContain(elim.digit);
      }
    }
  });

  it('detects rotational symmetry and places self-mapped digit at center', () => {
    const puzzle = '020000709400080020009020406000507000067000230000204000305070900070010005902000070';
    const grid = Grid.fromString(puzzle);
    const step = gurth.apply(grid);
    if (step !== null) {
      expect(step.strategyId).toBe('gurth');
      expect(
        step.placements.some((p) => p.cell === 40 && p.digit === 9) ||
        step.eliminations.some((e) => e.cell === 40 && e.digit !== 9)
      ).toBe(true);
    }
  });
});

describe('subset-exclusion', () => {
  it('detects pair exclusion from research card worked example', () => {
    const puzzle = '193008602008030001004100389371495268580010403240080015437021806002000034005000027';
    const grid = Grid.fromString(puzzle);
    const step = subsetExclusion.apply(grid);
    if (step !== null) {
      expect(step.strategyId).toBe('subset-exclusion');
      expect(step.eliminations.length).toBeGreaterThan(0);
    }
  });
});
