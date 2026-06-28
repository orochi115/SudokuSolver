/**
 * Shared Unique Rectangle engine (E3).
 */

import {
  CELLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';

export function* allRectangles(): Generator<[number, number, number, number]> {
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

/** Diagonal corner opposite in [c11,c12,c21,c22] layout. */
const DIAG_OPPOSITE = [3, 2, 1, 0] as const;

function seesBoth(cell: number, a: number, b: number): boolean {
  return PEERS_OF[a]!.includes(cell) && PEERS_OF[b]!.includes(cell);
}

function isAdjacentRoofPair(cells: readonly number[], a: number, b: number): boolean {
  const i = cells.indexOf(a);
  const j = cells.indexOf(b);
  if (i < 0 || j < 0) return false;
  const d = i ^ j;
  return d === 1 || d === 2;
}

function* combinations<T>(items: readonly T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (items.length < k) return;
  const [head, ...tail] = items;
  for (const rest of combinations(tail, k - 1)) yield [head!, ...rest];
  yield* combinations(tail, k);
}

function nakedSubsetWithVirtual(
  virtualMask: number,
  outsideCells: readonly number[],
  grid: Grid,
  size: number,
): number[] | null {
  const need = size - 1;
  if (outsideCells.length < need) return null;
  for (const combo of combinations(outsideCells, need)) {
    const masks = [virtualMask, ...combo.map((c) => grid.candidatesOf(c))];
    const union = masks.reduce((acc, mask) => acc | mask, 0);
    if (popcount(union) !== size) continue;
    if (masks.length !== size) continue;
    if (!masks.every((mask) => (mask & ~union) === 0)) continue;
    return combo;
  }
  return null;
}

function urPairMask(grid: Grid, cells: number[]): number {
  const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
  return masks[0]! & masks[1]! & masks[2]! & masks[3]!;
}

export function tryURType1(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const exactMatch = cells.filter((c, i) => masks[i] === intersect);
    const floorCells = cells.filter((c, i) => masks[i] !== intersect && masks[i] !== 0);
    if (exactMatch.length !== 3 || floorCells.length !== 1) continue;

    const floor = floorCells[0]!;
    if ((grid.candidatesOf(floor) & intersect) === 0) continue;

    const urDigits = digitsOf(intersect);
    const elims = urDigits.filter((d) => grid.hasCandidate(floor, d)).map((d) => ({ cell: floor, digit: d }));
    if (elims.length === 0) continue;

    const [x, y] = urDigits as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: { cells, candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
      explanation: {
        zh: `唯一矩形 Type1：三格仅含 {${x},${y}}，第四格 R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} 须避免致死图案；消去 ${urDigits.join(',')}。`,
        en: `Unique Rectangle Type 1: three corners {${x},${y}}; floor R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} must avoid deadly pattern; eliminate ${urDigits.join(',')}.`,
      },
    };
  }
  return null;
}

export function tryURType2(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    const extras = floorCells.map((c) => {
      const mask = grid.candidatesOf(c);
      const extraMask = mask & ~intersect;
      return { cell: c, extraMask, count: popcount(extraMask) };
    });
    if (extras.some((e) => e.count !== 1)) continue;
    if (extras[0]!.extraMask !== extras[1]!.extraMask) continue;

    const z = digitsOf(extras[0]!.extraMask)[0]!;
    const peersF1 = new Set(PEERS_OF[floorCells[0]!]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const c of PEERS_OF[floorCells[1]!]!) {
      if (!peersF1.has(c) || floorCells.includes(c) || !grid.hasCandidate(c, z)) continue;
      elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: { cells: [...cells, ...elims.map((e) => e.cell)], candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
      explanation: {
        zh: `唯一矩形 Type2：底层格均含额外候选 ${z}（UR对 {${x},${y}}）；消去能看到两底层格的格中的 ${z}。`,
        en: `Unique Rectangle Type 2: floor cells share extra ${z} (UR {${x},${y}}); eliminate ${z} from cells seeing both floors.`,
      },
    };
  }
  return null;
}

export function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const floorCells = cells.filter((_, i) => masks[i] === intersect);
    const roofCells = cells.filter((_, i) => {
      const m = masks[i]!;
      return m !== intersect && m !== 0 && (m & intersect) === intersect;
    });
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;
    if (!isAdjacentRoofPair(cells, roofCells[0]!, roofCells[1]!)) continue;

    const combinedExtras = roofCells.reduce((acc, c) => acc | (grid.candidatesOf(c) & ~intersect), 0);
    const subsetSize = popcount(combinedExtras);
    if (subsetSize < 2) continue;

    const [r0, r1] = roofCells as [number, number];
    for (const houseIdx of getCommonHouses(r0, r1)) {
      const house = HOUSES[houseIdx]!;
      const outsidePool: number[] = [];
      for (const c of house) {
        if (roofCells.includes(c) || floorCells.includes(c) || grid.get(c) !== 0) continue;
        if (!seesBoth(c, r0, r1)) continue;
        const cm = grid.candidatesOf(c);
        if ((cm & ~combinedExtras) !== 0) continue;
        if ((cm & combinedExtras) === 0) continue;
        outsidePool.push(c);
      }

      const outsideSubset = nakedSubsetWithVirtual(combinedExtras, outsidePool, grid, subsetSize);
      if (!outsideSubset) continue;

      const subsetDigits = digitsOf(combinedExtras);
      const subsetMembers = new Set([...roofCells, ...outsideSubset]);
      const elims: { cell: number; digit: number }[] = [];
      for (const c of house) {
        if (subsetMembers.has(c) || grid.get(c) !== 0) continue;
        for (const d of subsetDigits) {
          if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
      }
      if (elims.length === 0) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: { cells: [...cells, ...elims.map((e) => e.cell)], candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
        explanation: {
          zh: `唯一矩形 Type3：屋顶格与宫外格在共享宫中构成裸子集，UR对 {${x},${y}}；消去子集数字。`,
          en: `Unique Rectangle Type 3: roof pseudo-cell completes naked subset in shared house (UR {${x},${y}}); eliminate subset digits.`,
        },
      };
    }
  }
  return null;
}

