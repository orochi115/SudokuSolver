/**
 * Exocet (P2) — 飞鱼导弹
 *
 * Junior Exocet Rule 1: in one band/stack, two aligned base cells in a box hold
 * 3–4 candidate digits; two target cells in the other boxes of the band/stack
 * are forced to hold the two true base digits. This implementation applies the
 * structural target-purge inference when the companion and simplified cover
 * constraints are satisfied.
 */

import { BOXES, BOX_OF, ROW_OF, COL_OF, CELLS, PEERS_OF, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function boxBand(b: number): number {
  return Math.floor(b / 3);
}

function boxStack(b: number): number {
  return b % 3;
}

function miniRowCells(box: readonly number[], row: number): number[] {
  return box.filter((c) => ROW_OF[c] === row);
}

function miniColCells(box: readonly number[], col: number): number[] {
  return box.filter((c) => COL_OF[c] === col);
}

function containsBdigit(grid: Grid, cells: number[], bdigits: number[]): boolean {
  return cells.some((c) => {
    if (grid.get(c) !== 0) return bdigits.includes(grid.get(c)!);
    return bdigits.some((d) => grid.hasCandidate(c, d));
  });
}

function candidatesInclude(grid: Grid, cell: number, digits: number[]): boolean {
  if (grid.get(cell) !== 0) return false;
  return digits.every((d) => grid.hasCandidate(cell, d));
}

/**
 * Try an Exocet in the given orientation.
 * @param horizontal true if the base mini-line is a row inside the box.
 */
function tryExocet(
  grid: Grid,
  baseBox: number,
  lineIdx: number,
  horizontal: boolean,
): Step | null {
  const box = BOXES[baseBox]!;
  const lineCells = horizontal ? miniRowCells(box, lineIdx) : miniColCells(box, lineIdx);
  const emptyBase = lineCells.filter((c) => grid.get(c) === 0);
  if (emptyBase.length !== 2) return null;

  let bdigitsMask = 0;
  for (const c of emptyBase) bdigitsMask |= grid.candidatesOf(c);
  const bdigits = digitsOf(bdigitsMask).sort((a, b) => a - b);
  if (bdigits.length < 3 || bdigits.length > 4) return null;

  // Other boxes in the same band/stack.
  const otherBoxes = horizontal
    ? BOXES.filter((_, b) => boxBand(b) === boxBand(baseBox) && b !== baseBox)
    : BOXES.filter((_, b) => boxStack(b) === boxStack(baseBox) && b !== baseBox);

  if (otherBoxes.length !== 2) return null;

  for (const targetA of otherBoxes[0]!.filter((c) => grid.get(c) === 0)) {
    if (PEERS_OF[targetA]!.some((p) => emptyBase.includes(p))) continue;
    if (!candidatesInclude(grid, targetA, bdigits)) continue;

    const companionA = horizontal
      ? miniRowCells(BOXES[BOX_OF[targetA]!]!, ROW_OF[targetA]!).filter((c) => c !== targetA)
      : miniColCells(BOXES[BOX_OF[targetA]!]!, COL_OF[targetA]!).filter((c) => c !== targetA);
    if (containsBdigit(grid, companionA, bdigits)) continue;

    for (const targetB of otherBoxes[1]!.filter((c) => grid.get(c) === 0)) {
      if (targetB === targetA) continue;
      if (PEERS_OF[targetB]!.some((p) => emptyBase.includes(p) || p === targetA)) continue;
      if (!candidatesInclude(grid, targetB, bdigits)) continue;

      const companionB = horizontal
        ? miniRowCells(BOXES[BOX_OF[targetB]!]!, ROW_OF[targetB]!).filter((c) => c !== targetB)
        : miniColCells(BOXES[BOX_OF[targetB]!]!, COL_OF[targetB]!).filter((c) => c !== targetB);
      if (containsBdigit(grid, companionB, bdigits)) continue;

      // Simplified cover rule: each base digit appears at most twice outside the
      // base box in the crossing lines of the targets.
      const crossLines = horizontal
        ? [COL_OF[targetA]!, COL_OF[targetB]!]
        : [ROW_OF[targetA]!, ROW_OF[targetB]!];
      const sCells = horizontal
        ? crossLines.flatMap((col) =>
            Array.from({ length: 9 }, (_, r) => r * 9 + col).filter(
              (c) => BOX_OF[c] !== baseBox && grid.get(c) === 0,
            ),
          )
        : crossLines.flatMap((row) =>
            Array.from({ length: 9 }, (_, c) => row * 9 + c).filter(
              (c) => BOX_OF[c] !== baseBox && grid.get(c) === 0,
            ),
      );

      let coverOk = true;
      for (const d of bdigits) {
        let count = 0;
        for (const c of sCells) {
          if (grid.hasCandidate(c, d)) {
            count++;
            if (count > 2) break;
          }
        }
        if (count > 2) {
          coverOk = false;
          break;
        }
      }
      if (!coverOk) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const t of [targetA, targetB]) {
        for (const d of digitsOf(grid.candidatesOf(t))) {
          if (!bdigits.includes(d)) eliminations.push({ cell: t, digit: d });
        }
      }
      if (eliminations.length === 0) continue;

      return {
        strategyId: 'exocet',
        placements: [],
        eliminations,
        highlights: {
          cells: [...emptyBase, targetA, targetB, ...eliminations.map((e) => e.cell)],
          candidates: [
            ...emptyBase.flatMap((c) => bdigits.map((d) => ({ cell: c, digit: d }))),
            ...[targetA, targetB].flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `飞鱼导弹：基底格 ${emptyBase.map(cellLabel).join(',')} 候选数 {${bdigits.join(',')}}，目标格 ${cellLabel(targetA)}、${cellLabel(targetB)} 必承其真值数字，消去目标格中的非基底候选数。`,
          en: `Exocet: base cells ${emptyBase.map(cellLabel).join(',')} with digits {${bdigits.join(',')}} force target cells ${cellLabel(targetA)} and ${cellLabel(targetB)} to hold the true base digits; eliminate non-base candidates from the targets.`,
        },
      };
    }
  }

  return null;
}

export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '飞鱼导弹', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    for (let b = 0; b < 9; b++) {
      const box = BOXES[b]!;
      const rowsInBox = new Set(box.map((c) => ROW_OF[c]!));
      const colsInBox = new Set(box.map((c) => COL_OF[c]!));
      for (const r of rowsInBox) {
        const step = tryExocet(grid, b, r, true);
        if (step) return step;
      }
      for (const c of colsInBox) {
        const step = tryExocet(grid, b, c, false);
        if (step) return step;
      }
    }
    return null;
  },
};
