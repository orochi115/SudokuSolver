import { CELLS, COL_OF, PEERS_OF, ROW_OF, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Link, Step } from '../trace.js';

function label(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function commonPeerElims(grid: Grid, a: number, b: number, digit: number, chainCells: Set<number>): { cell: number; digit: number }[] {
  const peers = new Set(PEERS_OF[a]!);
  return PEERS_OF[b]!
    .filter((cell) => !chainCells.has(cell) && peers.has(cell) && grid.hasCandidate(cell, digit))
    .map((cell) => ({ cell, digit }));
}

const MAX_CELLS = 12;

export const xyChain: Strategy = {
  id: 'xy-chain',
  name: { zh: 'XY链', en: 'XY-Chain' },
  difficulty: 715,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid): Step | null {
    const bivalue: number[] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      if (grid.get(cell) === 0 && popcount(grid.candidatesOf(cell)) === 2) bivalue.push(cell);
    }

    for (const start of bivalue) {
      const startDigits = digitsOf(grid.candidatesOf(start));
      for (const endDigit of startDigits) {
        const firstOn = startDigits.find((d) => d !== endDigit)!;
        const path = [start];
        const onDigits = [firstOn];
        const visited = new Set([start]);

        const dfs = (cell: number, onDigit: number): Step | null => {
          if (path.length >= 3 && onDigit === endDigit) {
            const end = cell;
            const chainCells = new Set(path);
            const eliminations = commonPeerElims(grid, start, end, endDigit, chainCells);
            if (eliminations.length > 0) {
              const links: Link[] = [];
              for (let i = 0; i < path.length; i++) {
                const c = path[i]!;
                const ds = digitsOf(grid.candidatesOf(c));
                const off = i === 0 ? endDigit : onDigits[i - 1]!;
                const on = onDigits[i]!;
                links.push({ from: { cell: c, digit: off }, to: { cell: c, digit: on }, type: 'strong' });
                if (i < path.length - 1) {
                  links.push({ from: { cell: c, digit: on }, to: { cell: path[i + 1]!, digit: on }, type: 'weak' });
                }
                void ds;
              }
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: {
                  cells: [...path, ...eliminations.map((e) => e.cell)],
                  candidates: path.flatMap((c) => digitsOf(grid.candidatesOf(c)).map((digit) => ({ cell: c, digit }))).concat(eliminations),
                  links,
                },
                explanation: {
                  zh: `XY链：从 ${label(start)} 到 ${label(end)} 的双值格链两端同为 ${endDigit}；至少一端为真，公共可见格消去 ${endDigit}。`,
                  en: `XY-Chain: a bivalue-cell chain from ${label(start)} to ${label(end)} has ${endDigit} at both ends; one end is true, so common peers lose ${endDigit}.`,
                },
              };
            }
          }
          if (path.length >= MAX_CELLS) return null;
          for (const next of bivalue) {
            if (visited.has(next) || !PEERS_OF[cell]!.includes(next) || !grid.hasCandidate(next, onDigit)) continue;
            const ds = digitsOf(grid.candidatesOf(next));
            const nextOn = ds.find((d) => d !== onDigit)!;
            visited.add(next);
            path.push(next);
            onDigits.push(nextOn);
            const result = dfs(next, nextOn);
            onDigits.pop();
            path.pop();
            visited.delete(next);
            if (result) return result;
          }
          return null;
        };

        const result = dfs(start, firstOn);
        if (result) return result;
      }
    }
    return null;
  },
};
