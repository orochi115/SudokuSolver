/**
 * Forcing-chain sub-types & Forcing Net (P3 — last resort) — 强制链子类与强制网.
 *
 * These reuse the shared forcing engine (`forcing-engine.ts`) — the same
 * PROVEN-sound propagation/conclusion primitives used by the `forcing-chain`
 * owner — but issue DISTINCT named ids by premise type:
 *
 *  - `digit-forcing-chain`: a digit restricted to exactly two spots in a house
 *    is a true dichotomy; both spots are propagated and common conclusions drawn.
 *  - `cell-forcing-chain`: a bivalue cell's two values form a dichotomy.
 *  - `region-forcing-chain`: a digit's two spots in a region, propagated via full
 *    naked-singles propagation (the "region" framing of the legacy house forcing).
 *  - `dic`: Double Implication Chain — the common-conclusion branch of a
 *    two-branch forcing (both implications hold simultaneously).
 *  - `nishio-forcing-chain`: assume a single candidate, propagate naked singles
 *    to FIXED-POINT; a reached contradiction eliminates the candidate. Broader
 *    than the owner's bounded contradiction (which is step-capped).
 *  - `forcing-net`: multi-branch (≥3) forcing over a house's digit positions —
 *    the owner only handles 2-branch; this generalises to N branches.
 *
 * Soundness: every premise is a genuine exhaustive dichotomy/polychotomy (the
 * true candidate is exactly one of the branches), propagation is exact
 * implication-only, and eliminations/placements are the INTERSECTION across all
 * branches — so no elimination can disagree with the real solution. None of
 * these calls the brute-force solver or reads answers.
 *
 * Isolation: every id here is last-resort only (see profiles.ts LAST_RESORT_IDS
 * and chain/boundaries.ts).
 */

import { CELLS, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { DEFAULT_CHAIN_POLICY, type ChainPolicy } from '../chain/policy.js';
import {
  cellLabel,
  buildGraph,
  nodeIndexOf,
  forceFromTwo,
  forceFromBranches,
  contradictionFromAssumption,
  propagateNakedSingles,
  digitPositionsInHouse,
  makeForcingStep,
} from './forcing-engine.js';

const NISHIO_BOUND = 96; // enough to exhaust naked-singles propagation on an 81-cell grid

// ============================================================
// digit-forcing-chain (9010)
// ============================================================
export const digitForcingChain: Strategy = {
  id: 'digit-forcing-chain',
  name: { zh: '数字强制链', en: 'Digit Forcing Chain' },
  difficulty: 9010,
  tieBreak: ['house', 'digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    if (!policy.allowDigitForcing) return null;
    const graph = buildGraph(grid);

    for (const house of HOUSES) {
      for (let digit = 1; digit <= 9; digit++) {
        const positions = digitPositionsInHouse(grid, house, digit);
        if (positions.length !== 2) continue;
        const [a, b] = positions as [number, number];
        const na = nodeIndexOf(graph, a, digit);
        const nb = nodeIndexOf(graph, b, digit);
        if (na === undefined || nb === undefined) continue;
        const step = forceFromTwo(
          this.id, grid, graph, na, nb, positions, policy,
          {
            zh: `数字强制链：数字 ${digit} 在该房屋中只能落于 ${cellLabel(a)} 或 ${cellLabel(b)}，两种情形推演得到共同结论。`,
            en: `Digit forcing chain: digit ${digit} is confined to ${cellLabel(a)} or ${cellLabel(b)} in this house; both lead to the same conclusion.`,
          },
        );
        if (step) return step;
      }
    }
    return null;
  },
};

// ============================================================
// cell-forcing-chain (9030)
// ============================================================
export const cellForcingChain: Strategy = {
  id: 'cell-forcing-chain',
  name: { zh: '单元格强制链', en: 'Cell Forcing Chain' },
  difficulty: 9030,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    if (!policy.allowCellForcing) return null;
    const graph = buildGraph(grid);

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0 || popcount(grid.candidatesOf(cell)) !== 2) continue;
      const [d1, d2] = digitsOf(grid.candidatesOf(cell)) as [number, number];
      const n1 = nodeIndexOf(graph, cell, d1);
      const n2 = nodeIndexOf(graph, cell, d2);
      if (n1 === undefined || n2 === undefined) continue;
      const step = forceFromTwo(
        this.id, grid, graph, n1, n2, [cell], policy,
        {
          zh: `单元格强制链：双值格 ${cellLabel(cell)}{${d1},${d2}} 的两种取值分别推演，得到共同结论。`,
          en: `Cell forcing chain: both values of bivalue cell ${cellLabel(cell)}{${d1},${d2}} lead to the same conclusion.`,
        },
      );
      if (step) return step;
    }
    return null;
  },
};

