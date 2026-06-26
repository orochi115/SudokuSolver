/**
 * General N-Wing size-ladder helper (XY/XYZ/WXYZ/VWXYZ…).
 *
 * Classic hinge form: a pivot cell with exactly N candidates, plus N-1 bivalue
 * pincer cells that each see the pivot and contain the shared non-restricted
 * digit Z together with one of the other pivot digits. Then Z must be true in
 * at least one pincer, so cells seeing all pincers lose Z.
 *
 * The helper is parameterised by N. WXYZ-Wing uses N=4; VWXYZ-Wing uses N=5.
 */

import { CELLS, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  const r = Math.floor(cell / 9) + 1;
  const c = (cell % 9) + 1;
  return `R${r}C${c}`;
}

function commonPeers(cells: number[]): number[] {
  if (cells.length === 0) return [];
  let result = new Set(PEERS_OF[cells[0]!]!);
  for (let i = 1; i < cells.length; i++) {
    const next = new Set(PEERS_OF[cells[i]!]!);
    result = new Set([...result].filter((c) => next.has(c)));
  }
  return [...result];
}

export interface NWingConfig {
  readonly id: string;
  readonly name: { zh: string; en: string };
  readonly difficulty: number;
  readonly size: number;
}

export function makeNWingStrategy(config: NWingConfig): Strategy {
  const { id, name, difficulty, size } = config;

  return {
    id,
    name,
    difficulty,
    tieBreak: ['cell-index', 'digit'],

    apply(grid: Grid): Step | null {
      for (let pivot = 0; pivot < CELLS; pivot++) {
        if (grid.get(pivot) !== 0) continue;
        const pivotMask = grid.candidatesOf(pivot);
        if (popcount(pivotMask) !== size) continue;
        const pivotDigits = digitsOf(pivotMask).sort((a, b) => a - b);
        // The shared non-restricted digit Z is the last pivot digit (any choice
        // works; we iterate all candidates for Z to keep the search canonical).
        for (let zIndex = 0; zIndex < pivotDigits.length; zIndex++) {
          const z = pivotDigits[zIndex]!;
          const otherDigits = pivotDigits.filter((d) => d !== z);

          // Collect bivalue pincer candidates that see the pivot.
          const pincerCandidates: number[] = [];
          for (const c of PEERS_OF[pivot]!) {
            if (grid.get(c) !== 0) continue;
            if (popcount(grid.candidatesOf(c)) === 2) pincerCandidates.push(c);
          }
          pincerCandidates.sort((a, b) => a - b);

          // For each other digit d, pincers that are exactly {d, z}.
          const digitPincers: number[][] = otherDigits.map((d) =>
            pincerCandidates.filter((c) => {
              const m = grid.candidatesOf(c);
              return (
                (m & maskOf(d)) !== 0 &&
                (m & maskOf(z)) !== 0 &&
                (m & ~maskOf(d) & ~maskOf(z)) === 0
              );
            }),
          );

          // Cartesian product over the pincer lists (one pincer per other digit).
          function* cartesian(idx = 0, chosen: number[] = []): Generator<number[]> {
            if (idx === digitPincers.length) {
              yield [...chosen];
              return;
            }
            for (const c of digitPincers[idx]!) {
              if (chosen.includes(c)) continue;
              chosen.push(c);
              yield* cartesian(idx + 1, chosen);
              chosen.pop();
            }
          }

          for (const pincers of cartesian()) {
            const viewers = commonPeers(pincers).filter(
              (c) => c !== pivot && !pincers.includes(c),
            );
            const elims: { cell: number; digit: number }[] = [];
            for (const c of viewers) {
              if (grid.get(c) !== 0) continue;
              if (grid.hasCandidate(c, z)) elims.push({ cell: c, digit: z });
            }
            if (elims.length === 0) continue;

            return {
              strategyId: id,
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [pivot, ...pincers, ...elims.map((e) => e.cell)],
                candidates: [
                  ...pivotDigits.map((d) => ({ cell: pivot, digit: d })),
                  ...pincers.flatMap((c) =>
                    digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                  ),
                  ...elims,
                ],
                links: [],
              },
              explanation: {
                zh: `${name.zh}：枢纽格 ${cellLabel(pivot)}={${pivotDigits.join(',')}}，翼格 ${pincers
                  .map((c, i) => `${cellLabel(c)}={${otherDigits[i]},${z}}`)
                  .join('、')}；${z} 必在某一翼格，消去能看到全部翼格的格中的 ${z}。`,
                en: `${name.en}: pivot ${cellLabel(pivot)}={${pivotDigits.join(',')}} with pincers ${pincers
                  .map((c, i) => `${cellLabel(c)}={${otherDigits[i]},${z}}`)
                  .join(', ')}; ${z} must be in a pincer, eliminating ${z} from cells seeing all pincers.`,
              },
            };
          }
        }
      }
      return null;
    },
  };
}
