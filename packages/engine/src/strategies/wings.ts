import { PEERS_OF, ROW_OF, COL_OF, HOUSES, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const xyWing: Strategy = {
  id: 'xy-wing',
  name: { zh: 'XY翼', en: 'XY-Wing' },
  difficulty: 50,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 2) continue;

      const [X, Y] = digitsOf(pivotMask);
      const peers = PEERS_OF[pivot]!;

      // Find potential pincer1 cells seeing pivot with candidates {X, Z}
      const potentialPincer1: number[] = [];
      for (const p of peers) {
        if (grid.get(p) === 0 && popcount(grid.candidatesOf(p)) === 2) {
          if (grid.hasCandidate(p, X!) && !grid.hasCandidate(p, Y!)) {
            potentialPincer1.push(p);
          }
        }
      }

      // Find potential pincer2 cells seeing pivot with candidates {Y, Z}
      const potentialPincer2: number[] = [];
      for (const p of peers) {
        if (grid.get(p) === 0 && popcount(grid.candidatesOf(p)) === 2) {
          if (grid.hasCandidate(p, Y!) && !grid.hasCandidate(p, X!)) {
            potentialPincer2.push(p);
          }
        }
      }

      for (const pincer1 of potentialPincer1) {
        const p1Mask = grid.candidatesOf(pincer1);
        const [p1_d1, p1_d2] = digitsOf(p1Mask);
        const Z = p1_d1 === X ? p1_d2! : p1_d1!;

        for (const pincer2 of potentialPincer2) {
          if (pincer1 === pincer2) continue;
          if (grid.hasCandidate(pincer2, Z)) {
            // pincer2 must have candidates {Y, Z}
            // Find cells seeing both pincer1 and pincer2
            const eliminations: CellDigit[] = [];
            const commonPeers = PEERS_OF[pincer1]!.filter(p => PEERS_OF[pincer2]!.includes(p));

            for (const p of commonPeers) {
              if (grid.hasCandidate(p, Z)) {
                eliminations.push({ cell: p, digit: Z });
              }
            }

            if (eliminations.length > 0) {
              const r_pivot = ROW_OF[pivot]! + 1;
              const c_pivot = COL_OF[pivot]! + 1;
              const r_p1 = ROW_OF[pincer1]! + 1;
              const c_p1 = COL_OF[pincer1]! + 1;
              const r_p2 = ROW_OF[pincer2]! + 1;
              const c_p2 = COL_OF[pincer2]! + 1;

              const links: Link[] = [
                { from: { cell: pincer1, digit: X! }, to: { cell: pivot, digit: X! }, type: 'weak' },
                { from: { cell: pivot, digit: Y! }, to: { cell: pincer2, digit: Y! }, type: 'weak' }
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [pivot, pincer1, pincer2],
                  candidates: [
                    { cell: pivot, digit: X! },
                    { cell: pivot, digit: Y! },
                    { cell: pincer1, digit: X! },
                    { cell: pincer1, digit: Z },
                    { cell: pincer2, digit: Y! },
                    { cell: pincer2, digit: Z }
                  ],
                  links
                },
                explanation: {
                  zh: `找到 XY翼（轴格 R${r_pivot}C${c_pivot} 候选数 ${X},${Y}，翼格 R${r_p1}C${c_p1}（候选数 ${X},${Z}）和 R${r_p2}C${c_p2}（候选数 ${Y},${Z}）），排除能同时看到两个翼格的格子中的候选数 ${Z}。`,
                  en: `Found XY-Wing (Pivot R${r_pivot}C${c_pivot} with ${X},${Y}, pincers R${r_p1}C${c_p1} with ${X},${Z} and R${r_p2}C${c_p2} with ${Y},${Z}), so ${Z} can be eliminated from cells seeing both pincers.`,
                }
              };
            }
          }
        }
      }
    }
    return null;
  }
};

