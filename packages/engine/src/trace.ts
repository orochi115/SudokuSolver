/**
 * SolveTrace — the shared data contract ("spine") of the whole project.
 *
 * A single trace is consumed in three places:
 *  - correctness validation (the soundness regression, AC-3),
 *  - the static step-by-step web replay (M4),
 *  - the interactive tutor's progressive hints (M5).
 *
 * Therefore this file is INTENTIONALLY STABLE. Strategy implementations (M2+)
 * must produce `Step` objects in exactly this shape so that the UI layers stay
 * strategy-agnostic.
 */

/** A specific candidate: digit `digit` (1-9) in cell `cell` (0-80, row-major). */
export interface CellDigit {
  cell: number;
  digit: number;
}

export type LinkType = 'strong' | 'weak';

/**
 * A chain link between two candidates, used to visualise AIC / coloring / chains.
 * - strong: if `from` is false then `to` is true (and vice-versa).
 * - weak:   if `from` is true then `to` is false.
 */
export interface Link {
  from: CellDigit;
  to: CellDigit;
  type: LinkType;
}

/** Everything a UI needs to highlight for one step. */
export interface Highlights {
  /** Cells central to the deduction (e.g. the pattern's defining cells). */
  cells: number[];
  /** Candidates to emphasise (e.g. the pattern's candidates). */
  candidates: CellDigit[];
  /** Chain path, when the strategy is chain-like; empty otherwise. */
  links: Link[];
}

/** One logical deduction produced by a strategy. */
export interface Step {
  /** Stable id of the strategy that produced this step, e.g. 'naked-single'. */
  strategyId: string;
  /** Digits placed into cells by this step. */
  placements: CellDigit[];
  /** Candidates eliminated by this step. */
  eliminations: CellDigit[];
  /** Visualisation payload for the replay / tutor. */
  highlights: Highlights;
  /** Bilingual human explanation. Terms should match glossary.zh-en.md. */
  explanation: { zh: string; en: string };
}

export type SolveOutcome = 'solved' | 'stuck';

/**
 * The full record of an attempt to solve a puzzle with human strategies.
 *
 * `initial` and `final` are 81-char row-major strings ('0' = empty) so the trace
 * is trivially serialisable to JSON; any consumer can reconstruct a Grid from them.
 */
export interface SolveTrace {
  initial: string;
  steps: Step[];
  outcome: SolveOutcome;
  final: string;
}
