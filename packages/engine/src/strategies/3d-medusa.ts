import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function buildStrongAdjacency(grid: Grid): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  const keyOf = (c: number, d: number) => `${c},${d}`;

  for (let cell = 0; cell < CELLS; cell++) {
    if (grid.get(cell) !== 0) continue;
    const m = grid.candidatesOf(cell);
    for (const d of digitsOf(m)) {
      const k = keyOf(cell, d);
      if (!adj.has(k)) adj.set(k, []);

      for (const house of HOUSES) {
        if (!house.includes(cell)) continue;
        const cands = house.filter((c) => c !== cell && grid.get(c) === 0 && grid.hasCandidate(c, d));
        const total = house.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, d)).length;
        if (total === 2 && cands.length === 1) {
          adj.get(k)!.push(keyOf(cands[0]!, d));
        }
      }

      if (popcount(m) === 2) {
        for (const d2 of digitsOf(m)) {
          if (d2 !== d) adj.get(k)!.push(keyOf(cell, d2));
        }
      }
    }
  }
  return adj;
}

function try3dMedusa(grid: Grid): Step | null {
  const adj = buildStrongAdjacency(grid);

  const visited = new Set<string>();
  const allComponents: Array<Map<string, 0 | 1>> = [];

  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    const comp = new Map<string, 0 | 1>();
    const queue: Array<{ key: string; color: 0 | 1 }> = [{ key: start, color: 0 }];
    visited.add(start);
    comp.set(start, 0);

    while (queue.length > 0) {
      const { key, color } = queue.shift()!;
      for (const nk of adj.get(key) ?? []) {
        if (visited.has(nk)) continue;
        visited.add(nk);
        const nc = (1 - color) as 0 | 1;
        comp.set(nk, nc);
        queue.push({ key: nk, color: nc });
      }
    }

    if (comp.size >= 3) allComponents.push(comp);
  }

  for (const comp of allComponents) {
    const green: Array<{ cell: number; digit: number }> = [];
    const blue: Array<{ cell: number; digit: number }> = [];

    for (const [k, color] of comp) {
      const parts = k.split(',');
      const cell = Number(parts[0]!);
      const digit = Number(parts[1]!);
      if (color === 0) green.push({ cell, digit });
      else blue.push({ cell, digit });
    }

    const greenByCell = new Map<number, number[]>();
    const blueByCell = new Map<number, number[]>();
    const greenByDigit = new Map<number, number[]>();
    const blueByDigit = new Map<number, number[]>();

    for (const n of green) {
      (greenByCell.get(n.cell) ?? greenByCell.set(n.cell, []).get(n.cell)!).push(n.digit);
      (greenByDigit.get(n.digit) ?? greenByDigit.set(n.digit, []).get(n.digit)!).push(n.cell);
    }
    for (const n of blue) {
      (blueByCell.get(n.cell) ?? blueByCell.set(n.cell, []).get(n.cell)!).push(n.digit);
      (blueByDigit.get(n.digit) ?? blueByDigit.set(n.digit, []).get(n.digit)!).push(n.cell);
    }

    const allColoredCells = new Set([...green.map((n) => n.cell), ...blue.map((n) => n.cell)]);

    const links: Link[] = [];
    const seen = new Set<string>();
    for (const [k, color] of comp) {
      const parts = k.split(',');
      const cell = Number(parts[0]!);
      const digit = Number(parts[1]!);
      if (!grid.hasCandidate(cell, digit)) continue;
      const bit = maskOf(digit);
      for (const house of HOUSES) {
        if (!house.includes(cell)) continue;
        const cands = house.filter((c) => c !== cell && grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0);
        const total = house.filter((c) => grid.get(c) === 0 && (grid.candidatesOf(c) & bit) !== 0).length;
        if (total === 2 && cands.length === 1 && cands[0] !== undefined) {
          const nk = `${cands[0]},${digit}`;
          if (comp.has(nk)) {
            const key = `${Math.min(cell, cands[0])}-${digit}`;
            if (!seen.has(key)) {
              seen.add(key);
              links.push({
                from: { cell, digit },
                to: { cell: cands[0]!, digit },
                type: 'strong',
              });
            }
          }
        }
      }
      const m2 = grid.candidatesOf(cell);
      if (popcount(m2) === 2) {
        for (const d2 of digitsOf(m2)) {
          if (d2 !== digit) {
            const nk = `${cell},${d2}`;
            if (comp.has(nk) && !seen.has(`${cell}-${Math.min(digit, d2)}`)) {
              seen.add(`${cell}-${Math.min(digit, d2)}`);
              links.push({
                from: { cell, digit },
                to: { cell, digit: d2 },
                type: 'strong',
              });
            }
          }
        }
      }
    }

    const chainCells = [...new Set([...green.map((n) => n.cell), ...blue.map((n) => n.cell)])];
    const chainCands = [...green, ...blue].map((n) => ({ cell: n.cell, digit: n.digit }));

    for (const [c, digits] of greenByCell) {
      if (digits.length >= 2) {
        const eliminations = digits.filter((d) => grid.hasCandidate(c, d)).map((d) => ({ cell: c, digit: d }));
        if (eliminations.length > 0) {
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations,
            highlights: { cells: chainCells, candidates: chainCands, links },
            explanation: {
              zh: `3D Medusa R1：格 ${cellLabel(c)} 有两个同色（绿）候选 ${digits.join(',')}；绿色全假，消去之。`,
              en: `3D Medusa R1: cell ${cellLabel(c)} has two same-color (green) candidates ${digits.join(',')}; green is false, eliminate.`,
            },
          };
        }
      }
    }

    for (const [d, cells] of greenByDigit) {
      for (const house of HOUSES) {
        const inHouse = cells.filter((c) => house.includes(c));
        if (inHouse.length >= 2) {
          const eliminations = inHouse.filter((c) => grid.hasCandidate(c, d)).map((c) => ({ cell: c, digit: d }));
          if (eliminations.length >= 2) {
            return {
              strategyId: '3d-medusa',
              placements: [],
              eliminations,
              highlights: { cells: chainCells, candidates: chainCands, links },
              explanation: {
                zh: `3D Medusa R2：数字 ${d} 在同宫中两个同色（绿）候选；绿色全假，消去之。`,
                en: `3D Medusa R2: digit ${d} has two same-color (green) candidates in one house; green is false, eliminate.`,
              },
            };
          }
        }
      }
    }

    for (let c = 0; c < CELLS; c++) {
      if (grid.get(c) !== 0) continue;
      if (allColoredCells.has(c)) continue;

      const cm = grid.candidatesOf(c);
      const hasGreen = greenByCell.has(c);
      const hasBlue = blueByCell.has(c);

      for (const d of digitsOf(cm)) {
        const k = `${c},${d}`;
        if (comp.has(k)) continue;

        if (hasGreen && hasBlue) {
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations: [{ cell: c, digit: d }],
            highlights: { cells: [...chainCells, c], candidates: [...chainCands, { cell: c, digit: d }], links },
            explanation: {
              zh: `3D Medusa R3：格 ${cellLabel(c)} 同时有绿蓝候选，未染色 ${d} 消去。`,
              en: `3D Medusa R3: cell ${cellLabel(c)} has both green and blue candidates; uncolored ${d} eliminated.`,
            },
          };
        }

        const peers = new Set(PEERS_OF[c]!);
        const seesGreen = (greenByDigit.get(d) ?? []).some((gc) => peers.has(gc));
        const seesBlue = (blueByDigit.get(d) ?? []).some((bc) => peers.has(bc));

        if (seesGreen && seesBlue) {
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations: [{ cell: c, digit: d }],
            highlights: { cells: [...chainCells, c], candidates: [...chainCands, { cell: c, digit: d }], links },
            explanation: {
              zh: `3D Medusa R4：${cellLabel(c)}(${d}) 同时看到绿蓝的 ${d}，消去。`,
              en: `3D Medusa R4: ${cellLabel(c)}(${d}) sees both green and blue ${d}; eliminate.`,
            },
          };
        }

        if ((seesGreen && hasBlue) || (seesBlue && hasGreen)) {
          return {
            strategyId: '3d-medusa',
            placements: [],
            eliminations: [{ cell: c, digit: d }],
            highlights: { cells: [...chainCells, c], candidates: [...chainCands, { cell: c, digit: d }], links },
            explanation: {
              zh: `3D Medusa R5：${cellLabel(c)}(${d}) 沿宫看到一种颜色且格内有另一颜色，消去。`,
              en: `3D Medusa R5: ${cellLabel(c)}(${d}) sees one color in house and has opposite in cell; eliminate.`,
            },
          };
        }
      }
    }
  }
  return null;
}

export const medusa3d: Strategy = {
  id: '3d-medusa',
  name: { zh: '3D 美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],
  apply(grid: Grid): Step | null {
    return try3dMedusa(grid);
  },
};