import { BOXES, BOX_OF, COL_OF, COLS, HOUSES, PEERS_OF, ROW_OF, ROWS, SIZE, digitsOf, maskOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { CellDigit, Link, Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export function cellName(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export function houseName(index: number): { zh: string; en: string } {
  if (index < 9) return { zh: `第 ${index + 1} 行`, en: `row ${index + 1}` };
  if (index < 18) return { zh: `第 ${index - 8} 列`, en: `column ${index - 8}` };
  return { zh: `第 ${index - 17} 宫`, en: `box ${index - 17}` };
}

export function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function candidateCells(grid: Grid, cells: readonly number[], digit: number): number[] {
  return cells.filter((cell) => grid.hasCandidate(cell, digit));
}

export function candidatesFor(cells: readonly number[], digit: number): CellDigit[] {
  return cells.map((cell) => ({ cell, digit }));
}

export function sees(a: number, b: number): boolean {
  return a !== b && PEERS_OF[a]!.includes(b);
}

export function cellsSeeingBoth(a: number, b: number): number[] {
  return PEERS_OF[a]!.filter((cell) => PEERS_OF[b]!.includes(cell)).sort((x, y) => x - y);
}

export function combinations<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  const picked: T[] = [];
  function visit(start: number): void {
    if (picked.length === size) {
      out.push([...picked]);
      return;
    }
    for (let i = start; i <= items.length - (size - picked.length); i++) {
      picked.push(items[i]!);
      visit(i + 1);
      picked.pop();
    }
  }
  visit(0);
  return out;
}

export function createEliminationStep(args: {
  strategy: Strategy;
  cells: number[];
  candidates: CellDigit[];
  eliminations: CellDigit[];
  zh: string;
  en: string;
  links?: Link[];
}): Step {
  return {
    strategyId: args.strategy.id,
    placements: [],
    eliminations: args.eliminations,
    highlights: { cells: uniqueSorted(args.cells), candidates: args.candidates, links: args.links ?? [] },
    explanation: { zh: args.zh, en: args.en },
  };
}

export function createPlacementStep(args: {
  strategy: Strategy;
  cell: number;
  digit: number;
  cells: number[];
  zh: string;
  en: string;
}): Step {
  return {
    strategyId: args.strategy.id,
    placements: [{ cell: args.cell, digit: args.digit }],
    eliminations: [],
    highlights: { cells: args.cells, candidates: [{ cell: args.cell, digit: args.digit }], links: [] },
    explanation: { zh: args.zh, en: args.en },
  };
}

export function subsetName(kind: 'naked' | 'hidden', size: number): { zh: string; en: string } {
  const zhSize = ['', '', '数对', '三数组', '四数组'][size]!;
  const enSize = ['', '', 'Pair', 'Triple', 'Quad'][size]!;
  return { zh: `${kind === 'naked' ? '显性' : '隐性'}${zhSize}`, en: `${kind === 'naked' ? 'Naked' : 'Hidden'} ${enSize}` };
}

export function makeNakedSubsetStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  const display = subsetName('naked', size);
  return {
    id,
    name: display,
    difficulty,
    apply(grid: Grid): Step | null {
      for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
        const house = HOUSES[houseIndex]!;
        const cells = house.filter((cell) => grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) >= 2 && popcount(grid.candidatesOf(cell)) <= size);
        for (const combo of combinations(cells, size)) {
          const union = combo.reduce((acc, cell) => acc | grid.candidatesOf(cell), 0);
          if (popcount(union) !== size) continue;
          const digits = digitsOf(union);
          const eliminations: CellDigit[] = [];
          for (const cell of house) {
            if (combo.includes(cell)) continue;
            for (const digit of digits) {
              if (grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
            }
          }
          if (eliminations.length === 0) continue;
          const houseLabel = houseName(houseIndex);
          return createEliminationStep({
            strategy: this,
            cells: combo,
            candidates: combo.flatMap((cell) => digitsOf(grid.candidatesOf(cell)).map((digit) => ({ cell, digit }))),
            eliminations,
            zh: `${houseLabel.zh} 中 ${combo.map(cellName).join('、')} 的候选数合计正好是 ${digits.join('/')}，因此这些数字可从同一单元其它格删除（${display.zh}）。`,
            en: `In ${houseLabel.en}, ${combo.map(cellName).join(', ')} contain exactly the candidates ${digits.join('/')}, so those digits can be removed from the other cells in the house (${display.en}).`,
          });
        }
      }
      return null;
    },
  };
}

