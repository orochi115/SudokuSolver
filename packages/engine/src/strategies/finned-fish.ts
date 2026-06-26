import { COL_OF, COLS, maskOf, PEERS_OF, ROW_OF, ROWS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

const NAMES: Record<2 | 3 | 4, { zh: string; en: string }> = {
  2: { zh: '鳍/寿司 X翼', en: 'Finned/Sashimi X-Wing' },
  3: { zh: '鳍/寿司剑鱼', en: 'Finned/Sashimi Swordfish' },
  4: { zh: '鳍/寿司水母', en: 'Finned/Sashimi Jellyfish' },
};

function* combinations(values: readonly number[], size: number): Generator<number[]> {
  if (values.length < size) return;
  const idx = Array.from({ length: size }, (_, i) => i);
  while (true) {
    yield idx.map((i) => values[i]!);
    let p = size - 1;
    while (p >= 0 && idx[p] === values.length - size + p) p--;
    if (p < 0) break;
    idx[p]!++;
    for (let q = p + 1; q < size; q++) idx[q] = idx[q - 1]! + 1;
  }
}

function seesAll(cell: number, fins: readonly number[]): boolean {
  return fins.every((fin) => PEERS_OF[cell]!.includes(fin));
}

function tryFinnedFish(
  grid: Grid,
  digit: number,
  size: 2 | 3 | 4,
  baseAxis: 'row' | 'col',
  strategyId: string,
): Step | null {
  const bit = maskOf(digit);
  const baseHouses = baseAxis === 'row' ? ROWS : COLS;
  const coverHouses = baseAxis === 'row' ? COLS : ROWS;
  const eligible = [...Array(9).keys()].filter((i) =>
    baseHouses[i]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0),
  );

  for (const bases of combinations(eligible, size)) {
    const baseSet = new Set(bases);
    const baseCandidates = new Map<number, number[]>();
    const coverUniverse = new Set<number>();
    for (const b of bases) {
      const cells = baseHouses[b]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      baseCandidates.set(b, cells);
      for (const cell of cells) coverUniverse.add(baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!);
    }
    if (coverUniverse.size <= size) continue;

    for (const covers of combinations([...coverUniverse].sort((a, b) => a - b), size)) {
      const coverSet = new Set(covers);
      const fins: number[] = [];
      const core: number[] = [];
      let everyBaseContributes = true;
      for (const b of bases) {
        const inCover = baseCandidates.get(b)!.filter((cell) => coverSet.has(baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!));
        if (inCover.length === 0) everyBaseContributes = false;
        core.push(...inCover);
        fins.push(...baseCandidates.get(b)!.filter((cell) => !coverSet.has(baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!)));
      }
      if (!everyBaseContributes || fins.length === 0) continue;
      const finBoxes = new Set(fins.map((cell) => Math.floor(ROW_OF[cell]! / 3) * 3 + Math.floor(COL_OF[cell]! / 3)));
      if (finBoxes.size !== 1) continue;

      const coverUsed = new Set(core.map((cell) => baseAxis === 'row' ? COL_OF[cell]! : ROW_OF[cell]!));
      if (coverUsed.size !== size) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const cover of covers) {
        for (const cell of coverHouses[cover]!) {
          if (grid.get(cell) !== 0 || (grid.candidatesOf(cell) & bit) === 0) continue;
          const base = baseAxis === 'row' ? ROW_OF[cell]! : COL_OF[cell]!;
          if (baseSet.has(base)) continue;
          if (seesAll(cell, fins)) eliminations.push({ cell, digit });
        }
      }
      if (eliminations.length === 0) continue;

      const names = NAMES[size];
      const baseLabel = baseAxis === 'row' ? '行' : '列';
      const baseLabelEn = baseAxis === 'row' ? 'rows' : 'columns';
      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...new Set([...core, ...fins, ...eliminations.map((e) => e.cell)])],
          candidates: [...core, ...fins].map((cell) => ({ cell, digit })).concat(eliminations),
          links: [],
        },
        explanation: {
          zh: `数字 ${digit} 在 ${bases.map((b) => b + 1).join(',')} ${baseLabel}构成${names.zh}；鳍格同宫，故只消去覆盖线中能看见全部鳍格的 ${digit}。`,
          en: `Digit ${digit} forms a ${names.en} in ${baseLabelEn} ${bases.map((b) => b + 1).join(',')}; only cover candidates that see every fin can be eliminated.`,
        },
      };
    }
  }
  return null;
}

function makeFinnedFish(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  return {
    id,
    name: NAMES[size],
    difficulty,
    tieBreak: ['digit', 'size'],
    apply(grid) {
      for (let digit = 1; digit <= 9; digit++) {
        const row = tryFinnedFish(grid, digit, size, 'row', id);
        if (row) return row;
        const col = tryFinnedFish(grid, digit, size, 'col', id);
        if (col) return col;
      }
      return null;
    },
  };
}

export const finnedXWing = makeFinnedFish(2, 'finned-x-wing', 415);
export const finnedSwordfish = makeFinnedFish(3, 'finned-swordfish', 455);
export const finnedJellyfish = makeFinnedFish(4, 'finned-jellyfish', 495);
