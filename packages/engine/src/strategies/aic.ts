import { PEERS_OF, HOUSES, ROW_OF, COL_OF, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, CellDigit, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

// Convert node index to CellDigit
function indexToCellDigit(idx: number): CellDigit {
  return {
    cell: Math.floor(idx / 9),
    digit: (idx % 9) + 1,
  };
}

// Check if two nodes are weakly linked (share cell or share house for same digit)
function areWeaklyLinked(u: number, v: number): boolean {
  const cu = Math.floor(u / 9);
  const du = (u % 9) + 1;
  const cv = Math.floor(v / 9);
  const dv = (v % 9) + 1;
  if (cu === cv) {
    return du !== dv;
  }
  if (du === dv) {
    return PEERS_OF[cu]!.includes(cv);
  }
  return false;
}

function findCommonWeakEliminations(grid: Grid, u: number, v: number, path: number[]): CellDigit[] {
  const elims: CellDigit[] = [];
  const pathSet = new Set(path);
  for (let c = 0; c < 81; c++) {
    if (grid.get(c) !== 0) continue;
    for (let d = 1; d <= 9; d++) {
      if (grid.hasCandidate(c, d)) {
        const z = c * 9 + d - 1;
        if (pathSet.has(z)) continue;
        if (areWeaklyLinked(z, u) && areWeaklyLinked(z, v)) {
          elims.push({ cell: c, digit: d });
        }
      }
    }
  }
  return elims;
}

interface BFSState {
  u: number;
  path: number[];
  firstLinkType: 'strong' | 'weak';
  lastLinkType: 'strong' | 'weak';
}

export const aic: Strategy = {
  id: 'aic',
  name: { zh: '交替推理链', en: 'Alternating Inference Chain' },
  difficulty: 70,

  apply(grid: Grid): Step | null {
    // 1. Build adjacency list for Strong and Weak links
    const strongNeighbors = Array.from({ length: 729 }, () => new Set<number>());
    const weakNeighbors = Array.from({ length: 729 }, () => new Set<number>());

    const activeNodes: number[] = [];
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) !== 0) continue;
      for (let d = 1; d <= 9; d++) {
        if (grid.hasCandidate(c, d)) {
          activeNodes.push(c * 9 + d - 1);
        }
      }
    }

    // Populate Weak Links
    for (let i = 0; i < activeNodes.length; i++) {
      for (let j = i + 1; j < activeNodes.length; j++) {
        const u = activeNodes[i]!;
        const v = activeNodes[j]!;
        if (areWeaklyLinked(u, v)) {
          weakNeighbors[u]!.add(v);
          weakNeighbors[v]!.add(u);
        }
      }
    }

    // Populate Strong Links
    // 1) Bilocal digits in houses
    for (let d = 1; d <= 9; d++) {
      for (const house of HOUSES) {
        const houseCells = house.filter(c => grid.hasCandidate(c, d));
        if (houseCells.length === 2) {
          const u = houseCells[0]! * 9 + d - 1;
          const v = houseCells[1]! * 9 + d - 1;
          strongNeighbors[u]!.add(v);
          strongNeighbors[v]!.add(u);
        }
      }
    }

    // 2) Bivalue cells
    for (let c = 0; c < 81; c++) {
      if (grid.get(c) === 0 && popcount(grid.candidatesOf(c)) === 2) {
        const digits = digitsOf(grid.candidatesOf(c));
        const u = c * 9 + digits[0]! - 1;
        const v = c * 9 + digits[1]! - 1;
        strongNeighbors[u]!.add(v);
        strongNeighbors[v]!.add(u);
      }
    }

    // 2. BFS from each active node
    // Limit maximum path length to keep execution fast
    const MAX_PATH_LENGTH = 12;

    for (const startNode of activeNodes) {
      const queue: BFSState[] = [];
      const visited = new Set<string>();

      // Initialize with strong start
      for (const next of strongNeighbors[startNode]!) {
        const state: BFSState = {
          u: next,
          path: [startNode, next],
          firstLinkType: 'strong',
          lastLinkType: 'strong',
        };
        queue.push(state);
        visited.add(`${next}_strong_strong`);
      }

      // Initialize with weak start
      for (const next of weakNeighbors[startNode]!) {
        const state: BFSState = {
          u: next,
          path: [startNode, next],
          firstLinkType: 'weak',
          lastLinkType: 'weak',
        };
        queue.push(state);
        visited.add(`${next}_weak_weak`);
      }

      while (queue.length > 0) {
        const { u, path, firstLinkType, lastLinkType } = queue.shift()!;
        if (path.length > MAX_PATH_LENGTH) continue;

        const n0 = path[0]!;

        // Check for deductions!

        // --- Deduction 1: Continuous Nice Loop ---
        // If first link was weak, last link was weak, and u is strongly linked back to n0
        if (firstLinkType === 'weak' && lastLinkType === 'weak' && strongNeighbors[u]!.has(n0)) {
          // Continuous Loop found! Let's find eliminations from all weak links
          const eliminations: CellDigit[] = [];
          const loopNodes = [...path]; // u is already path[path.length - 1]

          // The weak links in the loop are:
          // path[0] - path[1] (weak)
          // path[2] - path[3] (weak)
          // ...
          // path[2i] - path[2i+1] (weak)
          // And also u - n0 is a strong link, so it's not a weak link that we can eliminate from.
          for (let i = 0; i < loopNodes.length - 1; i += 2) {
            const a = loopNodes[i]!;
            const b = loopNodes[i+1]!;
            const ca = Math.floor(a / 9);
            const da = (a % 9) + 1;
            const cb = Math.floor(b / 9);
            const db = (b % 9) + 1;

            if (da === db) {
              // Same digit, they share house(s). Eliminate da from other cells in those houses.
              for (const house of HOUSES) {
                if (house.includes(ca) && house.includes(cb)) {
                  for (const c of house) {
                    if (c !== ca && c !== cb && grid.hasCandidate(c, da)) {
                      if (!eliminations.some(e => e.cell === c && e.digit === da)) {
                        eliminations.push({ cell: c, digit: da });
                      }
                    }
                  }
                }
              }
            } else if (ca === cb) {
              // Same cell, different digits. Eliminate other candidates in this cell.
              for (let d = 1; d <= 9; d++) {
                if (d !== da && d !== db && grid.hasCandidate(ca, d)) {
                  if (!eliminations.some(e => e.cell === ca && e.digit === d)) {
                    eliminations.push({ cell: ca, digit: d });
                  }
                }
              }
            }
          }

          if (eliminations.length > 0) {
            return buildStepFromChain('continuous-loop', loopNodes, firstLinkType, eliminations, [], grid);
          }
        }

        // --- Deduction 2: Discontinuous Loop Elimination ---
        // If first link was weak, last link was strong, and u is weakly linked to n0
        if (firstLinkType === 'weak' && lastLinkType === 'strong' && weakNeighbors[u]!.has(n0)) {
          const elimCandidate = indexToCellDigit(n0);
          if (grid.hasCandidate(elimCandidate.cell, elimCandidate.digit)) {
            return buildStepFromChain('discontinuous-loop-elim', path, firstLinkType, [elimCandidate], [], grid);
          }
        }

        // --- Deduction 3: Discontinuous Loop Placement ---
        // If first link was strong, last link was weak, and u is strongly linked to n0
        if (firstLinkType === 'strong' && lastLinkType === 'weak' && strongNeighbors[u]!.has(n0)) {
          const placeCandidate = indexToCellDigit(n0);
          if (grid.hasCandidate(placeCandidate.cell, placeCandidate.digit)) {
            return buildStepFromChain('discontinuous-loop-place', path, firstLinkType, [], [placeCandidate], grid);
          }
        }

        // --- Deduction 4: Type 1 AIC Elimination (Starts and ends with strong) ---
        if (firstLinkType === 'strong' && lastLinkType === 'strong' && path.length >= 4 && path.length % 2 === 0) {
          const elims = findCommonWeakEliminations(grid, n0, u, path);
          if (elims.length > 0) {
            return buildStepFromChain('aic-type1', path, firstLinkType, elims, [], grid);
          }
        }

        // --- Expansion ---
        if (lastLinkType === 'strong') {
          // Next link must be weak
          for (const next of weakNeighbors[u]!) {
            if (path.includes(next)) continue;
            const key = `${next}_${firstLinkType}_weak`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push({
                u: next,
                path: [...path, next],
                firstLinkType,
                lastLinkType: 'weak',
              });
            }
          }
        } else {
          // Next link must be strong
          for (const next of strongNeighbors[u]!) {
            if (path.includes(next)) continue;
            const key = `${next}_${firstLinkType}_strong`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push({
                u: next,
                path: [...path, next],
                firstLinkType,
                lastLinkType: 'strong',
              });
            }
          }
        }
      }
    }

    return null;
  },
};