export function makeHiddenSubsetStrategy(size: 2 | 3 | 4, id: string, difficulty: number): Strategy {
  const display = subsetName('hidden', size);
  return {
    id,
    name: display,
    difficulty,
    apply(grid: Grid): Step | null {
      const allDigits = Array.from({ length: SIZE }, (_, i) => i + 1);
      for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
        const house = HOUSES[houseIndex]!;
        for (const digits of combinations(allDigits, size)) {
          const positionsByDigit = digits.map((digit) => candidateCells(grid, house, digit));
          if (positionsByDigit.some((positions) => positions.length < 2 || positions.length > size)) continue;
          const subsetCells = uniqueSorted(positionsByDigit.flat());
          if (subsetCells.length !== size) continue;
          const subsetMask = digits.reduce((acc, digit) => acc | maskOf(digit), 0);
          const eliminations: CellDigit[] = [];
          for (const cell of subsetCells) {
            for (const digit of digitsOf(grid.candidatesOf(cell) & ~subsetMask)) eliminations.push({ cell, digit });
          }
          if (eliminations.length === 0) continue;
          const houseLabel = houseName(houseIndex);
          return createEliminationStep({
            strategy: this,
            cells: subsetCells,
            candidates: subsetCells.flatMap((cell) => digits.filter((digit) => grid.hasCandidate(cell, digit)).map((digit) => ({ cell, digit }))),
            eliminations,
            zh: `${houseLabel.zh} 中数字 ${digits.join('/')} 只出现在 ${subsetCells.map(cellName).join('、')}，因此这些格的其它候选数可删除（${display.zh}）。`,
            en: `In ${houseLabel.en}, digits ${digits.join('/')} appear only in ${subsetCells.map(cellName).join(', ')}, so other candidates can be removed from those cells (${display.en}).`,
          });
        }
      }
      return null;
    },
  };
}

function linesForOrientation(orientation: 'row' | 'column'): readonly (readonly number[])[] {
  return orientation === 'row' ? ROWS : COLS;
}

export function makeFishStrategy(size: 2 | 3 | 4, id: string, display: { zh: string; en: string }, difficulty: number): Strategy {
  return {
    id,
    name: display,
    difficulty,
    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= SIZE; digit++) {
        for (const orientation of ['row', 'column'] as const) {
          const baseLines = linesForOrientation(orientation);
          const coverName = orientation === 'row' ? 'column' : 'row';
          const candidatesByBase = baseLines.map((line) => uniqueSorted(candidateCells(grid, line, digit).map((cell) => (orientation === 'row' ? COL_OF[cell]! : ROW_OF[cell]!))));
          const eligibleBases = candidatesByBase.flatMap((covers, index) => (covers.length >= 2 && covers.length <= size ? [index] : []));
          for (const bases of combinations(eligibleBases, size)) {
            const covers = uniqueSorted(bases.flatMap((base) => candidatesByBase[base]!));
            if (covers.length !== size) continue;
            const eliminations: CellDigit[] = [];
            for (const cover of covers) {
              const coverLine = orientation === 'row' ? COLS[cover]! : ROWS[cover]!;
              for (const target of coverLine) {
                const baseIndex = orientation === 'row' ? ROW_OF[target]! : COL_OF[target]!;
                if (!bases.includes(baseIndex) && grid.hasCandidate(target, digit)) eliminations.push({ cell: target, digit });
              }
            }
            if (eliminations.length === 0) continue;
            const patternCells = bases.flatMap((base) => candidateCells(grid, baseLines[base]!, digit));
            return createEliminationStep({
              strategy: this,
              cells: patternCells,
              candidates: candidatesFor(patternCells, digit),
              eliminations,
              zh: `数字 ${digit} 在 ${size} 个基础${orientation === 'row' ? '行' : '列'}中只落入 ${size} 个覆盖${coverName === 'column' ? '列' : '行'}，因此可删除覆盖集外的同数候选（${display.zh}）。`,
              en: `For digit ${digit}, ${size} base ${orientation}s are covered by ${size} ${coverName}s, so the same digit can be eliminated from the cover sets outside the bases (${display.en}).`,
            });
          }
        }
      }
      return null;
    },
  };
}

