/**
 * Shared Unique Rectangle engine (E3).
 *
 * Centralises rectangle enumeration and per-type detectors used by
 * unique-rectangle-type-{1,2,3,4,5,6} and hidden-unique-rectangle strategies.
 */

import {
  CELLS, ROWS, COLS, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';

export type UrType =
  | 'type-1'
  | 'type-2'
  | 'type-3'
  | 'type-4'
  | 'type-5'
  | 'type-6'
  | 'hidden';

/** Find all UR rectangles: 4 cells in 2 rows, 2 cols, spanning exactly 2 boxes. */
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

export function tryUrType(
  grid: Grid,
  type: UrType,
  strategyId: string,
): Step | null {
  switch (type) {
    case 'type-1': return tryURType1(grid, strategyId);
    case 'type-2': return tryURType2(grid, strategyId);
    case 'type-3': return tryURType3(grid, strategyId);
    case 'type-4': return tryURType4(grid, strategyId);
    case 'type-5': return tryURType5(grid, strategyId);
    case 'type-6': return tryURType6(grid, strategyId);
    case 'hidden': return tryHiddenUR(grid, strategyId);
  }
}

function makeHighlights(grid: Grid, cells: readonly number[]): Step['highlights'] {
  return {
    cells: [...cells],
    candidates: cells.flatMap((c) =>
      digitsOf(grid.get(c) === 0 ? grid.candidatesOf(c) : 0).map((d) => ({ cell: c, digit: d })),
    ),
    links: [],
  };
}

function finalize(
  strategyId: string,
  cells: readonly number[],
  grid: Grid,
  eliminations: { cell: number; digit: number }[],
  placements: { cell: number; digit: number }[],
  explanation: { zh: string; en: string },
): Step | null {
  const elims = eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));
  const places = placements.filter((p) => grid.get(p.cell) === 0 && grid.hasCandidate(p.cell, p.digit));
  if (elims.length === 0 && places.length === 0) return null;
  return {
    strategyId,
    placements: places,
    eliminations: elims,
    highlights: makeHighlights(grid, cells),
    explanation,
  };
}

export function tryURType1(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    const exactMatch = cells.filter((_, i) => masks[i] === intersect);
    const floorCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
    if (exactMatch.length !== 3 || floorCells.length !== 1) continue;
    const floor = floorCells[0]!;
    if ((grid.candidatesOf(floor) & intersect) === 0) continue;
    const urDigits = digitsOf(intersect);
    const elims = urDigits.filter((d) => grid.hasCandidate(floor, d)).map((d) => ({ cell: floor, digit: d }));
    if (elims.length === 0) continue;
    const [x, y] = urDigits as [number, number];
    return finalize(strategyId, cells, grid, elims, [], {
      zh: `唯一矩形 Type1：三格仅含 {${x},${y}}，第四格 R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} 须避免致死图案；消去该格的 ${urDigits.join(',')}。`,
      en: `Unique Rectangle Type 1: three corners are {${x},${y}} only; floor R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} must avoid the deadly pattern; eliminate ${urDigits.join(',')}.`,
    });
  }
  return null;
}

export function tryURType2(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
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
      if (!peersF1.has(c)) continue;
      if (c === floorCells[0] || c === floorCells[1]) continue;
      if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;
    const [x, y] = digitsOf(intersect) as [number, number];
    return finalize(strategyId, [...cells, ...elims.map((e) => e.cell)], grid, elims, [], {
      zh: `唯一矩形 Type2：两底层格均含额外候选 ${z}（UR对 {${x},${y}}）；消去能看到两底层格的格中的 ${z}。`,
      en: `Unique Rectangle Type 2: both floor cells share extra ${z} (UR pair {${x},${y}}); eliminate ${z} from cells seeing both floors.`,
    });
  }
  return null;
}

function* chooseCells(cells: readonly number[], k: number): Generator<number[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (cells.length < k) return;
  for (let i = 0; i <= cells.length - k; i++) {
    for (const rest of chooseCells(cells.slice(i + 1), k - 1)) {
      yield [cells[i]!, ...rest];
    }
  }
}

function nakedSubsetMask(grid: Grid, physicalCells: readonly number[], digitMask: number): number | null {
  let union = 0;
  for (const c of physicalCells) {
    const m = grid.candidatesOf(c) & digitMask;
    if (m === 0) return null;
    union |= m;
  }
  if (union !== digitMask) return null;
  return union;
}

