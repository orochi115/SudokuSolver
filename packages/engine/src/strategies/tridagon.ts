/**
 * Tridagon / Anti-Tridagon (Thor's Hammer) — exotic deadly pattern (E11).
 *
 * Four boxes in a 2×2 rectangle; twelve transversal cells restricted to three
 * digits D; at least one guardian (extra candidate) must be true.
 */

import {
  CELLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function formatDigits(digits: readonly number[]): string {
  return digits.join(',');
}

/** All 6 box-transversals: three cells, one per mini-row and mini-column. */
function boxTransversals(box: number): number[][] {
  const br = Math.floor(box / 3) * 3;
  const bc = (box % 3) * 3;
  const result: number[][] = [];
  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  for (const p of perms) {
    result.push([
      (br + 0) * 9 + (bc + p[0]!),
      (br + 1) * 9 + (bc + p[1]!),
      (br + 2) * 9 + (bc + p[2]!),
    ]);
  }
  return result;
}

/** Four boxes forming a 2×2 rectangle across two bands and two stacks. */
function* boxRectangles(): Generator<[number, number, number, number]> {
  for (const bandPair of [[0, 1], [1, 2]] as const) {
    for (const stackPair of [[0, 1], [1, 2]] as const) {
      yield [
        bandPair[0] * 3 + stackPair[0],
        bandPair[0] * 3 + stackPair[1],
        bandPair[1] * 3 + stackPair[0],
        bandPair[1] * 3 + stackPair[1],
      ];
    }
  }
}

function digitTriples(): number[][] {
  const out: number[][] = [];
  for (let d1 = 1; d1 <= 7; d1++) {
    for (let d2 = d1 + 1; d2 <= 8; d2++) {
      for (let d3 = d2 + 1; d3 <= 9; d3++) {
        out.push([d1, d2, d3]);
      }
    }
  }
  return out;
}

function maskOfDigits(digits: readonly number[]): number {
  return digits.reduce((m, d) => m | maskOf(d), 0);
}

/**
 * Three transversal cells jointly supply each digit of D (guardian extras outside D allowed).
 */
function boxTripleCarriesD(grid: Grid, cells: readonly number[], dMask: number): boolean {
  let unionInD = 0;
  for (const c of cells) {
    if (grid.get(c) !== 0) return false;
    unionInD |= grid.candidatesOf(c) & dMask;
  }
  for (const d of digitsOf(dMask)) {
    if (!(unionInD & maskOf(d))) return false;
  }
  return true;
}

function peersSeeingAll(cells: readonly number[]): number[] {
  if (cells.length === 0) return [];
  let peers = new Set(PEERS_OF[cells[0]!]!);
  for (let i = 1; i < cells.length; i++) {
    const next = new Set<number>();
    for (const p of PEERS_OF[cells[i]!]!) {
      if (peers.has(p)) next.add(p);
    }
    peers = next;
  }
  return [...peers];
}

interface TridagonHit {
  boxes: [number, number, number, number];
  digits: number[];
  patternCells: number[];
  targetCell?: number;
  eliminations: { cell: number; digit: number }[];
  explanation: { zh: string; en: string };
  rank: string;
}

function detectTridagon(grid: Grid): TridagonHit | null {
  const triples = digitTriples();
  const hits: TridagonHit[] = [];

  for (const boxes of boxRectangles()) {
    const transversalLists = boxes.map((b) => boxTransversals(b));

    for (const dTriple of triples) {
      const dMask = maskOfDigits(dTriple);

      for (const t0 of transversalLists[0]!) {
        if (!boxTripleCarriesD(grid, t0, dMask)) continue;
        for (const t1 of transversalLists[1]!) {
          if (!boxTripleCarriesD(grid, t1, dMask)) continue;
          for (const t2 of transversalLists[2]!) {
            if (!boxTripleCarriesD(grid, t2, dMask)) continue;
            for (const t3 of transversalLists[3]!) {
              if (!boxTripleCarriesD(grid, t3, dMask)) continue;

              const patternCells = [...t0, ...t1, ...t2, ...t3];
              if (patternCells.some((c) => grid.get(c) !== 0)) continue;

              const guardianCells: { cell: number; extras: number[] }[] = [];
              let all123Subset = true;

              for (const c of patternCells) {
                const cand = grid.candidatesOf(c);
                const outside = cand & ~dMask;
                if (outside !== 0) {
                  guardianCells.push({ cell: c, extras: digitsOf(outside) });
                } else if (popcount(cand & dMask) < 2) {
                  all123Subset = false;
                }
              }

              if (guardianCells.length !== 1 || !all123Subset) continue;

              const dStr = formatDigits(dTriple);
              const boxStr = boxes.map((b) => `b${b + 1}`).join(',');
              const target = guardianCells[0]!.cell;
              const elims = dTriple
                .filter((d) => grid.hasCandidate(target, d))
                .map((d) => ({ cell: target, digit: d }));
              if (elims.length === 0) continue;
              hits.push({
                boxes,
                digits: dTriple,
                patternCells,
                targetCell: target,
                eliminations: elims,
                explanation: {
                  zh: `反三值死环 Type1：四宫 ${boxStr} 上十二格三值图案 D={${dStr}}，仅 ${cellLabel(target)} 含守护候选；该格不能取 D 中数字，消去 {${dStr}}。`,
                  en: `Anti-Tridagon Type 1: boxes ${boxStr}, digits {${dStr}}, sole guardian ${cellLabel(target)}; eliminate {${dStr}} from target.`,
                },
                rank: `t1:${boxes.join('-')}:${dStr}:${target}`,
              });
            }
          }
        }
      }
    }
  }

  if (hits.length === 0) return null;
  hits.sort((a, b) => a.rank.localeCompare(b.rank));
  return hits[0]!;
}

function buildStep(grid: Grid, hit: TridagonHit): Step | null {
  const elims = hit.eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));
  if (elims.length === 0) return null;
  return {
    strategyId: 'tridagon',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...new Set(hit.patternCells)],
      candidates: [
        ...hit.patternCells.flatMap((c) =>
          digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
        ),
        ...elims,
      ],
      links: [],
    },
    explanation: hit.explanation,
  };
}

export const tridagon: Strategy = {
  id: 'tridagon',
  name: { zh: '反三值死环（雷神之锤）', en: 'Anti-Tridagon (Thor\'s Hammer)' },
  difficulty: 1100,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    const hit = detectTridagon(grid);
    if (!hit) return null;
    return buildStep(grid, hit);
  },
};