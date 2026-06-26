import { CELLS, HOUSES, ROW_OF, COL_OF, BOX_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function buildMedusaNetwork(grid: Grid): Map<number, Map<number, 0 | 1>> {
  const visitedCand = new Set<number>();
  const components: Array<Map<number, 0 | 1>> = [];

  function encode(cell: number, digit: number): number { return cell * 10 + digit; }

  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      const key = encode(c, d);
      if (visitedCand.has(key)) continue;
      const comp = new Map<number, 0 | 1>();
      const queue: Array<{ cell: number; digit: number; color: 0 | 1 }> = [];
      queue.push({ cell: c, digit: d, color: 0 });
      visitedCand.add(key);
      comp.set(c * 10 + d, 0);

      while (queue.length > 0) {
        const { cell, digit, color } = queue.shift()!;
        const bit = maskOf(digit);

        for (const house of HOUSES) {
          if (!house.includes(cell)) continue;
          const cands = house.filter((h) => h !== cell && grid.get(h) === 0 && (grid.candidatesOf(h) & bit) !== 0);
          const total = house.filter((h) => grid.get(h) === 0 && (grid.candidatesOf(h) & bit) !== 0).length;
          if (total !== 2 || cands.length !== 1) continue;
          const nkey = encode(cands[0]!, digit);
          if (visitedCand.has(nkey)) continue;
          visitedCand.add(nkey);
          const ncolor = (1 - color) as 0 | 1;
          comp.set(nkey, ncolor);
          queue.push({ cell: cands[0]!, digit, color: ncolor });
        }

        if (popcount(grid.candidatesOf(cell)) === 2) {
          for (const nd of digitsOf(grid.candidatesOf(cell))) {
            if (nd === digit) continue;
            const nkey = encode(cell, nd);
            if (visitedCand.has(nkey)) continue;
            visitedCand.add(nkey);
            const ncolor = (1 - color) as 0 | 1;
            comp.set(nkey, ncolor);
            queue.push({ cell, digit: nd, color: ncolor });
          }
        }
      }

      if (comp.size >= 2) components.push(comp);
    }
  }

  const multi = new Map<number, Map<number, 0 | 1>>();
  let idx = 0;
  for (const comp of components) {
    multi.set(idx, comp);
    idx++;
  }
  return multi;
}

function decodeCand(key: number): { cell: number; digit: number } {
  return { cell: Math.floor(key / 10), digit: key % 10 };
}

