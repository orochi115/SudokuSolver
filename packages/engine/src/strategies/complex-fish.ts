/**
 * Franken / Mutant Fish (P2b) — 弗兰肯鱼 / 变异鱼
 *
 * Generalises basic fish by letting boxes join the base or cover sets.
 * The elimination logic is identical to basic/finned fish: a perfect
 * digit-matching between two equal-size constraint sets means surplus
 * cover candidates can be eliminated.
 *
 * Franken/Mutant X-Wing (N=2) degenerates to Locked Candidates, so we start
 * at N=3 (Swordfish) only. Search is bounded: only houses with 2–5
 * d-candidates are considered, and a total iteration budget caps the work.
 */

import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  maskOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

type HouseType = 'row' | 'col' | 'box';

interface HouseRef {
  type: HouseType;
  index: number;
  cells: readonly number[];
}

const ALL_HOUSES: HouseRef[] = [
  ...ROWS.map((cells, i) => ({ type: 'row' as HouseType, index: i, cells })),
  ...COLS.map((cells, i) => ({ type: 'col' as HouseType, index: i, cells })),
  ...BOXES.map((cells, i) => ({ type: 'box' as HouseType, index: i, cells })),
];

function isPeer(a: number, b: number): boolean {
  if (a === b) return false;
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

function* combineHouses(houses: HouseRef[], size: number): Generator<HouseRef[]> {
  if (size === 0) { yield []; return; }
  if (houses.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => houses[i]!);
    let i = size - 1;
    while (i >= 0 && idx[i]! === houses.length - size + i) i--;
    if (i < 0) break;
    idx[i]!++;
    for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1]! + 1;
  }
}

function classifyFish(
  baseTypes: Set<HouseType>,
  coverTypes: Set<HouseType>,
): 'franken' | 'mutant' | null {
  const baseHasRow = baseTypes.has('row');
  const baseHasCol = baseTypes.has('col');
  const coverHasRow = coverTypes.has('row');
  const coverHasCol = coverTypes.has('col');
  if (baseHasRow && baseHasCol) return 'mutant';
  if (coverHasRow && coverHasCol) return 'mutant';
  return 'franken';
}

const SIZE_ = 3; // only swordfish-size (N=3); jellyfish-size is too expensive to scan

