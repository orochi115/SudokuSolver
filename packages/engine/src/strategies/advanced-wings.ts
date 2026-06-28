/**
 * Advanced Wings (P1):
 *   - WXYZ-Wing: 4 cells / 4 digits in two houses, exactly one non-restricted digit Z.
 *   - Remote Pairs: chain of identical bivalue cells linked by conjugate pairs.
 *   - Bent Sets (Almost Locked Pair/Triple): ALS at line-box intersection.
 *   - Broken Wing: odd loop on single digit → guardians must include true d.
 */

import {
  CELLS, HOUSES, ROWS, COLS, BOXES,
  ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

// ============================================================
// WXYZ-Wing
// ============================================================

/**
 * WXYZ-Wing: 4 cells in exactly 2 houses (a box + a line) with exactly 4 digits.
 * Exactly one non-restricted digit Z. Eliminate Z from cells seeing all Z-cells.
 */
function tryWXYZWing(grid: Grid): Step | null {
  // We need to find 4 cells confined to 2 houses (box + row/col)
  // with union of candidates = 4 digits, exactly one non-restricted.
  
  // Strategy: iterate over all 4-cell combos in box+line intersections
  for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
    const box = BOXES[boxIdx]!;
    
    // For each row passing through this box
    const rowsInBox = [...new Set(box.map((c) => ROW_OF[c]!))];
    const colsInBox = [...new Set(box.map((c) => COL_OF[c]!))];
    
    for (const rowIdx of rowsInBox) {
      const row = ROWS[rowIdx]!;
      const step = checkWXYZInBoxLine(grid, box, row, boxIdx);
      if (step) return step;
    }
    
    for (const colIdx of colsInBox) {
      const col = COLS[colIdx]!;
      const step = checkWXYZInBoxLine(grid, box, col, boxIdx);
      if (step) return step;
    }
  }
  
  return null;
}

function checkWXYZInBoxLine(
  grid: Grid,
  box: readonly number[],
  line: readonly number[],
  _boxIdx: number,
): Step | null {
  // Get empty cells in box and line
  const boxCells = box.filter((c) => grid.get(c) === 0);
  const lineCells = line.filter((c) => grid.get(c) === 0 && !box.includes(c));
  
  // Try all 4-cell subsets spanning box and line (at least 1 from each)
  const allCells = [...boxCells, ...lineCells];
  
  for (let a = 0; a < allCells.length; a++) {
    for (let b = a + 1; b < allCells.length; b++) {
      for (let c = b + 1; c < allCells.length; c++) {
        for (let d = c + 1; d < allCells.length; d++) {
          const quad = [allCells[a]!, allCells[b]!, allCells[c]!, allCells[d]!];
          
          // Must have at least 1 cell from box and at least 1 from line-only
          const fromBox = quad.filter((cell) => box.includes(cell));
          const fromLine = quad.filter((cell) => !box.includes(cell));
          if (fromBox.length === 0 || fromLine.length === 0) continue;
          
          // Union of candidates must be exactly 4 digits
          let unionMask = 0;
          for (const cell of quad) unionMask |= grid.candidatesOf(cell);
          if (popcount(unionMask) !== 4) continue;
          
          const digits = digitsOf(unionMask);
          
          // Find non-restricted digit(s): Z is non-restricted if not all cells containing Z see each other
          let nonRestrictedCount = 0;
          let nonRestrictedDigit = -1;
          
          for (const dig of digits) {
            const bit = maskOf(dig);
            const zCells = quad.filter((cell) => (grid.candidatesOf(cell) & bit) !== 0);
            
            // Check if all zCells pairwise see each other (restricted)
            let restricted = true;
            for (let i = 0; i < zCells.length; i++) {
              for (let j = i + 1; j < zCells.length; j++) {
                if (!PEERS_OF[zCells[i]!]!.includes(zCells[j]!)) {
                  restricted = false;
                  break;
                }
              }
              if (!restricted) break;
            }
            
            if (!restricted) {
              nonRestrictedCount++;
              nonRestrictedDigit = dig;
            }
          }
          
          if (nonRestrictedCount !== 1) continue;
          
          // Z = nonRestrictedDigit
          const Z = nonRestrictedDigit;
          const Zbit = maskOf(Z);
          const zCells = quad.filter((cell) => (grid.candidatesOf(cell) & Zbit) !== 0);
          
          // Eliminate Z from cells seeing all Z-cells in the quad
          const elims: { cell: number; digit: number }[] = [];
          for (let target = 0; target < CELLS; target++) {
            if (quad.includes(target)) continue;
            if (grid.get(target) !== 0 || !(grid.candidatesOf(target) & Zbit)) continue;
            const peers = new Set(PEERS_OF[target]!);
            if (zCells.every((zc) => peers.has(zc))) {
              elims.push({ cell: target, digit: Z });
            }
          }
          
          if (elims.length === 0) continue;
          
          return {
            strategyId: 'wxyz-wing',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...quad, ...elims.map((e) => e.cell)],
              candidates: quad.flatMap((cell) =>
                digitsOf(grid.candidatesOf(cell)).map((dig) => ({ cell, digit: dig })),
              ),
              links: [],
            },
            explanation: {
              zh: `WXYZ翼：4格（${quad.map(cellLabel).join(',')}）共 4 个候选数，唯一非受限候选数 Z=${Z}；消去能看到所有 ${Z} 所在格的候选 ${Z}。`,
              en: `WXYZ-Wing: 4 cells (${quad.map(cellLabel).join(',')}) hold 4 digits, single non-restricted digit Z=${Z}; eliminate ${Z} from cells seeing all Z-positions.`,
            },
          };
        }
      }
    }
  }
  
  return null;
}

