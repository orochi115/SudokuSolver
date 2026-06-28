import {
  CELLS, ROW_OF, COL_OF, BOX_OF, PEERS_OF,
  maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

interface Witness {
  cell: number;
  cands: number[];
  mask: number;
  seesBase: number[];
}

function findWitnesses(grid: Grid, baseCells: number[]): Witness[] {
  const baseSet = new Set(baseCells);
  const peerCounts = new Map<number, number[]>();
  for (const b of baseCells) {
    for (const p of PEERS_OF[b]!) {
      if (baseSet.has(p)) continue;
      if (!peerCounts.has(p)) peerCounts.set(p, []);
      peerCounts.get(p)!.push(b);
    }
  }
  const witnesses: Witness[] = [];
  for (const [cell, seesBase] of peerCounts) {
    if (seesBase.length < 2) continue;
    const m = grid.candidatesOf(cell);
    if (m === 0) continue;
    const pc = popcount(m);
    if (pc > seesBase.length) continue;
    witnesses.push({ cell, cands: digitsOf(m), mask: m, seesBase });
  }
  return witnesses;
}

function assignmentEmptiesWitness(
  assignment: Map<number, number>,
  witness: Witness,
): boolean {
  let covered = 0;
  for (const b of witness.seesBase) {
    const v = assignment.get(b)!;
    if (witness.mask & maskOf(v)) {
      covered |= maskOf(v);
    }
  }
  return covered === witness.mask;
}

function trySubsetExclusionPair(grid: Grid): Step | null {
  const unsolved: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    const pc = popcount(grid.candidatesOf(c));
    if (grid.get(c) === 0 && pc >= 2 && pc <= 4) unsolved.push(c);
  }
  if (unsolved.length > 40) return null;

  for (let i = 0; i < unsolved.length; i++) {
    for (let j = i + 1; j < unsolved.length; j++) {
      const b1 = unsolved[i]!;
      const b2 = unsolved[j]!;
      const cands1 = digitsOf(grid.candidatesOf(b1));
      const cands2 = digitsOf(grid.candidatesOf(b2));
      const seesEachOther = PEERS_OF[b1]!.includes(b2);

      const witnesses = findWitnesses(grid, [b1, b2]);
      if (witnesses.length === 0) continue;

      const surv1 = new Set<number>();
      const surv2 = new Set<number>();

      for (const v1 of cands1) {
        for (const v2 of cands2) {
          if (seesEachOther && v1 === v2) continue;
          const assignment = new Map<number, number>([[b1, v1], [b2, v2]]);
          let emptiesAny = false;
          for (const w of witnesses) {
            if (assignmentEmptiesWitness(assignment, w)) {
              emptiesAny = true;
              break;
            }
          }
          if (!emptiesAny) {
            surv1.add(v1);
            surv2.add(v2);
          }
        }
      }

      const elims: { cell: number; digit: number }[] = [];
      for (const v of cands1) {
        if (!surv1.has(v)) elims.push({ cell: b1, digit: v });
      }
      for (const v of cands2) {
        if (!surv2.has(v)) elims.push({ cell: b2, digit: v });
      }

      if (elims.length > 0) {
        return {
          strategyId: 'subset-exclusion',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [b1, b2, ...elims.map((e) => e.cell)],
            candidates: [
              ...cands1.map((d) => ({ cell: b1, digit: d })),
              ...cands2.map((d) => ({ cell: b2, digit: d })),
              ...elims,
            ],
            links: [],
          },
          explanation: {
            zh: `子集排除：基格 ${cellLabel(b1)}{${cands1.join(',')}} 和 ${cellLabel(b2)}{${cands2.join(',')}} 的所有合法赋值中，某些候选值在所有合法组合中均会导致共同可见的见证格无候选可填，故可排除。`,
            en: `Subset Exclusion: for base cells ${cellLabel(b1)}{${cands1.join(',')}} and ${cellLabel(b2)}{${cands2.join(',')}} some candidate values appear in no allowed combination (every such combination empties a witness cell), so they are eliminated.`,
          },
        };
      }
    }
  }
  return null;
}

