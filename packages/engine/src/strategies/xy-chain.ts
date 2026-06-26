import { CELLS, PEERS_OF, maskOf, popcount, digitsOf, ROW_OF, COL_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

interface BivalueCell {
  cell: number;
  digits: [number, number];
}

function findBivalueCells(grid: Grid): BivalueCell[] {
  const result: BivalueCell[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const ds = digitsOf(m);
    result.push({ cell: c, digits: [ds[0]!, ds[1]!] });
  }
  return result;
}

function cellsShareDigit(a: number, b: number, d: number, grid: Grid): boolean {
  return grid.hasCandidate(a, d) && grid.hasCandidate(b, d) && PEERS_OF[a]!.includes(b);
}

interface ChainNode {
  cell: number;
  enterDigit: number;
  exitDigit: number;
}

function searchXyChain(grid: Grid): Step | null {
  const bivalueCells = findBivalueCells(grid);
  if (bivalueCells.length < 3) return null;

  const byDigit = new Map<number, BivalueCell[]>();
  for (const bv of bivalueCells) {
    for (const d of bv.digits) {
      const arr = byDigit.get(d) ?? [];
      arr.push(bv);
      byDigit.set(d, arr);
    }
  }

  const maxLen = 12;

  for (const startBv of bivalueCells) {
    for (const startDigit of startBv.digits) {
      const endDigit = startDigit;
      const otherStart = startBv.digits[0] === startDigit ? startBv.digits[1]! : startBv.digits[0]!;

      interface SearchState {
        cell: number;
        exitDigit: number;
        path: ChainNode[];
        visited: Set<number>;
      }

      const queue: SearchState[] = [{
        cell: startBv.cell,
        exitDigit: otherStart,
        path: [{ cell: startBv.cell, enterDigit: startDigit, exitDigit: otherStart }],
        visited: new Set([startBv.cell]),
      }];

      while (queue.length > 0) {
        const state = queue.shift()!;
        if (state.path.length >= maxLen) continue;

        const hopDigit = state.exitDigit;
        const peers = byDigit.get(hopDigit) ?? [];

        for (const nextBv of peers) {
          if (state.visited.has(nextBv.cell)) continue;
          if (!cellsShareDigit(state.cell, nextBv.cell, hopDigit, grid)) continue;

          const nextExit = nextBv.digits[0] === hopDigit ? nextBv.digits[1]! : nextBv.digits[0]!;
          const newPath = [...state.path, { cell: nextBv.cell, enterDigit: hopDigit, exitDigit: nextExit }];

          if (nextExit === endDigit && newPath.length >= 3) {
            const endCell = nextBv.cell;
            const startCell = startBv.cell;
            if (startCell !== endCell) {
              const eliminations: { cell: number; digit: number }[] = [];
              const peersOfStart = new Set(PEERS_OF[startCell]!);
              for (const peer of PEERS_OF[endCell]!) {
                if (!peersOfStart.has(peer)) continue;
                if (peer === startCell || peer === endCell) continue;
                if (grid.hasCandidate(peer, endDigit)) {
                  eliminations.push({ cell: peer, digit: endDigit });
                }
              }

              if (eliminations.length > 0) {
                const links: Link[] = [];
                for (let i = 0; i < newPath.length; i++) {
                  const node = newPath[i]!;
                  if (node.enterDigit !== node.exitDigit) {
                    links.push({
                      from: { cell: node.cell, digit: node.enterDigit },
                      to: { cell: node.cell, digit: node.exitDigit },
                      type: 'strong',
                    });
                  }
                  if (i < newPath.length - 1) {
                    const next = newPath[i + 1]!;
                    links.push({
                      from: { cell: node.cell, digit: node.exitDigit },
                      to: { cell: next.cell, digit: next.enterDigit },
                      type: 'weak',
                    });
                  }
                }

                const chainCells = newPath.map((n) => n.cell);
                return {
                  strategyId: 'xy-chain',
                  placements: [],
                  eliminations,
                  highlights: {
                    cells: [...new Set([...chainCells, ...eliminations.map((e) => e.cell)])],
                    candidates: [
                      ...newPath.flatMap((n) => [
                        { cell: n.cell, digit: n.enterDigit },
                        { cell: n.cell, digit: n.exitDigit },
                      ]),
                      ...eliminations,
                    ],
                    links,
                  },
                  explanation: {
                    zh: `XY链：从 ${cellLabel(startCell)} 的 ${startDigit} 经双值格链到 ${cellLabel(endCell)} 的 ${endDigit}，两端必有其一为 ${endDigit}；消去同时看到两端的格中的 ${endDigit}。`,
                    en: `XY-Chain: from ${cellLabel(startCell)}=${startDigit} through bivalue cells to ${cellLabel(endCell)}=${endDigit}; one end must be ${endDigit}; eliminate ${endDigit} from cells seeing both endpoints.`,
                  },
                };
              }
            }
          }

          const newVisited = new Set(state.visited);
          newVisited.add(nextBv.cell);
          queue.push({
            cell: nextBv.cell,
            exitDigit: nextExit,
            path: newPath,
            visited: newVisited,
          });
        }
      }
    }
  }
  return null;
}

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return searchXyChain(grid);
  },
};
