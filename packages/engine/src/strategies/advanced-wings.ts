/**
 * Advanced wing strategies (T3) — 进阶翼类
 *
 * - WXYZ-Wing: 4-cell bent quad with one non-restricted digit
 * - Remote Pairs: identical bivalue chains with odd-distance locked-pair endpoints
 * - Bent Sets (ALC): Almost Locked Pair/Triple at line–box intersections
 * - Broken Wing: single-digit odd loops with guardians
 */

import {
  CELLS,
  SIZE,
  ROWS,
  COLS,
  BOXES,
  ROW_OF,
  COL_OF,
  BOX_OF,
  HOUSES,
  PEERS_OF,
  maskOf,
  popcount,
  digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

// ---- shared helpers ----

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function sees(a: number, b: number): boolean {
  return a !== b && PEERS_OF[a]!.includes(b);
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function* combinations<T>(arr: readonly T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

interface ALS {
  cells: number[];
  digitMask: number;
  digits: number[];
}

function findALSInCells(grid: Grid, cells: readonly number[], maxSize: number): ALS[] {
  const empty = cells.filter((c) => grid.get(c) === 0);
  const result: ALS[] = [];
  for (let size = 1; size <= Math.min(maxSize, empty.length); size++) {
    for (const combo of combinations(empty, size)) {
      let m = 0;
      for (const c of combo) m |= grid.candidatesOf(c);
      if (popcount(m) === size + 1) {
        result.push({ cells: [...combo], digitMask: m, digits: digitsOf(m) });
      }
    }
  }
  return result;
}

/** Single-cell box anchor: holds ≥2 digits of S (handles ALP trivalue anchors like r2c9). */
function findBoxAnchors(grid: Grid, cells: readonly number[], digitMask: number): number[] {
  const anchors: number[] = [];
  for (const c of cells) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c) & digitMask;
    if (popcount(m) >= 2) anchors.push(c);
  }
  return anchors;
}

function lineHouse(lineIndex: number, lineIsRow: boolean): readonly number[] {
  return lineIsRow ? ROWS[lineIndex]! : COLS[lineIndex - 9]!;
}

function intersectionCells(lineIndex: number, boxIndex: number, lineIsRow: boolean): number[] {
  const line = lineHouse(lineIndex, lineIsRow);
  const boxSet = new Set(BOXES[boxIndex]!);
  return line.filter((c) => boxSet.has(c));
}

function lineOutsideIntersection(lineIndex: number, boxIndex: number, lineIsRow: boolean): number[] {
  const inter = new Set(intersectionCells(lineIndex, boxIndex, lineIsRow));
  const line = lineHouse(lineIndex, lineIsRow);
  return line.filter((c) => !inter.has(c));
}

function boxOutsideIntersection(lineIndex: number, boxIndex: number, lineIsRow: boolean): number[] {
  const interRows = new Set(
    intersectionCells(lineIndex, boxIndex, lineIsRow).map((c) => ROW_OF[c]!),
  );
  const box = BOXES[boxIndex]!;
  return box.filter((c) => !interRows.has(ROW_OF[c]!));
}

function unitHasNoDigits(grid: Grid, cells: readonly number[], digitMask: number): boolean {
  for (const c of cells) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & digitMask) !== 0) return false;
  }
  return true;
}

function stripForeignDigits(
  grid: Grid,
  cells: readonly number[],
  digitMask: number,
): CellDigit[] {
  const elims: CellDigit[] = [];
  for (const c of cells) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      if ((digitMask & maskOf(d)) === 0) elims.push({ cell: c, digit: d });
    }
  }
  return elims;
}

function elimSetDigits(
  grid: Grid,
  cells: readonly number[],
  digitMask: number,
): CellDigit[] {
  const elims: CellDigit[] = [];
  for (const c of cells) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      if (digitMask & maskOf(d)) elims.push({ cell: c, digit: d });
    }
  }
  return elims;
}

