/**
 * Advanced Coloring — Multi-Coloring (X-Colors + Multi-Colors) and 3D Medusa.
 *
 * Multi-Coloring: single-digit X-Colors promotion (Step 3) plus HoDoKu
 * Multi-Colors two-pair logic between disjoint conjugate clusters.
 *
 * 3D Medusa: bipartite cell-candidate graph with bi-location and bi-value
 * strong links; rules R1–R6 per research card.
 */

import {
  CELLS,
  HOUSES,
  BOXES,
  ROW_OF,
  COL_OF,
  PEERS_OF,
  UNITS_OF,
  maskOf,
  popcount,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, CellDigit } from '../trace.js';
import type { Strategy } from '../strategy.js';

type Color = 0 | 1;

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function hasCand(grid: Grid, cell: number, digit: number): boolean {
  return grid.get(cell) === 0 && (grid.candidatesOf(cell) & maskOf(digit)) !== 0;
}

function candKey(cell: number, digit: number): string {
  return `${cell}:${digit}`;
}

function parseCandKey(key: string): CellDigit {
  const [cell, digit] = key.split(':');
  return { cell: Number(cell), digit: Number(digit) };
}

function addAdj(adj: Map<number, number[]>, a: number, b: number): void {
  if (a === b) return;
  if (!adj.has(a)) adj.set(a, []);
  if (!adj.has(b)) adj.set(b, []);
  const la = adj.get(a)!;
  const lb = adj.get(b)!;
  if (!la.includes(b)) la.push(b);
  if (!lb.includes(a)) lb.push(a);
}

/** House conjugate pairs plus box-sector pairs (exactly two in a box-line). */
function buildDigitAdjacency(grid: Grid, digit: number, sectorLinks: boolean): Map<number, number[]> {
  const bit = maskOf(digit);
  const adj = new Map<number, number[]>();

  for (const house of HOUSES) {
    const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
    if (cands.length !== 2) continue;
    addAdj(adj, cands[0]!, cands[1]!);
  }

  if (sectorLinks) {
    for (let b = 0; b < 9; b++) {
      for (let r = 0; r < 3; r++) {
        const cells = BOXES[b]!.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && ROW_OF[c]! % 3 === r,
        );
        if (cells.length === 2) addAdj(adj, cells[0]!, cells[1]!);
      }
      for (let col = 0; col < 3; col++) {
        const cells = BOXES[b]!.filter(
          (c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0 && COL_OF[c]! % 3 === col,
        );
        if (cells.length === 2) addAdj(adj, cells[0]!, cells[1]!);
      }
    }
  }

  return adj;
}

function listConjugatePairs(grid: Grid, digit: number): Array<[number, number]> {
  const adj = buildDigitAdjacency(grid, digit, false);
  const pairs: Array<[number, number]> = [];
  const seen = new Set<string>();
  for (const [a, peers] of adj) {
    for (const b of peers) {
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([a, b]);
    }
  }
  return pairs;
}

function colorComponent(adj: Map<number, number[]>, start: number): Map<number, Color> {
  const comp = new Map<number, Color>();
  const queue: Array<{ cell: number; color: Color }> = [{ cell: start, color: 0 }];
  const visited = new Set<number>([start]);
  comp.set(start, 0);
  while (queue.length > 0) {
    const { cell, color } = queue.shift()!;
    for (const n of adj.get(cell) ?? []) {
      if (visited.has(n)) continue;
      visited.add(n);
      const nc = (1 - color) as Color;
      comp.set(n, nc);
      queue.push({ cell: n, color: nc });
    }
  }
  return comp;
}

function buildDigitComponents(
  grid: Grid,
  digit: number,
  sectorLinks: boolean,
): Map<number, Color>[] {
  const adj = buildDigitAdjacency(grid, digit, sectorLinks);
  const visited = new Set<number>();
  const components: Map<number, Color>[] = [];
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const comp = colorComponent(adj, start);
    for (const c of comp.keys()) visited.add(c);
    if (comp.size >= 2) components.push(comp);
  }
  return components;
}

function expandConjugate(grid: Grid, digit: number, colors: Map<number, Color>): void {
  const adj = buildDigitAdjacency(grid, digit, false);
  let changed = true;
  while (changed) {
    changed = false;
    for (let c = 0; c < CELLS; c++) {
      if (colors.has(c) || !hasCand(grid, c, digit)) continue;
      for (const peer of adj.get(c) ?? []) {
        if (colors.has(peer)) {
          colors.set(c, (1 - colors.get(peer)!) as Color);
          changed = true;
          break;
        }
      }
    }
  }
}

