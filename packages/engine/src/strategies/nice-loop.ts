import { CELLS, HOUSES, ROW_OF, COL_OF, PEERS_OF, maskOf, popcount, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step, Link, LinkType } from '../trace.js';
import type { Strategy } from '../strategy.js';

function cellLabel(cell: number): string {
  return `R${ROW_OF[cell]! + 1}C${COL_OF[cell]! + 1}`;
}

function candLabel(cell: number, digit: number): string {
  return `${cellLabel(cell)}(${digit})`;
}

const MAX_LEN = 16;

function searchNiceLoop(grid: Grid): Step | null {
  const candidates: { cell: number; digit: number }[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (grid.get(c) !== 0) continue;
    for (const d of digitsOf(grid.candidatesOf(c))) {
      candidates.push({ cell: c, digit: d });
    }
  }
  if (candidates.length === 0) return null;

  const adjacency = new Map<number, { to: number; type: LinkType }[]>();
  const toKey = (c: number, d: number) => c * 10 + d;

  for (const a of candidates) {
    const key = toKey(a.cell, a.digit);
    if (!adjacency.has(key)) adjacency.set(key, []);
    const list = adjacency.get(key)!;

    for (const house of HOUSES) {
      if (!house.includes(a.cell)) continue;
      const cands = house.filter((c) => c !== a.cell && grid.get(c) === 0 && grid.hasCandidate(c, a.digit));
      const total = house.filter((c) => grid.get(c) === 0 && grid.hasCandidate(c, a.digit)).length;
      if (total === 2 && cands.length === 1) {
        list.push({ to: toKey(cands[0]!, a.digit), type: 'strong' });
      }
    }

    if (popcount(grid.candidatesOf(a.cell)) === 2) {
      const otherD = digitsOf(grid.candidatesOf(a.cell)).find((d) => d !== a.digit);
      if (otherD !== undefined) {
        list.push({ to: toKey(a.cell, otherD), type: 'strong' });
      }
    }

    for (const peer of PEERS_OF[a.cell]!) {
      if (grid.hasCandidate(peer, a.digit)) {
        list.push({ to: toKey(peer, a.digit), type: 'weak' });
      }
    }
    for (const d of digitsOf(grid.candidatesOf(a.cell))) {
      if (d !== a.digit) {
        list.push({ to: toKey(a.cell, d), type: 'weak' });
      }
    }
  }

  for (const start of candidates) {
    const startKey = toKey(start.cell, start.digit);

    interface DFSState {
      path: number[];
      types: LinkType[];
      visited: Set<number>;
    }

    function checkLoop(state: DFSState): Step | null {
      const { path, types } = state;
      if (path.length < 3) return null;

      const lastKey = path[path.length - 1]!;
      if (lastKey !== startKey) return null;

      const typeCounts: Record<string, number> = { strong: 0, weak: 0 };
      for (const t of types) typeCounts[t] = (typeCounts[t] ?? 0) + 1;

      const allStrong = typeCounts.strong === types.length;
      const allSameDigit = path.every((k) => {
        const cell = Math.floor(k / 10);
        const digit = k % 10;
        return digit === start.digit;
      });

      if (allStrong && allSameDigit && types.length >= 3) {
        const digit = start.digit;
        const cells = [...new Set(path.map((k) => Math.floor(k / 10)))];
        const elimMap = new Map<number, number>();
        for (const c of cells) {
          for (const p of PEERS_OF[c]!) {
            elimMap.set(p, (elimMap.get(p) ?? 0) + 1);
          }
        }
        const eliminations: { cell: number; digit: number }[] = [];
        for (const [c, count] of elimMap) {
          if (count === cells.length && !cells.includes(c) && grid.hasCandidate(c, digit)) {
            eliminations.push({ cell: c, digit });
          }
        }
        if (eliminations.length === 0) return null;

        const links: Link[] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const fromK = path[i]!;
          const toK = path[i + 1]!;
          links.push({
            from: { cell: Math.floor(fromK / 10), digit: fromK % 10 },
            to: { cell: Math.floor(toK / 10), digit: toK % 10 },
            type: types[i]!,
          });
        }
        return {
          strategyId: 'nice-loop',
          placements: [],
          eliminations,
          highlights: { cells: [...cells, ...eliminations.map((e) => e.cell)], candidates: [...cells.map((c) => ({ cell: c, digit })), ...eliminations], links },
          explanation: {
            zh: `连续 Nice 环：数字 ${digit} 形成交替环；消除同时可见所有环上格的其他 ${digit}。`,
            en: `Continuous Nice Loop: digit ${digit} forms an alternating loop; eliminate ${digit} from cells seeing all loop cells.`,
          },
        };
      }

      const discontinuityIndex = findDiscontinuity(types);
      if (discontinuityIndex === -1) return null;

      const discKey = path[discontinuityIndex]!;
      const discCell = Math.floor(discKey / 10);
      const discDigit = discKey % 10;

      const outgoingType = types[discontinuityIndex] ?? types[types.length - 1]!;
      const incomingIdx = discontinuityIndex === 0 ? types.length - 1 : discontinuityIndex - 1;
      const incomingType = types[incomingIdx]!;

      if (outgoingType !== incomingType) return null;

      if (outgoingType === 'strong') {
        return {
          strategyId: 'nice-loop',
          placements: [{ cell: discCell, digit: discDigit }],
          eliminations: [],
          highlights: {
            cells: path.map((k) => Math.floor(k / 10)),
            candidates: [...new Set(path.map((k) => ({ cell: Math.floor(k / 10), digit: k % 10 })))],
            links: buildLinks(path, types),
          },
          explanation: {
            zh: `不连续 Nice 环（Rule 2）：${candLabel(discCell, discDigit)} 两侧均为强链；必须填入 ${discDigit}。`,
            en: `Discontinuous Nice Loop (Rule 2): ${candLabel(discCell, discDigit)} has strong links on both sides; must place ${discDigit}.`,
          },
        };
      }

      if (grid.hasCandidate(discCell, discDigit)) {
        return {
          strategyId: 'nice-loop',
          placements: [],
          eliminations: [{ cell: discCell, digit: discDigit }],
          highlights: {
            cells: path.map((k) => Math.floor(k / 10)),
            candidates: [...new Set(path.map((k) => ({ cell: Math.floor(k / 10), digit: k % 10 })))],
            links: buildLinks(path, types),
          },
          explanation: {
            zh: `不连续 Nice 环（Rule 3）：${candLabel(discCell, discDigit)} 两侧均为弱链；矛盾，消除 ${discDigit}。`,
            en: `Discontinuous Nice Loop (Rule 3): ${candLabel(discCell, discDigit)} has weak links on both sides; contradiction, eliminate ${discDigit}.`,
          },
        };
      }

      return null;
    }

    function findDiscontinuity(types: LinkType[]): number {
      if (types.length < 2) return -1;
      for (let i = 0; i < types.length; i++) {
        const prev = i === 0 ? types[types.length - 1]! : types[i - 1]!;
        const cur = types[i]!;
        if (prev === cur) return i;
      }
      return -1;
    }

    function buildLinks(path: number[], types: LinkType[]): Link[] {
      const links: Link[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const fromK = path[i]!;
        const toK = path[i + 1]!;
        links.push({
          from: { cell: Math.floor(fromK / 10), digit: fromK % 10 },
          to: { cell: Math.floor(toK / 10), digit: toK % 10 },
          type: types[i]!,
        });
      }
      return links;
    }

    function dfs(state: DFSState): Step | null {
      if (state.path.length >= MAX_LEN) return null;

      const lastKey = state.path[state.path.length - 1]!;

      if (state.path.length >= 3) {
        const neighbors = adjacency.get(lastKey) ?? [];
        for (const n of neighbors) {
          if (n.to === startKey) {
            const nextType = state.types.length === 0
              ? 'strong'
              : state.types[state.types.length - 1] === 'strong' ? 'weak' : 'strong';
            if (n.type === nextType) {
              const newState: DFSState = {
                path: [...state.path, n.to],
                types: [...state.types, n.type],
                visited: state.visited,
              };
              const result = checkLoop(newState);
              if (result) return result;
            }
          }
        }
      }

      const cur = state.path[state.path.length - 1]!;
      const neighbors = adjacency.get(cur) ?? [];
      const nextType: LinkType = state.types.length === 0
        ? 'weak'
        : state.types[state.types.length - 1] === 'strong' ? 'weak' : 'strong';

      for (const n of neighbors) {
        if (n.type !== nextType) continue;
        if (state.visited.has(n.to)) continue;

        const newVisited = new Set(state.visited);
        newVisited.add(n.to);

        const result = dfs({
          path: [...state.path, n.to],
          types: [...state.types, n.type],
          visited: newVisited,
        });
        if (result) return result;
      }

      return null;
    }

    const visited = new Set<number>();
    visited.add(startKey);

    const result = dfs({ path: [startKey], types: [], visited });
    if (result) return result;
  }

  return null;
}

export const niceLoop: Strategy = {
  id: 'nice-loop',
  name: { zh: '尼斯环', en: 'Nice Loop' },
  difficulty: 720,
  tieBreak: ['chain-length', 'cell-index'],
  apply(grid: Grid): Step | null {
    return searchNiceLoop(grid);
  },
};