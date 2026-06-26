import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

// Generate combinations of size k from list
function* getCombinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of getCombinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* getCombinations(rest, k);
}

// Pre-calculate all line-box intersections (54 total)
interface Intersection {
  line: number; // 0..17 (rows and cols)
  box: number;  // 0..8
  cells: number[];
  lineOff: number[];
  boxOff: number[];
}

const INTERSECTIONS: Intersection[] = [];
for (let b = 0; b < 9; b++) {
  const boxCells = HOUSES[18 + b]!;
  for (let l = 0; l < 18; l++) {
    const lineCells = HOUSES[l]!;
    const shared = boxCells.filter(c => lineCells.includes(c));
    if (shared.length === 3) {
      const lineOff = lineCells.filter(c => !shared.includes(c));
      const boxOff = boxCells.filter(c => !shared.includes(c));
      INTERSECTIONS.push({
        line: l,
        box: b,
        cells: shared,
        lineOff,
        boxOff
      });
    }
  }
}

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // Digits combinations of size 2 and 3
    const digitSets: number[][] = [];
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const combo of getCombinations(digits, 2)) digitSets.push(combo);
    for (const combo of getCombinations(digits, 3)) digitSets.push(combo);

    for (const inter of INTERSECTIONS) {
      const { lineOff, boxOff, cells: shared } = inter;

      const lineEmpty = lineOff.filter(c => grid.get(c) === 0);
      const boxEmpty = boxOff.filter(c => grid.get(c) === 0);

      for (const S of digitSets) {
        const N = S.length;
        const maskS = S.reduce((m, d) => m | maskOf(d), 0);

        // Find L_set of size N-1 in lineEmpty with candidates ⊆ S
        const lSets: number[][] = [];
        for (const combo of getCombinations(lineEmpty, N - 1)) {
          if (combo.every(c => (grid.candidatesOf(c) & ~maskS) === 0)) {
            lSets.push(combo);
          }
        }

        // Find B_set of size N-1 in boxEmpty with candidates ⊆ S
        const bSets: number[][] = [];
        for (const combo of getCombinations(boxEmpty, N - 1)) {
          if (combo.every(c => (grid.candidatesOf(c) & ~maskS) === 0)) {
            bSets.push(combo);
          }
        }

        if (lSets.length === 0 || bSets.length === 0) continue;

        for (const L_set of lSets) {
          for (const B_set of bSets) {
            const elims: { cell: number; digit: number }[] = [];

            // 1. Box-side fire: every other cell of lineOff (outside L_set) contains no digit of S
            const otherLineCells = lineEmpty.filter(c => !L_set.includes(c));
            const isBoxSideFire = otherLineCells.every(c => (grid.candidatesOf(c) & maskS) === 0);

            if (isBoxSideFire) {
              // Eliminate S from boxOff cells outside B_set
              const otherBoxCells = boxEmpty.filter(c => !B_set.includes(c));
              for (const c of otherBoxCells) {
                for (const d of S) {
                  if (grid.hasCandidate(c, d)) {
                    elims.push({ cell: c, digit: d });
                  }
                }
              }
              // Eliminate non-S candidates from L_set cells (since they must act as a naked set of S)
              for (const c of L_set) {
                const m = grid.candidatesOf(c);
                const nonSDigits = digitsOf(m & ~maskS);
                for (const d of nonSDigits) {
                  elims.push({ cell: c, digit: d });
                }
              }
            }

            // 2. Line-side fire: every other cell of boxOff (outside B_set) contains no digit of S
            const otherBoxCells = boxEmpty.filter(c => !B_set.includes(c));
            const isLineSideFire = otherBoxCells.every(c => (grid.candidatesOf(c) & maskS) === 0);

            if (isLineSideFire) {
              // Eliminate S from lineOff cells outside L_set
              const otherLineCells = lineEmpty.filter(c => !L_set.includes(c));
              for (const c of otherLineCells) {
                for (const d of S) {
                  if (grid.hasCandidate(c, d)) {
                    elims.push({ cell: c, digit: d });
                  }
                }
              }
              // Eliminate non-S candidates from B_set cells
              for (const c of B_set) {
                const m = grid.candidatesOf(c);
                const nonSDigits = digitsOf(m & ~maskS);
                for (const d of nonSDigits) {
                  elims.push({ cell: c, digit: d });
                }
              }
            }

            if (elims.length > 0) {
              // Deduplicate elims
              const seen = new Set<string>();
              const uniqElims = elims.filter(e => {
                const k = `${e.cell}:${e.digit}`;
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });

              if (uniqElims.length > 0) {
                const allPatternCells = [...L_set, ...B_set, ...shared];
                return {
                  strategyId: this.id,
                  placements: [],
                  eliminations: uniqElims,
                  highlights: {
                    cells: [...new Set([...allPatternCells, ...uniqElims.map(e => e.cell)])],
                    candidates: [
                      ...allPatternCells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))),
                      ...uniqElims
                    ],
                    links: []
                  },
                  explanation: {
                    zh: `弯曲集（几乎锁定对/三）：行列 ${cellLabel(L_set[0]!)} 弯曲连接宫内 ${cellLabel(B_set[0]!)} 的几乎锁定候选集（数字 {${S.join(',')}}）；消去由于锁定关系产生矛盾区域中的候选。`,
                    en: `Bent Sets (ALC): cells ${L_set.map(c => cellLabel(c)).join(',')} and ${B_set.map(c => cellLabel(c)).join(',')} form Almost Locked Candidates on {${S.join(',')}}; eliminate candidates blocked by the lock.`
                  }
                };
              }
            }
          }
        }
      }
    }
    return null;
  }
};