// ============================================================
// Remote Pairs
// ============================================================

/**
 * Remote Pairs: chain of identical bivalue cells {A,B} linked by strong pairs.
 * Odd-distance endpoints form a locked pair → eliminate A,B from their common peers.
 */
function tryRemotePairs(grid: Grid): Step | null {
  // Find all bivalue cells (cells with exactly 2 candidates)
  const bivalueCells = new Map<number, number[]>(); // mask → cells
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const mask = grid.candidatesOf(c);
    if (popcount(mask) !== 2) continue;
    if (!bivalueCells.has(mask)) bivalueCells.set(mask, []);
    bivalueCells.get(mask)!.push(c);
  }
  
  for (const [mask, cells] of bivalueCells) {
    if (cells.length < 2) continue;
    
    // Build graph: cells are nodes, edges = mutual-sight pairs (among cells with same pair)
    // Two cells at ODD distance are a locked pair
    const [A, B] = digitsOf(mask) as [number, number];
    const ABit = maskOf(A);
    const BBit = maskOf(B);
    
    // BFS to find connected components with distances
    const distFrom = new Map<number, Map<number, number>>();
    
    for (const start of cells) {
      if (distFrom.has(start)) continue;
      const dist = new Map<number, number>();
      dist.set(start, 0);
      const queue = [start];
      
      while (queue.length > 0) {
        const cur = queue.shift()!;
        const curDist = dist.get(cur)!;
        
        // Neighbors: other bivalue {A,B} cells that see this cell
        for (const neighbor of cells) {
          if (dist.has(neighbor)) continue;
          if (PEERS_OF[cur]!.includes(neighbor)) {
            dist.set(neighbor, curDist + 1);
            queue.push(neighbor);
          }
        }
      }
      
      if (dist.size >= 2) distFrom.set(start, dist);
    }
    
    // Find odd-distance pairs and check for eliminations
    for (const [start, dist] of distFrom) {
      for (const [end, d] of dist) {
        if (end <= start) continue; // avoid double-counting
        if (d % 2 === 0) continue; // even distance = no elimination
        if (d < 3) continue; // distance 1 = naked pair (handled elsewhere)
        
        // start and end are at odd distance → locked pair on {A,B}
        // Eliminate A and B from common peers of start and end
        const startPeers = new Set(PEERS_OF[start]!);
        const elims: { cell: number; digit: number }[] = [];
        
        for (const peer of PEERS_OF[end]!) {
          if (!startPeers.has(peer)) continue;
          if (cells.includes(peer)) continue; // don't eliminate from chain cells
          if (grid.get(peer) !== 0) continue;
          if (grid.hasCandidate(peer, A)) elims.push({ cell: peer, digit: A });
          if (grid.hasCandidate(peer, B)) elims.push({ cell: peer, digit: B });
        }
        
        if (elims.length === 0) continue;
        
        // Reconstruct the chain path for highlights
        const chainPath = reconstructPath(start, end, cells, dist);
        
        return {
          strategyId: 'remote-pairs',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: [...chainPath, ...elims.map((e) => e.cell)],
            candidates: chainPath.flatMap((c) => [
              { cell: c, digit: A },
              { cell: c, digit: B },
            ]),
            links: buildRemotePairsLinks(chainPath, A),
          },
          explanation: {
            zh: `远程数对：双值格链 ${chainPath.map(cellLabel).join('-')}（候选 {${A},${B}}），奇数距离端点互为锁定对；消去能看到两端的格中的 ${A} 和 ${B}。`,
            en: `Remote Pairs: chain of bivalue cells ${chainPath.map(cellLabel).join('-')} (pair {${A},${B}}), odd-distance endpoints form a locked pair; eliminate ${A},${B} from cells seeing both endpoints.`,
          },
        };
      }
    }
  }
  
  return null;
}