interface XColorState {
  colors: Map<number, Color>;
  /** Cells first colored during Step 3 promotion (not Step 2 expansion). */
  promoted: Set<number>;
}

function runXColors(
  grid: Grid,
  digit: number,
  seedA: number,
  seedB: number,
): XColorState {
  const colors = new Map<number, Color>();
  colors.set(seedA, 0);
  colors.set(seedB, 1);
  expandConjugate(grid, digit, colors);
  const afterStep2 = new Set(colors.keys());
  const promoted = new Set<number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const house of HOUSES) {
      const cands = house.filter((c) => hasCand(grid, c, digit));
      if (cands.length < 2) continue;
      for (const color of [0, 1] as const) {
        const exceptions: number[] = [];
        for (const c of cands) {
          if (colors.get(c) === color) continue;
          const peers = new Set(PEERS_OF[c]!);
          const seesColor = [...colors.entries()].some(
            ([pc, pcColor]) => pcColor === color && peers.has(pc) && hasCand(grid, pc, digit),
          );
          if (!seesColor) exceptions.push(c);
        }
        if (exceptions.length === 1 && !colors.has(exceptions[0]!)) {
          const ex = exceptions[0]!;
          if (!afterStep2.has(ex)) promoted.add(ex);
          colors.set(ex, color);
          changed = true;
        }
      }
    }
  }
  return { colors, promoted };
}

function peersSeeColorGrid(
  grid: Grid,
  cell: number,
  digit: number,
  color: Color,
  colors: Map<number, Color>,
): boolean {
  const peers = new Set(PEERS_OF[cell]!);
  return [...colors.entries()].some(
    ([pc, pcColor]) => pcColor === color && peers.has(pc) && hasCand(grid, pc, digit),
  );
}

function buildDigitStrongLinks(
  grid: Grid,
  digit: number,
  colored: Set<number>,
): Link[] {
  const bit = maskOf(digit);
  const links: Link[] = [];
  const seen = new Set<string>();
  for (const house of HOUSES) {
    const cands = house.filter(
      (c) => colored.has(c) && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0,
    );
    if (cands.length !== 2) continue;
    const [a, b] = cands as [number, number];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ from: { cell: a, digit }, to: { cell: b, digit }, type: 'strong' });
  }
  return links;
}

function xColorsWrap(
  grid: Grid,
  digit: number,
  colors: Map<number, Color>,
): CellDigit[] {
  for (const house of HOUSES) {
    const coloredInHouse: Array<{ cell: number; color: Color }> = [];
    for (const c of house) {
      const col = colors.get(c);
      if (col !== undefined && hasCand(grid, c, digit)) {
        coloredInHouse.push({ cell: c, color: col });
      }
    }
    if (coloredInHouse.length < 2) continue;
    const sameColor = coloredInHouse[0]!.color;
    if (coloredInHouse.every((x) => x.color === sameColor)) {
      const opposite = (1 - sameColor) as Color;
      return [...colors.entries()]
        .filter(([c, col]) => col === opposite && hasCand(grid, c, digit))
        .map(([c]) => ({ cell: c, digit }));
    }
  }
  return [];
}

function xColorsHouseEmpty(
  grid: Grid,
  digit: number,
  colors: Map<number, Color>,
  promoted: Set<number>,
): CellDigit[] {
  if (promoted.size === 0) return [];
  for (const blocked of [0, 1] as const) {
    for (const house of HOUSES) {
      const cands = house.filter((c) => hasCand(grid, c, digit));
      if (cands.length === 0) continue;
      if (cands.some((c) => colors.get(c) === blocked)) continue;
      if (!cands.every((c) => peersSeeColorGrid(grid, c, digit, blocked, colors))) continue;
      const opposite = (1 - blocked) as Color;
      const placements = [...colors.entries()]
        .filter(([c, col]) => col === opposite && hasCand(grid, c, digit))
        .map(([c]) => ({ cell: c, digit }));
      if (placements.length > 0) return placements;
    }
  }
  return [];
}

function peerColorCells(
  grid: Grid,
  cell: number,
  digit: number,
  color: Color,
  colors: Map<number, Color>,
): number[] {
  const peers = new Set(PEERS_OF[cell]!);
  return [...colors.entries()]
    .filter(([pc, pcColor]) => pcColor === color && peers.has(pc) && hasCand(grid, pc, digit))
    .map(([pc]) => pc);
}

