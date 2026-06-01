/**
 * AIC Engine — Alternating Inference Chains (T4, difficulty 70).
 *
 * Models the board as a graph of candidates (cell, digit) pairs.
 *
 * STRONG LINK between nodes A and B:
 *   - Same digit in the same house where only A and B have that digit (conjugate pair)
 *   - Two different digits in the same bivalue cell (the only two candidates)
 *   Semantics: A=false ⟹ B=true (and B=false ⟹ A=true)
 *
 * WEAK LINK between nodes A and B:
 *   - Same digit in cells that see each other
 *   - Different digits in the same cell
 *   Semantics: A=true ⟹ B=false
 *   Note: every strong link is ALSO a valid weak link.
 *
 * AIC CHAIN: A sequence of alternating strong and weak links.
 *   The canonical direction: start --strong--> n1 --weak--> n2 --strong--> ...
 *   Reading: "if start is FALSE, then n1 is TRUE, n2 is FALSE, ..."
 *
 * DEDUCTIONS:
 *
 * Type 1 (Discontinuous, same digit at both ends):
 *   Chain: start(d) --s--> ... --w--> end(d)
 *   Reading: start=false ⟹ end=false
 *   But: start and end see each other (same digit, same house) → can't both be false
 *   → start must be TRUE.
 *   ELIMINATION: eliminate digit d from cells seeing both start-cell and end-cell
 *   (including possibly placing d in start-cell if it's a bivalue cell)
 *
 * Type 2 (Discontinuous, different situations at both ends):
 *   Case A: same cell, different digits
 *     Chain: (cell, d1) --s--> ... --w--> (cell, d2)
 *     Reading: cell≠d1 ⟹ cell≠d2 → both must be false if no other option
 *     But cell must have SOME digit, so at least one of d1, d2 is there.
 *     → eliminate all other candidates from cell
 *   Case B: cells see each other, different digits
 *     Chain: (cell1, d1) --s--> ... --w--> (cell2, d2), cell1 sees cell2
 *     → eliminate (cell2, d1) and (cell1, d2) if they exist
 *
 * Continuous Nice Loop:
 *   Chain closes back to start. Every WEAK link in the loop can eliminate.
 *   - Same-digit weak link: cells seeing both endpoints lose that digit.
 *   - Same-cell weak link: other candidates in that cell are eliminated.
 *
 * SEARCH CONSTRAINTS (from forcing-boundary.md):
 *   - Max chain length: MAX_AIC_DEPTH nodes
 *   - No branching (single linear chain, not a net)
 *   - Strictly alternating strong/weak links
 *   - BFS to prefer shorter chains first
 */

import { HOUSES, ROW_OF, COL_OF, BOX_OF, SIZE, maskOf, digitsOf, popcount } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

/** Maximum number of nodes in an AIC chain (human tractability limit). */
const MAX_AIC_DEPTH = 14;

// ---- Compact node IDs ----
// nodeId = cell * 9 + (digit - 1), range [0, 729)
function nodeId(cell: number, digit: number): number { return cell * 9 + (digit - 1); }
function nodeCell(id: number): number { return Math.floor(id / 9); }
function nodeDigit(id: number): number { return (id % 9) + 1; }

// ---- Link graph ----
interface LinkGraph {
  /** strong[n] = set of nodes with a STRONG link to n */
  strong: Map<number, number[]>;
  /** weakExtra[n] = set of nodes with a WEAK-ONLY link to n (strong not included) */
  weakExtra: Map<number, number[]>;
}

