import {
  ROWS, COLS, BOXES, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface UrCore {
  cells: [number, number, number, number];
  masks: [number, number, number, number];
  urDigits: [number, number];
  intersect: number;
}

function findUrCores(grid: Grid): UrCore[] {
  const results: UrCore[] = [];
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells: [number, number, number, number] = [c11, c12, c21, c22];
    const masks: [number, number, number, number] = [
      grid.get(c11) === 0 ? grid.candidatesOf(c11) : 0,
      grid.get(c12) === 0 ? grid.candidatesOf(c12) : 0,
      grid.get(c21) === 0 ? grid.candidatesOf(c21) : 0,
      grid.get(c22) === 0 ? grid.candidatesOf(c22) : 0,
    ];
    if (masks.some((m) => m === 0)) continue;

    const intersect = masks[0] & masks[1] & masks[2] & masks[3];
    if (popcount(intersect) !== 2) continue;

    const ds = digitsOf(intersect);
    results.push({ cells, masks, urDigits: [ds[0]!, ds[1]!], intersect });
  }
  return results;
}

function areAdjacent(i: number, j: number, cells: readonly number[]): boolean {
  const ci = cells[i]!;
  const cj = cells[j]!;
  return ROW_OF[ci] === ROW_OF[cj] || COL_OF[ci] === COL_OF[cj];
}

function areDiagonal(i: number, j: number, cells: readonly number[]): boolean {
  return !areAdjacent(i, j, cells);
}

function tryURType3(grid: Grid, strategyId: string): Step | null {
  const cores = findUrCores(grid);
  for (const core of cores) {
    const { cells, masks, urDigits, intersect } = core;

    const roofIndices: number[] = [];
    const floorIndices: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (masks[i] === intersect) floorIndices.push(i);
      else if ((masks[i]! & intersect) === intersect) roofIndices.push(i);
    }

    if (roofIndices.length !== 2 || floorIndices.length !== 2) continue;
    if (!areAdjacent(roofIndices[0]!, roofIndices[1]!, cells)) continue;

    const extraMask0 = masks[roofIndices[0]!]! & ~intersect;
    const extraMask1 = masks[roofIndices[1]!]! & ~intersect;
    if (extraMask0 === 0 || extraMask1 === 0) continue;

    const pseudoMask = extraMask0 | extraMask1;
    const pseudoDigits = digitsOf(pseudoMask);
    if (pseudoDigits.length < 2) continue;

    const roofCells = roofIndices.map((i) => cells[i]!);
    const sharedHouses: number[] = [];
    for (let h = 0; h < HOUSES.length; h++) {
      const house = HOUSES[h]!;
      if (house.includes(roofCells[0]!) && house.includes(roofCells[1]!)) {
        sharedHouses.push(h);
      }
    }

    for (const houseIdx of sharedHouses) {
      const house = HOUSES[houseIdx]!;
      const outsideCells = house.filter((c) => !roofCells.includes(c) && grid.get(c) === 0);

      for (const subsetSize of [1, 2, 3]) {
        const outsideCombos = getCombinations(outsideCells, subsetSize);
        for (const combo of outsideCombos) {
          const comboMask = combo.reduce((acc, c) => acc | grid.candidatesOf(c), 0);
          const restrictedCombo = comboMask & pseudoMask;
          if (popcount(restrictedCombo) !== subsetSize) continue;

          const allComboDigits = digitsOf(restrictedCombo);
          const allCellsInSubset = [...roofCells, ...combo];

          const elims: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (allCellsInSubset.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of allComboDigits) {
              if (grid.hasCandidate(c, d)) {
                elims.push({ cell: c, digit: d });
              }
            }
          }

          if (elims.length > 0) {
            const [x, y] = urDigits;
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...cells, ...combo, ...elims.map((e) => e.cell)],
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `唯一矩形 Type3：UR对 {${x},${y}}，两个屋顶格的额外候选数与宫外格形成裸子集；在共享宫中消去相应候选数。`,
                en: `Unique Rectangle Type 3: UR pair {${x},${y}}, extra candidates in roof cells form a naked subset with outside cells; eliminate subset digits from the shared house.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = getCombinations(arr.slice(i + 1), size - 1);
    for (const combo of rest) {
      result.push([arr[i]!, ...combo]);
    }
  }
  return result;
}

function tryURType5(grid: Grid, strategyId: string): Step | null {
  const cores = findUrCores(grid);
  for (const core of cores) {
    const { cells, masks, urDigits, intersect } = core;

    const exactIndices: number[] = [];
    const extraIndices: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (masks[i] === intersect) exactIndices.push(i);
      else if ((masks[i]! & intersect) === intersect) extraIndices.push(i);
    }

    if (extraIndices.length < 2 || exactIndices.length < 1) continue;

    for (const z of digitsOf(0x1ff)) {
      const zBit = maskOf(z);
      if (zBit & intersect) continue;

      const cornersWithZ = extraIndices.filter((i) => (masks[i]! & zBit) !== 0);
      if (cornersWithZ.length < 2) continue;

      const isDiagonal = cornersWithZ.length === 2 && areDiagonal(cornersWithZ[0]!, cornersWithZ[1]!, cells);
      const isTriple = cornersWithZ.length === 3;

      if (!isDiagonal && !isTriple) continue;

      const cornerCells = cornersWithZ.map((i) => cells[i]!);
      const elims: { cell: number; digit: number }[] = [];

      for (let c = 0; c < 81; c++) {
        if (grid.get(c) !== 0 || !grid.hasCandidate(c, z)) continue;
        if (cornerCells.includes(c)) continue;
        const seesAll = cornerCells.every((cc) => PEERS_OF[c]!.includes(cc));
        if (seesAll) elims.push({ cell: c, digit: z });
      }

      if (elims.length > 0) {
        const [x, y] = urDigits;
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells, ...elims.map((e) => e.cell)],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type5：UR对 {${x},${y}}，额外候选数 ${z} 出现在${isDiagonal ? '对角' : '三个'}角格中；消去同时看到所有额外 ${z} 角格的格中的 ${z}。`,
            en: `Unique Rectangle Type 5: UR pair {${x},${y}}, extra digit ${z} in ${isDiagonal ? 'diagonal' : 'three'} corners; eliminate ${z} from cells seeing all extra-${z} corners.`,
          },
        };
      }
    }
  }
  return null;
}

