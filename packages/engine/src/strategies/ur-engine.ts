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

// ---- Avoidable Rectangle (solved non-given corners) ----

function cellMask(grid: Grid, c: number): number {
  const v = grid.get(c);
  if (v === 0) return grid.candidatesOf(c);
  return maskOf(v);
}

function rectangleHasGiven(grid: Grid, cells: readonly number[]): boolean {
  return cells.some((c) => grid.isGiven(c));
}

function hasSolvedNonGiven(grid: Grid, cells: readonly number[]): boolean {
  return cells.some((c) => grid.get(c) !== 0 && !grid.isGiven(c));
}

function isDeadlySwap(vals: readonly [number, number, number, number]): boolean {
  const [a, b, c, d] = vals;
  return a === d && b === c && a !== b;
}

export function tryARType1(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    if (rectangleHasGiven(grid, cells)) continue;
    if (!hasSolvedNonGiven(grid, cells)) continue;

    const solved = cells.filter((c) => grid.get(c) !== 0);
    const unsolved = cells.filter((c) => grid.get(c) === 0);
    if (solved.length !== 3 || unsolved.length !== 1) continue;

    const floor = unsolved[0]!;
    const solvedVals = solved.map((c) => grid.get(c));
    if (new Set(solvedVals).size !== 2) continue;

    const vals = cells.map((c) => grid.get(c) || 0) as [number, number, number, number];
    const urDigits = [...new Set(solvedVals)];
    const elims: { cell: number; digit: number }[] = [];
    for (const d of urDigits) {
      const trial = [...vals] as [number, number, number, number];
      trial[cells.indexOf(floor)] = d;
      if (isDeadlySwap(trial) && grid.hasCandidate(floor, d)) {
        elims.push({ cell: floor, digit: d });
      }
    }
    if (elims.length === 0) continue;
    const [x, y] = urDigits as [number, number];
    const placements: { cell: number; digit: number }[] = [];
    const remaining = digitsOf(grid.candidatesOf(floor)).filter(
      (d) => !elims.some((e) => e.cell === floor && e.digit === d),
    );
    if (remaining.length === 1) {
      placements.push({ cell: floor, digit: remaining[0]! });
    }
    return finalize(strategyId, cells, grid, elims, placements, {
      zh: `可避免矩形 Type1：三格已解为 {${x},${y}} 互换型，开放格 R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} 须避免致死图案；消去 ${elims.map((e) => e.digit).join(',')}。`,
      en: `Avoidable Rectangle Type 1: three solved corners form {${x},${y}} swap; open R${ROW_OF[floor]! + 1}C${COL_OF[floor]! + 1} must avoid deadly pattern; eliminate ${elims.map((e) => e.digit).join(',')}.`,
    });
  }
  return null;
}

export function tryARType2(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    if (rectangleHasGiven(grid, cells)) continue;
    if (!hasSolvedNonGiven(grid, cells)) continue;

    const masks = cells.map((c) => cellMask(grid, c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const roofCells = cells.filter((_, i) => {
      const m = masks[i]!;
      return grid.get(cells[i]!) === 0 && m !== intersect && m !== 0;
    });
    const floorCells = cells.filter((_, i) => {
      const m = masks[i]!;
      return m === intersect || (grid.get(cells[i]!) !== 0 && (maskOf(grid.get(cells[i]!)) & intersect) !== 0);
    });
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;

    const extras = roofCells.map((c) => {
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
      if (floorCells.includes(c) || roofCells.includes(c)) continue;
      if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;
    const [x, y] = digitsOf(intersect) as [number, number];
    return finalize(strategyId, [...cells, ...elims.map((e) => e.cell)], grid, elims, [], {
      zh: `可避免矩形 Type2：两屋顶格均含额外候选 ${z}（UR对 {${x},${y}}）；消去能看到两屋顶格的格中的 ${z}。`,
      en: `Avoidable Rectangle Type 2: both roof cells share extra ${z} (UR pair {${x},${y}}); eliminate ${z} from cells seeing both roofs.`,
    });
  }
  return null;
}

export function tryARType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    if (rectangleHasGiven(grid, cells)) continue;
    if (!hasSolvedNonGiven(grid, cells)) continue;

    const masks = cells.map((c) => cellMask(grid, c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const roofCells = cells.filter((_, i) => {
      const c = cells[i]!;
      const m = masks[i]!;
      if (grid.get(c) !== 0) return false;
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
            zh: `可避免矩形 Type3：屋顶伪格与宫外格形成裸子集 {${subsetDigits.join(',')}}（UR对 {${x},${y}}）；消去子集数字。`,
            en: `Avoidable Rectangle Type 3: roof pseudo-cell completes naked subset {${subsetDigits.join(',')}} in shared house (UR {${x},${y}}); eliminate subset digits elsewhere.`,
          });
        }
      }
    }
  }
  return null;
}