function buildLinkGraph(grid: Grid): LinkGraph {
  const strong = new Map<number, number[]>();
  const weakExtra = new Map<number, number[]>();

  function addS(a: number, b: number): void {
    if (!strong.has(a)) strong.set(a, []);
    if (!strong.has(b)) strong.set(b, []);
    if (!strong.get(a)!.includes(b)) strong.get(a)!.push(b);
    if (!strong.get(b)!.includes(a)) strong.get(b)!.push(a);
  }

  function addW(a: number, b: number): void {
    // Only add if NOT already a strong link
    if (strong.get(a)?.includes(b)) return;
    if (!weakExtra.has(a)) weakExtra.set(a, []);
    if (!weakExtra.has(b)) weakExtra.set(b, []);
    if (!weakExtra.get(a)!.includes(b)) weakExtra.get(a)!.push(b);
    if (!weakExtra.get(b)!.includes(a)) weakExtra.get(b)!.push(a);
  }

  // Strong links from conjugate pairs (house with exactly 2 candidates for digit d)
  for (const house of HOUSES) {
    for (let d = 1; d <= SIZE; d++) {
      const bit = maskOf(d);
      const cells = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cells.length === 2) {
        addS(nodeId(cells[0]!, d), nodeId(cells[1]!, d));
      }
    }
  }

  // Strong links from bivalue cells (exactly 2 candidates)
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    const mask = grid.candidatesOf(cell);
    if (popcount(mask) === 2) {
      const [d1, d2] = digitsOf(mask) as [number, number];
      addS(nodeId(cell, d1), nodeId(cell, d2));
    }
  }

  // Weak links: same digit in peer cells, or different digits same cell
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    const mask = grid.candidatesOf(cell);
    const digits = digitsOf(mask);

    // Same cell, different candidates (weak if not already strong/bivalue)
    for (let i = 0; i < digits.length; i++) {
      for (let j = i + 1; j < digits.length; j++) {
        addW(nodeId(cell, digits[i]!), nodeId(cell, digits[j]!));
      }
    }

    // Same digit in peer cells
    for (let cell2 = cell + 1; cell2 < 81; cell2++) {
      if (grid.get(cell2) !== 0) continue;
      // Check if peer
      if (ROW_OF[cell] !== ROW_OF[cell2] && COL_OF[cell] !== COL_OF[cell2] && BOX_OF[cell] !== BOX_OF[cell2]) continue;
      const mask2 = grid.candidatesOf(cell2);
      const shared = mask & mask2;
      for (const d of digitsOf(shared)) {
        addW(nodeId(cell, d), nodeId(cell2, d));
      }
    }
  }

  return { strong, weakExtra };
}

/** Get all nodes reachable from n via the given link type. Strong links can always sub for weak. */
function getNeighbors(graph: LinkGraph, n: number, wantStrong: boolean): number[] {
  if (wantStrong) {
    return graph.strong.get(n) ?? [];
  }
  // For weak step: return both weakExtra and strong neighbors
  const result: number[] = [];
  for (const nb of graph.strong.get(n) ?? []) result.push(nb);
  for (const nb of graph.weakExtra.get(n) ?? []) result.push(nb);
  return result;
}

/** True if two cells are peers. */
function seePeers(a: number, b: number): boolean {
  return ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b];
}

/**
 * Compute AIC eliminations given a complete chain path.
 *
 * The chain alternates strong/weak starting with strong from start:
 *   start(FALSE) --s--> pos1(TRUE) --w--> pos2(FALSE) --s--> pos3(TRUE) ...
 *
 * For a chain of length N (N nodes, N-1 links):
 *   - If last link is STRONG: end node is TRUE when start is FALSE.
 *     This means: NOT start → end=TRUE, i.e., the cell/digit at end is forced TRUE
 *     whenever start is FALSE.
 *     → Combined with "IF start=TRUE": cells seeing start also lose the digit.
 *     → RESULT: either start(d) or end(d) is true → cells seeing BOTH lose d. (Type 1)
 *     → If same cell different digit: cell must have d1 OR d2 → other candidates eliminated. (Type 2)
 *
 *   - If last link is WEAK: end node is FALSE when start is FALSE.
 *     This is only useful for LOOPS or if we consider the reverse direction.
 *     For open chains ending weak: not directly actionable for standard elimination.
 *
 * LOOP CASE (end == start node):
 *   In a continuous loop, every weak link in the loop generates eliminations
 *   (the loop makes every weak link effectively have conjugate semantics).
 */
