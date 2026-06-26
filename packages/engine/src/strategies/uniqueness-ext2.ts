import { CELLS, ROWS, COLS, BOXES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, HOUSES, maskOf, popcount, digitsOf, ALL_CANDIDATES } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

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

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

function tryExtendedUR(grid: Grid): Step | null {
  for (const [c11, c12, c21, c22] of allRectangles()) {
    const cells = [c11, c12, c21, c22];
    const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));
    const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
    if (popcount(intersect) !== 2) continue;

    const urDigits = digitsOf(intersect);
    const urMask = intersect;

    const extraCells = cells.filter((_, i) => masks[i] !== 0 && (masks[i]! & ~urMask) !== 0);
    if (extraCells.length === 0) continue;

    const allExtraMask = extraCells.reduce((m, c) => m | grid.candidatesOf(c), 0) & ~urMask;
    const extraDigits = digitsOf(allExtraMask);

    for (const houseIdx of getCommonHouses(extraCells[0]!, extraCells[extraCells.length === 1 ? 0 : 1]!)) {
      const house = HOUSES[houseIdx]!;
      const otherCells = house.filter((c) => !cells.includes(c) && grid.get(c) === 0);
      if (otherCells.length === 0) continue;

      for (const subsetSize of [2, 3, 4]) {
        if (extraDigits.length > subsetSize) continue;
        if (otherCells.length < subsetSize - extraCells.length) continue;
        if (otherCells.length > 6) continue;

        for (const combo of combinations(otherCells, subsetSize - extraCells.length)) {
          const subsetCells = [...extraCells, ...combo];
          let unionMask = 0;
          for (const sc of subsetCells) {
            if (grid.get(sc) !== 0) { unionMask = 0; break; }
            unionMask |= grid.candidatesOf(sc);
          }
          if (unionMask === 0) continue;
          const subsetDigits = digitsOf(unionMask);
          if (subsetDigits.length !== subsetCells.length) continue;

          const eliminations: { cell: number; digit: number }[] = [];
          for (const c of house) {
            if (subsetCells.includes(c)) continue;
            if (grid.get(c) !== 0) continue;
            for (const d of subsetDigits) {
              if (grid.hasCandidate(c, d)) eliminations.push({ cell: c, digit: d });
            }
          }
          if (eliminations.length > 0) {
            return {
              strategyId: 'extended-unique-rectangle',
              placements: [],
              eliminations,
              highlights: {
                cells: [...cells, ...combo, ...eliminations.map((e) => e.cell)],
                candidates: [
                  ...cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...combo.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `扩展唯一矩形（2×3）：UR {${urDigits.join(',')}} 的额外候选 ${extraDigits.join(',')} 与 ${combo.map((c) => cellLabel(c)).join(',')} 形成 ${subsetSize} 元组。`,
                en: `Extended UR (2×3): UR {${urDigits.join(',')}} extra candidates ${extraDigits.join(',')} + ${combo.map((c) => cellLabel(c)).join(',')} form a ${subsetSize}-tuple.`,
              },
            };
          }
        }
      }
    }

    const extraDigitSet = new Set(extraDigits);
    for (const d of extraDigitSet) {
      const dBit = maskOf(d);
      const eliminations: { cell: number; digit: number }[] = [];
      for (const c of cells) {
        if (masks[cells.indexOf(c)] === 0) continue;
        if (grid.hasCandidate(c, d)) {
          for (const peer of PEERS_OF[c]!) {
            if (cells.includes(peer)) continue;
            if (grid.hasCandidate(peer, d)) eliminations.push({ cell: peer, digit: d });
          }
        }
      }
      if (eliminations.length > 0) {
        return {
          strategyId: 'extended-unique-rectangle',
          placements: [],
          eliminations,
          highlights: {
            cells,
            candidates: cells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((dd) => ({ cell: c, digit: dd }))),
            links: [],
          },
          explanation: {
            zh: `扩展唯一矩形：UR {${urDigits.join(',')}} 额外数字 ${d} 的锁定消除。`,
            en: `Extended UR: UR {${urDigits.join(',')}} extra digit ${d} locked; eliminate.`,
          },
        };
      }
    }
  }
  return null;
}