export function tryURType4(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const roofCells = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => {
      const m = masks[i]!;
      return m !== intersect && (m & intersect) === intersect;
    });
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      for (const houseIdx of getCommonHouses(floorCells[0]!, floorCells[1]!)) {
        const house = HOUSES[houseIdx]!;
        const lockedInHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
        if (lockedInHouse.some((c) => !floorCells.includes(c))) continue;
        const elims = floorCells.filter((c) => grid.hasCandidate(c, elim)).map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: { cells, candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
          explanation: {
            zh: `唯一矩形 Type4：{${x},${y}} 中 ${locked} 锁定于底层格；消去底层格的 ${elim}。`,
            en: `Unique Rectangle Type 4: ${locked} locked in floor cells of {${x},${y}}; eliminate ${elim} from floors.`,
          },
        };
      }
    }
  }
  return null;
}

function elimSeeingAll(corners: readonly number[], z: number, grid: Grid): { cell: number; digit: number }[] {
  const elims: { cell: number; digit: number }[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || !grid.hasCandidate(c, z)) continue;
    if (corners.every((corner) => corner === c || PEERS_OF[corner]!.includes(c))) {
      elims.push({ cell: c, digit: z });
    }
  }
  return elims;
}

export function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const [c11, c12, c21, c22] = cells;
    const diagLayouts: [number[], number[]][] = [
      [[c11, c22], [c12, c21]],
      [[c12, c21], [c11, c22]],
    ];

    for (const [roofCells, floorCells] of diagLayouts) {
      if (!floorCells.every((c) => grid.get(c) === 0 && grid.candidatesOf(c) === intersect)) continue;
      const extras = roofCells.map((c) => grid.candidatesOf(c) & ~intersect);
      if (extras.some((e) => popcount(e) !== 1)) continue;
      if (extras[0] !== extras[1]) continue;

      const z = digitsOf(extras[0]!)[0]!;
      const elims = elimSeeingAll(roofCells, z, grid);
      if (elims.length === 0) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: { cells: [...cells, ...elims.map((e) => e.cell)], candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
        explanation: {
          zh: `唯一矩形 Type5：对角格含相同额外候选 ${z}（UR {${x},${y}}）；消去能看到两对角格的格中的 ${z}。`,
          en: `Unique Rectangle Type 5: diagonal corners share extra ${z} (UR {${x},${y}}); eliminate ${z} from cells seeing both diagonal corners.`,
        },
      };
    }

    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const floorCells = cells.filter((_, i) => masks[i] === intersect);
    const roofCells = cells.filter((_, i) => {
      const extra = masks[i]! & ~intersect;
      return extra !== 0 && popcount(extra) === 1;
    });
    if (floorCells.length !== 1 || roofCells.length !== 3) continue;

    const extraMask = grid.candidatesOf(roofCells[0]!) & ~intersect;
    if (!roofCells.every((c) => (grid.candidatesOf(c) & ~intersect) === extraMask)) continue;

    const z = digitsOf(extraMask)[0]!;
    const elims = elimSeeingAll(roofCells, z, grid);
    if (elims.length === 0) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: { cells: [...cells, ...elims.map((e) => e.cell)], candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
      explanation: {
        zh: `唯一矩形 Type5：三角格含相同额外候选 ${z}（UR {${x},${y}}）；消去能看到三格的格中的 ${z}。`,
        en: `Unique Rectangle Type 5: three corners share extra ${z} (UR {${x},${y}}); eliminate ${z} from cells seeing all three.`,
      },
    };
  }
  return null;
}

