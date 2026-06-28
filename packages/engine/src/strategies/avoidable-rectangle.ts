import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const c11 = r1 * 9 + c1;
          const c12 = r1 * 9 + c2;
          const c21 = r2 * 9 + c1;
          const c22 = r2 * 9 + c2;
          const boxes = new Set([BOX_OF[c11]!, BOX_OF[c12]!, BOX_OF[c21]!, BOX_OF[c22]!]);
          if (boxes.size !== 2) continue;
          yield [c11, c12, c21, c22];
        }
      }
    }
  }
}

function wouldFormDeadlyPattern(cellValues: number[], urDigit: number, targetIdx: number): boolean {
  const test = [...cellValues];
  test[targetIdx] = urDigit;
  if (test.some(v => v === 0)) return false;
  return (
    (test[0]! !== test[1]!) &&
    (test[2]! !== test[3]!) &&
    (test[0]! !== test[2]!) &&
    (test[1]! !== test[3]!)
  );
}

function isValidArrangement(values: number[]): boolean {
  const v = (i: number) => (i >= 0 && i < values.length) ? values[i]! : 0;
  if (v(0) !== 0 && v(1) !== 0 && v(0) === v(1)) return false;
  if (v(2) !== 0 && v(3) !== 0 && v(2) === v(3)) return false;
  if (v(0) !== 0 && v(2) !== 0 && v(0) === v(2)) return false;
  if (v(1) !== 0 && v(3) !== 0 && v(1) === v(3)) return false;
  return true;
}

function tryARType1(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map(c => grid.get(c));
    const solvedCount = values.filter(v => v !== 0).length;
    if (solvedCount !== 3) continue;

    const solvedVals = values.filter(v => v !== 0);
    if (new Set(solvedVals).size !== 2) continue;
    if (!isValidArrangement(values)) continue;

    const r1 = ROW_OF[c11]!;
    const r2 = ROW_OF[c21]!;
    const c1 = COL_OF[c11]!;
    const c2 = COL_OF[c12]!;

    const [x, y] = [...new Set(solvedVals)] as [number, number];
    const unsolvedIdx = values.indexOf(0);
    const unsolvedCell = cells[unsolvedIdx]!;
    const urMask = maskOf(x) | maskOf(y);

    if (!(grid.candidatesOf(unsolvedCell) & urMask)) continue;
    if (popcount(grid.candidatesOf(unsolvedCell)) <= 2) continue;

    const cellSet = new Set(cells);
    const urBitX = maskOf(x);
    const urBitY = maskOf(y);
    function confinedToRect(digit: number, bit: number): boolean {
      const rows = [r1, r2];
      const cols = [c1, c2];
      for (const r of rows) {
        let count = 0;
        for (let i = 0; i < 9; i++) {
          const cc = r * 9 + i;
          if (cellSet.has(cc)) { count++; continue; }
          if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit)) count++;
          else if (grid.get(cc) === digit) count++;
        }
        if (count > 2) return false;
      }
      for (const c of cols) {
        let count = 0;
        for (let i = 0; i < 9; i++) {
          const cc = i * 9 + c;
          if (cellSet.has(cc)) { count++; continue; }
          if (grid.get(cc) === 0 && (grid.candidatesOf(cc) & bit)) count++;
          else if (grid.get(cc) === digit) count++;
        }
        if (count > 2) return false;
      }
      return true;
    }

    const eliminations: { cell: number; digit: number }[] = [];
    if (grid.hasCandidate(unsolvedCell, x) && wouldFormDeadlyPattern(values, x, unsolvedIdx) && confinedToRect(x, urBitX)) {
      eliminations.push({ cell: unsolvedCell, digit: x });
    }
    if (grid.hasCandidate(unsolvedCell, y) && wouldFormDeadlyPattern(values, y, unsolvedIdx) && confinedToRect(y, urBitY)) {
      eliminations.push({ cell: unsolvedCell, digit: y });
    }

    if (eliminations.length === 0) continue;

    return {
      strategyId,
      placements: [],
      eliminations,
      highlights: {
        cells: [...cells],
        candidates: cells.flatMap(c => grid.get(c) === 0 ? digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })) : [{ cell: c, digit: grid.get(c) }]),
        links: [],
      },
      explanation: {
        zh: `可避矩形 Type1：三格已填 {${x},${y}}；第四格 ${cellLabel(unsolvedCell)} 填 ${x} 或 ${y} 将形成致命模式，消去之。`,
        en: `Avoidable Rectangle Type 1: three cells solved with {${x},${y}}; placing ${x} or ${y} in ${cellLabel(unsolvedCell)} would create deadly pattern; eliminate.`,
      },
    };
  }
  return null;
}

