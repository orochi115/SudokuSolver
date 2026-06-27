import {
  CELLS, PEERS_OF, ROW_OF, COL_OF,
  maskOf, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  findAllALS, isRCC, alsShareCells,
  type ALS,
} from './als.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function tryAlsChain(grid: Grid, id: string): Step | null {
  const alsList = findAllALS(grid);
  if (alsList.length < 3) return null;

  interface AlsChainStep {
    alsIdx: number;
    rcc: number;
  }

  const MAX_CHAIN_LEN = 6;

  for (let ai = 0; ai < alsList.length; ai++) {
    function dfs(
      chain: AlsChainStep[],
      visited: Set<number>,
    ): Step | null {
      const lastStep = chain[chain.length - 1]!;
      const last = alsList[lastStep.alsIdx]!;
      const lastRcc = lastStep.rcc;

      if (chain.length >= 2) {
        const first = alsList[chain[0]!.alsIdx]!;
        const commonDigits = digitsOf(first.digitMask & last.digitMask);

        for (const z of commonDigits) {
          if (z === lastRcc) continue;
          const isRccInChain = chain.some(s => s.rcc === z);
          if (isRccInChain) continue;

          const zBit = maskOf(z);
          const firstCellsZ = first.cells.filter(c => grid.candidatesOf(c) & zBit);
          const lastCellsZ = last.cells.filter(c => grid.candidatesOf(c) & zBit);
          if (firstCellsZ.length === 0 || lastCellsZ.length === 0) continue;

          const eliminations: CellDigit[] = [];
          for (let c = 0; c < CELLS; c++) {
            if (grid.get(c) !== 0) continue;
            if (!(grid.candidatesOf(c) & zBit)) continue;
            if (first.cells.includes(c) || last.cells.includes(c)) continue;

            const peers = new Set(PEERS_OF[c]!);
            if (firstCellsZ.every(fc => peers.has(fc)) && lastCellsZ.every(lc => peers.has(lc))) {
              eliminations.push({ cell: c, digit: z });
            }
          }

          if (eliminations.length > 0) {
            const chainAls = chain.map(s => alsList[s.alsIdx]!);
            const allCells = [...new Set(chainAls.flatMap(al => al.cells).concat(eliminations.map(e => e.cell)))];
            const isLen2 = chain.length === 2;

            if (isLen2) {
              return {
                strategyId: 'als-xy-wing',
                placements: [],
                eliminations,
                highlights: {
                  cells: allCells,
                  candidates: [
                    ...chainAls.flatMap(al => al.cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })))),
                    ...eliminations,
                  ],
                  links: [],
                },
                explanation: {
                  zh: `ALS-XY翼：三个ALS通过受限公共候选数 ${chain[1]!.rcc} 连接；消去能同时看到两端ALS中所有 ${z} 的格中的 ${z}。`,
                  en: `ALS-XY-Wing: three ALS linked by RCC ${chain[1]!.rcc}; eliminate ${z} from cells seeing all ${z} in both endpoint ALS.`,
                },
              };
            }

            return {
              strategyId: id,
              placements: [],
              eliminations,
              highlights: {
                cells: allCells,
                candidates: [
                  ...chainAls.flatMap(al => al.cells.flatMap(c => digitsOf(grid.candidatesOf(c)).map(d => ({ cell: c, digit: d })))),
                  ...eliminations,
                ],
                links: [],
              },
              explanation: {
                zh: `ALS链（${chain.length + 1}个ALS）：${chainAls.map((al, i) => `ALS${i}(候选{${al.digits.join(',')}})`).join('→')}，消去共同候选 ${z}。`,
                en: `ALS Chain (${chain.length + 1} ALS): ${chainAls.map((al, i) => `ALS${i}({${al.digits.join(',')}})`).join('→')}, eliminate common candidate ${z}.`,
              },
            };
          }
        }
      }

      if (chain.length >= MAX_CHAIN_LEN) return null;

      for (let bi = 0; bi < alsList.length; bi++) {
        if (visited.has(bi)) continue;
        const b = alsList[bi]!;
        if (alsShareCells(last, b)) continue;

        const common = digitsOf(last.digitMask & b.digitMask);
        for (const rcc of common) {
          if (rcc === lastRcc) continue;
          if (isRCC(grid, last, b, rcc)) {
            visited.add(bi);
            chain.push({ alsIdx: bi, rcc });
            const result = dfs(chain, visited);
            chain.pop();
            visited.delete(bi);
            if (result) return result;
          }
        }
      }
      return null;
    }

    const result = dfs([{ alsIdx: ai, rcc: 0 }], new Set([ai]));
    if (result) return result;
  }
  return null;
}

export const alsChain: Strategy = {
  id: 'als-chain',
  name: { zh: 'ALS链', en: 'ALS Chain' },
  difficulty: 880,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    return tryAlsChain(grid, 'als-chain');
  },
};

export const alsXyWing: Strategy = {
  id: 'als-xy-wing',
  name: { zh: 'ALS-XY翼', en: 'ALS-XY-Wing' },
  difficulty: 840,
  tieBreak: ['house'],

  apply(grid: Grid): Step | null {
    return tryAlsChain(grid, 'als-xy-wing');
  },
};