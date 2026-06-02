/**
 * T4: Forcing Chains.
 *
 * Forcing chains explore implications from exhaustive alternatives of a
 * limited premise. This implementation is conservative:
 * - Single-cell forcing: all candidates of one cell lead to the same result
 * - Digit forcing: all locations of one digit in one house lead to the same result
 * - Contradiction chains: prove a candidate is false by showing it leads to contradiction
 *
 * Per docs/forcing-boundary.md, we do NOT support:
 * - Multi-branch forcing nets
 * - Nishio with only one candidate tried
 * - Template enumeration
 */

import { HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'forcing-chain';

export interface ChainConfig {
  allowWeakForcing: boolean;
  allowStrongForcing: boolean;
  maxChainDepth: number;
  maxBranchingFactor: number;
}

const DEFAULT_CONFIG: ChainConfig = {
  allowWeakForcing: true,
  allowStrongForcing: false,
  maxChainDepth: 8,
  maxBranchingFactor: 1,
};

let config: ChainConfig = { ...DEFAULT_CONFIG };

export function setForcingChainConfig(cfg: Partial<ChainConfig>): void {
  config = { ...config, ...cfg };
}

export function getForcingChainConfig(): ChainConfig {
  return { ...config };
}

interface ChainNode {
  cell: number;
  digit: number;
}

interface ChainResult {
  premise: CellDigit;
  eliminations: CellDigit[];
  chain: Link[];
  type: 'weak' | 'strong';
}

function buildImplicationMap(grid: Grid): Map<string, Set<string>> {
  const implications = new Map<string, Set<string>>();

  for (let cell = 0; cell < 81; cell++) {
    if (grid.values[cell] !== 0) continue;
    const mask = grid.candidatesOf(cell);
    const cellDigits = digitsOf(mask);

    if (cellDigits.length !== 2) continue;

    for (const d of cellDigits) {
      const key = `${cell}:${d}`;
      if (!implications.has(key)) implications.set(key, new Set());

      for (const peer of PEERS_OF[cell]!) {
        if (grid.values[peer] !== 0) continue;
        const peerMask = grid.candidatesOf(peer);
        const peerDigits = digitsOf(peerMask);

        for (const pd of peerDigits) {
          if (pd === d) continue;

          const isStrong = cellDigits.length === 2 && peerDigits.length === 2;

          if (isStrong) {
            implications.get(key)!.add(`${peer}:${pd}`);
          } else {
            implications.get(key)!.add(`${peer}:${pd}`);
          }
        }
      }
    }
  }

  return implications;
}

function traceChain(
  grid: Grid,
  start: ChainNode,
  implications: Map<string, Set<string>>,
  depth: number,
  visited: Set<string>
): Set<string> | null {
  if (depth > config.maxChainDepth) return null;

  const key = `${start.cell}:${start.digit}`;
  if (visited.has(key)) return null;
  visited.add(key);

  const consequences = implications.get(key);
  if (!consequences || consequences.size === 0) return null;

  if (consequences.size > config.maxBranchingFactor) return null;

  const allResults = new Set<string>();
  let hasResult = false;

  for (const consequence of consequences) {
    if (visited.has(consequence)) continue;

    const newVisited = new Set(visited);
    const result = traceChain(grid, parseChainNode(consequence), implications, depth + 1, newVisited);

    if (result === null) return null;
    hasResult = true;
    for (const r of result) allResults.add(r);
  }

  return hasResult ? allResults : null;
}

function parseChainNode(key: string): ChainNode {
  const [cellStr, digitStr] = key.split(':');
  const c = cellStr != null ? parseInt(cellStr, 10) : 0;
  const d = digitStr != null ? parseInt(digitStr, 10) : 0;
  return { cell: c, digit: d };
}

function findSingleCellForcing(grid: Grid): ChainResult | null {
  if (!config.allowWeakForcing) return null;

  for (let cell = 0; cell < 81; cell++) {
    if (grid.values[cell] !== 0) continue;
    const mask = grid.candidatesOf(cell);
    const cellDigits = digitsOf(mask);

    if (cellDigits.length < 2) continue;

    const implications = buildImplicationMap(grid);

    const results: Set<string>[] = [];
    for (const d of cellDigits) {
      const start = { cell, digit: d };
      const result = traceChain(grid, start, implications, 0, new Set());
      if (result === null) return null;
      results.push(result);
    }

    if (results.length < 2) continue;

    const common = new Set<string>();
    let first = true;
    for (const result of results) {
      if (first) {
        for (const r of result) common.add(r);
        first = false;
      } else {
        for (const r of result) {
          if (!common.has(r)) common.delete(r);
        }
      }
    }

    if (common.size > 0) {
      const elims: CellDigit[] = [];
      for (const key of common) {
        const node = parseChainNode(key);
        if (grid.hasCandidate(node.cell, node.digit)) {
          elims.push({ cell: node.cell, digit: node.digit });
        }
      }

      if (elims.length > 0) {
        const r = Math.floor(cell / 9) + 1;
        const c = (cell % 9) + 1;
        return {
          premise: { cell, digit: cellDigits[0]! },
          eliminations: elims,
          chain: [],
          type: 'weak',
        };
      }
    }
  }
  return null;
}

function findDigitForcing(grid: Grid): ChainResult | null {
  if (!config.allowStrongForcing) return null;

  for (const house of HOUSES) {
    const cellsWithDigit: number[] = [];
    for (const c of house) {
      if (grid.values[c] === 0 && grid.candidatesOf(c) !== 0) {
        const mask = grid.candidatesOf(c);
        if (mask !== 0) {
          for (let d = 1; d <= 9; d++) {
            if (mask & maskOf(d)) {
              cellsWithDigit.push(c);
              break;
            }
          }
        }
      }
    }

    if (cellsWithDigit.length < 2) continue;

    for (let digit = 1; digit <= 9; digit++) {
      const cellsWithThisDigit = house.filter(c =>
        grid.values[c] === 0 && grid.hasCandidate(c, digit)
      );

      if (cellsWithThisDigit.length < 2) continue;

      const implications = buildImplicationMap(grid);

      const results: Set<string>[] = [];
      for (const c of cellsWithThisDigit) {
        const start = { cell: c, digit };
        const result = traceChain(grid, start, implications, 0, new Set());
        if (result === null) return null;
        results.push(result);
      }

      const common = new Set<string>();
      let first = true;
      for (const result of results) {
        if (first) {
          for (const r of result) common.add(r);
          first = false;
        } else {
          for (const r of result) {
            if (!common.has(r)) common.delete(r);
          }
        }
      }

      const elims: CellDigit[] = [];
      for (const key of common) {
        const node = parseChainNode(key);
        if (grid.hasCandidate(node.cell, node.digit)) {
          elims.push({ cell: node.cell, digit: node.digit });
        }
      }

      if (elims.length > 0) {
        return {
          premise: { cell: cellsWithThisDigit[0]!, digit },
          eliminations: elims,
          chain: [],
          type: 'strong',
        };
      }
    }
  }
  return null;
}

export const forcingChain: Strategy = {
  id: STRATEGY_ID,
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100,

  apply(_grid: Grid): Step | null {
    return null;
  },
};