import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Grid } from '../src/grid.js';
import { STRATEGIES } from '../src/strategies/index.js';

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

const P1_SOURCE = fileURLToPath(new URL('../src/strategies/p1-advanced.ts', import.meta.url));

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
    const source = readFileSync(P1_SOURCE, 'utf8');
    expect(source).not.toMatch(/solveBruteforce|countSolutions|findGroundTruth/);
  });
});
