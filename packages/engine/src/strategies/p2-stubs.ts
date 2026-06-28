/**
 * P2 strategy stubs — Roadmap ② Phase 2 (Rare / Exotic).
 *
 * These strategies are registered with correct difficulty, id, name, and
 * tieBreak metadata.  Full detector implementations are deferred; each
 * `apply()` currently returns null (no pattern found), which is sound — the
 * solver simply falls through to the next strategy.
 *
 * Difficulty assignments follow docs/plans/diabolical-727-checklist.md § P2
 * and the global band table in § 难度刻度:
 *
 *   vwxyz-wing           530  (5xx advanced-wings, after wxyz-wing 520)
 *   twinned-xy-chains    775  (7xx chains, after aic-with-ur 770)
 *   aic-with-exotic-links 780 (7xx chains, after twinned-xy-chains 775)
 *   gurth                990  (9xx uniqueness, after unique-loop 985)
 *   sue-de-coq-extended 1015  (1xxx exotic, after sue-de-coq 1010)
 *   fireworks           1050  (1xxx exotic)
 *   franken-fish        1080  (1xxx exotic)
 *   mutant-fish         1090  (1xxx exotic, unique diff from franken-fish)
 *   aligned-pair-exclusion    1120
 *   aligned-triple-exclusion  1130
 *   subset-exclusion          1140
 *   exocet              1200
 *   sk-loop             1250
 *   msls                1300
 *
 * Red-line invariant: none of these strategies uses brute-force oracle
 * functions.  They are pure pattern detectors that will, once implemented,
 * perform only named human deductions.
 */

import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

// ─── 5xx Advanced wings ──────────────────────────────────────────────────────

/**
 * VWXYZ-Wing (size-5 generalised wing): 5 cells in 2 houses, 5 digits,
 * exactly one non-restricted digit Z.  Subsumes WXYZ-Wing as the size-4
 * special case.  The size-ladder framework (WXY, WXYZ, VWXYZ, …) can be
 * further extended, but this stub covers the checklist entry.
 */
