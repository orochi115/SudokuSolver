/**
 * Single-Digit Patterns (T3) — 单数字模式
 *
 * Three short named chains for a single digit d:
 *
 * Skyscraper:
 *   Two rows (or cols) each have exactly 2 candidates for d and share one column.
 *   The two outer endpoints see each other through their box/column connection.
 *   Eliminate d from cells seeing both outer endpoints.
 *
 * 2-String Kite:
 *   A row and a column each have exactly 2 candidates for d.
 *   One candidate in the row and one in the column share the same box.
 *   Eliminate d from cells seeing both free endpoints.
 *
 * Empty Rectangle (ER):
 *   A box has candidates for d in exactly one row-line AND one col-line within it.
 *   A conjugate pair (strong link) on a line outside the box interacts with the ER.
 *   Eliminate d from cells seeing both the chain endpoint and the ER intersection.
 */

import {
  ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, CELLS, HOUSES, UNITS_OF, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { buildLinkGraph } from '../chain/graph.js';
import { searchAic } from '../chain/aic-search.js';
import { DEFAULT_CHAIN_POLICY } from '../chain/policy.js';

/** Cells that are peers of BOTH a and b. */
function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function cellsWithCandidate(grid: Grid, cells: readonly number[], digit: number): number[] {
  const bit = maskOf(digit);
  return cells.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
}

// ---- Skyscraper ----
function trySkyscraper(grid: Grid, d: number, strategyId: string): Step | null {
  const bit = maskOf(d);

  // Rows with exactly 2 candidates
  const rowPairs: Array<{ rowIdx: number; cells: [number, number] }> = [];
  for (let r = 0; r < 9; r++) {
    const cells = ROWS[r]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cells.length === 2) rowPairs.push({ rowIdx: r, cells: [cells[0]!, cells[1]!] });
  }

  for (let i = 0; i < rowPairs.length; i++) {
    for (let j = i + 1; j < rowPairs.length; j++) {
      const a = rowPairs[i]!;
      const b = rowPairs[j]!;

      for (let ai = 0; ai < 2; ai++) {
        for (let bi = 0; bi < 2; bi++) {
          if (COL_OF[a.cells[ai as 0 | 1]]! !== COL_OF[b.cells[bi as 0 | 1]]!) continue;
          const endA = a.cells[(1 - ai) as 0 | 1];
          const endB = b.cells[(1 - bi) as 0 | 1];
          const elims = commonPeers(endA, endB).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;
          const sharedCol = COL_OF[a.cells[ai as 0 | 1]]! + 1;
          return {
            strategyId,
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...a.cells, ...b.cells, ...elims],
              candidates: [
                ...a.cells.map((c) => ({ cell: c, digit: d })),
                ...b.cells.map((c) => ({ cell: c, digit: d })),
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links: [
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: b.cells[bi as 0 | 1], digit: d }, type: 'weak' },
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: endA, digit: d }, type: 'strong' },
                { from: { cell: b.cells[bi as 0 | 1], digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：摩天楼。第 ${a.rowIdx + 1} 行与第 ${b.rowIdx + 1} 行各有 2 个候选数，共享第 ${sharedCol} 列；外端 R${ROW_OF[endA]! + 1}C${COL_OF[endA]! + 1} 和 R${ROW_OF[endB]! + 1}C${COL_OF[endB]! + 1} 的公共可见格消去 ${d}（摩天楼）。`,
              en: `Digit ${d}: Skyscraper in rows ${a.rowIdx + 1} & ${b.rowIdx + 1}, sharing column ${sharedCol}; eliminate ${d} from cells seeing both endpoints R${ROW_OF[endA]! + 1}C${COL_OF[endA]! + 1} and R${ROW_OF[endB]! + 1}C${COL_OF[endB]! + 1} (Skyscraper).`,
            },
          };
        }
      }
    }
  }

  // Column-variant Skyscraper
  const colPairs: Array<{ colIdx: number; cells: [number, number] }> = [];
  for (let c = 0; c < 9; c++) {
    const cells = COLS[c]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (cells.length === 2) colPairs.push({ colIdx: c, cells: [cells[0]!, cells[1]!] });
  }

  for (let i = 0; i < colPairs.length; i++) {
    for (let j = i + 1; j < colPairs.length; j++) {
      const a = colPairs[i]!;
      const b = colPairs[j]!;

      for (let ai = 0; ai < 2; ai++) {
        for (let bi = 0; bi < 2; bi++) {
          if (ROW_OF[a.cells[ai as 0 | 1]]! !== ROW_OF[b.cells[bi as 0 | 1]]!) continue;
          const endA = a.cells[(1 - ai) as 0 | 1];
          const endB = b.cells[(1 - bi) as 0 | 1];
          const elims = commonPeers(endA, endB).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;
          const sharedRow = ROW_OF[a.cells[ai as 0 | 1]]! + 1;
          return {
            strategyId,
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...a.cells, ...b.cells, ...elims],
              candidates: [
                ...a.cells.map((c) => ({ cell: c, digit: d })),
                ...b.cells.map((c) => ({ cell: c, digit: d })),
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links: [
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: b.cells[bi as 0 | 1], digit: d }, type: 'weak' },
                { from: { cell: a.cells[ai as 0 | 1], digit: d }, to: { cell: endA, digit: d }, type: 'strong' },
                { from: { cell: b.cells[bi as 0 | 1], digit: d }, to: { cell: endB, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：摩天楼（列方向）。第 ${a.colIdx + 1} 列与第 ${b.colIdx + 1} 列各有 2 个候选数，共享第 ${sharedRow} 行；消去公共可见格中的 ${d}（摩天楼）。`,
              en: `Digit ${d}: Skyscraper (column variant) in columns ${a.colIdx + 1} & ${b.colIdx + 1}, sharing row ${sharedRow}; eliminate ${d} from cells seeing both endpoints (Skyscraper).`,
            },
          };
        }
      }
    }
  }

  return null;
}

