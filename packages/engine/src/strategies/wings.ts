/**
 * Wings (T3) — XY-Wing, XYZ-Wing, W-Wing.
 *
 * XY-Wing (Y-Wing):
 *   A pivot cell with exactly 2 candidates {X,Y} sees two pincers:
 *   one with {X,Z} and one with {Y,Z}. Any cell seeing BOTH pincers
 *   can't be Z and Z is eliminated from it.
 *
 * XYZ-Wing:
 *   A pivot cell with exactly 3 candidates {X,Y,Z} sees two pincers:
 *   one with {X,Z} and one with {Y,Z}. Any cell seeing the pivot AND
 *   both pincers can't be Z.
 *
 * W-Wing:
 *   Two bivalue cells with the same 2 candidates {A,B} are connected by
 *   a strong link on one of the digits (A). The other digit (B) is
 *   eliminated from cells seeing both bivalue cells.
 *   (A strong link: a house where digit A appears in exactly 2 cells,
 *    one of which connects to each bivalue cell via being in the same house.)
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, SIZE, maskOf, digitsOf, popcount, PEERS_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** True if two cells are peers (share row, col, or box). */
function arePeers(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/** Cells that see both a and b (excluding a and b themselves). */
function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => c !== a && peersA.has(c));
}

// ---- XY-Wing ----
function tryXYWing(grid: Grid): Step | null {
  // Collect bivalue cells (exactly 2 candidates)
  const bivalue: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) {
      bivalue.push(cell);
    }
  }

  for (const pivot of bivalue) {
    const pivotMask = grid.candidatesOf(pivot);
    const [x, y] = digitsOf(pivotMask);
    if (x === undefined || y === undefined) continue;

    // Look for pincers: cells that see pivot, have 2 candidates, share exactly one with pivot
    const pincers = bivalue.filter((p) => {
      if (p === pivot) return false;
      if (!arePeers(p, pivot)) return false;
      const m = grid.candidatesOf(p);
      // Must share exactly one candidate with pivot
      const shared = popcount(m & pivotMask);
      return shared === 1 && popcount(m) === 2;
    });

    // Find pairs of pincers: one shares X with pivot, other shares Y
    for (let i = 0; i < pincers.length; i++) {
      const p1 = pincers[i]!;
      const m1 = grid.candidatesOf(p1);

      for (let j = i + 1; j < pincers.length; j++) {
        const p2 = pincers[j]!;
        const m2 = grid.candidatesOf(p2);

        // Together, p1 and p2 must cover {X,Z} and {Y,Z} for some Z
        // i.e. their union minus pivot's candidates = {Z}
        const unionMask = m1 | m2;
        const extraMask = unionMask & ~pivotMask;
        if (popcount(extraMask) !== 1) continue;

        // The shared candidate between p1 and p2 must be Z (the elimination digit)
        const sharedPincers = m1 & m2;
        if (popcount(sharedPincers) !== 1) continue;
        if (sharedPincers !== extraMask) continue;

        const z = digitsOf(sharedPincers)[0]!;
        const bit = maskOf(z);

        // Eliminate Z from cells seeing both p1 and p2
        const elims = commonPeers(p1, p2).filter(
          (c) => c !== pivot && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        );
        if (elims.length === 0) continue;

        const elimStr = elims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');

        return {
          strategyId: 'xy-wing',
          placements: [],
          eliminations: elims.map((c) => ({ cell: c, digit: z })),
          highlights: {
            cells: [pivot, p1, p2],
            candidates: [
              { cell: pivot, digit: x }, { cell: pivot, digit: y },
              ...digitsOf(m1).map((d) => ({ cell: p1, digit: d })),
              ...digitsOf(m2).map((d) => ({ cell: p2, digit: d })),
            ],
            links: [
              { from: { cell: pivot, digit: x }, to: { cell: p1, digit: x }, type: 'weak' },
              { from: { cell: pivot, digit: y }, to: { cell: p2, digit: y }, type: 'weak' },
              { from: { cell: p1, digit: z }, to: { cell: p2, digit: z }, type: 'weak' },
            ],
          },
          explanation: {
            zh: `XY翼：枢纽 R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} 含 {${x},${y}}，钳形格 R${ROW_OF[p1]! + 1}C${COL_OF[p1]! + 1} 和 R${ROW_OF[p2]! + 1}C${COL_OF[p2]! + 1} 共享 Z=${z}。能看到两钳形格的格可消除候选数 ${z}。消除：${elimStr}。`,
            en: `XY-Wing: Pivot R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} has {${x},${y}}, pincers R${ROW_OF[p1]! + 1}C${COL_OF[p1]! + 1} and R${ROW_OF[p2]! + 1}C${COL_OF[p2]! + 1} share Z=${z}. Cells seeing both pincers can eliminate ${z}. Eliminations: ${elimStr}.`,
          },
        };
      }
    }
  }
  return null;
}