export const threeDMedusa: Strategy = {
  id: '3d-medusa',
  name: { zh: '三维美杜莎', en: '3D Medusa' },
  difficulty: 640,
  tieBreak: ['cell-index'],

  apply(grid: Grid): Step | null {
    const networks = buildMedusaNetwork(grid);

    for (const [netIdx, comp] of networks) {
      const green: number[] = [];
      const blue: number[] = [];
      for (const [key, color] of comp) {
        if (color === 0) green.push(key); else blue.push(key);
      }

      const greenMap = new Map<number, number[]>();
      const blueMap = new Map<number, number[]>();
      for (const key of green) {
        const { cell, digit } = decodeCand(key);
        if (!greenMap.has(cell)) greenMap.set(cell, []);
        greenMap.get(cell)!.push(digit);
      }
      for (const key of blue) {
        const { cell, digit } = decodeCand(key);
        if (!blueMap.has(cell)) blueMap.set(cell, []);
        blueMap.get(cell)!.push(digit);
      }

      const compSet = new Set(comp.keys());

      for (const [cell, digits] of greenMap) {
        if (digits.length >= 2) {
          const bluePlaced: { cell: number; digit: number }[] = [];
          for (const [ckey, color] of comp) {
            if (color === 1) {
              const { cell: cc, digit: cd } = decodeCand(ckey);
              if (grid.get(cc) === 0 && grid.hasCandidate(cc, cd)) {
                bluePlaced.push({ cell: cc, digit: cd });
              }
            }
          }
          if (bluePlaced.length === 0) continue;
          const allCells = [...new Set([...green.map((k) => decodeCand(k).cell), ...blue.map((k) => decodeCand(k).cell)])];
          const allCands = [...comp.keys()].map((k) => {
            const { cell, digit } = decodeCand(k);
            return { cell, digit };
          });
          return {
            strategyId: '3d-medusa',
            placements: bluePlaced,
            eliminations: [],
            highlights: { cells: allCells, candidates: allCands, links: [] },
            explanation: {
              zh: `三维美杜莎（R1）：${cellLabel(cell)} 有两个同色候选，该色全假；反色全真，落子 ${bluePlaced.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}。`,
              en: `3D Medusa (R1): ${cellLabel(cell)} has two same-color candidates; that color is false, opposite color true; place ${bluePlaced.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}.`,
            },
          };
        }
      }

      for (const [cell, digits] of blueMap) {
        if (digits.length >= 2) {
          const greenPlaced: { cell: number; digit: number }[] = [];
          for (const [ckey, color] of comp) {
            if (color === 0) {
              const { cell: cc, digit: cd } = decodeCand(ckey);
              if (grid.get(cc) === 0 && grid.hasCandidate(cc, cd)) {
                greenPlaced.push({ cell: cc, digit: cd });
              }
            }
          }
          if (greenPlaced.length === 0) continue;
          const allCells = [...new Set([...green.map((k) => decodeCand(k).cell), ...blue.map((k) => decodeCand(k).cell)])];
          const allCands = [...comp.keys()].map((k) => {
            const { cell, digit } = decodeCand(k);
            return { cell, digit };
          });
          return {
            strategyId: '3d-medusa',
            placements: greenPlaced,
            eliminations: [],
            highlights: { cells: allCells, candidates: allCands, links: [] },
            explanation: {
              zh: `三维美杜莎（R1）：${cellLabel(cell)} 有两个同色候选，该色全假；反色全真，落子 ${greenPlaced.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}。`,
              en: `3D Medusa (R1): ${cellLabel(cell)} has two same-color candidates; that color is false, opposite color true; place ${greenPlaced.map((p) => `${cellLabel(p.cell)}=${p.digit}`).join(',')}.`,
            },
          };
        }
      }

      for (const dig of Array.from({ length: 9 }, (_, i) => i + 1)) {
        for (const house of HOUSES) {
          const gCells = house.filter((c) => greenMap.has(c) && greenMap.get(c)!.includes(dig));
          const bCells = house.filter((c) => blueMap.has(c) && blueMap.get(c)!.includes(dig));
          if (gCells.length >= 2) {
            const bluePlaced: { cell: number; digit: number }[] = [];
            for (const [ckey, color] of comp) {
              if (color === 1) {
                const { cell: cc, digit: cd } = decodeCand(ckey);
                if (grid.get(cc) === 0 && grid.hasCandidate(cc, cd)) {
                  bluePlaced.push({ cell: cc, digit: cd });
                }
              }
            }
            if (bluePlaced.length === 0) continue;
            const allCells = [...new Set([...green.map((k) => decodeCand(k).cell), ...blue.map((k) => decodeCand(k).cell)])];
            const allCands = [...comp.keys()].map((k) => {
              const { cell, digit } = decodeCand(k);
              return { cell, digit };
            });
            return {
              strategyId: '3d-medusa',
              placements: bluePlaced,
              eliminations: [],
              highlights: { cells: allCells, candidates: allCands, links: [] },
              explanation: {
                zh: `三维美杜莎（R2）：数字 ${dig} 在第 ${house.includes(0) ? '宫' : '行/列'} 有两个同色候选，该色全假；反色全真。`,
                en: `3D Medusa (R2): digit ${dig} has two same-color candidates in a house; that color is false, opposite color true.`,
              },
            };
          }
          if (bCells.length >= 2) {
            const greenPlaced: { cell: number; digit: number }[] = [];
            for (const [ckey, color] of comp) {
              if (color === 0) {
                const { cell: cc, digit: cd } = decodeCand(ckey);
                if (grid.get(cc) === 0 && grid.hasCandidate(cc, cd)) {
                  greenPlaced.push({ cell: cc, digit: cd });
                }
              }
            }
            if (greenPlaced.length === 0) continue;
            const allCells = [...new Set([...green.map((k) => decodeCand(k).cell), ...blue.map((k) => decodeCand(k).cell)])];
            const allCands = [...comp.keys()].map((k) => {
              const { cell, digit } = decodeCand(k);
              return { cell, digit };
            });
            return {
              strategyId: '3d-medusa',
              placements: greenPlaced,
              eliminations: [],
              highlights: { cells: allCells, candidates: allCands, links: [] },
              explanation: {
                zh: `三维美杜莎（R2）：数字 ${dig} 在第 ${house.includes(0) ? '宫' : '行/列'} 有两个同色候选，该色全假；反色全真。`,
                en: `3D Medusa (R2): digit ${dig} has two same-color candidates in a house; that color is false, opposite color true.`,
              },
            };
          }
        }
      }

      const elims: { cell: number; digit: number }[] = [];
      for (let c = 0; c < CELLS; c++) {
        if (grid.get(c) !== 0) continue;
        for (const d of digitsOf(grid.candidatesOf(c))) {
          const key = encode(c, d);
          if (compSet.has(key)) continue;
          const hasGreenPeer = (greenMap.get(c)?.length ?? 0) > 0 && greenMap.has(c) && greenMap.get(c)!.length > 0;
          const hasBluePeer = (blueMap.get(c)?.length ?? 0) > 0 && blueMap.has(c) && blueMap.get(c)!.length > 0;
          if (hasGreenPeer && hasBluePeer) {
            elims.push({ cell: c, digit: d });
          }
        }
      }
      if (elims.length > 0) {
        const allCells = [...new Set([...green.map((k) => decodeCand(k).cell), ...blue.map((k) => decodeCand(k).cell), ...elims.map((e) => e.cell)])];
        const allCands = [...comp.keys()].map((k) => {
          const { cell, digit } = decodeCand(k);
          return { cell, digit };
        });
        return {
          strategyId: '3d-medusa',
          placements: [],
          eliminations: elims,
          highlights: {
            cells: allCells,
            candidates: [...allCands, ...elims],
            links: [],
          },
          explanation: {
            zh: `三维美杜莎（R3/R4）：未染色候选同时看到双色；消去 ${elims.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}。`,
            en: `3D Medusa (R3/R4): uncolored candidates see both colors; eliminate ${elims.map((e) => `${cellLabel(e.cell)}(${e.digit})`).join(',')}.`,
          },
        };
      }
    }
    return null;
  },
};