/** True when the cells use both a line and a box (not confined to one house). */
function usesLineAndBox(
  cells: readonly number[],
  lineIndex: number,
  boxIndex: number,
  lineIsRow: boolean,
): boolean {
  let lineSide = false;
  let boxSide = false;
  for (const c of cells) {
    const onLine = lineIsRow ? ROW_OF[c] === lineIndex : COL_OF[c] === lineIndex - 9;
    const onBox = BOX_OF[c] === boxIndex;
    if (!onLine && !onBox) return false;
    if (onLine) lineSide = true;
    if (onBox) boxSide = true;
  }
  return lineSide && boxSide;
}

function cellsSubsetOfUnion(grid: Grid, cells: readonly number[], union: number): boolean {
  for (const c of cells) {
    if (grid.get(c) !== 0) continue;
    if ((grid.candidatesOf(c) | union) !== union) return false;
  }
  return true;
}

// ---- WXYZ-Wing ----

function digitRestricted(cells: readonly number[], digit: number, grid: Grid): boolean {
  const withD = cells.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, digit));
  if (withD.length <= 1) return true;
  for (let i = 0; i < withD.length; i++) {
    for (let j = i + 1; j < withD.length; j++) {
      if (!sees(withD[i]!, withD[j]!)) return false;
    }
  }
  return true;
}

function bentRowBoxRegion(grid: Grid, row: number, box: number): number[] {
  const inter = intersectionCells(row, box, true);
  if (inter.length === 0) return [];
  const rowOnly = lineOutsideIntersection(row, box, true);
  const boxOnly = boxOutsideIntersection(row, box, true);
  return [...inter, ...rowOnly, ...boxOnly].filter((c) => grid.get(c) === 0);
}

function bentColBoxRegion(grid: Grid, col: number, box: number): number[] {
  const inter = intersectionCells(9 + col, box, false);
  if (inter.length === 0) return [];
  const colOnly = lineOutsideIntersection(9 + col, box, false);
  const boxOnly = boxOutsideIntersection(9 + col, box, false);
  return [...inter, ...colOnly, ...boxOnly].filter((c) => grid.get(c) === 0);
}