function xColorsTrap(
  grid: Grid,
  digit: number,
  state: XColorState,
): CellDigit[] {
  const { colors, promoted } = state;
  const elims: CellDigit[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (!hasCand(grid, c, digit)) continue;
    if (colors.has(c)) continue;
    const peers0 = peerColorCells(grid, c, digit, 0, colors);
    const peers1 = peerColorCells(grid, c, digit, 1, colors);
    if (peers0.length === 0 || peers1.length === 0) continue;
    if (
      promoted.size === 0 ||
      (!peers0.some((p) => promoted.has(p)) && !peers1.some((p) => promoted.has(p)))
    ) {
      continue;
    }
    elims.push({ cell: c, digit });
  }
  return elims;
}

function multiColorsType1(
  grid: Grid,
  digit: number,
  comp1: Map<number, Color>,
  comp2: Map<number, Color>,
): CellDigit[] {
  const adj = buildDigitAdjacency(grid, digit, false);
  for (const [c1, col1] of comp1) {
    for (const [c2, col2] of comp2) {
      if (col1 === col2) continue;
      if (!PEERS_OF[c1]!.includes(c2)) continue;
      if (adj.get(c1)?.includes(c2)) continue;
      const opp1 = (1 - col1) as Color;
      const opp2 = (1 - col2) as Color;
      const elims: CellDigit[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (!hasCand(grid, c, digit)) continue;
        const peers = new Set(PEERS_OF[c]!);
        const seesOpp1 = [...comp1.entries()].some(([pc, col]) => col === opp1 && peers.has(pc));
        const seesOpp2 = [...comp2.entries()].some(([pc, col]) => col === opp2 && peers.has(pc));
        if (seesOpp1 && seesOpp2) elims.push({ cell: c, digit });
      }
      if (elims.length > 0) return elims;
    }
  }
  return [];
}

function multiColorsType2(
  grid: Grid,
  digit: number,
  comp1: Map<number, Color>,
  comp2: Map<number, Color>,
): CellDigit[] {
  for (const sameColor of [0, 1] as const) {
    const group = [...comp1.entries()].filter(([, col]) => col === sameColor).map(([c]) => c);
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]!;
        const b = group[j]!;
        const peersA = new Set(PEERS_OF[a]!);
        const peersB = new Set(PEERS_OF[b]!);
        const aSees0 = [...comp2.entries()].some(([pc, col]) => col === 0 && peersA.has(pc));
        const aSees1 = [...comp2.entries()].some(([pc, col]) => col === 1 && peersA.has(pc));
        const bSees0 = [...comp2.entries()].some(([pc, col]) => col === 0 && peersB.has(pc));
        const bSees1 = [...comp2.entries()].some(([pc, col]) => col === 1 && peersB.has(pc));
        if ((aSees0 && bSees1) || (aSees1 && bSees0)) {
          return group.filter((c) => hasCand(grid, c, digit)).map((c) => ({ cell: c, digit }));
        }
      }
    }
  }
  return [];
}

function makeMultiColoringStep(
  grid: Grid,
  digit: number,
  colors: Map<number, Color>,
  placements: CellDigit[],
  eliminations: CellDigit[],
  zh: string,
  en: string,
): Step {
  const coloredCells = [...colors.keys()];
  const allCells = [...new Set([...coloredCells, ...eliminations.map((e) => e.cell), ...placements.map((p) => p.cell)])];
  return {
    strategyId: 'multi-coloring',
    placements,
    eliminations,
    highlights: {
      cells: allCells,
      candidates: [
        ...coloredCells.map((c) => ({ cell: c, digit })),
        ...eliminations,
        ...placements,
      ],
      links: buildDigitStrongLinks(grid, digit, new Set(coloredCells)),
    },
    explanation: { zh, en },
  };
}

