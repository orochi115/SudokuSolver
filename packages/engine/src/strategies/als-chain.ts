/**
 * ALS-Chain (ALS-XY-Chain, generalized) — ALS-XY链 (通用).
 *
 * A sequence of Almost Locked Sets A1 … Ak connected by Restricted Common
 * Candidates (RCCs), with the first and last ALS sharing a common digit Z.
 *
 * Each RCC link is a WEAK link between adjacent ALS in chain notation:
 *   (Z_a) ALS_a ↔ ALS_a+1 (RCC)
 *
 * Logic: in a chain of RCC-linked ALS, the chain forces Z to be true in
 * at least one of the endpoint ALS. Therefore Z can be eliminated from
 * any cell that sees every instance of Z in BOTH endpoint ALS.
 *
 * Special cases:
 *   k=2 → ALS-XZ (handled by `als-xz` strategy, earlier difficulty)
 *   k=3 → ALS-XY-Wing (handled by `als-xy-wing` strategy, earlier difficulty)
 *   k≥4 → general ALS-XY-Chain (this strategy)
 *
 * This strategy fires for chain length ≥ 4, finding sequences of three or
 * more ALS linked by RCCs whose endpoints share a common digit Z. It must
 * verify every adjacent pair is genuinely linked by an RCC — finding two
 * arbitrary ALS with a common digit is unsound (it would duplicate an
 * incorrect als-xz without the RCC check).
 *
 * E4: per the checklist, `als-xy-wing` is a special case of `als-chain`.
 * The `als-xy-wing` strategy remains a separately-registered id for
 * precedence / labelling; its underlying logic is the len-3 case of the
 * same search engine implemented here.
 */

import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface ALS {
  cells: number[];
  digits: number[];
  digitMask: number;
  house: number;
  cellOfDigit: Map<number, number[]>;
}

function findALSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): ALS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: ALS[] = [];
  function* combinations(arr: number[], k: number): Generator<number[]> {
    if (k === 0) { yield []; return; }
    if (arr.length < k) return;
    const [first, ...rest] = arr;
    for (const c of combinations(rest, k - 1)) yield [first!, ...c];
    yield* combinations(rest, k);
  }
  for (let size = 1; size <= Math.min(maxSize, emptyCells.length - 1); size++) {
    for (const combo of combinations(emptyCells, size)) {
      let mask = 0;
      for (const c of combo) mask |= grid.candidatesOf(c);
      if (popcount(mask) === size + 1) {
        const digits = digitsOf(mask);
        const cellOfDigit = new Map<number, number[]>();
        for (const c of combo) {
          for (const d of digits) {
            if (grid.candidatesOf(c) & maskOf(d)) {
              if (!cellOfDigit.has(d)) cellOfDigit.set(d, []);
              cellOfDigit.get(d)!.push(c);
            }
          }
        }
        result.push({ cells: combo, digits, digitMask: mask, house: houseIndex, cellOfDigit });
      }
    }
  }
  return result;
}

