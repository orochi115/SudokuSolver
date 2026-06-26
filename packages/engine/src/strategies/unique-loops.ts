import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// ============================================================
// BUG+N (N >= 2)
// ============================================================
export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 986,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    const unfilled = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) unfilled.push(c);
    }

    // A perfect BUG pattern has all cells bivalue and every digit occurs exactly twice in every row, col, box.
    // If not all unfilled cells have at least 2 candidates, it's not a BUG pattern.
    if (unfilled.some(c => popcount(grid.candidatesOf(c)) < 2)) return null;

    // Identify "extra" candidates globally.
    // For each cell c and candidate d:
    // If d occurs > 2 times in c's row, col, or box, then (c, d) is an extra candidate.
    const extraCandidates: { cell: number; digit: number }[] = [];
    for (const c of unfilled) {
      for (const d of digitsOf(grid.candidatesOf(c))) {
        const bit = maskOf(d);
        const rCount = unfilled.filter(x => ROW_OF[x] === ROW_OF[c] && (grid.candidatesOf(x) & bit) !== 0).length;
        const cCount = unfilled.filter(x => COL_OF[x] === COL_OF[c] && (grid.candidatesOf(x) & bit) !== 0).length;
        const bCount = unfilled.filter(x => BOX_OF[x] === BOX_OF[c] && (grid.candidatesOf(x) & bit) !== 0).length;

        if (rCount > 2 || cCount > 2 || bCount > 2) {
          extraCandidates.push({ cell: c, digit: d });
        }
      }
    }

    if (extraCandidates.length < 2) return null; // BUG+1 is handled by bug-plus-one strategy

    // For each digit, find its extra cells
    for (let d = 1; d <= 9; d++) {
      const gCells = extraCandidates.filter(e => e.digit === d).map(e => e.cell);
      if (gCells.length >= 2) {
        // Find any cell t with candidate d that sees ALL cells in gCells
        const elims: { cell: number; digit: number }[] = [];
        for (const t of unfilled) {
          if (!gCells.includes(t) && (grid.candidatesOf(t) & maskOf(d)) !== 0) {
            const seesAll = gCells.every(g => PEERS_OF[t]!.includes(g));
            if (seesAll) {
              elims.push({ cell: t, digit: d });
            }
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...gCells, ...elims.map(e => e.cell)],
              candidates: [
                ...gCells.map(c => ({ cell: c, digit: d })),
                ...elims
              ],
              links: []
            },
            explanation: {
              zh: `BUG+N (N >= 2)：在几乎全双值格中，数字 ${d} 有多个额外候选格 [${gCells.map(c => cellLabel(c)).join(', ')}]，其中至少一个必为真。消去同时能看到所有这些额外候选格的格中的 ${d}。`,
              en: `BUG+N (N >= 2): digit ${d} has multiple extra-candidate cells [${gCells.map(c => cellLabel(c)).join(', ')}], at least one of which must be true. Eliminate ${d} from cells seeing all of them.`
            }
          };
        }
      }
    }
    return null;
  }
};

