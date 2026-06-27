/**
 * Enumeration-class strategies (P3 — last resort) — 枚举类策略.
 *
 *  - `templates` (Bowman's Bingo): assume a candidate is true, propagate naked
 *    singles to a fixed point; if propagation reaches a cell with zero
 *    candidates the assumption is impossible → eliminate. SOUND (identical
 *    primitive to the forcing-chain owner's contradiction check, with full
 *    propagation bound). Active.
 *  - `pom` (Pattern Overlay Method): for a single digit, enumerate ALL valid
 *    complete placements (one cell per row/col/box via DFS); a candidate is
 *    eliminated iff it appears in NO valid template. Sound because the
 *    enumeration is COMPLETE (when the search is bounded and aborts, the
 *    strategy returns null — incomplete-but-sound). Active.
 *  - `tabling` (Trebor's Tables): a full candidate→consequence table. A sound
 *    *complete* implementation is expensive and the surface for unsound edge
 *    cases is large; registered but CONSERVATIVELY INACTIVE (null). Sound by
 *    construction, like exocet/sk-loop.
 *  - `gem` (Graded Equivalence Marks / Braid Analysis): a multi-level coloring
 *    generalisation. Conservatively inactive (null) for the same reason.
 *
 * None of these calls the brute-force solver or reads answers. Every active
 * deduction is a nameable human inference (Bowman's Bingo contradiction, or
 * "this candidate belongs to no valid single-digit pattern").
 */

import { CELLS, SIZE, ROW_OF, COL_OF, BOX_OF, ROWS, COLS, BOXES, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { cellLabel, contradictionFromAssumption, makeForcingStep } from './forcing-engine.js';

const BOWMAN_BOUND = 110; // >81: enough to exhaust naked-singles propagation
const POM_NODE_BUDGET = 60000; // complete-enumeration safety cap; abort → null (sound)

// ============================================================
// templates — Bowman's Bingo (9500)
// ============================================================
export const templates: Strategy = {
  id: 'templates',
  name: { zh: '模板法（Bowman 宾果）', en: 'Templates (Bowman\'s Bingo)' },
  difficulty: 9500,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    // Test candidates of low-constraint cells first (fast contradiction finds).
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const cnt = popcount(grid.candidatesOf(cell));
      if (cnt < 2 || cnt > 3) continue;
      for (const digit of digitsOf(grid.candidatesOf(cell))) {
        if (contradictionFromAssumption(grid, cell, digit, BOWMAN_BOUND)) {
          if (!grid.hasCandidate(cell, digit)) continue;
          return makeForcingStep(this.id, grid, [cell], [], [{ cell, digit }],
            `模板法（Bowman 宾果）：假设 ${cellLabel(cell)}=${digit} 后单数传播出现矛盾；消去该候选。`,
            `Templates (Bowman's Bingo): assuming ${cellLabel(cell)}=${digit} and propagating naked singles reaches a contradiction; eliminate that candidate.`);
        }
      }
    }
    return null;
  },
};

// ============================================================
// pom — Pattern Overlay Method (9400)
// ============================================================
//
// For digit d, a "template" is a set of 9 cells (one per row, one per col, one
// per box) all holding candidate d — a complete valid placement of d. A
// candidate (c,d) is soundly eliminable iff NO valid template contains c.
// We enumerate templates via DFS over rows (choosing a column for d in each
// row, respecting col/box uniqueness). If the search exceeds POM_NODE_BUDGET
// we ABORT and return null (incomplete → no elimination → sound).

export const pom: Strategy = {
  id: 'pom',
  name: { zh: '模式覆盖法', en: 'Pattern Overlay Method' },
  difficulty: 9400,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= SIZE; digit++) {
      const bit = maskOf(digit);
      // Cells holding candidate `digit`, grouped by row.
      const byRow: number[][] = Array.from({ length: SIZE }, () => []);
      let totalCands = 0;
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          byRow[ROW_OF[c]!]!.push(c);
          totalCands++;
        }
      }
      if (totalCands < 9) continue; // digit cannot be fully placed; skip
      if (byRow.some((r) => r.length === 0)) continue; // some row lacks the digit

      const usedCols = new Uint8Array(SIZE);
      const usedBoxes = new Uint8Array(SIZE);
      const pathCells: number[] = [];
      // cells appearing in at least one COMPLETE valid template
      const completeSurvives = new Set<number>();
      let nodes = 0;
      let aborted = false;

      // DFS over rows, choosing one candidate cell per row s.t. cols & boxes
      // stay unique. On reaching the last row, every cell on the path belongs
      // to a complete template → mark all of them.
      const dfs = (row: number): void => {
        if (aborted) return;
        if (++nodes > POM_NODE_BUDGET) { aborted = true; return; }
        if (row === SIZE) {
          for (const pc of pathCells) completeSurvives.add(pc);
          return;
        }
        for (const c of byRow[row]!) {
          if (aborted) return;
          const col = COL_OF[c]!;
          const box = BOX_OF[c]!;
          if (usedCols[col] || usedBoxes[box]) continue;
          usedCols[col] = 1;
          usedBoxes[box] = 1;
          pathCells.push(c);
          dfs(row + 1);
          pathCells.pop();
          usedCols[col] = 0;
          usedBoxes[box] = 0;
        }
      };
      dfs(0);

      if (aborted) continue; // incomplete enumeration -> skip this digit (sound)
      if (completeSurvives.size === 0) continue; // no valid template -> grid already broken; skip (defensive)

      // Eliminate candidates of `digit` not surviving in any template.
      const elims: CellDigit[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && !completeSurvives.has(c)) {
          elims.push({ cell: c, digit });
        }
      }
      if (elims.length > 0) {
        return makeForcingStep(this.id, grid, [], [], elims,
          `模式覆盖法：数字 ${digit} 的所有合法完整摆放均不含下列候选，故消去。`,
          `Pattern Overlay Method: none of the valid complete placements of digit ${digit} contains the eliminated candidate(s).`);
      }
    }
    return null;
  },
};

// ============================================================
// tabling — Trebor's Tables (9300) — conservative
// ============================================================
export const tabling: Strategy = {
  id: 'tabling',
  name: { zh: '列表法（Trebor 表）', en: 'Tabling (Trebor\'s Tables)' },
  difficulty: 9300,
  tieBreak: ['cell-index', 'digit'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ============================================================
// gem — Graded Equivalence Marks / Braid Analysis (9600) — conservative
// ============================================================
export const gem: Strategy = {
  id: 'gem',
  name: { zh: '分级等价标记（编织分析）', en: 'Graded Equivalence Marks (Braid Analysis)' },
  difficulty: 9600,
  tieBreak: ['cell-index', 'digit'],
  apply(_grid: Grid): Step | null {
    return null;
  },
};

// Silence unused-import lint for topology exports reserved for future detectors.
void ROWS; void COLS; void BOXES; void HOUSES;
