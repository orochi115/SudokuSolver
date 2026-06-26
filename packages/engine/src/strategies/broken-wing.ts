import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const candCells = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) {
          candCells.push(c);
        }
      }

      const count = candCells.length;
      if (count < 5) continue;

      // Find 5-cell odd loops
      for (let i0 = 0; i0 < count; i0++) {
        const c0 = candCells[i0]!;
        const peers0 = PEERS_OF[c0]!;

        for (let i1 = 0; i1 < count; i1++) {
          if (i1 === i0) continue;
          const c1 = candCells[i1]!;
          if (!peers0.includes(c1)) continue;

          for (let i2 = 0; i2 < count; i2++) {
            if (i2 === i0 || i2 === i1) continue;
            const c2 = candCells[i2]!;
            if (!PEERS_OF[c1]!.includes(c2)) continue;

            for (let i3 = 0; i3 < count; i3++) {
              if (i3 === i0 || i3 === i1 || i3 === i2) continue;
              const c3 = candCells[i3]!;
              if (!PEERS_OF[c2]!.includes(c3)) continue;

              for (let i4 = 0; i4 < count; i4++) {
                if (i4 === i0 || i4 === i1 || i4 === i2 || i4 === i3) continue;
                const c4 = candCells[i4]!;
                if (!PEERS_OF[c3]!.includes(c4) || !PEERS_OF[c4]!.includes(c0)) continue;

                // We have a 5-cell cycle: c0 - c1 - c2 - c3 - c4 - c0
                const loop = [c0, c1, c2, c3, c4];

                // Find the shared houses for consecutive links
                const houses: number[] = [];
                let validHouses = true;
                for (let k = 0; k < 5; k++) {
                  const u = loop[k]!;
                  const v = loop[(k + 1) % 5]!;
                  // Find all houses containing both u and v
                  const shared = [];
                  if (ROW_OF[u] === ROW_OF[v]) shared.push(ROW_OF[u]!);
                  if (COL_OF[u] === COL_OF[v]) shared.push(9 + COL_OF[u]!);
                  if (BOX_OF[u] === BOX_OF[v]) shared.push(18 + BOX_OF[u]!);

                  if (shared.length === 0) {
                    validHouses = false;
                    break;
                  }
                  // Choose one house (prefer box, or row/col)
                  houses.push(shared[0]!);
                }

                if (!validHouses) continue;

                // Ensure adjacent houses are distinct to prevent degenerate loops
                let distinctAdj = true;
                for (let k = 0; k < 5; k++) {
                  if (houses[k] === houses[(k + 1) % 5]) {
                    distinctAdj = false;
                    break;
                  }
                }
                if (!distinctAdj) continue;

                // Gather guardians
                const guardianSet = new Set<number>();
                for (let k = 0; k < 5; k++) {
                  const u = loop[k]!;
                  const v = loop[(k + 1) % 5]!;
                  const hIdx = houses[k]!;
                  const hCells = HOUSES[hIdx]!;

                  // Find other cells in H containing d
                  const others = hCells.filter(c =>
                    c !== u && c !== v && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0
                  );
                  for (const g of others) guardianSet.add(g);
                }

                const G = [...guardianSet];
                if (G.length === 0) continue;

                if (G.length === 1) {
                  // Case 1: Single guardian placement
                  const g = G[0]!;
                  return {
                    strategyId: this.id,
                    placements: [{ cell: g, digit: d }],
                    eliminations: [],
                    highlights: {
                      cells: [...loop, g],
                      candidates: [
                        ...loop.map(c => ({ cell: c, digit: d })),
                        { cell: g, digit: d }
                      ],
                      links: []
                    },
                    explanation: {
                      zh: `断翼（单守护者）：数字 ${d} 的 5 格奇环 ${loop.map(c => cellLabel(c)).join(' - ')} 的关闭会产生染色矛盾。因此唯一的守护格 ${cellLabel(g)} 必定填入 ${d}。`,
                      en: `Broken Wing (Single Guardian): Odd loop on digit ${d} via ${loop.map(c => cellLabel(c)).join(' - ')} is impossible; thus the lone guardian ${cellLabel(g)} must be ${d}.`
                    }
                  };
                } else {
                  // Case 2/3: Multiple guardians eliminations
                  const elims: { cell: number; digit: number }[] = [];
                  for (let t = 0; t < CELLS; t++) {
                    if (grid.get(t) === 0 && (grid.candidatesOf(t) & bit) !== 0 && !G.includes(t)) {
                      const seesAllG = G.every(g => PEERS_OF[t]!.includes(g));
                      if (seesAllG) {
                        elims.push({ cell: t, digit: d });
                      }
                    }
                  }

                  if (elims.length > 0) {
                    return {
                      strategyId: this.id,
                      placements: [],
                      eliminations: elims,
                      highlights: {
                        cells: [...loop, ...G, ...elims.map(e => e.cell)],
                        candidates: [
                          ...loop.map(c => ({ cell: c, digit: d })),
                          ...G.map(g => ({ cell: g, digit: d })),
                          ...elims
                        ],
                        links: []
                      },
                      explanation: {
                        zh: `断翼（多守护者）：数字 ${d} 包含 5 格奇环且伴有多个守护格 [${G.map(g => cellLabel(g)).join(', ')}]；由于至少一个守护格为真，消去同时看到所有守护格的格中的 ${d}。`,
                        en: `Broken Wing (Multiple Guardians): Odd loop on digit ${d} with guardians [${G.map(g => cellLabel(g)).join(', ')}]; eliminate ${d} from cells seeing all guardians.`
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