function tryComplexFish(
  grid: Grid,
  digit: number,
  strategyId: string,
  zhName: string,
  enName: string,
  frankenOnly: boolean,
): Step | null {
  const bit = maskOf(digit);

  // Only consider houses with 2–5 d-candidates (bounded search)
  const usableHouses = ALL_HOUSES.filter((h) => {
    let count = 0;
    for (const c of h.cells) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) count++;
    }
    return count >= 2 && count <= 5;
  });

  if (usableHouses.length < SIZE_ * 2) return null;

  // Must have at least one box among usable houses for franken/mutant
  const hasBox = usableHouses.some((h) => h.type === 'box');
  if (!hasBox) return null;

  const houseCands = new Map<HouseRef, number[]>();
  for (const h of usableHouses) {
    const cands = h.cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    houseCands.set(h, cands);
  }

  let budget = 20000; // total iteration budget

  for (const baseSet of combineHouses(usableHouses, SIZE_)) {
    if (budget <= 0) break;
    const baseHouseSet = new Set(baseSet);
    const baseCells = new Set<number>();
    for (const h of baseSet) {
      for (const c of houseCands.get(h)!) baseCells.add(c);
    }

    const coverCandidates = usableHouses.filter((h) => !baseHouseSet.has(h));

    for (const coverSet of combineHouses(coverCandidates, SIZE_)) {
      if (--budget <= 0) break;

      // Classify
      const baseTypes = new Set(baseSet.map((h) => h.type));
      const coverTypes = new Set(coverSet.map((h) => h.type));
      const classification = classifyFish(baseTypes, coverTypes);
      if (!classification) continue;
      if (frankenOnly && classification !== 'franken') continue;
      if (!frankenOnly && classification !== 'mutant') continue;

      // Collect cover cells and fin cells
      const finCells: number[] = [];
      const coverCells: number[] = [];

      for (const c of baseCells) {
        const inCover = coverSet.some((h) => h.cells.includes(c));
        if (inCover) coverCells.push(c);
        else finCells.push(c);
      }

      // Endo-fins: base cells in 2+ base houses
      const endoFins: number[] = [];
      for (const c of baseCells) {
        let count = 0;
        for (const h of baseSet) {
          if (h.cells.includes(c)) count++;
        }
        if (count >= 2) {
          endoFins.push(c);
          const idx = coverCells.indexOf(c);
          if (idx >= 0) coverCells.splice(idx, 1);
        }
      }

      const allFins = [...new Set([...finCells, ...endoFins])];
      if (allFins.length > 3) continue;

      // Compute eliminations
      const eliminations: { cell: number; digit: number }[] = [];
      const seenElim = new Set<number>();

      for (const h of coverSet) {
        for (const c of houseCands.get(h)!) {
          if (baseCells.has(c)) {
            let coverCount = 0;
            for (const ch of coverSet) {
              if (ch.cells.includes(c)) coverCount++;
            }
            if (coverCount < 2) continue;
          }
          if (seenElim.has(c)) continue;

          if (allFins.length > 0) {
            let seesAll = true;
            for (const f of allFins) {
              if (!isPeer(c, f)) { seesAll = false; break; }
            }
            if (!seesAll) continue;
          }

          seenElim.add(c);
          eliminations.push({ cell: c, digit });
        }
      }

      if (eliminations.length === 0) continue;

      const baseLabel = baseSet.map((h) => `${h.type[0]!.toUpperCase()}${h.index + 1}`).join(',');
      const coverLabel = coverSet.map((h) => `${h.type[0]!.toUpperCase()}${h.index + 1}`).join(',');
      const allHighlightCells = [...new Set([
        ...coverCells, ...allFins, ...eliminations.map((e) => e.cell),
      ])];

      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: allHighlightCells,
          candidates: [
            ...coverCells.map((c) => ({ cell: c, digit })),
            ...allFins.map((c) => ({ cell: c, digit })),
            ...eliminations,
          ],
          links: allFins.length > 0
            ? allFins.map((f) => ({
                from: { cell: f, digit },
                to: { cell: eliminations[0]!.cell, digit },
                type: 'weak' as const,
              }))
            : [],
        },
        explanation: {
          zh: `${zhName}：数字 ${digit} 的基础集[${baseLabel}]与覆盖集[${coverLabel}]构成${classification === 'franken' ? '弗兰肯' : '变异'}鱼（${allFins.length > 0 ? `含 ${allFins.length} 鳍` : '无鳍'}）；覆盖集中非基础格的 ${digit} 可消去。`,
          en: `${enName}: digit ${digit}, base [${baseLabel}] vs cover [${coverLabel}] — ${classification} fish${allFins.length > 0 ? ` with ${allFins.length} fin(s)` : ''}; eliminate ${digit} from surplus cover cells.`,
        },
      };
    }
  }
  return null;
}

export function makeComplexFish(
  strategyId: string,
  zhName: string,
  enName: string,
  difficulty: number,
  frankenOnly: boolean,
): Strategy {
  return {
    id: strategyId,
    name: { zh: zhName, en: enName },
    difficulty,
    tieBreak: ['digit', 'size'],

    apply(grid: Grid): Step | null {
      for (let d = 1; d <= 9; d++) {
        const step = tryComplexFish(grid, d, strategyId, zhName, enName, frankenOnly);
        if (step) return step;
      }
      return null;
    },
  };
}

export const frankenFish = makeComplexFish(
  'franken-fish', '弗兰肯鱼', 'Franken Fish', 1080, true,
);
export const mutantFish = makeComplexFish(
  'mutant-fish', '变异鱼', 'Mutant Fish', 1090, false,
);
