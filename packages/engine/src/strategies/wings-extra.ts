/**
 * Advanced wings / bent / oddagon family (P1).
 *
 *  - wxyz-wing  : generalised XYZ-wing — an "almost locked set" of size 4
 *    (4 cells / 5 candidates) containing a true-target digit Z that is also a
 *    candidate of a cell seeing allAls cells; eliminate Z from such seeing cells.
 *  - bent-sets  : Almost Locked Pair/Triple across a box-line ("bent") — two
 *    ALS each confined to a bend of a box/line, sharing digits; eliminate the
 *    shared non-RCC digit from common-seeing cells. Sound ALS-style reduction.
 *  - broken-wing: single-digit "guardian" pattern — an odd cycle of strong
 *    links on digit d would be a contradiction unless at least one "guardian"
 *    (an extra d-candidate breaking a link) is true; eliminate d from cells
 *    seeing ALL guardians. Sound (oddagon contradiction, NOT search).
 *
 * None do trial-and-error; each is a named single-step deduction.
 */

import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function seesAll(cell: number, targets: number[]): boolean {
  if (targets.includes(cell)) return false;
  const peers = new Set(PEERS_OF[cell]!);
  return targets.every((t) => peers.has(t));
}

// ---- WXYZ-Wing ----
// An ALS of 4 cells (in one house or mutually visible) with 5 candidates, plus
// a bivalue {Y,Z} pivot seeing the ALS, such that Z is confined: exactly one of
// pivot/ALS holds Z true → eliminate Z from cells seeing all Z-cells.
//
// Sound, deterministic, bounded form (per Hodoku wxyz-wing):
//   pivot cell P (bivalue {Y,Z}); an ALS A (n cells, n+1 cands) in one house
//   such that Y is confined to P within a house P shares, and Z ∈ cands(A).
//   Then Z must be in A or P → eliminate Z from cells seeing all (P ∪ Z-cells-in-A).
export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    // Build ALS of size 2..4 per house (size 2 = 3 cands, 3 = 4 cands, 4 = 5 cands).
    const alsList: { house: number; cells: number[]; digits: number[]; mask: number }[] = [];
    const seen = new Set<string>();
    for (let h = 0; h < HOUSES.length; h++) {
      const empty = HOUSES[h]!.filter((c) => grid.get(c) === 0);
      for (let size = 2; size <= 4 && size <= empty.length; size++) {
        for (const combo of combinations(empty, size)) {
          let mask = 0;
          for (const c of combo) mask |= grid.candidatesOf(c);
          if (popcount(mask) === size + 1) {
            const key = `${h}:${[...combo].sort((a, b) => a - b).join(',')}`;
            if (seen.has(key)) continue;
            seen.add(key);
            alsList.push({ house: h, cells: combo, digits: digitsOf(mask), mask });
          }
        }
      }
    }

    // Pivot: a bivalue cell P {Y,Z}.
    for (let p = 0; p < CELLS; p++) {
      if (grid.get(p) !== 0) continue;
      const pm = grid.candidatesOf(p);
      if (popcount(pm) !== 2) continue;
      const [Y, Z] = digitsOf(pm) as [number, number];
      for (const als of alsList) {
        if (als.cells.includes(p)) continue;
        if (!(als.mask & maskOf(Y))) continue; // Y present in ALS
        if (!(als.mask & maskOf(Z))) continue; // Z present in ALS
        // P must see all Y-cells of ALS (so Y is restricted between P and ALS)
        const yCells = als.cells.filter((c) => grid.candidatesOf(c) & maskOf(Y));
        if (yCells.length === 0) continue;
        if (!yCells.every((c) => PEERS_OF[p]!.includes(c))) continue;
        // Z-cells in ALS:
        const zCells = als.cells.filter((c) => grid.candidatesOf(c) & maskOf(Z));
        const allZ = [p, ...zCells];
        // eliminate Z from cells seeing all of allZ
        const elims: { cell: number; digit: number }[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (c === p || als.cells.includes(c)) continue;
          if (!grid.hasCandidate(c, Z)) continue;
          if (seesAll(c, allZ)) elims.push({ cell: c, digit: Z });
        }
        if (elims.length === 0) continue;
        return {
          strategyId: 'wxyz-wing',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...als.cells, p, ...elims.map((e) => e.cell)],
            candidates: [
              ...als.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              { cell: p, digit: Y }, { cell: p, digit: Z },
              ...elims,
            ],
            links: [
              { from: { cell: p, digit: Y }, to: { cell: yCells[0]!, digit: Y }, type: 'weak' },
              { from: { cell: p, digit: Z }, to: { cell: zCells[0]!, digit: Z }, type: 'strong' },
            ],
          },
          explanation: {
            zh: `WXYZ翼：双值枢纽 ${cellLabel(p)}{${Y},${Z}} 与 ALS（{${als.digits.join(',')}}）经 ${Y} 受限连接；${Z} 必在枢纽或 ALS 中，消去同时看到两者的 ${Z}。`,
            en: `WXYZ-Wing: bivalue pivot ${cellLabel(p)}{${Y},${Z}} linked to ALS ({${als.digits.join(',')}}) via restricted ${Y}; ${Z} must lie in pivot or ALS; eliminate ${Z} from cells seeing both.`,
          },
        };
      }
    }
    return null;
  },
};