function trySubsetExclusionTriple(grid: Grid): Step | null {
  const unsolved: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    const pc = popcount(grid.candidatesOf(c));
    if (grid.get(c) === 0 && pc >= 2 && pc <= 3) unsolved.push(c);
  }
  if (unsolved.length > 25) return null;

  for (let i = 0; i < unsolved.length; i++) {
    for (let j = i + 1; j < unsolved.length; j++) {
      for (let k = j + 1; k < unsolved.length; k++) {
        const b1 = unsolved[i]!;
        const b2 = unsolved[j]!;
        const b3 = unsolved[k]!;
        const cands1 = digitsOf(grid.candidatesOf(b1));
        const cands2 = digitsOf(grid.candidatesOf(b2));
        const cands3 = digitsOf(grid.candidatesOf(b3));

        const totalCombos = cands1.length * cands2.length * cands3.length;
        if (totalCombos > 200) continue;

        const baseCells = [b1, b2, b3];
        const witnesses = findWitnesses(grid, baseCells);
        if (witnesses.length === 0) continue;

        const s12 = PEERS_OF[b1]!.includes(b2);
        const s13 = PEERS_OF[b1]!.includes(b3);
        const s23 = PEERS_OF[b2]!.includes(b3);

        const surv: [Set<number>, Set<number>, Set<number>] = [
          new Set(), new Set(), new Set(),
        ];

        for (const v1 of cands1) {
          for (const v2 of cands2) {
            if (s12 && v1 === v2) continue;
            for (const v3 of cands3) {
              if (s13 && v1 === v3) continue;
              if (s23 && v2 === v3) continue;
              const assignment = new Map<number, number>([
                [b1, v1], [b2, v2], [b3, v3],
              ]);
              let emptiesAny = false;
              for (const w of witnesses) {
                if (assignmentEmptiesWitness(assignment, w)) {
                  emptiesAny = true;
                  break;
                }
              }
              if (!emptiesAny) {
                surv[0]!.add(v1);
                surv[1]!.add(v2);
                surv[2]!.add(v3);
              }
            }
          }
        }

        const elims: { cell: number; digit: number }[] = [];
        for (const v of cands1) {
          if (!surv[0]!.has(v)) elims.push({ cell: b1, digit: v });
        }
        for (const v of cands2) {
          if (!surv[1]!.has(v)) elims.push({ cell: b2, digit: v });
        }
        for (const v of cands3) {
          if (!surv[2]!.has(v)) elims.push({ cell: b3, digit: v });
        }

        if (elims.length > 0) {
          return {
            strategyId: 'subset-exclusion',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [b1, b2, b3, ...elims.map((e) => e.cell)],
              candidates: [
                ...cands1.map((d) => ({ cell: b1, digit: d })),
                ...cands2.map((d) => ({ cell: b2, digit: d })),
                ...cands3.map((d) => ({ cell: b3, digit: d })),
                ...elims,
              ],
              links: [],
            },
            explanation: {
              zh: `子集排除（三元）：基格 ${cellLabel(b1)}、${cellLabel(b2)}、${cellLabel(b3)} 的所有合法赋值组合中，某些候选值在所有合法组合中均导致见证格无候选可填，故排除。`,
              en: `Subset Exclusion (triple): for base cells ${cellLabel(b1)}, ${cellLabel(b2)}, ${cellLabel(b3)} some values appear in no allowed combination (every such combination empties a witness), so they are eliminated.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const subsetExclusion: Strategy = {
  id: 'subset-exclusion',
  name: { zh: '子集排除', en: 'Subset Exclusion' },
  difficulty: 1140,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return trySubsetExclusionPair(grid) ?? trySubsetExclusionTriple(grid);
  },
};
