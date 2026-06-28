import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf, ROWS, COLS, BOXES,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

interface XWNode {
  strongA: number;
  strongB: number;
  weakR: number;
  weakS: number;
  digit: number;
  exitCell: number;
}

function findXWNodes(grid: Grid, d: number): XWNode[] {
  const bit = maskOf(d);
  const nodes: XWNode[] = [];

  for (const house of HOUSES) {
    const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
    if (inHouse.length !== 2) continue;
    const [p, q] = inHouse;

    const boxP = BOX_OF[p!]!;
    const boxQ = BOX_OF[q!]!;

    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
      if (cell === p! || cell === q!) continue;
      if (!PEERS_OF[p!]!.includes(cell) && !PEERS_OF[q!]!.includes(cell)) continue;

      for (let cell2 = cell + 1; cell2 < CELLS; cell2++) {
        if (grid.get(cell2) !== 0 || !(grid.candidatesOf(cell2) & bit)) continue;
        if (cell2 === p! || cell2 === q!) continue;

        const boxR = BOX_OF[cell]!;
        const boxS = BOX_OF[cell2]!;
        const boxes = new Set([boxP, boxQ, boxR, boxS]);
        if (boxes.size < 2) continue;

        const rSeesP = PEERS_OF[cell]!.includes(p!);
        const rSeesQ = PEERS_OF[cell]!.includes(q!);
        const sSeesP = PEERS_OF[cell2]!.includes(p!);
        const sSeesQ = PEERS_OF[cell2]!.includes(q!);

        if (rSeesP && sSeesQ && !rSeesQ && !sSeesP) {
          for (let exit = 0; exit < CELLS; exit++) {
            if (grid.get(exit) !== 0 || !(grid.candidatesOf(exit) & bit)) continue;
            if (exit === p! || exit === q! || exit === cell || exit === cell2) continue;
            if (PEERS_OF[p!]!.includes(exit) || PEERS_OF[q!]!.includes(exit)) continue;
            if (!PEERS_OF[cell]!.includes(exit) && !PEERS_OF[cell2]!.includes(exit)) continue;

            const exitSeesR = PEERS_OF[exit]!.includes(cell);
            const exitSeesS = PEERS_OF[exit]!.includes(cell2);
            if (!exitSeesR && !exitSeesS) continue;

            nodes.push({
              strongA: p!,
              strongB: q!,
              weakR: cell,
              weakS: cell2,
              digit: d,
              exitCell: exit,
            });
          }
        }
      }
    }
  }

  return nodes;
}

function tryAICWithExoticLinks(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    const xwNodes = findXWNodes(grid, d);
    if (xwNodes.length === 0) continue;

    const strongLinks: [number, number][] = [];
    for (const house of HOUSES) {
      const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
      if (inHouse.length === 2) {
        strongLinks.push([inHouse[0]!, inHouse[1]!]);
      }
    }

    for (const xw of xwNodes) {
      for (const [sa, sb] of strongLinks) {
        const xwCells = [xw.strongA, xw.strongB, xw.weakR, xw.weakS, xw.exitCell];
        if (xwCells.includes(sa) || xwCells.includes(sb)) continue;

        for (const [startCell, endCandidate] of [[sa, sb], [sb, sa]] as [number, number][]) {
          if (!PEERS_OF[startCell]!.includes(xw.weakR) && !PEERS_OF[startCell]!.includes(xw.weakS)) continue;
          if (!PEERS_OF[endCandidate]!.includes(xw.exitCell)) continue;

          const elims: { cell: number; digit: number }[] = [];
          const peersStart = new Set(PEERS_OF[startCell]!);
          const peersEnd = new Set(PEERS_OF[endCandidate]!);
          for (let cell = 0; cell < CELLS; cell++) {
            if (grid.get(cell) !== 0 || !(grid.candidatesOf(cell) & bit)) continue;
            if (xwCells.includes(cell) || cell === startCell || cell === endCandidate) continue;
            if (peersStart.has(cell) && peersEnd.has(cell)) {
              elims.push({ cell, digit: d });
            }
          }

          if (elims.length > 0) {
            return {
              strategyId: 'aic-with-exotic-links',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [...new Set([startCell, endCandidate, ...xwCells, ...elims.map((e) => e.cell)])],
                candidates: [startCell, endCandidate, ...xwCells].map((c) => ({ cell: c, digit: d })),
                links: [
                  { from: { cell: startCell, digit: d }, to: { cell: xw.weakR, digit: d }, type: 'weak' },
                  { from: { cell: xw.strongA, digit: d }, to: { cell: xw.strongB, digit: d }, type: 'strong' },
                  { from: { cell: xw.exitCell, digit: d }, to: { cell: endCandidate, digit: d }, type: 'weak' },
                ],
              },
              explanation: {
                zh: `含奇异链接的AIC：数字${d}通过XW节点（${cellLabel(xw.strongA)}${cellLabel(xw.strongB)}为强链接对，${cellLabel(xw.weakR)}${cellLabel(xw.weakS)}为弱格）形成链 ${cellLabel(startCell)}→XW→${cellLabel(endCandidate)}；消去同时看到两端的格中的${d}。`,
                en: `AIC with exotic link: digit ${d} through XW node (strong pair ${cellLabel(xw.strongA)}-${cellLabel(xw.strongB)}, weak ${cellLabel(xw.weakR)}-${cellLabel(xw.weakS)}); chain ${cellLabel(startCell)}→XW→${cellLabel(endCandidate)}; eliminate ${d} from cells seeing both endpoints.`,
              },
            };
          }
        }
      }
    }
  }
  return null;
}

export const aicWithExoticLinks: Strategy = {
  id: 'aic-with-exotic-links',
  name: { zh: '含奇异链接的AIC', en: 'AIC with Exotic Links' },
  difficulty: 780,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid: Grid): Step | null {
    return tryAICWithExoticLinks(grid);
  },
};
