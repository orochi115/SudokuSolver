import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, digitsOf, popcount, HOUSES, SIZE } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

const PATTERN_NAMES: Record<string, { zh: string; en: string }> = {
  skyscraper: { zh: '摩天楼', en: 'Skyscraper' },
  kite: { zh: '双线风筝', en: '2-String Kite' },
  turbot: { zh: '多宝鱼', en: 'Turbot Fish' },
  emptyRectangle: { zh: '空矩形', en: 'Empty Rectangle' },
};

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 40,

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = findTurbot(grid, d) ?? findEmptyRectangle(grid, d);
      if (step) return step;
    }
    return null;
  },
};

function conjugatePairsForDigit(grid: Grid, bit: number): { houseIdx: number; houseType: string; cells: [number, number] }[] {
  const pairs: { houseIdx: number; houseType: string; cells: [number, number] }[] = [];
  const allHouses = [...ROWS, ...COLS, ...BOXES];
  for (let hi = 0; hi < 27; hi++) {
    const locs: number[] = [];
    for (const c of allHouses[hi]!) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) locs.push(c);
    }
    if (locs.length === 2) {
      const ht = hi < 9 ? 'row' : hi < 18 ? 'col' : 'box';
      pairs.push({ houseIdx: hi, houseType: ht, cells: [locs[0]!, locs[1]!] });
    }
  }
  return pairs;
}

function findTurbot(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);
  const pairs = conjugatePairsForDigit(grid, bit);
  const linePairs = pairs.filter(p => p.houseType === 'row' || p.houseType === 'col');

  for (let i = 0; i < linePairs.length; i++) {
    for (let j = i + 1; j < linePairs.length; j++) {
      const p1 = linePairs[i]!;
      const p2 = linePairs[j]!;
      const [a1, a2] = p1.cells;
      const [b1, b2] = p2.cells;

      const permutations: [number, number][] = [[a1, a2], [a2, a1]];
      for (const [e1, e2] of permutations) {
        const permB: [number, number][] = [[b1, b2], [b2, b1]];
        for (const [f1, f2] of permB) {
          if (e1 === f1 || !PEERS_OF[e1]!.includes(f1)) continue;
          const elims = collectPeerEliminations(grid, d, bit, e2, f2);
          if (elims.length === 0) continue;

          let patternKey = 'turbot';
          if (p1.houseType === 'row' && p2.houseType === 'row') patternKey = 'skyscraper';
          else if (p1.houseType === 'row' && p2.houseType === 'col') patternKey = 'kite';
          else if (p1.houseType === 'col' && p2.houseType === 'row') patternKey = 'kite';

          const names = PATTERN_NAMES[patternKey]!;
          return buildStep(patternKey, d, [e1!, e2!, f1!, f2!], elims, [
            { from: { cell: e1, digit: d }, to: { cell: e2, digit: d }, type: 'strong' },
            { from: { cell: e1, digit: d }, to: { cell: f1, digit: d }, type: 'weak' },
            { from: { cell: f1, digit: d }, to: { cell: f2, digit: d }, type: 'strong' },
          ]);
        }
      }
    }
  }
  return null;
}

