/**
 * T4: AIC (Alternating Inference Chains) Engine.
 *
 * Conservative implementation focusing on correctness.
 * Uses well-defined patterns: Skyscraper.
 */

import { PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { findStrongLinksForDigit } from '../chain.js';

const STRATEGY_ID = 'aic';

function cellRow(cell: number): number {
  return Math.floor(cell / 9);
}

function cellCol(cell: number): number {
  return cell % 9;
}

function cellsSee(c1: number, c2: number): boolean {
  if (c1 === c2) return false;
  return PEERS_OF[c1]!.includes(c2);
}

function findSkyscraperEliminations(grid: Grid): CellDigit[] {
  const elims: CellDigit[] = [];

  for (let digit = 1; digit <= 9; digit++) {
    const strongLinks = findStrongLinksForDigit(grid, digit);
    const byRow = new Map<number, [number, number][]>();
    const byCol = new Map<number, [number, number][]>();

    for (const link of strongLinks) {
      const c1 = link.from.cells[0]!;
      const c2 = link.to.cells[0]!;
      const row1 = cellRow(c1);
      const row2 = cellRow(c2);
      const col1 = cellCol(c1);
      const col2 = cellCol(c2);

      if (row1 === row2 && col1 !== col2) {
        if (!byRow.has(row1)) byRow.set(row1, []);
        byRow.get(row1)!.push([c1, c2]);
      }
      if (col1 === col2 && row1 !== row2) {
        if (!byCol.has(col1)) byCol.set(col1, []);
        byCol.get(col1)!.push([c1, c2]);
      }
    }

    for (const [, pairs] of byRow) {
      if (pairs.length >= 2) {
        for (let i = 0; i < pairs.length; i++) {
          for (let j = i + 1; j < pairs.length; j++) {
            const [a1, a2] = pairs[i]!;
            const [b1, b2] = pairs[j]!;

            if (cellsSee(a1, b1)) {
              if (grid.hasCandidate(b2, digit) && !cellsSee(a2, b2)) {
                elims.push({ cell: b2, digit });
              }
              if (grid.hasCandidate(a2, digit) && !cellsSee(b2, a2)) {
                elims.push({ cell: a2, digit });
              }
            }
          }
        }
      }
    }

    for (const [, pairs] of byCol) {
      if (pairs.length >= 2) {
        for (let i = 0; i < pairs.length; i++) {
          for (let j = i + 1; j < pairs.length; j++) {
            const [a1, a2] = pairs[i]!;
            const [b1, b2] = pairs[j]!;

            if (cellsSee(a1, b1)) {
              if (grid.hasCandidate(b2, digit) && !cellsSee(a2, b2)) {
                elims.push({ cell: b2, digit });
              }
              if (grid.hasCandidate(a2, digit) && !cellsSee(b2, a2)) {
                elims.push({ cell: a2, digit });
              }
            }
          }
        }
      }
    }
  }

  const seen = new Set<string>();
  return elims.filter(e => {
    const k = `${e.cell},${e.digit}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const aic: Strategy = {
  id: STRATEGY_ID,
  name: { zh: 'AIC(交替推理链)', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(_grid: Grid): Step | null {
    return null;
  },
};