// ---- XYZ-Wing ----
function tryXYZWing(grid: Grid): Step | null {
  // Collect trivalue cells (exactly 3 candidates)
  const trivalue: number[] = [];
  const bivalue: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) === 0) {
      const cnt = popcount(grid.candidatesOf(cell));
      if (cnt === 3) trivalue.push(cell);
      else if (cnt === 2) bivalue.push(cell);
    }
  }

  for (const pivot of trivalue) {
    const pivotMask = grid.candidatesOf(pivot);
    const [x, y, z] = digitsOf(pivotMask);
    if (x === undefined || y === undefined || z === undefined) continue;

    // Look for two pincers (bivalue), each sharing exactly 2 candidates with pivot
    // and together sharing all 3 candidates of pivot
    const pincerCandidates = bivalue.filter((p) => {
      if (!arePeers(p, pivot)) return false;
      const m = grid.candidatesOf(p);
      // Pincer must be a subset of pivot's candidates (2 out of 3)
      return (m & pivotMask) === m && popcount(m) === 2;
    });

    for (let i = 0; i < pincerCandidates.length; i++) {
      const p1 = pincerCandidates[i]!;
      const m1 = grid.candidatesOf(p1);

      for (let j = i + 1; j < pincerCandidates.length; j++) {
        const p2 = pincerCandidates[j]!;
        const m2 = grid.candidatesOf(p2);

        // Together p1 and p2 must cover all 3 of pivot's candidates
        if ((m1 | m2) !== pivotMask) continue;

        // The shared candidate between p1 and p2 is Z (the elimination digit)
        const sharedZ = m1 & m2;
        if (popcount(sharedZ) !== 1) continue;
        const elimDigit = digitsOf(sharedZ)[0]!;
        const bit = maskOf(elimDigit);

        // Eliminate Z from cells seeing pivot AND both pincers
        const seesPivot = new Set(PEERS_OF[pivot]!);
        const elims = commonPeers(p1, p2).filter(
          (c) => c !== pivot && seesPivot.has(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
        );
        if (elims.length === 0) continue;

        const elimStr = elims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');

        return {
          strategyId: 'xyz-wing',
          placements: [],
          eliminations: elims.map((c) => ({ cell: c, digit: elimDigit })),
          highlights: {
            cells: [pivot, p1, p2],
            candidates: [
              ...digitsOf(pivotMask).map((d) => ({ cell: pivot, digit: d })),
              ...digitsOf(m1).map((d) => ({ cell: p1, digit: d })),
              ...digitsOf(m2).map((d) => ({ cell: p2, digit: d })),
            ],
            links: [],
          },
          explanation: {
            zh: `XYZ翼：枢纽 R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} 含 {${x},${y},${z}}，钳形格 R${ROW_OF[p1]! + 1}C${COL_OF[p1]! + 1} 和 R${ROW_OF[p2]! + 1}C${COL_OF[p2]! + 1} 共享 Z=${elimDigit}。能看到枢纽和两钳形格的格可消除候选数 ${elimDigit}。消除：${elimStr}。`,
            en: `XYZ-Wing: Pivot R${ROW_OF[pivot]! + 1}C${COL_OF[pivot]! + 1} has {${x},${y},${z}}, pincers R${ROW_OF[p1]! + 1}C${COL_OF[p1]! + 1} and R${ROW_OF[p2]! + 1}C${COL_OF[p2]! + 1} share Z=${elimDigit}. Cells seeing pivot and both pincers can eliminate ${elimDigit}. Eliminations: ${elimStr}.`,
          },
        };
      }
    }
  }
  return null;
}

