import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

function sameHouse(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || Math.floor(a / 27) * 3 + Math.floor((a % 9) / 3) === Math.floor(b / 27) * 3 + Math.floor((b % 9) / 3);
}

interface PathNode {
  cell: number;
  digit: number;
}

const MAX_LINKS = 8;

function searchNiceLoop(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const result = searchSingleDigitLoop(grid, d);
    if (result) return result;
  }
  return null;
}

function searchSingleDigitLoop(grid: Grid, digit: number): Step | null {
  const bit = maskOf(digit);

  const cells: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0) cells.push(c);
  }

  const adj = new Map<number, { strong: number[]; weak: number[] }>();
  for (const c of cells) {
    adj.set(c, { strong: [], weak: [] });
  }

  for (const house of HOUSES) {
    const inHouse = house.filter((c) => cells.includes(c));
    if (inHouse.length === 2) {
      const a = inHouse[0]!;
      const b = inHouse[1]!;
      adj.get(a)!.strong.push(b);
      adj.get(b)!.strong.push(a);
    } else if (inHouse.length > 2) {
      for (let i = 0; i < inHouse.length; i++) {
        for (let j = i + 1; j < inHouse.length; j++) {
          const a = inHouse[i]!;
          const b = inHouse[j]!;
          adj.get(a)!.weak.push(b);
          adj.get(b)!.weak.push(a);
        }
      }
    }
  }

  for (const start of cells) {
    const result = walkLoop(grid, adj, digit, start, start, [], [], new Set<number>([encodeNode(start, digit)]));
    if (result) return result;
  }
  return null;
}

function walkLoop(
  grid: Grid,
  adj: Map<number, { strong: number[]; weak: number[] }>,
  digit: number,
  current: number,
  start: number,
  path: number[],
  linkTypes: ('strong' | 'weak')[],
  visited: Set<number>,
): Step | null {
  path.push(current);

  if (path.length >= 4) {
    const firstType = linkTypes[0]!;
    const fullCycle = [...linkTypes, firstType === 'strong' ? 'weak' : firstType === 'weak' ? 'strong' : 'weak'];
    const evenCount = (linkTypes.length + 1) % 2 === 0;

    if (evenCount) {
      const lastIsCorrect = (linkTypes.length % 2 === 0)
        ? (firstType === 'weak' ? 'weak' : 'strong')
        : (firstType === 'weak' ? 'strong' : 'weak');
    }

    const peers = adj.get(current)!;
    const closingEdge = peers.weak.find((c) => c === start) !== undefined ? 'weak' :
      peers.strong.find((c) => c === start) !== undefined ? 'strong' : null;

    if (closingEdge !== null) {
      const fullLinkTypes: LinkType[] = [...linkTypes, closingEdge];
      let alternates = true;
      for (let i = 0; i < fullLinkTypes.length - 1; i++) {
        if (fullLinkTypes[i] === fullLinkTypes[i + 1]) { alternates = false; break; }
      }
      if (alternates && path.length === fullLinkTypes.length) {
        const links: Link[] = [];
        for (let i = 0; i < path.length; i++) {
          const fromCell = path[i]!;
          const toCell = path[(i + 1) % path.length]!;
          links.push({
            from: { cell: fromCell, digit },
            to: { cell: toCell, digit },
            type: fullLinkTypes[i]!,
          });
        }

        const eliminations: { cell: number; digit: number }[] = [];
        for (let i = 0; i < fullLinkTypes.length; i++) {
          if (fullLinkTypes[i] === 'weak') {
            const left = path[i]!;
            const right = path[(i + 1) % path.length]!;
            if (sameHouse(left, right)) {
              const sharedHouses = HOUSES.filter((h) => h.includes(left) && h.includes(right));
              for (const house of sharedHouses) {
                for (const c of house) {
                  if (c === left || c === right) continue;
                  if (path.includes(c)) continue;
                  if (grid.hasCandidate(c, digit)) {
                    eliminations.push({ cell: c, digit });
                  }
                }
              }
            }
          }
        }

        if (eliminations.length > 0) {
          path.pop();
          return {
            strategyId: 'nice-loop',
            placements: [],
            eliminations,
            highlights: {
              cells: [...new Set([...path, ...eliminations.map((e) => e.cell)])],
              candidates: [
                ...path.map((c) => ({ cell: c, digit })),
                ...eliminations,
              ],
              links,
            },
            explanation: {
              zh: `连续 Nice 环：数字 ${digit} 构成交替环（${path.length} 节），弱链同单位消去相关候选。`,
              en: `Continuous Nice Loop: digit ${digit} forms an alternating cycle (${path.length} links); eliminate from off-loop cells in weak-link houses.`,
            },
          };
        }
      }
    }
  }

  if (path.length >= MAX_LINKS) {
    path.pop();
    return null;
  }

  const nextType = linkTypes.length === 0 ? 'weak' : (linkTypes[linkTypes.length - 1] === 'strong' ? 'weak' : 'strong');
  const neighbors = nextType === 'strong' ? adj.get(current)!.strong : adj.get(current)!.weak;

  for (const next of neighbors) {
    const key = encodeNode(next, digit);
    if (visited.has(key)) continue;
    visited.add(key);
    linkTypes.push(nextType);
    const result = walkLoop(grid, adj, digit, next, start, path, linkTypes, visited);
    linkTypes.pop();
    visited.delete(key);
    if (result) { path.pop(); return result; }
  }

  path.pop();
  return null;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: 'Nice环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return searchNiceLoop(grid);
  },
};