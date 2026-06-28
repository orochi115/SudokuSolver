/**
 * AIC with ALS nodes and AIC with UR nodes (P1)
 *
 * Parity model (identical to legacySearchAic in aic.ts):
 *   path[0] = start, assumed FALSE.
 *   After strong step → TRUE (odd positions 1, 3, 5 …).
 *   After weak step from TRUE → FALSE (even positions 2, 4, 6 …).
 *   Elimination checks fire at TRUE positions (after dfsStrong arrives at a node).
 *
 * ALS bridge: available when current is TRUE (at an odd position).
 *   TRUE current has digit == entryDigit AND sees all ALS cells with entryDigit.
 *   ALS collapses → locked set → exit node is a new TRUE node at position+2.
 *   Bridge is represented as a single 'strong' link in the path (implicit entry).
 */

import {
  CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface CandNode {
  cell: number;
  digit: number;
}

function encodeNode(cell: number, digit: number): number {
  return cell * 10 + digit;
}

interface ALS {
  cells: number[];
  digitMask: number;
  digits: number[];
}

function findAllALS(grid: Grid): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    const emptyCells = house.filter((c) => grid.get(c) === 0);

    for (let size = 1; size <= Math.min(4, emptyCells.length - 1); size++) {
      for (const combo of combinations(emptyCells, size)) {
        let mask = 0;
        for (const c of combo) mask |= grid.candidatesOf(c);
        if (popcount(mask) === size + 1) {
          const key = `${houseIndex}:${[...combo].sort((a, b) => a - b).join(',')}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            result.push({ cells: combo, digitMask: mask, digits: digitsOf(mask) });
          }
        }
      }
    }
  }
  return result;
}

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function strongNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];
  const bit = maskOf(node.digit);

  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    const houseCands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (houseCands.length === 2) {
      const other = houseCands.find((c) => c !== node.cell);
      if (other !== undefined) neighbors.push({ cell: other, digit: node.digit });
    }
  }

  if (popcount(grid.candidatesOf(node.cell)) === 2) {
    for (const d of digitsOf(grid.candidatesOf(node.cell))) {
      if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
    }
  }

  const seen = new Set<number>();
  return neighbors.filter((n) => {
    const key = encodeNode(n.cell, n.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function weakNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];
  const bit = maskOf(node.digit);

  for (const peer of PEERS_OF[node.cell]!) {
    if (grid.get(peer) === 0 && (grid.candidatesOf(peer) & bit) !== 0) {
      neighbors.push({ cell: peer, digit: node.digit });
    }
  }
  for (const d of digitsOf(grid.candidatesOf(node.cell))) {
    if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
  }

  const seen = new Set<number>();
  return neighbors.filter((n) => {
    const key = encodeNode(n.cell, n.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildStep(
  grid: Grid,
  strategyId: string,
  pathNodes: readonly CandNode[],
  links: readonly ('strong' | 'weak')[],
  rawPlacements: readonly { cell: number; digit: number }[],
  rawElims: readonly { cell: number; digit: number }[],
): Step | null {
  const placements = rawPlacements.filter(
    (p) => grid.get(p.cell) === 0 && grid.hasCandidate(p.cell, p.digit),
  );
  const seen = new Set<number>();
  const eliminations = rawElims.filter((e) => {
    const key = encodeNode(e.cell, e.digit);
    if (seen.has(key)) return false;
    seen.add(key);
    return grid.hasCandidate(e.cell, e.digit);
  });

  if (placements.length === 0 && eliminations.length === 0) return null;

  const linkObjs: Link[] = [];
  for (let i = 0; i < pathNodes.length - 1; i++) {
    linkObjs.push({
      from: { cell: pathNodes[i]!.cell, digit: pathNodes[i]!.digit },
      to: { cell: pathNodes[i + 1]!.cell, digit: pathNodes[i + 1]!.digit },
      type: links[i] ?? 'strong',
    });
  }

  const start = pathNodes[0]!;
  const end = pathNodes[pathNodes.length - 1]!;
  const actionZh = eliminations.length > 0
    ? `消去 ${eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(',')}`
    : `填入 ${placements.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}`;
  const actionEn = eliminations.length > 0
    ? `eliminate ${eliminations.map((e) => candidateLabel(e.cell, e.digit)).join(',')}`
    : `place ${placements.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}`;

  return {
    strategyId,
    placements,
    eliminations,
    highlights: {
      cells: [...new Set([
        ...pathNodes.map((n) => n.cell),
        ...eliminations.map((e) => e.cell),
        ...placements.map((p) => p.cell),
      ])],
      candidates: [
        ...pathNodes.map((n) => ({ cell: n.cell, digit: n.digit })),
        ...eliminations,
        ...placements,
      ],
      links: linkObjs,
    },
    explanation: {
      zh: `${strategyId === 'aic-with-als' ? '含 ALS 节点的交替推理链' : '含唯一矩形节点的 AIC'}：从 ${candidateLabel(start.cell, start.digit)} 到 ${candidateLabel(end.cell, end.digit)}；${actionZh}。`,
      en: `${strategyId === 'aic-with-als' ? 'AIC with ALS node' : 'AIC with UR node'}: chain from ${candidateLabel(start.cell, start.digit)} to ${candidateLabel(end.cell, end.digit)}; ${actionEn}.`,
    },
  };
}

// ============================================================
// AIC with ALS nodes
// ============================================================

function tryAICWithALS(grid: Grid, alsList: ALS[]): Step | null {
  const MAX_NODES = 14;

  const path: CandNode[] = [];
  const linkTypesArr: ('strong' | 'weak')[] = [];
  const visited = new Set<number>();

  /**
   * At a TRUE node (just arrived via strong link).
   * path[0] = FALSE start. current = TRUE endpoint.
   * Check eliminations, try ALS bridges, then take weak steps.
   */
  function atTrue(current: CandNode): Step | null {
    if (path.length >= MAX_NODES) return null;

    const start = path[0]!;
    const chainCellSet = new Set(path.map((n) => n.cell));

    // Elimination check (path.length >= 3: start + at least one FALSE + current)
    if (path.length >= 3) {
      // Type 1: same digit, common peers
      if (start.digit === current.digit && start.cell !== current.cell) {
        const startPeers = new Set(PEERS_OF[start.cell]!);
        const elims = PEERS_OF[current.cell]!
          .filter((c) => startPeers.has(c) && !chainCellSet.has(c) && grid.hasCandidate(c, start.digit))
          .map((c) => ({ cell: c, digit: start.digit }));
        if (elims.length > 0) {
          return buildStep(grid, 'aic-with-als', path, linkTypesArr, [], elims);
        }
      }
      // Type 2: same cell, different digits
      if (start.cell === current.cell && start.digit !== current.digit) {
        const keepMask = maskOf(start.digit) | maskOf(current.digit);
        const elims = digitsOf(grid.candidatesOf(start.cell))
          .filter((d) => !(keepMask & maskOf(d)))
          .map((d) => ({ cell: start.cell, digit: d }));
        if (elims.length > 0) {
          return buildStep(grid, 'aic-with-als', path, linkTypesArr, [], elims);
        }
      }
    }

    // ALS bridge: current (TRUE) → ALS (implicit entry) → exitNode (TRUE, depth+2)
    // Condition: current.digit == entryDigit AND current sees ALL ALS cells with entryDigit
    const currentPeers = new Set(PEERS_OF[current.cell]!);
    for (const als of alsList) {
      if (als.cells.includes(current.cell)) continue;
      if (path.some((n) => als.cells.includes(n.cell))) continue;

      const entryDigit = current.digit;
      if (!als.digits.includes(entryDigit)) continue;

      const alsCellsWithEntry = als.cells.filter(
        (c) => (grid.candidatesOf(c) & maskOf(entryDigit)) !== 0,
      );
      if (alsCellsWithEntry.length === 0) continue;
      if (!alsCellsWithEntry.every((c) => currentPeers.has(c))) continue;

      // ALS collapses → locked digits = als.digits \ {entryDigit}
      const lockedDigits = als.digits.filter((d) => d !== entryDigit);

      const alsKeys = als.cells.flatMap((c) => als.digits.map((d) => encodeNode(c, d)));
      if (alsKeys.some((k) => visited.has(k))) continue;
      for (const k of alsKeys) visited.add(k);

      for (const exitDigit of lockedDigits) {
        const exitBit = maskOf(exitDigit);
        for (const exitCell of als.cells) {
          if (!(grid.candidatesOf(exitCell) & exitBit)) continue;
          const exitNode: CandNode = { cell: exitCell, digit: exitDigit };
          // exitNode is the new TRUE node. The bridge consumes 2 positions (+2 depth).
          // Represent as a 'strong' link (ALS provides the strong inference).
          path.push(exitNode);
          linkTypesArr.push('strong');

          const result = atTrue(exitNode);
          if (result) {
            for (const k of alsKeys) visited.delete(k);
            return result;
          }

          path.pop();
          linkTypesArr.pop();
        }
      }

      for (const k of alsKeys) visited.delete(k);
    }

    // Weak step: TRUE → FALSE
    for (const next of weakNeighbors(grid, current)) {
      const key = encodeNode(next.cell, next.digit);
      if (key === encodeNode(start.cell, start.digit)) continue;
      if (visited.has(key)) continue;

      visited.add(key);
      path.push(next);
      linkTypesArr.push('weak');

      const result = atFalse(next);
      if (result) return result;

      path.pop();
      linkTypesArr.pop();
      visited.delete(key);
    }

    return null;
  }

  /**
   * At a FALSE node (just arrived via weak link, or the start).
   * Take strong steps to TRUE nodes.
   */
  function atFalse(current: CandNode): Step | null {
    if (path.length >= MAX_NODES) return null;

    for (const next of strongNeighbors(grid, current)) {
      const key = encodeNode(next.cell, next.digit);
      if (visited.has(key)) continue;

      visited.add(key);
      path.push(next);
      linkTypesArr.push('strong');

      const result = atTrue(next);
      if (result) return result;

      path.pop();
      linkTypesArr.pop();
      visited.delete(key);
    }

    return null;
  }

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      const start: CandNode = { cell: c, digit: d };
      if (strongNeighbors(grid, start).length === 0) continue;

      path.length = 0;
      linkTypesArr.length = 0;
      visited.clear();

      path.push(start);
      visited.add(encodeNode(c, d));

      // Start is FALSE (assumed). Take strong steps.
      const result = atFalse(start);
      if (result) return result;
    }
  }

  return null;
}

// ============================================================
// AIC with UR nodes
// ============================================================

function tryAICWithUR(grid: Grid): Step | null {
  const urPatterns: Array<{
    cells: [number, number, number, number];
    urPair: [number, number];
    extraCell: number;
    extraDigits: number[];
  }> = [];

  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;

          const cells = [cell11, cell12, cell21, cell22] as [number, number, number, number];
          const masks = cells.map((c) => (grid.get(c) === 0 ? grid.candidatesOf(c) : 0));

          if (masks.some((m) => m === 0)) continue;

          const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
          if (popcount(intersect) !== 2) continue;

          const exactMatch = cells.filter((_, i) => masks[i] === intersect);
          const extraCells = cells.filter((_, i) => masks[i] !== intersect);

          if (exactMatch.length !== 3 || extraCells.length !== 1) continue;

          const extraCell = extraCells[0]!;
          const extraMask = grid.candidatesOf(extraCell) & ~intersect;
          const extraDigits = digitsOf(extraMask);

          if (extraDigits.length < 2) continue;

          const [a, b] = digitsOf(intersect) as [number, number];
          urPatterns.push({ cells, urPair: [a!, b!], extraCell, extraDigits });
        }
      }
    }
  }

  if (urPatterns.length === 0) return null;

  const MAX_NODES = 12;

  for (const ur of urPatterns) {
    for (let i = 0; i < ur.extraDigits.length; i++) {
      for (let j = 0; j < ur.extraDigits.length; j++) {
        if (i === j) continue;
        const entryDigit = ur.extraDigits[i]!;
        const exitDigit = ur.extraDigits[j]!;

        if (!grid.hasCandidate(ur.extraCell, entryDigit)) continue;
        if (!grid.hasCandidate(ur.extraCell, exitDigit)) continue;

        // UR strong link: (extraCell, entryDigit) FALSE → (extraCell, exitDigit) TRUE
        // path[0] = entryNode (FALSE), path[1] = exitNode (TRUE via UR)
        const entryNode: CandNode = { cell: ur.extraCell, digit: entryDigit };
        const exitNode: CandNode = { cell: ur.extraCell, digit: exitDigit };

        const path: CandNode[] = [entryNode, exitNode];
        const linkTypesArr: ('strong' | 'weak')[] = ['strong'];
        const visited = new Set<number>();
        visited.add(encodeNode(ur.extraCell, entryDigit));
        visited.add(encodeNode(ur.extraCell, exitDigit));

        function atURTrue(current: CandNode): Step | null {
          if (path.length >= MAX_NODES) return null;

          const chainCellSet = new Set(path.map((n) => n.cell));

          if (path.length >= 3) {
            const start = path[0]!;

            if (start.digit === current.digit && start.cell !== current.cell) {
              const startPeers = new Set(PEERS_OF[start.cell]!);
              const elims = PEERS_OF[current.cell]!
                .filter((c) => startPeers.has(c) && !chainCellSet.has(c) && grid.hasCandidate(c, start.digit))
                .map((c) => ({ cell: c, digit: start.digit }));
              if (elims.length > 0) {
                return buildStep(grid, 'aic-with-ur', path, linkTypesArr, [], elims);
              }
            }

            if (start.cell === current.cell && start.digit !== current.digit) {
              const keepMask = maskOf(start.digit) | maskOf(current.digit);
              const elims = digitsOf(grid.candidatesOf(start.cell))
                .filter((d) => !(keepMask & maskOf(d)))
                .map((d) => ({ cell: start.cell, digit: d }));
              if (elims.length > 0) {
                return buildStep(grid, 'aic-with-ur', path, linkTypesArr, [], elims);
              }
            }
          }

          // Weak step
          for (const next of weakNeighbors(grid, current)) {
            const key = encodeNode(next.cell, next.digit);
            if (key === encodeNode(path[0]!.cell, path[0]!.digit)) continue;
            if (visited.has(key)) continue;
            visited.add(key);
            path.push(next);
            linkTypesArr.push('weak');

            const result = atURFalse(next);
            if (result) return result;

            path.pop();
            linkTypesArr.pop();
            visited.delete(key);
          }

          return null;
        }

        function atURFalse(current: CandNode): Step | null {
          if (path.length >= MAX_NODES) return null;

          for (const next of strongNeighbors(grid, current)) {
            const key = encodeNode(next.cell, next.digit);
            if (visited.has(key)) continue;
            visited.add(key);
            path.push(next);
            linkTypesArr.push('strong');

            const result = atURTrue(next);
            if (result) return result;

            path.pop();
            linkTypesArr.pop();
            visited.delete(key);
          }

          return null;
        }

        const result = atURTrue(exitNode);
        if (result) return result;
      }
    }
  }

  return null;
}

// ============================================================
// Strategy exports
// ============================================================

export const aicWithALS: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含 ALS 节点的交替推理链', en: 'AIC with ALS Node' },
  difficulty: 760,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryAICWithALS(grid, findAllALS(grid));
  },
};

export const aicWithUR: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含唯一矩形节点的交替推理链', en: 'AIC with UR Node' },
  difficulty: 770,
  tieBreak: ['cell-index', 'digit'],

  apply(grid: Grid): Step | null {
    return tryAICWithUR(grid);
  },
};
