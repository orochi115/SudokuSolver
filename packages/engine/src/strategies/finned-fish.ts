import { ROWS, COLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, type Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

const FINNED_NAMES: Record<2 | 3 | 4, { zh: string; en: string }> = {
  2: { zh: '鳍/寿司 X翼', en: 'Finned/Sashimi X-Wing' },
  3: { zh: '鳍/寿司剑鱼', en: 'Finned/Sashimi Swordfish' },
  4: { zh: '鳍/寿司水母', en: 'Finned/Sashimi Jellyfish' },
};

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

function seesAll(cell: number, fins: readonly number[]): boolean {
  return fins.every((fin) => PEERS_OF[cell]!.includes(fin));
}

function tryFinnedFish(
  grid: Grid,
  digit: number,
  baseHouses: readonly (readonly number[])[],
  coverHouses: readonly (readonly number[])[],
  baseAxis: 'row' | 'col',
  size: 2 | 3 | 4,
  strategyId: string,
): Step | null {
  const bit = maskOf(digit);
  const candidateCellsByBase: number[][] = [];
  for (let i = 0; i < 9; i++) {
    candidateCellsByBase[i] = baseHouses[i]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
  }

  const eligibleBases = candidateCellsByBase
    .map((cells, i) => (cells.length >= 1 && cells.length <= size + 3 ? i : -1))
    .filter((i) => i >= 0);
  const coverIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  for (const bases of combinations(eligibleBases, size)) {
    const baseSet = new Set(bases);
    const baseCandidates = bases.flatMap((b) => candidateCellsByBase[b]!);
    if (baseCandidates.length <= size) continue;

    for (const covers of combinations(coverIndices, size)) {
      const coverSet = new Set(covers);
      const covered: number[] = [];
      const fins: number[] = [];
      for (const cell of baseCandidates) {
        const coverIdx = baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!;
        if (coverSet.has(coverIdx)) covered.push(cell);
        else fins.push(cell);
      }
      if (fins.length === 0 || covered.length === 0) continue;
      const finBox = BOX_OF[fins[0]!]!;
      if (fins.some((cell) => BOX_OF[cell] !== finBox)) continue;
      if (bases.some((b) => !candidateCellsByBase[b]!.some((cell) => covered.includes(cell)))) continue;
      if (covers.some((cover) => !covered.some((cell) => (baseAxis === 'row' ? COL_OF[cell] : ROW_OF[cell]) === cover))) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const cover of covers) {
        for (const cell of coverHouses[cover]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const baseIdx = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(baseIdx)) continue;
          if (!seesAll(cell, fins)) continue;
          eliminations.push({ cell, digit });
        }
      }
      if (eliminations.length === 0) continue;

      const names = FINNED_NAMES[size];
      const baseLabelZh = baseAxis === 'row' ? '行' : '列';
      const coverLabelZh = baseAxis === 'row' ? '列' : '行';
      const baseLabelEn = baseAxis === 'row' ? 'rows' : 'columns';
      const coverLabelEn = baseAxis === 'row' ? 'columns' : 'rows';
      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([...covered, ...fins, ...eliminations.map((e) => e.cell)])],
          candidates: [
            ...covered.map((cell) => ({ cell, digit })),
            ...fins.map((cell) => ({ cell, digit })),
            ...eliminations,
          ],
          links: [],
        },
        explanation: {
          zh: `${names.zh}：数字 ${digit} 在第 ${bases.map((i) => i + 1).join(',')} ${baseLabelZh}形成带鳍鱼，鳍位于 ${fins.map(cellLabel).join('/')}；只消去覆盖${coverLabelZh}中同时看见全部鳍的候选。`,
          en: `${names.en}: digit ${digit} in ${baseLabelEn} ${bases.map((i) => i + 1).join(',')} forms a finned fish with fin(s) at ${fins.map(cellLabel).join('/')}; eliminate only cover-${coverLabelEn} candidates that see every fin.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFish(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: FINNED_NAMES[size],
    difficulty,
    tieBreak: ['digit', 'house'],
    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= 9; digit++) {
        const rowFish = tryFinnedFish(grid, digit, ROWS, COLS, 'row', size, id);
        if (rowFish) return rowFish;
        const colFish = tryFinnedFish(grid, digit, COLS, ROWS, 'col', size, id);
        if (colFish) return colFish;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFish(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFish(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFish(4, 'finned-jellyfish', 495);