function reconstructPath(
  start: number,
  end: number,
  cells: number[],
  dist: Map<number, number>,
): number[] {
  // BFS backward from end to start
  const path: number[] = [end];
  let current = end;
  const targetDist = dist.get(end)!;
  
  for (let d = targetDist - 1; d >= 0; d--) {
    for (const neighbor of cells) {
      if (dist.get(neighbor) !== d) continue;
      if (!PEERS_OF[current]!.includes(neighbor)) continue;
      path.push(neighbor);
      current = neighbor;
      break;
    }
  }
  
  return path.reverse();
}

function buildRemotePairsLinks(
  path: number[],
  digit: number,
): import('../trace.js').Link[] {
  const links: import('../trace.js').Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: { cell: path[i]!, digit },
      to: { cell: path[i + 1]!, digit },
      type: 'strong',
    });
  }
  return links;
}

// ============================================================
// Bent Sets (Almost Locked Pair/Triple / ALC)
// ============================================================

/**
 * Bent Sets:
 * A line-ALS and a box-ALS sharing the same digit set S, meeting at a line-box intersection.
 * If S is confined to I ∪ L in the line, eliminate S from box cells outside I and B.
 * If S is confined to I ∪ B in the box, eliminate S from line cells outside I and L.
 */
function tryBentSets(grid: Grid): Step | null {
  // For each line (row/col) and box intersection:
  for (let lineType = 0; lineType < 2; lineType++) {
    const lineArr = lineType === 0 ? ROWS : COLS;
    
    for (let lineIdx = 0; lineIdx < 9; lineIdx++) {
      const line = lineArr[lineIdx]!;
      
      // Find which boxes this line crosses
      const boxIndices = [...new Set(line.map((c) => BOX_OF[c]!))];
      
      for (const boxIdx of boxIndices) {
        const box = BOXES[boxIdx]!;
        
        // Intersection I = cells in both line and box
        const I = line.filter((c) => box.includes(c));
        
        // L = line cells outside I
        const L = line.filter((c) => !I.includes(c));
        
        // B = box cells outside I
        const B = box.filter((c) => !I.includes(c));
        
        // Try digit sets S of size 2 (Almost Locked Pair) and 3 (Almost Locked Triple)
        for (const sSize of [2, 3]) {
          const result = checkALC(grid, I, L, B, sSize);
          if (result) return result;
        }
      }
    }
  }
  
  return null;
}