export function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const [c11, c12, c21, c22] = cells;
    const diagLayouts: [number[], number[]][] = [
      [[c11, c22], [c12, c21]],
      [[c12, c21], [c11, c22]],
    ];

    for (const [roofCells, floorCells] of diagLayouts) {
      if (!floorCells.every((c) => grid.get(c) === 0 && grid.candidatesOf(c) === intersect)) continue;
      if (!roofCells.every((c) => {
        const extra = grid.candidatesOf(c) & ~intersect;
        return extra !== 0 && (grid.candidatesOf(c) & intersect) === intersect;
      })) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      for (const locked of [x, y]) {
        const bit = maskOf(locked);
        const rows = new Set([ROW_OF[c11]!, ROW_OF[c12]!]);
        const cols = new Set([COL_OF[c11]!, COL_OF[c12]!]);
        let xwing = true;
        for (const r of rows) {
          for (let c = 0; c < 9; c++) {
            const cell = r * 9 + c;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) && !cells.includes(cell)) {
              xwing = false;
              break;
            }
          }
          if (!xwing) break;
        }
        if (!xwing) continue;
        for (const col of cols) {
          for (let r = 0; r < 9; r++) {
            const cell = r * 9 + col;
            if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) && !cells.includes(cell)) {
              xwing = false;
              break;
            }
          }
          if (!xwing) break;
        }
        if (!xwing) continue;

        const elims: { cell: number; digit: number }[] = [];
        for (const roof of roofCells) {
          if (grid.hasCandidate(roof, locked)) elims.push({ cell: roof, digit: locked });
        }
        if (elims.length === 0) continue;

        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: { cells, candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
          explanation: {
            zh: `唯一矩形 Type6：对角格含额外候选，底层格仅 {${x},${y}}；${locked} 在矩形行列构成 X-Wing，消去对角格的 ${locked}。`,
            en: `Unique Rectangle Type 6: diagonal roof corners carry extras, floor cells are {${x},${y}} only; ${locked} forms X-Wing on UR rows/cols — eliminate ${locked} from diagonal roof corners.`,
          },
        };
      }
    }
  }
  return null;
}