function tryURType6(grid: Grid, strategyId: string): Step | null {
  const cores = findUrCores(grid);
  for (const core of cores) {
    const { cells, masks, urDigits, intersect } = core;

    const exactIndices: number[] = [];
    const extraIndices: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (masks[i] === intersect) exactIndices.push(i);
      else if ((masks[i]! & intersect) === intersect) extraIndices.push(i);
    }

    if (extraIndices.length !== 2 || exactIndices.length !== 2) continue;
    if (!areDiagonal(extraIndices[0]!, extraIndices[1]!, cells)) continue;

    for (const [locked, elim] of [[urDigits[0], urDigits[1]], [urDigits[1], urDigits[0]]] as [number, number][]) {
      const lockedBit = maskOf(locked);

      let formsXWing = true;
      for (let h = 0; h < 18; h++) {
        const house = HOUSES[h]!;
        const lockedCells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
        const urCellsInHouse = cells.filter((c) => house.includes(c));
        if (urCellsInHouse.length === 0) continue;
        const nonUrLocked = lockedCells.filter((c) => !cells.includes(c));
        if (nonUrLocked.length > 0) {
          const hasUrLocked = lockedCells.some((c) => cells.includes(c));
          if (hasUrLocked) {
            formsXWing = false;
            break;
          }
        }
      }

      if (!formsXWing) continue;

      const elims: { cell: number; digit: number }[] = [];
      for (const idx of extraIndices) {
        const cell = cells[idx]!;
        if (grid.hasCandidate(cell, locked)) {
          elims.push({ cell, digit: locked });
        }
      }

      if (elims.length > 0) {
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type6：UR对 {${urDigits[0]},${urDigits[1]}}，额外候选数在对角格；${locked} 在行列中仅出现在UR格（X翼），消去对角额外格的 ${locked}。`,
            en: `Unique Rectangle Type 6: UR pair {${urDigits[0]},${urDigits[1]}}, extras in diagonal corners; ${locked} forms an X-Wing on the UR cells, eliminate ${locked} from the diagonal extra corners.`,
          },
        };
      }
    }
  }
  return null;
}

function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  const cores = findUrCores(grid);
  for (const core of cores) {
    const { cells, masks, urDigits, intersect } = core;

    const exactIndices: number[] = [];
    const extraIndices: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (masks[i] === intersect) exactIndices.push(i);
      else if ((masks[i]! & intersect) === intersect) extraIndices.push(i);
    }

    if (exactIndices.length < 1 || exactIndices.length > 2) continue;

    for (const cleanIdx of exactIndices) {
      const diagIdx = extraIndices.find((i) => areDiagonal(cleanIdx, i, cells));
      if (diagIdx === undefined) continue;

      const diagCell = cells[diagIdx]!;
      const diagRow = ROW_OF[diagCell]!;
      const diagCol = COL_OF[diagCell]!;

      for (const [testDigit, elimDigit] of [[urDigits[0], urDigits[1]], [urDigits[1], urDigits[0]]] as [number, number][]) {
        const testBit = maskOf(testDigit);

        const rowCells = ROWS[diagRow]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & testBit) !== 0);
        const rowOutsideUr = rowCells.filter((c) => !cells.includes(c));

        const colCells = COLS[diagCol]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & testBit) !== 0);
        const colOutsideUr = colCells.filter((c) => !cells.includes(c));

        if (rowOutsideUr.length === 0 || colOutsideUr.length === 0) {
          if (grid.hasCandidate(diagCell, elimDigit)) {
            const [x, y] = urDigits;
            return {
              strategyId,
              placements: [],
              eliminations: [{ cell: diagCell, digit: elimDigit }],
              highlights: {
                cells: [...cells],
                candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `隐性唯一矩形：UR对 {${x},${y}}，${testDigit} 在对角格所在行/列中仅出现在UR格内；消去对角格的 ${elimDigit}。`,
                en: `Hidden Unique Rectangle: UR pair {${x},${y}}, ${testDigit} is confined to UR cells in the row/col of the diagonal corner; eliminate ${elimDigit} from the diagonal corner.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
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