export function tryARType4(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    if (rectangleHasGiven(grid, cells)) continue;
    if (!hasSolvedNonGiven(grid, cells)) continue;

    const masks = cells.map((c) => cellMask(grid, c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const roofCells = cells.filter((_, i) => grid.get(cells[i]!) === 0 && masks[i] === intersect);
    const floorCells = cells.filter((_, i) => {
      const c = cells[i]!;
      const m = masks[i]!;
      return m !== intersect && (m & intersect) === intersect;
    });
    if (roofCells.length !== 2 || floorCells.length !== 2) continue;
    const [x, y] = digitsOf(intersect) as [number, number];

    for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      for (const houseIdx of getCommonHouses(floorCells[0]!, floorCells[1]!)) {
        const house = HOUSES[houseIdx]!;
        const lockedInHouse = house.filter((c) => {
          if (grid.get(c) === 0) return (grid.candidatesOf(c) & lockedBit) !== 0;
          return grid.get(c) === locked;
        });
        const nonFloorWithLocked = lockedInHouse.filter((c) => !floorCells.includes(c));
        if (nonFloorWithLocked.length !== 0) continue;
        const elims = floorCells
          .filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, elim))
          .map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;
        return finalize(strategyId, cells, grid, elims, [], {
          zh: `可避免矩形 Type4：UR对 {${x},${y}} 中 ${locked} 在底层共享宫中仅见于底层格；消去底层格的 ${elim}。`,
          en: `Avoidable Rectangle Type 4: UR {${x},${y}}; ${locked} confined to floor in shared house; eliminate ${elim} from open floor cells.`,
        });
      }
    }
  }
  return null;
}

// ---- Extended Unique Rectangle (2×3, three digits) ----

export function* allExtendedRectangles(): Generator<readonly number[]> {
  for (let r1 = 0; r1 < 7; r1++) {
    for (let r2 = r1 + 1; r2 < 8; r2++) {
      for (let r3 = r2 + 1; r3 < 9; r3++) {
        for (let c1 = 0; c1 < 8; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2,
              r2 * 9 + c1, r2 * 9 + c2,
              r3 * 9 + c1, r3 * 9 + c2,
            ];
            if (new Set(cells.map((c) => BOX_OF[c]!)).size === 3) yield cells;
          }
        }
      }
    }
  }
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 7; c1++) {
        for (let c2 = c1 + 1; c2 < 8; c2++) {
          for (let c3 = c2 + 1; c3 < 9; c3++) {
            const cells = [
              r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
              r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
            ];
            if (new Set(cells.map((c) => BOX_OF[c]!)).size === 3) yield cells;
          }
        }
      }
    }
  }
}

