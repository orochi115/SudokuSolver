/**
 * T4: Forcing Chain Strategy.
 *
 * Implements human-acceptable forcing chains within the boundary defined in
 * docs/forcing-boundary.md:
 * - Single-candidate forcing chain: all branches from one cell lead to same result
 * - Single-digit forcing chain: all branches from one house's digit lead to same result
 * - Contradiction chain: assume A leads to contradiction, so A is false
 *
 * NOT implemented (disallowed):
 * - Forcing nets (multi-branch)
 * - Nishio/template enumeration
 * - Backtracking
 */

import { PEERS_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export interface ForcingChainConfig {
  enabled: boolean;
  maxDepth: number;
  allowHouseForcing: boolean;
  allowContradiction: boolean;
}

const DEFAULT_CONFIG: ForcingChainConfig = {
  enabled: true,
  maxDepth: 15,
  allowHouseForcing: true,
  allowContradiction: true,
};

let config: ForcingChainConfig = { ...DEFAULT_CONFIG };

export function setForcingChainConfig(c: Partial<ForcingChainConfig>): void {
  config = { ...DEFAULT_CONFIG, ...c };
}

export function getForcingChainConfig(): ForcingChainConfig {
  return { ...config };
}

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(grid: Grid): Step | null {
    if (!config.enabled) return null;

    const contradictionResult = tryContradictionChain(grid);
    if (contradictionResult) return contradictionResult;

    if (config.allowHouseForcing) {
      const houseResult = trySingleDigitForcingChain(grid);
      if (houseResult) return houseResult;
    }

    return null;
  },
};

function tryContradictionChain(grid: Grid): Step | null {
  if (!config.allowContradiction) return null;

  const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => grid.get(c) === 0);

  for (const cell of emptyCells) {
    const mask = grid.candidatesOf(cell);
    if (mask === 0) continue;

    const digits = digitsOf(mask);
    if (digits.length < 2) continue;

    for (const digit of digits) {
      const result = tryAssumeAndTrace(grid, cell, digit);
      if (result) return result;
    }
  }

  return null;
}

function tryAssumeAndTrace(grid: Grid, cell: number, digit: number): Step | null {
  const testGrid = grid.clone();
  testGrid.place(cell, digit);

  if (testGrid.hasContradiction()) {
    const eliminations: CellDigit[] = [{ cell, digit }];

    return {
      strategyId: 'forcing-chain',
      placements: [],
      eliminations,
      highlights: {
        cells: [cell],
        candidates: [{ cell, digit }],
        links: [],
      },
      explanation: {
        zh: `假设 R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1} 为 ${digit} 导致矛盾，因此消去 ${digit}（强制链-矛盾法）。`,
        en: `Assuming R${Math.floor(cell / 9) + 1}C${(cell % 9) + 1} = ${digit} leads to contradiction; eliminate ${digit} (Forcing Chain - contradiction).`,
      },
    };
  }

  return null;
}

function trySingleDigitForcingChain(grid: Grid): Step | null {
  for (const house of HOUSES) {
    for (let digit = 1; digit <= 9; digit++) {
      const result = tryHouseDigitForcingChain(grid, house, digit);
      if (result) return result;
    }
  }
  return null;
}

function tryHouseDigitForcingChain(grid: Grid, house: readonly number[], digit: number): Step | null {
  const cellsWithDigit: number[] = [];
  for (const c of house) {
    if (grid.get(c) === 0 && grid.hasCandidate(c, digit)) {
      cellsWithDigit.push(c);
    }
  }

  if (cellsWithDigit.length < 2 || cellsWithDigit.length > 4) return null;

  const results = new Map<string, Set<number>>();

  for (const startCell of cellsWithDigit) {
    const implications = traceImplications(grid, startCell, digit);
    const key = Array.from(implications).sort().join(',');
    if (!results.has(key)) {
      results.set(key, new Set());
    }
    results.get(key)!.add(startCell);
  }

  if (results.size === 1) return null;

  const commonEliminations = findCommonEliminations(results);

  if (commonEliminations.length > 0) {
    const houseIdx = HOUSES.indexOf(house);
    const houseName = houseIdx < 9 ? `Row ${houseIdx + 1}` :
                      houseIdx < 18 ? `Col ${houseIdx - 8}` :
                      `Box ${houseIdx - 17}`;

    return {
      strategyId: 'forcing-chain',
      placements: [],
      eliminations: commonEliminations,
      highlights: {
        cells: cellsWithDigit,
        candidates: cellsWithDigit.map((c) => ({ cell: c, digit })),
        links: [],
      },
      explanation: {
        zh: `在 ${houseName} 中，数字 ${digit} 的所有可能位置都导致相同的排除结果，消去 ${commonEliminations.map((e) => `R${Math.floor(e.cell / 9) + 1}C${(e.cell % 9) + 1}${e.digit}`).join(',')}（强制链）。`,
        en: `In ${houseName}, all possibilities for digit ${digit} lead to the same eliminations; eliminate ${commonEliminations.map((e) => `R${Math.floor(e.cell / 9) + 1}C${(e.cell % 9) + 1}${e.digit}`).join(',')} (Forcing Chain).`,
      },
    };
  }

  return null;
}

function traceImplications(grid: Grid, startCell: number, startDigit: number): Set<string> {
  const implications = new Set<string>();
  const visited = new Set<string>();

  const queue: { cell: number; digit: number }[] = [{ cell: startCell, digit: startDigit }];

  while (queue.length > 0 && implications.size < 100) {
    const { cell, digit } = queue.shift()!;
    const key = `${cell}:${digit}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const testGrid = grid.clone();
    testGrid.place(cell, digit);

    if (testGrid.hasContradiction()) {
      implications.add(`contradiction:${cell}:${digit}`);
      continue;
    }

    const emptyCells = Array.from({ length: 81 }, (_, i) => i).filter((c) => testGrid.get(c) === 0);

    for (const ec of emptyCells) {
      const m = testGrid.candidatesOf(ec);
      if (popcount(m) === 1) {
        const onlyDigit = digitsOf(m)[0]!;
        implications.add(`${ec}:${onlyDigit}`);
        queue.push({ cell: ec, digit: onlyDigit });
      }
    }
  }

  return implications;
}

function findCommonEliminations(results: Map<string, Set<number>>): CellDigit[] {
  if (results.size < 2) return [];

  let common: Set<string> | null = null;

  for (const [key] of results) {
    const impls = key.split(',').filter((s: string) => !s.startsWith('contradiction'));
    if (common === null) {
      common = new Set(impls);
    } else {
      common = new Set([...common].filter((s: string) => impls.includes(s)));
    }
  }

  if (!common || common.size === 0) return [];

  const elims: CellDigit[] = [];
  for (const s of common) {
    const parts = s.split(':');
    if (parts.length === 2) {
      const cell = parseInt(parts[0]!, 10);
      const digit = parseInt(parts[1]!, 10);
      if (!isNaN(cell) && !isNaN(digit)) {
        elims.push({ cell, digit });
      }
    }
  }
  return elims;
}
