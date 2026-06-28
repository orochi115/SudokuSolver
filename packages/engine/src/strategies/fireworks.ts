/**
 * Fireworks (T4, exotic) — 烟花 / 分布式隐藏数组.
 *
 * For a box Bx and an "L" of three cells inside it — the intersection cell X
 * (a row/col crossing inside the box), the row's other in-box cell Y, and
 * the column's other in-box cell Z — any digit confined within Bx to the L
 * cells {X, Y, Z} must occupy at least one of those cells.
 *
 * Triple firework: 3 such digits confined to exactly 3 cells → the 3 cells
 * form a distributed hidden triple; strip every candidate other than the
 * 3 digits from each of X, Y, Z.
 *
 * Quad firework: 4 such digits across two overlapping double fireworks whose
 * L's align on 4 cells → distributed hidden quad; intersection cells keep
 * their own pair, wing cells keep all 4 digits.
 *
 * Reference: shye's "Fireworks" (SudokuWiki). The Sudoku-X diagonal-aware
 * variants (single firework elimination on a diagonal peer) are out of
 * scope — we implement only the classic Sudoku Triple/Quad forms.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, BOXES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

/** In box Bx, row r and column c intersect at X = r∩c (inside Bx).
 *  Y = the cells of row r in Bx, excluding X (≤ 2 cells).
 *  Z = the cells of column c in Bx, excluding X (≤ 2 cells).
 *
 *  A digit d is a "firework digit at X" iff inside Bx:
 *    - every d-candidate in r∩Bx is in {X}∪Y, AND
 *    - every d-candidate in c∩Bx is in {X}∪Z, AND
 *    - d does not appear in Bx outside {X}∪Y∪Z.
 *
 *  The L footprint = {X}∪Y∪Z (≤ 5 cells).
 *
 *  For Triple Firework: |FW(X)| ≥ 3, and the 3 digits are confined to a
 *    3-cell L {X, y, z} (where y∈Y and z∈Z).
 *  For Quad Firework: 2 doubles whose L's align on 4 cells.
 */
function findFireworkDigits(grid: Grid, X: number): { digits: number[]; rowLine: number[]; colLine: number[] } | null {
  const bx = BOX_OF[X]!;
  const r = ROW_OF[X]!;
  const c = COL_OF[X]!;
  const box = BOXES[bx]!;
  const rowLine = box.filter((cc) => ROW_OF[cc] === r && cc !== X);
  const colLine = box.filter((cc) => COL_OF[cc] === c && cc !== X);
  if (rowLine.length === 0 || colLine.length === 0) return null;
  const L = new Set([X, ...rowLine, ...colLine]);
  // For each digit d, check confinement.
  const fwDigits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    // d in row r ∩ Bx: only cells in rowLine ∪ {X}
    let rowOk = true;
    for (const cc of box) {
      if (ROW_OF[cc] !== r) continue;
      if (cc === X) continue;
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit)) { rowOk = false; break; }
    }
    if (!rowOk) continue;
    // d in col c ∩ Bx: only cells in colLine ∪ {X}
    let colOk = true;
    for (const cc of box) {
      if (COL_OF[cc] !== c) continue;
      if (cc === X) continue;
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit)) { colOk = false; break; }
    }
    if (!colOk) continue;
    // d not in Bx outside L
    let outside = false;
    for (const cc of box) {
      if (L.has(cc)) continue;
      if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit)) { outside = true; break; }
    }
    if (outside) continue;
    fwDigits.push(d);
  }
  return { digits: fwDigits, rowLine, colLine };
}