export function tryExtendedUR(grid: Grid, strategyId: string): Step | null {
  for (const cells of allExtendedRectangles()) {
    let union = 0;
    for (const c of cells) {
      if (grid.get(c) !== 0) continue;
      union |= grid.candidatesOf(c);
    }
    if (popcount(union) !== 3) continue;
    const triple = union;

    const oddCells = cells.filter((c) => {
      if (grid.get(c) !== 0) return false;
      const extra = grid.candidatesOf(c) & ~triple;
      return popcount(extra) >= 1;
    });
    if (oddCells.length !== 1) continue;
    const odd = oddCells[0]!;
    const elims = digitsOf(triple)
      .filter((d) => grid.hasCandidate(odd, d))
      .map((d) => ({ cell: odd, digit: d }));
    if (elims.length === 0) continue;
    const tripleDigits = digitsOf(triple);
    return finalize(strategyId, cells, grid, elims, [], {
      zh: `扩展唯一矩形 Type1：六格并集为 {${tripleDigits.join(',')}}，奇出格 R${ROW_OF[odd]! + 1}C${COL_OF[odd]! + 1} 须避免致死图案；消去 ${tripleDigits.join(',')}。`,
      en: `Extended Unique Rectangle Type 1: six cells union {${tripleDigits.join(',')}}; odd cell R${ROW_OF[odd]! + 1}C${COL_OF[odd]! + 1} must avoid deadly pattern; eliminate ${tripleDigits.join(',')}.`,
    });
  }

  for (const cells of allExtendedRectangles()) {
    let union = 0;
    for (const c of cells) {
      if (grid.get(c) !== 0) continue;
      union |= grid.candidatesOf(c);
    }
    if (popcount(union) !== 3) continue;
    const triple = union;

    const floorCells = cells.filter((c) => {
      if (grid.get(c) !== 0) return false;
      return popcount(grid.candidatesOf(c) & triple) >= 1 && popcount(grid.candidatesOf(c) & ~triple) === 0;
    });
    const roofCells = cells.filter((c) => {
      if (grid.get(c) !== 0) return false;
      const extra = grid.candidatesOf(c) & ~triple;
      return popcount(extra) === 1 && (grid.candidatesOf(c) & triple) !== 0;
    });
    if (floorCells.length !== 4 || roofCells.length !== 2) continue;
    const extraA = grid.candidatesOf(roofCells[0]!) & ~triple;
    const extraB = grid.candidatesOf(roofCells[1]!) & ~triple;
    if (extraA !== extraB) continue;
    const z = digitsOf(extraA)[0]!;
    const peersR0 = new Set(PEERS_OF[roofCells[0]!]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const c of PEERS_OF[roofCells[1]!]!) {
      if (!peersR0.has(c)) continue;
      if (cells.includes(c)) continue;
      if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;
    const tripleDigits = digitsOf(triple);
    return finalize(strategyId, [...cells, ...elims.map((e) => e.cell)], grid, elims, [], {
      zh: `扩展唯一矩形 Type2：底层 {${tripleDigits.join(',')}}，屋顶共享额外 ${z}；消去能看到两屋顶格的 ${z}。`,
      en: `Extended Unique Rectangle Type 2: floor {${tripleDigits.join(',')}}, roofs share extra ${z}; eliminate ${z} from cells seeing both roofs.`,
    });
  }
  return null;
}

// ---- Unique Loop (even bivalue deadly loop) ----

function buildBivalueAdjacency(grid: Grid, a: number, b: number): Map<number, number[]> {
  const bitA = maskOf(a);
  const bitB = maskOf(b);
  const pairMask = bitA | bitB;
  const nodes: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (grid.candidatesOf(c) === pairMask) nodes.push(c);
  }
  const adj = new Map<number, number[]>();
  for (const c of nodes) adj.set(c, []);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const c = nodes[i]!;
      const p = nodes[j]!;
      if (!PEERS_OF[c]!.includes(p)) continue;
      adj.get(c)!.push(p);
      adj.get(p)!.push(c);
    }
  }
  return adj;
}

