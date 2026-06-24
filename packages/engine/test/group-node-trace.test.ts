/**
 * Roadmap ② gate 7: group nodes are expressible in the trace.
 */
import { describe, expect, it } from 'vitest';
import { Grid } from '../src/grid.js';
import { solve } from '../src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../src/strategies/profiles.js';
import { chainToLinks, type LinkGraph, type Chain } from '../src/chain/graph.js';

describe('gate 7 — chainToLinks expresses group nodes', () => {
  it('a group-node endpoint exposes all its cells via fromCells/toCells', () => {
    const graph: LinkGraph = {
      nodes: [
        { digit: 5, cells: [10, 19], key: '5:10,19' }, // group node (box-line)
        { digit: 5, cells: [28], key: '5:28' }, // single-cell node
      ],
      adjacency: [],
      indexOfKey: new Map(),
    };
    const chain: Chain = [
      { node: 0, incoming: null },
      { node: 1, incoming: 'strong' },
    ];

    const links = chainToLinks(graph, chain);

    expect(links).toHaveLength(1);
    const link = links[0]!;
    // representative cell preserved (backward compatible)
    expect(link.from).toEqual({ cell: 10, digit: 5 });
    expect(link.to).toEqual({ cell: 28, digit: 5 });
    expect(link.type).toBe('strong');
    // group cells exposed for the group endpoint, omitted for the single-cell one
    expect(link.fromCells).toEqual([10, 19]);
    expect(link.toCells).toBeUndefined();
  });

  it('single-cell-only chains carry no group cells', () => {
    const graph: LinkGraph = {
      nodes: [
        { digit: 3, cells: [0], key: '3:0' },
        { digit: 3, cells: [9], key: '3:9' },
      ],
      adjacency: [],
      indexOfKey: new Map(),
    };
    const chain: Chain = [
      { node: 0, incoming: null },
      { node: 1, incoming: 'strong' },
    ];
    const link = chainToLinks(graph, chain)[0]!;
    expect(link.fromCells).toBeUndefined();
    expect(link.toCells).toBeUndefined();
  });
});

describe('gate 7 — end-to-end group links are well-formed when they occur', () => {
  // Not all solves produce grouped chain links; when they do, they must be
  // consistent (multi-cell, single shared digit, includes the representative).
  const PUZZLES = [
    '200900060090000500005100000306200050000030000010008207000007800002000040080004003',
    '000823001003000400070000052300960010000102000010038006830000040002000900600789000',
  ];

  it('any emitted group link has >1 cell sharing the endpoint digit', () => {
    for (const puzzle of PUZZLES) {
      const trace = solve(Grid.fromString(puzzle), HUMAN_DEFAULT_STRATEGIES);
      for (const step of trace.steps) {
        for (const link of step.highlights.links) {
          if (link.fromCells) {
            expect(link.fromCells.length).toBeGreaterThan(1);
            expect(link.fromCells).toContain(link.from.cell);
          }
          if (link.toCells) {
            expect(link.toCells.length).toBeGreaterThan(1);
            expect(link.toCells).toContain(link.to.cell);
          }
        }
      }
    }
  });
});