// ---- Bent Sets (Almost Locked Pair/Triple, "bent" across box-line) ----
// Two ALS A, B in DIFFERENT house-types that together "bend" around a shared
// box: A in a row, B in a column, A∩B in one box. They share two digits X (RCC)
// and Z (non-RCC common). Eliminate Z from cells seeing all Z-cells of A and B.
// Sound by ALS duality along the bend (Hodoku "bent subset").
export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '折角集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const alsList: { type: 'row' | 'col'; idx: number; cells: number[]; digits: number[]; mask: number }[] = [];
    for (let r = 0; r < 9; r++) {
      const empty = HOUSES[r]!.filter((c) => grid.get(c) === 0);
      for (const combo of combinations(empty, 2)) {
        let mask = 0;
        for (const c of combo) mask |= grid.candidatesOf(c);
        if (popcount(mask) === 3) alsList.push({ type: 'row', idx: r, cells: combo, digits: digitsOf(mask), mask });
      }
    }
    for (let c = 0; c < 9; c++) {
      const empty = HOUSES[9 + c]!.filter((cc) => grid.get(cc) === 0);
      for (const combo of combinations(empty, 2)) {
        let mask = 0;
        for (const cc of combo) mask |= grid.candidatesOf(cc);
        if (popcount(mask) === 3) alsList.push({ type: 'col', idx: c, cells: combo, digits: digitsOf(mask), mask });
      }
    }

    for (let i = 0; i < alsList.length; i++) {
      for (let j = i + 1; j < alsList.length; j++) {
        const A = alsList[i]!, B = alsList[j]!;
        if (A.type === B.type) continue; // one row-ALS, one col-ALS
        const aSet = new Set(A.cells);
        if (B.cells.some((c) => aSet.has(c))) continue;
        // they must share a box (the bend): every cell of A and B in ≤2 boxes,
        // and the intersection box holds the bend.
        const boxes = new Set([...A.cells, ...B.cells].map((c) => BOX_OF[c]!));
        if (boxes.size > 2) continue;
        const common = digitsOf(A.mask & B.mask);
        for (const X of common) {
          // X restricted: all X-cells of A see all X-cells of B
          const aX = A.cells.filter((c) => grid.candidatesOf(c) & maskOf(X));
          const bX = B.cells.filter((c) => grid.candidatesOf(c) & maskOf(X));
          if (aX.length === 0 || bX.length === 0) continue;
          if (!aX.every((ac) => bX.every((bc) => PEERS_OF[ac]!.includes(bc)))) continue;
          for (const Z of common) {
            if (Z === X) continue;
            const aZ = A.cells.filter((c) => grid.candidatesOf(c) & maskOf(Z));
            const bZ = B.cells.filter((c) => grid.candidatesOf(c) & maskOf(Z));
            if (aZ.length === 0 || bZ.length === 0) continue;
            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (aSet.has(c) || B.cells.includes(c)) continue;
              if (!grid.hasCandidate(c, Z)) continue;
              const peers = new Set(PEERS_OF[c]!);
              if (aZ.every((x) => peers.has(x)) && bZ.every((x) => peers.has(x))) {
                elims.push({ cell: c, digit: Z });
              }
            }
            if (elims.length === 0) continue;
            const allCells = [...A.cells, ...B.cells];
            return {
              strategyId: 'bent-sets',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                candidates: [
                  ...allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `折角集：行ALS {${A.digits.join(',')}} 与列ALS {${B.digits.join(',')}} 折角相交，经 ${X} 受限；消去同时看到两集中所有 ${Z} 的格的 ${Z}。`,
                en: `Bent Sets: row-ALS {${A.digits.join(',')}} and col-ALS {${B.digits.join(',')}} bend together, restricted by ${X}; eliminate ${Z} from cells seeing all ${Z} in both.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

// ---- Broken Wing (Guardians) ----
// A "broken wing" is an ODD cycle of strong links on digit d. An odd strong-
// link cycle is a contradiction (can't 2-colour), which means the cycle is NOT
// real — at least one of the strong links is actually broken, i.e. at least one
// extra d-candidate (a "guardian") that peers with a cycle cell and so the link
// isn't a true conjugate... Actually the standard Broken Wing: an odd cycle of
// weak links ... We implement the sound "odd strong-link cycle with guardians":
// build strong-link graph for d; find an ODD cycle; the cells just-off-cycle
// ("guardians") that see two adjacent cycle cells must contain a true d among
// them → eliminate d from cells seeing ALL guardians.
//
// To keep this sound & bounded we restrict to 3-cycles and 5-cycles of strong
// links and require ≥1 guardian; eliminate d from cells seeing all guardians.
export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '折翼（守护者）', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      // Build single-cell strong-link graph (conjugate pairs) for digit d.
      const adj = new Map<number, Set<number>>();
      const ensure = (c: number) => (adj.get(c) ?? adj.set(c, new Set()).get(c)!);
      for (const house of HOUSES) {
        const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        if (cands.length !== 2) continue;
        const [a, b] = cands as [number, number];
        ensure(a).add(b);
        ensure(b).add(a);
      }
      const nodes = [...adj.keys()];
      // search odd cycles (3, 5)
      const cycle = findOddCycle(adj, nodes, 5, 6000);
      if (!cycle) continue;
      // guardians: d-candidates outside cycle that see two ADJACENT cycle cells
      // (i.e. break one of the strong links by being a 3rd candidate in that house).
      const cycleSet = new Set(cycle);
      const guardians: number[] = [];
      const gseen = new Set<number>();
      for (let i = 0; i < cycle.length; i++) {
        const a = cycle[i]!, b = cycle[(i + 1) % cycle.length]!;
        // houses containing both a and b
        for (const h of commonHouses(a, b)) {
          for (const c of HOUSES[h]!) {
            if (cycleSet.has(c) || grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
            if (gseen.has(c)) continue;
            gseen.add(c);
            guardians.push(c);
          }
        }
      }
      if (guardians.length === 0) continue;
      // eliminate d from cells seeing ALL guardians
      const elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (cycleSet.has(c) || gseen.has(c) || grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
        if (seesAll(c, guardians)) elims.push({ cell: c, digit: d });
      }
      if (elims.length === 0) continue;
      const allCells = [...cycle, ...guardians, ...elims.map((e) => e.cell)];
      const links: import('../trace.js').Link[] = [];
      for (let i = 0; i < cycle.length; i++) {
        links.push({ from: { cell: cycle[i]!, digit: d }, to: { cell: cycle[(i + 1) % cycle.length]!, digit: d }, type: 'strong' });
      }
      return {
        strategyId: 'broken-wing',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...new Set(allCells)],
          candidates: allCells.map((c) => ({ cell: c, digit: d })),
          links,
        },
        explanation: {
          zh: `折翼：数字 ${d} 的奇数强链环（${cycle.length} 环）必被守护者打破；至少一守护者为 ${d}，消去同时看到所有守护者的格的 ${d}。`,
          en: `Broken Wing: digit ${d}'s odd strong-link cycle (${cycle.length}) must be broken by a guardian; at least one guardian is ${d}; eliminate ${d} from cells seeing all guardians.`,
        },
      };
    }
    return null;
  },
};

