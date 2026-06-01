import { PEERS_OF, HOUSES, ROW_OF, COL_OF, SIZE, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface Implication {
  cell: number;
  digit: number;
  val: boolean;
  parentKey: string | null;
  linkType: 'strong' | 'weak' | null;
}

export const forcingChainConfig = {
  enabled: true,
  maxChainDepth: 10,
};

export const forcingChain: Strategy = {
  id: 'forcing-chain',
  name: { zh: '强制链', en: 'Forcing Chain' },
  difficulty: 100, // Suggested difficulty: 100 forcing chains

  apply(grid: Grid): Step | null {
    if (!forcingChainConfig.enabled) {
      return null;
    }

    // Find all bivalue cells to use as starting points
    const bivalueCells: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (grid.get(i) === 0 && popcount(grid.candidatesOf(i)) === 2) {
        bivalueCells.push(i);
      }
    }

    for (const startCell of bivalueCells) {
      const candidates = digitsOf(grid.candidatesOf(startCell));
      if (candidates.length !== 2) continue;
      const [x, y] = candidates;

      // Propagate for candidate X
      const mapX = propagate(grid, startCell, x!);
      // Propagate for candidate Y
      const mapY = propagate(grid, startCell, y!);

      // Look for common eliminations: candidate (E, d) is false in both
      for (const key of mapX.keys()) {
        if (mapY.has(key)) {
          const impX = mapX.get(key)!;
          const impY = mapY.get(key)!;

          if (impX.val === false && impY.val === false) {
            const [cellStr, digitStr] = key.split('-');
            const E = Number(cellStr);
            const d = Number(digitStr);

            if (grid.get(E) === 0 && grid.hasCandidate(E, d)) {
              // Found elimination! Reconstruct the chain links
              const links: Link[] = [];
              reconstructLinks(mapX, key, links);
              reconstructLinks(mapY, key, links);

              const involvedCells = Array.from(new Set([startCell, E, ...links.map(l => l.from.cell), ...links.map(l => l.to.cell)]));

              return {
                strategyId: this.id,
                placements: [],
                eliminations: [{ cell: E, digit: d }],
                highlights: {
                  cells: involvedCells,
                  candidates: involvedCells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(dig => ({ cell, digit: dig }))),
                  links,
                },
                explanation: {
                  zh: `从双值格 R${ROW_OF[startCell]! + 1}C${COL_OF[startCell]! + 1} 出发，若填入 ${x} 或 ${y}，通过逻辑强弱链推导均会导致 R${ROW_OF[E]! + 1}C${COL_OF[E]! + 1} 的候选数 ${d} 被消除（双重强制链）。因此可安全排除该候选数。`,
                  en: `Starting from bivalue cell R${ROW_OF[startCell]! + 1}C${COL_OF[startCell]! + 1}, assuming either ${x} or ${y} both lead to the elimination of candidate ${d} at R${ROW_OF[E]! + 1}C${COL_OF[E]! + 1} via forcing chains. Thus, ${d} can be safely eliminated.`,
                },
              };
            }
          }

          if (impX.val === true && impY.val === true) {
            const [cellStr, digitStr] = key.split('-');
            const E = Number(cellStr);
            const d = Number(digitStr);

            if (grid.get(E) === 0 && grid.hasCandidate(E, d)) {
              // Found placement! Reconstruct the chain links
              const links: Link[] = [];
              reconstructLinks(mapX, key, links);
              reconstructLinks(mapY, key, links);

              const involvedCells = Array.from(new Set([startCell, E, ...links.map(l => l.from.cell), ...links.map(l => l.to.cell)]));

              return {
                strategyId: this.id,
                placements: [{ cell: E, digit: d }],
                eliminations: [],
                highlights: {
                  cells: involvedCells,
                  candidates: involvedCells.flatMap(cell => digitsOf(grid.candidatesOf(cell)).map(dig => ({ cell, digit: dig }))),
                  links,
                },
                explanation: {
                  zh: `从双值格 R${ROW_OF[startCell]! + 1}C${COL_OF[startCell]! + 1} 出发，若填入 ${x} 或 ${y}，通过逻辑强弱链推导均会导致 R${ROW_OF[E]! + 1}C${COL_OF[E]! + 1} 必定填入 ${d}（双重强制链）。因此可直接填入该数。`,
                  en: `Starting from bivalue cell R${ROW_OF[startCell]! + 1}C${COL_OF[startCell]! + 1}, assuming either ${x} or ${y} both force digit ${d} at R${ROW_OF[E]! + 1}C${COL_OF[E]! + 1} via forcing chains. Thus, ${d} can be safely placed.`,
                },
              };
            }
          }
        }
      }
    }

    return null;
  },
};

function propagate(grid: Grid, cell: number, digit: number): Map<string, Implication> {
  const result = new Map<string, Implication>();
  const queue: string[] = [];

  function add(c: number, d: number, val: boolean, parentKey: string | null, linkType: 'strong' | 'weak' | null) {
    const key = `${c}-${d}`;
    if (result.has(key)) return;

    result.set(key, { cell: c, digit: d, val, parentKey, linkType });
    queue.push(key);
  }

  // Assume starting candidate is true
  add(cell, digit, true, null, null);

  let head = 0;
  while (head < queue.length && queue.length < 50) {
    const currKey = queue[head++]!;
    const curr = result.get(currKey)!;

    if (curr.val === true) {
      // 1. All other candidates in the same cell must be false (weak link)
      const candidates = digitsOf(grid.candidatesOf(curr.cell));
      for (const otherD of candidates) {
        if (otherD !== curr.digit) {
          add(curr.cell, otherD, false, currKey, 'weak');
        }
      }
      // 2. All peer cells of curr.cell with the same digit must be false (weak link)
      for (const peer of PEERS_OF[curr.cell]!) {
        if (grid.get(peer) === 0 && grid.hasCandidate(peer, curr.digit)) {
          add(peer, curr.digit, false, currKey, 'weak');
        }
      }
    } else {
      // val === false
      // 1. If same cell is bivalue, the other candidate must be true (strong link)
      if (popcount(grid.candidatesOf(curr.cell)) === 2) {
        const candidates = digitsOf(grid.candidatesOf(curr.cell));
        const otherD = candidates.find(other => other !== curr.digit);
        if (otherD !== undefined) {
          add(curr.cell, otherD, true, currKey, 'strong');
        }
      }
      // 2. In any house containing curr.cell, if curr.digit appears in exactly one other cell, that cell must be true (strong link)
      for (const house of HOUSES) {
        if (house.includes(curr.cell)) {
          const cellsWithDigit = house.filter(c => grid.get(c) === 0 && grid.hasCandidate(c, curr.digit));
          if (cellsWithDigit.length === 2) {
            const otherCell = cellsWithDigit.find(c => c !== curr.cell);
            if (otherCell !== undefined) {
              add(otherCell, curr.digit, true, currKey, 'strong');
            }
          }
        }
      }
    }
  }

  return result;
}

function reconstructLinks(map: Map<string, Implication>, endKey: string, links: Link[]) {
  let currKey: string | null = endKey;
  while (currKey) {
    const imp = map.get(currKey);
    if (!imp || !imp.parentKey) break;

    const parent = map.get(imp.parentKey)!;
    links.push({
      from: { cell: parent.cell, digit: parent.digit },
      to: { cell: imp.cell, digit: imp.digit },
      type: imp.linkType || 'weak',
    });

    currKey = imp.parentKey;
  }
}
