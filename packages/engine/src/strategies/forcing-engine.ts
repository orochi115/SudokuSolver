import {
  CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';

export function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const _vals = new Uint8Array(CELLS);
const _cands = new Uint16Array(CELLS);
const _placedCells = new Uint8Array(CELLS);
const _placedDigits = new Uint8Array(CELLS);

export interface FastResult {
  contradiction: boolean;
  placedCount: number;
}

export function propagateFast(grid: Grid, cell: number, digit: number, maxSteps: number): FastResult {
  if (!grid.hasCandidate(cell, digit) && grid.get(cell) !== digit) {
    return { contradiction: true, placedCount: 0 };
  }
  if (grid.get(cell) === digit) {
    return { contradiction: false, placedCount: 0 };
  }

  _vals.set(grid.values);
  _cands.set(grid.candidates);

  _vals[cell] = digit;
  _cands[cell] = 0;
  _placedCells[0] = cell;
  _placedDigits[0] = digit;
  let placedCount = 1;

  let head = 0;
  let steps = 0;

  while (head < placedCount && steps++ < maxSteps) {
    const placed = _placedCells[head]!;
    const placedDigit = _placedDigits[head]!;
    head++;
    const bit = maskOf(placedDigit);
    const peers = PEERS_OF[placed]!;

    for (let pi = 0; pi < peers.length; pi++) {
      const peer = peers[pi]!;
      const pv = _vals[peer]!;
      if (pv !== 0) {
        if (pv === placedDigit) return { contradiction: true, placedCount };
        continue;
      }
      const pc = _cands[peer]!;
      if ((pc & bit) === 0) continue;
      const nc = pc & ~bit;
      _cands[peer] = nc;
      if (nc === 0) return { contradiction: true, placedCount };
      if (popcount(nc) === 1) {
        let fd = 0;
        for (let d = 1; d <= 9; d++) { if (nc & maskOf(d)) { fd = d; break; } }
        _vals[peer] = fd;
        _cands[peer] = 0;
        _placedCells[placedCount] = peer;
        _placedDigits[placedCount] = fd;
        placedCount++;
      }
    }
  }

  return { contradiction: false, placedCount };
}

export interface BranchResult {
  contradiction: boolean;
  placements: Map<number, number>;
}

export function propagateWithPlacements(grid: Grid, cell: number, digit: number, maxSteps: number): BranchResult {
  if (!grid.hasCandidate(cell, digit) && grid.get(cell) !== digit) {
    return { contradiction: true, placements: new Map() };
  }
  if (grid.get(cell) === digit) {
    return { contradiction: false, placements: new Map() };
  }

  const values = Array.from(grid.values);
  const candidates = Array.from(grid.candidates);
  const placements = new Map<number, number>();

  values[cell] = digit;
  candidates[cell] = 0;
  placements.set(cell, digit);
  const queue = [cell];
  let steps = 0;

  while (queue.length > 0 && steps++ < maxSteps) {
    const placed = queue.shift()!;
    const placedDigit = values[placed]!;
    const bit = maskOf(placedDigit);

    for (const peer of PEERS_OF[placed]!) {
      if (values[peer] !== 0) {
        if (values[peer] === placedDigit) return { contradiction: true, placements };
        continue;
      }
      if ((candidates[peer]! & bit) === 0) continue;
      candidates[peer]! &= ~bit;
      if (candidates[peer] === 0) return { contradiction: true, placements };
      if (popcount(candidates[peer]!) === 1) {
        const forcedDigit = digitsOf(candidates[peer]!)[0]!;
        values[peer] = forcedDigit;
        candidates[peer] = 0;
        placements.set(peer, forcedDigit);
        queue.push(peer);
      }
    }
  }

  return { contradiction: false, placements };
}

export function makeForcingStep(
  strategyId: string,
  grid: Grid,
  premiseCells: readonly number[],
  placements: CellDigit[],
  eliminations: CellDigit[],
  zh: string,
  en: string,
): Step {
  return {
    strategyId,
    placements,
    eliminations,
    highlights: {
      cells: [...new Set([...premiseCells, ...placements.map((p) => p.cell), ...eliminations.map((e) => e.cell)])],
      candidates: [
        ...premiseCells.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
        ...placements,
        ...eliminations,
      ],
      links: [],
    },
    explanation: { zh, en },
  };
}

export function countEmpty(grid: Grid): number {
  let n = 0;
  for (let i = 0; i < CELLS; i++) { if (grid.get(i) === 0) n++; }
  return n;
}

export function findBivalueCells(grid: Grid, maxCount: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < CELLS && result.length < maxCount; i++) {
    if (grid.get(i) === 0 && popcount(grid.candidatesOf(i)) === 2) {
      result.push(i);
    }
  }
  return result;
}