export function tryURType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const roofCells = cells.filter((_, i) => {
      const m = masks[i]!;
      return m !== intersect && m !== 0 && (m & intersect) === intersect && popcount(m) > 2;
    });
    if (roofCells.length !== 2) continue;

    const common = getCommonHouses(roofCells[0]!, roofCells[1]!);
    if (common.length === 0) continue;

    const pseudoMask =
      (grid.candidatesOf(roofCells[0]!) | grid.candidatesOf(roofCells[1]!)) & ~intersect;
    if (popcount(pseudoMask) < 1) continue;

    for (const houseIdx of common) {
      const house = HOUSES[houseIdx]!;
      const outside: number[] = [];
      for (const c of house) {
        if (cells.includes(c)) continue;
        if (grid.get(c) !== 0) continue;
        if ((grid.candidatesOf(c) & pseudoMask) !== 0) outside.push(c);
      }

      const maxOutside = Math.min(outside.length, popcount(pseudoMask) - 1);
      for (let k = 0; k <= maxOutside; k++) {
        for (const combo of chooseCells(outside, k)) {
          const subsetMask = nakedSubsetMask(grid, [...roofCells, ...combo], pseudoMask);
          if (subsetMask === null) continue;
          const logicalSize = 1 + combo.length;
          if (popcount(subsetMask) !== logicalSize) continue;

          const physicalSubset = new Set([...roofCells, ...combo]);
          const subsetDigits = digitsOf(subsetMask);
          const elims: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (physicalSubset.has(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of subsetDigits) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;
          const [x, y] = digitsOf(intersect) as [number, number];
          return finalize(strategyId, [...cells, ...elims.map((e) => e.cell)], grid, elims, [], {
            zh: `唯一矩形 Type3：屋顶伪格与宫外格在共享宫/行/列形成裸子集 {${subsetDigits.join(',')}}（UR对 {${x},${y}}）；消去子集数字。`,
            en: `Unique Rectangle Type 3: roof pseudo-cell completes naked subset {${subsetDigits.join(',')}} in shared house (UR {${x},${y}}); eliminate subset digits elsewhere.`,
          });
        }
      }
    }
  }
  return null;
}

export function tryURType4(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
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
        const nonFloorWithLocked = lockedInHouse.filter((c) => !floorCells.includes(c));
        if (nonFloorWithLocked.length !== 0) continue;
        const elims = floorCells
          .filter((c) => grid.hasCandidate(c, elim))
          .map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;
        return finalize(strategyId, cells, grid, elims, [], {
          zh: `唯一矩形 Type4：UR对 {${x},${y}} 中 ${locked} 在底层共享宫中仅见于底层格；消去底层格的 ${elim}。`,
          en: `Unique Rectangle Type 4: UR {${x},${y}}; ${locked} confined to floor in shared house; eliminate ${elim} from floors.`,
        });
      }
    }
  }
  return null;
}

export function tryURType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const diagPairs: [number, number][] = [
      [c11, c22],
      [c12, c21],
    ];
    for (const [a, b] of diagPairs) {
      const ma = grid.get(a) === 0 ? grid.candidatesOf(a) : 0;
      const mb = grid.get(b) === 0 ? grid.candidatesOf(b) : 0;
      if (ma === 0 || mb === 0) continue;
      if ((ma & intersect) === 0 || (mb & intersect) === 0) continue;
      const others = cells.filter((c) => c !== a && c !== b);
      if (others.some((c) => grid.get(c) === 0 && grid.candidatesOf(c) !== intersect)) continue;
      const extraA = ma & ~intersect;
      const extraB = mb & ~intersect;
      if (popcount(extraA) !== 1 || popcount(extraB) !== 1) continue;
      if (extraA !== extraB) continue;
      const z = digitsOf(extraA)[0]!;
      const peersA = new Set(PEERS_OF[a]!);
      const elims: { cell: number; digit: number }[] = [];
      for (const c of PEERS_OF[b]!) {
        if (!peersA.has(c)) continue;
        if (c === a || c === b) continue;
        if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
      }
      if (elims.length === 0) continue;
      const [x, y] = digitsOf(intersect) as [number, number];
      return finalize(strategyId, [...cells, ...elims.map((e) => e.cell)], grid, elims, [], {
        zh: `唯一矩形 Type5：对角两格均含额外候选 ${z}（UR对 {${x},${y}}）；消去能看到两格的格中的 ${z}。`,
        en: `Unique Rectangle Type 5: diagonal corners share extra ${z} (UR {${x},${y}}); eliminate ${z} from cells seeing both.`,
      });
    }
  }
  return null;
}

