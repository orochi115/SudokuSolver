import { ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function* fourBoxCombos(): Generator<[number, number, number, number]> {
  for (let br = 0; br < 6; br++) {
    for (let bc = 0; bc < 6; bc++) {
      const br1 = Math.floor(br / 3);
      const br2 = br % 3;
      const bc1 = Math.floor(bc / 3);
      const bc2 = bc % 3;
      const b0 = br1 * 3 + bc1;
      const b1 = br1 * 3 + (bc1 + 1);
      const b2 = (br1 + 1) * 3 + bc1;
      const b3 = (br1 + 1) * 3 + (bc1 + 1);
      if (b0 === b1 || b0 === b2 || b0 === b3 || b1 === b2 || b1 === b3 || b2 === b3) continue;
      if (br2 === 0 && bc2 === 0) yield [b0, b1, b2, b3];
    }
  }
}

function boxTransversals(boxCells: readonly number[]): number[][] {
  const byRow = new Map<number, number[]>();
  for (const c of boxCells) {
    (byRow.get(ROW_OF[c]!) ?? byRow.set(ROW_OF[c]!, []).get(ROW_OF[c]!)!).push(c);
  }
  const rowKeys = [...byRow.keys()].sort();
  if (rowKeys.length < 3) return [];
  const cells: number[][] = [];
  for (const rk of rowKeys) cells.push(byRow.get(rk)!);
  const result: number[][] = [];
  function pick(idx: number, chosen: number[]): void {
    if (idx === 3) { result.push(chosen); return; }
    for (const c of cells[idx]!) {
      const col = COL_OF[c];
      const usedCol = chosen.some((cc) => COL_OF[cc] === col);
      if (!usedCol) pick(idx + 1, [...chosen, c]);
    }
  }
  pick(0, []);
  return result;
}

function boxCellsIn(grid: Grid, boxIdx: number): number[] {
  return BOXES[boxIdx]!.filter((c) => grid.get(c) === 0);
}

function tryTridagon(grid: Grid): Step | null {
  for (const [b0, b1, b2, b3] of fourBoxCombos()) {
    const boxes = [b0, b1, b2, b3];
    const candidates = boxes.map((b) => boxCellsIn(grid, b));
    if (candidates.some((cs) => cs.length < 3)) continue;

    for (const t0 of boxTransversals(candidates[0]!)) {
    for (const t1 of boxTransversals(candidates[1]!)) {
    for (const t2 of boxTransversals(candidates[2]!)) {
    for (const t3 of boxTransversals(candidates[3]!)) {
      const patternCells = [t0, t1, t2, t3];
      const allCells = patternCells.flat();

      const mask = allCells.reduce((m, c) => m | grid.candidatesOf(c), 0);
      const digits = digitsOf(mask);
      if (digits.length !== 3) continue;

      const dMask = digits.reduce((m, d) => m | maskOf(d), 0);

      const extraCells: { cell: number; extraMask: number }[] = [];
      for (const c of allCells) {
        const cm = grid.candidatesOf(c);
        const extra = cm & ~dMask;
        if (extra !== 0) extraCells.push({ cell: c, extraMask: extra });
      }

      const pureCells = allCells.filter((c) => !extraCells.some((e) => e.cell === c));

      if (pureCells.length < 11) continue;
      if (extraCells.length === 0) continue;

      const dList = digits;

      if (extraCells.length === 1) {
        const target = extraCells[0]!;
        const eliminations: { cell: number; digit: number }[] = [];
        for (const d of dList) {
          if (grid.hasCandidate(target.cell, d)) eliminations.push({ cell: target.cell, digit: d });
        }
        if (eliminations.length === 0) continue;

        return {
          strategyId: 'tridagon',
          placements: [],
          eliminations,
          highlights: {
            cells: allCells,
            candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
            links: [],
          },
          explanation: {
            zh: `Tridagon（反三值死环）：在 ${boxes.map((b) => `第${b + 1}宫`).join('、')} 中，12 个格仅含数字 {${dList.join(',')}}；唯一的守护格 ${cellLabel(target.cell)} 不能为 {${dList.join(',')}} 中的任何数字，消去之。`,
            en: `Tridagon: in boxes ${boxes.map((b) => b + 1).join(',')}, 12 cells contain only {${dList.join(',')}}; the sole guardian cell ${cellLabel(target.cell)} cannot be {${dList.join(',')}}, eliminate them.`,
          },
        };
      }

      const commonExtra = extraCells.reduce((m, e) => m | e.extraMask, 0);
      for (const g of digitsOf(commonExtra)) {
        const gBit = maskOf(g);
        const guardCells = extraCells.filter((e) => (e.extraMask & gBit) !== 0).map((e) => e.cell);
        if (guardCells.length < 2) continue;
        const peersByGuard = guardCells.map((gc) => new Set(PEERS_OF[gc]!));
        const commonPeers: number[] = [];
        for (const p of peersByGuard[0]!) {
          if (peersByGuard.every((s) => s.has(p))) commonPeers.push(p);
        }
        const eliminations = commonPeers
          .filter((c) => !allCells.includes(c) && grid.hasCandidate(c, g))
          .map((c) => ({ cell: c, digit: g }));
        if (eliminations.length > 0) {
          return {
            strategyId: 'tridagon',
            placements: [],
            eliminations,
            highlights: {
              cells: allCells,
              candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
              links: [],
            },
            explanation: {
              zh: `Tridagon（多守护格同数字）：{${dList.join(',')}} 三元三值死环的守护格 ${guardCells.map((c) => cellLabel(c)).join('、')} 均有额外数字 ${g}，消去同时可见所有守护格的格中的 ${g}。`,
              en: `Tridagon (multi-guardian same digit): guardians ${guardCells.map((c) => cellLabel(c)).join(',')} share digit ${g}; eliminate ${g} from cells seeing all guardians.`,
            },
          };
        }
      }
    }}}}
  }
  return null;
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return tryTridagon(grid);
  },
};