function tryXColorsDigit(grid: Grid, digit: number, minTrapElims = 1): Step | null {
  const pairs = listConjugatePairs(grid, digit);
  if (pairs.length === 0) return null;

  let bestTrap: Step | null = null;

  for (const [seedA, seedB] of pairs) {
    for (const swap of [false, true] as const) {
      const a = swap ? seedB : seedA;
      const b = swap ? seedA : seedB;
      const state = runXColors(grid, digit, a, b);
      const { colors } = state;

      const wrapPlacements = xColorsWrap(grid, digit, colors);
      const emptyPlacements = xColorsHouseEmpty(grid, digit, colors, state.promoted);
      const trap = xColorsTrap(grid, digit, state);
      const placements = wrapPlacements.length > 0 ? wrapPlacements : emptyPlacements;

      if (placements.length > 0) {
        const isWrap = wrapPlacements.length > 0;
        return makeMultiColoringStep(
          grid,
          digit,
          colors,
          placements,
          trap,
          isWrap
            ? `多重染色（同色矛盾）：数字 ${digit} 经 X-Colors 推广后，同一宫中两格同色，另一色全部为真。${trap.length > 0 ? ' 同步颜色陷阱消去。' : ''}`
            : `多重染色（宫空）：数字 ${digit} 的某宫中所有候选格均为同色格的邻居，另一色全部为真。`,
          isWrap
            ? `Multi-Coloring (wrap): digit ${digit} after X-Colors promotion has two same-color cells in one house; the opposite color is all true.${trap.length > 0 ? ' Concurrent color-trap eliminations.' : ''}`
            : `Multi-Coloring (house empty): in some house for digit ${digit}, every candidate cell is a peer of one color; the opposite color is all true.`,
        );
      }

      if (trap.length >= minTrapElims && !bestTrap) {
        bestTrap = makeMultiColoringStep(
          grid,
          digit,
          colors,
          [],
          trap,
          `多重染色（颜色陷阱）：数字 ${digit} 经 X-Colors 推广后，某格同时看到 A、B 两色，消去该格的 ${digit}。`,
          `Multi-Coloring (trap): digit ${digit} after X-Colors promotion — a cell sees both colors A and B → eliminate ${digit}.`,
        );
      }
    }
  }

  return bestTrap;
}

function tryMultiColorsDigit(grid: Grid, digit: number): Step | null {
  const components = buildDigitComponents(grid, digit, false);
  if (components.length < 2) return null;

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const comp1 = components[i]!;
      const comp2 = components[j]!;
      const merged = new Map([...comp1, ...comp2]);

      const type1 = multiColorsType1(grid, digit, comp1, comp2);
      if (type1.length > 0) {
        return makeMultiColoringStep(
          grid,
          digit,
          merged,
          [],
          type1,
          `多重染色（双簇类型 1）：数字 ${digit} 两簇弱链接，某格同时看到两簇反色，消去 ${digit}。`,
          `Multi-Coloring (two-pair type 1): digit ${digit} — weak link between clusters; cell sees both opposite colors → eliminate ${digit}.`,
        );
      }

      const type2 = multiColorsType2(grid, digit, comp1, comp2);
      if (type2.length > 0) {
        return makeMultiColoringStep(
          grid,
          digit,
          merged,
          [],
          type2,
          `多重染色（双簇类型 2）：数字 ${digit} 两簇中同色格各见对簇异色，该色全部为假。`,
          `Multi-Coloring (two-pair type 2): digit ${digit} — same-color cells each see opposite of other pair; that color is all false.`,
        );
      }
    }
  }
  return null;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多重染色', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit'],

  apply(grid: Grid): Step | null {
    for (let d = 1; d <= 9; d++) {
      const step = tryXColorsDigit(grid, d);
      if (step && step.placements.length > 0) return step;
    }
    for (let minTrap = 2; minTrap >= 1; minTrap--) {
      for (let d = 1; d <= 9; d++) {
        const step = tryXColorsDigit(grid, d, minTrap);
        if (step && step.eliminations.length > 0) return step;
      }
    }
    for (let d = 1; d <= 9; d++) {
      const mcStep = tryMultiColorsDigit(grid, d);
      if (mcStep) return mcStep;
    }
    return null;
  },
};

// ---- 3D Medusa ----

interface MedusaComponent {
  nodes: Set<string>;
  colors: Map<string, Color>;
  links: Link[];
}