function computeEliminations(
  path: number[],
  isStrongArr: boolean[],
  chainCellSet: Set<number>,
  grid: Grid,
): { elims: CellDigit[]; type: 'type1' | 'type2' | 'loop' } | null {
  if (path.length < 4) return null; // minimum useful chain: 4 nodes (3 links) for open, 5 for loop

  const startNode = path[0]!;
  const endNode = path[path.length - 1]!;
  const startCell = nodeCell(startNode);
  const startDigit = nodeDigit(startNode);
  const endCell = nodeCell(endNode);
  const endDigit = nodeDigit(endNode);

  // ---- Continuous Nice Loop (closed loop) ----
  // A valid continuous nice loop: end == start AND the closing link is WEAK.
  // The closing link type is isStrongArr[last] = false (weak).
  // Minimum 4 unique nodes (path length >= 5 since last == first).
  const closingLinkStrong = isStrongArr[isStrongArr.length - 1]!;
  if (endNode === startNode && path.length >= 5 && !closingLinkStrong) {
    const loopLen = path.length - 1; // number of unique nodes in loop
    const elims: CellDigit[] = [];

    for (let i = 0; i < loopLen; i++) {
      const curr = path[i]!;
      const next = path[(i + 1) % loopLen]!;
      const isS = isStrongArr[i]!;

      if (!isS) {
        // Weak link (curr) to (next): cells "seeing" this weak link lose the digit
        const ca = nodeCell(curr);
        const da = nodeDigit(curr);
        const cb = nodeCell(next);
        const db = nodeDigit(next);

        if (da === db) {
          // Same digit weak link: cells in the same house as both ca and cb lose digit da
          for (let cell = 0; cell < 81; cell++) {
            if (chainCellSet.has(cell)) continue;
            if (!grid.hasCandidate(cell, da)) continue;
            if (seePeers(cell, ca) && seePeers(cell, cb)) {
              elims.push({ cell, digit: da });
            }
          }
        } else if (ca === cb) {
          // Same cell, different digits: this is a "cell weak link" in the loop.
          // Only safe to eliminate OTHER candidates if the cell is bivalue (only 2 candidates).
          // If the cell has more candidates, the loop logic doesn't lock it to just {da, db}.
          const cell = ca;
          if (popcount(grid.candidatesOf(cell)) === 2) {
            const mask = grid.candidatesOf(cell);
            const keepBit = maskOf(da) | maskOf(db);
            for (const d of digitsOf(mask & ~keepBit)) {
              elims.push({ cell, digit: d });
            }
          }
        }
      }
    }

    const deduped = dedup(elims);
    if (deduped.length > 0) return { elims: deduped, type: 'loop' };
    return null;
  }

  // For open (discontinuous) AIC: the chain must end with a STRONG link.
  // Reason: last link STRONG means end is TRUE when start is FALSE.
  //   → Either start=TRUE or end=TRUE (at least one must be)
  //   → Cells seeing BOTH can be eliminated.
  const lastStrong = isStrongArr[isStrongArr.length - 1]!;
  if (!lastStrong) return null; // Only open chains ending with strong produce eliminations

  // ---- Type 1: same digit at both ends, different cells, they see each other ----
  // Semantics: start(d)=FALSE → end(d)=TRUE. Either start or end has digit d.
  // → Cells seeing BOTH start-cell and end-cell lose digit d.
  if (startDigit === endDigit && startCell !== endCell && seePeers(startCell, endCell)) {
    const d = startDigit;
    const elims: CellDigit[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (chainCellSet.has(cell)) continue;
      if (!grid.hasCandidate(cell, d)) continue;
      if (seePeers(cell, startCell) && seePeers(cell, endCell)) {
        elims.push({ cell, digit: d });
      }
    }
    if (elims.length > 0) return { elims, type: 'type1' };
    return null;
  }

  // ---- Type 2A: same cell, different digits (both ends in the same cell) ----
  // Semantics: (cell, d1)=FALSE → (cell, d2)=TRUE. So cell must have d1 OR d2.
  // → Other candidates in cell are eliminated.
  if (startCell === endCell && startDigit !== endDigit) {
    const cell = startCell;
    const mask = grid.candidatesOf(cell);
    const keepBit = maskOf(startDigit) | maskOf(endDigit);
    const elims: CellDigit[] = [];
    for (const d of digitsOf(mask & ~keepBit)) {
      elims.push({ cell, digit: d });
    }
    if (elims.length > 0) return { elims, type: 'type2' };
    return null;
  }

  return null;
}

function dedup(elims: CellDigit[]): CellDigit[] {
  const seen = new Set<number>();
  return elims.filter((e) => {
    const k = e.cell * 10 + e.digit;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Convert path to visualization links. */
function pathToLinks(path: number[], isStrongArr: boolean[]): Link[] {
  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: { cell: nodeCell(path[i]!), digit: nodeDigit(path[i]!) },
      to: { cell: nodeCell(path[i + 1]!), digit: nodeDigit(path[i + 1]!) },
      type: isStrongArr[i] ? 'strong' : 'weak',
    });
  }
  return links;
}

