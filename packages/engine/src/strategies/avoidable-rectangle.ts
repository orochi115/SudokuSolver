/**
 * Avoidable Rectangle (P1) — 可避矩形 Type 1–4
 *
 * Uses the same 2×2 rectangle geometry as Unique Rectangle but relies on the
 * fact that the deadly pattern requires the four corners to be non-givens.
 * If one diagonal pair (or roof) contains givens, the opposite diagonal/roof
 * cannot both be non-given with only the UR pair — otherwise the puzzle would
 * have multiple solutions.
 *
 * The Grid now exposes `givens: Uint8Array` so we can distinguish given cells.
 */

import {
  CELLS, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { allRectangles } from './unique-rectangle.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

function* combinations<T>(arr: T[], size: number): Generator<T[]> {
  if (size === 0) { yield []; return; }
  if (arr.length < size) return;
  if (size === 1) { for (const x of arr) yield [x]; return; }
  const [first, ...rest] = arr;
  for (const tail of combinations(rest, size - 1)) yield [first!, ...tail];
  for (const tail of combinations(rest, size)) yield tail;
}

function baseARCheck(grid: Grid, cells: number[]): { pairMask: number; floor: number[]; roof: number[]; givenCorners: number[] } | null {
  const masks = cells.map((c) => grid.candidatesOf(c));
  const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
  if (popcount(intersect) !== 2) return null;

  const floor: number[] = [];
  const roof: number[] = [];
  const givenCorners: number[] = [];
  for (let i = 0; i < 4; i++) {
    const c = cells[i]!;
    if (grid.givens[c]) givenCorners.push(c);
    const m = masks[i]!;
    if (m === intersect) floor.push(c);
    else if ((m & intersect) === intersect) roof.push(c);
  }
  return { pairMask: intersect, floor, roof, givenCorners };
}

export function tryAvoidableRectangleType1(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const check = baseARCheck(grid, rect);
    if (!check) continue;
    const { pairMask, roof, givenCorners } = check;
    if (roof.length !== 1 || givenCorners.length !== 1) continue;

    // The non-given roof is diagonally opposite the given corner.
    const target = roof[0]!;
    const given = givenCorners[0]!;
    const diag = rect.filter((c) => c !== target && c !== given);
    if (diag.length !== 2) continue;
    if (!grid.givens[diag[0]!] && !grid.givens[diag[1]!]) {
      // The given corner and target must be diagonal.
      const pairDigits = digitsOf(pairMask);
      const elims = pairDigits.filter((d) => grid.hasCandidate(target, d)).map((d) => ({ cell: target, digit: d }));
      if (elims.length === 0) continue;
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: { cells: rect, candidates: rect.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
        explanation: {
          zh: `可避矩形 Type 1：${cellLabel(given)} 为给定格，对角 ${cellLabel(target)} 若仅含 {${pairDigits.join(',')}} 将产生双解；消去该格的 {${pairDigits.join(',')}}。`,
          en: `Avoidable Rectangle Type 1: ${cellLabel(given)} is a given; the diagonal ${cellLabel(target)} cannot hold only {${pairDigits.join(',')}} without creating a deadly pattern, eliminating {${pairDigits.join(',')}}.`,
        },
      };
    }
  }
  return null;
}

export function tryAvoidableRectangleType2(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const check = baseARCheck(grid, rect);
    if (!check) continue;
    const { pairMask, roof, givenCorners } = check;
    if (roof.length !== 2 || givenCorners.length < 1) continue;

    const extras = roof.map((c) => {
      const extraMask = grid.candidatesOf(c) & ~pairMask;
      return { cell: c, extraMask, count: popcount(extraMask) };
    });
    if (extras.some((e) => e.count !== 1)) continue;
    if (extras[0]!.extraMask !== extras[1]!.extraMask) continue;
    const z = digitsOf(extras[0]!.extraMask)[0]!;

    const peers0 = new Set(PEERS_OF[roof[0]!]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const c of PEERS_OF[roof[1]!]!) {
      if (!peers0.has(c)) continue;
      if (c === roof[0] || c === roof[1]) continue;
      if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
    }
    if (elims.length === 0) continue;
    const [x, y] = digitsOf(pairMask) as [number, number];
    return {
      strategyId,
      placements: [],
      eliminations: elims,
      highlights: { cells: [...rect, ...elims.map((e) => e.cell)], candidates: rect.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
      explanation: {
        zh: `可避矩形 Type 2：屋顶格均含额外候选数 ${z}（UR对 {${x},${y}}）；消去能看到两屋顶格的格中的 ${z}。`,
        en: `Avoidable Rectangle Type 2: both roof cells contain extra candidate ${z} (UR pair {${x},${y}}); eliminate ${z} from cells seeing both roof cells.`,
      },
    };
  }
  return null;
}

