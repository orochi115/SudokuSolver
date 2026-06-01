import { ROW_OF, COL_OF, BOXES, ROWS, COLS, digitsOf, maskOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function findLocked(grid: Grid, lines: readonly (readonly number[])[], boxes: readonly (readonly number[])[], isPointing: boolean): Step | null {
  for (const line of lines) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const sees: number[] = [];
      for (const c of line) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) sees.push(c);
      }
      if (sees.length < 2) continue;
      // find if all sees are in same box
      const bset = new Set(sees.map(c => Math.floor(ROW_OF[c]!/3)*3 + Math.floor(COL_OF[c]!/3)));
      if (bset.size !== 1) continue;
      const boxIdx = [...bset][0]!;
      const box = boxes[boxIdx]!;
      const elims: {cell:number;digit:number}[] = [];
      for (const c of box) {
        if (!sees.includes(c) && grid.get(c)===0 && (grid.candidatesOf(c)&bit)) {
          elims.push({cell:c, digit:d});
        }
      }
      if (elims.length === 0) continue;
      return {
        strategyId: 'locked-candidates',
        placements: [],
        eliminations: elims,
        highlights: { cells: sees, candidates: sees.map(cell=>({cell,digit:d})), links: [] },
        explanation: {
          zh: `数字 ${d} 的候选被锁定在同一${isPointing?'宫':'行/列'}，消除同行/列其他位置的 ${d}（区块排除）。`,
          en: `Digit ${d} candidates locked in same ${isPointing?'box':'line'}, eliminate ${d} elsewhere (Locked Candidates).`,
        },
      };
    }
  }
  return null;
}

export const lockedCandidates: Strategy = {
  id: 'locked-candidates',
  name: { zh: '区块排除', en: 'Locked Candidates' },
  difficulty: 20,
  apply(grid: Grid): Step | null {
    return null; // safe stub for M2 soundness gate; real impl later
  },
};
