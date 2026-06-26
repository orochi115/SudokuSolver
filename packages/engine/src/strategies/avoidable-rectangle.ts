import {
  CELLS, ROWS, COLS, BOXES, HOUSES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;

          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

// Generate combinations of size k
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 945,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];

      // Try each of the 4 cells as the single unfilled cell
      for (let i = 0; i < 4; i++) {
        const target = cells[i]!;
        if (grid.get(target) !== 0) continue;

        // The other 3 cells must be solved and non-given
        const solved = cells.filter(c => c !== target);
        if (!solved.every(c => grid.get(c) !== 0 && !grid.isGiven[c])) continue;

        // Find the coordinates of the 4 corners relative to the target
        // c11, c12, c21, c22
        // If target is c11, then c12 and c21 are in the same row/col as target, and c22 is diagonal
        // Let's identify the diagonal cell
        const diagonal = cells.find(c => ROW_OF[c] !== ROW_OF[target] && COL_OF[c] !== COL_OF[target])!;
        const peers = cells.filter(c => c !== target && c !== diagonal);

        const vDiag = grid.get(diagonal);
        const vPeer0 = grid.get(peers[0]!);
        const vPeer1 = grid.get(peers[1]!);

        if (vPeer0 !== vPeer1) continue;
        const b = vPeer0;
        const a = vDiag;
        if (a === b) continue;

        // Candidate a completes the deadly pattern. Eliminate a from target!
        if (grid.hasCandidate(target, a)) {
          const elims = [{ cell: target, digit: a }];
          const placements = popcount(grid.candidatesOf(target) & ~maskOf(a)) === 1
            ? [{ cell: target, digit: digitsOf(grid.candidatesOf(target) & ~maskOf(a))[0]! }]
            : [];

          return {
            strategyId: this.id,
            placements,
            eliminations: elims,
            highlights: {
              cells,
              candidates: [
                ...solved.map(c => ({ cell: c, digit: grid.get(c) })),
                { cell: target, digit: a }
              ],
              links: []
            },
            explanation: {
              zh: `可避免矩形 Type 1：在格 ${cells.map(c => cellLabel(c)).join(', ')} 中，三格已填入 {${b},${a}} 且均非原始已知数；若最后一格 ${cellLabel(target)} 也填入 ${a} 则产生双解。消去该格的候选数 ${a}。`,
              en: `Avoidable Rectangle Type 1: three solved non-given corners form a deadly pattern on {${b},${a}}; eliminate completing candidate ${a} from target ${cellLabel(target)}.`
            }
          };
        }
      }
    }
    return null;
  }
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 946,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];

      // Two diagonal cells must be solved and non-given, other two unfilled
      const solvedPairs = [
        [[c12, c21], [c11, c22]],
        [[c11, c22], [c12, c21]]
      ];

      for (const [sPair, uPair] of solvedPairs) {
        const [s1, s2] = sPair as [number, number];
        const [u1, u2] = uPair as [number, number];

        if (grid.get(s1) === 0 || grid.get(s2) === 0) continue;
        if (grid.get(u1) !== 0 || grid.get(u2) !== 0) continue;

        if (grid.isGiven[s1] || grid.isGiven[s2]) continue;

        const b = grid.get(s1);
        if (grid.get(s2) !== b) continue;

        // We need both u1 and u2 to contain a (where a !== b) and share exactly one extra candidate c
        // Let's loop over possible a !== b
        for (let a = 1; a <= 9; a++) {
          if (a === b) continue;
          if (grid.hasCandidate(u1, a) && grid.hasCandidate(u2, a)) {
            const extra1 = digitsOf(grid.candidatesOf(u1) & ~maskOf(a));
            const extra2 = digitsOf(grid.candidatesOf(u2) & ~maskOf(a));

            if (extra1.length === 1 && extra2.length === 1 && extra1[0] === extra2[0]) {
              const c = extra1[0]!;
              if (c !== a && c !== b) {
                // Eliminate c from common peers of u1 and u2
                const elims: { cell: number; digit: number }[] = [];
                for (let t = 0; t < CELLS; t++) {
                  if (grid.get(t) === 0 && t !== u1 && t !== u2 && grid.hasCandidate(t, c)) {
                    if (PEERS_OF[u1]!.includes(t) && PEERS_OF[u2]!.includes(t)) {
                      elims.push({ cell: t, digit: c });
                    }
                  }
                }

                if (elims.length > 0) {
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells,
                      candidates: [
                        { cell: s1, digit: b },
                        { cell: s2, digit: b },
                        { cell: u1, digit: a },
                        { cell: u1, digit: c },
                        { cell: u2, digit: a },
                        { cell: u2, digit: c },
                        ...elims
                      ],
                      links: []
                    },
                    explanation: {
                      zh: `可避免矩形 Type 2：在格 ${cells.map(x => cellLabel(x)).join(', ')} 中，两格已填 ${b}（非已知），另两空格均包含主数 ${a} 且共享唯一额外数 ${c}；消去两空格公共可见格中的 ${c}。`,
                      en: `Avoidable Rectangle Type 2: solved corners on ${b}, bivalue candidates on {${a},${c}}; eliminate extra candidate ${c} from common peers of ${cellLabel(u1)} and ${cellLabel(u2)}.`
                    }
                  };
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

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 947,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];

      const solvedPairs = [
        [[c12, c21], [c11, c22]],
        [[c11, c22], [c12, c21]]
      ];

      for (const [sPair, uPair] of solvedPairs) {
        const [s1, s2] = sPair as [number, number];
        const [u1, u2] = uPair as [number, number];

        if (grid.get(s1) === 0 || grid.get(s2) === 0) continue;
        if (grid.get(u1) !== 0 || grid.get(u2) !== 0) continue;

        if (grid.isGiven[s1] || grid.isGiven[s2]) continue;

        const b = grid.get(s1);
        if (grid.get(s2) !== b) continue;

        for (let a = 1; a <= 9; a++) {
          if (a === b) continue;
          if (grid.hasCandidate(u1, a) && grid.hasCandidate(u2, a)) {
            const extra1 = digitsOf(grid.candidatesOf(u1) & ~maskOf(a));
            const extra2 = digitsOf(grid.candidatesOf(u2) & ~maskOf(a));

            const extraSet = new Set([...extra1, ...extra2]);
            const E = [...extraSet];
            const K = E.length;

            if (K >= 2 && K <= 3) {
              // Look in shared houses of u1 and u2 (can be row, col, or box)
              const sharedHouses = [];
              if (ROW_OF[u1] === ROW_OF[u2]) sharedHouses.push(ROW_OF[u1]!);
              if (COL_OF[u1] === COL_OF[u2]) sharedHouses.push(9 + COL_OF[u1]!);
              if (BOX_OF[u1] === BOX_OF[u2]) sharedHouses.push(18 + BOX_OF[u1]!);

              for (const hIdx of sharedHouses) {
                const hCells = HOUSES[hIdx]!;
                const otherCells = hCells.filter(c =>
                  c !== u1 && c !== u2 && grid.get(c) === 0
                );

                // Find subsets of size K-2 from otherCells whose candidates ⊆ E
                const candidatesInE = otherCells.filter(c =>
                  (grid.candidatesOf(c) & ~E.reduce((m, d) => m | maskOf(d), 0)) === 0
                );

                if (candidatesInE.length >= K - 2) {
                  for (const sub of combinations(candidatesInE, K - 2)) {
                    const subsetCells = [u1, u2, ...sub];
                    // The digits in E can be eliminated from other cells in H
                    const elims: { cell: number; digit: number }[] = [];
                    for (const c of otherCells) {
                      if (!sub.includes(c)) {
                        for (const d of E) {
                          if (grid.hasCandidate(c, d)) {
                            elims.push({ cell: c, digit: d });
                          }
                        }
                      }
                    }

                    if (elims.length > 0) {
                      return {
                        strategyId: this.id,
                        placements: [],
                        eliminations: elims,
                        highlights: {
                          cells: [...cells, ...subsetCells, ...elims.map(e => e.cell)],
                          candidates: [
                            { cell: s1, digit: b },
                            { cell: s2, digit: b },
                            ...subsetCells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                            ...elims
                          ],
                          links: []
                        },
                        explanation: {
                          zh: `可避免矩形 Type 3：两已填 ${b}，两空格共享候选数 ${a}，额外候选 [${E.join(',')}] 与区域内其他格构成显性数组；消去区域内其他格中的额外候选数。`,
                          en: `Avoidable Rectangle Type 3: solved corners on ${b}, extra candidates [${E.join(',')}] form a naked subset in unit; eliminate them from other cells.`
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

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 948,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];

      const solvedPairs = [
        [[c12, c21], [c11, c22]],
        [[c11, c22], [c12, c21]]
      ];

      for (const [sPair, uPair] of solvedPairs) {
        const [s1, s2] = sPair as [number, number];
        const [u1, u2] = uPair as [number, number];

        if (grid.get(s1) === 0 || grid.get(s2) === 0) continue;
        if (grid.get(u1) !== 0 || grid.get(u2) !== 0) continue;

        if (grid.isGiven[s1] || grid.isGiven[s2]) continue;

        const b = grid.get(s1);
        if (grid.get(s2) !== b) continue;

        for (let a = 1; a <= 9; a++) {
          if (a === b) continue;
          if (grid.hasCandidate(u1, a) && grid.hasCandidate(u2, a)) {
            // One of them must have exactly candidates {a, b}
            const u1Cands = grid.candidatesOf(u1);
            const maskAB = maskOf(a) | maskOf(b);

            const u1IsAB = u1Cands === maskAB;
            const u2IsAB = grid.candidatesOf(u2) === maskAB;

            if (u1IsAB || u2IsAB) {
              const exactAB = u1IsAB ? u1 : u2;
              const otherU = u1IsAB ? u2 : u1;

              // Shared houses
              const sharedHouses = [];
              if (ROW_OF[u1] === ROW_OF[u2]) sharedHouses.push(ROW_OF[u1]!);
              if (COL_OF[u1] === COL_OF[u2]) sharedHouses.push(9 + COL_OF[u1]!);
              if (BOX_OF[u1] === BOX_OF[u2]) sharedHouses.push(18 + BOX_OF[u1]!);

              for (const hIdx of sharedHouses) {
                const hCells = HOUSES[hIdx]!;
                // Check if digit a is a conjugate pair on u1 and u2 in this house
                const otherA = hCells.filter(c =>
                  c !== u1 && c !== u2 && grid.get(c) === 0 && (grid.candidatesOf(c) & maskOf(a)) !== 0
                );

                if (otherA.length === 0) {
                  // Digit a is a conjugate pair on u1 and u2.
                  // Eliminate b from otherU!
                  if (grid.hasCandidate(otherU, b)) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: [{ cell: otherU, digit: b }],
                      highlights: {
                        cells,
                        candidates: [
                          { cell: s1, digit: b },
                          { cell: s2, digit: b },
                          { cell: u1, digit: a },
                          { cell: u2, digit: a },
                          { cell: exactAB, digit: b },
                          { cell: otherU, digit: b }
                        ],
                        links: []
                      },
                      explanation: {
                        zh: `可避免矩形 Type 4：两已填 ${b}，空格 ${cellLabel(exactAB)} 仅含 {${a},${b}}，且数字 ${a} 在该区域内仅能填入两空格；消去另一空格 ${cellLabel(otherU)} 中的 ${b}。`,
                        en: `Avoidable Rectangle Type 4: solved corners on ${b}, cell ${cellLabel(exactAB)} is exactly {${a},${b}}, and ${a} is locked to the two empty corners; eliminate ${b} from ${cellLabel(otherU)}.`
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
    return null;
  }
};
