import { ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, maskOf, popcount, digitsOf } from '../grid.js';
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

function isGiven(grid: Grid, cell: number): boolean {
  return grid.get(cell) !== 0;
}

function makeARType(id: string, name: { zh: string; en: string }, difficulty: number, typeFn: (grid: Grid, cells: [number, number, number, number], strategyId: string) => Step | null): Strategy {
  return {
    id,
    name,
    difficulty,
    tieBreak: ['cell-index'],
    apply(grid: Grid): Step | null {
      for (const rect of allRectangles()) {
        const step = typeFn(grid, rect, id);
        if (step) return step;
      }
      return null;
    },
  };
}

function tryARType1(grid: Grid, [c11, c12, c21, c22]: [number, number, number, number], strategyId: string): Step | null {
  const cells = [c11, c12, c21, c22];
  const givens = cells.filter((c) => isGiven(grid, c));
  if (givens.length !== 1) return null;

  const emptyCells = cells.filter((c) => !isGiven(grid, c));
  const masks = emptyCells.map((c) => grid.candidatesOf(c));
  const intersect = masks[0]! & masks[1]! & masks[2]!;
  if (popcount(intersect) !== 2) return null;

  const exactMatch = emptyCells.filter((c, i) => masks[i] === intersect);
  if (exactMatch.length !== 2) return null;

  const floor = emptyCells.find((c, i) => masks[i] !== intersect && masks[i] !== 0);
  if (floor === undefined) return null;

  const urDigits = digitsOf(intersect);
  const elims = urDigits
    .filter((d) => grid.hasCandidate(floor, d))
    .map((d) => ({ cell: floor, digit: d }));
  if (elims.length === 0) return null;

  const [x, y] = urDigits as [number, number];
  return {
    strategyId,
    placements: [],
    eliminations: elims,
    highlights: {
      cells,
      candidates: cells.flatMap((c) => isGiven(grid, c) ? [] : digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: {
      zh: `可避免矩形 Type1：三个未填格都含 {${x},${y}}，若第四个未填格（${cellLabel(floor)}）也仅含 {${x},${y}} 则形成双解可避免矩形；消去该格的 ${urDigits.join(',')}。`,
      en: `Avoidable Rectangle Type 1: three unsolved cells share {${x},${y}}; if the fourth (${cellLabel(floor)}) also had only {${x},${y}} it would create an avoidable deadly pattern; eliminate ${urDigits.join(',')} from the floor.`,
    },
  };
}

function tryARType2(grid: Grid, [c11, c12, c21, c22]: [number, number, number, number], strategyId: string): Step | null {
  const cells = [c11, c12, c21, c22];
  const givens = cells.filter((c) => isGiven(grid, c));
  if (givens.length !== 1) return null;

  const emptyCells = cells.filter((c) => !isGiven(grid, c));
  const masks = emptyCells.map((c) => grid.candidatesOf(c));
  const intersect = masks[0]! & masks[1]! & masks[2]!;
  if (popcount(intersect) !== 2) continue;

  const roofCells = emptyCells.filter((_, i) => masks[i] === intersect);
  const floorCells = emptyCells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
  if (roofCells.length !== 1 || floorCells.length !== 1) return null;

  const [x, y] = digitsOf(intersect) as [number, number];
  const floor = floorCells[0]!;
  const floorExtra = grid.candidatesOf(floor) & ~intersect;
  if (popcount(floorExtra) !== 1) return null;
  const z = digitsOf(floorExtra)[0]!;

  const peersRoof = new Set(PEERS_OF[roofCells[0]!]!);
  const elims: { cell: number; digit: number }[] = [];
  for (const c of PEERS_OF[floor]!) {
    if (!peersRoof.has(c)) continue;
    if (cells.includes(c)) continue;
    if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
  }
  if (elims.length === 0) return null;

  return {
    strategyId,
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...cells, ...elims.map((e) => e.cell)],
      candidates: cells.flatMap((c) => isGiven(grid, c) ? [] : digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
      links: [],
    },
    explanation: {
      zh: `可避免矩形 Type2：底层格 ${cellLabel(floor)} 含额外候选 ${z}（AR对 {${x},${y}}），${z} 必须在此格中；消去公共可见格的 ${z}。`,
      en: `Avoidable Rectangle Type 2: floor ${cellLabel(floor)} has extra candidate ${z} (AR pair {${x},${y}}); ${z} must be in that cell; eliminate ${z} from common peers.`,
    },
  };
}

function tryARType3(grid: Grid, [c11, c12, c21, c22]: [number, number, number, number], strategyId: string): Step | null {
  const cells = [c11, c12, c21, c22];
  const givens = cells.filter((c) => isGiven(grid, c));
  if (givens.length !== 1) return null;

  const emptyCells = cells.filter((c) => !isGiven(grid, c));
  const masks = emptyCells.map((c) => grid.candidatesOf(c));
  const intersect = masks[0]! & masks[1]! & masks[2]!;
  if (popcount(intersect) !== 2) continue;

  const roofCells = emptyCells.filter((_, i) => masks[i] === intersect);
  const floorCells = emptyCells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
  if (roofCells.length !== 1 || floorCells.length !== 1) return null;

  const [x, y] = digitsOf(intersect) as [number, number];
  const floor = floorCells[0]!;
  const floorExtra = grid.candidatesOf(floor) & ~intersect;
  if (popcount(floorExtra) < 1) continue;
  const extraDigits = digitsOf(floorExtra);

  for (const houseIdx of [ROW_OF[floor]!, 9 + COL_OF[floor]!, 18 + BOX_OF[floor]!]) {
    const house = HOUSES[houseIdx]!;
    const outsideCells = house.filter((c) => {
      if (cells.includes(c)) return false;
      if (grid.get(c) !== 0) return false;
      return (grid.candidatesOf(c) & floorExtra) !== 0;
    });
    if (outsideCells.length < 1) continue;

    for (const size of [2, 3] as const) {
      for (const combo of combinations(outsideCells, size - 1)) {
        let totalMask = floorExtra;
        for (const c of combo) totalMask |= grid.candidatesOf(c);
        if (popcount(totalMask) === size) {
          const elims: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (cells.includes(c) || combo.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of digitsOf(grid.candidatesOf(c) & totalMask)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...cells, ...combo, ...elims.map((e) => e.cell)],
                candidates: cells.flatMap((c) => isGiven(grid, c) ? [] : digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                links: [],
              },
              explanation: {
                zh: `可避免矩形 Type3：AR对 {${x},${y}} 的额外候选形成子集，消去 ${elims.length} 个候选。`,
                en: `Avoidable Rectangle Type 3: extra candidates form a subset with outside cells; eliminate ${elims.length} candidates.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function tryARType4(grid: Grid, [c11, c12, c21, c22]: [number, number, number, number], strategyId: string): Step | null {
  const cells = [c11, c12, c21, c22];
  const givens = cells.filter((c) => isGiven(grid, c));
  if (givens.length !== 1) return null;

  const emptyCells = cells.filter((c) => !isGiven(grid, c));
  const masks = emptyCells.map((c) => grid.candidatesOf(c));
  const intersect = masks[0]! & masks[1]! & masks[2]!;
  if (popcount(intersect) !== 2) continue;

  const roofCells = emptyCells.filter((_, i) => masks[i] === intersect);
  const floorCells = emptyCells.filter((_, i) => {
    const m = masks[i]!;
    return m !== intersect && (m & intersect) === intersect;
  });
  if (roofCells.length !== 1 || floorCells.length !== 1) return null;

  const [x, y] = digitsOf(intersect) as [number, number];
  const floor = floorCells[0]!;

  for (const [locked, elim] of [[x, y], [y, x]] as [number, number][]) {
    const lockedBit = maskOf(locked);
    for (const houseIdx of [ROW_OF[floor]!, 9 + COL_OF[floor]!]) {
      const house = HOUSES[houseIdx]!;
      const lockedInHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & lockedBit) !== 0);
      const nonFloor = lockedInHouse.filter((c) => !floorCells.includes(c));
      if (nonFloor.length !== 0) continue;

      if (grid.hasCandidate(floor, elim)) {
        return {
          strategyId,
          placements: [],
          eliminations: [{ cell: floor, digit: elim }],
          highlights: {
            cells,
            candidates: cells.flatMap((c) => isGiven(grid, c) ? [] : digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `可避免矩形 Type4：${locked} 在${houseIdx < 9 ? '该' : ''}行/列中仅出现在 AR 底层格中，底层格必须为 ${locked}，消去 ${elim}。`,
            en: `Avoidable Rectangle Type 4: ${locked} is confined to floor in the shared house; floor must be ${locked}; eliminate ${elim}.`,
          },
        };
      }
    }
  }
  return null;
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

export const avoidableRectangleType1 = makeARType('avoidable-rectangle-type-1', { zh: '可避免矩形 Type 1', en: 'Avoidable Rectangle Type 1' }, 945, tryARType1);
export const avoidableRectangleType2 = makeARType('avoidable-rectangle-type-2', { zh: '可避免矩形 Type 2', en: 'Avoidable Rectangle Type 2' }, 945, tryARType2);
export const avoidableRectangleType3 = makeARType('avoidable-rectangle-type-3', { zh: '可避免矩形 Type 3', en: 'Avoidable Rectangle Type 3' }, 945, tryARType3);
export const avoidableRectangleType4 = makeARType('avoidable-rectangle-type-4', { zh: '可避免矩形 Type 4', en: 'Avoidable Rectangle Type 4' }, 945, tryARType4);