function tryWxyzWingType1(grid: Grid, strategyId: string): Step | null {
  for (let row = 0; row < 9; row++) {
    for (let box = 0; box < 9; box++) {
      const region = bentRowBoxRegion(grid, row, box);
      if (region.length < 4) continue;

      for (const four of combinations(region, 4)) {
        let union = 0;
        for (const c of four) union |= grid.candidatesOf(c);
        if (popcount(union) !== 4) continue;
        if (!cellsSubsetOfUnion(grid, four, union)) continue;
        if (!usesLineAndBox(four, row, box, true)) continue;

        const ds = digitsOf(union);
        const nonRestricted = ds.filter((d) => !digitRestricted(four, d, grid));
        if (nonRestricted.length !== 1) continue;

        const z = nonRestricted[0]!;
        const zBit = maskOf(z);
        const zCells = four.filter((c) => grid.candidatesOf(c) & zBit);
        const elims: CellDigit[] = [];

        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & zBit)) continue;
          if (four.includes(c)) continue;
          if (zCells.every((zc) => sees(c, zc))) elims.push({ cell: c, digit: z });
        }
        if (elims.length === 0) continue;

        const cellsStr = four.map((c) => cellLabel(c)).join(', ');

        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...four, ...elims.map((e) => e.cell)],
            candidates: [
              ...four.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...elims,
            ],
            links: [],
          },
          explanation: {
            zh: `WXYZ翼：第 ${row + 1} 行与第 ${box + 1} 宫的弯曲四格 {${ds.join(',')}} 中，非受限数 ${z} 必真；可从同时看到所有 ${z} 的格子中消去 ${z}。`,
            en: `WXYZ-Wing: bent 4-set {${ds.join(',')}} in row ${row + 1} and box ${box + 1}; non-restricted digit ${z} must hold; eliminate ${z} from cells seeing every ${z} in the pattern (${cellsStr}).`,
          },
        };
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    for (let box = 0; box < 9; box++) {
      const region = bentColBoxRegion(grid, col, box);
      if (region.length < 4) continue;

      for (const four of combinations(region, 4)) {
        let union = 0;
        for (const c of four) union |= grid.candidatesOf(c);
        if (popcount(union) !== 4) continue;
        if (!cellsSubsetOfUnion(grid, four, union)) continue;
        if (!usesLineAndBox(four, 9 + col, box, false)) continue;

        const ds = digitsOf(union);
        const nonRestricted = ds.filter((d) => !digitRestricted(four, d, grid));
        if (nonRestricted.length !== 1) continue;

        const z = nonRestricted[0]!;
        const zBit = maskOf(z);
        const zCells = four.filter((c) => grid.candidatesOf(c) & zBit);
        const elims: CellDigit[] = [];

        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & zBit)) continue;
          if (four.includes(c)) continue;
          if (zCells.every((zc) => sees(zc, c))) elims.push({ cell: c, digit: z });
        }
        if (elims.length === 0) continue;

        const cellsStr = four.map((c) => cellLabel(c)).join(', ');

        return {
          strategyId,
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...four, ...elims.map((e) => e.cell)],
            candidates: [
              ...four.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              ...elims,
            ],
            links: [],
          },
          explanation: {
            zh: `WXYZ翼：第 ${col + 1} 列与第 ${box + 1} 宫的弯曲四格 {${ds.join(',')}} 中，非受限数 ${z} 必真；可从同时看到所有 ${z} 的格子中消去 ${z}。`,
            en: `WXYZ-Wing: bent 4-set {${ds.join(',')}} in column ${col + 1} and box ${box + 1}; non-restricted digit ${z} must hold; eliminate ${z} from cells seeing every ${z} in the pattern (${cellsStr}).`,
          },
        };
      }
    }
  }
  return null;
}