function tryARType2(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map(c => grid.get(c));
    const solvedCount = values.filter(v => v !== 0).length;
    if (solvedCount !== 2) continue;

    if (!isValidArrangement(values)) continue;

    const solvedCells = cells.filter((_, i) => values[i] !== 0);
    const solvedVals = solvedCells.map(c => grid.get(c));
    if (new Set(solvedVals).size !== 2) continue;
    const [x, y] = [...new Set(solvedVals)] as [number, number];
    const urMask = maskOf(x) | maskOf(y);

    const unsolvedCells = cells.filter((_, i) => values[i] === 0);
    if (unsolvedCells.length !== 2) continue;

    const extras = unsolvedCells.map(c => {
      const m = grid.candidatesOf(c);
      if (!(m & maskOf(x)) || !(m & maskOf(y))) return null;
      return { cell: c, extra: m & ~urMask };
    });
    if (extras.some(e => e === null || popcount(e!.extra) !== 1)) continue;
    const z = digitsOf(extras[0]!.extra)[0]!;
    if (extras[1]!.extra !== extras[0]!.extra) continue;

    const unsolvedIdx0 = cells.indexOf(unsolvedCells[0]!);
    const unsolvedIdx1 = cells.indexOf(unsolvedCells[1]!);
    if (!wouldFormDeadlyPattern(values, x, unsolvedIdx0) && !wouldFormDeadlyPattern(values, y, unsolvedIdx0)) continue;
    if (!wouldFormDeadlyPattern(values, x, unsolvedIdx1) && !wouldFormDeadlyPattern(values, y, unsolvedIdx1)) continue;

    const eliminations: { cell: number; digit: number }[] = [];
    const peers0 = new Set(PEERS_OF[unsolvedCells[0]!]!);
    for (const c of PEERS_OF[unsolvedCells[1]!]!) {
      if (!peers0.has(c)) continue;
      if (c === unsolvedCells[0] || c === unsolvedCells[1] || solvedCells.includes(c)) continue;
      if (grid.hasCandidate(c, z)) eliminations.push({ cell: c, digit: z });
    }

    if (eliminations.length > 0) {
      return {
        strategyId,
        placements: [],
        eliminations,
        highlights: {
          cells: [...cells, ...eliminations.map(e => e.cell)],
          candidates: cells.flatMap(c => grid.get(c) === 0 ? digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })) : [{ cell: c, digit: grid.get(c) }]),
          links: [],
        },
        explanation: {
          zh: `可避矩形 Type2：两未填格均含额外 ${z}（UR对 {${x},${y}}）；消去两格公共可见格中的 ${z}。`,
          en: `Avoidable Rectangle Type 2: both unsolved cells have extra ${z} (UR pair {${x},${y}}); eliminate ${z} from common peers.`,
        },
      };
    }
  }
  return null;
}

function tryARType3(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map(c => grid.get(c));
    const solvedCount = values.filter(v => v !== 0).length;
    if (solvedCount !== 2) continue;

    if (!isValidArrangement(values)) continue;

    const solvedCells = cells.filter((_, i) => values[i] !== 0);
    const solvedVals = solvedCells.map(c => grid.get(c));
    if (new Set(solvedVals).size !== 2) continue;
    const [x, y] = [...new Set(solvedVals)] as [number, number];
    const urMask = maskOf(x) | maskOf(y);

    const floorCells = cells.filter((_, i) => values[i] === 0);
    if (floorCells.length !== 2) continue;

    const fc0Extra = grid.candidatesOf(floorCells[0]!) & ~urMask;
    const fc1Extra = grid.candidatesOf(floorCells[1]!) & ~urMask;
    if (fc0Extra === 0 || fc1Extra === 0) continue;

    const unsolvedIdx0 = cells.indexOf(floorCells[0]!);
    const unsolvedIdx1 = cells.indexOf(floorCells[1]!);
    if (!wouldFormDeadlyPattern(values, x, unsolvedIdx0) && !wouldFormDeadlyPattern(values, y, unsolvedIdx0)) continue;
    if (!wouldFormDeadlyPattern(values, x, unsolvedIdx1) && !wouldFormDeadlyPattern(values, y, unsolvedIdx1)) continue;

    const floorExtraMask = fc0Extra | fc1Extra;
    const extraDigits = digitsOf(floorExtraMask);
    if (extraDigits.length < 2) continue;

    const sharedHouses = [ROW_OF[floorCells[0]!]!, 9 + COL_OF[floorCells[0]!]!, 18 + BOX_OF[floorCells[0]!]!]
      .filter(h => [ROW_OF[floorCells[1]!]!, 9 + COL_OF[floorCells[1]!]!, 18 + BOX_OF[floorCells[1]!]!].includes(h));

    for (const houseIdx of sharedHouses) {
      const house = HOUSES[houseIdx]!;
      const otherCells = house.filter(c =>
        !cells.includes(c) && grid.get(c) === 0 &&
        (grid.candidatesOf(c) & floorExtraMask) !== 0 &&
        (grid.candidatesOf(c) & ~(floorExtraMask | urMask)) === 0,
      );

      const needed = extraDigits.length;
      if (needed <= 0 || needed > otherCells.length + 2) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      for (const c of house) {
        if (cells.includes(c) || otherCells.includes(c)) continue;
        if (grid.get(c) !== 0) continue;
        for (const d of extraDigits) {
          if (grid.hasCandidate(c, d)) eliminations.push({ cell: c, digit: d });
        }
      }

      if (eliminations.length > 0) {
        return {
          strategyId,
          placements: [],
          eliminations,
          highlights: {
            cells: [...cells, ...eliminations.map(e => e.cell)],
            candidates: cells.flatMap(c => grid.get(c) === 0 ? digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })) : [{ cell: c, digit: grid.get(c) }]),
            links: [],
          },
          explanation: {
            zh: `可避矩形 Type3：UR对 {${x},${y}}，底层额外数字与外部格构成锁定集；消去宫中相关候选。`,
            en: `Avoidable Rectangle Type 3: UR pair {${x},${y}}; floor extra digits form locked set with external cells; eliminate related candidates.`,
          },
        };
      }
    }
  }
  return null;
}