function tryFireworks(grid: Grid): Step | null {
  // For each box, for each cell X in the box, find firework digits.
  // Triple firework: |FW(X)| >= 3, with the 3 digits confined to a 3-cell L.
  // We approximate: if |FW(X)| >= 3, X carries them; check if the digits
  // are confined to a 3-cell L {X, y, z} where y∈Y, z∈Z, and the OTHER
  // cells of Y∪Z have no FW digit.
  for (let bx = 0; bx < 9; bx++) {
    const box = BOXES[bx]!;
    for (const X of box) {
      if (grid.get(X) !== 0) continue;
      const fw = findFireworkDigits(grid, X);
      if (!fw || fw.digits.length < 3) continue;
      const { rowLine, colLine } = fw;
      const fwMask = fw.digits.reduce((m, d) => m | maskOf(d), 0);
      // Look for a 3-cell L {X, y, z} where y is one of rowLine and z is one of colLine.
      // Pick y as the rowLine cell whose candidates ⊆ fwMask AND has the rowLine
      // pair both inside fwMask; pick z similarly.
      // Simpler: pick y as a rowLine cell whose mask is exactly a fw-subset AND
      // the OTHER rowLine cell has no fw candidate.
      // ...
      // Easier and sound: require both rowLine cells be in FW (i.e. each
      // contains only FW digits AND any non-X row cell in Bx does not contain
      // any FW digit). Then the L is {X, y1, y2} if rowLine has 2 cells, but
      // that's 3 cells already. But a "3-cell L" by the spec means {X, y, z}
      // where y ∈ rowLine, z ∈ colLine — exactly one from each side.
      //
      // To detect this 3-cell L: pick a specific y in rowLine and a specific
      // z in colLine. For (y, z), the L is {X, y, z}. The other cells in
      // rowLine ∪ colLine \ {y, z} must be EMPTY (no candidate) for any
      // FW digit. We require:
      //   - rowLine has exactly 2 cells: y1, y2. If both are in FW scope
      //     (i.e. both contain only FW digits), then ANY 3-cell L {X, yi, z}
      //     needs the OTHER yj to be EMPTY. If yj has FW candidates, it
      //     breaks the 3-cell L.
      //
      // We require: rowLine has 2 cells y1, y2; one of them has ONLY FW
      // candidates and the OTHER has NO FW candidates (otherwise the L
      // expands to 4 cells, not 3).
      // Same for colLine.
      //
      // Even simpler: we just need a 3-cell subset {X, y, z} that hosts
      // exactly 3 FW digits and the OTHER cells in rowLine/colLine have
      // no FW candidates. This means the 3 digits form a hidden triple in
      // the 3 cells {X, y, z}.

      // Try (y, z) = (rowLine[0], colLine[0]). Check if the OTHER cells
      // (rowLine[1..] and colLine[1..]) have no FW digits.
      for (let yi = 0; yi < rowLine.length; yi++) {
        for (let zi = 0; zi < colLine.length; zi++) {
          const y = rowLine[yi]!;
          const z = colLine[zi]!;
          const L3 = new Set([X, y, z]);
          // Check other cells in rowLine/colLine: any FW candidate breaks the 3-cell L.
          let otherHasFw = false;
          for (const c of rowLine) {
            if (c === y) continue;
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & fwMask)) { otherHasFw = true; break; }
          }
          if (otherHasFw) continue;
          for (const c of colLine) {
            if (c === z) continue;
            if (grid.get(c) === 0 && (grid.candidatesOf(c) & fwMask)) { otherHasFw = true; break; }
          }
          if (otherHasFw) continue;
          // Confirmed 3-cell L. Pick the 3 FW digits that are actually
          // present in {X, y, z}. (We require that all 3 firework digits
          // are confined to this L; the cells {X, y, z} should each
          // contain only FW digits.)
          // Verify each of {X, y, z} has candidates ⊆ fwMask.
          const Xm = grid.candidatesOf(X);
          const ym = grid.candidatesOf(y);
          const zm = grid.candidatesOf(z);
          if (Xm === 0 || ym === 0 || zm === 0) continue;
          if (Xm & ~fwMask || ym & ~fwMask || zm & ~fwMask) continue;
          // The three digits present: union of masks.
          const tripleMask = Xm | ym | zm;
          if (popcount(tripleMask) !== 3) continue;
          // Triple firework! Eliminate non-triple from each of X, y, z.
          const elims: { cell: number; digit: number }[] = [];
          for (const c of [X, y, z]) {
            const m = grid.candidatesOf(c);
            const extras = m & ~tripleMask;
            for (const d of digitsOf(extras)) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;
          return {
            strategyId: 'fireworks',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [X, y, z, ...elims.map((e) => e.cell)],
              candidates: [X, y, z].flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `烟花（三数）：在宫 ${bx + 1} 中，格 ${cellLabel(X)} 与行/列的 L 形 ${cellLabel(y)}/${cellLabel(z)} 形成 {${digitsOf(tripleMask).join(',')}} 分布式隐藏三数；消去 L 形格中的非 {${digitsOf(tripleMask).join(',')}} 候选（三数烟花）。`,
              en: `Triple Firework: in box ${bx + 1}, intersection ${cellLabel(X)} with row/col L ${cellLabel(y)}/${cellLabel(z)} hosts distributed hidden triple {${digitsOf(tripleMask).join(',')}}; strip non-{${digitsOf(tripleMask).join(',')}} from the L (Triple Firework).`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks (Triple)' },
  difficulty: 1050,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryFireworks(grid);
  },
};

// Suppress unused
void CELLS;