function checkALC(
  grid: Grid,
  I: number[],
  L: number[],
  B: number[],
  sSize: number,
): Step | null {
  // Find all candidate masks in L and B (empty cells only)
  const lEmpty = L.filter((c) => grid.get(c) === 0);
  const bEmpty = B.filter((c) => grid.get(c) === 0);
  
  if (lEmpty.length < sSize - 1 || bEmpty.length < sSize - 1) return null;
  
  // Get all digits that appear in I
  const iDigits = new Set<number>();
  for (const c of I) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) iDigits.add(d);
  }
  
  // Try all combinations of (sSize-1) L-cells for Line-ALS
  for (const lCombo of getCombinations(lEmpty, sSize - 1)) {
    let lMask = 0;
    for (const c of lCombo) lMask |= grid.candidatesOf(c);
    if (popcount(lMask) !== sSize) continue; // must be ALS (N cells, N+1 digits... wait)
    // Actually for bent sets: L-ALS is (sSize-1) cells with candidates ⊆ S
    // We need to find S and check lCombo is an ALS for S
    
    // The S is the digit set of lCombo
    const S = digitsOf(lMask);
    if (S.length !== sSize) continue;
    
    // Check that lCombo is actually a (sSize-1)-cell ALS for S: all candidates ⊆ S
    if (!lCombo.every((c) => (grid.candidatesOf(c) & ~lMask) === 0)) continue;
    
    // Try all combinations of (sSize-1) B-cells for Box-ALS on the SAME S
    for (const bCombo of getCombinations(bEmpty, sSize - 1)) {
      let bMask = 0;
      for (const c of bCombo) bMask |= grid.candidatesOf(c);
      if (bMask !== lMask) continue; // same digit set S
      
      // Check that bCombo is an ALS for S: all candidates ⊆ S
      if (!bCombo.every((c) => (grid.candidatesOf(c) & ~bMask) === 0)) continue;
      
      // Now check fire conditions:
      // Box-side fire: all line cells outside I∪L have no digit of S
      // → eliminate S from box cells outside I∪B
      const lineRemainder = L.filter((c) => !lCombo.includes(c) && grid.get(c) === 0);
      const boxSideFires = lineRemainder.every((c) => (grid.candidatesOf(c) & lMask) === 0);
      
      if (boxSideFires) {
        const elimCells = bEmpty.filter((c) => !bCombo.includes(c));
        const elims: { cell: number; digit: number }[] = [];
        for (const c of elimCells) {
          for (const d of S) {
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length > 0) {
          const patternCells = [...lCombo, ...bCombo, ...I.filter((c) => grid.get(c) === 0)];
          return {
            strategyId: 'bent-sets',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...patternCells, ...elims.map((e) => e.cell)],
              candidates: patternCells.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `弯曲集（几乎锁定${sSize === 2 ? '对' : '三'}）：线上 ALS（${lCombo.map(cellLabel).join(',')}）与盒内 ALS（${bCombo.map(cellLabel).join(',')}）共享候选集 {${S.join(',')}}；消去盒内交叉区外的相关候选。`,
              en: `Bent Sets (Almost Locked ${sSize === 2 ? 'Pair' : 'Triple'}): line-ALS (${lCombo.map(cellLabel).join(',')}) and box-ALS (${bCombo.map(cellLabel).join(',')}) share digit set {${S.join(',')}}; eliminate from box cells outside intersection.`,
            },
          };
        }
      }
      
      // Line-side fire: all box cells outside I∪B have no digit of S
      // → eliminate S from line cells outside I∪L
      const boxRemainder = B.filter((c) => !bCombo.includes(c) && grid.get(c) === 0);
      const lineSideFires = boxRemainder.every((c) => (grid.candidatesOf(c) & bMask) === 0);
      
      if (lineSideFires) {
        const elimCells = lEmpty.filter((c) => !lCombo.includes(c));
        const elims: { cell: number; digit: number }[] = [];
        for (const c of elimCells) {
          for (const d of S) {
            if (grid.hasCandidate(c, d)) elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length > 0) {
          const patternCells = [...lCombo, ...bCombo, ...I.filter((c) => grid.get(c) === 0)];
          return {
            strategyId: 'bent-sets',
            placements: [],
            eliminations: elims,
            highlights: {
              cells: [...patternCells, ...elims.map((e) => e.cell)],
              candidates: patternCells.flatMap((c) =>
                digitsOf(grid.candidatesOf(c)).map((d) => ({ cell: c, digit: d })),
              ),
              links: [],
            },
            explanation: {
              zh: `弯曲集（几乎锁定${sSize === 2 ? '对' : '三'}）：线上 ALS（${lCombo.map(cellLabel).join(',')}）与盒内 ALS（${bCombo.map(cellLabel).join(',')}）共享候选集 {${S.join(',')}}；消去行/列交叉区外的相关候选。`,
              en: `Bent Sets (Almost Locked ${sSize === 2 ? 'Pair' : 'Triple'}): line-ALS (${lCombo.map(cellLabel).join(',')}) and box-ALS (${bCombo.map(cellLabel).join(',')}) share digit set {${S.join(',')}}; eliminate from line cells outside intersection.`,
            },
          };
        }
      }
    }
  }
  
  return null;
}