function buildMedusaGraph(grid: Grid): MedusaComponent[] {
  const nodes = new Set<string>();
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    for (let d = 1; d <= 9; d++) {
      if (m & maskOf(d)) nodes.add(candKey(c, d));
    }
  }

  const adj = new Map<string, string[]>();
  const links: Link[] = [];
  const seenEdge = new Set<string>();

  function addEdge(a: string, b: string, link: Link): void {
    if (!nodes.has(a) || !nodes.has(b)) return;
    const ek = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seenEdge.has(ek)) return;
    seenEdge.add(ek);
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
    links.push(link);
  }

  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      const bit = maskOf(d);
      const cands = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
      if (cands.length !== 2) continue;
      const [ca, cb] = cands as [number, number];
      addEdge(candKey(ca, d), candKey(cb, d), {
        from: { cell: ca, digit: d },
        to: { cell: cb, digit: d },
        type: 'strong',
      });
    }
  }

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const m = grid.candidatesOf(c);
    if (popcount(m) !== 2) continue;
    const ds: number[] = [];
    for (let d = 1; d <= 9; d++) if (m & maskOf(d)) ds.push(d);
    const [d1, d2] = ds as [number, number];
    addEdge(candKey(c, d1), candKey(c, d2), {
      from: { cell: c, digit: d1 },
      to: { cell: c, digit: d2 },
      type: 'strong',
    });
  }

  const visited = new Set<string>();
  const components: MedusaComponent[] = [];

  for (const start of nodes) {
    if (visited.has(start) || !adj.has(start)) continue;
    const compNodes = new Set<string>();
    const colors = new Map<string, Color>();
    const compLinks: Link[] = [];
    const linkSet = new Set<string>();

    const queue: Array<{ node: string; color: Color }> = [{ node: start, color: 0 }];
    visited.add(start);
    compNodes.add(start);
    colors.set(start, 0);

    while (queue.length > 0) {
      const { node, color } = queue.shift()!;
      for (const n of adj.get(node) ?? []) {
        if (visited.has(n)) continue;
        visited.add(n);
        compNodes.add(n);
        const nc = (1 - color) as Color;
        colors.set(n, nc);
        queue.push({ node: n, color: nc });
      }
    }

    for (const link of links) {
      const fk = candKey(link.from.cell, link.from.digit);
      const tk = candKey(link.to.cell, link.to.digit);
      if (compNodes.has(fk) && compNodes.has(tk)) {
        const lk = fk < tk ? `${fk}|${tk}` : `${tk}|${fk}`;
        if (!linkSet.has(lk)) {
          linkSet.add(lk);
          compLinks.push(link);
        }
      }
    }

    if (compNodes.size >= 2) {
      components.push({ nodes: compNodes, colors, links: compLinks });
    }
  }

  return components;
}

function isColored(comp: MedusaComponent, cell: number, digit: number): boolean {
  return comp.colors.has(candKey(cell, digit));
}

function getColor(comp: MedusaComponent, cell: number, digit: number): Color | undefined {
  return comp.colors.get(candKey(cell, digit));
}

function seesColoredDigitInUnit(
  comp: MedusaComponent,
  cell: number,
  digit: number,
  color?: Color,
): boolean {
  for (const h of UNITS_OF[cell]!) {
    for (const other of HOUSES[h]!) {
      const key = candKey(other, digit);
      if (!comp.nodes.has(key) || !comp.colors.has(key)) continue;
      if (color === undefined || comp.colors.get(key) === color) return true;
    }
  }
  return false;
}

function colorsSeenByCandidate(comp: MedusaComponent, cell: number): Set<Color> {
  const seen = new Set<Color>();
  for (const h of UNITS_OF[cell]!) {
    for (const other of HOUSES[h]!) {
      for (let d = 1; d <= 9; d++) {
        const key = candKey(other, d);
        if (comp.nodes.has(key) && comp.colors.has(key)) {
          seen.add(comp.colors.get(key)!);
        }
      }
    }
  }
  return seen;
}

function medusaHighlights(comp: MedusaComponent, extra: CellDigit[] = []): Step['highlights'] {
  const cells = new Set<number>();
  const candidates: CellDigit[] = [];
  for (const key of comp.nodes) {
    const { cell, digit } = parseCandKey(key);
    cells.add(cell);
    candidates.push({ cell, digit });
  }
  for (const e of extra) cells.add(e.cell);
  return {
    cells: [...cells, ...extra.map((e) => e.cell)],
    candidates: [...candidates, ...extra],
    links: comp.links,
  };
}

