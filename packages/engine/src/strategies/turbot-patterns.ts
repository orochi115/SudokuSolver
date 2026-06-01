import type { Strategy } from '../strategy.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import {
  BOXES,
  COLS,
  DIGITS,
  ROWS,
  candidatesInHouse,
  cellName,
  cellsSeeingBoth,
  isPeer,
  otherHouseTypeOfPeers,
  uniqueCells,
} from './_utils.js';

type LineKind = 'row' | 'col' | 'box';

interface StrongLink {
  digit: number;
  kind: LineKind;
  index: number;
  ends: [number, number];
}

interface TurbotHit {
  digit: number;
  linkA: StrongLink;
  linkB: StrongLink;
  connectA: number;
  connectB: number;
  tailA: number;
  tailB: number;
  eliminations: { cell: number; digit: number }[];
}

function buildStrongLinks(grid: Grid): StrongLink[] {
  const links: StrongLink[] = [];
  for (const digit of DIGITS) {
    for (let i = 0; i < 9; i++) {
      const row = candidatesInHouse(grid, ROWS[i]!, digit);
      if (row.length === 2) links.push({ digit, kind: 'row', index: i, ends: [row[0]!, row[1]!] });

      const col = candidatesInHouse(grid, COLS[i]!, digit);
      if (col.length === 2) links.push({ digit, kind: 'col', index: i, ends: [col[0]!, col[1]!] });

      const box = candidatesInHouse(grid, BOXES[i]!, digit);
      if (box.length === 2) links.push({ digit, kind: 'box', index: i, ends: [box[0]!, box[1]!] });
    }
  }
  return links;
}

type TurbotClassifier = (linkA: StrongLink, linkB: StrongLink, weakType: LineKind | null) => boolean;

function findTurbot(grid: Grid, classifier: TurbotClassifier): TurbotHit | null {
  const links = buildStrongLinks(grid);
  for (const [i, linkA] of links.entries()) {
    for (const linkB of links.slice(i + 1)) {
      if (linkA.digit !== linkB.digit) continue;

      for (const connectA of linkA.ends) {
        for (const connectB of linkB.ends) {
          if (!isPeer(connectA, connectB)) continue;
          const weakType = otherHouseTypeOfPeers(connectA, connectB);
          if (!classifier(linkA, linkB, weakType)) continue;

          const tailA = linkA.ends[0] === connectA ? linkA.ends[1] : linkA.ends[0];
          const tailB = linkB.ends[0] === connectB ? linkB.ends[1] : linkB.ends[0];
          if (tailA === tailB) continue;

          const victims = cellsSeeingBoth(grid, tailA, tailB, linkA.digit).map((cell) => ({
            cell,
            digit: linkA.digit,
          }));
          if (victims.length === 0) continue;

          return {
            digit: linkA.digit,
            linkA,
            linkB,
            connectA,
            connectB,
            tailA,
            tailB,
            eliminations: victims,
          };
        }
      }
    }
  }
  return null;
}

function buildTurbotStep(
  strategy: Strategy,
  hit: TurbotHit,
  labelZh: string,
  labelEn: string,
): Step {
  return {
    strategyId: strategy.id,
    placements: [],
    eliminations: hit.eliminations,
    highlights: {
      cells: uniqueCells([
        ...hit.linkA.ends,
        ...hit.linkB.ends,
        ...hit.eliminations.map((e) => e.cell),
      ]),
      candidates: [
        ...hit.linkA.ends.map((cell) => ({ cell, digit: hit.digit })),
        ...hit.linkB.ends.map((cell) => ({ cell, digit: hit.digit })),
        ...hit.eliminations,
      ],
      links: [
        {
          from: { cell: hit.linkA.ends[0], digit: hit.digit },
          to: { cell: hit.linkA.ends[1], digit: hit.digit },
          type: 'strong',
        },
        {
          from: { cell: hit.connectA, digit: hit.digit },
          to: { cell: hit.connectB, digit: hit.digit },
          type: 'weak',
        },
        {
          from: { cell: hit.linkB.ends[0], digit: hit.digit },
          to: { cell: hit.linkB.ends[1], digit: hit.digit },
          type: 'strong',
        },
      ],
    },
    explanation: {
      zh: `${labelZh}: 数字 ${hit.digit} 形成两条强链接并由一条弱链接连接，故同时看见 ${cellName(hit.tailA)} 与 ${cellName(hit.tailB)} 的格可删去 ${hit.digit}。`,
      en: `${labelEn}: digit ${hit.digit} forms two strong links joined by a weak link, so any cell seeing both ${cellName(hit.tailA)} and ${cellName(hit.tailB)} cannot keep ${hit.digit}.`,
    },
  };
}

export const skyscraper: Strategy = {
  id: 'skyscraper',
  name: { zh: '摩天楼', en: 'Skyscraper' },
  difficulty: 42,
  apply(grid: Grid): Step | null {
    const hit = findTurbot(grid, (a, b, weakType) => {
      if (a.kind !== b.kind) return false;
      if (a.kind === 'row') return weakType === 'col';
      if (a.kind === 'col') return weakType === 'row';
      return false;
    });
    return hit ? buildTurbotStep(this, hit, '摩天楼', 'Skyscraper') : null;
  },
};

export const twoStringKite: Strategy = {
  id: 'two-string-kite',
  name: { zh: '双线风筝', en: '2-String Kite' },
  difficulty: 43,
  apply(grid: Grid): Step | null {
    const hit = findTurbot(grid, (a, b, weakType) => {
      const kinds = [a.kind, b.kind].sort().join('-');
      return weakType === 'box' && kinds === 'col-row';
    });
    return hit ? buildTurbotStep(this, hit, '双线风筝', '2-String Kite') : null;
  },
};

export const emptyRectangle: Strategy = {
  id: 'empty-rectangle',
  name: { zh: '空矩形', en: 'Empty Rectangle' },
  difficulty: 44,
  apply(grid: Grid): Step | null {
    const hit = findTurbot(grid, (a, b, weakType) => {
      if (weakType === null) return false;
      const kinds = [a.kind, b.kind];
      if (!kinds.includes('box')) return false;
      if (!kinds.includes('row') && !kinds.includes('col')) return false;
      return weakType !== 'box';
    });
    return hit ? buildTurbotStep(this, hit, '空矩形', 'Empty Rectangle') : null;
  },
};
