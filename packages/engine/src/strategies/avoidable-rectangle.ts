/**
 * Avoidable Rectangle Types 1–4 (T4) — 可避免矩形 1–4.
 *
 * The "avoidable" mirror of Unique Rectangle: the deadly `a/b/b/a` rectangle
 * in two rows × two columns × two boxes is detected via SOLVED cells instead
 * of pencilmarks. The puzzle maker MUST leave at least one of the four corners
 * as a GIVEN (clue) to prevent the swappable set. If we observe three
 * solved corners and none of them is a given, the fourth corner must NOT
 * complete the swappable set.
 *
 * Given vs solved distinction: `Grid.givens` (populated by `Grid.fromString`)
 * flags the original clue cells. Cells filled by deduction have givens[i] = 0.
 * The avoidable-rectangle detector skips any AR where one of the three
 * solved corners is a given — the swappable set is broken by the fixed clue.
 *
 * Types 1–4 mirror UR Types 1–4:
 *   Type 1: three corners solved (interchangeable trio), fourth corner has
 *     extra candidates → eliminate UR digits from the fourth corner.
 *   Type 2: two corners solved (the `a/b` pair), two corners share the same
 *     extra digit `c` → eliminate c from cells seeing both extra corners.
 *   Type 3: two corners share multiple extra digits forming a subset with
 *     an outside cell on the same line → eliminate those digits from the
 *     rest of the line.
 *   Type 4: roof cells share a house where one UR digit is conjugate-paired
 *     to the roof → eliminate the OTHER UR digit from the roof cells.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy, TieBreakKey } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** Yield every (r1, r2, c1, c2) tuple spanning exactly two boxes. */
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

interface ARContext {
  cells: [number, number, number, number];
  /** UR pair {a,b} for the swappable set. */
  pair: [number, number];
  /** Solved corners' values (must be exactly two `a`s and one `b`, or vice versa). */
  solvedCorners: { cell: number; value: number }[];
  /** Open corner (still a candidate). */
  openCorner: number;
  /** Open corner's mask. */
  openMask: number;
}

/** Read which cells are givens from the grid's givens mask. */
function givenSetOf(grid: Grid): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < CELLS; i++) if (grid.givens[i] === 1) s.add(i);
  return s;
}

function findARContexts(grid: Grid): ARContext[] {
  const result: ARContext[] = [];
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22] as [number, number, number, number];
    const values = cells.map((c) => grid.get(c));
    // Identify solved corners (value != 0)
    const solved: { cell: number; value: number }[] = [];
    const open: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (values[i] !== 0) solved.push({ cell: cells[i]!, value: values[i]! });
      else open.push(cells[i]!);
    }
    if (solved.length !== 3) continue;
    if (open.length !== 1) continue;
    // The three solved values must be {a, a, b} or {a, b, b} for some pair {a, b}.
    const valueCounts = new Map<number, number>();
    for (const s of solved) valueCounts.set(s.value, (valueCounts.get(s.value) ?? 0) + 1);
    if (valueCounts.size !== 2) continue;
    const entries = [...valueCounts.entries()];
    if (!(entries.some(([, n]) => n === 2) && entries.some(([, n]) => n === 1))) continue;
    const pair: [number, number] = entries[0]![0] < entries[1]![0]
      ? [entries[0]![0], entries[1]![0]]
      : [entries[1]![0], entries[0]![0]];
    // Verify none of the solved corners is a given (clue). The AR rule only
    // applies when all three are deduced — a given breaks the swappable set.
    const anyGiven = solved.some((s) => grid.isGiven(s.cell));
    if (anyGiven) continue;
    const openCorner = open[0]!;
    const openMask = grid.candidatesOf(openCorner);
    result.push({ cells, pair, solvedCorners: solved, openCorner, openMask });
  }
  return result;
}

/** Avoidable Rectangle Type 1. */
function tryARType1(grid: Grid): Step | null {
  for (const ctx of findARContexts(grid)) {
    const [a, b] = ctx.pair;
    const open = ctx.openCorner;
    // The open corner must NOT complete {a, b} — i.e. cannot be either.
    // Eliminate a and b from the open corner (if present).
    const elims: { cell: number; digit: number }[] = [];
    if (grid.hasCandidate(open, a)) elims.push({ cell: open, digit: a });
    if (grid.hasCandidate(open, b)) elims.push({ cell: open, digit: b });
    if (elims.length === 0) continue;
    return {
      strategyId: 'avoidable-rectangle-type-1',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...ctx.cells],
        candidates: ctx.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `可避免矩形 Type 1：三个非原始已解角 ${ctx.solvedCorners.map((s) => cellLabel(s.cell)).join('、')} 形成 {${a},${b}} 互换组；若第 4 角 ${cellLabel(open)} 也取 {${a},${b}} 则产生双解；故消去其 ${a} 和 ${b}（可避免矩形 Type 1）。`,
        en: `Avoidable Rectangle Type 1: three non-given solved corners ${ctx.solvedCorners.map((s) => cellLabel(s.cell)).join(', ')} form the {${a},${b}} interchangeable trio; if the 4th corner ${cellLabel(open)} also took {${a},${b}}, two solutions exist; eliminate ${a} and ${b} (Avoidable Rectangle Type 1).`,
      },
    };
  }
  return null;
}

