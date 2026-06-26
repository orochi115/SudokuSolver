import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
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

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
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

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

function tryARType1(grid: Grid, cells: number[]): Step | null {
  const [c11, c12, c21, c22] = cells;
  const masks = cells.map((c) => grid.candidatesOf(c));
  const values = cells.map((c) => grid.get(c));

  if (values.filter((v) => v !== 0).length < 3) return null;
  if (values.filter((v) => v !== 0).length > 3) return null;

  const unsolvedIdx = values.indexOf(0);
  if (unsolvedIdx === -1) return null;

  const unsolvedCell = cells[unsolvedIdx]!;
  const solvedValues = values.filter((v) => v !== 0) as number[];
  if (solvedValues.length < 3) return null;

  const valueCounts = new Map<number, number>();
  for (const v of solvedValues) valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
  const pairValue = [...valueCounts.entries()].find(([, count]) => count === 2)?.[0];
  if (pairValue === undefined) return null;

  const otherValues = solvedValues.filter((v) => v !== pairValue);
  if (otherValues.length !== 1) return null;
  const singleValue = otherValues[0]!;

  if (!grid.hasCandidate(unsolvedCell, singleValue)) return null;

  return {
    strategyId: 'avoidable-rectangle-type-1',
    placements: [],
    eliminations: [{ cell: unsolvedCell, digit: singleValue }],
    highlights: {
      cells: [...cells],
      candidates: [{ cell: unsolvedCell, digit: singleValue }],
      links: [],
    },
    explanation: {
      zh: `可避免矩形 Type 1：{${cells.map((c) => cellLabel(c)).join(',')}} 三个已填格构成致命式的前提，未填格 ${cellLabel(unsolvedCell)} 不能为 ${singleValue}。`,
      en: `Avoidable Rectangle Type 1: {${cells.map((c) => cellLabel(c)).join(',')}} 3 solved cells form a deadly pattern base; ${cellLabel(unsolvedCell)} cannot be ${singleValue}.`,
    },
  };
}

function tryARType2(grid: Grid, cells: number[]): Step | null {
  const [c11, c12, c21, c22] = cells;
  const values = cells.map((c) => grid.get(c));

  const unsolvedIndices = values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (unsolvedIndices.length !== 2) return null;

  const [u1, u2] = unsolvedIndices as [number, number];
  const unsolvedA = cells[u1]!;
  const unsolvedB = cells[u2]!;

  const solvedValues = values.filter((v) => v !== 0) as number[];
  if (solvedValues.length !== 2) return null;

  const [sv1, sv2] = solvedValues as [number, number];

  const mA = grid.candidatesOf(unsolvedA);
  const mB = grid.candidatesOf(unsolvedB);

  if (!(mA & maskOf(sv1)) || !(mB & maskOf(sv2))) {
    return null;
  }

  const extraA = mA & ~maskOf(sv1);
  const extraB = mB & ~maskOf(sv2);

  const commonExtra = extraA & extraB;
  if (commonExtra === 0) return null;

  const g = digitsOf(commonExtra)[0]!;

  if (!(mA & maskOf(g)) || !(mB & maskOf(g))) return null;

  const peersA = new Set(PEERS_OF[unsolvedA]!);
  const commonPeers = PEERS_OF[unsolvedB]!.filter((c) => peersA.has(c));
  const eliminations = commonPeers
    .filter((c) => !cells.includes(c) && grid.hasCandidate(c, g))
    .map((c) => ({ cell: c, digit: g }));

  if (eliminations.length === 0) return null;

  return {
    strategyId: 'avoidable-rectangle-type-2',
    placements: [],
    eliminations,
    highlights: {
      cells: [...cells, ...eliminations.map((e) => e.cell)],
      candidates: [
        ...cells.filter((c) => grid.get(c) === 0).flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
        ...eliminations,
      ],
      links: [],
    },
    explanation: {
      zh: `可避免矩形 Type 2：未填格 ${cellLabel(unsolvedA)} 和 ${cellLabel(unsolvedB)} 至少含相同额外数字 ${g}，消去同时可见两格的同数字。`,
      en: `Avoidable Rectangle Type 2: unsolved ${cellLabel(unsolvedA)} and ${cellLabel(unsolvedB)} share extra digit ${g}; eliminate from common peers.`,
    },
  };
}

