import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface AHS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  function go(start: number, chosen: T[]): void {
    if (chosen.length === k) { result.push([...chosen]); return; }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]!);
      go(i + 1, chosen);
      chosen.pop();
    }
  }
  go(0, []);
  return result;
}

function findAHSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): AHS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const totalEmpty = emptyCells.length;
  const result: AHS[] = [];

  for (let digitCount = 1; digitCount <= Math.min(maxSize, totalEmpty - 1); digitCount++) {
    const cellCount = digitCount + 1;
    for (const combo of combinations(emptyCells, cellCount)) {
      let mask = 0;
      for (const c of combo) mask |= grid.candidatesOf(c);
      const digitsInCells = digitsOf(mask);

      for (const digitCombo of combinations(digitsInCells, digitCount)) {
        let digitMask = 0;
        for (const d of digitCombo) digitMask |= maskOf(d);

        const digitCells = new Set<number>();
        for (const d of digitCombo) {
          const cellsWithD = combo.filter((c) => grid.hasCandidate(c, d));
          for (const c of cellsWithD) digitCells.add(c);
        }

        if (digitCells.size === cellCount) {
          const outsideCountInHouse = combo.filter((c) => {
            const cm = grid.candidatesOf(c);
            return (cm & ~digitMask) !== 0;
          }).length;

          if (outsideCountInHouse === 1) {
            result.push({ house: houseIndex, cells: [...digitCells], digits: digitCombo, digitMask });
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
      const key = `${ahs.house}:${[...ahs.cells].sort((a, b) => a - b).join(',')}-${ahs.digits.sort().join('')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(ahs);
      }
    }
  }
  return result;
}

export const ahs: Strategy = {
  id: 'ahs',
  name: { zh: '几乎隐藏集', en: 'Almost Hidden Set' },
  difficulty: 885,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    const ahsList = findAllAHS(grid);

    for (let i = 0; i < ahsList.length; i++) {
      const a = ahsList[i]!;

      for (const cell of a.cells) {
        const cm = grid.candidatesOf(cell);
        const extraDigits = digitsOf(cm & ~a.digitMask);
        if (extraDigits.length === 0) continue;

        for (const d of extraDigits) {
          if (!grid.hasCandidate(cell, d)) continue;

          const elims: { cell: number; digit: number }[] = [];
          for (const other of a.cells) {
            if (other === cell) continue;
            for (const ad of a.digits) {
              if (grid.hasCandidate(other, ad)) continue;
              elims.push({ cell: other, digit: ad });
            }
          }

          if (elims.length > 0) {
            return {
              strategyId: 'ahs',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...a.cells],
                candidates: a.cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `几乎隐藏集（AHS）：${a.digits.length} 个数字限定在 ${a.cells.length} 格内，${cellLabel(cell)} 的额外候选 ${d} 迫使 AHS 成为隐藏集；消去其他 AHS 格中缺失的 AHS 数字。`,
                en: `Almost Hidden Set (AHS): ${a.digits.length} digits confined to ${a.cells.length} cells; extra candidate ${d} in ${cellLabel(cell)} forces the AHS into a hidden set; eliminate missing AHS digits from other AHS cells.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};