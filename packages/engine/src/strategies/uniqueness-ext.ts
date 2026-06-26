import {
  CELLS, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, HOUSES, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;
          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;
          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

/** UR Type 3: Two roof cells with extra candidates form a pseudo-cell.
 *  If combined with outside cells in a shared house to form a naked subset,
 *  eliminate the subset digits from other cells in that house. */
function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);

    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    const extraMask = (grid.candidatesOf(floorCells[0]!) | grid.candidatesOf(floorCells[1]!)) & ~intersect;
    if (extraMask === 0) continue;

    const urDigits = digitsOf(intersect);

    for (const houseIdx of getCommonHouses(floorCells[0]!, floorCells[1]!)) {
      const house = HOUSES[houseIdx]!;
      const otherCells = house.filter((c) => !cells.includes(c) && grid.get(c) === 0);
      const pseudoDigits = digitsOf(extraMask);

      if (pseudoDigits.length < 2) continue;

      for (const subsetSize of [2, 3, 4]) {
        if (pseudoDigits.length > subsetSize && otherCells.length > 0) continue;
        if (otherCells.length < subsetSize - 2) continue;
        if (otherCells.length > 6) continue;

        const combos = combinations(otherCells, subsetSize - 2);
        for (const combo of combos) {
          const subsetCells = [...floorCells, ...combo];
          let unionMask = 0;
          for (const sc of subsetCells) {
            if (grid.get(sc) !== 0) { unionMask = 0; break; }
            unionMask |= grid.candidatesOf(sc);
          }
          if (unionMask === 0) continue;
          const subsetDigits = digitsOf(unionMask);
          if (subsetDigits.length !== subsetCells.length) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (subsetCells.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of subsetDigits) {
              if (grid.hasCandidate(c, d)) {
                eliminations.push({ cell: c, digit: d });
              }
            }
          }
          if (eliminations.length === 0) continue;

          const [x, y] = urDigits as [number, number];
          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: {
              cells: [...cells, ...eliminations.map((e) => e.cell), ...combo],
              candidates: [
                ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `唯一矩形 Type3：底层额外候选数 ${pseudoDigits.join(',')} 与同行/列/宫的其他格形成 ${subsetSize} 元组，可消去 ${eliminations.length} 个候选。`,
              en: `Unique Rectangle Type 3: floor extra candidates ${pseudoDigits.join(',')} form a ${subsetSize}-tuple with external cells; eliminate ${eliminations.length} candidates.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (k > arr.length) return [];
  const result: T[][] = [];
  function combine(start: number, chosen: T[]) {
    if (chosen.length === k) { result.push([...chosen]); return; }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]!);
      combine(i + 1, chosen);
      chosen.pop();
    }
  }
  combine(0, []);
  return result;
}

/** UR Type 5: Extra single digit c in two diagonal or three corners.
 *  Exactly one extra digit per extra corner; non-extra corners have only UR pair.
 *  Eliminate c from cells that see all extra-candidate corners. */
function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    const urDigits = digitsOf(intersect);
    const urMask = intersect;

    const cleanCells: number[] = [];
    const extraCells: { cell: number; extraDigit: number }[] = [];
    for (let i = 0; i < 4; i++) {
      if (masks[i] === 0) continue;
      if (masks[i] === urMask) {
        cleanCells.push(cells[i]!);
      } else {
        const extra = masks[i]! & ~urMask;
        if (extra !== 0 && popcount(extra) === 1 && popcount(masks[i]!) === 3) {
          extraCells.push({ cell: cells[i]!, extraDigit: digitsOf(extra)[0]! });
        }
      }
    }

    const isDiagonal = (a: number, b: number) => ROW_OF[a] !== ROW_OF[b] && COL_OF[a] !== COL_OF[b];

    let validFootprint = false;
    if (extraCells.length === 2 && cleanCells.length === 2 && isDiagonal(extraCells[0]!.cell, extraCells[1]!.cell)) {
      validFootprint = true;
    }
    if (extraCells.length === 3 && cleanCells.length === 1) {
      validFootprint = true;
    }
    if (!validFootprint) continue;

    const commonDigit = extraCells[0]!.extraDigit;
    if (!extraCells.every((ec) => ec.extraDigit === commonDigit)) continue;

    const extraCellList = extraCells.map((ec) => ec.cell);
    const peersByDig: Set<number>[] = extraCellList.map((ec) => new Set(PEERS_OF[ec]!));
    const commonPeers: number[] = [];
    for (const p of peersByDig[0]!) {
      if (peersByDig.every((s) => s.has(p))) commonPeers.push(p);
    }

    const eliminations = commonPeers
      .filter((c) => !cells.includes(c) && grid.hasCandidate(c, commonDigit))
      .map((c) => ({ cell: c, digit: commonDigit }));

    if (eliminations.length === 0) continue;

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...cells, ...eliminations.map((e) => e.cell)],
        candidates: [
          ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          ...eliminations,
        ],
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type5：UR对 {${urDigits[0]},${urDigits[1]}} 的两个对角/三格均有额外候选数 ${commonDigit}；${commonDigit} 必须出现在其中一格，消除同时可见所有这些格的格中的 ${commonDigit}。`,
        en: `Unique Rectangle Type 5: UR pair {${urDigits[0]},${urDigits[1]}} has extra candidate ${commonDigit} in diagonal/three corners; ${commonDigit} must occupy one, eliminate from common peers.`,
      },
    };
  }
  return null;
}

