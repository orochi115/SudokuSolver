/**
 * Franken & Mutant Fish (T4) — 复杂鱼
 *
 * Generalisation of basic fish: base and cover sets may include boxes as well
 * as rows/columns. Franken fish keeps one side as pure lines while mixing boxes
 * into the other; Mutant fish permits arbitrary mixed house sets.
 *
 * This implementation detects fin-free Franken/Mutant fish of size 3 and 4 by
 * enumerating base/cover house sets and checking for a perfect matching between
 * base houses and cover houses through digit candidates.
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, UNITS_OF, maskOf, type Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const HOUSE_NAMES: Record<number, string> = {
  0: '行', 1: '行', 2: '行', 3: '行', 4: '行', 5: '行', 6: '行', 7: '行', 8: '行',
  9: '列', 10: '列', 11: '列', 12: '列', 13: '列', 14: '列', 15: '列', 16: '列', 17: '列',
  18: '宫', 19: '宫', 20: '宫', 21: '宫', 22: '宫', 23: '宫', 24: '宫', 25: '宫', 26: '宫',
};

const HOUSE_NAMES_EN: Record<number, string> = {
  0: 'row', 1: 'row', 2: 'row', 3: 'row', 4: 'row', 5: 'row', 6: 'row', 7: 'row', 8: 'row',
  9: 'col', 10: 'col', 11: 'col', 12: 'col', 13: 'col', 14: 'col', 15: 'col', 16: 'col', 17: 'col',
  18: 'box', 19: 'box', 20: 'box', 21: 'box', 22: 'box', 23: 'box', 24: 'box', 25: 'box', 26: 'box',
};

function houseKind(idx: number): 'row' | 'col' | 'box' {
  if (idx < 9) return 'row';
  if (idx < 18) return 'col';
  return 'box';
}

function* combinations(values: readonly number[], size: number): Generator<number[]> {
  if (values.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => values[i]!);
    let i = size - 1;
    while (i >= 0 && idx[i]! === values.length - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function hasPerfectMatching(adj: number[][], n: number): boolean {
  const matchR = new Array<number>(n).fill(-1);

  function bpm(u: number, seen: boolean[]): boolean {
    for (const v of adj[u]!) {
      if (seen[v]) continue;
      seen[v] = true;
      if (matchR[v] === -1 || bpm(matchR[v]!, seen)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  }

  for (let u = 0; u < n; u++) {
    const seen = new Array<boolean>(n).fill(false);
    if (!bpm(u, seen)) return false;
  }
  return true;
}

function isBasicFish(baseSet: number[], coverSet: number[]): boolean {
  const baseKinds = new Set(baseSet.map(houseKind));
  const coverKinds = new Set(coverSet.map(houseKind));
  return (
    (baseKinds.has('row') && coverKinds.has('col') && !baseKinds.has('box') && !coverKinds.has('box')) ||
    (baseKinds.has('col') && coverKinds.has('row') && !baseKinds.has('box') && !coverKinds.has('box'))
  );
}

function isFrankenFish(baseSet: number[], coverSet: number[]): boolean {
  const baseKinds = new Set(baseSet.map(houseKind));
  const coverKinds = new Set(coverSet.map(houseKind));

  // One side pure rows/cols (no boxes), the other side has exactly one line kind plus boxes
  const pureSide =
    (!baseKinds.has('box') && (baseKinds.has('row') !== baseKinds.has('col'))) ||
    (!coverKinds.has('box') && (coverKinds.has('row') !== coverKinds.has('col')));
  const mixedSide =
    (baseKinds.has('box') && (baseKinds.has('row') !== baseKinds.has('col'))) ||
    (coverKinds.has('box') && (coverKinds.has('row') !== coverKinds.has('col')));

  return pureSide && mixedSide;
}

function tryComplexFish(
  grid: Grid,
  digit: number,
  size: number,
  strategyId: string,
  nameZh: string,
  nameEn: string,
  acceptType: 'franken' | 'mutant',
): Step | null {
  const bit = maskOf(digit);
  const allHouses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

  for (const baseSet of combinations(allHouses, size)) {
    for (const coverSet of combinations(allHouses, size)) {
      if (isBasicFish(baseSet, coverSet)) continue;
      const isFranken = isFrankenFish(baseSet, coverSet);
      if (acceptType === 'franken' && !isFranken) continue;
      if (acceptType === 'mutant' && isFranken) continue;

      // Base candidates must lie in at least one cover house (fin-free)
      const baseCandidates: number[] = [];
      const baseSetHs = new Set(baseSet);
      for (const h of baseSet) {
        for (const cell of HOUSES[h]!) {
          if (grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0 && !baseCandidates.includes(cell)) {
            baseCandidates.push(cell);
          }
        }
      }

      if (baseCandidates.length < size + 1) continue;

      const coverSetHs = new Set(coverSet);
      const uncoveredBase = baseCandidates.filter((cell) => !UNITS_OF[cell]!.some((u) => coverSetHs.has(u)));
      if (uncoveredBase.length > 0) continue;

      // Build bipartite adjacency: base house -> cover houses that share a candidate
      const adj: number[][] = baseSet.map(() => []);
      for (let i = 0; i < baseSet.length; i++) {
        const baseHouse = baseSet[i]!;
        for (let j = 0; j < coverSet.length; j++) {
          const coverHouse = coverSet[j]!;
          const overlap = HOUSES[baseHouse]!.some(
            (cell) =>
              grid.get(cell) === 0 &&
              (grid.candidatesOf(cell) & bit) !== 0 &&
              HOUSES[coverHouse]!.includes(cell),
          );
          if (overlap) adj[i]!.push(j);
        }
      }

      if (!hasPerfectMatching(adj, size)) continue;

      // Eliminations: candidates in cover houses but not in any base house
      const baseCells = new Set(baseCandidates);
      const eliminations: { cell: number; digit: number }[] = [];
      const elimCells = new Set<number>();
      for (const h of coverSet) {
        for (const cell of HOUSES[h]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          if (baseCells.has(cell)) continue;
          eliminations.push({ cell, digit });
          elimCells.add(cell);
        }
      }

      if (eliminations.length === 0) continue;

      const baseLabelsZh = baseSet.map((h) => `${HOUSE_NAMES[h]} ${h < 9 ? h + 1 : h < 18 ? h - 8 : h - 17}`);
      const coverLabelsZh = coverSet.map((h) => `${HOUSE_NAMES[h]} ${h < 9 ? h + 1 : h < 18 ? h - 8 : h - 17}`);
      const baseLabelsEn = baseSet.map((h) => `${HOUSE_NAMES_EN[h]} ${h < 9 ? h + 1 : h < 18 ? h - 8 : h - 17}`);
      const coverLabelsEn = coverSet.map((h) => `${HOUSE_NAMES_EN[h]} ${h < 9 ? h + 1 : h < 18 ? h - 8 : h - 17}`);

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...baseCandidates, ...elimCells],
          candidates: [
            ...baseCandidates.map((c) => ({ cell: c, digit })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `${nameZh}：数字 ${digit} 的基础集 ${baseLabelsZh.join(',')} 与覆盖集 ${coverLabelsZh.join(',')} 形成完美匹配；消去覆盖集内不属于基础集的 ${digit}。`,
          en: `${nameEn}: digit ${digit} base set ${baseLabelsEn.join(',')} and cover set ${coverLabelsEn.join(',')} form a perfect matching; eliminate ${digit} from cover cells outside the base set.`,
        },
      };
    }
  }
  return null;
}

function makeComplexFishStrategy(
  id: string,
  name: { zh: string; en: string },
  difficulty: number,
  acceptType: 'franken' | 'mutant',
): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak: ['digit', 'house'],

    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= 9; digit++) {
        for (const size of [3, 4] as const) {
          const step = tryComplexFish(grid, digit, size, id, name.zh, name.en, acceptType);
          if (step) return step;
        }
      }
      return null;
    },
  };
}

export const frankenFish = makeComplexFishStrategy(
  'franken-fish',
  { zh: '弗兰肯鱼', en: 'Franken Fish' },
  1080,
  'franken',
);

export const mutantFish = makeComplexFishStrategy(
  'mutant-fish',
  { zh: '变异鱼', en: 'Mutant Fish' },
  1085,
  'mutant',
);