export function tryURType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const rows = [ROW_OF[c11]!, ROW_OF[c21]!];
    const cols = [COL_OF[c11]!, COL_OF[c12]!];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const diagExtra = [
      [c11, c22],
      [c12, c21],
    ] as const;
    const roof = cells.filter((c) => grid.get(c) === 0 && grid.candidatesOf(c) === intersect);
    if (roof.length !== 2) continue;

    for (const [a, b] of diagExtra) {
      const ma = grid.get(a) === 0 ? grid.candidatesOf(a) : 0;
      const mb = grid.get(b) === 0 ? grid.candidatesOf(b) : 0;
      if (ma === 0 || mb === 0) continue;
      if ((ma & intersect) === 0 || (mb & intersect) === 0) continue;
      if (popcount(ma & ~intersect) < 1 || popcount(mb & ~intersect) < 1) continue;

      const [x, y] = digitsOf(intersect) as [number, number];
      for (const locked of [x, y]) {
        const bit = maskOf(locked);
        let xwing = true;
        for (const r of rows) {
          const inRow = ROWS[r]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          const inUr = inRow.filter((c) => cells.includes(c));
          if (inUr.length === 0 || inRow.some((c) => !cells.includes(c))) {
            xwing = false;
            break;
          }
        }
        if (!xwing) continue;
        for (const col of cols) {
          const inCol = COLS[col]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
          const inUr = inCol.filter((c) => cells.includes(c));
          if (inUr.length === 0 || inCol.some((c) => !cells.includes(c))) {
            xwing = false;
            break;
          }
        }
        if (!xwing) continue;
        const elim = locked === x ? y : x;
        const elims = [a, b].filter((c) => grid.hasCandidate(c, elim)).map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;
        return finalize(strategyId, cells, grid, elims, [], {
          zh: `唯一矩形 Type6：UR对 {${x},${y}} 中 ${locked} 在矩形行列形成 X-Wing；消去对角额外格的 ${elim}。`,
          en: `Unique Rectangle Type 6: UR {${x},${y}}; ${locked} forms X-Wing on rectangle lines; eliminate ${elim} from diagonal extras.`,
        });
      }
    }
  }
  return null;
}

export function tryHiddenUR(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const corners = [
      { cell: c11, opp: c22 },
      { cell: c12, opp: c21 },
      { cell: c21, opp: c12 },
      { cell: c22, opp: c11 },
    ];
    const masks = [c11, c12, c21, c22].map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;
    const [x, y] = digitsOf(intersect) as [number, number];

    for (const { cell: start, opp } of corners) {
      const startMask = grid.get(start) === 0 ? grid.candidatesOf(start) : 0;
      if (startMask === 0) continue;
      if (popcount(startMask & ~intersect) > 0) continue;

      const oppRow = ROW_OF[opp]!;
      const oppCol = COL_OF[opp]!;
      for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
        const bit = maskOf(locked);
        const rowCells = ROWS[oppRow]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        const colCells = COLS[oppCol]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        const urSet = new Set([c11, c12, c21, c22]);
        const rowOutside = rowCells.filter((c) => !urSet.has(c));
        const colOutside = colCells.filter((c) => !urSet.has(c));
        if (rowOutside.length > 0 || colOutside.length > 0) continue;
        if (!grid.hasCandidate(opp, elim)) continue;
        return finalize(strategyId, [c11, c12, c21, c22], grid, [{ cell: opp, digit: elim }], [], {
          zh: `隐性唯一矩形：从 R${ROW_OF[start]! + 1}C${COL_OF[start]! + 1} 看，对角 R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1} 所在行列中 ${locked} 仅见于 UR；消去该格的 ${elim}。`,
          en: `Hidden Unique Rectangle: from R${ROW_OF[start]! + 1}C${COL_OF[start]! + 1}, digit ${locked} in opposite row/col appears only on UR; eliminate ${elim} from R${ROW_OF[opp]! + 1}C${COL_OF[opp]! + 1}.`,
        });
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
      if (count % 2 === 1) {
        isOddInAnyHouse = true;
        break;
      }
    }
    if (isOddInAnyHouse) bugDigits.push(d);
  }
  if (bugDigits.length !== 1) return null;
  const bugDigit = bugDigits[0]!;
  return finalize(strategyId, [specialCell], grid, [], [{ cell: specialCell, digit: bugDigit }], {
    zh: `BUG+1：仅 R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} 有三候选，${bugDigit} 为 BUG 数；必须填入 ${bugDigit}。`,
    en: `BUG+1: only R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} has 3 candidates; ${bugDigit} is the BUG digit; place ${bugDigit}.`,
  });
}