/** Generate k-combinations from arr. */
function* getCombinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of getCombinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* getCombinations(rest, k);
}

// ============================================================
// Broken Wing (Guardians / Oddagon)
// ============================================================

/**
 * Broken Wing: an odd-length loop on a single digit.
 *
 * A VALID Broken Wing requires:
 * 1. A cycle of n cells (n odd, n >= 5) where consecutive cells share a house
 * 2. EXACTLY (n-1) links are STRONG (conjugate pairs: exactly 2 d-cells in house)
 * 3. EXACTLY 1 link is IMPERFECT (3+ d-cells in house), contributing the guardians
 *    (the "extra" d-cells in that house beyond the two loop cells)
 *
 * The constraint "at least one guardian is true" follows because:
 * - If all guardians were false, only the loop cells remain in that house → 2 cells
 * - But then ALL n links would be strong → perfect odd strong-link cycle → impossible
 *
 * Elimination: at least one guardian is true → cells seeing ALL guardians cannot be d.
 * Placement: if exactly ONE guardian exists, it must be d.
 *
 * CRITICAL SOUNDNESS CONSTRAINT: We must verify that EXACTLY (n-1) links are strong
 * and exactly 1 is imperfect. Otherwise the "at least one guardian is true" argument
 * doesn't hold (could have multiple imperfect links where none needs to be guardian).
 */