function findEmptyRectangle(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);
  const allHouses = [...ROWS, ...COLS, ...BOXES];

  for (let bi = 0; bi < 9; bi++) {
    const boxCells = BOXES[bi]!;
    const dCells: number[] = [];
    for (const c of boxCells) {
      if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) dCells.push(c);
    }
    if (dCells.length < 3) continue;

    const rowsInBox = new Set(dCells.map(c => ROW_OF[c]!));
    const colsInBox = new Set(dCells.map(c => COL_OF[c]!));
    if (rowsInBox.size !== 2 || colsInBox.size !== 2) continue;

    const baseRow = Math.floor(bi / 3) * 3;
    const baseCol = (bi % 3) * 3;
    const boxRows = [baseRow, baseRow + 1, baseRow + 2];
    const boxCols = [baseCol, baseCol + 1, baseCol + 2];
    const erRow = boxRows.find(r => !rowsInBox.has(r))!;
    const erCol = boxCols.find(c => !colsInBox.has(c))!;

    const inRows = [...rowsInBox];
    const inCols = [...colsInBox];
    const rA = inRows[0]!;
    const rB = inRows[1]!;
    const cA = inCols[0]!;
    const cB = inCols[1]!;

    const cornerAA = rA * 9 + cA;
    const cornerAB = rA * 9 + cB;
    const cornerBA = rB * 9 + cA;
    const cornerBB = rB * 9 + cB;

    const hasD = (cell: number) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0;
    const hasDAA = hasD(cornerAA);
    const hasDAB = hasD(cornerAB);
    const hasDBA = hasD(cornerBA);
    const hasDBB = hasD(cornerBB);

    const linePairs = conjugatePairsForDigit(grid, bit).filter(p => p.houseType === 'row' || p.houseType === 'col');

    for (const pair of linePairs) {
      const [p1, p2] = pair.cells;
      const isInBox = (c: number) => BOX_OF[c]! === bi;
      const inBoxCell = isInBox(p1) ? p1 : isInBox(p2) ? p2 : null;
      const outCell = inBoxCell === p1 ? p2 : inBoxCell === p2 ? p1 : null;
      if (inBoxCell === null || outCell === null) continue;
      if (!dCells.includes(inBoxCell)) continue;

      const inRow = ROW_OF[inBoxCell]!;
      const inCol = COL_OF[inBoxCell]!;

      const diagCandidates: [number, number][] = [[rA, cA], [rA, cB], [rB, cA], [rB, cB]];
      for (const [diagRow, diagCol] of diagCandidates) {
        if (diagRow === inRow || diagCol === inCol) continue;
        const diagCell = diagRow * 9 + diagCol;
        if (!hasD(diagCell)) continue;

        const weakLink = (inRow === diagRow && inCol !== diagCol) ||
                         (inCol === diagCol && inRow !== diagRow);
        if (!weakLink) continue;

        const elims = collectPeerEliminations(grid, d, bit, outCell, diagCell);
        if (elims.length === 0) continue;

        const names = PATTERN_NAMES['emptyRectangle']!;
        return buildStep('emptyRectangle', d, [inBoxCell, outCell, diagCell], elims, [
          { from: { cell: outCell, digit: d }, to: { cell: inBoxCell, digit: d }, type: 'strong' },
          { from: { cell: inBoxCell, digit: d }, to: { cell: diagCell, digit: d }, type: 'weak' },
        ]);
      }
    }
  }
  return null;
}

function collectPeerEliminations(grid: Grid, d: number, bit: number, end1: number, end2: number): { cell: number; digit: number }[] {
  const elims: { cell: number; digit: number }[] = [];
  const peers1 = PEERS_OF[end1]!;
  const peers2 = PEERS_OF[end2]!;
  for (const p of peers1) {
    if (p === end2) continue;
    if (!peers2.includes(p)) continue;
    if (grid.get(p) === 0 && (grid.candidatesOf(p) & bit) !== 0) {
      elims.push({ cell: p, digit: d });
    }
  }
  return elims;
}

function buildStep(patternKey: string, d: number, patternCells: number[], eliminations: { cell: number; digit: number }[], links: Link[]): Step {
  const names = PATTERN_NAMES[patternKey]!;
  const cellsStr = patternCells.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join('、');
  const cellsStrEn = patternCells.map(c => `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`).join(', ');
  return {
    strategyId: 'single-digit-patterns',
    placements: [],
    eliminations,
    highlights: {
      cells: [...patternCells, ...eliminations.map(e => e.cell)],
      candidates: [
        ...patternCells.map(c => ({ cell: c, digit: d })),
        ...eliminations.map(e => ({ cell: e.cell, digit: d })),
      ],
      links,
    },
    explanation: {
      zh: `数字 ${d} 在 ${cellsStr} 形成${names.zh}模式，可排除同时看见两端点的格中候选数 ${d}。`,
      en: `Digit ${d} forms a ${names.en} pattern at ${cellsStrEn}, so ${d} can be removed from cells seeing both endpoints.`,
    },
  };
}