function oppositePlacements(
  grid: Grid,
  comp: MedusaComponent,
  falseColor: Color,
): CellDigit[] {
  const trueColor = (1 - falseColor) as Color;
  const placements: CellDigit[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    const trueDigits: number[] = [];
    let hasUncolored = false;
    for (let d = 1; d <= 9; d++) {
      if (!hasCand(grid, c, d)) continue;
      const col = getColor(comp, c, d);
      if (col === trueColor) trueDigits.push(d);
      else if (col === undefined) hasUncolored = true;
    }
    if (trueDigits.length === 1 && !hasUncolored) {
      placements.push({ cell: c, digit: trueDigits[0]! });
    }
  }
  return placements;
}

function eliminateColorInComponent(
  grid: Grid,
  comp: MedusaComponent,
  falseColor: Color,
  digitFilter?: number,
): CellDigit[] {
  const elims: CellDigit[] = [];
  for (const [key, color] of comp.colors) {
    if (color !== falseColor) continue;
    const { cell, digit } = parseCandKey(key);
    if (digitFilter !== undefined && digit !== digitFilter) continue;
    if (hasCand(grid, cell, digit)) elims.push({ cell, digit });
  }
  return elims;
}

type MedusaElim = { rule: 3 | 4 | 5; cell: number; digit: number; comp: MedusaComponent };

function collectMedusaEliminations(grid: Grid, comp: MedusaComponent): MedusaElim[] {
  const out: MedusaElim[] = [];

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    let has0 = false;
    let has1 = false;
    const uncolored: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (!hasCand(grid, c, d)) continue;
      const col = getColor(comp, c, d);
      if (col === 0) has0 = true;
      else if (col === 1) has1 = true;
      else uncolored.push(d);
    }
    if (has0 && has1) {
      for (const d of uncolored) out.push({ rule: 3, cell: c, digit: d, comp });
    }
  }

  for (let c = 0; c < CELLS; c++) {
    for (let d = 1; d <= 9; d++) {
      if (!hasCand(grid, c, d) || isColored(comp, c, d)) continue;
      for (const h of UNITS_OF[c]!) {
        let has0 = false;
        let has1 = false;
        for (const other of HOUSES[h]!) {
          if (other === c) continue;
          const key = candKey(other, d);
          const col = comp.colors.get(key);
          if (col === 0) has0 = true;
          else if (col === 1) has1 = true;
        }
        if (has0 && has1) {
          out.push({ rule: 4, cell: c, digit: d, comp });
          break;
        }
      }
    }
  }

  for (let c = 0; c < CELLS; c++) {
    for (let d = 1; d <= 9; d++) {
      if (!hasCand(grid, c, d) || isColored(comp, c, d)) continue;
      for (const h of UNITS_OF[c]!) {
        for (const unitColor of [0, 1] as const) {
          let seesUnitColor = false;
          for (const other of HOUSES[h]!) {
            if (other === c) continue;
            const key = candKey(other, d);
            if (comp.colors.get(key) === unitColor) seesUnitColor = true;
          }
          if (!seesUnitColor) continue;
          const opp = (1 - unitColor) as Color;
          for (let d2 = 1; d2 <= 9; d2++) {
            if (d2 === d) continue;
            if (getColor(comp, c, d2) === opp) {
              out.push({ rule: 5, cell: c, digit: d, comp });
            }
          }
        }
      }
    }
  }

  out.sort((a, b) => a.rule - b.rule || a.digit - b.digit || a.cell - b.cell);
  return out;
}

function medusaElimStep(hits: MedusaElim[]): Step {
  const hit = hits[0]!;
  const elims = hits.map((h) => ({ cell: h.cell, digit: h.digit }));
  const texts: Record<3 | 4 | 5, { zh: string; en: string }> = {
    3: {
      zh: `三维美杜莎 R3：${cellLabel(hit.cell)} 同时含绿、蓝两色候选，未染色候选必假。`,
      en: `3D Medusa R3: ${cellLabel(hit.cell)} holds both green and blue colored candidates; uncolored candidates in the cell are false.`,
    },
    4: {
      zh: `三维美杜莎 R4：${cellLabel(hit.cell)} 的 ${hit.digit} 沿宫线同时看到绿、蓝两色的 ${hit.digit}，消去该候选。`,
      en: `3D Medusa R4: ${hit.digit} in ${cellLabel(hit.cell)} sees both green and blue ${hit.digit} along a unit → eliminate.`,
    },
    5: {
      zh: `三维美杜莎 R5：${cellLabel(hit.cell)} 的 ${hit.digit} 沿宫线见一色、同格另候选见反色，消去 ${hit.digit}。`,
      en: `3D Medusa R5: ${hit.digit} in ${cellLabel(hit.cell)} sees one color along a unit and the opposite color on another digit in the cell → eliminate ${hit.digit}.`,
    },
  };
  const t = texts[hit.rule];
  return {
    strategyId: '3d-medusa',
    placements: [],
    eliminations: elims,
    highlights: medusaHighlights(hit.comp, elims),
    explanation: t,
  };
}