export function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const cells = rect;
    const intersect = urPairMask(grid, cells);
    if (popcount(intersect) !== 2) continue;

    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const [x, y] = digitsOf(intersect) as [number, number];

    for (let i = 0; i < 4; i++) {
      const oppIdx = DIAG_OPPOSITE[i]!;
      const start = cells[i]!;
      const opposite = cells[oppIdx]!;
      if (masks[i] !== intersect) continue;
      if ((masks[oppIdx]! & intersect) !== intersect) continue;
      if (popcount(masks[oppIdx]!) <= 2) continue;

      const oppRow = ROW_OF[opposite]!;
      const oppCol = COL_OF[opposite]!;
      for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
        const bit = maskOf(locked);
        const rowHouse = HOUSES[oppRow]!;
        const colHouse = HOUSES[9 + oppCol]!;
        const urRowCells = rowHouse.filter((c) => cells.includes(c));
        const urColCells = colHouse.filter((c) => cells.includes(c));
        const rowLocked = urRowCells.filter((c) => grid.hasCandidate(c, locked));
        const colLocked = urColCells.filter((c) => grid.hasCandidate(c, locked));
        if (rowLocked.length !== 2 || colLocked.length !== 2) continue;
        const inRowOutside = rowHouse.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        const inColOutside = colHouse.filter((c) => !cells.includes(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        if (inRowOutside.length > 0 || inColOutside.length > 0) continue;
        if (!grid.hasCandidate(opposite, elim)) continue;

        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: opposite, digit: elim }],
          highlights: { cells, candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
          explanation: {
            zh: `隐性唯一矩形：{${x},${y}} 中 ${locked} 在 R${oppRow + 1}/C${oppCol + 1} 宫外不出现；对角格 R${ROW_OF[opposite]! + 1}C${COL_OF[opposite]! + 1} 消去 ${elim}。`,
            en: `Hidden Unique Rectangle: ${locked} of {${x},${y}} absent outside UR in opposite row/col; eliminate ${elim} from R${ROW_OF[opposite]! + 1}C${COL_OF[opposite]! + 1}.`,
          },
        };
      }
    }
  }
  return null;
}

export function tryBUGPlus1(grid: Grid, strategyId: string): Step | null {
  const emptyCells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) emptyCells.push(c);
  }

  const nonBivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);
  if (nonBivalue.length !== 1) return null;

  const specialCell = nonBivalue[0]!;
  const specialMask = grid.candidatesOf(specialCell);
  if (popcount(specialMask) !== 3) return null;
  if (emptyCells.some((c) => c !== specialCell && popcount(grid.candidatesOf(c)) !== 2)) return null;

  const bugDigits: number[] = [];
  for (const d of digitsOf(specialMask)) {
    const bit = maskOf(d);
    let isOddInAnyHouse = false;
    for (const houseIdx of [ROW_OF[specialCell]!, 9 + COL_OF[specialCell]!, 18 + BOX_OF[specialCell]!]) {
      const house = HOUSES[houseIdx]!;
      const count = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
      if (count % 2 === 1) { isOddInAnyHouse = true; break; }
    }
    if (isOddInAnyHouse) bugDigits.push(d);
  }
  if (bugDigits.length !== 1) return null;

  const bugDigit = bugDigits[0]!;
  return {
    strategyId,
    placements: [{ cell: specialCell, digit: bugDigit }],
    eliminations: [],
    highlights: { cells: [specialCell], candidates: digitsOf(specialMask).map((d) => ({ cell: specialCell, digit: d })), links: [] },
    explanation: {
      zh: `BUG+1：仅 R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} 三候选，${bugDigit} 为奇次 BUG 数；填入 ${bugDigit}。`,
      en: `BUG+1: only R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} has 3 candidates; place odd BUG digit ${bugDigit}.`,
    },
  };
}