function tryARType3(grid: Grid, cells: number[]): Step | null {
  const [c11, c12, c21, c22] = cells;
  const values = cells.map((c) => grid.get(c));

  const solvedIndices = values.map((v, i) => (v !== 0 ? i : -1)).filter((i) => i >= 0);
  if (solvedIndices.length !== 2) return null;

  const unsolvedIndices = values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (unsolvedIndices.length !== 2) return null;

  const [u1, u2] = unsolvedIndices as [number, number];
  const unsolvedCells = [cells[u1]!, cells[u2]!];

  const solvedValues = solvedIndices.map((i) => values[i]!) as number[];
  const [sv1, sv2] = solvedValues as [number, number];

  const extraMaskA = grid.candidatesOf(unsolvedCells[0]!) & ~maskOf(sv1);
  const extraMaskB = grid.candidatesOf(unsolvedCells[1]!) & ~maskOf(sv2);
  const unionExtra = extraMaskA | extraMaskB;
  if (unionExtra === 0) return null;

  const extraDigits = digitsOf(unionExtra);

  const commonHouses = getCommonHouses(unsolvedCells[0]!, unsolvedCells[1]!);
  for (const houseIdx of commonHouses) {
    const house = HOUSES[houseIdx]!;
    const otherCells = house.filter((c) => !cells.includes(c) && grid.get(c) === 0);

    for (const subsetSize of [2, 3, 4]) {
      if (extraDigits.length > subsetSize) continue;
      if (otherCells.length < subsetSize - 2) continue;

      for (const combo of combinations(otherCells, Math.max(0, subsetSize - 2))) {
        const subsetCells = [...unsolvedCells, ...combo];
        let unionMask = 0;
        for (const sc of subsetCells) unionMask |= grid.candidatesOf(sc);
        const subsetDigits = digitsOf(unionMask);
        if (subsetDigits.length !== subsetCells.length) continue;

        const eliminations: { cell: number; digit: number }[] = [];
        for (const c of house) {
          if (subsetCells.includes(c)) continue;
          if (grid.get(c) !== 0) continue;
          for (const d of subsetDigits) {
            if (grid.hasCandidate(c, d)) eliminations.push({ cell: c, digit: d });
          }
        }
        if (eliminations.length > 0) {
          const solvedLabels = solvedValues.join(',');
          return {
            strategyId: 'avoidable-rectangle-type-3',
            placements: [],
            eliminations,
            highlights: {
              cells: [...cells, ...combo, ...eliminations.map((e) => e.cell)],
              candidates: [
                ...cells.filter((c) => grid.get(c) === 0).flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                ...eliminations,
              ],
              links: [],
            },
            explanation: {
              zh: `可避免矩形 Type 3：已填 {${solvedLabels}} 的可避免矩形 + ${combo.map((c) => cellLabel(c)).join(',')} 形成 ${subsetSize} 元组。`,
              en: `Avoidable Rectangle Type 3: AR with {${solvedLabels}} + ${combo.map((c) => cellLabel(c)).join(',')} form a ${subsetSize}-tuple.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function tryARType4(grid: Grid, cells: number[]): Step | null {
  const [c11, c12, c21, c22] = cells;
  const values = cells.map((c) => grid.get(c));

  const solvedIndices = values.map((v, i) => (v !== 0 ? i : -1)).filter((i) => i >= 0);
  if (solvedIndices.length !== 2) return null;

  const unsolvedIndices = values.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (unsolvedIndices.length !== 2) return null;

  const solvedValues = solvedIndices.map((i) => values[i]!) as [number, number];
  const [sv1, sv2] = solvedValues;

  const [u1, u2] = unsolvedIndices as [number, number];
  const unsolvedA = cells[u1]!;
  const unsolvedB = cells[u2]!;

  const mA = grid.candidatesOf(unsolvedA);
  const mB = grid.candidatesOf(unsolvedB);

  if (!(mA & maskOf(sv1)) || !(mB & maskOf(sv2))) {
    return null;
  }

  const extraA = mA & ~maskOf(sv1);
  const extraB = mB & ~maskOf(sv2);

  if (popcount(extraA) === 1 && popcount(extraB) === 1) {
    const dA = digitsOf(extraA)[0]!;
    const dB = digitsOf(extraB)[0]!;
    if (dA !== dB) {
      if (grid.hasCandidate(unsolvedA, dB) && ROW_OF[unsolvedA] === ROW_OF[unsolvedB] || COL_OF[unsolvedA] === COL_OF[unsolvedB] || BOX_OF[unsolvedA] === BOX_OF[unsolvedB]) {
        if (ROW_OF[unsolvedA] === ROW_OF[unsolvedB]) {
          const house = ROWS[ROW_OF[unsolvedA]!]!;
          for (const c of house) {
            if (c === unsolvedA || c === unsolvedB) continue;
            if (grid.hasCandidate(c, dA) && !grid.hasCandidate(c, dB)) {
              return {
                strategyId: 'avoidable-rectangle-type-4',
                placements: [],
                eliminations: [{ cell: unsolvedA, digit: dA }],
                highlights: {
                  cells,
                  candidates: digitsOf(grid.candidatesOf(unsolvedA)).map((d) => ({ cell: unsolvedA, digit: d })),
                  links: [],
                },
                explanation: {
                  zh: `可避免矩形 Type 4：${cellLabel(unsolvedA)} 的额外候选 ${dA} 被 ${cellLabel(unsolvedB)} 的 ${dB} "锁定"；消去 ${dA}。`,
                  en: `Avoidable Rectangle Type 4: ${cellLabel(unsolvedA)}'s extra ${dA} is "locked" by ${cellLabel(unsolvedB)}'s ${dB}; eliminate ${dA}.`,
                },
              };
            }
          }
        }
      }
    }
  }

  return null;
}

const AR_IDS: Record<string, { zh: string; en: string; difficulty: number }> = {
  'avoidable-rectangle-type-1': { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1', difficulty: 945 },
  'avoidable-rectangle-type-2': { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2', difficulty: 946 },
  'avoidable-rectangle-type-3': { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3', difficulty: 947 },
  'avoidable-rectangle-type-4': { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4', difficulty: 948 },
};

function makeARStrategy(type: string, id: string, difficulty: number): Strategy {
  const fn = type === '1' ? tryARType1 : type === '2' ? tryARType2 : type === '3' ? tryARType3 : tryARType4;
  return {
    id,
    name: AR_IDS[id]!.zh.includes('Type')
      ? { zh: `可避免矩形 Type ${type}`, en: `Avoidable Rectangle Type ${type}` }
      : AR_IDS[id]!,
    difficulty,
    tieBreak: ['cell-index'],
    apply(grid: Grid): Step | null {
      for (const cells of allRectangles()) {
        const step = fn(grid, cells);
        if (step) return step;
      }
      return null;
    },
  };
}

function tryARAll(grid: Grid, strategyId: string): Step | null {
  const type = strategyId === 'avoidable-rectangle-type-1' ? '1'
    : strategyId === 'avoidable-rectangle-type-2' ? '2'
    : strategyId === 'avoidable-rectangle-type-3' ? '3'
    : '4';
  const fn = type === '1' ? tryARType1 : type === '2' ? tryARType2 : type === '3' ? tryARType3 : tryARType4;
  for (const cells of allRectangles()) {
    const step = fn(grid, cells);
    if (step) return step;
  }
  return null;
}

export const avoidableRectangleType1: Strategy = {
  id: 'avoidable-rectangle-type-1',
  name: { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' },
  difficulty: 945,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};

export const avoidableRectangleType2: Strategy = {
  id: 'avoidable-rectangle-type-2',
  name: { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' },
  difficulty: 946,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};

export const avoidableRectangleType3: Strategy = {
  id: 'avoidable-rectangle-type-3',
  name: { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' },
  difficulty: 947,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};

export const avoidableRectangleType4: Strategy = {
  id: 'avoidable-rectangle-type-4',
  name: { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' },
  difficulty: 948,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};