function tryWxyzWingType2(grid: Grid, strategyId: string): Step | null {
  for (let row = 0; row < 9; row++) {
    for (let box = 0; box < 9; box++) {
      const inBox = BOXES[box]!.filter((c) => ROW_OF[c] === row && grid.get(c) === 0);
      if (inBox.length < 2) continue;

      for (const hinge of combinations(inBox, 2)) {
        let hingeMask = 0;
        for (const c of hinge) hingeMask |= grid.candidatesOf(c);
        if (popcount(hingeMask) !== 4) continue;
        const ds = digitsOf(hingeMask);

        const lineInBox = intersectionCells(row, box, true);
        const lineOut = lineOutsideIntersection(row, box, true).filter((c) => grid.get(c) === 0);
        const boxOut = boxOutsideIntersection(row, box, true).filter((c) => grid.get(c) === 0);

        for (const wingA of lineOut) {
          const mA = grid.candidatesOf(wingA);
          if (popcount(mA) !== 2 || (mA & hingeMask) !== mA) continue;

          for (const wingB of boxOut) {
            if (wingA === wingB || sees(wingA, wingB)) continue;
            const mB = grid.candidatesOf(wingB);
            if (popcount(mB) !== 2 || (mB & hingeMask) !== mB) continue;

            const four = [...hinge, wingA, wingB];
            if (!usesLineAndBox(four, row, box, true)) continue;
            // Type 2: all four digits must be restricted (hinge+wings bent quad).
            if (ds.some((d) => !digitRestricted(four, d, grid))) continue;

            const elims: CellDigit[] = [];

            for (const d of ds) {
              const dCells = four.filter((c) => grid.hasCandidate(c, d));
              for (let c = 0; c < CELLS; c++) {
                if (grid.get(c) !== 0 || !grid.hasCandidate(c, d)) continue;
                if (four.includes(c)) continue;
                if (dCells.every((dc) => sees(c, dc))) elims.push({ cell: c, digit: d });
              }
            }
            if (elims.length === 0) continue;

            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...four, ...elims.map((e) => e.cell)],
                candidates: [
                  ...four.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `WXYZ翼（Type 2）：行 ${row + 1} 与宫 ${box + 1} 交处的铰链双格与两翼组成弯曲四集 {${ds.join(',')}}；各受限数可从看到其全部出现的格中消去。`,
                en: `WXYZ-Wing (Type 2): hinge pair plus wings in row ${row + 1} / box ${box + 1} form bent quad {${ds.join(',')}}; eliminate each digit from cells seeing all its occurrences.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryWxyzWingType1(grid, this.id) ?? tryWxyzWingType2(grid, this.id);
  },
};

// ---- Remote Pairs ----

function buildRemotePairGraph(grid: Grid): Map<number, number[]> {
  const byMask = new Map<number, number[]>();
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || popcount(grid.candidatesOf(c)) !== 2) continue;
    const m = grid.candidatesOf(c);
    if (!byMask.has(m)) byMask.set(m, []);
    byMask.get(m)!.push(c);
  }

  const adj = new Map<number, number[]>();
  for (const cells of byMask.values()) {
    for (const c of cells) adj.set(c, []);
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i]!;
        const b = cells[j]!;
        if (!sees(a, b)) continue;
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
      }
    }
  }
  return adj;
}

function bfsDistances(start: number, adj: Map<number, number[]>): Map<number, number> {
  const dist = new Map<number, number>([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    for (const n of adj.get(cur) ?? []) {
      if (dist.has(n)) continue;
      dist.set(n, d + 1);
      queue.push(n);
    }
  }
  return dist;
}

function shortestPath(start: number, end: number, adj: Map<number, number[]>): number[] | null {
  const parent = new Map<number, number | null>([[start, null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === end) {
      const path: number[] = [];
      let n: number | null = end;
      while (n !== null) {
        path.push(n);
        n = parent.get(n) ?? null;
      }
      return path.reverse();
    }
    for (const next of adj.get(cur) ?? []) {
      if (parent.has(next)) continue;
      parent.set(next, cur);
      queue.push(next);
    }
  }
  return null;
}

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    const adj = buildRemotePairGraph(grid);

    for (const [pairMask, cells] of (() => {
      const m = new Map<number, number[]>();
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0 || popcount(grid.candidatesOf(c)) !== 2) continue;
        const mask = grid.candidatesOf(c);
        if (!m.has(mask)) m.set(mask, []);
        m.get(mask)!.push(c);
      }
      return m;
    })()) {
      if (cells.length < 2) continue;
      const [a, b] = digitsOf(pairMask) as [number, number];

      let best: {
        dist: number;
        u: number;
        v: number;
        elims: CellDigit[];
      } | null = null;

      for (const start of cells) {
        const dist = bfsDistances(start, adj);
        for (const end of cells) {
          if (end <= start) continue;
          const d = dist.get(end);
          if (d === undefined || d < 3 || d % 2 === 0) continue;

          const elims: CellDigit[] = [];
          for (const c of commonPeers(start, end)) {
            if (grid.get(c) !== 0) continue;
            if (grid.hasCandidate(c, a)) elims.push({ cell: c, digit: a });
            if (grid.hasCandidate(c, b)) elims.push({ cell: c, digit: b });
          }
          if (elims.length === 0) continue;

          if (
            !best ||
            d < best.dist ||
            (d === best.dist && start < best.u) ||
            (d === best.dist && start === best.u && end < best.v)
          ) {
            best = { dist: d, u: start, v: end, elims };
          }
        }
      }

      if (!best) continue;

      const path = shortestPath(best.u, best.v, adj) ?? [best.u, best.v];
      const links: Link[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        links.push({
          from: { cell: path[i]!, digit: a },
          to: { cell: path[i + 1]!, digit: a },
          type: 'weak',
        });
      }

      return {
        strategyId: this.id,
        placements: [],
        eliminations: best.elims,
        highlights: {
          cells: [...path, ...best.elims.map((e) => e.cell)],
          candidates: [
            ...path.flatMap((c) => [{ cell: c, digit: a }, { cell: c, digit: b }]),
            ...best.elims,
          ],
          links,
        },
        explanation: {
          zh: `远程数对：相同双值对 {${a},${b}} 的锁链端点 ${cellLabel(best.u)} 与 ${cellLabel(best.v)} 距离为奇数，形成远程数对；可从同时看到两端的格子中消去 ${a} 和 ${b}。`,
          en: `Remote Pairs: odd-distance endpoints ${cellLabel(best.u)} and ${cellLabel(best.v)} on identical pair {${a},${b}} act as a remote locked pair; eliminate ${a} and ${b} from cells seeing both endpoints.`,
        },
      };
    }
    return null;
  },
};

// ---- Bent Sets (Almost Locked Candidates) ----

function tryBentSetAt(
  grid: Grid,
  lineIndex: number,
  boxIndex: number,
  lineIsRow: boolean,
  strategyId: string,
): Step | null {
  const inter = intersectionCells(lineIndex, boxIndex, lineIsRow);
  if (inter.length === 0) return null;

  const lOut = lineOutsideIntersection(lineIndex, boxIndex, lineIsRow);
  const bOut = boxOutsideIntersection(lineIndex, boxIndex, lineIsRow);

  const lineALS = findALSInCells(grid, lOut, 2);
  const boxALS = findALSInCells(grid, bOut, 2);

  for (const L of lineALS) {
    for (const B of boxALS) {
      if (L.digitMask !== B.digitMask) continue;
      const S = L.digitMask;
      const digits = L.digits;

      const lRest = lOut.filter((c) => !L.cells.includes(c));
      const bRest = bOut.filter((c) => !B.cells.includes(c));

      const elims: CellDigit[] = [];

      if (unitHasNoDigits(grid, lRest, S)) {
        elims.push(...elimSetDigits(grid, bRest, S));
      }
      if (unitHasNoDigits(grid, bRest, S)) {
        elims.push(...elimSetDigits(grid, lRest, S));
      }

      if (elims.length === 0) continue;

      const lineLabel = lineIsRow ? `行 ${lineIndex + 1}` : `列 ${lineIndex - 8 + 1}`;
      const unique = dedupeCellDigits(elims);

      return {
        strategyId,
        placements: [],
        eliminations: unique,
        highlights: {
          cells: [...L.cells, ...B.cells, ...inter, ...unique.map((e) => e.cell)],
          candidates: [
            ...L.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...B.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...unique,
          ],
          links: [],
        },
        explanation: {
          zh: `弯曲集：${lineLabel}与宫 ${boxIndex + 1} 交处，线侧 ALS（${L.cells.map(cellLabel).join(',')}）与宫侧 ALS（${B.cells.map(cellLabel).join(',')}）共享 {${digits.join(',')}}；几乎锁定候选产生 ${unique.length} 处消除。`,
          en: `Bent Set: line ALS ${L.cells.map(cellLabel).join(',')} and box ALS ${B.cells.map(cellLabel).join(',')} share {${digits.join(',')}} at ${lineLabel} ∩ box ${boxIndex + 1}; almost-locked candidates eliminate ${unique.length} candidate(s).`,
        },
      };
    }

    // ALP with trivalue box anchor (e.g. Gordon Fick r2c9)
    for (const bAnchor of findBoxAnchors(grid, bOut, L.digitMask)) {
      const bRest = bOut.filter((c) => c !== bAnchor);
      const lRest = lOut.filter((c) => !L.cells.includes(c));
      if (!unitHasNoDigits(grid, bRest, L.digitMask)) continue;

      const elims: CellDigit[] = [
        ...elimSetDigits(grid, lRest, L.digitMask),
        ...stripForeignDigits(grid, [bAnchor], L.digitMask),
      ];
      if (elims.length === 0) continue;

      const unique = dedupeCellDigits(elims);
      const lineLabel = lineIsRow ? `行 ${lineIndex + 1}` : `列 ${lineIndex - 8 + 1}`;

      return {
        strategyId,
        placements: [],
        eliminations: unique,
        highlights: {
          cells: [...L.cells, bAnchor, ...inter, ...unique.map((e) => e.cell)],
          candidates: [
            ...L.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...digitsOf(grid.candidatesOf(bAnchor)).map((d) => ({ cell: bAnchor, digit: d })),
            ...unique,
          ],
          links: [],
        },
        explanation: {
          zh: `弯曲集（几乎锁定对）：${lineLabel}双值格 ${cellLabel(L.cells[0]!)} 与宫 ${boxIndex + 1} 锚格 ${cellLabel(bAnchor)} 弯曲于 {${L.digits.join(',')}}；线侧/锚格消除。`,
          en: `Bent Set (ALP): bivalue ${cellLabel(L.cells[0]!)} and box anchor ${cellLabel(bAnchor)} bend on {${L.digits.join(',')}} at ${lineLabel} ∩ box ${boxIndex + 1}.`,
        },
      };
    }

  }

  // ALT: 2-cell box ALS + 2-cell line ALS for the same S (carriers may hold extra digits)
  for (const B of boxALS) {
    if (B.cells.length !== 2) continue;
    for (const L2 of lineALS) {
      if (L2.cells.length !== 2 || L2.digitMask !== B.digitMask) continue;

      const lRest = lOut.filter((c) => !L2.cells.includes(c));
      const bRest = bOut.filter((c) => !B.cells.includes(c));
      if (!unitHasNoDigits(grid, lRest, B.digitMask)) continue;

      const elims = dedupeCellDigits([
        ...elimSetDigits(grid, bRest, B.digitMask),
        ...stripForeignDigits(grid, L2.cells, B.digitMask),
      ]);
      if (elims.length === 0) continue;

      const lineLabel = lineIsRow ? `行 ${lineIndex + 1}` : `列 ${lineIndex - 8 + 1}`;
      return {
        strategyId,
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...L2.cells, ...B.cells, ...inter, ...elims.map((e) => e.cell)],
          candidates: [
            ...L2.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...B.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `弯曲集（几乎锁定三）：${lineLabel}与宫 ${boxIndex + 1} 两侧各两格承载 {${B.digits.join(',')}}；虚拟锁定三产生消除。`,
          en: `Bent Set (ALT): two line ALS cells and box ALS on {${B.digits.join(',')}} at ${lineLabel} ∩ box ${boxIndex + 1}; virtual locked triple eliminations.`,
        },
      };
    }
  }

  return null;
}

function dedupeCellDigits(elims: CellDigit[]): CellDigit[] {
  const seen = new Set<string>();
  const out: CellDigit[] = [];
  for (const e of elims) {
    const k = `${e.cell}:${e.digit}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['house', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let row = 0; row < 9; row++) {
      for (let box = 0; box < 9; box++) {
        const step = tryBentSetAt(grid, row, box, true, this.id);
        if (step) return step;
      }
    }
    for (let col = 0; col < 9; col++) {
      for (let box = 0; box < 9; box++) {
        const step = tryBentSetAt(grid, 9 + col, box, false, this.id);
        if (step) return step;
      }
    }
    return null;
  },
};

// ---- Broken Wing ----

interface LinkChoice {
  house: number;
  cells: number[];
  strong: boolean;
  guardians: number[];
}

function linkChoices(grid: Grid, digit: number, a: number, b: number): LinkChoice[] {
  const out: LinkChoice[] = [];
  for (let h = 0; h < HOUSES.length; h++) {
    const cells = HOUSES[h]!.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, digit));
    if (!cells.includes(a) || !cells.includes(b)) continue;
    const guardians = cells.filter((c) => c !== a && c !== b);
    out.push({ house: h, cells, strong: cells.length === 2, guardians });
  }
  const strong = out.filter((o) => o.strong);
  return strong.length > 0 ? strong : out;
}

function digitCells(grid: Grid, digit: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && grid.hasCandidate(c, digit)) out.push(c);
  }
  return out;
}