function commonHouses(a: number, b: number): number[] {
  const units1 = new Set([ROW_OF[a]!, 9 + COL_OF[a]!, 18 + BOX_OF[a]!]);
  return [ROW_OF[b]!, 9 + COL_OF[b]!, 18 + BOX_OF[b]!].filter((h) => units1.has(h));
}

function findOddCycle(adj: Map<number, Set<number>>, nodes: number[], maxLen: number, budget: number): number[] | null {
  let spent = 0;
  for (const start of nodes) {
    if (spent > budget) break;
    // DFS for odd cycle returning to start (length ≥3 odd, ≤maxLen)
    const stack: Array<{ node: number; path: number[]; visited: Set<number> }> = [
      { node: start, path: [start], visited: new Set([start]) },
    ];
    while (stack.length && spent <= budget) {
      spent++;
      const it = stack.pop()!;
      for (const nb of adj.get(it.node) ?? []) {
        if (nb === start && it.path.length >= 3 && it.path.length % 2 === 1) {
          return it.path;
        }
        if (it.visited.has(nb)) continue;
        if (it.path.length >= maxLen) continue;
        const v = new Set(it.visited);
        v.add(nb);
        stack.push({ node: nb, path: [...it.path, nb], visited: v });
      }
    }
  }
  return null;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) yield [first!, ...combo];
  yield* combinations(rest, k);
}
