import {
  HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

const BOX_RECTANGLES: [number, number, number, number][] = [];
for (let r1 = 0; r1 < 3; r1++) {
  for (let r2 = r1 + 1; r2 < 3; r2++) {
    for (let c1 = 0; c1 < 3; c1++) {
      const b11 = r1 * 3 + c1;
      const b21 = r2 * 3 + c1;
      for (let c2 = c1 + 1; c2 < 3; c2++) {
        const b12 = r1 * 3 + c2;
        const b22 = r2 * 3 + c2;
        BOX_RECTANGLES.push([b11, b12, b21, b22]);
      }
    }
  }
}

function getBoxTransversals(b: number): number[][] {
  const cells = HOUSES[18 + b]!;
  const result: number[][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = i + 1; j < 9; j++) {
      for (let k = j + 1; k < 9; k++) {
        const c1 = cells[i]!;
        const c2 = cells[j]!;
        const c3 = cells[k]!;
        const r1 = ROW_OF[c1]!;
        const r2 = ROW_OF[c2]!;
        const r3 = ROW_OF[c3]!;
        const col1 = COL_OF[c1]!;
        const col2 = COL_OF[c2]!;
        const col3 = COL_OF[c3]!;
        if (r1 !== r2 && r1 !== r3 && r2 !== r3 && col1 !== col2 && col1 !== col3 && col2 !== col3) {
          result.push([c1, c2, c3]);
        }
      }
    }
  }
  return result;
}

function getTransversalParity(cells: number[], b: number): number {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  const mapped = cells.map(c => ({
    dr: ROW_OF[c]! - br,
    dc: COL_OF[c]! - bc
  }));
  mapped.sort((a, b) => a.dc - b.dc);
  const drs = mapped.map(x => x.dr);
  const key = drs.join(',');
  if (key === '0,1,2' || key === '1,2,0' || key === '2,0,1') {
    return 1;
  }
  return -1;
}

// All subsets of size 3 from {1..9}
const DIGIT_TRIPLES: [number, number, number][] = [];
for (let d1 = 1; d1 <= 7; d1++) {
  for (let d2 = d1 + 1; d2 <= 8; d2++) {
    for (let d3 = d2 + 1; d3 <= 9; d3++) {
      DIGIT_TRIPLES.push([d1, d2, d3]);
    }
  }
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '三值死环', en: 'Tridagon' },
  difficulty: 1100,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    // We search over all rect quadruples of boxes
    for (const [b11, b12, b21, b22] of BOX_RECTANGLES) {
      const trans1 = getBoxTransversals(b11).filter(T => T.every(c => grid.get(c) === 0));
      const trans2 = getBoxTransversals(b12).filter(T => T.every(c => grid.get(c) === 0));
      const trans3 = getBoxTransversals(b21).filter(T => T.every(c => grid.get(c) === 0));
      const trans4 = getBoxTransversals(b22).filter(T => T.every(c => grid.get(c) === 0));

      if (trans1.length === 0 || trans2.length === 0 || trans3.length === 0 || trans4.length === 0) continue;

      for (const [d1, d2, d3] of DIGIT_TRIPLES) {
        const maskD = maskOf(d1) | maskOf(d2) | maskOf(d3);

        // For each combination of transversals in the 4 boxes:
        for (const T1 of trans1) {
          const union1 = grid.candidatesOf(T1[0]!) | grid.candidatesOf(T1[1]!) | grid.candidatesOf(T1[2]!);
          if ((union1 & maskD) !== maskD) continue;

          for (const T2 of trans2) {
            const union2 = grid.candidatesOf(T2[0]!) | grid.candidatesOf(T2[1]!) | grid.candidatesOf(T2[2]!);
            if ((union2 & maskD) !== maskD) continue;

            for (const T3 of trans3) {
              const union3 = grid.candidatesOf(T3[0]!) | grid.candidatesOf(T3[1]!) | grid.candidatesOf(T3[2]!);
              if ((union3 & maskD) !== maskD) continue;

              for (const T4 of trans4) {
                const union4 = grid.candidatesOf(T4[0]!) | grid.candidatesOf(T4[1]!) | grid.candidatesOf(T4[2]!);
                if ((union4 & maskD) !== maskD) continue;

                // Parity check
                const p1 = getTransversalParity(T1, b11);
                const p2 = getTransversalParity(T2, b12);
                const p3 = getTransversalParity(T3, b21);
                const p4 = getTransversalParity(T4, b22);
                if (p1 * p2 * p3 * p4 !== -1) continue;

                // Gather all 12 cells
                const allCells = [...T1, ...T2, ...T3, ...T4];
                // How many have candidates outside D?
                const cellsWithGuardians = allCells.filter(c => (grid.candidatesOf(c) & ~maskD) !== 0);

                if (cellsWithGuardians.length === 1) {
                  // Type 1: exactly one target cell has guardians.
                  const targetCell = cellsWithGuardians[0]!;
                  const elims = [d1, d2, d3]
                    .filter(d => grid.hasCandidate(targetCell, d))
                    .map(d => ({ cell: targetCell, digit: d }));

                  if (elims.length > 0) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: elims,
                      highlights: {
                        cells: allCells,
                        candidates: allCells.flatMap(c => 
                          digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d }))
                        ),
                        links: []
                      },
                      explanation: {
                        zh: `三值死环（雷神之锤）：在宫 B${b11+1}, B${b12+1}, B${b21+1}, B${b22+1} 中，由数字 {${d1},${d2},${d3}} 构成的 12 格三值死环不满足奇偶性判定（必产生冲突）。因此，守护格 ${cellLabel(targetCell)} 的额外候选必定为真，消去该格中的 {${d1},${d2},${d3}}。`,
                        en: `Tridagon (Thor's Hammer): Twelve cells across boxes B${b11+1}, B${b12+1}, B${b21+1}, B${b22+1} restricted to digits {${d1},${d2},${d3}} violate parity, making the pure configuration impossible. Thus, guardian candidate(s) in target cell ${cellLabel(targetCell)} must be true; eliminate {${d1},${d2},${d3}} from it.`
                      }
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
};