// ---- 2-String Kite ----
function tryTwoStringKite(grid: Grid, d: number, strategyId: string): Step | null {
  const bit = maskOf(d);

  const rowPairs: Array<{ rowIdx: number; cells: [number, number] }> = [];
  const colPairs: Array<{ colIdx: number; cells: [number, number] }> = [];

  for (let r = 0; r < 9; r++) {
    const cells = ROWS[r]!.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cells.length === 2) rowPairs.push({ rowIdx: r, cells: [cells[0]!, cells[1]!] });
  }
  for (let c = 0; c < 9; c++) {
    const cells = COLS[c]!.filter((cell) => grid.get(cell) === 0 && (grid.candidatesOf(cell) & bit) !== 0);
    if (cells.length === 2) colPairs.push({ colIdx: c, cells: [cells[0]!, cells[1]!] });
  }

  for (const row of rowPairs) {
    for (const col of colPairs) {
      for (let ri = 0; ri < 2; ri++) {
        for (let ci = 0; ci < 2; ci++) {
          const rowCell = row.cells[ri as 0 | 1];
          const colCell = col.cells[ci as 0 | 1];
          if (BOX_OF[rowCell] !== BOX_OF[colCell]) continue;
          // They must be different cells
          if (rowCell === colCell) continue;

          const endRow = row.cells[(1 - ri) as 0 | 1];
          const endCol = col.cells[(1 - ci) as 0 | 1];
          if (endRow === endCol) continue;

          const elims = commonPeers(endRow, endCol).filter(
            (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
          );
          if (elims.length === 0) continue;

          return {
            strategyId,
            placements: [],
            eliminations: elims.map((c) => ({ cell: c, digit: d })),
            highlights: {
              cells: [...row.cells, ...col.cells, ...elims],
              candidates: [
                ...row.cells.map((c) => ({ cell: c, digit: d })),
                ...col.cells.map((c) => ({ cell: c, digit: d })),
                ...elims.map((c) => ({ cell: c, digit: d })),
              ],
              links: [
                { from: { cell: rowCell, digit: d }, to: { cell: colCell, digit: d }, type: 'weak' },
                { from: { cell: rowCell, digit: d }, to: { cell: endRow, digit: d }, type: 'strong' },
                { from: { cell: colCell, digit: d }, to: { cell: endCol, digit: d }, type: 'strong' },
              ],
            },
            explanation: {
              zh: `数字 ${d}：双线风筝。第 ${row.rowIdx + 1} 行与第 ${col.colIdx + 1} 列各有 2 个候选数，在宫 B${BOX_OF[rowCell]! + 1} 相交；消去 R${ROW_OF[endRow]! + 1}C${COL_OF[endRow]! + 1} 和 R${ROW_OF[endCol]! + 1}C${COL_OF[endCol]! + 1} 公共可见格中的 ${d}（双线风筝）。`,
              en: `Digit ${d}: 2-String Kite. Row ${row.rowIdx + 1} and column ${col.colIdx + 1} each have 2 candidates meeting in box B${BOX_OF[rowCell]! + 1}; eliminate ${d} from cells seeing both free endpoints (2-String Kite).`,
            },
          };
        }
      }
    }
  }
  return null;
}