/** Avoidable Rectangle Type 2 — symmetric to UR Type 2 but uses solved cells. */
function tryARType2(grid: Grid): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map((c) => grid.get(c));
    // Two solved cells (the a/b pair), two open cells.
    const solved: { cell: number; value: number }[] = [];
    const open: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (values[i] !== 0) solved.push({ cell: cells[i]!, value: values[i]! });
      else open.push(cells[i]!);
    }
    if (solved.length !== 2 || open.length !== 2) continue;
    if (solved.some((s) => grid.isGiven(s.cell))) continue;
    if (solved[0]!.value === solved[1]!.value) continue;
    const pair: [number, number] = solved[0]!.value < solved[1]!.value
      ? [solved[0]!.value, solved[1]!.value]
      : [solved[1]!.value, solved[0]!.value];
    const [a, b] = pair;
    // The two open cells must share the SAME single extra digit c (beyond a or b).
    const openMasks = open.map((c) => grid.candidatesOf(c));
    const extraMasks = openMasks.map((m) => m & ~maskOf(a) & ~maskOf(b));
    if (extraMasks.some((m) => popcount(m) !== 1)) continue;
    if (extraMasks[0] !== extraMasks[1]) continue;
    const c = digitsOf(extraMasks[0]!)[0]!;
    // Eliminate c from cells seeing both open cells.
    const peersO1 = new Set(PEERS_OF[open[0]!]!);
    const elims: { cell: number; digit: number }[] = [];
    for (const cc of PEERS_OF[open[1]!]!) {
      if (!peersO1.has(cc)) continue;
      if (cc === open[0] || cc === open[1]) continue;
      if (grid.get(cc) !== 0) continue;
      if (grid.hasCandidate(cc, c)) elims.push({ cell: cc, digit: c });
    }
    if (elims.length === 0) continue;
    return {
      strategyId: 'avoidable-rectangle-type-2',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells, ...elims.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `可避免矩形 Type 2：两个非原始已解角为 {${a},${b}}；两个开放角 ${open.map(cellLabel).join('、')} 共享额外候选数 ${c}；必有一角为 ${c}，消去可见两开放角的格的 ${c}。`,
        en: `Avoidable Rectangle Type 2: two non-given solved corners are {${a},${b}}; the two open corners ${open.map(cellLabel).join(', ')} share the extra digit ${c}; one must be ${c} → eliminate ${c} from cells seeing both.`,
      },
    };
  }
  return null;
}

/** Avoidable Rectangle Type 3 — two open corners share extras forming a
 *  subset with outside cells on a line → eliminate the subset's digits from
 *  the rest of the line. */
function tryARType3(grid: Grid): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map((c) => grid.get(c));
    const solved: { cell: number; value: number }[] = [];
    const open: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (values[i] !== 0) solved.push({ cell: cells[i]!, value: values[i]! });
      else open.push(cells[i]!);
    }
    if (solved.length !== 2 || open.length !== 2) continue;
    if (solved.some((s) => grid.isGiven(s.cell))) continue;
    if (solved[0]!.value === solved[1]!.value) continue;
    const pair: [number, number] = solved[0]!.value < solved[1]!.value
      ? [solved[0]!.value, solved[1]!.value]
      : [solved[1]!.value, solved[0]!.value];
    const [a, b] = pair;
    // Roof cells open[0], open[1] share a line. Their extra digit mask.
    const openMasks = open.map((c) => grid.candidatesOf(c));
    const extraMask = (openMasks[0]! & ~maskOf(a) & ~maskOf(b)) | (openMasks[1]! & ~maskOf(a) & ~maskOf(b));
    if (popcount(extraMask) < 2) continue;
    const [o1, o2] = open as [number, number];
    const sameRow = ROW_OF[o1] === ROW_OF[o2];
    const sameCol = COL_OF[o1] === COL_OF[o2];
    if (!sameRow && !sameCol) continue;
    const lineIdx = sameRow ? ROW_OF[o1]! : 9 + COL_OF[o1]!;
    const line = HOUSES[lineIdx]!;
    // Find outside cells on the line that fit within the extra mask.
    const outside: number[] = [];
    for (const c of line) {
      if (c === o1 || c === o2) continue;
      if (grid.get(c) !== 0) continue;
      const m = grid.candidatesOf(c);
      if ((m & ~extraMask) !== 0) continue;
      outside.push(c);
    }
    if (outside.length === 0) continue;
    const totalSubsetCells = 2 + outside.length;
    if (totalSubsetCells !== popcount(extraMask)) continue;
    const subset = new Set<number>([o1, o2, ...outside]);
    const subsetDigits = digitsOf(extraMask);
    const elims: { cell: number; digit: number }[] = [];
    for (const c of line) {
      if (subset.has(c)) continue;
      if (grid.get(c) !== 0) continue;
      for (const d of subsetDigits) {
        if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
      }
    }
    if (elims.length === 0) continue;
    return {
      strategyId: 'avoidable-rectangle-type-3',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: [...cells, ...outside, ...elims.map((e) => e.cell)],
        candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        links: [],
      },
      explanation: {
        zh: `可避免矩形 Type 3：UR 对 {${a},${b}} 已定，两个开放角 ${open.map(cellLabel).join('、')} 与同线其它格构成锁定子集 {${subsetDigits.join(',')}}；同线其余格消去这些数字。`,
        en: `Avoidable Rectangle Type 3: UR pair {${a},${b}} fixed; open corners ${open.map(cellLabel).join(', ')} with outside cells form a locked subset on {${subsetDigits.join(',')}}; eliminate from rest of the line.`,
      },
    };
  }
  return null;
}

