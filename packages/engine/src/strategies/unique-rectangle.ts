/**
 * Shared Unique Rectangle engine (P0 / E3).
 *
 * Implements Unique Rectangle Types 1, 2, 3, 4, 5, 6 plus Hidden UR.
 * All functions return the first applicable step with the requested strategyId,
 * preserving the existing per-type difficulty ordering.
 */

import {
  CELLS, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';

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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

/** All four cells currently contain the UR pair and possibly extras. */
function classifyRectangle(grid: Grid, cells: number[], pairMask: number) {
  const floor: number[] = [];
  const roof: number[] = [];
  for (const c of cells) {
    const m = grid.candidatesOf(c);
    if (m === pairMask) {
      floor.push(c);
    } else if ((m & pairMask) === pairMask) {
      roof.push(c);
    }
  }
  return { floor, roof };
}

// ============================================================
// Type 1
// ============================================================

export function tryUniqueRectangleType1(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const exactMatch = cells.filter((c, i) => masks[i] === intersect);
    const floorCells = cells.filter((c, i) => masks[i] !== intersect && masks[i] !== 0);
    if (exactMatch.length !== 3 || floorCells.length !== 1) continue;

    const floor = floorCells[0]!;
    if ((grid.candidatesOf(floor) & intersect) === 0) continue;

    const urDigits = digitsOf(intersect);
    const elims = urDigits
      .filter((d) => grid.hasCandidate(floor, d))
      .map((d) => ({ cell: floor, digit: d }));
    if (elims.length === 0) continue;

    const [x, y] = urDigits as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: {
        cells,
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `唯一矩形 Type 1：四个角格中三格仅含 {${x},${y}}，若 ${cellLabel(floor)} 也只有 {${x},${y}} 则产生双解；消去该格的 ${urDigits.join(',')}。`,
        en: `Unique Rectangle Type 1: three corners contain only {${x},${y}}; if ${cellLabel(floor)} also has only {${x},${y}}, there are two solutions; eliminate ${urDigits.join(',')} from ${cellLabel(floor)}.`,
      },
    };
  }
  return null;
}

// ============================================================
// Type 2
// ============================================================

export function tryUniqueRectangleType2(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const { floor, roof } = classifyRectangle(grid, cells, intersect);
    if (floor.length !== 2 || roof.length !== 2) continue;

    const extras = roof.map((c) => {
      const extraMask = grid.candidatesOf(c) & ~intersect;
      return { cell: c, extraMask, count: popcount(extraMask) };
    });
    if (extras.some((e) => e.count !== 1)) continue;
    if (extras[0]!.extraMask !== extras[1]!.extraMask) continue;

    const z = digitsOf(extras[0]!.extraMask)[0]!;
    const peersR1 = new Set(PEERS_OF[roof[0]!]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const c of PEERS_OF[roof[1]!]!) {
      if (!peersR1.has(c)) continue;
      if (c === roof[0] || c === roof[1]) continue;
      if (!grid.hasCandidate(c, z)) continue;
      elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
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
        zh: `唯一矩形 Type 2：两个屋顶格均含额外候选数 ${z}（UR对 {${x},${y}}）；必须填入 ${z} 以避免双解；消去能看到两屋顶格的格中的 ${z}。`,
        en: `Unique Rectangle Type 2: both roof cells have extra candidate ${z} (UR pair {${x},${y}}); ${z} must go in one roof cell to avoid dual solutions; eliminate ${z} from cells seeing both roof cells.`,
      },
    };
  }
  return null;
}

// ============================================================
// Type 3
// ============================================================

function* combinations<T>(arr: T[], size: number): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  if (arr.length < size) return;
  if (size === 1) {
    for (const x of arr) yield [x];
    return;
  }
  const first = arr[0]!;
  for (const tail of combinations(arr.slice(1), size - 1)) yield [first, ...tail];
  for (const tail of combinations(arr.slice(1), size)) yield tail;
}