export const vwxyzWing: Strategy = {
  id: 'vwxyz-wing',
  name: { zh: 'VWXYZ翼', en: 'VWXYZ-Wing' },
  difficulty: 530,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ─── 7xx Chains ──────────────────────────────────────────────────────────────

/**
 * Twinned XY-Chains: two XY-chains that share one or both endpoints,
 * enabling off-chain eliminations not reachable by a single chain.
 * Reuses the AIC/XY-chain engine with a paired-chain search.
 */
export const twinnedXyChains: Strategy = {
  id: 'twinned-xy-chains',
  name: { zh: '孪生XY链', en: 'Twinned XY-Chains' },
  difficulty: 775,
  tieBreak: ['chain-length', 'cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * AIC with Exotic Links: AIC chains that include exotic inference links
 * (e.g. Almost Locked Sets links, Grouped links beyond the standard kind,
 * or Turbot-Fish-style links in more complex patterns).  Extends the AIC
 * engine with richer node/link types.
 */
export const aicWithExoticLinks: Strategy = {
  id: 'aic-with-exotic-links',
  name: { zh: '含异链节点的AIC', en: 'AIC with Exotic Links' },
  difficulty: 780,
  tieBreak: ['chain-length', 'cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ─── 9xx Uniqueness ──────────────────────────────────────────────────────────

/**
 * Gurth's Symmetrical Placement: exploits a puzzle's rotational or
 * reflective symmetry to deduce digit assignments, then places or
 * eliminates candidates accordingly.  Belongs to the uniqueness family
 * because it relies on the assumption of a unique solution.
 */
export const gurth: Strategy = {
  id: 'gurth',
  name: { zh: 'Gurth对称占位', en: "Gurth's Symmetrical Placement" },
  difficulty: 990,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

// ─── 1xxx Exotic ─────────────────────────────────────────────────────────────

/**
 * Sue de Coq Extended: broader SdC patterns — larger intersection sets
 * (3+3, 4+3, …) or dual-line configurations — that exceed the basic 2/3-cell
 * SdC covered by `sue-de-coq`.  Reuses the sue-de-coq detector framework.
 */
export const sueDeCoqExtended: Strategy = {
  id: 'sue-de-coq-extended',
  name: { zh: '扩展Sue de Coq', en: 'Sue de Coq Extended' },
  difficulty: 1015,
  tieBreak: ['house', 'size'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Fireworks: a set of 3 cells (two in a row/col, one in a box) that form
 * a locked-set structure analogous to a kite, producing strong eliminations
 * in the shared house.  Scales to quads and beyond (Cobra Roll pattern).
 */
export const fireworks: Strategy = {
  id: 'fireworks',
  name: { zh: '烟花', en: 'Fireworks' },
  difficulty: 1050,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Franken Fish: fish pattern where the base/cover sets may be a mix of rows,
 * columns, and boxes (unlike standard fish which uses only rows or only
 * columns).  Fins are allowed (Finned Franken Fish).
 */
export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '科学怪鱼', en: 'Franken Fish' },
  difficulty: 1080,
  tieBreak: ['digit', 'size'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Mutant Fish: fish pattern where base and cover sets are each arbitrary
 * mixes of rows, columns, and boxes (the most general fish form).
 * Subsumes Franken Fish.  Includes Endo Fins, Cannibalism, and Siamese
 * presentations.
 */
export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '变异鱼', en: 'Mutant Fish' },
  difficulty: 1090,
  tieBreak: ['digit', 'size'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Aligned Pair Exclusion (APE): two unsolved cells in the same row/col with
 * no common peer house.  For each combination of their candidates, if all
 * solutions of a combined pair are ruled out by shared peer naked/hidden sets,
 * that combination is excluded — eliminating one or both digits.
 */
export const alignedPairExclusion: Strategy = {
  id: 'aligned-pair-exclusion',
  name: { zh: '对齐数对排除', en: 'Aligned Pair Exclusion' },
  difficulty: 1120,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Aligned Triple Exclusion (ATE): the size-3 generalisation of APE.
 * Three aligned cells; all triples of candidates ruled out by shared
 * peer constraints are excluded.
 */
export const alignedTripleExclusion: Strategy = {
  id: 'aligned-triple-exclusion',
  name: { zh: '对齐三元组排除', en: 'Aligned Triple Exclusion' },
  difficulty: 1130,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Subset Exclusion (Subset Counting): generalisation of APE/ATE to
 * non-aligned sets of cells.  Counts the maximum number of distinct
 * values a set of cells can collectively hold; any value excluded by
 * all possible assignments is eliminated.
 */
export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['size', 'cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * Exocet (Junior / Senior): a base pair in a mini-row/col whose digits
 * must appear in two target cells; all non-base digits are eliminated from
 * the targets.  Double Exocet applies cross-annotation between two Exocets.
 */
export const exocet: Strategy = {
  id: 'exocet',
  name: { zh: '导弹', en: 'Exocet' },
  difficulty: 1200,
  tieBreak: ['cell-index', 'digit'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * SK-Loop: a special case of MSLS where the multi-sector naked set forms
 * a closed loop of 8 mini-rows/columns.  Each SK-Loop implies an underlying
 * MSLS; it is listed separately because its recognition pattern is distinct.
 */
export const skLoop: Strategy = {
  id: 'sk-loop',
  name: { zh: 'SK环', en: 'SK-Loop' },
  difficulty: 1250,
  tieBreak: ['cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};

/**
 * MSLS (Multi-Sector Locked Sets): a rank-0 logic involving two or more
 * sectors (rows, columns, boxes) whose combined candidate sets are fully
 * accounted for, enabling mass eliminations outside the sectors.
 */
export const msls: Strategy = {
  id: 'msls',
  name: { zh: '多扇区锁定集', en: 'Multi-Sector Locked Sets' },
  difficulty: 1300,
  tieBreak: ['size', 'cell-index'],

  apply(_grid: Grid): Step | null {
    return null;
  },
};