export function tryAvoidableRectangleType3(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const check = baseARCheck(grid, rect);
    if (!check) continue;
    const { pairMask, roof, givenCorners } = check;
    if (roof.length !== 2 || givenCorners.length < 1) continue;

    const sharedHouses = commonHouses(roof[0]!, roof[1]!);
    if (sharedHouses.length === 0) continue;
    const extraMask = (grid.candidatesOf(roof[0]!) & ~pairMask) | (grid.candidatesOf(roof[1]!) & ~pairMask);
    const extraDigits = digitsOf(extraMask);
    if (extraDigits.length < 2) continue;

    for (const houseIdx of sharedHouses) {
      const house = houseIdx < 9 ? ROWS[houseIdx]! : houseIdx < 18 ? COLS[houseIdx - 9]! : BOXES[houseIdx - 18]!;
      const outside = house.filter((c) => c !== roof[0] && c !== roof[1] && grid.get(c) === 0);
      const need = extraDigits.length - 2;
      for (const chosen of combinations(outside, need)) {
        if (chosen.some((c) => !digitsOf(grid.candidatesOf(c)).every((d) => extraMask & maskOf(d)))) continue;
        const unionDigits = new Set(extraDigits);
        for (const c of chosen) for (const d of digitsOf(grid.candidatesOf(c))) unionDigits.add(d);
        if (unionDigits.size !== extraDigits.length) continue;
        const subsetCells = new Set([...roof, ...chosen]);
        const elims: { cell: number; digit: number }[] = [];
        for (const c of house) {
          if (subsetCells.has(c)) continue;
          if (grid.get(c) !== 0) continue;
          for (const d of extraDigits) if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
        }
        if (elims.length === 0) continue;
        const [x, y] = digitsOf(pairMask) as [number, number];
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: { cells: [...rect, ...chosen, ...elims.map((e) => e.cell)], candidates: rect.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
          explanation: {
            zh: `可避矩形 Type 3：UR对 {${x},${y}} 的屋顶格与选定格构成裸数组 {${extraDigits.join(',')}}；消去该 house 中数组外的相应候选数。`,
            en: `Avoidable Rectangle Type 3: roof cells of UR pair {${x},${y}} form a naked subset {${extraDigits.join(',')}} with outside cells; eliminate those digits from the rest of the house.`,
          },
        };
      }
    }
  }
  return null;
}

export function tryAvoidableRectangleType4(grid: Grid, strategyId: string): Step | null {
  for (const rect of allRectangles()) {
    const check = baseARCheck(grid, rect);
    if (!check) continue;
    const { pairMask, roof, givenCorners } = check;
    if (roof.length !== 2 || givenCorners.length < 1) continue;

    const [x, y] = digitsOf(pairMask) as [number, number];
    for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      for (const houseIdx of commonHouses(roof[0]!, roof[1]!)) {
        const house = houseIdx < 9 ? ROWS[houseIdx]! : houseIdx < 18 ? COLS[houseIdx - 9]! : BOXES[houseIdx - 18]!;
        const lockedInHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
        if (lockedInHouse.some((c) => !roof.includes(c))) continue;
        const elims = roof.filter((c) => grid.hasCandidate(c, elim)).map((c) => ({ cell: c, digit: elim }));
        if (elims.length === 0) continue;
        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: { cells: rect, candidates: rect.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))), links: [] },
          explanation: {
            zh: `可避矩形 Type 4：UR对 {${x},${y}} 中 ${locked} 被锁定在屋顶格；消去屋顶格的 ${elim}。`,
            en: `Avoidable Rectangle Type 4: in UR pair {${x},${y}}, ${locked} is locked to the roof cells; eliminate ${elim} from the roof cells.`,
          },
        };
      }
    }
  }
  return null;
}

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 975,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null { return tryAvoidableRectangleType1(grid, this.id); },
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 976,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null { return tryAvoidableRectangleType2(grid, this.id); },
};

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 977,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null { return tryAvoidableRectangleType3(grid, this.id); },
};

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 978,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null { return tryAvoidableRectangleType4(grid, this.id); },
};
