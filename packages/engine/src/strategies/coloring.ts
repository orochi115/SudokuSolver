import {
  CELLS, HOUSES, ROW_OF, COL_OF,
  PEERS_OF, maskOf, popcount, digitsOf,
} from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(c: number): string {
  return `R${ROW_OF[c]! + 1}C${COL_OF[c]! + 1}`;
}

interface ColorCluster {
  colorA: number[];
  colorB: number[];
}

function buildConjugateClusters(grid: Grid, digit: number): ColorCluster[] {
  const bit = maskOf(digit);
  const adj = new Map<number, number>();

  for (const house of HOUSES) {
    const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
    if (inHouse.length === 2) {
      adj.set(inHouse[0]!, inHouse[1]!);
      adj.set(inHouse[1]!, inHouse[0]!);
    }
  }

  const visited = new Set<number>();
  const clusters: ColorCluster[] = [];

  for (let c = 0; c < CELLS; c++) {
    if (visited.has(c) || !adj.has(c)) continue;
    const colorA: number[] = [];
    const colorB: number[] = [];
    const queue: [number, boolean][] = [[c, true]];
    visited.add(c);

    while (queue.length > 0) {
      const [cur, isA] = queue.shift()!;
      if (isA) colorA.push(cur); else colorB.push(cur);
      const partner = adj.get(cur);
      if (partner !== undefined && !visited.has(partner)) {
        visited.add(partner);
        queue.push([partner, !isA]);
      }
    }

    if (colorA.length > 0 && colorB.length > 0) {
      clusters.push({ colorA, colorB });
    }
  }

  return clusters;
}

export const multiColoring: Strategy = {
  id: 'multi-coloring',
  name: { zh: '多色链', en: 'Multi-Coloring' },
  difficulty: 620,
  tieBreak: ['digit', 'cell-index'],

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const clusters = buildConjugateClusters(grid, digit);
      if (clusters.length < 2) continue;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const c1 = clusters[i]!;
          const c2 = clusters[j]!;

          const result = tryMultiColorType1(grid, digit, c1, c2);
          if (result) return result;

          const result2 = tryMultiColorType2(grid, digit, c1, c2);
          if (result2) return result2;
        }
      }
    }
    return null;
  },
};

function tryMultiColorType1(
  grid: Grid, digit: number, c1: ColorCluster, c2: ColorCluster,
): Step | null {
  const bit = maskOf(digit);
  const a1Set = new Set(c1.colorA);
  const b1Set = new Set(c1.colorB);
  const a2Set = new Set(c2.colorA);
  const b2Set = new Set(c2.colorB);

  let a1SeesA2 = false;
  for (const a of c1.colorA) {
    for (const b of c2.colorA) {
      if (PEERS_OF[a]!.includes(b)) { a1SeesA2 = true; break; }
    }
    if (a1SeesA2) break;
  }

  if (!a1SeesA2) return null;

  const elims: { cell: number; digit: number }[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0 || !(grid.candidatesOf(c) & bit)) continue;
    if (a1Set.has(c) || b1Set.has(c) || a2Set.has(c) || b2Set.has(c)) continue;
    const peers = new Set(PEERS_OF[c]!);
    const seesB1 = c1.colorB.some((x) => peers.has(x));
    const seesB2 = c2.colorB.some((x) => peers.has(x));
    if (seesB1 && seesB2) elims.push({ cell: c, digit });
  }

  if (elims.length === 0) return null;

  return {
    strategyId: 'multi-coloring',
    placements: [],
    eliminations: elims,
    highlights: {
      cells: [...c1.colorA, ...c1.colorB, ...c2.colorA, ...c2.colorB, ...elims.map((e) => e.cell)],
      candidates: [
        ...c1.colorA.map((c) => ({ cell: c, digit })),
        ...c1.colorB.map((c) => ({ cell: c, digit })),
        ...c2.colorA.map((c) => ({ cell: c, digit })),
        ...c2.colorB.map((c) => ({ cell: c, digit })),
        ...elims,
      ],
      links: [],
    },
    explanation: {
      zh: `多色链 Type1：两个颜色簇的A色互相可见；至少一个B色为真，消去同时看到两B色的格中的${digit}。`,
      en: `Multi-Coloring Type 1: A-colors of two clusters see each other; at least one B-color is true; eliminate ${digit} from cells seeing both B-colors.`,
    },
  };
}