function minGuardianAssignment(
  loop: readonly number[],
  linkOpts: LinkChoice[][],
): { guardians: number[]; choices: LinkChoice[] } | null {
  const m = loop.length;
  const loopSet = new Set(loop);
  let best: { guardians: number[]; choices: LinkChoice[] } | null = null;

  function rec(i: number, chosen: LinkChoice[]): void {
    if (i === m) {
      const gset = new Set<number>();
      for (const li of chosen) {
        if (!li.strong) {
          for (const g of li.guardians) {
            if (!loopSet.has(g)) gset.add(g);
          }
        }
      }
      const guardians = [...gset];
      if (guardians.length === 0) return;
      if (chosen.every((c) => c.strong)) return;
      if (
        !best ||
        guardians.length < best.guardians.length ||
        (guardians.length === best.guardians.length && loop[0]! < best.choices[0]!.cells[0]!)
      ) {
        best = { guardians, choices: [...chosen] };
      }
      return;
    }
    for (const opt of linkOpts[i]!) rec(i + 1, [...chosen, opt]);
  }

  rec(0, []);
  return best;
}

function applyGuardianRules(
  grid: Grid,
  digit: number,
  loop: readonly number[],
  guardians: readonly number[],
): { placements: CellDigit[]; eliminations: CellDigit[] } {
  if (guardians.length === 0) return { placements: [], eliminations: [] };

  const elims: CellDigit[] = [];

  if (guardians.length === 1) {
    const g = guardians[0]!;
    if (grid.hasCandidate(g, digit)) {
      return { placements: [{ cell: g, digit }], eliminations: [] };
    }
    return { placements: [], eliminations: [] };
  }

  const loopSet = new Set(loop);
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || !grid.hasCandidate(c, digit)) continue;
    if (loopSet.has(c) || guardians.includes(c)) continue;
    if (guardians.every((g) => sees(g, c))) elims.push({ cell: c, digit });
  }

  return { placements: [], eliminations: dedupeCellDigits(elims) };
}

