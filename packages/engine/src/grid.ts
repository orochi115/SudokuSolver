/**
 * Grid — the board model (FR-1).
 *
 * Layout: 81 cells indexed 0..80 in row-major order.
 *   row(i) = floor(i / 9), col(i) = i % 9, box(i) = floor(row/3)*3 + floor(col/3)
 *
 * Candidates are stored as a 9-bit mask per cell: bit (d-1) set means digit d
 * (1..9) is still a candidate. A solved cell has value 1..9 and an empty mask.
 *
 * The Grid maintains rule-consistency only (a digit cannot repeat in a house):
 * `place` clears the placed digit from peers' candidate masks. It performs NO
 * higher-order deduction — that is the job of strategies (M2+).
 */

export const SIZE = 9;
export const CELLS = 81;
export const ALL_CANDIDATES = 0x1ff; // bits 0..8 set => digits 1..9

// ---- Static topology, computed once at module load ----

export const ROW_OF: readonly number[] = Array.from({ length: CELLS }, (_, i) => Math.floor(i / SIZE));
export const COL_OF: readonly number[] = Array.from({ length: CELLS }, (_, i) => i % SIZE);
export const BOX_OF: readonly number[] = Array.from({ length: CELLS }, (_, i) => {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
});

function buildHouses(): number[][] {
  const rows: number[][] = Array.from({ length: SIZE }, () => []);
  const cols: number[][] = Array.from({ length: SIZE }, () => []);
  const boxes: number[][] = Array.from({ length: SIZE }, () => []);
  for (let i = 0; i < CELLS; i++) {
    rows[ROW_OF[i]!]!.push(i);
    cols[COL_OF[i]!]!.push(i);
    boxes[BOX_OF[i]!]!.push(i);
  }
  return [...rows, ...cols, ...boxes];
}

/** All 27 houses: 9 rows, then 9 columns, then 9 boxes. */
export const HOUSES: readonly (readonly number[])[] = buildHouses();
export const ROWS: readonly (readonly number[])[] = HOUSES.slice(0, 9);
export const COLS: readonly (readonly number[])[] = HOUSES.slice(9, 18);
export const BOXES: readonly (readonly number[])[] = HOUSES.slice(18, 27);

/** The three houses (row, col, box) that contain each cell, by house index into HOUSES. */
export const UNITS_OF: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, i) => [
  ROW_OF[i]!,
  9 + COL_OF[i]!,
  18 + BOX_OF[i]!,
]);

/** The 20 peers of each cell (same row, col, or box, excluding itself). */
export const PEERS_OF: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, i) => {
  const set = new Set<number>();
  for (const h of UNITS_OF[i]!) {
    for (const c of HOUSES[h]!) {
      if (c !== i) set.add(c);
    }
  }
  return [...set];
});

// ---- bitmask helpers ----

export function maskOf(digit: number): number {
  return 1 << (digit - 1);
}

export function popcount(mask: number): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

/** Digits (1..9) present in a candidate mask. */
export function digitsOf(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= SIZE; d++) {
    if (mask & maskOf(d)) out.push(d);
  }
  return out;
}

export class Grid {
  /** Placed value per cell, 0 = empty. */
  readonly values: Uint8Array;
  /** Candidate bitmask per cell (only meaningful when values[i] === 0). */
  readonly candidates: Uint16Array;
  /** Original given cells, 1 = given, 0 = solved/empty. */
  readonly givens: Uint8Array;

  private constructor(values: Uint8Array, candidates: Uint16Array, givens: Uint8Array) {
    this.values = values;
    this.candidates = candidates;
    this.givens = givens;
  }

  /** Build a grid from an 81-char row-major string ('0' or '.' = empty). */
  static fromString(s: string): Grid {
    const compact = s.replace(/[\s]/g, '');
    if (compact.length !== CELLS) {
      throw new Error(`Grid string must be ${CELLS} chars, got ${compact.length}`);
    }
    const values = new Uint8Array(CELLS);
    const givens = new Uint8Array(CELLS);
    for (let i = 0; i < CELLS; i++) {
      const ch = compact[i]!;
      values[i] = ch === '.' || ch === '0' ? 0 : Number(ch);
      givens[i] = values[i] !== 0 ? 1 : 0;
    }
    const candidates = new Uint16Array(CELLS);
    const g = new Grid(values, candidates, givens);
    g.recomputeCandidates();
    return g;
  }

  /** Derive every empty cell's candidate mask from the current placements. */
  recomputeCandidates(): void {
    for (let i = 0; i < CELLS; i++) {
      if (this.values[i] !== 0) {
        this.candidates[i] = 0;
        continue;
      }
      let mask = ALL_CANDIDATES;
      for (const p of PEERS_OF[i]!) {
        const v = this.values[p]!;
        if (v !== 0) mask &= ~maskOf(v);
      }
      this.candidates[i] = mask;
    }
  }

  clone(): Grid {
    return new Grid(this.values.slice(), this.candidates.slice(), this.givens.slice());
  }

  isGiven(cell: number): boolean {
    return this.givens[cell] === 1;
  }

  get(cell: number): number {
    return this.values[cell]!;
  }

  candidatesOf(cell: number): number {
    return this.candidates[cell]!;
  }

  hasCandidate(cell: number, digit: number): boolean {
    return this.values[cell] === 0 && (this.candidates[cell]! & maskOf(digit)) !== 0;
  }

  /**
   * Place `digit` in `cell` and remove it from peer candidates.
   * Pure rule bookkeeping — not a logical deduction.
   */
  place(cell: number, digit: number): void {
    this.values[cell] = digit;
    this.candidates[cell] = 0;
    const bit = maskOf(digit);
    for (const p of PEERS_OF[cell]!) {
      this.candidates[p]! &= ~bit;
    }
  }

  /** Remove a single candidate. Returns true if it was present. */
  eliminate(cell: number, digit: number): boolean {
    if (!this.hasCandidate(cell, digit)) return false;
    this.candidates[cell]! &= ~maskOf(digit);
    return true;
  }

  isSolved(): boolean {
    for (let i = 0; i < CELLS; i++) {
      if (this.values[i] === 0) return false;
    }
    return true;
  }

  /** True if no placement violates Sudoku rules (duplicate in a house). */
  isValid(): boolean {
    for (const house of HOUSES) {
      let seen = 0;
      for (const c of house) {
        const v = this.values[c]!;
        if (v === 0) continue;
        const bit = maskOf(v);
        if (seen & bit) return false;
        seen |= bit;
      }
    }
    return true;
  }

  /**
   * True if any empty cell has zero candidates — i.e. the grid is broken and
   * cannot be completed. Used by the soundness check (AC-3).
   */
  hasContradiction(): boolean {
    for (let i = 0; i < CELLS; i++) {
      if (this.values[i] === 0 && this.candidates[i] === 0) return true;
    }
    return false;
  }

  toString(): string {
    let s = '';
    for (let i = 0; i < CELLS; i++) s += String(this.values[i]);
    return s;
  }
}