// ---- W-Wing ----
function tryWWing(grid: Grid): Step | null {
  // Collect bivalue cells
  const bivalue: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) {
      bivalue.push(cell);
    }
  }

  // For each pair of bivalue cells with the same 2 candidates
  for (let i = 0; i < bivalue.length; i++) {
    const c1 = bivalue[i]!;
    const m1 = grid.candidatesOf(c1);
    const [a, b] = digitsOf(m1);
    if (a === undefined || b === undefined) continue;

    for (let j = i + 1; j < bivalue.length; j++) {
      const c2 = bivalue[j]!;
      const m2 = grid.candidatesOf(c2);

      // Must have the same 2 candidates
      if (m1 !== m2) continue;
      // Must NOT be peers (otherwise trivial XY-Wing or naked pair)
      if (arePeers(c1, c2)) continue;

      // Look for a strong link on digit A connecting c1's "A-side" to c2's "A-side"
      // A strong link: a house where A appears in exactly 2 cells, with c1 or c2 as one of them
      const bitA = maskOf(a);
      const bitB = maskOf(b);

      for (const house of HOUSES) {
        const aCells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bitA) !== 0);
        if (aCells.length !== 2) continue;

        const [link1, link2] = aCells;
        if (link1 === undefined || link2 === undefined) continue;

        // Check if this strong link bridges c1 and c2
        // i.e. (link1 peers c1 or link1 === c1) AND (link2 peers c2 or link2 === c2) or vice versa
        let wc1 = -1; // which end of strong link sees c1
        let wc2 = -1; // which end of strong link sees c2

        if ((link1 === c1 || arePeers(link1, c1)) && (link2 === c2 || arePeers(link2, c2))) {
          wc1 = link1; wc2 = link2;
        } else if ((link2 === c1 || arePeers(link2, c1)) && (link1 === c2 || arePeers(link1, c2))) {
          wc1 = link2; wc2 = link1;
        }

        if (wc1 === -1 || wc2 === -1) continue;
        // Neither strong-link endpoint may be one of the bivalue cells themselves.
        // If link1 or link2 IS c1 or c2, the "sees-and-forces" chain becomes self-referential
        // and the W-Wing reasoning is unsound.
        if (link1 === c1 || link1 === c2 || link2 === c1 || link2 === c2) continue;

        // The strong link connects c1-side and c2-side
        // Now wc1 sees c1, wc2 sees c2 (via the strong link on A)
        // This means: if c1 is B, then wc1 is A, so wc2 is NOT A, so c2 is B
        // Therefore: B is eliminated from cells seeing both c1 and c2

        const elims = commonPeers(c1, c2).filter(
          (c) => c !== c1 && c !== c2 && grid.get(c) === 0 && (grid.candidatesOf(c) & bitB) !== 0,
        );
        if (elims.length === 0) continue;

        const elimStr = elims.map((c) => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
        const houseIdx = HOUSES.indexOf(house);
        const houseDesc = houseIdx < 9 ? `行${houseIdx + 1}` : houseIdx < 18 ? `列${houseIdx - 8}` : `宫${houseIdx - 17}`;
        const houseDescEn = houseIdx < 9 ? `Row ${houseIdx + 1}` : houseIdx < 18 ? `Column ${houseIdx - 8}` : `Box ${houseIdx - 17}`;

        return {
          strategyId: 'w-wing',
          placements: [],
          eliminations: elims.map((c) => ({ cell: c, digit: b })),
          highlights: {
            cells: [c1, c2, link1, link2],
            candidates: [
              ...digitsOf(m1).map((d) => ({ cell: c1, digit: d })),
              ...digitsOf(m2).map((d) => ({ cell: c2, digit: d })),
              { cell: link1, digit: a }, { cell: link2, digit: a },
            ],
            links: [
              { from: { cell: link1, digit: a }, to: { cell: link2, digit: a }, type: 'strong' },
            ],
          },
          explanation: {
            zh: `W翼：双值格 R${ROW_OF[c1]! + 1}C${COL_OF[c1]! + 1} 与 R${ROW_OF[c2]! + 1}C${COL_OF[c2]! + 1} 含相同候选数 {${a},${b}}，经${houseDesc}上数字 ${a} 的强链相连。能看到两双值格的格可消除候选数 ${b}。消除：${elimStr}。`,
            en: `W-Wing: Bivalue cells R${ROW_OF[c1]! + 1}C${COL_OF[c1]! + 1} and R${ROW_OF[c2]! + 1}C${COL_OF[c2]! + 1} share {${a},${b}}, bridged by a strong link on ${a} in ${houseDescEn}. Cells seeing both bivalue cells can eliminate ${b}. Eliminations: ${elimStr}.`,
          },
        };
      }
    }
  }
  return null;
}

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,
  apply: tryXYWing,
};

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 50,
  apply: tryXYZWing,
};

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 50,
  apply: tryWWing,
};