/** UR Type 6: X-Wing on a UR digit through diagonal extras.
 *  If one UR digit forms an X-Wing on the 4 UR cells,
 *  eliminate that digit from both diagonal extra-candidate corners. */
function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const urDigits = digitsOf(intersect);

    const extras: { cell: number; mask: number }[] = [];
    for (let i = 0; i < 4; i++) {
      if (masks[i] === 0) continue;
      const extra = masks[i]! & ~intersect;
      if (extra !== 0) extras.push({ cell: cells[i]!, mask: masks[i]! });
    }

    if (extras.length !== 2) continue;

    const extraCells = extras.map((e) => e.cell);
    const isDiagonal = (a: number, b: number) => {
      return ROW_OF[a] !== ROW_OF[b] && COL_OF[a] !== COL_OF[b];
    };

    if (!isDiagonal(extraCells[0]!, extraCells[1]!)) continue;

    for (const targetDigit of urDigits) {
      const bit = maskOf(targetDigit);
      const hasXWing = cells.every((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);

      if (!hasXWing) continue;

      const eliminations = extraCells
        .filter((ec) => grid.hasCandidate(ec, targetDigit))
        .map((ec) => ({ cell: ec, digit: targetDigit }));

      if (eliminations.length === 0) continue;

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells,
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `唯一矩形 Type6：UR对 {${urDigits[0]},${urDigits[1]}} 中 ${targetDigit} 在四个角格构成 X-Wing，对角额外格不可能为 ${targetDigit}；消去对角额外格中的 ${targetDigit}。`,
          en: `Unique Rectangle Type 6: UR pair {${urDigits[0]},${urDigits[1]}}; digit ${targetDigit} forms an X-Wing on the 4 corners; eliminate ${targetDigit} from diagonal extras.`,
        },
      };
    }
  }
  return null;
}

/** Hidden UR: Pick a UR corner without extra candidates as start.
 *  If one UR digit appears nowhere outside the UR in the row and column
 *  of the diagonally opposite corner, eliminate the other UR digit from
 *  the diagonally opposite corner. */
function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const urDigits = digitsOf(intersect);

    const cleanCells = cells.filter((_, i) => masks[i] === intersect);
    if (cleanCells.length === 0) continue;

    for (const cleanCell of cleanCells) {
      const diagIdx = cells.indexOf(cleanCell);
      const diagOppIdx = diagIdx === 0 ? 3 : diagIdx === 1 ? 2 : diagIdx === 2 ? 1 : 0;
      const diagOpp = cells[diagOppIdx]!;

      for (const locked of urDigits) {
        const other = urDigits.find((d) => d !== locked)!;
        const lockedBit = maskOf(locked);

        const inRow = ROWS[ROW_OF[diagOpp]!]!.filter(
          (c) => c !== diagOpp && !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0,
        );
        const inCol = COLS[COL_OF[diagOpp]!]!.filter(
          (c) => c !== diagOpp && !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0,
        );

        if (inRow.length > 0 || inCol.length > 0) continue;

        if (!grid.hasCandidate(diagOpp, other)) continue;

        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: diagOpp, digit: other }],
          highlights: {
            cells,
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `隐性唯一矩形：数字 ${locked} 在对角格 ${cellLabel(diagOpp)} 的所在行与列中仅出现在矩形内，故该格不能为 ${other}；消去 ${other}。`,
            en: `Hidden UR: ${locked} is confined to the UR in the row and column of the opposite corner ${cellLabel(diagOpp)}; eliminate ${other} from it.`,
          },
        };
      }
    }
  }
  return null;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const uniqueRectangleType3: Strategy = {
  id: 'unique-rectangle-type-3',
  name: { zh: '唯一矩形 Type 3', en: 'Unique Rectangle Type 3' },
  difficulty: 940,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryURType3(grid, 'unique-rectangle-type-3');
  },
};

export const uniqueRectangleType5: Strategy = {
  id: 'unique-rectangle-type-5',
  name: { zh: '唯一矩形 Type 5', en: 'Unique Rectangle Type 5' },
  difficulty: 960,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryURType5(grid, 'unique-rectangle-type-5');
  },
};

export const uniqueRectangleType6: Strategy = {
  id: 'unique-rectangle-type-6',
  name: { zh: '唯一矩形 Type 6', en: 'Unique Rectangle Type 6' },
  difficulty: 970,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryURType6(grid, 'unique-rectangle-type-6');
  },
};

export const hiddenUniqueRectangle: Strategy = {
  id: 'hidden-unique-rectangle',
  name: { zh: '隐性唯一矩形', en: 'Hidden Unique Rectangle' },
  difficulty: 935,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryHiddenUR(grid, 'hidden-unique-rectangle');
  },
};