export function tryUniqueRectangleType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const { floor, roof } = classifyRectangle(grid, cells, intersect);
    if (floor.length !== 2 || roof.length !== 2) continue;

    const sharedHouses = getCommonHouses(roof[0]!, roof[1]!);
    if (sharedHouses.length === 0) continue;

    const extraMask = (grid.candidatesOf(roof[0]!) & ~intersect) | (grid.candidatesOf(roof[1]!) & ~intersect);
    const extraDigits = digitsOf(extraMask);
    if (extraDigits.length < 2) continue; // need a naked subset of size >= 2

    for (const houseIdx of sharedHouses) {
      const house = [...(houseIdx < 9 ? ROWS[houseIdx]! : houseIdx < 18 ? COLS[houseIdx - 9]! : BOXES[houseIdx - 18]!)];
      const outside = house.filter((c) => c !== roof[0] && c !== roof[1] && grid.get(c) === 0);
      const subsetSize = extraDigits.length;
      const need = subsetSize - 2;
      for (const chosen of combinations(outside, need)) {
        if (chosen.some((c) => !digitsOf(grid.candidatesOf(c)).every((d) => extraMask & maskOf(d)))) continue;
        const unionDigits = new Set<number>();
        for (const c of chosen) {
          for (const d of digitsOf(grid.candidatesOf(c))) unionDigits.add(d);
        }
        for (const d of extraDigits) unionDigits.add(d);
        if (unionDigits.size !== subsetSize) continue;

        const subsetCells = new Set([...roof, ...chosen]);
        const elims: { cell: number; digit: number }[] = [];
        for (const c of house) {
          if (subsetCells.has(c)) continue;
          if (grid.get(c) !== 0) continue;
          for (const d of extraDigits) {
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length === 0) continue;

        const [x, y] = digitsOf(intersect) as [number, number];
        const r0 = roof[0]!;
        const r1 = roof[1]!;
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells, ...chosen, ...elims.map((e) => e.cell)],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `唯一矩形 Type 3：UR对 {${x},${y}} 的两屋顶格 ${cellLabel(r0)}、${cellLabel(r1)} 与选定格在共用${houseIdx < 9 ? '行' : houseIdx < 18 ? '列' : '宫'}中构成裸数组 {${extraDigits.join(',')}}；消去该${houseIdx < 9 ? '行' : houseIdx < 18 ? '列' : '宫'}中数组外的相应候选数。`,
            en: `Unique Rectangle Type 3: the two roof cells of UR pair {${x},${y}} form a naked subset {${extraDigits.join(',')}} with outside cells in the shared ${houseIdx < 9 ? 'row' : houseIdx < 18 ? 'column' : 'box'}; eliminate those digits from the rest of the ${houseIdx < 9 ? 'row' : houseIdx < 18 ? 'column' : 'box'}.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================
// Type 4
// ============================================================

export function tryUniqueRectangleType4(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const { floor, roof } = classifyRectangle(grid, cells, intersect);
    if (floor.length !== 2 || roof.length !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
    for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      for (const houseIdx of getCommonHouses(roof[0]!, roof[1]!)) {
        const house = houseIdx < 9 ? ROWS[houseIdx]! : houseIdx < 18 ? COLS[houseIdx - 9]! : BOXES[houseIdx - 18]!;
        const lockedInHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
        const nonFloorWithLocked = lockedInHouse.filter((c) => !roof.includes(c));
        if (nonFloorWithLocked.length !== 0) continue;
        const elims = roof.filter((c) => grid.hasCandidate(c, elim)).map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;
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
            zh: `唯一矩形 Type 4：UR对 {${x},${y}} 中，${locked} 在屋顶格共享宫/行/列中只出现在屋顶格；屋顶格必须为 ${locked}，故消去屋顶格的 ${elim}。`,
            en: `Unique Rectangle Type 4: UR pair {${x},${y}}; ${locked} is confined to the roof cells in their shared house, so the roof cells must be ${locked}; eliminate ${elim} from the roof cells.`,
          },
        };
      }
    }
  }
  return null;
}

// ============================================================
// Type 5
// ============================================================

export function tryUniqueRectangleType5(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const { floor, roof } = classifyRectangle(grid, cells, intersect);
    if (roof.length < 2 || roof.length > 3) continue;

    // Extra candidates must be a single digit c and present in every roof cell.
    const roofExtras = roof.map((c) => grid.candidatesOf(c) & ~intersect);
    if (roofExtras.some((m) => popcount(m) !== 1)) continue;
    const firstExtra = roofExtras[0]!;
    if (roofExtras.some((m) => m !== firstExtra)) continue;
    const z = digitsOf(firstExtra)[0]!;

    // Roof cells must be diagonal when there are exactly two; otherwise three corners.
    if (roof.length === 2) {
      const a = roof[0]!;
      const b = roof[1]!;
      if (ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b]) continue;
    }

    // Eliminate z from cells that see all roof cells.
    let viewers = new Set(PEERS_OF[roof[0]!]!);
    for (let i = 1; i < roof.length; i++) {
      viewers = new Set([...viewers].filter((c) => PEERS_OF[roof[i]!]!.includes(c)));
    }
    const elims: { cell: number; digit: number }[] = [];
    for (const c of viewers) {
      if (cells.includes(c)) continue;
      if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;

    const [x, y] = digitsOf(intersect) as [number, number];
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
        zh: `唯一矩形 Type 5：UR对 {${x},${y}} 的屋顶格均含额外候选数 ${z}；必须有一个屋顶格填入 ${z} 以避免双解，消去能看到全部屋顶格的格中的 ${z}。`,
        en: `Unique Rectangle Type 5: the roof cells of UR pair {${x},${y}} all contain extra candidate ${z}; one roof cell must be ${z} to avoid dual solutions; eliminate ${z} from cells seeing every roof cell.`,
      },
    };
  }
  return null;
}

// ============================================================
// Type 6
// ============================================================

export function tryUniqueRectangleType6(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const { floor, roof } = classifyRectangle(grid, cells, intersect);
    if (floor.length !== 2 || roof.length !== 2) continue;
    if (ROW_OF[roof[0]!] === ROW_OF[roof[1]!] || COL_OF[roof[0]!] === COL_OF[roof[1]!]) continue; // diagonal

    const rows = new Set<number>([ROW_OF[c11]!, ROW_OF[c22]!]);
    const cols = new Set<number>([COL_OF[c11]!, COL_OF[c22]!]);
    const [x, y] = digitsOf(intersect) as [number, number];
    const elims: { cell: number; digit: number }[] = [];

    for (const d of [x, y]) {
      const bit = maskOf(d);
      let confined = true;
      for (const r of rows) {
        for (const c of ROWS[r]!) {
          if (cells.includes(c)) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            confined = false;
            break;
          }
        }
        if (!confined) break;
      }
      if (confined) {
        for (const co of cols) {
          for (const c of COLS[co]!) {
            if (cells.includes(c)) continue;
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
              confined = false;
              break;
            }
          }
          if (!confined) break;
        }
      }
      if (confined) {
        for (const r of roof) {
          if (grid.hasCandidate(r, d)) elims.push({ cell: r, digit: d });
        }
      }
    }

    if (elims.length === 0) continue;
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
        zh: `唯一矩形 Type 6：UR对 {${x},${y}} 中某数字在两行两列上构成 X-Wing，填入对角屋顶格会迫使致死模式；消去该数字于两屋顶格。`,
        en: `Unique Rectangle Type 6: one digit of UR pair {${x},${y}} forms an X-Wing over the two rows and columns; placing it in a diagonal roof cell would force the deadly pattern, so eliminate it from both roof cells.`,
      },
    };
  }
  return null;
}

// ============================================================
// Hidden UR
// ============================================================

export function tryHiddenUniqueRectangle(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => grid.candidatesOf(c));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const [x, y] = digitsOf(intersect) as [number, number];

    // Try each diagonal pair (clean corner, target corner).
    const diagonals: Array<[number, number]> = [
      [c11, c22],
      [c12, c21],
    ];

    for (const [clean, target] of diagonals) {
      if (grid.candidatesOf(clean) !== intersect) continue;
      if ((grid.candidatesOf(target) & intersect) !== intersect) continue;

      const targetRow = ROW_OF[target]!;
      const targetCol = COL_OF[target]!;
      const rowMate = targetRow === ROW_OF[c11] ? (COL_OF[target] === COL_OF[c11] ? c12 : c11) : (COL_OF[target] === COL_OF[c21] ? c22 : c21);
      const colMate = targetCol === COL_OF[c11] ? (ROW_OF[target] === ROW_OF[c11] ? c21 : c11) : (ROW_OF[target] === ROW_OF[c12] ? c22 : c12);

      const elims: { cell: number; digit: number }[] = [];
      for (const d of [x, y]) {
        const bit = maskOf(d);
        const other = d === x ? y : x;
        // Strong link in target's row: d appears only in target and its row mate.
        let rowStrong = true;
        for (const c of ROWS[targetRow]!) {
          if (c === target || c === rowMate) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            rowStrong = false;
            break;
          }
        }
        // Strong link in target's column: d appears only in target and its col mate.
        let colStrong = true;
        for (const c of COLS[targetCol]!) {
          if (c === target || c === colMate) continue;
          if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
            colStrong = false;
            break;
          }
        }
        if (rowStrong && colStrong && grid.hasCandidate(target, other)) {
          elims.push({ cell: target, digit: other });
        }
      }
      if (elims.length === 0) continue;
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells,
          candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `隐性唯一矩形：${cellLabel(clean)} 为裸双值格，${cellLabel(target)} 对角相对；某 UR 数字在其所在行、列均只出现在矩形内，迫使该格不能填入 ${elims.map((e) => e.digit).join(',')}。`,
          en: `Hidden Unique Rectangle: ${cellLabel(clean)} is a naked bivalue cell diagonally opposite ${cellLabel(target)}; a UR digit is confined to the rectangle in the target's row and column, forcing ${elims.map((e) => e.digit).join(',')} out of ${cellLabel(target)}.`,
        },
      };
    }
  }
  return null;
}
