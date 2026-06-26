import {
  HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

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
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

// Generate all combinations of S-1 elements from candidates list
function* combinations<T>(arr: T[], size: number): Generator<T[]> {
  if (size < 0 || arr.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => arr[i]!);
    let i = size - 1;
    while (i >= 0 && idx[i]! === arr.length - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

export const uniqueRectangleType3: Strategy = {
  id: 'unique-rectangle-type-3',
  name: { zh: '唯一矩形 Type 3', en: 'Unique Rectangle Type 3' },
  difficulty: 940,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

      const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
      if (popcount(intersect) !== 2) continue;

      const [x, y] = digitsOf(intersect) as [number, number];

      // Roof cells carry extras; floor cells have exactly intersect
      const floorCells = cells.filter((_, i) => masks[i] === intersect);
      const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0 && (masks[i]! & intersect) === intersect);

      if (floorCells.length !== 2 || roofCells.length !== 2) continue;

      const r1 = roofCells[0]!;
      const r2 = roofCells[1]!;

      const extraMask1 = grid.candidatesOf(r1) & ~intersect;
      const extraMask2 = grid.candidatesOf(r2) & ~intersect;
      const extraUnionMask = extraMask1 | extraMask2;
      const extraDigits = digitsOf(extraUnionMask);

      // Try each shared house of the two roof cells
      for (const houseIdx of getCommonHouses(r1, r2)) {
        const house = HOUSES[houseIdx]!;
        // Cells in house (not r1, r2, and unsolved)
        const otherCells = house.filter((c) => c !== r1 && c !== r2 && grid.get(c) === 0);

        // Try subset sizes S from 2 to 4
        for (let S = 2; S <= 4; S++) {
          const neededExtra = S - 1;
          if (otherCells.length < neededExtra) continue;

          for (const subset of combinations(otherCells, neededExtra)) {
            // Check union of candidates plus extraDigits
            let subsetMask = extraUnionMask;
            for (const c of subset) {
              subsetMask |= grid.candidatesOf(c);
            }

            const subsetDigits = digitsOf(subsetMask);
            if (subsetDigits.length !== S) continue;

            // Make sure every cell in subset only contains candidates from subsetDigits
            let valid = true;
            for (const c of subset) {
              if (popcount(grid.candidatesOf(c) & ~subsetMask) !== 0) {
                valid = false;
                break;
              }
            }
            if (!valid) continue;

            // We found a naked subset! Eliminate subset digits from other cells in house
            const elims: CellDigit[] = [];
            for (const cell of house) {
              if (cell === r1 || cell === r2 || subset.includes(cell)) continue;
              if (grid.get(cell) !== 0) continue;
              const cellMask = grid.candidatesOf(cell);
              for (const d of subsetDigits) {
                if (cellMask & maskOf(d)) {
                  elims.push({ cell, digit: d });
                }
              }
            }

            if (elims.length > 0) {
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...cells, ...subset],
                  candidates: [
                    ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...subset.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `唯一矩形 Type 3：在 ${cellLabel(r1)} 和 ${cellLabel(r2)} 处的额外候选数与该区域内的 ${subset.map(cellLabel).join(',')} 构成显性 ${S} 数数集 {${subsetDigits.join(',')}}（UR对 {${x},${y}}）；消去该区域其他格中的对应候选。`,
                  en: `Unique Rectangle Type 3: extra candidates at ${cellLabel(r1)} and ${cellLabel(r2)} form a naked subset of size ${S} ({${subsetDigits.join(',')}}) with ${subset.map(cellLabel).join(',')}; eliminate those digits from other cells in the house.`,
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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}