/** Avoidable Rectangle Type 4 — conjugate pair on one UR digit through the
 *  open corners → eliminate the OTHER UR digit from both open corners. */
function tryARType4(grid: Grid): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map((c) => grid.get(c));
    const solved: { cell: number; value: number }[] = [];
    const open: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (values[i] !== 0) solved.push({ cell: cells[i]!, value: values[i]! });
      else open.push(cells[i]!);
    }
    if (solved.length !== 2 || open.length !== 2) continue;
    if (solved.some((s) => grid.isGiven(s.cell))) continue;
    if (solved[0]!.value === solved[1]!.value) continue;
    const pair: [number, number] = solved[0]!.value < solved[1]!.value
      ? [solved[0]!.value, solved[1]!.value]
      : [solved[1]!.value, solved[0]!.value];
    const [a, b] = pair;
    const [o1, o2] = open as [number, number];

    // Try both: which UR digit is conjugate-paired in the shared house?
    for (const [locked, elim] of [[a, b], [b, a]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      for (const house of HOUSES) {
        if (!house.includes(o1) || !house.includes(o2)) continue;
        // Conjugate pair: locked appears ONLY in {o1, o2} within this house.
        // Count cells (solved or empty) that have locked — both solved (as value)
        // and empty (as candidate) count. The roof cells themselves are o1, o2.
        const cellsWithLocked = house.filter((c) => {
          const v = grid.get(c);
          if (v !== 0) return v === locked;
          return (grid.candidatesOf(c) & lockedBit) !== 0;
        });
        const nonOpenWithLocked = cellsWithLocked.filter((c) => c !== o1 && c !== o2);
        if (nonOpenWithLocked.length !== 0) continue;
        // Each roof cell must hold locked in its candidates for the conjugate
        // pair to be live (otherwise the locked digit isn't really confined to
        // them in any meaningful way).
        if ((grid.candidatesOf(o1) & lockedBit) === 0) continue;
        if ((grid.candidatesOf(o2) & lockedBit) === 0) continue;
        const elims: { cell: number; digit: number }[] = [];
        for (const c of [o1, o2]) {
          if (grid.hasCandidate(c, elim)) elims.push({ cell: c, digit: elim });
        }
        if (elims.length === 0) continue;
        return {
          strategyId: 'avoidable-rectangle-type-4',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...cells],
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `可避免矩形 Type 4：UR 对 {${a},${b}} 中，${locked} 在两开放角共享房屋内只出现于两开放角（强链），故开放角必为 ${locked}；消去开放角的 ${elim}。`,
            en: `Avoidable Rectangle Type 4: UR pair {${a},${b}}; ${locked} is confined to the two open corners (conjugate pair) → open corners must be ${locked}; eliminate ${elim} from open corners.`,
          },
        };
      }
    }
  }
  return null;
}

function makeAR(id: string, name: { zh: string; en: string }, difficulty: number, fn: (grid: Grid) => Step | null): Strategy {
  const tieBreak: readonly TieBreakKey[] = ['cell-index'];
  return {
    id,
    name,
    difficulty,
    tieBreak,
    apply(grid: Grid): Step | null {
      return fn(grid);
    },
  };
}

export const avoidableRectangleType1: Strategy = makeAR(
  'avoidable-rectangle-type-1',
  { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  945,
  tryARType1,
);
export const avoidableRectangleType2: Strategy = makeAR(
  'avoidable-rectangle-type-2',
  { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  946,
  tryARType2,
);
export const avoidableRectangleType3: Strategy = makeAR(
  'avoidable-rectangle-type-3',
  { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  947,
  tryARType3,
);
export const avoidableRectangleType4: Strategy = makeAR(
  'avoidable-rectangle-type-4',
  { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  948,
  tryARType4,
);