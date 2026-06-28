import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, BOX_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candidateLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

interface ALS {
  house: number;
  cells: number[];
  digits: number[];
  digitMask: number;
}

function findALSInHouse(grid: Grid, house: readonly number[], houseIndex: number, maxSize: number): ALS[] {
  const emptyCells = house.filter((c) => grid.get(c) === 0);
  const result: ALS[] = [];

  for (let size = 1; size <= Math.min(maxSize, emptyCells.length - 1); size++) {
    for (const combo of combinations(emptyCells, size)) {
      let mask = 0;
      for (const c of combo) mask |= grid.candidatesOf(c);
      if (popcount(mask) === size + 1) {
        result.push({ house: houseIndex, cells: combo, digits: digitsOf(mask), digitMask: mask });
      }
    }
  }

  return result;
}

function findAllALS(grid: Grid): ALS[] {
  const result: ALS[] = [];
  const seenKeys = new Set<string>();

  for (let houseIndex = 0; houseIndex < HOUSES.length; houseIndex++) {
    const house = HOUSES[houseIndex]!;
    for (const als of findALSInHouse(grid, house, houseIndex, 4)) {
      const key = `${als.house}:${[...als.cells].sort((a, b) => a - b).join(',')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        result.push(als);
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

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;

          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size === 2) {
            yield [cell11, cell12, cell21, cell22];
          }
        }
      }
    }
  }
}

interface CandNode {
  cell: number;
  digit: number;
}

function nodeKey(node: CandNode): string {
  return `${node.cell}:${node.digit}`;
}

function getStandardStrongNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];
  const bit = maskOf(node.digit);

  for (const house of HOUSES) {
    if (!house.includes(node.cell)) continue;
    const cands = house.filter((c) => c !== node.cell && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    const total = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
    if (total === 2 && cands.length === 1) neighbors.push({ cell: cands[0]!, digit: node.digit });
  }

  if (popcount(grid.candidatesOf(node.cell)) === 2) {
    for (const d of digitsOf(grid.candidatesOf(node.cell))) {
      if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
    }
  }

  return neighbors;
}

function getStandardWeakNeighbors(grid: Grid, node: CandNode): CandNode[] {
  if (!grid.hasCandidate(node.cell, node.digit)) return [];
  const neighbors: CandNode[] = [];
  const bit = maskOf(node.digit);

  for (const peer of PEERS_OF[node.cell]!) {
    if (grid.get(peer) === 0 && (grid.candidatesOf(peer) & bit) !== 0) neighbors.push({ cell: peer, digit: node.digit });
  }
  for (const d of digitsOf(grid.candidatesOf(node.cell))) {
    if (d !== node.digit) neighbors.push({ cell: node.cell, digit: d });
  }

  return neighbors;
}

interface BFSState {
  path: CandNode[];
  linkAfter: ('strong' | 'weak')[];
  visited: Set<string>;
}

export function searchAicWithExoticLinks(
  grid: Grid,
  useAls: boolean,
  useUr: boolean,
  strategyId: string,
): Step | null {
  const startNodes: CandNode[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      startNodes.push({ cell: c, digit: d });
    }
  }

  // Pre-generate ALS strong links
  const alsStrong = new Map<string, CandNode[]>();
  if (useAls) {
    const alsList = findAllALS(grid);
    for (const a of alsList) {
      // Find extra candidates and locked candidates
      for (const extra of a.digits) {
        const extraBit = maskOf(extra);
        const locked = a.digits.filter((d) => d !== extra);

        const extraCells = a.cells.filter((c) => (grid.candidatesOf(c) & extraBit) !== 0);
        if (extraCells.length !== 1) continue;
        const cellExtra = extraCells[0]!;

        const kExtra = `${cellExtra}:${extra}`;
        if (!alsStrong.has(kExtra)) alsStrong.set(kExtra, []);

        for (const lDigit of locked) {
          const lBit = maskOf(lDigit);
          const lockedCells = a.cells.filter((c) => (grid.candidatesOf(c) & lBit) !== 0);
          if (lockedCells.length !== 1) continue;
          const cellLocked = lockedCells[0]!;

          if (cellLocked === cellExtra) continue;
          alsStrong.get(kExtra)!.push({ cell: cellLocked, digit: lDigit });
        }
      }
    }
  }

  // Pre-generate UR strong links
  const urStrong = new Map<string, CandNode[]>();
  if (useUr) {
    for (const [c11, c12, c21, c22] of allRectangles()) {
      const cells = [c11, c12, c21, c22];
      if (cells.some((c) => grid.get(c) !== 0)) continue;

      // Check for common pair of digits
      const masks = cells.map((c) => grid.candidatesOf(c));
      for (let d1 = 1; d1 <= 8; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          const bit1 = maskOf(d1);
          const bit2 = maskOf(d2);
          const urMask = bit1 | bit2;

          if (masks.every((m) => (m & urMask) === urMask)) {
            // Find corners with extra candidates
            const extras = cells.filter((c) => popcount(grid.candidatesOf(c) & ~urMask) > 0);
            if (extras.length === 2) {
              for (const u1 of extras) {
                const u1_extras = digitsOf(grid.candidatesOf(u1) & ~urMask);
                if (u1_extras.length !== 1) continue;
                for (const u2 of extras) {
                  if (u1 === u2) continue;
                  const u2_extras = digitsOf(grid.candidatesOf(u2) & ~urMask);
                  if (u2_extras.length !== 1) continue;

                  for (const z1 of u1_extras) {
                    const k1 = `${u1}:${z1}`;
                    if (!urStrong.has(k1)) urStrong.set(k1, []);

                    for (const z2 of u2_extras) {
                      urStrong.get(k1)!.push({ cell: u2, digit: z2 });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const getStrongNeighbors = (node: CandNode): CandNode[] => {
    const standard = getStandardStrongNeighbors(grid, node);
    const key = nodeKey(node);
    const extraALS = alsStrong.get(key) ?? [];
    const extraUR = urStrong.get(key) ?? [];

    const result = [...standard, ...extraALS, ...extraUR];
    const seen = new Set<string>();
    return result.filter((n) => {
      const k = nodeKey(n);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const getWeakNeighbors = (node: CandNode): CandNode[] => {
    return getStandardWeakNeighbors(grid, node);
  };

  const maxDepth = 8;
  const path: CandNode[] = [];
  const linkAfter: ('strong' | 'weak')[] = [];
  const visited = new Set<string>();

  let budget = 2000;
  function dfs(current: CandNode, nextLink: 'strong' | 'weak'): Step | null {
    if (budget-- <= 0) return null;
    if (path.length >= 4 && path.length % 2 === 0) {
      const start = path[0]!;
      const end = path[path.length - 1]!;

      // Check if start and end nodes see each other (Type 1 elimination)
      if (start.digit === end.digit && start.cell !== end.cell && PEERS_OF[start.cell]!.includes(end.cell)) {
        const eliminations: { cell: number; digit: number }[] = [];
        const peersStart = new Set(PEERS_OF[start.cell]!);
        const chain_cell_indices = path.map((n) => n.cell);
        for (const t of PEERS_OF[end.cell]!) {
          if (peersStart.has(t) && !chain_cell_indices.includes(t) && grid.hasCandidate(t, start.digit)) {
            eliminations.push({ cell: t, digit: start.digit });
          }
        }
        const step = buildStep(grid, [...path], [...linkAfter], eliminations, strategyId);
        if (step) return step;
      }
    }

    if (path.length >= maxDepth) return null;

    const neighbors = nextLink === 'strong' ? getStrongNeighbors(current) : getWeakNeighbors(current);
    for (const next of neighbors) {
      const key = nodeKey(next);
      if (visited.has(key)) continue;

      visited.add(key);
      path.push(next);
      linkAfter.push(nextLink);

      const result = dfs(next, nextLink === 'strong' ? 'weak' : 'strong');

      path.pop();
      linkAfter.pop();
      visited.delete(key);

      if (result) return result;
    }

    return null;
  }

  for (const start of startNodes) {
    const key = nodeKey(start);
    visited.add(key);
    path.push(start);

    const result = dfs(start, 'strong');

    path.pop();
    visited.delete(key);

    if (result) return result;
  }

  return null;
}

function buildStep(
  grid: Grid,
  path: CandNode[],
  linkTypes: ('strong' | 'weak')[],
  eliminations: { cell: number; digit: number }[],
  strategyId: string,
): Step | null {
  const valid_elims = eliminations.filter((e) => grid.hasCandidate(e.cell, e.digit));
  if (valid_elims.length === 0) return null;

  const links: Link[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: { cell: path[i]!.cell, digit: path[i]!.digit },
      to: { cell: path[i + 1]!.cell, digit: path[i + 1]!.digit },
      type: linkTypes[i] ?? 'strong',
    });
  }

  const start = path[0]!;
  const end = path[path.length - 1]!;

  const label = strategyId === 'aic-with-als' ? '含 ALS 节点的交替推理链' : '含 UR 节点的交替推理链';
  const labelEn = strategyId === 'aic-with-als' ? 'AIC with ALS Node' : 'AIC with UR Node';

  return {
    strategyId,
    placements: [],
    eliminations: valid_elims,
    highlights: {
      cells: [...new Set([...path.map((n) => n.cell), ...valid_elims.map((e) => e.cell)])],
      candidates: [...path.map((n) => ({ cell: n.cell, digit: n.digit })), ...valid_elims],
      links,
    },
    explanation: {
      zh: `${label}：从 ${candidateLabel(start.cell, start.digit)} 沿链连接到 ${candidateLabel(end.cell, end.digit)}；两端必有一真，消去对应候选。`,
      en: `${labelEn}: from ${candidateLabel(start.cell, start.digit)} along alternating chain to ${candidateLabel(end.cell, end.digit)}; eliminate candidates.`,
    },
  };
}

export const aicWithAls: Strategy = {
  id: 'aic-with-als',
  name: { zh: '含 ALS 节点的交替推理链', en: 'AIC with ALS Node' },
  difficulty: 760,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    return searchAicWithExoticLinks(grid, true, false, this.id);
  },
};

export const aicWithUr: Strategy = {
  id: 'aic-with-ur',
  name: { zh: '含 UR 节点的交替推理链', en: 'AIC with UR Node' },
  difficulty: 770,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    return searchAicWithExoticLinks(grid, false, true, this.id);
  },
};
