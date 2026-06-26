/**
 * Franken & Mutant Fish (P2) — 弗兰肯鱼与变异鱼
 *
 * Generalises basic fish by allowing boxes to appear in the base and/or cover
 * sets. This implementation searches fin-free configurations of size 3
 * (Swordfish) and 4 (Jellyfish): for a digit d, if all d-candidates in N base
 * houses lie inside N cover houses, every d-candidate in a cover house but
 * outside the base houses is eliminated.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, CELLS, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const HOUSE_NAMES: Record<string, (idx: number) => string> = {
  row: (i) => `r${i + 1}`,
  col: (i) => `c${i + 1}`,
  box: (i) => `b${i + 1}`,
};

function houseType(idx: number): 'row' | 'col' | 'box' {
  if (idx < 9) return 'row';
  if (idx < 18) return 'col';
  return 'box';
}

function houseIndex(idx: number): number {
  return idx % 9;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) yield [first!, ...combo];
  yield* combinations(rest, k);
}

function classify(base: number[], cover: number[]): 'basic' | 'franken' | 'mutant' | null {
  const bTypes = base.map(houseType);
  const cTypes = cover.map(houseType);
  const bSet = new Set(bTypes);
  const cSet = new Set(cTypes);

  const pureRows = (t: Set<string>) => t.size === 1 && t.has('row');
  const pureCols = (t: Set<string>) => t.size === 1 && t.has('col');
  const rowBox = (t: Set<string>) => t.has('row') && t.has('box') && !t.has('col');
  const colBox = (t: Set<string>) => t.has('col') && t.has('box') && !t.has('row');

  if ((pureRows(bSet) && pureCols(cSet)) || (pureCols(bSet) && pureRows(cSet))) return 'basic';

  const franken =
    (pureRows(bSet) && colBox(cSet)) ||
    (pureCols(bSet) && rowBox(cSet)) ||
    (rowBox(bSet) && pureCols(cSet)) ||
    (colBox(bSet) && pureRows(cSet));

  if (franken) return 'franken';

  // Anything that uses boxes or mixes line directions on a side is mutant.
  if (bSet.has('box') || cSet.has('box') || (bSet.has('row') && bSet.has('col')) || (cSet.has('row') && cSet.has('col'))) {
    return 'mutant';
  }

  return null;
}

interface FishAttempt {
  digit: number;
  size: number;
  base: number[];
  cover: number[];
  eliminations: { cell: number; digit: number }[];
}

function findComplexFish(grid: Grid, allowed: 'franken' | 'mutant'): FishAttempt | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);

    // Houses that actually contain digit d candidates.
    const activeHouses: number[] = [];
    for (let h = 0; h < HOUSES.length; h++) {
      if (HOUSES[h]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0)) {
        activeHouses.push(h);
      }
    }

    for (const size of [3, 4]) {
      if (activeHouses.length < size) continue;

      for (const base of combinations(activeHouses, size)) {
        const baseCellSet = new Set<number>();
        let baseOverlap = false;
        const houseCells: number[][] = base.map((h) =>
          HOUSES[h]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0),
        );

        for (let i = 0; i < size; i++) {
          for (const c of houseCells[i]!) {
            if (baseCellSet.has(c)) {
              baseOverlap = true;
              break;
            }
            baseCellSet.add(c);
          }
          if (baseOverlap) break;
        }
        if (baseOverlap) continue;
        if (baseCellSet.size < size) continue; // need at least one candidate per base house

        for (const cover of combinations(activeHouses, size)) {
          // Avoid trivial identical base/cover orientation that yields no eliminations.
          if (base.every((h, i) => h === cover[i])) continue;

          const classification = classify(base, cover);
          if (classification !== allowed) continue;

          const coverCellSet = new Set<number>();
          const coverHouseHasBase: boolean[] = Array(size).fill(false);
          for (let i = 0; i < size; i++) {
            for (const c of HOUSES[cover[i]!]!) {
              if (grid.get(c) !== 0) continue;
              if ((grid.candidatesOf(c) & bit) !== 0) {
                coverCellSet.add(c);
                if (baseCellSet.has(c)) coverHouseHasBase[i] = true;
              }
            }
          }

          // Every base candidate must lie in a cover house.
          let covered = true;
          for (const c of baseCellSet) {
            if (!coverCellSet.has(c)) {
              covered = false;
              break;
            }
          }
          if (!covered) continue;

          // Every cover house must receive at least one base candidate.
          if (!coverHouseHasBase.every((x) => x)) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of coverCellSet) {
            if (!baseCellSet.has(c)) {
              eliminations.push({ cell: c, digit: d });
            }
          }
          if (eliminations.length === 0) continue;

          return { digit: d, size, base, cover, eliminations };
        }
      }
    }
  }
  return null;
}

function makeFishStrategy(id: 'franken-fish' | 'mutant-fish', difficulty: number): Strategy {
  const names: Record<string, { zh: string; en: string }> = {
    'franken-fish': { zh: '弗兰肯鱼', en: 'Franken Fish' },
    'mutant-fish': { zh: '变异鱼', en: 'Mutant Fish' },
  };

  return {
    id,
    name: names[id]!,
    difficulty,
    tieBreak: ['digit', 'house'],

    apply(grid: Grid): Step | null {
      const fish = findComplexFish(grid, id === 'franken-fish' ? 'franken' : 'mutant');
      if (!fish) return null;

      const { digit, size, base, cover, eliminations } = fish;
      const baseLabel = base.map((h) => HOUSE_NAMES[houseType(h)]!(houseIndex(h))).join('');
      const coverLabel = cover.map((h) => HOUSE_NAMES[houseType(h)]!(houseIndex(h))).join('');
      const baseCells = [...new Set(base.flatMap((h) => HOUSES[h]!))].filter(
        (c) => grid.get(c) === 0 && grid.hasCandidate(c, digit),
      );

      return {
        strategyId: id,
        placements: [],
        eliminations,
        highlights: {
          cells: [...baseCells, ...eliminations.map((e) => e.cell)],
          candidates: [
            ...baseCells.map((c) => ({ cell: c, digit })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `${names[id]!.zh}（大小 ${size}）：数字 ${digit} 的基础集 ${baseLabel} 被覆盖集 ${coverLabel} 完全覆盖，可从覆盖集中的非基础格消去 ${digit}。`,
          en: `${names[id]!.en} (size ${size}): digit ${digit} base ${baseLabel} is covered by ${coverLabel}; eliminate ${digit} from cover cells outside the base.`,
        },
      };
    },
  };
}

export const frankenFish = makeFishStrategy('franken-fish', 1080);
export const mutantFish = makeFishStrategy('mutant-fish', 1090);