export interface StrongLink {
  digit: number;
  a: number;
  b: number;
  houseType: 'row' | 'column' | 'box';
  houseIndex: number;
}

export function strongLinksForDigit(grid: Grid, digit: number): StrongLink[] {
  const links: StrongLink[] = [];
  HOUSES.forEach((house, index) => {
    const cells = candidateCells(grid, house, digit);
    if (cells.length !== 2) return;
    links.push({
      digit,
      a: cells[0]!,
      b: cells[1]!,
      houseType: index < 9 ? 'row' : index < 18 ? 'column' : 'box',
      houseIndex: index,
    });
  });
  return links;
}

export function linkHighlights(digit: number, cells: [number, number, number, number]): Link[] {
  return [
    { from: { cell: cells[0], digit }, to: { cell: cells[1], digit }, type: 'strong' },
    { from: { cell: cells[1], digit }, to: { cell: cells[2], digit }, type: 'weak' },
    { from: { cell: cells[2], digit }, to: { cell: cells[3], digit }, type: 'strong' },
  ];
}

export function makeTurbotStrategy(id: string, display: { zh: string; en: string }, difficulty: number, matches: (left: StrongLink, right: StrongLink, connectedA: number, connectedB: number) => boolean): Strategy {
  return {
    id,
    name: display,
    difficulty,
    apply(grid: Grid): Step | null {
      for (let digit = 1; digit <= SIZE; digit++) {
        const links = strongLinksForDigit(grid, digit);
        for (let i = 0; i < links.length; i++) {
          for (let j = i + 1; j < links.length; j++) {
            const left = links[i]!;
            const right = links[j]!;
            if ([left.a, left.b].some((cell) => cell === right.a || cell === right.b)) continue;
            const orientations: Array<[number, number, number, number]> = [
              [left.a, left.b, right.a, right.b],
              [left.a, left.b, right.b, right.a],
              [left.b, left.a, right.a, right.b],
              [left.b, left.a, right.b, right.a],
            ];
            for (const [endpointA, connectedA, connectedB, endpointB] of orientations) {
              if (!sees(connectedA, connectedB) || !matches(left, right, connectedA, connectedB)) continue;
              const eliminations = cellsSeeingBoth(endpointA, endpointB)
                .filter((cell) => ![endpointA, endpointB, connectedA, connectedB].includes(cell) && grid.hasCandidate(cell, digit))
                .map((cell) => ({ cell, digit }));
              if (eliminations.length === 0) continue;
              return createEliminationStep({
                strategy: this,
                cells: [endpointA, connectedA, connectedB, endpointB],
                candidates: candidatesFor([endpointA, connectedA, connectedB, endpointB], digit),
                eliminations,
                links: linkHighlights(digit, [endpointA, connectedA, connectedB, endpointB]),
                zh: `数字 ${digit} 构成${display.zh}：两个强链由一个弱链连接，端点至少一个为真，因此可从同时看见两端点的格中删除 ${digit}。`,
                en: `Digit ${digit} forms a ${display.en}: two strong links connected by a weak link make at least one endpoint true, so ${digit} is removed from cells seeing both endpoints.`,
              });
            }
          }
        }
      }
      return null;
    },
  };
}

export function sameBox(a: number, b: number): boolean {
  return BOX_OF[a] === BOX_OF[b];
}

export function sameRow(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b];
}

export function sameColumn(a: number, b: number): boolean {
  return COL_OF[a] === COL_OF[b];
}

export function boxCells(box: number): readonly number[] {
  return BOXES[box]!;
}
