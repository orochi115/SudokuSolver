import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形（2×3）', en: 'Extended Unique Rectangle (2×3)' },
  difficulty: 980,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let r1 = 0; r1 < 7; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        for (let r3 = r2 + 1; r3 < 9; r3++) {
          for (let c1 = 0; c1 < 7; c1++) {
            for (let c2 = c1 + 1; c2 < 9; c2++) {
              for (let c3 = c2 + 1; c3 < 9; c3++) {
                const cells = [
                  r1 * 9 + c1, r1 * 9 + c2, r1 * 9 + c3,
                  r2 * 9 + c1, r2 * 9 + c2, r2 * 9 + c3,
                ];
                const boxes = new Set(cells.map((c) => BOX_OF[c]!));
                if (boxes.size !== 3) continue;

                const masks = cells.map((c) => grid.get(c) === 0 ? grid.candidatesOf(c) : 0);
                const unionMask = masks.reduce((m, x) => m | x, 0);
                if (popcount(unionMask) !== 3) continue;

                const digits = digitsOf(unionMask);
                const floorCells = cells.filter((_, i) => masks[i] === unionMask);
                const roofCells = cells.filter((_, i) => masks[i] !== unionMask && masks[i] !== 0);

                if (roofCells.length !== 1) continue;
                const roof = roofCells[0]!;
                const roofMask = grid.candidatesOf(roof);
                const extraMask = roofMask & ~unionMask;
                if (extraMask === 0) continue;

                const elims: { cell: number; digit: number }[] = [];
                for (const d of digits) {
                  if (grid.hasCandidate(roof, d)) {
                    elims.push({ cell: roof, digit: d });
                  }
                }

                if (elims.length > 0) {
                  return {
                    strategyId: this.id,
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells,
                      candidates: cells.flatMap((c) => {
                        if (grid.get(c) !== 0) return [{ cell: c, digit: grid.get(c)! }];
                        return digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }));
                      }),
                      links: [],
                    },
                    explanation: {
                      zh: `扩展唯一矩形（2×3）：6个格跨3行3列3宫，候选数仅{${digits.join(',')}}；屋顶格${cellLabel(roof)}有额外候选数，消去其{${digits.join(',')}}以避免多解。`,
                      en: `Extended UR (2×3): 6 cells in 3 rows/cols/boxes with digits {${digits.join(',')}}; roof ${cellLabel(roof)} has extra candidates; eliminate {${digits.join(',')}} to avoid deadly pattern.`,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  },
};

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (let d1 = 1; d1 <= 8; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const bit = maskOf(d1) | maskOf(d2);
        const bivalueCells: number[] = [];
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) === 0 && grid.candidatesOf(c) === bit) {
            bivalueCells.push(c);
          }
        }
        if (bivalueCells.length < 6) continue;

        const result = findUniqueLoop(bivalueCells, d1, d2, grid);
        if (result) return result;
      }
    }
    return null;
  },
};

function findUniqueLoop(
  bivalueCells: number[], d1: number, d2: number, grid: Grid,
): Step | null {
  const adj = new Map<number, number[]>();
  for (const c of bivalueCells) adj.set(c, []);

  for (const house of HOUSES) {
    const inHouse = house.filter((c) => bivalueCells.includes(c));
    if (inHouse.length === 2) {
      adj.get(inHouse[0]!)!.push(inHouse[1]!);
      adj.get(inHouse[1]!)!.push(inHouse[0]!);
    }
  }

  for (const start of bivalueCells) {
    const visited = new Set([start]);
    const path = [start];

    const result = dfs(path, visited, start, adj, bivalueCells, d1, d2, grid);
    if (result) return result;
  }
  return null;
}

