import { CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, UNITS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const GIVENS_REGISTRY = new WeakMap<Uint8Array, Set<number>>();

export function getGivens(grid: Grid): Set<number> {
  let givens = GIVENS_REGISTRY.get(grid.values);
  if (!givens) {
    givens = new Set<number>();
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0) {
        givens.add(c);
      }
    }
    GIVENS_REGISTRY.set(grid.values, givens);
  }
  return givens;
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

function getCommonHouses(c1: number, c2: number): number[] {
  const common = [];
  const u1 = UNITS_OF[c1]!;
  const u2 = UNITS_OF[c2]!;
  for (const h of u1) {
    if (u2.includes(h)) {
      common.push(h);
    }
  }
  return common;
}

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 945,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const givens = getGivens(grid);

    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const solved = cells.filter((c) => grid.get(c) !== 0);
      const unsolved = cells.filter((c) => grid.get(c) === 0);

      if (solved.length !== 3 || unsolved.length !== 1) continue;

      // Ensure none of the solved corners is a given
      if (solved.some((c) => givens.has(c))) continue;

      const tgt = unsolved[0]!;

      // Identify coordinates of tgt
      const tgt_r = ROW_OF[tgt]!;
      const tgt_c = COL_OF[tgt]!;

      // Identify diag, row, col peers in cells
      const c_diag = cells.find((c) => ROW_OF[c] !== tgt_r && COL_OF[c] !== tgt_c)!;
      const c_row = cells.find((c) => ROW_OF[c] === tgt_r && COL_OF[c] !== tgt_c)!;
      const c_col = cells.find((c) => ROW_OF[c] !== tgt_r && COL_OF[c] === tgt_c)!;

      const val_diag = grid.get(c_diag);
      const val_row = grid.get(c_row);
      const val_col = grid.get(c_col);

      if (val_row !== val_col || val_row === val_diag) continue;

      const a = val_diag; // completing UR digit
      const b = val_row;

      if (grid.hasCandidate(tgt, a) && popcount(grid.candidatesOf(tgt)) > 1) {
        return {
          strategyId: this.id,
          placements: [],
          eliminations: [{ cell: tgt, digit: a }],
          highlights: {
            cells,
            candidates: [
              ...solved.map((c) => ({ cell: c, digit: grid.get(c) })),
              ...digitsOf(grid.candidatesOf(tgt)).map((d) => ({ cell: tgt, digit: d })),
            ],
            links: [],
          },
          explanation: {
            zh: `可避免矩形 Type 1：在格 {${cells.map((c) => cellLabel(c)).join(', ')}}，三个已填格均为非预设提示，其值形成可避免矩形结构；消去未填格 ${cellLabel(tgt)} 处的完成候选数 ${a}。`,
            en: `Avoidable Rectangle Type 1: in cells {${cells.map((c) => cellLabel(c)).join(', ')}}, three resolved non-given cells form an avoidable rectangle; eliminate completing candidate ${a} from ${cellLabel(tgt)}.`,
          },
        };
      }
    }

    return null;
  },
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 946,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const givens = getGivens(grid);

    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const solved = cells.filter((c) => grid.get(c) !== 0);
      const unsolved = cells.filter((c) => grid.get(c) === 0);

      if (solved.length !== 2 || unsolved.length !== 2) continue;
      if (solved.some((c) => givens.has(c))) continue;

      const [s1, s2] = solved as [number, number];
      const [u1, u2] = unsolved as [number, number];

      const val1 = grid.get(s1);
      const val2 = grid.get(s2);
      if (val1 === val2) continue;

      const a = val1;
      const b = val2;

      const mask1 = grid.candidatesOf(u1);
      const mask2 = grid.candidatesOf(u2);

      const urMask = maskOf(a) | maskOf(b);
      if ((mask1 & urMask) !== urMask || (mask2 & urMask) !== urMask) continue;

      const extra1 = mask1 & ~urMask;
      const extra2 = mask2 & ~urMask;

      if (popcount(extra1) === 1 && popcount(extra2) === 1 && extra1 === extra2) {
        const z = digitsOf(extra1)[0]!;

        const peersU1 = new Set(PEERS_OF[u1]!);
        const elims: { cell: number; digit: number }[] = [];

        for (const t of PEERS_OF[u2]!) {
          if (!peersU1.has(t)) continue;
          if (cells.includes(t)) continue;
          if (grid.hasCandidate(t, z)) {
            elims.push({ cell: t, digit: z });
          }
        }

        if (elims.length > 0) {
          return {
            strategyId: this.id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...cells, ...elims.map((e) => e.cell)],
              candidates: [
                ...solved.map((c) => ({ cell: c, digit: grid.get(c) })),
                ...unsolved.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `可避免矩形 Type 2：在格 {${cells.map((c) => cellLabel(c)).join(', ')}}，两个底层格均含相同额外候选数 ${z}；消去共同可见格中的 ${z}。`,
              en: `Avoidable Rectangle Type 2: in cells {${cells.map((c) => cellLabel(c)).join(', ')}}, both unsolved cells have identical extra candidate ${z}; eliminate ${z} from their common peers.`,
            },
          };
        }
      }
    }

    return null;
  },
};

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 947,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const givens = getGivens(grid);

    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const solved = cells.filter((c) => grid.get(c) !== 0);
      const unsolved = cells.filter((c) => grid.get(c) === 0);

      if (solved.length !== 2 || unsolved.length !== 2) continue;
      if (solved.some((c) => givens.has(c))) continue;

      const [s1, s2] = solved as [number, number];
      const [u1, u2] = unsolved as [number, number];

      const val1 = grid.get(s1);
      const val2 = grid.get(s2);
      if (val1 === val2) continue;

      const a = val1;
      const b = val2;

      const mask1 = grid.candidatesOf(u1);
      const mask2 = grid.candidatesOf(u2);

      const urMask = maskOf(a) | maskOf(b);
      if ((mask1 & urMask) !== urMask || (mask2 & urMask) !== urMask) continue;

      const extraMask = (mask1 | mask2) & ~urMask;
      if (popcount(extraMask) === 0) continue;

      const extraDigits = digitsOf(extraMask);
      const k = extraDigits.length;

      // Try each common house of u1 and u2 to find a Naked Subset
      for (const houseIdx of getCommonHouses(u1, u2)) {
        const house = HOUSES[houseIdx]!;
        const otherHouseCells = house.filter((c) => grid.get(c) === 0 && !cells.includes(c));

        // Find subset of other cells that have candidates ⊆ extraMask
        const subset = otherHouseCells.filter((c) => (grid.candidatesOf(c) & ~extraMask) === 0);

        if (subset.length === k - 1) {
          // Found a Naked Subset! Eliminate extra digits from the remaining cells of the house
          const elims: { cell: number; digit: number }[] = [];
          for (const c of otherHouseCells) {
            if (subset.includes(c)) continue;
            const cands = grid.candidatesOf(c);
            for (const d of extraDigits) {
              if (cands & maskOf(d)) {
                elims.push({ cell: c, digit: d });
              }
            }
          }

          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...cells, ...subset, ...elims.map((e) => e.cell)],
                candidates: [
                  ...solved.map((c) => ({ cell: c, digit: grid.get(c) })),
                  ...unsolved.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...subset.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `可避免矩形 Type 3：在格 {${cells.map((c) => cellLabel(c)).join(', ')}}，未填格形成带额外候选的子集并与同单元格组成裸数组；消去单元中其他格的对应候选。`,
                en: `Avoidable Rectangle Type 3: in cells {${cells.map((c) => cellLabel(c)).join(', ')}}, unsolved cells and peers form a Naked Subset; eliminate subset candidates from other house cells.`,
              },
            };
          }
        }
      }
    }

    return null;
  },
};

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 948,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const givens = getGivens(grid);

    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const solved = cells.filter((c) => grid.get(c) !== 0);
      const unsolved = cells.filter((c) => grid.get(c) === 0);

      if (solved.length !== 2 || unsolved.length !== 2) continue;
      if (solved.some((c) => givens.has(c))) continue;

      const [s1, s2] = solved as [number, number];
      const [u1, u2] = unsolved as [number, number];

      const val1 = grid.get(s1);
      const val2 = grid.get(s2);
      if (val1 === val2) continue;

      const a = val1;
      const b = val2;

      const mask1 = grid.candidatesOf(u1);
      const mask2 = grid.candidatesOf(u2);

      const urMask = maskOf(a) | maskOf(b);
      if ((mask1 & urMask) !== urMask || (mask2 & urMask) !== urMask) continue;

      for (const [locked, elim] of [[a, b], [b, a]] as [number, number][]) {
        const lockedBit = maskOf(locked);

        for (const houseIdx of getCommonHouses(u1, u2)) {
          const house = HOUSES[houseIdx]!;
          const lockedInHouse = house.filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0,
          );

          if (lockedInHouse.length === 2 && lockedInHouse.includes(u1) && lockedInHouse.includes(u2)) {
            // Digit `locked` is locked in u1 and u2. Eliminate `elim` from u1 and u2.
            const elims: { cell: number; digit: number }[] = [];
            if (grid.hasCandidate(u1, elim)) elims.push({ cell: u1, digit: elim });
            if (grid.hasCandidate(u2, elim)) elims.push({ cell: u2, digit: elim });

            if (elims.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells,
                  candidates: [
                    ...solved.map((c) => ({ cell: c, digit: grid.get(c) })),
                    ...unsolved.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `可避免矩形 Type 4：在格 {${cells.map((c) => cellLabel(c)).join(', ')}}，候选数 ${locked} 被锁定在未填格中；消去两格中的另一个候选数 ${elim}。`,
                  en: `Avoidable Rectangle Type 4: in cells {${cells.map((c) => cellLabel(c)).join(', ')}}, candidate ${locked} is locked in unsolved cells; eliminate candidate ${elim} from both cells.`,
                },
              };
            }
          }
        }
      }
    }

    return null;
  },
};
