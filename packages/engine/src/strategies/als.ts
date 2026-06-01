/**
 * ALS (T4) — 几乎锁定集 (Almost Locked Sets).
 *
 * Grouped strategy covering the ALS family (per the research note):
 *   - ALS-XZ            两个 ALS 经受限公共候选 X 连接,消除另一公共候选 Z
 *   - Doubly-linked ALS 两个 ALS 间有两个 RCC,锁定更强(此处作为 ALS-XZ 的强化分支)
 *   - ALS-XY-Wing       三个 ALS 经两个 RCC 串联,消除端点公共数字
 *   - ALS Chain         多个 ALS 经 RCC 链式连接(本实现覆盖到 3 节点链,即 XY-Wing 形态)
 *   - Death Blossom     一个 stem 双值格的每个候选各连一个 ALS petal,共同消除
 *
 * Sound rule for ALS-XZ: with RCC X between ALS-A and ALS-B, at most one ALS can
 * take X; the other becomes a locked set. For any OTHER common digit Z, Z must
 * appear in one of the two ALS, so a cell seeing EVERY Z-candidate in BOTH ALS
 * cannot itself be Z. The 400-puzzle soundness regression guards correctness.
 *
 * Pure: never mutates the grid.
 */

import { popcount, digitsOf, PEERS_OF, cellLabel, cellsLabel } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';
import {
  findAllAls,
  isRestricted,
  commonDigits,
  elimForZ,
  disjoint,
  alsCellsWith,
  type Als,
} from '../chain/als.js';

function alsLabel(als: Als): string {
  return `{${cellsLabel(als.cells)}}=[${digitsOf(als.mask).join('')}]`;
}

