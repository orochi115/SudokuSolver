import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface AHS {
  house: number;
  cells: number[];      // N+1 cells
  digits: number[];     // N digits of the hidden set
  digitMask: number;
  extraDigits: number[]; // the 2 extra digits in the cells
  extraMask: number;
}

function findAHSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxN: number): AHS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const activeDigits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    if (emptyCells.some((c) => grid.candidatesOf(c) & bit)) {
      activeDigits.push(d);
    }
  }

  const result: AHS[] = [];

  for (let N = 1; N <= Math.min(maxN, activeDigits.length - 1); N++) {
    for (const combo of combinations(activeDigits, N)) {
      const comboMask = combo.reduce((m, d) => m | maskOf(d), 0);
      const cellsWithCombo = emptyCells.filter((c) => (grid.candidatesOf(c) & comboMask) !== 0);

      if (cellsWithCombo.length === N + 1) {
        // Find if this is a valid hidden set dual: all instances of combo digits in house must be in cellsWithCombo.
        let isConfined = true;
        for (const d of combo) {
          const bit = maskOf(d);
          const allDInHouse = emptyCells.filter((c) => grid.candidatesOf(c) & bit);
          if (allDInHouse.some((c) => !cellsWithCombo.includes(c))) {
            isConfined = false;
            break;
          }
        }

        if (isConfined) {
          // Extra candidates in these cells
          let unionMask = 0;
          for (const c of cellsWithCombo) {
            unionMask |= grid.candidatesOf(c);
          }
          const extraMask = unionMask & ~comboMask;
          if (popcount(extraMask) === 2) {
            result.push({
              house: houseIndex,
              cells: cellsWithCombo,
              digits: combo,
              digitMask: comboMask,
              extraDigits: digitsOf(extraMask),
              extraMask,
            });
          }
        }
      }
    }
  }

  return result;
}

function findAllAHS(grid: Grid): AHS[] {
  const result: AHS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const ahs of findAHSInHouse(grid, house, houseIndex, 4)) {
      const key = `${ahs.house}:${[...ahs.cells].sort((a, b) => a - b).join(',')}:${ahs.digits.join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(ahs);
      }
    }
  }

  return result;
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

function isRCC(grid: Grid, a: AHS, b: AHS, d: number): boolean {
  const bit = maskOf(d);
  if (!(a.extraMask & bit)) return false;
  if (!(b.extraMask & bit)) return false;

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

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const ahsList = findAllAHS(grid);

    for (let i = 0; i < ahsList.length; i++) {
      for (let j = i + 1; j < ahsList.length; j++) {
        const a = ahsList[i]!;
        const b = ahsList[j]!;

        // Share cells is forbidden
        if (a.cells.some((c) => b.cells.includes(c))) continue;

        const commonExtra = digitsOf(a.extraMask & b.extraMask);

        for (const x of commonExtra) {
          if (!isRCC(grid, a, b, x)) continue;

          for (const z of commonExtra) {
            if (z === x) continue;

            const zBit = maskOf(z);
            const aCellsZ = a.cells.filter((c) => grid.candidatesOf(c) & zBit);
            const bCellsZ = b.cells.filter((c) => grid.candidatesOf(c) & zBit);

            if (aCellsZ.length === 0 || bCellsZ.length === 0) continue;

            const elims: { cell: number; digit: number }[] = [];
            for (let c = 0; c < CELLS; c++) {
              if (grid.get(c) !== 0) continue;
              if (!(grid.candidatesOf(c) & zBit)) continue;
              if (a.cells.includes(c) || b.cells.includes(c)) continue;

              const peersOfC = new Set(PEERS_OF[c]!);
              const seesAllAZ = aCellsZ.every((ac) => peersOfC.has(ac));
              const seesAllBZ = bCellsZ.every((bc) => peersOfC.has(bc));

              if (seesAllAZ && seesAllBZ) {
                elims.push({ cell: c, digit: z });
              }
            }

            if (elims.length > 0) {
              const allCells = [...a.cells, ...b.cells];
              return {
                strategyId: this.id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...allCells, ...elims.map((e) => e.cell)])],
                  candidates: [
                    ...a.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...b.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...elims,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `几乎隐藏集（AHS-XZ）：AHS-A（格 ${a.cells.map((c) => cellLabel(c)).join(',')} 隐藏候选 {${a.digits.join('')}}，外加 {${a.extraDigits.join('')}}）与 AHS-B（格 ${b.cells.map((c) => cellLabel(c)).join(',')} 隐藏候选 {${b.digits.join('')}}，外加 {${b.extraDigits.join('')}}）通过受限公共候选数 ${x} 连接；消去能同时看到两个 AHS 中所有 ${z} 的格子中的 ${z}。`,
                  en: `Almost Hidden Set (AHS-XZ): AHS-A (cells ${a.cells.map((c) => cellLabel(c)).join(',')} hidden cands {${a.digits.join('')}}, extra {${a.extraDigits.join('')}}) and AHS-B (cells ${b.cells.map((c) => cellLabel(c)).join(',')} hidden cands {${b.digits.join('')}}, extra {${b.extraDigits.join('')}}) linked by RCC ${x}; eliminate ${z} from cells seeing all ${z} in both AHSs.`,
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