export const xyzWing: Strategy = {
  id: 'xyz-wing',
  name: { zh: 'XYZ翼', en: 'XYZ-Wing' },
  difficulty: 51,

  apply(grid: Grid): Step | null {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (grid.get(pivot) !== 0) continue;
      const pivotMask = grid.candidatesOf(pivot);
      if (popcount(pivotMask) !== 3) continue;

      const [X, Y, Z_candidate] = digitsOf(pivotMask);
      const peers = PEERS_OF[pivot]!;

      // Pivot has three candidates. Any of them can be the shared pincer candidate 'Z'.
      const candidates = [X!, Y!, Z_candidate!];
      for (let zIdx = 0; zIdx < 3; zIdx++) {
        const Z = candidates[zIdx]!;
        const other = candidates.filter((_, idx) => idx !== zIdx);
        const p1_fixed = other[0]!;
        const p2_fixed = other[1]!;

        // Pincer 1 must see pivot, have size 2, and candidates {p1_fixed, Z}
        const potentialPincer1 = peers.filter(p => {
          if (grid.get(p) !== 0) return false;
          const mask = grid.candidatesOf(p);
          return popcount(mask) === 2 && grid.hasCandidate(p, p1_fixed) && grid.hasCandidate(p, Z);
        });

        // Pincer 2 must see pivot, have size 2, and candidates {p2_fixed, Z}
        const potentialPincer2 = peers.filter(p => {
          if (grid.get(p) !== 0) return false;
          const mask = grid.candidatesOf(p);
          return popcount(mask) === 2 && grid.hasCandidate(p, p2_fixed) && grid.hasCandidate(p, Z);
        });

        for (const pincer1 of potentialPincer1) {
          for (const pincer2 of potentialPincer2) {
            if (pincer1 === pincer2) continue;

            const eliminations: CellDigit[] = [];
            const commonPeers = peers.filter(p => PEERS_OF[pincer1]!.includes(p) && PEERS_OF[pincer2]!.includes(p));

            for (const p of commonPeers) {
              if (grid.hasCandidate(p, Z)) {
                eliminations.push({ cell: p, digit: Z });
              }
            }

            if (eliminations.length > 0) {
              const r_pivot = ROW_OF[pivot]! + 1;
              const c_pivot = COL_OF[pivot]! + 1;
              const r_p1 = ROW_OF[pincer1]! + 1;
              const c_p1 = COL_OF[pincer1]! + 1;
              const r_p2 = ROW_OF[pincer2]! + 1;
              const c_p2 = COL_OF[pincer2]! + 1;

              const links: Link[] = [
                { from: { cell: pincer1, digit: p1_fixed }, to: { cell: pivot, digit: p1_fixed }, type: 'weak' },
                { from: { cell: pivot, digit: p2_fixed }, to: { cell: pincer2, digit: p2_fixed }, type: 'weak' }
              ];

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [pivot, pincer1, pincer2],
                  candidates: [
                    { cell: pivot, digit: X! },
                    { cell: pivot, digit: Y! },
                    { cell: pivot, digit: Z_candidate! },
                    { cell: pincer1, digit: p1_fixed },
                    { cell: pincer1, digit: Z },
                    { cell: pincer2, digit: p2_fixed },
                    { cell: pincer2, digit: Z }
                  ],
                  links
                },
                explanation: {
                  zh: `找到 XYZ翼（轴格 R${r_pivot}C${c_pivot} 候选数 ${X},${Y},${Z_candidate}，翼格 R${r_p1}C${c_p1}（候选数 ${p1_fixed},${Z}）和 R${r_p2}C${c_p2}（候选数 ${p2_fixed},${Z}）），排除能同时看到轴格和两个翼格的格子中的候选数 ${Z}。`,
                  en: `Found XYZ-Wing (Pivot R${r_pivot}C${c_pivot} with ${X},${Y},${Z_candidate}, pincers R${r_p1}C${c_p1} with ${p1_fixed},${Z} and R${r_p2}C${c_p2} with ${p2_fixed},${Z}), so ${Z} can be eliminated from cells seeing pivot and both pincers.`,
                }
              };
            }
          }
        }
      }
    }
    return null;
  }
};