function tryBrokenWing(grid: Grid): Step | null {
  for (let d = 1; d <= 9; d++) {
    const bit = maskOf(d);
    
    // Build strong-link adjacency (conjugate pairs)
    const strongAdj = new Map<number, number[]>();
    for (const house of HOUSES) {
      const dCellsInHouse = house.filter(
        (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
      );
      if (dCellsInHouse.length === 2) {
        const [a, b] = dCellsInHouse as [number, number];
        if (!strongAdj.has(a)) strongAdj.set(a, []);
        if (!strongAdj.has(b)) strongAdj.set(b, []);
        strongAdj.get(a)!.push(b);
        strongAdj.get(b)!.push(a);
      }
    }
    
    // Find all cells in the strong-link graph
    const strongCells = [...strongAdj.keys()];
    if (strongCells.length < 4) continue; // Need at least 4 for an imperfect 5-cycle
    
    // Search for cycles of length 5 (canonical) or 7 where exactly 1 link is imperfect
    for (const loopLen of [5, 7]) {
      const result = findBrokenWingWithStrongLinks(grid, d, bit, strongAdj, strongCells, loopLen);
      if (result) return result;
    }
  }
  
  return null;
}

/**
 * Find a broken wing where (loopLen-1) links are strong and 1 is imperfect.
 * The imperfect link connects two cells that are NOT in the strong-link adjacency
 * but share a house with extra d-cells.
 *
 * Performance: limit DFS with strict depth limit and early pruning.
 */
function findBrokenWingWithStrongLinks(
  grid: Grid,
  d: number,
  bit: number,
  strongAdj: Map<number, number[]>,
  strongCells: number[],
  loopLen: number,
): Step | null {
  // Only look for length-5 cycles (canonical broken wing) for performance
  if (loopLen !== 5) return null;
  
  // For a 5-cell broken wing: we need 4 strong links + 1 imperfect link.
  // Approach: enumerate pairs (A, E) where A and E share an imperfect house
  // (house with 3+ d-cells). Then find if there's a 4-strong-link path from A to E.
  
  // Build imperfect link pairs
  for (const house of HOUSES) {
    const dInHouse = house.filter(
      (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
    );
    if (dInHouse.length < 3) continue; // Need at least 3 for an imperfect link
    
    // Try each pair of cells from dInHouse as the "imperfect link" endpoints
    for (let ai = 0; ai < dInHouse.length; ai++) {
      for (let bi = ai + 1; bi < dInHouse.length; bi++) {
        const A = dInHouse[ai]!;
        const E = dInHouse[bi]!;
        
        // Guardians: other d-cells in this house
        const guardians = dInHouse.filter((c) => c !== A && c !== E);
        if (guardians.length === 0) continue;
        
        // Find a path of 3 intermediate cells using strong links: A → B → C → D → E
        // (4 strong links total)
        if (!strongAdj.has(A) || !strongAdj.has(E)) continue;
        
        const result = findStrongPath4(grid, d, strongAdj, A, E, guardians);
        if (result) return result;
      }
    }
  }
  
  return null;
}

/**
 * Find a path A → B → C → D → E using 4 strong links.
 * Returns a broken wing step if found, null otherwise.
 */
function findStrongPath4(
  grid: Grid,
  d: number,
  strongAdj: Map<number, number[]>,
  A: number,
  E: number,
  guardians: number[],
): Step | null {
  // DFS for path: A → B → C → D → E (4 steps via strong links)
  const path = [A];
  const pathSet = new Set([A]);
  
  // We need exactly 4 strong links: A-B-C-D-E
  // B must be a strong neighbor of A that isn't E (unless path length is 4)
  for (const B of (strongAdj.get(A) ?? [])) {
    if (B === E && path.length < 4) continue; // Can't close yet
    if (pathSet.has(B)) continue;
    
    path.push(B); pathSet.add(B);
    
    for (const C of (strongAdj.get(B) ?? [])) {
      if (C === E && path.length < 4) continue;
      if (pathSet.has(C)) continue;
      
      path.push(C); pathSet.add(C);
      
      for (const D of (strongAdj.get(C) ?? [])) {
        if (pathSet.has(D)) continue;
        if (D === A) continue; // Can't loop back to start mid-path
        
        // Check if D has E as a strong neighbor to complete the path
        if ((strongAdj.get(D) ?? []).includes(E) && !pathSet.has(E)) {
          path.push(D); pathSet.add(D);
          path.push(E); pathSet.add(E);
          
          // We have a valid 5-cell broken wing: path=[A,B,C,D,E], guardians from A-E imperfect link
          const result = evaluateBrokenWingGuardians(grid, d, maskOf(d), path, guardians);
          
          path.pop(); pathSet.delete(E);
          path.pop(); pathSet.delete(D);
          
          if (result) return result;
        }
      }
      
      path.pop(); pathSet.delete(C);
    }
    
    path.pop(); pathSet.delete(B);
  }
  
  return null;
}

/**
 * Given a broken wing loop and its guardians (extra d-cells from the imperfect link),
 * produce the appropriate elimination or placement.
 */
function evaluateBrokenWingGuardians(
  grid: Grid,
  d: number,
  bit: number,
  loop: number[],
  guardians: number[],
): Step | null {
  const loopSet = new Set(loop);
  const guardianSet = new Set(guardians);
  const n = loop.length;
  
  // Case 1: Single guardian → must be d
  if (guardians.length === 1) {
    const g = guardians[0]!;
    if (!grid.hasCandidate(g, d)) return null;
    
    return {
      strategyId: 'broken-wing',
      placements: [{ cell: g, digit: d }],
      eliminations: [],
      highlights: {
        cells: [...loop, g],
        candidates: [
          ...loop.map((c) => ({ cell: c, digit: d })),
          { cell: g, digit: d },
        ],
        links: buildLoopLinks(loop, d),
      },
      explanation: {
        zh: `断翼（奇数环）：数字 ${d} 的 ${n} 格奇数环（${loop.map(cellLabel).join('-')}）有唯一守护者 ${cellLabel(g)}；守护者必须为 ${d}。`,
        en: `Broken Wing: odd ${n}-cell loop on digit ${d} (${loop.map(cellLabel).join('-')}) has single guardian ${cellLabel(g)}; guardian must be ${d}.`,
      },
    };
  }
  
  // Case 2/3: Multiple guardians → eliminate from cells seeing ALL guardians
  const elims: { cell: number; digit: number }[] = [];
  const elimSet = new Set<number>();
  
  for (let c = 0; c < CELLS; c++) {
    if (loopSet.has(c) || guardianSet.has(c)) continue;
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    
    const peers = new Set(PEERS_OF[c]!);
    if (guardians.every((g) => peers.has(g))) {
      if (!elimSet.has(c)) {
        elimSet.add(c);
        elims.push({ cell: c, digit: d });
      }
    }
  }
  
  // Loop cells (not guardians) that see all guardians
  for (const loopCell of loop) {
    if (guardianSet.has(loopCell)) continue;
    if (!grid.hasCandidate(loopCell, d)) continue;
    
    const peers = new Set(PEERS_OF[loopCell]!);
    if (guardians.every((g) => peers.has(g))) {
      if (!elimSet.has(loopCell)) {
        elimSet.add(loopCell);
        elims.push({ cell: loopCell, digit: d });
      }
    }
  }
  
  if (elims.length === 0) return null;
  
  return {
    strategyId: 'broken-wing',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...loop, ...guardians, ...elims.map((e) => e.cell)],
      candidates: [
        ...loop.map((c) => ({ cell: c, digit: d })),
        ...guardians.map((c) => ({ cell: c, digit: d })),
      ],
      links: buildLoopLinks(loop, d),
    },
    explanation: {
      zh: `断翼（奇数环）：数字 ${d} 的 ${n} 格奇数环（${loop.map(cellLabel).join('-')}）有守护者 {${guardians.map(cellLabel).join(',')}}；能看到所有守护者的格中的 ${d} 被消去。`,
      en: `Broken Wing: odd ${n}-cell loop on digit ${d} (${loop.map(cellLabel).join('-')}) with guardians {${guardians.map(cellLabel).join(',')}}; eliminate ${d} from cells seeing all guardians.`,
    },
  };
}

