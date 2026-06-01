import { BOX_OF, COL_OF, PEERS_OF, ROW_OF } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Strategy } from '../strategy.js';
import type { Step } from '../trace.js';

interface StrongLink {
  kind: 'row' | 'col';
  index: number;
  a: number;
  b: number;
}

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single-Digit Patterns' },
  difficulty: 45,

  apply(grid: Grid): Step | null {
    for (let digit = 1; digit <= 9; digit++) {
      const skyscraper = findSkyscraper(grid, digit, this.id);
      if (skyscraper) return skyscraper;
    }
    return null;
  },
};

function strongLinksInRows(grid: Grid, digit: number): StrongLink[] {
  const out: StrongLink[] = [];
  for (let row = 0; row < 9; row++) {
    const cells: number[] = [];
    for (let col = 0; col < 9; col++) {
      const cell = row * 9 + col;
      if (grid.hasCandidate(cell, digit)) cells.push(cell);
    }
    if (cells.length === 2) out.push({ kind: 'row', index: row, a: cells[0]!, b: cells[1]! });
  }
  return out;
}

function strongLinksInCols(grid: Grid, digit: number): StrongLink[] {
  const out: StrongLink[] = [];
  for (let col = 0; col < 9; col++) {
    const cells: number[] = [];
    for (let row = 0; row < 9; row++) {
      const cell = row * 9 + col;
      if (grid.hasCandidate(cell, digit)) cells.push(cell);
    }
    if (cells.length === 2) out.push({ kind: 'col', index: col, a: cells[0]!, b: cells[1]! });
  }
  return out;
}

function peersBoth(cellA: number, cellB: number): number[] {
  const setB = new Set(PEERS_OF[cellB]!);
  return PEERS_OF[cellA]!.filter((cell) => setB.has(cell));
}

function findSkyscraper(grid: Grid, digit: number, strategyId: string): Step | null {
  const rowLinks = strongLinksInRows(grid, digit);
  for (let i = 0; i < rowLinks.length; i++) {
    for (let j = i + 1; j < rowLinks.length; j++) {
      const l1 = rowLinks[i]!;
      const l2 = rowLinks[j]!;
      const endpoints1 = [l1.a, l1.b] as const;
      const endpoints2 = [l2.a, l2.b] as const;
      for (const e1 of endpoints1) {
        for (const e2 of endpoints2) {
          if (COL_OF[e1] !== COL_OF[e2]) continue;
          const roof1 = e1 === l1.a ? l1.b : l1.a;
          const roof2 = e2 === l2.a ? l2.b : l2.a;
          if (roof1 === roof2) continue;
          if (BOX_OF[e1] === BOX_OF[e2]) continue;
          if (BOX_OF[roof1] === BOX_OF[roof2]) continue;
          if (PEERS_OF[roof1]!.includes(roof2)) continue;
          const eliminations = peersBoth(roof1, roof2)
            .filter((cell) => cell !== l1.a && cell !== l1.b && cell !== l2.a && cell !== l2.b)
            .filter((cell) => grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length === 0) continue;

          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: {
              cells: [l1.a, l1.b, l2.a, l2.b],
              candidates: [l1.a, l1.b, l2.a, l2.b].map((cell) => ({ cell, digit })),
              links: [],
            },
            explanation: {
              zh: `数字 ${digit} 形成 Skyscraper（两条强链接共享一条 cover 线），可删除同时看见两个屋顶候选的 ${digit}。`,
              en: `Digit ${digit} forms a Skyscraper (two strong links sharing one cover line); remove ${digit} from cells that see both roof candidates.`,
            },
          };
        }
      }
    }
  }

  const colLinks = strongLinksInCols(grid, digit);
  for (let i = 0; i < colLinks.length; i++) {
    for (let j = i + 1; j < colLinks.length; j++) {
      const l1 = colLinks[i]!;
      const l2 = colLinks[j]!;
      const endpoints1 = [l1.a, l1.b] as const;
      const endpoints2 = [l2.a, l2.b] as const;
      for (const e1 of endpoints1) {
        for (const e2 of endpoints2) {
          if (ROW_OF[e1] !== ROW_OF[e2]) continue;
          const roof1 = e1 === l1.a ? l1.b : l1.a;
          const roof2 = e2 === l2.a ? l2.b : l2.a;
          if (roof1 === roof2) continue;
          if (BOX_OF[e1] === BOX_OF[e2]) continue;
          if (BOX_OF[roof1] === BOX_OF[roof2]) continue;
          if (PEERS_OF[roof1]!.includes(roof2)) continue;
          const eliminations = peersBoth(roof1, roof2)
            .filter((cell) => cell !== l1.a && cell !== l1.b && cell !== l2.a && cell !== l2.b)
            .filter((cell) => grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length === 0) continue;

          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: {
              cells: [l1.a, l1.b, l2.a, l2.b],
              candidates: [l1.a, l1.b, l2.a, l2.b].map((cell) => ({ cell, digit })),
              links: [],
            },
            explanation: {
              zh: `数字 ${digit} 形成 Skyscraper（列向强链接），可删除同时看见两个屋顶候选的 ${digit}。`,
              en: `Digit ${digit} forms a Skyscraper (column-oriented strong links); remove ${digit} from cells that see both roof candidates.`,
            },
          };
        }
      }
    }
  }

  return null;
}

function findTwoStringKite(grid: Grid, digit: number, strategyId: string): Step | null {
  const rows = strongLinksInRows(grid, digit);
  const cols = strongLinksInCols(grid, digit);

  for (const r of rows) {
    for (const c of cols) {
      const rowEnds = [r.a, r.b] as const;
      const colEnds = [c.a, c.b] as const;
      for (const re of rowEnds) {
        for (const ce of colEnds) {
          if (BOX_OF[re] !== BOX_OF[ce]) continue;
          const tailRow = re === r.a ? r.b : r.a;
          const tailCol = ce === c.a ? c.b : c.a;
          const eliminations = peersBoth(tailRow, tailCol)
            .filter((cell) => ![r.a, r.b, c.a, c.b].includes(cell))
            .filter((cell) => grid.hasCandidate(cell, digit))
            .map((cell) => ({ cell, digit }));
          if (eliminations.length === 0) continue;

          return {
            strategyId,
            placements: [],
            eliminations,
            highlights: {
              cells: [r.a, r.b, c.a, c.b],
              candidates: [r.a, r.b, c.a, c.b].map((cell) => ({ cell, digit })),
              links: [],
            },
            explanation: {
              zh: `数字 ${digit} 形成 2-String Kite（行强链接 + 列强链接，经同宫连接），可删除同时看见两个尾翼的 ${digit}。`,
              en: `Digit ${digit} forms a 2-String Kite (row strong link + column strong link joined in one box); remove ${digit} from cells that see both tails.`,
            },
          };
        }
      }
    }
  }

  return null;
}

function findEmptyRectangle(grid: Grid, digit: number, strategyId: string): Step | null {
  void grid;
  void digit;
  void strategyId;
  return null;
}
