/**
 * T4: Sue de Coq and Aligned Exclusion.
 *
 * Sue de Coq: At a line-box intersection, candidate sets can be partitioned
 * into overlapping locked subsets that eliminate candidates from the rest of
 * the line and box.
 *
 * Aligned Exclusion: When a digit cannot appear in any cell of a house that
 * sees a specific cell, it can be eliminated from that cell.
 */

import { HOUSES, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

const STRATEGY_ID = 'sue-de-coq';

interface SueDeCoqResult {
  lineCells: number[];
  boxCells: number[];
  lineDigits: number[];
  boxDigits: number[];
  commonDigits: number[];
  elims: CellDigit[];
  links: Link[];
}

function findSueDeCoq(grid: Grid): SueDeCoqResult | null {
  for (let lineIdx = 0; lineIdx < 18; lineIdx++) {
    const line = HOUSES[lineIdx]!;
    const lineType = lineIdx < 9 ? 'row' : 'col';
    const lineNum = lineIdx < 9 ? lineIdx : lineIdx - 9;

    for (let boxIdx = 18; boxIdx < 27; boxIdx++) {
      const box = HOUSES[boxIdx]!;

      const lineCells = line.filter(c => grid.values[c] === 0);
      const boxCells = box.filter(c => grid.values[c] === 0);

      const intersectionCells = lineCells.filter(c => boxCells.includes(c));
      const restOfLine = lineCells.filter(c => !boxCells.includes(c));
      const restOfBox = boxCells.filter(c => !lineCells.includes(c));

      if (intersectionCells.length < 2 || intersectionCells.length > 3) continue;
      if (restOfLine.length === 0 || restOfBox.length === 0) continue;

      let combinedMask = 0;
      for (const c of intersectionCells) {
        combinedMask |= grid.candidatesOf(c);
      }
      const combinedDigits = digitsOf(combinedMask);

      if (combinedDigits.length < 2 || combinedDigits.length > 4) continue;

      let restLineMask = 0;
      for (const c of restOfLine) {
        restLineMask |= grid.candidatesOf(c);
      }
      const restLineDigits = digitsOf(restLineMask);

      let restBoxMask = 0;
      for (const c of restOfBox) {
        restBoxMask |= grid.candidatesOf(c);
      }
      const restBoxDigits = digitsOf(restBoxMask);

      const commonDigits = combinedDigits.filter(d => restLineDigits.includes(d));
      const lineOnlyDigits = combinedDigits.filter(d => !commonDigits.includes(d));

      if (commonDigits.length === 0) continue;

      const lineCanSeeBox = restOfLine.some(c1 =>
        restOfBox.some(c2 => PEERS_OF[c1]!.includes(c2) || c1 === c2)
      );

      const elims: CellDigit[] = [];

      for (const d of lineOnlyDigits) {
        for (const c of restOfBox) {
          if (grid.hasCandidate(c, d)) {
            elims.push({ cell: c, digit: d });
          }
        }
      }

      for (const d of restBoxDigits) {
        if (!combinedDigits.includes(d)) continue;
        for (const c of restOfLine) {
          if (grid.hasCandidate(c, d)) {
            elims.push({ cell: c, digit: d });
          }
        }
      }

      if (elims.length > 0) {
        const links: Link[] = [];
        for (const c of intersectionCells) {
          const cellDigits = digitsOf(grid.candidatesOf(c));
          for (const d of cellDigits) {
            if (commonDigits.includes(d)) {
              for (const rc of restOfLine) {
                if (grid.hasCandidate(rc, d)) {
                  links.push({ from: { cell: c, digit: d }, to: { cell: rc, digit: d }, type: 'weak' });
                }
              }
              for (const bc of restOfBox) {
                if (grid.hasCandidate(bc, d)) {
                  links.push({ from: { cell: c, digit: d }, to: { cell: bc, digit: d }, type: 'weak' });
                }
              }
            }
          }
        }

        return {
          lineCells: [...intersectionCells, ...restOfLine],
          boxCells: [...intersectionCells, ...restOfBox],
          lineDigits: restLineDigits,
          boxDigits: restBoxDigits,
          commonDigits,
          elims,
          links,
        };
      }
    }
  }
  return null;
}

function findAlignedExclusion(grid: Grid): Step | null {
  for (let digit = 1; digit <= 9; digit++) {
    for (const house of HOUSES) {
      const cellsWithDigit: number[] = [];
      for (const c of house) {
        if (grid.values[c] === 0 && grid.hasCandidate(c, digit)) {
          cellsWithDigit.push(c);
        }
      }

      if (cellsWithDigit.length === 0) continue;

      for (const targetCell of house) {
        if (grid.values[targetCell] !== 0) continue;
        if (!grid.hasCandidate(targetCell, digit)) continue;

        const seesAll = cellsWithDigit.every(c => c === targetCell || PEERS_OF[targetCell]!.includes(c));

        if (seesAll && cellsWithDigit.length >= 2) {
          const r = Math.floor(targetCell / 9) + 1;
          const c = (targetCell % 9) + 1;
          const cellList = cellsWithDigit.map(x => {
            const xr = Math.floor(x / 9) + 1;
            const xc = (x % 9) + 1;
            return `R${xr}C${xc}`;
          }).join(', ');

          return {
            strategyId: STRATEGY_ID,
            placements: [],
            eliminations: [{ cell: targetCell, digit }],
            highlights: {
              cells: [targetCell, ...cellsWithDigit],
              candidates: cellsWithDigit.map(c => ({ cell: c, digit })).concat([{ cell: targetCell, digit }]),
              links: [],
            },
            explanation: {
              zh: `对齐排除: 数字 ${digit} 在单元中只能出现在 ${cellList}，这些格子都看见 R${r}C${c}，因此从 R${r}C${c} 排除 ${digit}。`,
              en: `Aligned Exclusion: digit ${digit} in this house can only appear in ${cellList}, all seeing R${r}C${c}, so ${digit} is excluded from R${r}C${c}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const sueDeCoq: Strategy = {
  id: STRATEGY_ID,
  name: { zh: 'Sue de Coq / 对齐排除', en: 'Sue de Coq / Aligned Exclusion' },
  difficulty: 95,

  apply(_grid: Grid): Step | null {
    return null;
  },
};