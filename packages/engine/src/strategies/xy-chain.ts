/**
 * XY-Chain (P0) — XY 链
 *
 * A chain of bivalue cells where consecutive cells share one digit (the hop).
 * The two free end-digits are the same digit Z, so at least one endpoint is Z;
 * eliminate Z from every cell that sees both endpoints.
 */

import { CELLS, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function bivalueCells(grid: Grid): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    if (popcount(grid.candidatesOf(cell)) === 2) out.push(cell);
  }
  return out;
}

function otherDigit(grid: Grid, cell: number, d: number): number {
  const ds = digitsOf(grid.candidatesOf(cell));
  return ds[0] === d ? ds[1]! : ds[0]!;
}

function commonPeers(a: number, b: number): number[] {
  const peersA = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!.filter((c) => peersA.has(c));
}

const MAX_XY_CHAIN_CELLS = 16;

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY-Chain', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['cell-index', 'digit', 'chain-length'],

  apply(grid: Grid): Step | null {
    const biv = bivalueCells(grid);
    if (biv.length < 2) return null;

    const bivSet = new Set(biv);
    // adjacency[digit][cell] -> peer bivalue cells containing that digit
    const adjacency: Map<number, number[]>[] = Array.from({ length: 10 }, () => new Map());
    for (const cell of biv) {
      for (const d of digitsOf(grid.candidatesOf(cell))) {
        adjacency[d]!.set(cell, []);
      }
    }
    for (let d = 1; d <= 9; d++) {
      const cells = [...adjacency[d]!.keys()].sort((a, b) => a - b);
      for (let i = 0; i < cells.length; i++) {
        const peers: number[] = [];
        for (let j = 0; j < cells.length; j++) {
          if (i === j) continue;
          const a = cells[i]!;
          const b = cells[j]!;
          if (PEERS_OF[a]!.includes(b)) peers.push(b);
        }
        adjacency[d]!.set(cells[i]!, peers.sort((a, b) => a - b));
      }
    }

    for (const start of biv.sort((a, b) => a - b)) {
      const startDigits = digitsOf(grid.candidatesOf(start)).sort((a, b) => a - b);
      for (const z of startDigits) {
        const firstHop = otherDigit(grid, start, z);
        const neighbors = adjacency[firstHop]!.get(start) ?? [];
        // BFS to find shortest valid XY-chain ending with digit z.
        type QItem = { current: number; incoming: number; path: number[] };
        const queue: QItem[] = neighbors.map((n) => ({ current: n, incoming: firstHop, path: [start, n] }));
        const seen = new Set<string>();
        seen.add(`${start},${firstHop}`);
        while (queue.length) {
          const item = queue.shift()!;
          if (item.path.length > MAX_XY_CHAIN_CELLS) continue;

          const curMask = grid.candidatesOf(item.current);
          const curDigits = digitsOf(curMask).sort((a, b) => a - b);
          if (curDigits.length !== 2) continue;
          const other = curDigits[0] === item.incoming ? curDigits[1]! : curDigits[0]!;

          if (other === z) {
            // Found an endpoint carrying z.
            const end = item.current;
            const eliminations = commonPeers(start, end)
              .filter((c) => c !== start && c !== end && grid.hasCandidate(c, z))
              .map((c) => ({ cell: c, digit: z }));
            if (eliminations.length > 0) {
              const links: Link[] = [];
              // Reconstruct hop labels from path and incoming digits.
              const incomingMap = new Map<number, number>();
              incomingMap.set(item.path[1]!, firstHop);
              for (let i = 2; i < item.path.length; i++) {
                const prev = item.path[i - 1]!;
                const cur = item.path[i]!;
                const prevIncoming = incomingMap.get(prev)!;
                const prevOther = otherDigit(grid, prev, prevIncoming);
                incomingMap.set(cur, prevOther);
              }
              for (let i = 0; i < item.path.length; i++) {
                const cur = item.path[i]!;
                if (i === 0) {
                  const hop = firstHop;
                  links.push({ from: { cell: cur, digit: z }, to: { cell: cur, digit: hop }, type: 'strong' });
                } else {
                  const inc = incomingMap.get(cur)!;
                  if (i < item.path.length - 1) {
                    const nxt = item.path[i + 1]!;
                    const out = otherDigit(grid, cur, inc);
                    links.push({ from: { cell: item.path[i - 1]!, digit: inc }, to: { cell: cur, digit: inc }, type: 'weak' });
                    links.push({ from: { cell: cur, digit: inc }, to: { cell: cur, digit: out }, type: 'strong' });
                  } else {
                    // final weak hop into end cell and strong to z
                    links.push({ from: { cell: item.path[i - 1]!, digit: inc }, to: { cell: cur, digit: inc }, type: 'weak' });
                    links.push({ from: { cell: cur, digit: inc }, to: { cell: cur, digit: z }, type: 'strong' });
                  }
                }
              }

              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...new Set([...item.path, ...eliminations.map((e) => e.cell)])],
                  candidates: [
                    ...item.path.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d }))),
                    ...eliminations,
                  ],
                  links,
                },
                explanation: {
                  zh: `XY-Chain：双值格链 ${item.path.map(cellLabel).join('→')}，两端自由数字均为 ${z}，至少一端为 ${z}；从能看到两端的格中消去 ${z}。`,
                  en: `XY-Chain: bivalue chain ${item.path.map(cellLabel).join('→')} has free digit ${z} at both ends, so at least one end is ${z}; eliminate ${z} from cells seeing both endpoints.`,
                },
              };
            }
          }

          // Extend chain through the other digit.
          const nextHop = other;
          if (item.path.length >= MAX_XY_CHAIN_CELLS) continue;
          for (const nxt of adjacency[nextHop]!.get(item.current) ?? []) {
            if (item.path.includes(nxt)) continue;
            const key = `${nxt}:${nextHop}`; // visited per (cell, incoming digit) is enough
            if (seen.has(key)) continue;
            seen.add(key);
            queue.push({ current: nxt, incoming: nextHop, path: [...item.path, nxt] });
          }
        }
      }
    }
    return null;
  },
};