function brokenWingRank(cand: {
  placements: CellDigit[];
  eliminations: CellDigit[];
  guardians: number[];
  loop: number[];
  digit: number;
}): [number, number, number, number, number] {
  return [
    cand.guardians.length,
    -cand.eliminations.length,
    cand.loop.length,
    cand.digit,
    cand.loop[0] ?? 0,
  ] as [number, number, number, number, number];
}

function rankBetter(
  a: [number, number, number, number, number],
  b: [number, number, number, number, number],
): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i]! < b[i]!) return true;
    if (a[i]! > b[i]!) return false;
  }
  return false;
}

type BrokenWingHit = {
  digit: number;
  loop: number[];
  guardians: number[];
  choices: LinkChoice[];
  placements: CellDigit[];
  eliminations: CellDigit[];
  rank: [number, number, number, number, number];
};

function buildBrokenWingStep(hit: BrokenWingHit, strategyId: string): Step {
  const links: Link[] = [];
  const m = hit.loop.length;
  for (let i = 0; i < m; i++) {
    const a = hit.loop[i]!;
    const b = hit.loop[(i + 1) % m]!;
    links.push({
      from: { cell: a, digit: hit.digit },
      to: { cell: b, digit: hit.digit },
      type: hit.choices[i]!.strong ? 'strong' : 'weak',
    });
  }

  const gStr = hit.guardians.map(cellLabel).join(', ');
  const loopStr = hit.loop.map(cellLabel).join('–');

  if (hit.placements.length > 0) {
    const p = hit.placements[0]!;
    return {
      strategyId,
      placements: hit.placements,
      eliminations: hit.eliminations,
      highlights: {
        cells: [...hit.loop, ...hit.guardians, ...hit.eliminations.map((e) => e.cell)],
        candidates: [
          ...hit.loop.map((c) => ({ cell: c, digit: hit.digit })),
          ...hit.guardians.map((c) => ({ cell: c, digit: hit.digit })),
          ...hit.eliminations,
        ],
        links,
      },
      explanation: {
        zh: `断翼：数字 ${hit.digit} 的奇环 ${loopStr} 无法全由共轭对闭合；守护者 ${gStr} 必含 ${hit.digit}，落子 ${cellLabel(p.cell)}=${hit.digit}。`,
        en: `Broken Wing: odd ${hit.digit}-loop ${loopStr} cannot close on strong links; guardian ${gStr} must be ${hit.digit} — place ${hit.digit} in ${cellLabel(p.cell)}.`,
      },
    };
  }

  const elimStr = hit.eliminations.map((e) => `${cellLabel(e.cell)}≠${e.digit}`).join(', ');
  return {
    strategyId,
    placements: [] as CellDigit[],
    eliminations: hit.eliminations,
    highlights: {
      cells: [...hit.loop, ...hit.guardians, ...hit.eliminations.map((e) => e.cell)],
      candidates: [
        ...hit.loop.map((c) => ({ cell: c, digit: hit.digit })),
        ...hit.guardians.map((c) => ({ cell: c, digit: hit.digit })),
        ...hit.eliminations,
      ],
      links,
    },
    explanation: {
      zh: `断翼：数字 ${hit.digit} 奇环 ${loopStr} 的守护者 ${gStr} 至少一为真；消去 ${elimStr}。`,
      en: `Broken Wing: odd ${hit.digit}-loop ${loopStr} with guardians ${gStr}; eliminate ${elimStr}.`,
    },
  };
}