function tryMultiColorType2(
  grid: Grid, digit: number, c1: ColorCluster, c2: ColorCluster,
): Step | null {
  const bit = maskOf(digit);

  for (const [myColor, otherColor] of [[c1.colorA, c1.colorB], [c1.colorB, c1.colorA]] as [number[], number[]][]) {
    let seesA2 = false;
    let seesB2 = false;
    for (const mc of myColor) {
      for (const a of c2.colorA) {
        if (PEERS_OF[mc]!.includes(a)) { seesA2 = true; break; }
      }
      if (seesA2) break;
    }
    for (const mc of myColor) {
      for (const b of c2.colorB) {
        if (PEERS_OF[mc]!.includes(b)) { seesB2 = true; break; }
      }
      if (seesB2) break;
    }

    if (seesA2 && seesB2) {
      const elims: { cell: number; digit: number }[] = [];
      for (const c of myColor) {
        if (grid.get(c) === 0 && (grid.candidatesOf(c) & bit)) {
          elims.push({ cell: c, digit });
        }
      }
      if (elims.length === 0) continue;

      return {
        strategyId: 'multi-coloring',
        placements: [],
        eliminations: elims,
        highlights: {
          cells: [...c1.colorA, ...c1.colorB, ...c2.colorA, ...c2.colorB],
          candidates: [
            ...c1.colorA.map((c) => ({ cell: c, digit })),
            ...c1.colorB.map((c) => ({ cell: c, digit })),
            ...c2.colorA.map((c) => ({ cell: c, digit })),
            ...c2.colorB.map((c) => ({ cell: c, digit })),
            ...elims,
          ],
          links: [],
        },
        explanation: {
          zh: `多色链 Type2：一簇的某色同时看到另一簇的两色；该色全假，消去所有该色格中的${digit}。`,
          en: `Multi-Coloring Type 2: one color sees both colors of another cluster; that color is all false; eliminate ${digit} from all cells of that color.`,
        },
      };
    }
  }
  return null;
}