// ---- Empty Rectangle ----
/**
 * Empty Rectangle: for digit d, a box has candidates in cells spanning at least
 * 2 rows and 2 cols within it (forming an "L" or rectangle).
 * We pair this with a conjugate pair (strong link) in a column (or row) that
 * has one endpoint inside the box. The interaction allows eliminations.
 *
 * Specifically: if box B has candidates for d in row R and column C,
 * and there's a strong link A--B where A is in column C (outside box),
 * then any cell in row R that sees B can be eliminated.
 */
function tryEmptyRectangle(grid: Grid, d: number, strategyId: string): Step | null {
  for (let b = 0; b < 9; b++) {
    const boxCells = cellsWithCandidate(grid, BOXES[b]!, d);
    if (boxCells.length < 2) continue;

    const boxRowSet = new Set(boxCells.map((c) => ROW_OF[c]!));
    const boxColSet = new Set(boxCells.map((c) => COL_OF[c]!));

    for (const erRow of boxRowSet) {
      for (const erCol of boxColSet) {
        const allCovered = boxCells.every((c) => ROW_OF[c] === erRow || COL_OF[c] === erCol);
        if (!allCovered) continue;

        const hasOnRow = boxCells.some((c) => ROW_OF[c] === erRow && COL_OF[c] !== erCol);
        const hasOnCol = boxCells.some((c) => COL_OF[c] === erCol && ROW_OF[c] !== erRow);
        if (!hasOnRow || !hasOnCol) continue;

        for (let col = 0; col < 9; col++) {
          if (col === erCol) continue;
          const colCands = cellsWithCandidate(grid, COLS[col]!, d);
          if (colCands.length !== 2) continue;
          const onErRow = colCands.find((c) => ROW_OF[c] === erRow);
          const other = colCands.find((c) => ROW_OF[c] !== erRow);
          if (onErRow === undefined || other === undefined) continue;
          if (BOX_OF[onErRow] === b) continue;
          const target = ROW_OF[other]! * 9 + erCol;
          if (BOX_OF[target] === b) continue;
          if (grid.get(target) !== 0 || !grid.hasCandidate(target, d)) continue;
          return {
            strategyId,
            placements: [],
            eliminations: [{ cell: target, digit: d }],
            highlights: {
              cells: [...boxCells, onErRow, other, target],
              candidates: [...boxCells, onErRow, other, target].map((c) => ({ cell: c, digit: d })),
              links: [{ from: { cell: onErRow, digit: d }, to: { cell: other, digit: d }, type: 'strong' }],
            },
            explanation: {
              zh: `空矩形：第 ${b + 1} 宫中数字 ${d} 构成空矩形（铰链行 R${erRow + 1}、铰链列 C${erCol + 1}）；结合列强链 ${cellLabel(onErRow)}-${cellLabel(other)}，可在 ${cellLabel(target)} 排除 ${d}。`,
              en: `Empty Rectangle: in box ${b + 1}, digit ${d} forms an ER (hinge row R${erRow + 1}, col C${erCol + 1}); with the column strong link ${cellLabel(onErRow)}-${cellLabel(other)}, ${d} can be removed from ${cellLabel(target)}.`,
            },
          };
        }

        for (let row = 0; row < 9; row++) {
          if (row === erRow) continue;
          const rowCands = cellsWithCandidate(grid, ROWS[row]!, d);
          if (rowCands.length !== 2) continue;
          const onErCol = rowCands.find((c) => COL_OF[c] === erCol);
          const other = rowCands.find((c) => COL_OF[c] !== erCol);
          if (onErCol === undefined || other === undefined) continue;
          if (BOX_OF[onErCol] === b) continue;
          const target = erRow * 9 + COL_OF[other]!;
          if (BOX_OF[target] === b) continue;
          if (grid.get(target) !== 0 || !grid.hasCandidate(target, d)) continue;
          return {
            strategyId,
            placements: [],
            eliminations: [{ cell: target, digit: d }],
            highlights: {
              cells: [...boxCells, onErCol, other, target],
              candidates: [...boxCells, onErCol, other, target].map((c) => ({ cell: c, digit: d })),
              links: [{ from: { cell: onErCol, digit: d }, to: { cell: other, digit: d }, type: 'strong' }],
            },
            explanation: {
              zh: `空矩形：第 ${b + 1} 宫中数字 ${d} 构成空矩形（铰链行 R${erRow + 1}、铰链列 C${erCol + 1}）；结合行强链 ${cellLabel(onErCol)}-${cellLabel(other)}，可在 ${cellLabel(target)} 排除 ${d}。`,
              en: `Empty Rectangle: in box ${b + 1}, digit ${d} forms an ER (hinge row R${erRow + 1}, col C${erCol + 1}); with the row strong link ${cellLabel(onErCol)}-${cellLabel(other)}, ${d} can be removed from ${cellLabel(target)}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 420,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = trySkyscraper(grid, d, this.id);
      if (step) return step;
    }
    return null;
  },
};

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 430,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryTwoStringKite(grid, d, this.id);
      if (step) return step;
    }
    return null;
  },
};

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 440,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryEmptyRectangle(grid, d, this.id);
      if (step) return step;
    }
    return null;
  },
};

export const turbotFish: Strategy = {
  id: 'turbot-fish',
  name: { zh: '多宝鱼', en: 'Turbot Fish' },
  difficulty: 510,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const graph = buildLinkGraph(grid, { digit, grouped: true });
      const result = searchAic(grid, graph, { ...DEFAULT_CHAIN_POLICY, maxChainLength: 4 });
      if (result && result.chainNodes.length === 4 && result.eliminations.length > 0) {
        const start = graph.nodes[result.startNode]!;
        const end = graph.nodes[result.endNode]!;
        return {
          strategyId: this.id,
          placements: [],
          eliminations: result.eliminations,
          highlights: {
            cells: result.chainNodes.flatMap((i) => graph.nodes[i]!.cells),
            candidates: result.chainNodes.flatMap((i) =>
              graph.nodes[i]!.cells.map((c) => ({ cell: c, digit: graph.nodes[i]!.digit })),
            ),
            links: result.links,
          },
          explanation: {
            zh: `多宝鱼（单数字强链）：数字 ${digit} 的强弱强 3 链连接 ${cellLabel(start.cells[0]!)} 与 ${cellLabel(end.cells[0]!)}，两端必有其一为真，故其公共可见格可排除 ${digit}。`,
            en: `Turbot Fish: digit ${digit} forms a strong-weak-strong 3-link chain between ${cellLabel(start.cells[0]!)} and ${cellLabel(end.cells[0]!)}; one end must be true, so cells seeing both can drop ${digit}.`,
          },
        };
      }
    }
    return null;
  },
};

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼 (奇环守护者)', en: 'Broken Wing (Guardians)' },
  difficulty: 560,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cells: number[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
          cells.push(c);
        }
      }
      if (cells.length < 5) continue;

      const adj = new Map<number, number[]>();
      for (const u of cells) {
        adj.set(u, []);
        for (const v of cells) {
          if (u !== v && PEERS_OF[u]!.includes(v)) {
            adj.get(u)!.push(v);
          }
        }
      }

      const seenCycles = new Set<string>();
      const path: number[] = [];
      const visited = new Set<number>();

      function dfs(curr: number, start: number): Step | null {
        if (path.length === 5) {
          if (PEERS_OF[curr]!.includes(start)) {
            const cycleKey = [...path].sort((a, b) => a - b).join(',');
            if (seenCycles.has(cycleKey)) return null;
            seenCycles.add(cycleKey);

            const loop = [...path];
            const linksHouses: number[] = [];
            let isCycle = true;
            for (let i = 0; i < 5; i++) {
              const u = loop[i]!;
              const v = loop[(i + 1) % 5]!;
              const sharedHouses = UNITS_OF[u]!.filter(h => UNITS_OF[v]!.includes(h));
              if (sharedHouses.length === 0) {
                isCycle = false;
                break;
              }
              linksHouses.push(sharedHouses[0]!);
            }

            if (isCycle) {
              const G = new Set<number>();
              for (let i = 0; i < 5; i++) {
                const u = loop[i]!;
                const v = loop[(i + 1) % 5]!;
                const hIdx = linksHouses[i]!;
                const houseCells = HOUSES[hIdx]!;
                const candidatesInHouse = houseCells.filter(c => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
                if (candidatesInHouse.length > 2) {
                  for (const c of candidatesInHouse) {
                    if (c !== u && c !== v) {
                      G.add(c);
                    }
                  }
                }
              }

              if (G.size > 0) {
                if (G.size === 1) {
                  const g = [...G][0]!;
                  return {
                    strategyId: 'broken-wing',
                    placements: [{ cell: g, digit: d }],
                    eliminations: [],
                    highlights: {
                      cells: [...loop, g],
                      candidates: [...loop, g].map(c => ({ cell: c, digit: d })),
                      links: linksHouses.map((hIdx, idx) => ({
                        from: { cell: loop[idx]!, digit: d },
                        to: { cell: loop[(idx + 1) % 5]!, digit: d },
                        type: 'weak' as const,
                      })),
                    },
                    explanation: {
                      zh: `断翼（守护者）：数字 ${d} 构成 5-格奇数环 ${loop.map(cellLabel).join('-')}，伴随唯一守护者 ${cellLabel(g)}；为避免奇数环无解矛盾，守护者格必须填入 ${d}。`,
                      en: `Broken Wing (Guardians): digit ${d} forms a 5-cell odd loop ${loop.map(cellLabel).join('-')} with a single guardian ${cellLabel(g)}; to avoid contradiction, the guardian must hold ${d}.`,
                    },
                  };
                }

                const elims: { cell: number; digit: number }[] = [];
                for (let c = 0; c < CELLS; c++) {
                  if (grid.get(c) !== 0) continue;
                  if (!(grid.candidatesOf(c) & bit)) continue;
                  if (loop.includes(c) || G.has(c)) continue;

                  const peers = new Set(PEERS_OF[c]!);
                  if ([...G].every(g => peers.has(g))) {
                    elims.push({ cell: c, digit: d });
                  }
                }

                for (const c of loop) {
                  if (G.has(c)) continue;
                  const peers = new Set(PEERS_OF[c]!);
                  if ([...G].every(g => peers.has(g))) {
                    elims.push({ cell: c, digit: d });
                  }
                }

                if (elims.length > 0) {
                  return {
                    strategyId: 'broken-wing',
                    placements: [],
                    eliminations: elims,
                    highlights: {
                      cells: [...loop, ...G, ...elims.map(e => e.cell)],
                      candidates: [...loop, ...G, ...elims.map(e => e.cell)].map(c => ({ cell: c, digit: d })),
                      links: linksHouses.map((hIdx, idx) => ({
                        from: { cell: loop[idx]!, digit: d },
                        to: { cell: loop[(idx + 1) % 5]!, digit: d },
                        type: 'weak' as const,
                      })),
                    },
                    explanation: {
                      zh: `断翼（守护者）：数字 ${d} 构成 5-格奇数环，伴随守护者集合 {${[...G].map(cellLabel).join(',')}}；消去同时看到所有守护者格的 ${d}。`,
                      en: `Broken Wing (Guardians): digit ${d} forms a 5-cell odd loop with guardians {${[...G].map(cellLabel).join(',')}}; eliminate ${d} from cells seeing all guardians.`,
                    },
                  };
                }
              }
            }
          }
          return null;
        }

        for (const neighbor of adj.get(curr) ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            path.push(neighbor);
            const step = dfs(neighbor, start);
            if (step) return step;
            path.pop();
            visited.delete(neighbor);
          }
        }

        return null;
      }

      for (const u of cells) {
        visited.add(u);
        path.push(u);
        const step = dfs(u, u);
        if (step) return step;
        path.pop();
        visited.delete(u);
      }
    }
    return null;
  },
};