export const wWing: Strategy = {
  id: 'w-wing',
  name: { zh: 'W翼', en: 'W-Wing' },
  difficulty: 52,

  apply(grid: Grid): Step | null {
    // Collect all bivalue cells
    const bivalues: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (grid.get(i) === 0 && popcount(grid.candidatesOf(i)) === 2) {
        bivalues.push(i);
      }
    }

    for (let i = 0; i < bivalues.length; i++) {
      for (let j = i + 1; j < bivalues.length; j++) {
        const cellA = bivalues[i]!;
        const cellB = bivalues[j]!;

        // Must not see each other
        if (PEERS_OF[cellA]!.includes(cellB)) continue;

        const maskA = grid.candidatesOf(cellA);
        const maskB = grid.candidatesOf(cellB);
        if (maskA !== maskB) continue;

        const [X, Y] = digitsOf(maskA);

        // Try both options: X is the bridge digit, Y is the elimination digit (and vice versa)
        const options = [
          { bridgeDigit: X!, elimDigit: Y! },
          { bridgeDigit: Y!, elimDigit: X! }
        ];

        for (const option of options) {
          const { bridgeDigit, elimDigit } = option;

          // Look for a strong link on bridgeDigit in any house (ROW, COL, BOX)
          for (let h = 0; h < HOUSES.length; h++) {
            const house = HOUSES[h]!;
            const houseCandidates = house.filter(c => grid.hasCandidate(c, bridgeDigit));

            if (houseCandidates.length === 2) {
              const [bridge1, bridge2] = houseCandidates;
              
              // cellA must see bridge1 (or be bridge1? No, cellA is not in the houseCandidates since it's bivalue, wait, actually cellA could be bridge1, but we required cellA !== bridge1 and cellB !== bridge2)
              // Let's check both configurations: cellA sees bridge1 & cellB sees bridge2 OR cellA sees bridge2 & cellB sees bridge1
              const configs = [
                { b1: bridge1!, b2: bridge2! },
                { b1: bridge2!, b2: bridge1! }
              ];

              for (const config of configs) {
                const { b1, b2 } = config;
                if (cellA !== b1 && cellB !== b2) {
                  const cellASeesB1 = PEERS_OF[cellA]!.includes(b1);
                  const cellBSeesB2 = PEERS_OF[cellB]!.includes(b2);

                  if (cellASeesB1 && cellBSeesB2) {
                    // We have a W-Wing!
                    // Y can be eliminated from common peers of cellA and cellB
                    const eliminations: CellDigit[] = [];
                    const commonPeers = PEERS_OF[cellA]!.filter(p => PEERS_OF[cellB]!.includes(p));

                    for (const p of commonPeers) {
                      if (grid.hasCandidate(p, elimDigit)) {
                        eliminations.push({ cell: p, digit: elimDigit });
                      }
                    }

                    if (eliminations.length > 0) {
                      const rA = ROW_OF[cellA]! + 1;
                      const cA = COL_OF[cellA]! + 1;
                      const rB = ROW_OF[cellB]! + 1;
                      const cB = COL_OF[cellB]! + 1;
                      const rb1 = ROW_OF[b1]! + 1;
                      const cb1 = COL_OF[b1]! + 1;
                      const rb2 = ROW_OF[b2]! + 1;
                      const cb2 = COL_OF[b2]! + 1;

                      const links: Link[] = [
                        { from: { cell: cellA, digit: bridgeDigit }, to: { cell: b1, digit: bridgeDigit }, type: 'weak' },
                        { from: { cell: b1, digit: bridgeDigit }, to: { cell: b2, digit: bridgeDigit }, type: 'strong' },
                        { from: { cell: b2, digit: bridgeDigit }, to: { cell: cellB, digit: bridgeDigit }, type: 'weak' }
                      ];

                      return {
                        strategyId: this.id,
                        placements: [],
                        eliminations,
                        highlights: {
                          cells: [cellA, cellB, b1, b2],
                          candidates: [
                            { cell: cellA, digit: bridgeDigit },
                            { cell: cellA, digit: elimDigit },
                            { cell: cellB, digit: bridgeDigit },
                            { cell: cellB, digit: elimDigit },
                            { cell: b1, digit: bridgeDigit },
                            { cell: b2, digit: bridgeDigit }
                          ],
                          links
                        },
                        explanation: {
                          zh: `找到 W翼（双值格 R${rA}C${cA} 和 R${rB}C${cB} 均为 ${X},${Y}，通过强链 R${rb1}C${cb1} == R${rb2}C${cb2}（数字 ${bridgeDigit}）相连），排除能同时看到这两个双值格的格子中的候选数 ${elimDigit}。`,
                          en: `Found W-Wing (bivalue cells R${rA}C${cA} and R${rB}C${cB} both containing ${X},${Y}, linked by strong link R${rb1}C${cb1} == R${rb2}C${cb2} on digit ${bridgeDigit}), so ${elimDigit} can be eliminated from cells seeing both bivalue cells.`,
                        }
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
};