function tryARType4(grid: Grid, strategyId: string): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const values = cells.map(c => grid.get(c));
    const solvedCount = values.filter(v => v !== 0).length;
    if (solvedCount !== 2) continue;

    if (!isValidArrangement(values)) continue;

    const solvedCells = cells.filter((_, i) => values[i] !== 0);
    const solvedVals = solvedCells.map(c => grid.get(c));
    if (new Set(solvedVals).size !== 2) continue;
    const [x, y] = [...new Set(solvedVals)] as [number, number];

    const floorCells = cells.filter((_, i) => values[i] === 0);
    if (floorCells.length !== 2) continue;

    const unsolvedIdx0 = cells.indexOf(floorCells[0]!);
    const unsolvedIdx1 = cells.indexOf(floorCells[1]!);
    if (!wouldFormDeadlyPattern(values, x, unsolvedIdx0) && !wouldFormDeadlyPattern(values, y, unsolvedIdx0)) continue;
    if (!wouldFormDeadlyPattern(values, x, unsolvedIdx1) && !wouldFormDeadlyPattern(values, y, unsolvedIdx1)) continue;

    for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
      const lockedBit = maskOf(locked);
      const commonHouses = [ROW_OF[floorCells[0]!]!, 9 + COL_OF[floorCells[0]!]!, 18 + BOX_OF[floorCells[0]!]!]
        .filter(h => [ROW_OF[floorCells[1]!]!, 9 + COL_OF[floorCells[1]!]!, 18 + BOX_OF[floorCells[1]!]!].includes(h));

      for (const houseIdx of commonHouses) {
        const house = HOUSES[houseIdx]!;
        const lockedInHouse = house.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
        const nonFloor = lockedInHouse.filter(c => !floorCells.includes(c));
        if (nonFloor.length !== 0) continue;

        const eliminations = floorCells
          .filter(c => grid.hasCandidate(c, elim))
          .map(c => ({ cell: c, digit: elim }));

        if (eliminations.length > 0) {
          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: {
              cells: [...cells],
              candidates: cells.flatMap(c => grid.get(c) === 0 ? digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })) : [{ cell: c, digit: grid.get(c) }]),
              links: [],
            },
            explanation: {
              zh: `可避矩形 Type4：${locked} 在底层格共享宫中只出现在底层格；消去底层格中的 ${elim}。`,
              en: `Avoidable Rectangle Type 4: ${locked} confined to floor cells in shared house; eliminate ${elim} from floor cells.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function makeArStrategy(id: string, name: { zh: string; en: string }, difficulty: number, applyFn: (grid: Grid, id: string) => Step | null): Strategy {
  return { id, name, difficulty, tieBreak: ['cell-index'] as const, apply(grid: Grid) { return applyFn(grid, id); } };
}

export const avoidableRectangleType1 = makeArStrategy('avoidable-rectangle-type-1', { zh: '可避矩形 Type 1', en: 'Avoidable Rectangle Type 1' }, 945, tryARType1);
export const avoidableRectangleType2 = makeArStrategy('avoidable-rectangle-type-2', { zh: '可避矩形 Type 2', en: 'Avoidable Rectangle Type 2' }, 946, tryARType2);
export const avoidableRectangleType3 = makeArStrategy('avoidable-rectangle-type-3', { zh: '可避矩形 Type 3', en: 'Avoidable Rectangle Type 3' }, 947, tryARType3);
export const avoidableRectangleType4 = makeArStrategy('avoidable-rectangle-type-4', { zh: '可避矩形 Type 4', en: 'Avoidable Rectangle Type 4' }, 948, tryARType4);