// ============================================================
// region-forcing-chain (9040) — full naked-singles propagation per position
// ============================================================
export const regionForcingChain: Strategy = {
  id: 'region-forcing-chain',
  name: { zh: '区域强制链', en: 'Region Forcing Chain' },
  difficulty: 9040,
  tieBreak: ['house', 'digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (const house of HOUSES) {
      for (let digit = 1; digit <= 9; digit++) {
        const positions = digitPositionsInHouse(grid, house, digit);
        if (positions.length !== 2) continue;
        const [a, b] = positions as [number, number];
        const branchA = propagateNakedSingles(grid, a, digit);
        const branchB = propagateNakedSingles(grid, b, digit);

        // One branch contradicts -> the other is forced.
        if (branchA === null && branchB !== null && grid.hasCandidate(b, digit)) {
          return makeForcingStep(this.id, grid, positions, [{ cell: b, digit }], [],
            `区域强制链：假设 ${cellLabel(a)}=${digit} 导致矛盾，故 ${cellLabel(b)}=${digit}。`,
            `Region forcing chain: assuming ${cellLabel(a)}=${digit} leads to contradiction, therefore ${cellLabel(b)}=${digit}.`);
        }
        if (branchB === null && branchA !== null && grid.hasCandidate(a, digit)) {
          return makeForcingStep(this.id, grid, positions, [{ cell: a, digit }], [],
            `区域强制链：假设 ${cellLabel(b)}=${digit} 导致矛盾，故 ${cellLabel(a)}=${digit}。`,
            `Region forcing chain: assuming ${cellLabel(b)}=${digit} leads to contradiction, therefore ${cellLabel(a)}=${digit}.`);
        }
        if (branchA === null || branchB === null) continue;

        // Common conclusion.
        const elims: CellDigit[] = [];
        const commonPlace: CellDigit[] = [];
        for (const [tc, td] of branchA) {
          if (tc === a || tc === b) continue;
          if (grid.get(tc) !== 0) continue;
          if (branchB.get(tc) !== td) continue;
          if (td === digit) continue;
          if (grid.hasCandidate(tc, td)) commonPlace.push({ cell: tc, digit: td });
        }
        if (commonPlace.length > 0) {
          return makeForcingStep(this.id, grid, [...positions, commonPlace[0]!.cell], [commonPlace[0]!], [],
            `区域强制链：${cellLabel(a)} 与 ${cellLabel(b)} 落 ${digit} 均致 ${cellLabel(commonPlace[0]!.cell)}=${commonPlace[0]!.digit}。`,
            `Region forcing chain: placing ${digit} at ${cellLabel(a)} or ${cellLabel(b)} both force ${cellLabel(commonPlace[0]!.cell)}=${commonPlace[0]!.digit}.`);
        }
        // Build a candidate-elimination intersection: candidates false in both branches.
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          if (c === a || c === b) continue;
          for (const d of digitsOf(grid.candidatesOf(c))) {
            const falseInA = branchA.has(c) && branchA.get(c) !== d;
            const falseInB = branchB.has(c) && branchB.get(c) !== d;
            if (branchA.has(c) && branchB.has(c) && falseInA && falseInB && grid.hasCandidate(c, d)) {
              elims.push({ cell: c, digit: d });
            }
          }
        }
        if (elims.length > 0) {
          return makeForcingStep(this.id, grid, positions, [], elims,
            `区域强制链：两种落点推演均排除相同候选。`,
            `Region forcing chain: both placements eliminate the same candidates.`);
        }
      }
    }
    return null;
  },
};

