/**
 * Sue de Coq (T4, exotic) — 双区域不交数组.
 *
 * At a line-box intersection, pick 2-3 intersection cells whose combined
 * candidates split into a line part and a box part covered by supporting cells.
 * Concretely (the classic 2-cell form we implement):
 *
 *   Take two empty cells in a row/col ∩ box intersection holding ≥ 4 distinct
 *   candidates total. Find a bivalue cell in the same LINE (outside the box) and
 *   a bivalue cell in the same BOX (outside the line) whose candidate pairs are
 *   disjoint and together with the intersection cells partition the candidate
 *   set. Then those candidates are locked: remove the line-part digits from the
 *   rest of the line and the box-part digits from the rest of the box.
 *
 * This is an ALS/subset-counting technique; it appears after common ALS/AIC in a
 * practical workflow, hence its high difficulty band.
 *
 * Pure: never mutates the grid.
 */

import { ROWS, COLS, BOXES, BOX_OF, popcount, digitsOf, cellLabel } from './helpers.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

interface LineBox {
  line: readonly number[];
  lineKind: 'row' | 'col';
  box: readonly number[];
  inter: number[];
}

function intersections(grid: Grid): LineBox[] {
  const out: LineBox[] = [];
  for (const [lines, kind] of [
    [ROWS, 'row'],
    [COLS, 'col'],
  ] as const) {
    for (const line of lines) {
      const byBox = new Map<number, number[]>();
      for (const c of line) {
        if (grid.get(c) !== 0) continue;
        (byBox.get(BOX_OF[c]!) ?? byBox.set(BOX_OF[c]!, []).get(BOX_OF[c]!)!).push(c);
      }
      for (const [b, inter] of byBox) {
        if (inter.length >= 2) out.push({ line, lineKind: kind, box: BOXES[b]!, inter });
      }
    }
  }
  return out;
}

export const sueDeCoq: Strategy = {
  id: 'sue-de-coq',
  name: { zh: 'Sue de Coq', en: 'Sue de Coq' },
  difficulty: 95,

  apply(grid: Grid): Step | null {
    for (const lb of intersections(grid)) {
      // Use exactly 2 intersection cells (classic form).
      const interPairs = lb.inter.length === 2 ? [lb.inter] : pairs(lb.inter);
      for (const inter of interPairs) {
        let interMask = 0;
        for (const c of inter) interMask |= grid.candidatesOf(c);
        if (popcount(interMask) < 4) continue; // need room for line+box partition

        const lineCands = lb.line.filter(
          (c) => grid.get(c) === 0 && !inter.includes(c) && popcount(grid.candidatesOf(c)) === 2,
        );
        const boxCands = lb.box.filter(
          (c) => grid.get(c) === 0 && !inter.includes(c) && !lb.line.includes(c) && popcount(grid.candidatesOf(c)) === 2,
        );

        for (const lc of lineCands) {
          const lcMask = grid.candidatesOf(lc);
          if ((lcMask & interMask) !== lcMask) continue; // line cell's pair ⊂ inter cands
          for (const bc of boxCands) {
            const bcMask = grid.candidatesOf(bc);
            if ((bcMask & interMask) !== bcMask) continue;
            if (lcMask & bcMask) continue; // line and box parts must be disjoint
            // Together they must cover the whole inter set, with inter cells = N,
            // total distinct = N + 2 (the two helper bivalues add exactly their
            // 4 digits which are a subset). Classic count: |inter|+|{lc,bc}| cells
            // = |interMask| distinct ⇒ locked.
            const union = interMask | lcMask | bcMask;
            const cellCount = inter.length + 2;
            if (popcount(union) !== cellCount) continue;
            if (union !== interMask) continue; // helpers add no new digit

            // Eliminations: line-part digits (those in lcMask) from rest of line;
            // box-part digits (bcMask) from rest of box; remaining inter-only
            // digits also restricted but we focus on the helper-backed parts.
            const elims: CellDigit[] = [];
            const lineDigits = digitsOf(lcMask);
            const boxDigits = digitsOf(bcMask);
            const used = new Set([...inter, lc, bc]);
            for (const c of lb.line) {
              if (grid.get(c) !== 0 || used.has(c)) continue;
              for (const d of lineDigits) if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
            for (const c of lb.box) {
              if (grid.get(c) !== 0 || used.has(c)) continue;
              for (const d of boxDigits) if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
            }
            // dedup
            const seen = new Set<string>();
            const uniq = elims.filter((e) => {
              const k = `${e.cell}:${e.digit}`;
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
            if (uniq.length === 0) continue;

            const cells = [...inter, lc, bc];
            return {
              strategyId: this.id,
              placements: [],
              eliminations: uniq,
              highlights: {
                cells,
                candidates: cells.flatMap((c) =>
                  digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
                ),
                links: [],
              },
              explanation: {
                zh: `Sue de Coq:${lb.lineKind === 'row' ? '行' : '列'}与宫的交叉格 ${inter.map(cellLabel).join('、')} 的候选 {${digitsOf(interMask).join(',')}} 被线内格 ${cellLabel(lc)}{${lineDigits.join(',')}} 与宫内格 ${cellLabel(bc)}{${boxDigits.join(',')}} 分区锁定;可在线/宫其余格分别排除对应候选。`,
                en: `Sue de Coq: intersection cells ${inter.map(cellLabel).join(', ')} (cands {${digitsOf(interMask).join(',')}}) are partition-locked by line cell ${cellLabel(lc)}{${lineDigits.join(',')}} and box cell ${cellLabel(bc)}{${boxDigits.join(',')}}; the line-part and box-part digits are removed from the rest of the line and box.`,
              },
            };
          }
        }
      }
    }
    return null;
  },
};

function pairs(arr: number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) out.push([arr[i]!, arr[j]!]);
  return out;
}