function tryMedusaContradictions(grid: Grid, comp: MedusaComponent): Step | null {
  for (let c = 0; c < CELLS; c++) {
    const byColor: [number[], number[]] = [[], []];
    for (let d = 1; d <= 9; d++) {
      const col = getColor(comp, c, d);
      if (col === 0) byColor[0].push(d);
      else if (col === 1) byColor[1].push(d);
    }
    for (const color of [0, 1] as const) {
      if (byColor[color]!.length >= 2) {
        const falseColor = color;
        const elims = eliminateColorInComponent(grid, comp, falseColor);
        if (elims.length === 0) continue;
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: elims,
          highlights: medusaHighlights(comp, elims),
          explanation: {
            zh: `三维美杜莎 R1：${cellLabel(c)} 有两枚同色候选，该色全部为假，消去分量内同色候选。`,
            en: `3D Medusa R1: ${cellLabel(c)} has two same-color candidates — that color is false; eliminate same-color candidates in the component.`,
          },
        };
      }
    }
  }

  for (const house of HOUSES) {
    for (let d = 1; d <= 9; d++) {
      for (const color of [0, 1] as const) {
        const colored: number[] = [];
        for (const c of house) {
          if (getColor(comp, c, d) === color) colored.push(c);
        }
        if (colored.length >= 2) {
          const falseColor = color;
          const elims = eliminateColorInComponent(grid, comp, falseColor, d);
          if (elims.length === 0) continue;
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations: elims,
            highlights: medusaHighlights(comp, elims),
            explanation: {
              zh: `三维美杜莎 R2：某宫中数字 ${d} 有两枚同色候选，该色之 ${d} 在分量内全部消去。`,
              en: `3D Medusa R2: a house has two same-color ${d}s — all ${d} of that color in the component are eliminated.`,
            },
          };
        }
      }
    }
  }

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    if ([...Array(9)].some((_, i) => isColored(comp, c, i + 1))) continue;

    const uncoloredDigits: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (hasCand(grid, c, d)) uncoloredDigits.push(d);
    }
    if (uncoloredDigits.length === 0) continue;

    for (const color of [0, 1] as const) {
      if (uncoloredDigits.every(() => colorsSeenByCandidate(comp, c).has(color)) && colorsSeenByCandidate(comp, c).size > 0) {
        const falseColor = color;
        const elims = eliminateColorInComponent(grid, comp, falseColor);
        if (elims.length === 0) continue;
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: elims,
          highlights: medusaHighlights(comp, elims),
          explanation: {
            zh: `三维美杜莎 R6：${cellLabel(c)} 的每个候选均见同一色，该色为假，消去分量内同色候选。`,
            en: `3D Medusa R6: every candidate in ${cellLabel(c)} sees the same color — that color is false; eliminate same-color candidates in the component.`,
          },
        };
      }
    }
  }

  return null;
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    const components = buildMedusaGraph(grid);

    const allElims: MedusaElim[] = [];
    for (const comp of components) {
      allElims.push(...collectMedusaEliminations(grid, comp));
    }
    if (allElims.length > 0) {
      return medusaElimStep(pickBestMedusaElimGroup(allElims));
    }

    return null;
  },
};

function pickBestMedusaElimGroup(elims: MedusaElim[]): MedusaElim[] {
  const byDigit = new Map<number, MedusaElim[]>();
  for (const e of elims) {
    if (e.rule !== 4) continue;
    const list = byDigit.get(e.digit) ?? [];
    list.push(e);
    byDigit.set(e.digit, list);
  }
  let bestGroup: MedusaElim[] = elims.filter((e) => e.rule === 4);
  let bestSize = 0;
  for (const group of byDigit.values()) {
    if (group.length > bestSize) {
      bestSize = group.length;
      bestGroup = group;
    }
  }
  if (bestGroup.length > 0) {
    bestGroup.sort((a, b) => a.cell - b.cell);
    return bestGroup;
  }
  elims.sort((a, b) => a.rule - b.rule || a.digit - b.digit || a.cell - b.cell);
  return [elims[0]!];
}