/** ALS-XZ (incl. doubly-linked). Returns the first useful elimination. */
function findAlsXz(grid: Grid, id: string, alss: Als[]): Step | null {
  for (let i = 0; i < alss.length; i++) {
    for (let j = i + 1; j < alss.length; j++) {
      const a = alss[i]!;
      const b = alss[j]!;
      if (!disjoint(a, b)) continue;
      const common = commonDigits(a, b);
      if (common.length < 2) continue;
      // find RCC(s)
      const rccs = common.filter((d) => isRestricted(grid, a, b, d));
      if (rccs.length === 0) continue;
      const doubly = rccs.length >= 2;

      // For each RCC X, every other common Z is eliminable from common peers.
      for (const x of rccs) {
        for (const z of common) {
          if (z === x) continue;
          // In doubly-linked, both RCCs also act as Z for each other; handle
          // generically by trying every non-X common digit as Z.
          const elimCells = elimForZ(grid, a, b, z);
          const elims: CellDigit[] = elimCells.map((c) => ({ cell: c, digit: z }));
          if (elims.length === 0) continue;
          const cells = [...a.cells, ...b.cells];
          return {
            strategyId: id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells,
              candidates: cells.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `${doubly ? '双向连接 ALS' : 'ALS-XZ'}:两个几乎锁定集 ${alsLabel(a)} 与 ${alsLabel(b)} 经受限公共候选 ${x} 连接;另一公共候选 ${z} 必在其中一个 ALS 出现,故同时可见两 ALS 中全部 ${z} 的格可排除 ${z}。`,
              en: `${doubly ? 'Doubly-linked ALS' : 'ALS-XZ'}: two almost-locked sets ${alsLabel(a)} and ${alsLabel(b)} linked by RCC ${x}; the other common digit ${z} must appear in one ALS, so cells seeing every ${z} in both can drop ${z}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/**
 * ALS-XY-Wing (3-ALS chain): ALS-A —Xa— ALS-B —Xb— ALS-C, where Xa is an RCC
 * between A,B and Xb an RCC between B,C, with Xa ≠ Xb. Let Z be a digit common
 * to A and C (but not equal to either RCC) — Z must end up in A or C, so cells
 * seeing all Z in A and C can drop Z.
 */
function findAlsXyWing(grid: Grid, id: string, alss: Als[]): Step | null {
  // Pre-index potential RCC pairs to keep this tractable.
  for (let bi = 0; bi < alss.length; bi++) {
    const B = alss[bi]!;
    for (let ai = 0; ai < alss.length; ai++) {
      if (ai === bi) continue;
      const A = alss[ai]!;
      if (!disjoint(A, B)) continue;
      const abCommon = commonDigits(A, B).filter((d) => isRestricted(grid, A, B, d));
      if (abCommon.length === 0) continue;
      for (let ci = ai + 1; ci < alss.length; ci++) {
        if (ci === bi) continue;
        const C = alss[ci]!;
        if (!disjoint(C, B) || !disjoint(C, A)) continue;
        const bcCommon = commonDigits(B, C).filter((d) => isRestricted(grid, B, C, d));
        if (bcCommon.length === 0) continue;
        for (const xa of abCommon) {
          for (const xb of bcCommon) {
            if (xa === xb) continue; // distinct RCCs
            // Z is common to A and C, not an RCC of this wing.
            const acCommon = commonDigits(A, C).filter((d) => d !== xa && d !== xb);
            for (const z of acCommon) {
              const za = alsCellsWith(grid, A, z);
              const zc = alsCellsWith(grid, C, z);
              if (za.length === 0 || zc.length === 0) continue;
              const allZ = [...za, ...zc];
              const elims: CellDigit[] = [];
              for (let c = 0; c < 81; c++) {
                if (grid.get(c) !== 0 || !grid.hasCandidate(c, z)) continue;
                if (allZ.includes(c)) continue;
                if (allZ.every((zc2) => PEERS_OF[c]!.includes(zc2))) elims.push({ cell: c, digit: z });
              }
              if (elims.length === 0) continue;
              const cells = [...A.cells, ...B.cells, ...C.cells];
              return {
                strategyId: id,
                placements: [],
                eliminations: elims,
                highlights: {
                  cells,
                  candidates: cells.flatMap((c) =>
                    digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                  ),
                  links: [],
                },
                explanation: {
                  zh: `ALS-XY-Wing:三个几乎锁定集 ${alsLabel(A)} —${xa}— ${alsLabel(B)} —${xb}— ${alsLabel(C)} 经两个受限公共候选串联;公共数字 ${z} 必落于首尾 ALS,可见两端全部 ${z} 的格可排除 ${z}。`,
                  en: `ALS-XY-Wing: three ALS ${alsLabel(A)} —${xa}— ${alsLabel(B)} —${xb}— ${alsLabel(C)} chained by two RCCs; the shared digit ${z} must land in the end ALS, so cells seeing all ${z} there can drop ${z}.`,
                },
              };
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Death Blossom: a "stem" cell (bivalue or multivalue) where each candidate
 * digit links to an ALS "petal" via that digit as an RCC. If a digit Z is common
 * to ALL petals (and not a stem digit / RCC), Z can be eliminated from cells
 * seeing every Z in every petal plus the stem. We implement the canonical
 * bivalue-stem, two-petal form which is sound and most common.
 */
function findDeathBlossom(grid: Grid, id: string, alss: Als[]): Step | null {
  for (let stem = 0; stem < 81; stem++) {
    if (grid.get(stem) !== 0) continue;
    const stemMask = grid.candidatesOf(stem);
    if (popcount(stemMask) !== 2) continue; // bivalue stem
    const stemDigits = digitsOf(stemMask) as [number, number];
    const [d1, d2] = stemDigits;
    // petal-1 linked by d1, petal-2 linked by d2; stem must see all d_i in petal_i.
    const petals1 = alss.filter((al) => petalLinks(grid, stem, al, d1));
    const petals2 = alss.filter((al) => petalLinks(grid, stem, al, d2));
    for (const p1 of petals1) {
      for (const p2 of petals2) {
        if (!disjoint(p1, p2)) continue;
        if (p1.cells.includes(stem) || p2.cells.includes(stem)) continue;
        // Z common to both petals, not the stem digits.
        const zCommon = commonDigits(p1, p2).filter((d) => d !== d1 && d !== d2);
        for (const z of zCommon) {
          const z1 = alsCellsWith(grid, p1, z);
          const z2 = alsCellsWith(grid, p2, z);
          if (z1.length === 0 || z2.length === 0) continue;
          const allZ = [...z1, ...z2];
          const elims: CellDigit[] = [];
          for (let c = 0; c < 81; c++) {
            if (grid.get(c) !== 0 || !grid.hasCandidate(c, z)) continue;
            if (allZ.includes(c) || c === stem) continue;
            if (allZ.every((zc) => PEERS_OF[c]!.includes(zc))) elims.push({ cell: c, digit: z });
          }
          if (elims.length === 0) continue;
          const cells = [stem, ...p1.cells, ...p2.cells];
          return {
            strategyId: id,
            placements: [],
            eliminations: elims,
            highlights: {
              cells,
              candidates: cells.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `死亡绽放 Death Blossom:茎格 ${cellLabel(stem)}{${d1},${d2}} 的两个候选各连一个 ALS 花瓣 ${alsLabel(p1)}、${alsLabel(p2)};无论茎格取何值,数字 ${z} 必在某花瓣出现,故可见两花瓣全部 ${z} 的格可排除 ${z}。`,
              en: `Death Blossom: stem ${cellLabel(stem)}{${d1},${d2}} links each candidate to an ALS petal ${alsLabel(p1)}, ${alsLabel(p2)}; whatever the stem takes, ${z} must occur in a petal, so cells seeing all ${z} can drop ${z}.`,
            },
          };
        }
      }
    }
  }
  return null;
}

/** Stem cell `stem` links ALS `al` via digit `d`: stem sees every d-candidate of al, and al has d. */
function petalLinks(grid: Grid, stem: number, al: Als, d: number): boolean {
  if (al.cells.includes(stem)) return false;
  const ds = alsCellsWith(grid, al, d);
  if (ds.length === 0) return false;
  return ds.every((c) => PEERS_OF[stem]!.includes(c));
}

export const als: Strategy = {
  id: 'als',
  name: { zh: '几乎锁定集', en: 'Almost Locked Sets' },
  difficulty: 80,

  apply(grid: Grid): Step | null {
    const alss = findAllAls(grid, 4);
    if (alss.length < 2) return null;

    const xz = findAlsXz(grid, this.id, alss);
    if (xz) return xz;

    const wing = findAlsXyWing(grid, this.id, alss);
    if (wing) return wing;

    const blossom = findDeathBlossom(grid, this.id, alss);
    if (blossom) return blossom;

    return null;
  },
};