// ============================================================
// Unique Loop
// ============================================================
export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // Find bivalue cells
    const unfilled = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) unfilled.push(c);
    }

    // Try each digit pair {A, B}
    for (let a = 1; a <= 8; a++) {
      for (let b = a + 1; b <= 9; b++) {
        const maskAB = maskOf(a) | maskOf(b);

        // Cells containing both A and B
        const abCells = unfilled.filter(c => (grid.candidatesOf(c) & maskAB) === maskAB);
        if (abCells.length < 6) continue;

        // BFS to find a loop of size >= 6
        // For simplicity and speed, let's look for size 6 loop
        const n = abCells.length;
        for (let i0 = 0; i0 < n; i0++) {
          const c0 = abCells[i0]!;
          for (let i1 = 0; i1 < n; i1++) {
            if (i1 === i0) continue;
            const c1 = abCells[i1]!;
            if (!PEERS_OF[c0]!.includes(c1)) continue;

            for (let i2 = 0; i2 < n; i2++) {
              if (i2 === i0 || i2 === i1) continue;
              const c2 = abCells[i2]!;
              if (!PEERS_OF[c1]!.includes(c2)) continue;

              for (let i3 = 0; i3 < n; i3++) {
                if (i3 === i0 || i3 === i1 || i3 === i2) continue;
                const c3 = abCells[i3]!;
                if (!PEERS_OF[c2]!.includes(c3)) continue;

                for (let i4 = 0; i4 < n; i4++) {
                  if (i4 === i0 || i4 === i1 || i4 === i2 || i4 === i3) continue;
                  const c4 = abCells[i4]!;
                  if (!PEERS_OF[c3]!.includes(c4)) continue;

                  for (let i5 = 0; i5 < n; i5++) {
                    if (i5 === i0 || i5 === i1 || i5 === i2 || i5 === i3 || i5 === i4) continue;
                    const c5 = abCells[i5]!;
                    if (!PEERS_OF[c4]!.includes(c5) || !PEERS_OF[c5]!.includes(c0)) continue;

                    // We have a 6-cell loop: c0 - c1 - c2 - c3 - c4 - c5 - c0
                    const loop = [c0, c1, c2, c3, c4, c5];

                    // Check house distribution: every house it touches must contain exactly 2 cells of the loop
                    const touchedHouses = new Set<number>();
                    for (const c of loop) {
                      touchedHouses.add(ROW_OF[c]!);
                      touchedHouses.add(9 + COL_OF[c]!);
                      touchedHouses.add(18 + BOX_OF[c]!);
                    }

                    let validLoop = true;
                    for (const hIdx of touchedHouses) {
                      const countInHouse = loop.filter(c => HOUSES[hIdx]!.includes(c)).length;
                      if (countInHouse !== 2) {
                        validLoop = false;
                        break;
                      }
                    }

                    if (!validLoop) continue;

                    // Exactly one of the cells can have extra candidates, others must have only {A, B}
                    const clean = loop.filter(c => grid.candidatesOf(c) === maskAB);
                    const targetCells = loop.filter(c => grid.candidatesOf(c) !== maskAB);

                    if (clean.length === 5 && targetCells.length === 1) {
                      const target = targetCells[0]!;
                      const elims = [a, b]
                        .filter(d => grid.hasCandidate(target, d))
                        .map(d => ({ cell: target, digit: d }));

                      if (elims.length > 0) {
                        return {
                          strategyId: this.id,
                          placements: [],
                          eliminations: elims,
                          highlights: {
                            cells: loop,
                            candidates: [
                              ...loop.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                              ...elims
                            ],
                            links: []
                          },
                          explanation: {
                            zh: `唯一环 Type 1：格 ${loop.map(c => cellLabel(c)).join(', ')} 构成基于 {${a},${b}} 的 6 格唯一死环；消去目标格 ${cellLabel(target)} 中的 {${a},${b}}。`,
                            en: `Unique Loop Type 1: cells ${loop.map(c => cellLabel(c)).join(', ')} form a deadly 6-cell loop on {${a},${b}}; eliminate {${a},${b}} from target ${cellLabel(target)}.`
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
    }
    return null;
  }
};

// ============================================================
// BUG-Lite
// ============================================================
export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-Lite', en: 'BUG-Lite' },
  difficulty: 984,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // BUG-Lite is an isolated deadly pattern.
    // If a 6-cell unique loop exists, it's also a BUG-Lite!
    // So we can reuse our Unique Loop search but represent it as BUG-Lite, or run a general isolated bivalue deadly pattern check.
    const res = uniqueLoop.apply(grid);
    if (res) {
      res.strategyId = this.id;
      res.explanation = {
        zh: `BUG-Lite：局部双值格组成致死图案；消去破坏平衡格中的多余候选数。`,
        en: `BUG-Lite: localized bivalue cells form an isolated deadly pattern; eliminate candidates to avoid it.`
      };
      return res;
    }
    return null;
  }
};