function buildLoopLinks(
  loop: number[],
  digit: number,
): import('../trace.js').Link[] {
  const links: import('../trace.js').Link[] = [];
  const n = loop.length;
  for (let i = 0; i < n; i++) {
    links.push({
      from: { cell: loop[i]!, digit },
      to: { cell: loop[(i + 1) % n]!, digit },
      type: 'strong',
    });
  }
  return links;
}

// ============================================================
// Strategy exports
// ============================================================

export const wxyzWing: Strategy = {
  id: 'wxyz-wing',
  name: { zh: 'WXYZ翼', en: 'WXYZ-Wing' },
  difficulty: 520,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryWXYZWing(grid);
  },
};

export const remotePairs: Strategy = {
  id: 'remote-pairs',
  name: { zh: '远程数对', en: 'Remote Pairs' },
  difficulty: 505,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryRemotePairs(grid);
  },
};

export const bentSets: Strategy = {
  id: 'bent-sets',
  name: { zh: '弯曲集', en: 'Bent Sets' },
  difficulty: 540,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    return tryBentSets(grid);
  },
};

export const brokenWing: Strategy = {
  id: 'broken-wing',
  name: { zh: '断翼', en: 'Broken Wing' },
  difficulty: 560,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    return tryBrokenWing(grid);
  },
};
