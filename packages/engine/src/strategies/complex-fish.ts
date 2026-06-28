import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, CELLS,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function evaluateFish(
  grid: Grid,
  d: number,
  defCells: number[],
  defHouses: { type: string; index: number }[],
  secCells: readonly (readonly number[])[],
  secLabels: { type: string; index: number }[],
  stratId: string,
  nameZh: string,
  nameEn: string,
): Step | null {
  const bit = maskOf(d);

  const baseCandSet = new Set<number>();
  const endoFins: number[] = [];
  for (const c of defCells) {
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    if (baseCandSet.has(c)) {
      if (!endoFins.includes(c)) endoFins.push(c);
    } else {
      baseCandSet.add(c);
    }
  }
  const baseCands = [...baseCandSet];

  if (baseCands.length < defHouses.length) return null;

  const secCellSet = new Set<number>();
  for (const h of secCells) {
    for (const c of h) secCellSet.add(c);
  }

  const exoFins: number[] = [];
  for (const c of baseCands) {
    if (!secCellSet.has(c)) exoFins.push(c);
  }

  const allFins = [...endoFins, ...exoFins];
  if (allFins.length > 3) return null;
  if (allFins.length > 0) {
    const finBoxes = new Set(allFins.map((c) => BOX_OF[c]!));
    if (finBoxes.size > 1) return null;
  }

  const surplus: number[] = [];
  const surplusSeen = new Set<number>();
  for (const h of secCells) {
    for (const c of h) {
      if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
      if (!baseCandSet.has(c) && !surplusSeen.has(c)) {
        surplusSeen.add(c);
        surplus.push(c);
      }
    }
  }
  if (surplus.length === 0) return null;

  const elims: { cell: number; digit: number }[] = [];
  for (const c of surplus) {
    if (allFins.length === 0) {
      elims.push({ cell: c, digit: d });
    } else if (allFins.every((f) => PEERS_OF[c]!.includes(f))) {
      elims.push({ cell: c, digit: d });
    }
  }
  if (elims.length === 0) return null;

  const defLabel = defHouses.map((h) => `${h.type[0]}${h.index + 1}`).join(',');
  const secLabel = secLabels.map((h) => `${h.type[0]}${h.index + 1}`).join(',');

  return {
    strategyId: stratId,
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...new Set([...baseCands, ...allFins, ...elims.map((e) => e.cell)])],
      candidates: [
        ...baseCands.map((c) => ({ cell: c, digit: d })),
        ...allFins.map((c) => ({ cell: c, digit: d })),
        ...elims,
      ],
      links: [],
    },
    explanation: {
      zh: `${nameZh}（数字${d}，大小${defHouses.length}）：基础集 {${defLabel}} vs 覆盖集 {${secLabel}}；${allFins.length > 0 ? `鳍 ${allFins.map(cellLabel).join(',')}` : '无鳍'}；从覆盖集多余候选中${allFins.length > 0 ? '（看到所有鳍的格中）' : ''}消去 ${d}。`,
      en: `${nameEn} (digit ${d}, size ${defHouses.length}): defining {${defLabel}} vs secondary {${secLabel}}; ${allFins.length > 0 ? `fins at ${allFins.map(cellLabel).join(',')}` : 'fin-free'}; eliminate ${d} from surplus cover candidates${allFins.length > 0 ? ' seeing all fins' : ''}.`,
    },
  };
}