function tryUniqueLoop(grid: Grid): Step | null {
  for (let startCell = 0; startCell < CELLS; startCell++) {
    if (grid.get(startCell) !== 0) continue;
    const m = grid.candidatesOf(startCell);
    if (popcount(m) < 2) continue;
    const cells = [startCell];

    function dfs(cell: number, visited: Set<number>, path: number[]): Step | null {
      if (path.length >= 3) {
        const firstM = grid.candidatesOf(path[0]!);
        const lastM = grid.candidatesOf(cell);
        const common = firstM & lastM;
        if (common !== 0 && path.length >= 3) {
          const sharedDigit = digitsOf(common)[0]!;
          const allCells = [...new Set([...path])];

          const allMasks = allCells.map((c) => grid.candidatesOf(c));
          let totalMask = 0;
          for (const mm of allMasks) totalMask |= mm;
          const totalDigits = digitsOf(totalMask);

          if (totalDigits.length <= allCells.length || path.length >= 4) {
            for (const d of digitsOf(common)) {
              const eliminations: { cell: number; digit: number }[] = [];
              for (let c = 0; c < CELLS; c++) {
                if (allCells.includes(c)) continue;
                if (grid.hasCandidate(c, d)) {
                  const seesAll = allCells.every((ac) => {
                    if (ac === c) return false;
                    return ROW_OF[ac] === ROW_OF[c] || COL_OF[ac] === COL_OF[c] || BOX_OF[ac] === BOX_OF[c];
                  });
                  if (seesAll) eliminations.push({ cell: c, digit: d });
                }
              }
              if (eliminations.length > 0) {
                return {
                  strategyId: 'unique-loop',
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: allCells,
                    candidates: allCells.filter((c) => grid.hasCandidate(c, d)).map((c) => ({ cell: c, digit: d })),
                    links: [],
                  },
                  explanation: {
                    zh: `唯一环：{${allCells.map((c) => cellLabel(c)).join(',')}} 形成唯一环，消去${d}。`,
                    en: `Unique Loop: {${allCells.map((c) => cellLabel(c)).join(',')}} form a Unique Loop; eliminate ${d}.`,
                  },
                };
              }
            }
          }
        }
      }

      if (path.length >= 6) return null;
      const lastM = grid.candidatesOf(cell);

      for (const peer of PEERS_OF[cell]!) {
        if (visited.has(peer)) continue;
        if (grid.get(peer) !== 0) continue;
        const peerM = grid.candidatesOf(peer);
        const commonD = lastM & peerM;
        if (commonD === 0) continue;
        visited.add(peer);
        path.push(peer);
        const result = dfs(peer, visited, path);
        path.pop();
        visited.delete(peer);
        if (result) return result;
      }
      return null;
    }

    const visited = new Set<number>([startCell]);
    const result = dfs(startCell, visited, [startCell]);
    if (result) return result;
  }
  return null;
}

