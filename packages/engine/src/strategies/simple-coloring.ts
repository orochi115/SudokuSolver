import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateHighlights, cellName, link, sees, strongLinks } from './common.js';

export const simpleColoring: Strategy = {
  id: 'simple-coloring',
  name: { zh: '简单染色', en: 'Simple Coloring' },
  difficulty: 60,

  apply(grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const adj = new Map<number, number[]>();
      for (const [a, b] of strongLinks(grid, digit)) {
        adj.set(a, [...(adj.get(a) ?? []), b]);
        adj.set(b, [...(adj.get(b) ?? []), a]);
      }
      const colored = new Map<number, 0 | 1>();
      for (const start of adj.keys()) {
        if (colored.has(start)) continue;
        const component: number[] = [];
        const stack = [start];
        colored.set(start, 0);
        while (stack.length > 0) {
          const cell = stack.pop()!;
          component.push(cell);
          const nextColor = colored.get(cell) === 0 ? 1 : 0;
          for (const next of adj.get(cell) ?? []) {
            if (!colored.has(next)) {
              colored.set(next, nextColor);
              stack.push(next);
            }
          }
        }
        if (component.length < 3) continue;

        for (const color of [0, 1] as const) {
          const sameColor = component.filter((cell) => colored.get(cell) === color);
          if (sameColor.some((a, i) => sameColor.slice(i + 1).some((b) => sees(a, b)))) {
            const eliminations = sameColor.filter((cell) => grid.hasCandidate(cell, digit)).map((cell) => ({ cell, digit }));
            if (eliminations.length > 0) return coloringStep(this.id, digit, component, eliminations, linksForComponent(adj, component, digit), 'wrap');
          }
        }

        const eliminations: Array<{ cell: number; digit: number }> = [];
        for (let cell = 0; cell < 81; cell++) {
          if (!grid.hasCandidate(cell, digit) || component.includes(cell)) continue;
          const seesColor0 = component.some((other) => colored.get(other) === 0 && sees(cell, other));
          const seesColor1 = component.some((other) => colored.get(other) === 1 && sees(cell, other));
          if (seesColor0 && seesColor1) eliminations.push({ cell, digit });
        }
        if (eliminations.length > 0) return coloringStep(this.id, digit, component, eliminations, linksForComponent(adj, component, digit), 'trap');
      }
    }
    return null;
  },
};

function linksForComponent(adj: Map<number, number[]>, component: number[], digit: number) {
  const out = [];
  const seen = new Set<string>();
  for (const a of component) {
    for (const b of adj.get(a) ?? []) {
      if (!component.includes(b)) continue;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(link(a, b, digit, 'strong'));
    }
  }
  return out;
}

function coloringStep(strategyId: string, digit: number, component: number[], eliminations: Array<{ cell: number; digit: number }>, links: ReturnType<typeof link>[], kind: 'trap' | 'wrap'): Step {
  const zhKind = kind === 'wrap' ? '同色互见' : '双色陷阱';
  const enKind = kind === 'wrap' ? 'color wrap' : 'color trap';
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: { cells: component, candidates: candidateHighlights(component, [digit]), links },
    explanation: {
      zh: `${component.map(cellName).join('、')} 对数字 ${digit} 构成强链双色；${zhKind} 证明被标出的 ${digit} 不可能为真。`,
      en: `${component.map(cellName).join(', ')} form a two-color conjugate graph for ${digit}; the ${enKind} removes the highlighted ${digit} candidates.`,
    },
  };
}