export const threeDMedusa: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    type Vertex = { cell: number; digit: number };
    const vertexKey = (v: Vertex) => v.cell * 10 + v.digit;

    const strongLinks: [Vertex, Vertex][] = [];

    for (const house of HOUSES) {
      for (let d = 1; d <= 9; d++) {
        const bit = maskOf(d);
        const inHouse = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit));
        if (inHouse.length === 2) {
          strongLinks.push([{ cell: inHouse[0]!, digit: d }, { cell: inHouse[1]!, digit: d }]);
        }
      }
    }

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (popcount(grid.candidatesOf(c)) === 2) {
        const ds = digitsOf(grid.candidatesOf(c));
        strongLinks.push([{ cell: c, digit: ds[0]! }, { cell: c, digit: ds[1]! }]);
      }
    }

    const adj = new Map<number, Vertex[]>();
    for (const [a, b] of strongLinks) {
      const ka = vertexKey(a);
      const kb = vertexKey(b);
      if (!adj.has(ka)) adj.set(ka, []);
      if (!adj.has(kb)) adj.set(kb, []);
      adj.get(ka)!.push(b);
      adj.get(kb)!.push(a);
    }

    const visited = new Map<number, boolean>();
    const components: { green: Vertex[]; blue: Vertex[] }[] = [];

    for (const [key] of adj) {
      if (visited.has(key)) continue;
      const green: Vertex[] = [];
      const blue: Vertex[] = [];
      const queue: [Vertex, boolean][] = [[{ cell: Math.floor(key / 10), digit: key % 10 }, true]];
      visited.set(key, true);

      while (queue.length > 0) {
        const [v, isGreen] = queue.shift()!;
        if (isGreen) green.push(v); else blue.push(v);
        for (const next of adj.get(vertexKey(v))!) {
          const nk = vertexKey(next);
          if (!visited.has(nk)) {
            visited.set(nk, !isGreen);
            queue.push([next, !isGreen]);
          }
        }
      }

      if (green.length > 0 && blue.length > 0) {
        components.push({ green, blue });
      }
    }

    for (const comp of components) {
      const greenSet = new Set(comp.green.map(vertexKey));
      const blueSet = new Set(comp.blue.map(vertexKey));

      for (const color of [comp.green, comp.blue] as Vertex[][]) {
        for (let c = 0; c < CELLS; c++) {
          if (grid.get(c) !== 0) continue;
          const inCell = color.filter((v) => v.cell === c);
          if (inCell.length >= 2) {
            const otherColor = color === comp.green ? comp.blue : comp.green;
            const elims: { cell: number; digit: number }[] = [];
            for (const v of color) {
              if (grid.hasCandidate(v.cell, v.digit)) {
                elims.push({ cell: v.cell, digit: v.digit });
              }
            }
            if (elims.length > 0) {
              return {
                strategyId: '3d-medusa',
                placements: otherColor.filter((v) => grid.hasCandidate(v.cell, v.digit)).map((v) => ({ cell: v.cell, digit: v.digit })),
                eliminations: elims,
                highlights: {
                  cells: [...new Set([...comp.green.map((v) => v.cell), ...comp.blue.map((v) => v.cell)])],
                  candidates: [...comp.green.map((v) => ({ cell: v.cell, digit: v.digit })), ...comp.blue.map((v) => ({ cell: v.cell, digit: v.digit }))],
                  links: [],
                },
                explanation: {
                  zh: `三维美杜莎 R1：同一格中有两个同色候选数；该色全假，对色为真。`,
                  en: `3D Medusa R1: two same-color candidates in one cell; that color is false, opposite color is true.`,
                },
              };
            }
          }
        }

        for (let d = 1; d <= 9; d++) {
          for (const house of HOUSES) {
            const inHouse = color.filter((v) => v.digit === d && house.includes(v.cell));
            if (inHouse.length >= 2) {
              const otherColor = color === comp.green ? comp.blue : comp.green;
              const elims: { cell: number; digit: number }[] = [];
              for (const v of color) {
                if (grid.hasCandidate(v.cell, v.digit)) {
                  elims.push({ cell: v.cell, digit: v.digit });
                }
              }
              if (elims.length > 0) {
                return {
                  strategyId: '3d-medusa',
                  placements: otherColor.filter((v) => grid.hasCandidate(v.cell, v.digit)).map((v) => ({ cell: v.cell, digit: v.digit })),
                  eliminations: elims,
                  highlights: {
                    cells: [...new Set([...comp.green.map((v) => v.cell), ...comp.blue.map((v) => v.cell)])],
                    candidates: [...comp.green.map((v) => ({ cell: v.cell, digit: v.digit })), ...comp.blue.map((v) => ({ cell: v.cell, digit: v.digit }))],
                    links: [],
                  },
                  explanation: {
                    zh: `三维美杜莎 R2：同一宫/行/列中有两个同色同数字候选数；该色全假。`,
                    en: `3D Medusa R2: two same-color same-digit candidates in one house; that color is false.`,
                  },
                };
              }
            }
          }
        }
      }

      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        const mask = grid.candidatesOf(c);
        const ds = digitsOf(mask);
        const hasGreen = ds.some((d) => greenSet.has(vertexKey({ cell: c, digit: d })));
        const hasBlue = ds.some((d) => blueSet.has(vertexKey({ cell: c, digit: d })));
        if (hasGreen && hasBlue) {
          const elims: { cell: number; digit: number }[] = [];
          for (const d of ds) {
            const k = vertexKey({ cell: c, digit: d });
            if (!greenSet.has(k) && !blueSet.has(k)) {
              elims.push({ cell: c, digit: d });
            }
          }
          if (elims.length > 0) {
            return {
              strategyId: '3d-medusa',
              placements: [],
              eliminations: elims,
              highlights: {
                cells: [c, ...new Set([...comp.green.map((v) => v.cell), ...comp.blue.map((v) => v.cell)])],
                candidates: [
                  ...ds.map((d) => ({ cell: c, digit: d })),
                  ...comp.green.map((v) => ({ cell: v.cell, digit: v.digit })),
                  ...comp.blue.map((v) => ({ cell: v.cell, digit: v.digit })),
                ],
                links: [],
              },
              explanation: {
                zh: `三维美杜莎 R3：格${cellLabel(c)}同时含有绿色和蓝色候选数；消去未着色的候选数。`,
                en: `3D Medusa R3: cell ${cellLabel(c)} has both green and blue candidates; eliminate uncolored candidates.`,
              },
            };
          }
        }
      }

      for (let d = 1; d <= 9; d++) {
        for (const house of HOUSES) {
          const greenInHouse = comp.green.filter((v) => v.digit === d && house.includes(v.cell));
          const blueInHouse = comp.blue.filter((v) => v.digit === d && house.includes(v.cell));
          if (greenInHouse.length > 0 && blueInHouse.length > 0) {
            for (const c of house) {
              if (grid.get(c) !== 0 || !grid.hasCandidate(c, d)) continue;
              const k = vertexKey({ cell: c, digit: d });
              if (greenSet.has(k) || blueSet.has(k)) continue;
              return {
                strategyId: '3d-medusa',
                placements: [],
                eliminations: [{ cell: c, digit: d }],
                highlights: {
                  cells: [c, ...new Set([...comp.green.map((v) => v.cell), ...comp.blue.map((v) => v.cell)])],
                  candidates: [
                    { cell: c, digit: d },
                    ...comp.green.map((v) => ({ cell: v.cell, digit: v.digit })),
                    ...comp.blue.map((v) => ({ cell: v.cell, digit: v.digit })),
                  ],
                  links: [],
                },
                explanation: {
                  zh: `三维美杜莎 R4：宫/行/列中同时有绿色和蓝色的${d}；消去未着色的${d}。`,
                  en: `3D Medusa R4: house has both green and blue ${d}; eliminate uncolored ${d}.`,
                },
              };
            }
          }
        }
      }
    }
    return null;
  },
};
