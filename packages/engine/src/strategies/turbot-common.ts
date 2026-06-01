import { BOXES, COLS, ROWS } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Link, Step } from '../trace.js';
import { peersIntersection, sees, uniqueCells, uniqueEliminations } from './common.js';

export type StrongHouseType = 'row' | 'col' | 'box';

export interface StrongLinkEdge {
  readonly digit: number;
  readonly a: number;
  readonly b: number;
  readonly houseType: StrongHouseType;
  readonly houseIndex: number;
}

export interface TurbotHit {
  readonly digit: number;
  readonly endpointA: number;
  readonly endpointD: number;
  readonly bridgeB: number;
  readonly bridgeC: number;
  readonly link1: StrongLinkEdge;
  readonly link2: StrongLinkEdge;
  readonly eliminations: readonly number[];
}

export type LinkPairFilter = (l1: StrongLinkEdge, l2: StrongLinkEdge) => boolean;

function collectStrongLinks(grid: Grid, digit: number): StrongLinkEdge[] {
  const out: StrongLinkEdge[] = [];

  for (let row = 0; row < 9; row++) {
    const cells = ROWS[row]!.filter((cell) => grid.hasCandidate(cell, digit));
    if (cells.length === 2) out.push({ digit, a: cells[0]!, b: cells[1]!, houseType: 'row', houseIndex: row });
  }
  for (let col = 0; col < 9; col++) {
    const cells = COLS[col]!.filter((cell) => grid.hasCandidate(cell, digit));
    if (cells.length === 2) out.push({ digit, a: cells[0]!, b: cells[1]!, houseType: 'col', houseIndex: col });
  }
  for (let box = 0; box < 9; box++) {
    const cells = BOXES[box]!.filter((cell) => grid.hasCandidate(cell, digit));
    if (cells.length === 2) out.push({ digit, a: cells[0]!, b: cells[1]!, houseType: 'box', houseIndex: box });
  }

  return out;
}

export function findTurbotLike(grid: Grid, filter: LinkPairFilter): TurbotHit | null {
  for (let digit = 1; digit <= 9; digit++) {
    const links = collectStrongLinks(grid, digit);
    for (let i = 0; i < links.length; i++) {
      for (let j = i + 1; j < links.length; j++) {
        const link1 = links[i]!;
        const link2 = links[j]!;
        if (!filter(link1, link2)) continue;

        const endpoints1: [number, number][] = [
          [link1.a, link1.b],
          [link1.b, link1.a],
        ];
        const endpoints2: [number, number][] = [
          [link2.a, link2.b],
          [link2.b, link2.a],
        ];

        for (const [endpointA, bridgeB] of endpoints1) {
          for (const [bridgeC, endpointD] of endpoints2) {
            if (bridgeB === bridgeC) continue;
            if (!sees(bridgeB, bridgeC)) continue; // weak link
            if (endpointA === endpointD) continue;

            const eliminations = peersIntersection(endpointA, endpointD).filter((cell) => grid.hasCandidate(cell, digit));
            if (eliminations.length === 0) continue;

            return {
              digit,
              endpointA,
              endpointD,
              bridgeB,
              bridgeC,
              link1,
              link2,
              eliminations,
            };
          }
        }
      }
    }
  }
  return null;
}

export function turbotStep(
  strategyId: string,
  hit: TurbotHit,
  zhName: string,
  enName: string,
): Step {
  const eliminations = uniqueEliminations(hit.eliminations.map((cell) => ({ cell, digit: hit.digit })));
  const chainLinks: Link[] = [
    {
      from: { cell: hit.endpointA, digit: hit.digit },
      to: { cell: hit.bridgeB, digit: hit.digit },
      type: 'strong',
    },
    {
      from: { cell: hit.bridgeB, digit: hit.digit },
      to: { cell: hit.bridgeC, digit: hit.digit },
      type: 'weak',
    },
    {
      from: { cell: hit.bridgeC, digit: hit.digit },
      to: { cell: hit.endpointD, digit: hit.digit },
      type: 'strong',
    },
  ];

  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: {
      cells: uniqueCells([
        hit.endpointA,
        hit.bridgeB,
        hit.bridgeC,
        hit.endpointD,
        ...eliminations.map((e) => e.cell),
      ]),
      candidates: [
        { cell: hit.endpointA, digit: hit.digit },
        { cell: hit.bridgeB, digit: hit.digit },
        { cell: hit.bridgeC, digit: hit.digit },
        { cell: hit.endpointD, digit: hit.digit },
        ...eliminations,
      ],
      links: chainLinks,
    },
    explanation: {
      zh: `${zhName}：数字 ${hit.digit} 形成“强-弱-强”单数字链，因此可删除同时看见两端点的 ${hit.digit} 候选。`,
      en: `${enName}: digit ${hit.digit} forms a strong-weak-strong single-digit chain, so candidates seeing both endpoints are eliminated.`,
    },
  };
}