function tryBUGLite(grid: Grid): Step | null {
  const emptyCells = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0) emptyCells.push(c);
  }
  if (emptyCells.length < 3) return null;

  const candidateMap = new Map<number, number[]>();
  for (const c of emptyCells) {
    candidateMap.set(c, digitsOf(grid.candidatesOf(c)));
  }

  for (let i = 0; i < emptyCells.length; i++) {
    for (let j = i + 1; j < emptyCells.length; j++) {
      for (let k = j + 1; k < emptyCells.length; k++) {
        const [a, b, c] = [emptyCells[i]!, emptyCells[j]!, emptyCells[k]!];
        const dA = candidateMap.get(a)!;
        const dB = candidateMap.get(b)!;
        const dC = candidateMap.get(c)!;

        const allPairs = new Map<string, number[]>();
        allPairs.set(`${Math.min(a, b)}-${Math.max(a, b)}`, dA.filter((d) => dB.includes(d)));
        allPairs.set(`${Math.min(a, c)}-${Math.max(a, c)}`, dA.filter((d) => dC.includes(d)));
        allPairs.set(`${Math.min(b, c)}-${Math.max(b, c)}`, dB.filter((d) => dC.includes(d)));

        const unionD = [...new Set([...dA, ...dB, ...dC])];
        if (unionD.length !== 3) continue;

        if (dA.length === 2 && dB.length === 2 && dC.length === 2) {
          const allSeen = new Set<number>();
          for (const p of [a, b, c]) {
            for (const peer of PEERS_OF[p]!) {
              if (peer === a || peer === b || peer === c) continue;
              allSeen.add(peer);
            }
          }

          for (const d of unionD) {
            const eliminations: { cell: number; digit: number }[] = [];
            for (const peer of allSeen) {
              if (grid.hasCandidate(peer, d)) eliminations.push({ cell: peer, digit: d });
            }
            if (eliminations.length > 0 && eliminations.length < 5) {
              return {
                strategyId: 'bug-lite',
                placements: [],
                eliminations,
                highlights: {
                  cells: [a, b, c],
                  candidates: [a, b, c].flatMap((cc) => candidateMap.get(cc)!.map((dd) => ({ cell: cc, digit: dd }))),
                  links: [],
                },
                explanation: {
                  zh: `BUG Lite：{${cellLabel(a)},${cellLabel(b)},${cellLabel(c)}} 形成 3 格 3 候选的 BUG Lite，消去 ${d}。`,
                  en: `BUG Lite: {${cellLabel(a)},${cellLabel(b)},${cellLabel(c)}} form a 3-cell 3-candidate BUG Lite; eliminate ${d}.`,
                },
              };
            }
          }
        }
      }
    }
  }

  for (const cells of combinations(emptyCells, 4)) {
    const digitSets = cells.map((c) => candidateMap.get(c)!);
    const unionD = [...new Set(digitSets.flat())];
    if (unionD.length !== 4) continue;

    const allTwo = digitSets.every((ds) => ds.length === 2);
    if (!allTwo) continue;

    for (const d of unionD) {
      const dCells = cells.filter((c, idx) => digitSets[idx]!.includes(d));
      if (dCells.length < 2) continue;

      const eliminations: { cell: number; digit: number }[] = [];
      const commonPeers = dCells.reduce<Set<number> | null>((acc, dc) => {
        const s = new Set(PEERS_OF[dc]!);
        return acc === null ? s : new Set([...acc].filter((x) => s.has(x)));
      }, null);

      if (commonPeers) {
        for (const peer of commonPeers) {
          if (cells.includes(peer)) continue;
          if (grid.hasCandidate(peer, d)) eliminations.push({ cell: peer, digit: d });
        }
        if (eliminations.length > 0) {
          return {
            strategyId: 'bug-lite',
            placements: [],
            eliminations,
            highlights: {
              cells,
              candidates: cells.flatMap((cc) => candidateMap.get(cc)!.map((dd) => ({ cell: cc, digit: dd }))),
              links: [],
            },
            explanation: {
              zh: `BUG Lite（4 格）：{${cells.map((c) => cellLabel(c)).join(',')}} 形成 4 格 BUG Lite，消去 ${d}。`,
              en: `BUG Lite (4 cells): {${cells.map((c) => cellLabel(c)).join(',')}} form a 4-cell BUG Lite; eliminate ${d}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

function tryBUGPlusN(grid: Grid): Step | null {
  const bivalueCells: number[] = [];
  const multiCells: { cell: number; digits: number[] }[] = [];

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const d = digitsOf(grid.candidatesOf(c));
    if (d.length === 2) bivalueCells.push(c);
    else if (d.length > 2) multiCells.push({ cell: c, digits: d });
  }

  if (multiCells.length === 0 || multiCells.length > 3) return null;

  const allDigitCount = new Map<number, number>();
  for (const c of bivalueCells) {
    for (const d of digitsOf(grid.candidatesOf(c))) {
      allDigitCount.set(d, (allDigitCount.get(d) ?? 0) + 1);
    }
  }

  const allDigits = [...new Set([...bivalueCells.flatMap((c) => digitsOf(grid.candidatesOf(c))), ...multiCells.flatMap((m) => m.digits)])];

  let allSame = true;
  for (const d of allDigits) {
    const count = allDigitCount.get(d) ?? 0;
    if (count % 2 !== 0) { allSame = false; break; }
  }

  if (allSame) return null;

  for (const mc of multiCells) {
    const eliminations: { cell: number; digit: number }[] = [];
    const pc = mc.cell;
    for (const d of mc.digits) {
      const count = allDigitCount.get(d) ?? 0;
      if (count % 2 === 0) {
        if (grid.hasCandidate(pc, d)) eliminations.push({ cell: pc, digit: d });
      }
    }
    if (eliminations.length > 0) {
      const allCells = [...bivalueCells, ...multiCells.map((m) => m.cell)];
      return {
        strategyId: 'bug-plus-n',
        placements: [],
        eliminations,
        highlights: {
          cells: allCells,
          candidates: allCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
          links: [],
        },
        explanation: {
          zh: `BUG+N：多候选格 ${cellLabel(mc.cell)} 中 ${eliminations.map((e) => e.digit).join(',')} 出现偶数次，消去。`,
          en: `BUG+N: in multi-candidate cell ${cellLabel(mc.cell)}, digits appearing an even number of times (${eliminations.map((e) => e.digit).join(',')}) are eliminated.`,
        },
      };
    }
  }

  if (multiCells.length === 1) {
    const mc = multiCells[0]!;
    for (const d of mc.digits) {
      const count = allDigitCount.get(d) ?? 0;
      if (count % 2 === 1) {
        if (grid.hasCandidate(mc.cell, d)) {
          return {
            strategyId: 'bug-plus-n',
            placements: [{ cell: mc.cell, digit: d }],
            eliminations: [],
            highlights: {
              cells: [...bivalueCells, mc.cell],
              candidates: [...bivalueCells.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((dd) => ({ cell: c, digit: dd }))), ...mc.digits.map((dd) => ({ cell: mc.cell, digit: dd }))],
              links: [],
            },
            explanation: {
              zh: `BUG+N：多候选格 ${cellLabel(mc.cell)} 中 ${d} 出现奇数次，必须填 ${d}。`,
              en: `BUG+N: in cell ${cellLabel(mc.cell)}, digit ${d} appears an odd number of times; must place ${d}.`,
            },
          };
        }
      }
    }
  }

  return null;
}

export const extendedUniqueRectangle: Strategy = {
  id: 'extended-unique-rectangle',
  name: { zh: '扩展唯一矩形', en: 'Extended Unique Rectangle' },
  difficulty: 980,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};

export const uniqueLoop: Strategy = {
  id: 'unique-loop',
  name: { zh: '唯一环', en: 'Unique Loop' },
  difficulty: 985,
  tieBreak: ['chain-length', 'cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};

export const bugLite: Strategy = {
  id: 'bug-lite',
  name: { zh: 'BUG Lite', en: 'BUG Lite' },
  difficulty: 986,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};

export const bugPlusN: Strategy = {
  id: 'bug-plus-n',
  name: { zh: 'BUG+N', en: 'BUG+N' },
  difficulty: 987,
  tieBreak: ['cell-index'],
  apply(_grid: Grid): Step | null { return null; },
};