function dfs(
  path: number[], visited: Set<number>, start: number,
  adj: Map<number, number[]>, bivalueCells: number[],
  d1: number, d2: number, grid: Grid,
): Step | null {
  const cur = path[path.length - 1]!;
  if (path.length >= 6 && adj.get(cur)!.includes(start)) {
    const loop = [...path];
    const loopSet = new Set(loop);

    for (const house of HOUSES) {
      const inHouse = house.filter((c) => loopSet.has(c));
      if (inHouse.length !== 2 && inHouse.length !== 0) continue;
    }

    const bit = maskOf(d1) | maskOf(d2);
    const extraCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (loopSet.has(c)) continue;
      const mask = grid.candidatesOf(c);
      if ((mask & bit) !== bit) continue;
      if (popcount(mask) > 2) extraCells.push(c);
    }

    if (extraCells.length > 0) {
      const elims: { cell: number; digit: number }[] = [];
      for (const ec of extraCells) {
        if (grid.hasCandidate(ec, d1)) elims.push({ cell: ec, digit: d1 });
        if (grid.hasCandidate(ec, d2)) elims.push({ cell: ec, digit: d2 });
      }
      if (elims.length > 0) {
        return {
          strategyId: 'unique-loop',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...loop, ...elims.map((e) => e.cell)],
            candidates: [
              ...loop.flatMap((c) => [{ cell: c, digit: d1 }, { cell: c, digit: d2 }]),
              ...elims,
            ],
            links: [],
          },
          explanation: {
            zh: `唯一环：${loop.length}个双值格{${d1},${d2}}形成环；消去环外格的额外候选数以避免多解。`,
            en: `Unique Loop: ${loop.length} bivalue cells {${d1},${d2}} form a loop; eliminate extra candidates to avoid deadly pattern.`,
          },
        };
      }
    }
  }

  if (path.length >= 10) return null;

  for (const next of adj.get(cur)!) {
    if (next === start && path.length >= 6) continue;
    if (visited.has(next)) continue;
    visited.add(next);
    path.push(next);
    const result = dfs(path, visited, start, adj, bivalueCells, d1, d2, grid);
    if (result) return result;
    path.pop();
    visited.delete(next);
  }
  return null;
}

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG-lite', en: 'BUG-lite' },
  difficulty: 986,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) emptyCells.push(c);
    }

    const bivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) === 2);
    const nonBivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) !== 2);

    if (nonBivalue.length < 1 || nonBivalue.length > 3) return null;

    for (const cell of nonBivalue) {
      const mask = grid.candidatesOf(cell);
      const ds = digitsOf(mask);

      for (const d of ds) {
        const bit = maskOf(d);
        let isBugDigit = true;

        for (const houseIdx of [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!]) {
          const house = HOUSES[houseIdx]!;
          const count = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit)).length;
          if (count % 2 === 0) {
            isBugDigit = false;
            break;
          }
        }

        if (isBugDigit) {
          const otherDigits = ds.filter((x) => x !== d);
          const elims = otherDigits
            .filter((x) => grid.hasCandidate(cell, x))
            .map((x) => ({ cell, digit: x }));

          if (elims.length > 0) {
            return {
              strategyId: this.id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [cell],
                candidates: ds.map((x) => ({ cell, digit: x })),
                links: [],
              },
              explanation: {
                zh: `BUG-lite：格${cellLabel(cell)}中${d}为BUG数（在各宫/行/列中出现奇数次）；消去其他候选数。`,
                en: `BUG-lite: digit ${d} in ${cellLabel(cell)} is the BUG digit (odd count in houses); eliminate other candidates.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 987,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const emptyCells: number[] = [];
    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) === 0) emptyCells.push(c);
    }

    const bivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) === 2);
    const nonBivalue = emptyCells.filter((c) => popcount(grid.candidatesOf(c)) > 2);

    if (nonBivalue.length < 2 || nonBivalue.length > 4) return null;
    if (bivalue.length + nonBivalue.length !== emptyCells.length) return null;

    for (const cell of nonBivalue) {
      const mask = grid.candidatesOf(cell);
      const ds = digitsOf(mask);

      for (const d of ds) {
        const bit = maskOf(d);
        let oddCount = 0;

        for (const houseIdx of [ROW_OF[cell]!, 9 + COL_OF[cell]!, 18 + BOX_OF[cell]!]) {
          const house = HOUSES[houseIdx]!;
          const count = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit)).length;
          if (count % 2 === 1) oddCount++;
        }

        if (oddCount >= 2) {
          return {
            strategyId: this.id,
            placements: [{ cell, digit: d }],
            eliminations: [],
            highlights: {
              cells: [cell],
              candidates: ds.map((x) => ({ cell, digit: x })),
              links: [],
            },
            explanation: {
              zh: `BUG+N：格${cellLabel(cell)}中${d}在多个宫中为BUG数；必须填入${d}以避免多解。`,
              en: `BUG+N: digit ${d} in ${cellLabel(cell)} is BUG digit in multiple houses; must place ${d} to maintain unique solution.`,
            },
          };
        }
      }
    }
    return null;
  },
};