function findBrokenWingStep(grid: Grid, strategyId: string): Step | null {
  let best: BrokenWingHit | null = null;

  const maxLen = 5;
  const loopBudget = 2000;

  for (let digit = 1; digit <= SIZE; digit++) {
    const nodes = digitCells(grid, digit);
    if (nodes.length < 5) continue;

    let budget = loopBudget;

    function evaluateLoop(path: number[]): void {
      const m = path.length;
      const opts: LinkChoice[][] = [];
      for (let i = 0; i < m; i++) {
        const o = linkChoices(grid, digit, path[i]!, path[(i + 1) % m]!);
        if (!o.length) return;
        opts.push(o);
      }
      const assign = minGuardianAssignment(path, opts);
      if (!assign) return;

      const imperfectCount = assign.choices.filter((c) => !c.strong).length;
      if (imperfectCount !== 1) return;
      const imperfect = assign.choices.find((c) => !c.strong)!;
      if (imperfect.guardians.length < 1 || imperfect.guardians.length > 2) return;

      const { placements, eliminations } = applyGuardianRules(grid, digit, path, assign.guardians);
      if (placements.length === 0 && eliminations.length === 0) return;

      const cand = {
        digit,
        loop: [...path],
        guardians: assign.guardians,
        choices: assign.choices,
        placements,
        eliminations,
        rank: brokenWingRank({ placements, eliminations, guardians: assign.guardians, loop: path, digit }),
      };

      if (!best || rankBetter(cand.rank, best.rank)) {
        best = cand;
      }
    }

    function dfs(path: number[]): void {
      if (budget <= 0) return;
      const cur = path[path.length - 1]!;
      if (path.length === maxLen && linkChoices(grid, digit, cur, path[0]!).length > 0) {
        budget--;
        evaluateLoop(path);
      }
      if (path.length >= maxLen) return;

      for (const n of nodes) {
        if (n < path[0]!) continue;
        if (path.includes(n)) continue;
        if (!linkChoices(grid, digit, cur, n).length) continue;
        dfs([...path, n]);
      }
    }

    for (const s of nodes) dfs([s]);
  }

  return best !== null ? buildBrokenWingStep(best, strategyId) : null;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit', 'chain-length', 'cell-index'],

  apply(grid: Grid): Step | null {
    return findBrokenWingStep(grid, this.id);
  },
};