function tryFrankenFish(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  let totalCands = 0;
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) totalCands++;
  }
  if (totalCands > 24) return null;

  const activeRows: number[] = [];
  const activeCols: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (ROWS[i]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit))) activeRows.push(i);
    if (COLS[i]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit))) activeCols.push(i);
  }

  for (let ri = 0; ri < activeRows.length - 2; ri++) {
    for (let rj = ri + 1; rj < activeRows.length - 1; rj++) {
      for (let rk = rj + 1; rk < activeRows.length; rk++) {
        const r1 = activeRows[ri]!, r2 = activeRows[rj]!, r3 = activeRows[rk]!;
        const defCells = [...ROWS[r1]!, ...ROWS[r2]!, ...ROWS[r3]!];
        const defHouses = [
          { type: 'row', index: r1 },
          { type: 'row', index: r2 },
          { type: 'row', index: r3 },
        ];

        for (let b = 0; b < 9; b++) {
          for (let ci = 0; ci < activeCols.length - 1; ci++) {
            for (let cj = ci + 1; cj < activeCols.length; cj++) {
              const c1 = activeCols[ci]!, c2 = activeCols[cj]!;
              const secCells = [COLS[c1]!, COLS[c2]!, BOXES[b]!];
              const secLabels = [
                { type: 'col', index: c1 },
                { type: 'col', index: c2 },
                { type: 'box', index: b },
              ];
              const result = evaluateFish(grid, d, defCells, defHouses, secCells, secLabels,
                'franken-fish', '弗兰肯鱼', 'Franken Fish');
              if (result) return result;
            }
          }
        }
      }
    }
  }

  for (let ci = 0; ci < activeCols.length - 2; ci++) {
    for (let cj = ci + 1; cj < activeCols.length - 1; cj++) {
      for (let ck = cj + 1; ck < activeCols.length; ck++) {
        const c1 = activeCols[ci]!, c2 = activeCols[cj]!, c3 = activeCols[ck]!;
        const defCells = [...COLS[c1]!, ...COLS[c2]!, ...COLS[c3]!];
        const defHouses = [
          { type: 'col', index: c1 },
          { type: 'col', index: c2 },
          { type: 'col', index: c3 },
        ];

        for (let b = 0; b < 9; b++) {
          for (let ri = 0; ri < activeRows.length - 1; ri++) {
            for (let rj = ri + 1; rj < activeRows.length; rj++) {
              const r1 = activeRows[ri]!, r2 = activeRows[rj]!;
              const secCells = [ROWS[r1]!, ROWS[r2]!, BOXES[b]!];
              const secLabels = [
                { type: 'row', index: r1 },
                { type: 'row', index: r2 },
                { type: 'box', index: b },
              ];
              const result = evaluateFish(grid, d, defCells, defHouses, secCells, secLabels,
                'franken-fish', '弗兰肯鱼', 'Franken Fish');
              if (result) return result;
            }
          }
        }
      }
    }
  }

  return null;
}

function tryMutantFish(grid: Grid, d: number): Step | null {
  const bit = maskOf(d);

  let totalCands = 0;
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) totalCands++;
  }
  if (totalCands > 18) return null;

  const activeHouses: { type: string; index: number; cells: readonly number[] }[] = [];
  for (let i = 0; i < 9; i++) {
    if (ROWS[i]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit)))
      activeHouses.push({ type: 'row', index: i, cells: ROWS[i]! });
    if (COLS[i]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit)))
      activeHouses.push({ type: 'col', index: i, cells: COLS[i]! });
    if (BOXES[i]!.some((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit)))
      activeHouses.push({ type: 'box', index: i, cells: BOXES[i]! });
  }

  const n = activeHouses.length;
  if (n < 6 || n > 16) return null;

  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        const def = [activeHouses[i]!, activeHouses[j]!, activeHouses[k]!];
        const defTypes = new Set(def.map((h) => h.type));
        if (!defTypes.has('box')) continue;
        const lineTypes = def.filter((h) => h.type !== 'box').map((h) => h.type);
        if (lineTypes.length > 0 && new Set(lineTypes).size === 1) continue;

        const defCells = def.flatMap((h) => [...h.cells]);
        const defHouses = def.map((h) => ({ type: h.type, index: h.index }));

        for (let a = 0; a < n - 2; a++) {
          if (a === i || a === j || a === k) continue;
          for (let b2 = a + 1; b2 < n - 1; b2++) {
            if (b2 === i || b2 === j || b2 === k) continue;
            for (let c = b2 + 1; c < n; c++) {
              if (c === i || c === j || c === k) continue;
              const sec = [activeHouses[a]!, activeHouses[b2]!, activeHouses[c]!];
              const secCells = sec.map((h) => h.cells);
              const secLabels = sec.map((h) => ({ type: h.type, index: h.index }));

              const result = evaluateFish(grid, d, defCells, defHouses, secCells, secLabels,
                'mutant-fish', '变异鱼', 'Mutant Fish');
              if (result) return result;
            }
          }
        }
      }
    }
  }

  return null;
}

export const frankenFish: Strategy = {
  id: 'franken-fish',
  name: { zh: '弗兰肯鱼', en: 'Franken Fish' },
  difficulty: 1080,
  tieBreak: ['digit', 'size'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryFrankenFish(grid, d);
      if (step) return step;
    }
    return null;
  },
};

export const mutantFish: Strategy = {
  id: 'mutant-fish',
  name: { zh: '变异鱼', en: 'Mutant Fish' },
  difficulty: 1085,
  tieBreak: ['digit', 'size'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryMutantFish(grid, d);
      if (step) return step;
    }
    return null;
  },
};