function buildStepFromChain(
  type: 'continuous-loop' | 'discontinuous-loop-elim' | 'discontinuous-loop-place' | 'aic-type1',
  path: number[],
  firstLinkType: 'strong' | 'weak',
  eliminations: CellDigit[],
  placements: CellDigit[],
  grid: Grid
): Step {
  const highlightsCells = Array.from(new Set(path.map(n => Math.floor(n / 9))));
  const highlightsCandidates = path.map(n => indexToCellDigit(n));

  // Construct visual Links
  const links: Link[] = [];
  let currentLinkType = firstLinkType;
  for (let i = 0; i < path.length - 1; i++) {
    links.push({
      from: indexToCellDigit(path[i]!),
      to: indexToCellDigit(path[i+1]!),
      type: currentLinkType,
    });
    currentLinkType = currentLinkType === 'strong' ? 'weak' : 'strong';
  }

  // Add closing link for loops
  if (type === 'continuous-loop') {
    links.push({
      from: indexToCellDigit(path[path.length - 1]!),
      to: indexToCellDigit(path[0]!),
      type: 'strong', // Closing link is both strong and weak, we draw it as strong for completeness
    });
  } else if (type === 'discontinuous-loop-elim') {
    links.push({
      from: indexToCellDigit(path[path.length - 1]!),
      to: indexToCellDigit(path[0]!),
      type: 'weak',
    });
  } else if (type === 'discontinuous-loop-place') {
    links.push({
      from: indexToCellDigit(path[path.length - 1]!),
      to: indexToCellDigit(path[0]!),
      type: 'strong',
    });
  }

  // Classify Strategy ID for better visualization and named strategies
  let strategyId = 'aic';
  let nameZh = '交替推理链';
  let nameEn = 'Alternating Inference Chain';

  const digitsInChain = new Set(path.map(n => (n % 9) + 1));
  const cellsInChain = path.map(n => Math.floor(n / 9));
  const isBivalueChain = cellsInChain.every(c => popcount(grid.candidatesOf(c)) === 2);

  if (digitsInChain.size === 1) {
    strategyId = 'x-chain';
    nameZh = 'X-链';
    nameEn = 'X-Chain';
  } else if (isBivalueChain) {
    strategyId = 'xy-chain';
    nameZh = 'XY-链';
    nameEn = 'XY-Chain';
  } else if (type === 'continuous-loop') {
    strategyId = 'continuous-nice-loop';
    nameZh = '连续强弱环';
    nameEn = 'Continuous Nice Loop';
  }

  // Bilingual description
  let zh = '';
  let en = '';

  const startCd = indexToCellDigit(path[0]!);
  const startStr = `R${ROW_OF[startCd.cell]! + 1}C${COL_OF[startCd.cell]! + 1}(${startCd.digit})`;

  if (type === 'aic-type1') {
    const endCd = indexToCellDigit(path[path.length - 1]!);
    const endStr = `R${ROW_OF[endCd.cell]! + 1}C${COL_OF[endCd.cell]! + 1}(${endCd.digit})`;
    zh = `找到交替推理链（${nameZh}，从 ${startStr} 到 ${endStr}），排除能同时看到两端的候选数。`;
    en = `Found Alternating Inference Chain (${nameEn} from ${startStr} to ${endStr}), eliminating common peer candidates.`;
  } else if (type === 'continuous-loop') {
    zh = `找到连续强弱环（${nameZh}），环内弱链升级为强链，排除环外相关候选数。`;
    en = `Found Continuous Nice Loop (${nameEn}), upgrading weak links to strong links and eliminating off-chain candidates.`;
  } else if (type === 'discontinuous-loop-elim') {
    zh = `找到不连续强弱环（${nameZh}），在 ${startStr} 处发生矛盾（若其为真则推导其为假），排除该候选数。`;
    en = `Found Discontinuous Nice Loop (${nameEn}), causing contradiction at ${startStr} (being true implies being false), eliminating it.`;
  } else {
    zh = `找到不连续强弱环（${nameZh}），在 ${startStr} 处发生矛盾（若其为假则推导其为真），将该数字填入。`;
    en = `Found Discontinuous Nice Loop (${nameEn}), causing contradiction at ${startStr} (being false implies being true), placing it.`;
  }

  return {
    strategyId,
    placements,
    eliminations,
    highlights: {
      cells: highlightsCells,
      candidates: highlightsCandidates,
      links,
    },
    explanation: { zh, en },
  };
}