function findEvenLoop(
  start: number,
  adj: Map<number, number[]>,
  maxLen: number,
): number[] | null {
  const path: number[] = [start];

  function dfs(cur: number, parent: number): number[] | null {
    if (path.length > maxLen) return null;
    for (const next of adj.get(cur) ?? []) {
      if (next === parent) continue;
      if (next === start) {
        if (path.length >= 4 && path.length % 2 === 0) return [...path];
        continue;
      }
      if (path.includes(next)) continue;
      path.push(next);
      const found = dfs(next, cur);
      if (found) return found;
      path.pop();
    }
    return null;
  }
  return dfs(start, -1);
}

function isUniqueLoopDeadly(grid: Grid, loop: readonly number[], a: number, b: number): boolean {
  const bitA = maskOf(a);
  const bitB = maskOf(b);
  for (const house of HOUSES) {
    let countA = 0;
    let countB = 0;
    for (const c of house) {
      if (!loop.includes(c) || grid.get(c) !== 0) continue;
      const m = grid.candidatesOf(c);
      if (m & bitA) countA++;
      if (m & bitB) countB++;
    }
    if (countA > 0 && countA !== 2) return false;
    if (countB > 0 && countB !== 2) return false;
  }
  return true;
}

export function tryUniqueLoop(grid: Grid, strategyId: string): Step | null {
  for (let a = 1; a <= 8; a++) {
    for (let b = a + 1; b <= 9; b++) {
      const adj = buildBivalueAdjacency(grid, a, b);
      const seen = new Set<string>();
      for (const start of adj.keys()) {
        const loop = findEvenLoop(start, adj, 12);
        if (!loop) continue;
        const key = [...loop].sort((x, y) => x - y).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        if (!isUniqueLoopDeadly(grid, loop, a, b)) continue;

        for (const c of loop) {
          const mask = grid.candidatesOf(c);
          if (popcount(mask) <= 2) continue;
          const elims = [a, b]
            .filter((d) => grid.hasCandidate(c, d))
            .map((d) => ({ cell: c, digit: d }));
          if (elims.length === 0) continue;
          return finalize(strategyId, loop, grid, elims, [], {
            zh: `唯一环：偶数双值环 {${a},${b}}，R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1} 须避免致死环；消去 ${a},${b}。`,
            en: `Unique Loop: even bivalue loop on {${a},${b}}; R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1} must avoid deadly loop; eliminate ${a},${b}.`,
          });
        }
      }
    }
  }
  return null;
}

// ---- BUG Lite / BUG+N ----

function emptyCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) out.push(c);
  }
  return out;
}

function candidateCountInHouse(grid: Grid, house: readonly number[], digit: number): number {
  const bit = maskOf(digit);
  return house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
}

/** BUG digit: appears an odd number of times in every unit containing `cell`. */
function bugOddDigitsForCell(grid: Grid, cell: number, mask: number): number[] {
  const out: number[] = [];
  for (const d of digitsOf(mask)) {
    let oddInAll = true;
    for (const houseIdx of [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!]) {
      if (candidateCountInHouse(grid, HOUSES[houseIdx]!, d) % 2 === 0) {
        oddInAll = false;
        break;
      }
    }
    if (oddInAll) out.push(d);
  }
  return out;
}

/** True when every bivalue unsolved cell has even per-unit counts (near-BUG state). */
function isNearBugGrid(grid: Grid, nonBivalue: readonly number[]): boolean {
  const nonSet = new Set(nonBivalue);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if (nonSet.has(c)) continue;
    if (popcount(grid.candidatesOf(c)) !== 2) return false;
  }
  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      if (candidateCountInHouse(grid, house, d) % 2 === 1) return false;
    }
  }
  return true;
}