function fmtNode(id: number): string {
  const cell = nodeCell(id);
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}(${nodeDigit(id)})`;
}

function buildStep(
  path: number[],
  isStrongArr: boolean[],
  result: { elims: CellDigit[]; type: 'type1' | 'type2' | 'loop' },
  grid: Grid,
): Step {
  const { elims, type } = result;
  const links = pathToLinks(path, isStrongArr);
  const chainStr = path.map(fmtNode).join(' → ');
  const elimStr = elims.map((e) => `R${ROW_OF[e.cell]! + 1}C${COL_OF[e.cell]! + 1}(${e.digit})`).join('、');

  // Descriptive name
  const isX = path.every((n) => nodeDigit(n) === nodeDigit(path[0]!));
  const isXY = path.every((n) => grid.get(nodeCell(n)) === 0 && popcount(grid.candidatesOf(nodeCell(n))) === 2);
  let name = 'AIC';
  if (isX) name = type === 'loop' ? 'Nice Loop (X)' : 'X-Chain';
  else if (isXY) name = type === 'loop' ? 'Nice Loop (XY)' : 'XY-Chain';

  const zhType = type === 'loop' ? '连续环' : type === 'type1' ? 'Type1' : 'Type2';
  const enType = type === 'loop' ? 'Loop' : type === 'type1' ? 'Type 1' : 'Type 2';

  const chainCells = [...new Set(path.map(nodeCell))];
  const chainCandidates = path.map((n) => ({ cell: nodeCell(n), digit: nodeDigit(n) }));

  return {
    strategyId: 'aic',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: chainCells,
      candidates: chainCandidates,
      links,
    },
    explanation: {
      zh: `AIC（${zhType}）[${name}]：${chainStr}。消除：${elimStr}。`,
      en: `AIC (${enType}) [${name}]: ${chainStr}. Eliminations: ${elimStr}.`,
    },
  };
}

function tryAIC(grid: Grid): Step | null {
  const graph = buildLinkGraph(grid);

  // Collect nodes that have at least one strong link (needed to start a chain)
  const startNodes: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (grid.get(cell) !== 0) continue;
    const mask = grid.candidatesOf(cell);
    for (let d = 1; d <= SIZE; d++) {
      if (mask & maskOf(d)) {
        const n = nodeId(cell, d);
        if ((graph.strong.get(n)?.length ?? 0) > 0) {
          startNodes.push(n);
        }
      }
    }
  }

  // BFS from each start node to find chains
  for (const startNode of startNodes) {
    const found = bfsAIC(graph, startNode, grid);
    if (found !== null) return found;
  }

  return null;
}

/**
 * BFS from startNode to find the shortest valid AIC chain.
 * The chain starts with a strong link.
 */
function bfsAIC(graph: LinkGraph, startNode: number, grid: Grid): Step | null {
  type Frame = {
    node: number;
    path: number[];
    isStrong: boolean[];
    nodeSet: Set<number>;
    cellSet: Set<number>;
    nextIsStrong: boolean;
  };

  const queue: Frame[] = [{
    node: startNode,
    path: [startNode],
    isStrong: [],
    nodeSet: new Set([startNode]),
    cellSet: new Set([nodeCell(startNode)]),
    nextIsStrong: true,
  }];

  let qi = 0;
  while (qi < queue.length) {
    const frame = queue[qi++]!;
    const { node, path, isStrong, nodeSet, cellSet, nextIsStrong } = frame;

    if (path.length >= MAX_AIC_DEPTH) continue;

    const neighbors = getNeighbors(graph, node, nextIsStrong);

    for (const nb of neighbors) {
      // Allow closing loop back to start.
      // For a CONTINUOUS nice loop (generating weak-link eliminations):
      //   The closing link must be WEAK (nextIsStrong=false).
      //   This completes: strong, weak, strong, ..., strong, [weak→start]
      //   Minimum 4 unique nodes (path.length >= 5 after closing).
      // For a Type 1 DISCONTINUOUS loop (forced placement):
      //   The closing link must be STRONG (nextIsStrong=true).
      //   Result: start node is TRUE (placed).
      if (nb === startNode && path.length >= 4) {
        const newPath = [...path, nb];
        const newIsStrong = [...isStrong, nextIsStrong];

        if (!nextIsStrong) {
          // Continuous nice loop: weak closing link → eliminations from weak links
          const result = computeEliminations(newPath, newIsStrong, cellSet, grid);
          if (result && result.elims.length > 0) {
            return buildStep(newPath, newIsStrong, result, grid);
          }
        }
        // For strong closing link (discontinuous nice loop Type 1):
        // The start node must be TRUE — but we don't generate loop eliminations here;
        // this is handled by the open-chain Type 2A case instead (same cell different digit).
        continue;
      }

      if (nodeSet.has(nb)) continue; // no revisiting

      const newPath = [...path, nb];
      const newIsStrong = [...isStrong, nextIsStrong];
      const newNodeSet = new Set(nodeSet).add(nb);
      const newCellSet = new Set(cellSet).add(nodeCell(nb));

      // Check if this chain end produces useful eliminations.
      // Open-chain eliminations require the last link to be STRONG (nextIsStrong=true was used).
      // We check AFTER adding the node, so nextIsStrong was the link type we just added.
      if (nextIsStrong && newPath.length >= 4) {
        // We just added a STRONG link (end node is TRUE when start is FALSE)
        const result = computeEliminations(newPath, newIsStrong, newCellSet, grid);
        if (result && result.elims.length > 0) {
          return buildStep(newPath, newIsStrong, result, grid);
        }
      }

      // Extend the chain
      queue.push({
        node: nb,
        path: newPath,
        isStrong: newIsStrong,
        nodeSet: newNodeSet,
        cellSet: newCellSet,
        nextIsStrong: !nextIsStrong,
      });
    }
  }

  return null;
}

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'AIC' },
  difficulty: 70,
  apply: tryAIC,
};