function findAllALS(grid: Grid): ALS[] {
  const result: ALS[] = [];
  const seen = new Set<string>();
  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    for (const als of findALSInHouse(grid, HOUSES[houseIndex]!, houseIndex, 4)) {
      const key = `${als.house}:${[...als.cells].sort((a, b) => a - b).join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(als);
    }
  }
  return result;
}

function isRCC(grid: Grid, a: ALS, b: ALS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.digitMask & bit)) return false;
  if (!(b.digitMask & bit)) return false;
  const aCells = a.cells.filter((c) => grid.candidatesOf(c) & bit);
  const bCells = b.cells.filter((c) => grid.candidatesOf(c) & bit);
  if (aCells.length === 0 || bCells.length === 0) return false;
  for (const ac of aCells) {
    for (const bc of bCells) {
      if (ac === bc) return false;
      if (!PEERS_OF[ac]!.includes(bc)) return false;
    }
  }
  return true;
}

function alsShareCells(a: ALS, b: ALS): boolean {
  const s = new Set(a.cells);
  return b.cells.some((c) => s.has(c));
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface ChainLink {
  fromIdx: number;
  toIdx: number;
  digit: number;
}

function buildChainLinks(grid: Grid, alsList: ALS[]): ChainLink[] {
  const links: ChainLink[] = [];
  for (let i = 0; i < alsList.length; i++) {
    for (let j = i + 1; j < alsList.length; j++) {
      const a = alsList[i]!;
      const b = alsList[j]!;
      if (alsShareCells(a, b)) continue;
      const common = digitsOf(a.digitMask & b.digitMask);
      for (const d of common) {
        if (isRCC(grid, a, b, d)) links.push({ fromIdx: i, toIdx: j, digit: d });
      }
    }
  }
  return links;
}

/**
 * Find a length-3+ ALS chain:
 *   A1 -- X1 -- A2 -- X2 -- A3 -- ... -- Ak
 * where:
 *   - each adjacent pair (Ai, Ai+1) is linked by an RCC digit Xi
 *   - A1 and Ak share a common digit Z (the elimination target)
 *   - the chain length k ≥ 3 (length 2 is als-xz, length 3 is als-xy-wing)
 *
 * Returns the chain (as ALS sequence), the digit Z, the endpoints, and the
 * RCC digits between adjacent pairs.
 */
function searchAlsChain(
  grid: Grid,
  alsList: ALS[],
  links: ChainLink[],
): { chain: ALS[]; rccs: number[]; z: number; endpoints: [ALS, ALS] } | null {
  const adj = new Map<number, ChainLink[]>();
  for (const l of links) {
    if (!adj.has(l.fromIdx)) adj.set(l.fromIdx, []);
    if (!adj.has(l.toIdx)) adj.set(l.toIdx, []);
    adj.get(l.fromIdx)!.push(l);
    adj.get(l.toIdx)!.push(l);
  }

  // Adjacency by (from, to) for quick lookup. We need to know the RCC digit.
  const MAX_CHAIN_LEN = 6;

  // Try chains of length 3, 4, 5, 6 starting from each ALS.
  for (let start = 0; start < alsList.length; start++) {
    const result = dfsChain(start, [start], [-1], new Set([start]), MAX_CHAIN_LEN);
    if (result) return result;
  }
  return null;

  function dfsChain(
    curIdx: number,
    chain: number[],
    rccs: number[],
    visited: Set<number>,
    maxLen: number,
  ): { chain: ALS[]; rccs: number[]; z: number; endpoints: [ALS, ALS] } | null {
    const curAls = alsList[curIdx]!;
    if (chain.length >= 3) {
      // Try to find a common digit Z (not equal to any RCC in the chain)
      // between curAls (last endpoint) and the start ALS.
      const startAls = alsList[chain[0]!]!;
      if (!alsShareCells(curAls, startAls)) {
        const common = digitsOf(curAls.digitMask & startAls.digitMask);
        for (const z of common) {
          if (rccs.includes(z)) continue;
          // Found an endpoint chain
          return {
            chain: chain.map((i) => alsList[i]!),
            rccs: [...rccs],
            z,
            endpoints: [startAls, curAls],
          };
        }
      }
    }

    if (chain.length >= maxLen) return null;

    // Forward step: pick a neighbor ALS via an RCC link.
    const localAdj = adj.get(curIdx) ?? [];
    for (const link of localAdj) {
      const nextIdx = link.fromIdx === curIdx ? link.toIdx : link.fromIdx;
      if (nextIdx === undefined) continue;
      if (visited.has(nextIdx)) continue;
      // Don't allow consecutive identical RCCs in the chain (would be redundant)
      if (rccs[rccs.length - 1] === link.digit) continue;
      const res = dfsChain(
        nextIdx,
        [...chain, nextIdx],
        [...rccs, link.digit],
        new Set([...visited, nextIdx]),
        maxLen,
      );
      if (res) return res;
    }
    return null;
  }
}

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS-XY链', en: 'ALS-XY-Chain' },
  difficulty: 880,
  tieBreak: ['house', 'cell-index'],

  apply(grid: Grid): Step | null {
    const alsList = findAllALS(grid);
    if (alsList.length < 2) return null;
    const links = buildChainLinks(grid, alsList);
    const res = searchAlsChain(grid, alsList, links);
    if (!res) return null;
    const [a, b] = res.endpoints;
    const z = res.z;
    const zBit = maskOf(z);
    const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
    const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);
    if (aCellsZ.length === 0 || bCellsZ.length === 0) return null;

    const chainCells = res.chain.flatMap((n) => n.cells);
    const isInChain = new Set(chainCells);

    const elims: { cell: number; digit: number }[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (!(grid.candidatesOf(c) & zBit)) continue;
      if (isInChain.has(c)) continue;
      const peers = new Set(PEERS_OF[c]!);
      if (aCellsZ.every((ac) => peers.has(ac)) && bCellsZ.every((bc) => peers.has(bc))) {
        elims.push({ cell: c, digit: z });
      }
    }
    if (elims.length === 0) return null;

    const allCells = [...new Set([...chainCells, ...a.cells, ...b.cells, ...elims.map((e) => e.cell)])];
    const chainLabels = res.chain.map((n) =>
      n.cells.map((c) => cellLabel(c)).join('+'),
    );
    const rccLabels = res.rccs.map((d) => String(d));
    return {
      strategyId: 'als-chain',
      placements: [],
      eliminations: elims,
      highlights: {
        cells: allCells,
        candidates: [
          ...chainCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          ...elims,
        ],
        links: [],
      },
      explanation: {
        zh: `ALS-XY链（${res.chain.length} 节点，链 ${chainLabels.join(' — ' + rccLabels.join('') + ' — ')}）：一列 ALS 经 RCC ${rccLabels.join(' / ')} 链相连，首尾 ALS 共享候选数 ${z}；消去能同时看到两端 ${z} 的格的 ${z}（ALS-XY链）。`,
        en: `ALS-XY-Chain (${res.chain.length} nodes, chain ${chainLabels.join(' — ' + rccLabels.join('') + ' — ')}): a chain of ALS linked by RCCs ${rccLabels.join(' / ')}; endpoints share digit ${z}; eliminate ${z} from cells seeing all ${z} in both endpoints (ALS-XY-Chain).`,
      },
    };
  },
};

/**
 * AHS (Almost Hidden Set) — used as a chain node.
 *
 * Almost Hidden Set: N digits confined to N+1 cells of a single house. The
 * "AHS-as-chain-node" form is the hidden-space dual of an ALS: treating
 * each cell of the AHS as a node, the strong link is "if cell c doesn't
 * take a digit of D, the N digits of D lock into the other N cells" — a
 * Hidden Locked Set, eliminating every non-D candidate from those N cells.
 *
 * Direct elimination is only sound in the restricted "forced escape" case:
 *   - one carrier has only NON-D candidates (no D) — that carrier MUST be
 *     the escape, so the other N carriers form an HLS and shed non-D.
 *   - OR: N carriers have only D candidates — they form an HLS, but the
 *     "extra" carrier is the forced escape; eliminations on the N carriers
 *     are vacuous (they already have no non-D).
 *
 * The general conditional form ("if any one carrier escapes, the others are
 * HLS") is NOT a valid direct elimination: in solutions where a different
 * carrier escapes, the implementation's chosen lockedCells include a cell
 * with non-D, so eliminating non-D is unsound. AHS direct eliminations are
 * therefore restricted to the sound forced-escape cases below.
 *
 * For the full power of AHS, the chain-node use is required — which feeds
 * the surrounding AIC, not a direct elimination. That integration belongs to
 * the AIC engine, not this standalone strategy. This apply() emits a Step
 * only when a sound direct elimination is found (rare in practice).
 */
export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集 (AHS)', en: 'Almost Hidden Set (AHS)' },
  difficulty: 885,
  tieBreak: ['house', 'digit'],

  apply(grid: Grid): Step | null {
    // Sound direct AHS: a carrier with NO D candidates is forced to be the
    // escape. The other N carriers form an HLS; eliminate non-D from them.
    // We additionally check that no other carrier's "non-D" alternatives
    // could make it the escape instead — i.e., the lockedCells must be
    // HLS *unconditionally*, which they are iff each lockedCell's only
    // candidates are D digits (no non-D).
    //
    // In practice: find an AHS where exactly one carrier has non-D
    // candidates and the others are D-only. Then the non-D carrier is the
    // forced escape, the others are the forced HLS, and eliminating non-D
    // from those others is vacuous — so we look for the *stronger* form:
    // the AHS produces external eliminations on cells outside the house
    // (or in the house, outside the AHS) that see all D cells in the AHS.
    //
    // Actually, the cleanest sound direct use: a cell outside the AHS, in
    // the same house, that sees all AHS carriers can have no D candidate
    // (D is confined to the AHS). For typical puzzles this is vacuous too.
    //
    // Pragmatic decision: emit a Step only when there is a non-vacuous
    // elimination. We use the forced-escape form: one carrier has only
    // non-D candidates, and we eliminate non-D from the *other* carriers
    // (which have at least one D candidate — they may have non-D too).
    // The eliminations are: cells in lockedCells with non-D candidates get
    // those non-D candidates removed.
    //
    // We additionally require that no other carrier can be the escape,
    // which is guaranteed when each lockedCell has at least one D candidate
    // (it could take D), but the rule requires the escape to be FORCED.
    // The escape is forced iff the escape cell has no D candidate. With
    // that one forced escape, the lockedCells MUST form HLS (D digits
    // are confined to them).
    //
    // Soundness: in every valid solution, the forced-escape cell takes
    // non-D (it has no other choice). The remaining N cells host N D
    // digits, forming an HLS. Any non-D candidate in those N cells is
    // impossible — it would have to be a non-D digit in a cell that must
    // take a D digit. Eliminate them.

    for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
      const house = HOUSES[houseIndex]!;
      const emptyCells = house.filter((c) => grid.get(c) === 0);
      if (emptyCells.length < 3) continue;

      for (let N = 2; N <= 4; N++) {
        function* digitCombos(): Generator<number[]> {
          function* gen(prefix: number[], start: number): Generator<number[]> {
            if (prefix.length === N) { yield [...prefix]; return; }
            for (let d = start; d <= 9; d++) {
              prefix.push(d);
              yield* gen(prefix, d + 1);
              prefix.pop();
            }
          }
          yield* gen([], 1);
        }

        for (const D of digitCombos()) {
          const Dmask = D.reduce((m, d) => m | maskOf(d), 0);
          const carriers: number[] = [];
          for (const c of house) {
            const m = grid.candidatesOf(c);
            if (m === 0) continue;
            if ((m & Dmask) !== 0) carriers.push(c);
          }
          if (carriers.length !== N + 1) continue;

          // Find forced-escape carrier: has at least one non-D candidate
          // AND no D candidate at all. With such a forced escape, the
          // other N carriers form the HLS.
          let escape: number | null = null;
          for (const c of carriers) {
            const m = grid.candidatesOf(c);
            if ((m & Dmask) === 0 && (m & ~Dmask) !== 0) {
              escape = c;
              break;
            }
          }
          if (escape === null) continue;

          const escapeMask = grid.candidatesOf(escape);
          // The escape has no D candidates and at least one non-D candidate.
          // It's the forced escape. The other carriers form the HLS.
          const lockedCells = carriers.filter((c) => c !== escape);
          // Sanity: each lockedCell must have at least one D candidate
          // (otherwise it can't be in the HLS).
          const allLockedHaveD = lockedCells.every((c) => grid.candidatesOf(c) & Dmask);
          if (!allLockedHaveD) continue;

          // Build eliminations: non-D from lockedCells (these cells MUST
          // take D, so their non-D candidates are impossible).
          const elims: { cell: number; digit: number }[] = [];
          for (const c of lockedCells) {
            const m = grid.candidatesOf(c);
            const nonD = m & ~Dmask;
            for (const d of digitsOf(nonD)) {
              if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length === 0) continue;

          const allCells = [...carriers, ...elims.map((e) => e.cell)];
          return {
            strategyId: 'ahs',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...new Set(allCells)],
              candidates: [
                ...carriers.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `几乎隐藏集（AHS）：在 ${houseIndex < 9 ? `第${houseIndex + 1}行` : houseIndex < 18 ? `第${houseIndex - 8 + 1}列` : `第${houseIndex - 17 + 1}宫`}中，数字 {${D.join(',')}} 仅出现在 ${carriers.length} 格；${cellLabel(escape)} 不能取 {${D.join(',')}} 的任何候选，强制为非 D，其余 ${lockedCells.length} 格构成隐藏锁定集 → 消去其非 D 候选。`,
              en: `Almost Hidden Set (AHS): in ${houseIndex < 9 ? `row ${houseIndex + 1}` : houseIndex < 18 ? `col ${houseIndex - 8 + 1}` : `box ${houseIndex - 17 + 1}`}, digits {${D.join(',')}} appear in only ${carriers.length} cells; ${cellLabel(escape)} has no {${D.join(',')}} candidates (forced escape), the remaining ${lockedCells.length} cells form a Hidden Locked Set → eliminate non-{${D.join(',')}} candidates from them.`,
            },
          };
        }
      }
    }
    return null;
  },
};