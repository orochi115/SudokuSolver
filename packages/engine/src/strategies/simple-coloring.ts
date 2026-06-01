import { BOXES, CELLS, COLS, PEERS_OF, ROWS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

interface StrongEdge {
  a: number;
  b: number;
}

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const edges = strongEdges(grid, digit);
      if (edges.length === 0) continue;
      const result = findColoringStep(grid, digit, edges, this.id);
      if (result) return result;
    }
    return null;
  },
};

function strongEdges(grid: Grid, digit: number): StrongEdge[] {
  const edges: StrongEdge[] = [];
  const seen = new Set<string>();

  const addConjugate = (cells: readonly number[]): void => {
    const hits = cells.filter((cell) => grid.hasCandidate(cell, digit));
    if (hits.length !== 2) return;
    const a = Math.min(hits[0]!, hits[1]!);
    const b = Math.max(hits[0]!, hits[1]!);
    const key = `${a}-${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ a, b });
  };

  for (const row of ROWS) addConjugate(row);
  for (const col of COLS) addConjugate(col);
  for (const box of BOXES) addConjugate(box);

  return edges;
}

function findColoringStep(grid: Grid, digit: number, edges: readonly StrongEdge[], strategyId: string): Step | null {
  const adjacency = new Map<number, number[]>();
  for (const edge of edges) {
    adjacency.set(edge.a, [...(adjacency.get(edge.a) ?? []), edge.b]);
    adjacency.set(edge.b, [...(adjacency.get(edge.b) ?? []), edge.a]);
  }

  const color = new Map<number, 0 | 1>();
  const seen = new Set<number>();

  for (const start of adjacency.keys()) {
    if (seen.has(start)) continue;
    const component: number[] = [];
    const queue: number[] = [start];
    color.set(start, 0);
    seen.add(start);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      component.push(cur);
      for (const nxt of adjacency.get(cur) ?? []) {
        if (!seen.has(nxt)) {
          seen.add(nxt);
          color.set(nxt, (1 - color.get(cur)!) as 0 | 1);
          queue.push(nxt);
        }
      }
    }

    const wrap = findWrap(grid, digit, component, color, edges, strategyId);
    if (wrap) return wrap;
    const trap = findTrap(grid, digit, component, color, edges, strategyId);
    if (trap) return trap;
  }

  return null;
}

function findWrap(
  grid: Grid,
  digit: number,
  component: readonly number[],
  color: ReadonlyMap<number, 0 | 1>,
  edges: readonly StrongEdge[],
  strategyId: string,
): Step | null {
  const byColor: [number[], number[]] = [[], []];
  for (const cell of component) byColor[color.get(cell)!]!.push(cell);

  for (const c of [0, 1] as const) {
    const cells = byColor[c]!;
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i]!;
        const b = cells[j]!;
        if (!PEERS_OF[a]!.includes(b)) continue;

        const elimCells = byColor[c].filter((cell) => grid.hasCandidate(cell, digit));
        if (elimCells.length === 0) continue;

        return {
          strategyId,
          placements: [],
          eliminations: elimCells.map((cell) => ({ cell, digit })),
          highlights: {
            cells: [...component],
            candidates: component.map((cell) => ({ cell, digit })),
            links: edges
              .filter((e) => component.includes(e.a) && component.includes(e.b))
              .map((e) => ({ from: { cell: e.a, digit }, to: { cell: e.b, digit }, type: 'strong' as const })),
          },
          explanation: {
            zh: `数字 ${digit} 的简单染色出现同色相见（Wrap），该颜色不可能成立，删除该色上的 ${digit}。`,
            en: `Simple Coloring on digit ${digit} finds a same-color contradiction (wrap), so remove ${digit} from that color.`,
          },
        };
      }
    }
  }

  return null;
}

function findTrap(
  grid: Grid,
  digit: number,
  component: readonly number[],
  color: ReadonlyMap<number, 0 | 1>,
  edges: readonly StrongEdge[],
  strategyId: string,
): Step | null {
  const inComponent = new Set(component);
  const color0 = component.filter((cell) => color.get(cell) === 0);
  const color1 = component.filter((cell) => color.get(cell) === 1);

  const eliminations: number[] = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (inComponent.has(cell)) continue;
    if (!grid.hasCandidate(cell, digit)) continue;
    const sees0 = color0.some((c) => PEERS_OF[cell]!.includes(c));
    if (!sees0) continue;
    const sees1 = color1.some((c) => PEERS_OF[cell]!.includes(c));
    if (!sees1) continue;
    eliminations.push(cell);
  }
  if (eliminations.length === 0) return null;

  return {
    strategyId,
    placements: [],
    eliminations: eliminations.map((cell) => ({ cell, digit })),
    highlights: {
      cells: [...component, ...eliminations],
      candidates: [...component, ...eliminations].map((cell) => ({ cell, digit })),
      links: edges
        .filter((e) => component.includes(e.a) && component.includes(e.b))
        .map((e) => ({ from: { cell: e.a, digit }, to: { cell: e.b, digit }, type: 'strong' as const })),
    },
    explanation: {
      zh: `数字 ${digit} 的简单染色形成 Trap：目标格同时看见两种颜色，故其 ${digit} 可删除。`,
      en: `Simple Coloring on digit ${digit} forms a trap: the target sees both colors, so ${digit} is eliminated there.`,
    },
  };
}