// ============================================================
// dic — Double Implication Chain (9050)
// ============================================================
//
// A Double Implication Chain is a two-branch forcing where BOTH branches reach a
// concrete conclusion (the common-conclusion path). We reuse forceFromTwo; the
// "DIC" naming covers the common-elimination/common-placement outcome.
export const dic: Strategy = {
  id: 'dic',
  name: { zh: '双推断链', en: 'Double Implication Chain' },
  difficulty: 9050,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const policy = DEFAULT_CHAIN_POLICY;
    const graph = buildGraph(grid);

    // Try bivalue-cell dichotomies; keep only common-conclusion outcomes.
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0 || popcount(grid.candidatesOf(cell)) !== 2) continue;
      const [d1, d2] = digitsOf(grid.candidatesOf(cell)) as [number, number];
      const n1 = nodeIndexOf(graph, cell, d1);
      const n2 = nodeIndexOf(graph, cell, d2);
      if (n1 === undefined || n2 === undefined) continue;
      const step = forceFromTwo(
        this.id, grid, graph, n1, n2, [cell], policy,
        {
          zh: `双推断链：${cellLabel(cell)} 的两值 ${d1}/${d2} 同时推断出同一结论。`,
          en: `Double implication chain: both values ${d1}/${d2} of ${cellLabel(cell)} imply the same conclusion.`,
        },
      );
      if (step && step.eliminations.length > 0) return step;
    }
    return null;
  },
};

// ============================================================
// nishio-forcing-chain (9020) — single-candidate assumption to contradiction
// ============================================================
export const nishioForcingChain: Strategy = {
  id: 'nishio-forcing-chain',
  name: { zh: 'Nishio 强制链', en: 'Nishio Forcing Chain' },
  difficulty: 9020,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    // Test candidates most likely to contradiction-fast: bivalue cells first,
    // then cells with 3 candidates. Sound regardless of which we test.
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      const cnt = popcount(grid.candidatesOf(cell));
      if (cnt < 2 || cnt > 3) continue;
      for (const digit of digitsOf(grid.candidatesOf(cell))) {
        if (contradictionFromAssumption(grid, cell, digit, NISHIO_BOUND)) {
          if (!grid.hasCandidate(cell, digit)) continue;
          return makeForcingStep(this.id, grid, [cell], [], [{ cell, digit }],
            `Nishio 强制链：假设 ${cellLabel(cell)}=${digit} 并做完整单数传播后出现矛盾；消去该候选。`,
            `Nishio forcing chain: assuming ${cellLabel(cell)}=${digit} and propagating naked singles reaches a contradiction; eliminate that candidate.`);
        }
      }
    }
    return null;
  },
};

// ============================================================
// forcing-net (9100) — multi-branch (>=3) forcing over a house's digit positions
// ============================================================
export const forcingNet: Strategy = {
  id: 'forcing-net',
  name: { zh: '强制网', en: 'Forcing Net' },
  difficulty: 9100,
  tieBreak: ['house', 'digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    const policy: ChainPolicy = { ...DEFAULT_CHAIN_POLICY, allowNets: true };
    const graph = buildGraph(grid);

    // Multi-branch: a digit confined to 3..4 spots in a house (the owner only
    // handles exactly 2). Each spot is a branch; common conclusions are drawn.
    for (const house of HOUSES) {
      for (let digit = 1; digit <= 9; digit++) {
        const positions = digitPositionsInHouse(grid, house, digit);
        if (positions.length < 3 || positions.length > 4) continue;
        const nodes: number[] = [];
        for (const c of positions) {
          const n = nodeIndexOf(graph, c, digit);
          if (n === undefined) { nodes.length = 0; break; }
          nodes.push(n);
        }
        if (nodes.length === 0) continue;
        const step = forceFromBranches(
          this.id, grid, graph, nodes, positions, policy,
          {
            zh: `强制网：数字 ${digit} 在该房屋有 ${positions.length} 个落点，各分支推演取共同结论。`,
            en: `Forcing net: digit ${digit} has ${positions.length} spots in this house; the common conclusion across all branches holds.`,
          },
        );
        if (step) return step;
      }
    }

    // Also multi-branch from a cell with 3 candidates (trivalue forcing net).
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0) continue;
      if (popcount(grid.candidatesOf(cell)) !== 3) continue;
      const ds = digitsOf(grid.candidatesOf(cell));
      const nodes: number[] = [];
      for (const d of ds) {
        const n = nodeIndexOf(graph, cell, d);
        if (n === undefined) { nodes.length = 0; break; }
        nodes.push(n);
      }
      if (nodes.length === 0) continue;
      const step = forceFromBranches(
        this.id, grid, graph, nodes, [cell], policy,
        {
          zh: `强制网：三值格 ${cellLabel(cell)} 的三个候选分别推演取共同结论。`,
          en: `Forcing net: the three candidates of ${cellLabel(cell)} each propagate; the common conclusion holds.`,
        },
      );
      if (step) return step;
    }
    return null;
  },
};