export function tryBugLite(grid: Grid, strategyId: string): Step | null {
  const empties = emptyCells(grid);
  const trivalue = empties.filter((c) => popcount(grid.candidatesOf(c)) === 3);
  if (trivalue.length !== 2) return null;
  if (empties.some((c) => popcount(grid.candidatesOf(c)) !== 2 && popcount(grid.candidatesOf(c)) !== 3)) {
    return null;
  }

  const [c1, c2] = trivalue as [number, number];
  const odd1 = bugOddDigitsForCell(grid, c1, grid.candidatesOf(c1));
  const odd2 = bugOddDigitsForCell(grid, c2, grid.candidatesOf(c2));
  if (odd1.length === 0 && odd2.length === 0) return null;

  const elims: { cell: number; digit: number }[] = [];
  const placements: { cell: number; digit: number }[] = [];
  for (const [cell, oddDigits, mask] of [
    [c1, odd1, grid.candidatesOf(c1)] as const,
    [c2, odd2, grid.candidatesOf(c2)] as const,
  ]) {
    const nonOdd = digitsOf(mask).filter((d) => !oddDigits.includes(d));
    for (const d of nonOdd) {
      if (grid.hasCandidate(cell, d)) elims.push({ cell, digit: d });
    }
    if (oddDigits.length === 1) {
      const d = oddDigits[0]!;
      if (grid.hasCandidate(cell, d)) placements.push({ cell, digit: d });
    }
  }
  return finalize(strategyId, trivalue, grid, elims, placements, {
    zh: `BUG Lite：两格三候选，其余双值；按奇偶 BUG 规则落子/消去。`,
    en: `BUG Lite: two trivalue cells among otherwise bivalue grid; place/eliminate via BUG parity.`,
  });
}

export function tryBugPlusN(grid: Grid, strategyId: string): Step | null {
  const empties = emptyCells(grid);
  const nonBivalue = empties.filter((c) => popcount(grid.candidatesOf(c)) !== 2);
  if (nonBivalue.length === 0) return null;
  if (empties.some((c) => popcount(grid.candidatesOf(c)) > 4)) return null;
  if (!isNearBugGrid(grid, nonBivalue)) return null;

  const extraSlots = nonBivalue.reduce(
    (n, c) => n + (popcount(grid.candidatesOf(c)) - 2),
    0,
  );
  if (extraSlots < 1) return null;

  if (nonBivalue.length === 1 && popcount(grid.candidatesOf(nonBivalue[0]!)) === 3) {
    return tryBUGPlus1(grid, strategyId);
  }

  const placements: { cell: number; digit: number }[] = [];
  const elims: { cell: number; digit: number }[] = [];

  for (const cell of nonBivalue) {
    const mask = grid.candidatesOf(cell);
    const odd = bugOddDigitsForCell(grid, cell, mask);
    const nonBug = digitsOf(mask).filter((d) => !odd.includes(d));
    for (const d of nonBug) {
      if (grid.hasCandidate(cell, d)) elims.push({ cell, digit: d });
    }
    if (odd.length === 1 && popcount(mask) === 3) {
      placements.push({ cell, digit: odd[0]! });
    }
  }

  if (placements.length === 0 && elims.length === 0) return null;

  return finalize(strategyId, nonBivalue, grid, elims, placements, {
    zh: `BUG+N：${nonBivalue.length} 格偏离双值，奇偶 BUG 数须落子；消去其余候选。`,
    en: `BUG+N: ${nonBivalue.length} non-bivalue cells; BUG parity digits must be placed; eliminate others.`,
  });
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
    if (bugOddDigitsForCell(grid, specialCell, specialMask).includes(d)) {
      bugDigits.push(d);
    }
  }
  if (bugDigits.length !== 1) return null;
  const bugDigit = bugDigits[0]!;
  return finalize(strategyId, [specialCell], grid, [], [{ cell: specialCell, digit: bugDigit }], {
    zh: `BUG+1：仅 R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} 有三候选，${bugDigit} 为 BUG 数；必须填入 ${bugDigit}。`,
    en: `BUG+1: only R${ROW_OF[specialCell]! + 1}C${COL_OF[specialCell]! + 1} has 3 candidates; ${bugDigit} is the BUG digit; place ${bugDigit}.`,
  });
}