import { describe, it, expect } from 'vitest';
import {
  Grid,
  HOUSES,
  PEERS_OF,
  UNITS_OF,
  ROW_OF,
  COL_OF,
  BOX_OF,
  popcount,
  digitsOf,
  maskOf,
  ALL_CANDIDATES,
} from '../src/grid.js';

const PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';

describe('topology', () => {
  it('has 27 houses of 9 cells each', () => {
    expect(HOUSES.length).toBe(27);
    for (const h of HOUSES) expect(h.length).toBe(9);
  });

  it('gives every cell exactly 20 peers', () => {
    expect(PEERS_OF.length).toBe(81);
    for (const peers of PEERS_OF) expect(peers.length).toBe(20);
  });

  it('peers exclude the cell itself and cover its row/col/box', () => {
    const cell = 40; // R5C5
    const peers = new Set(PEERS_OF[cell]!);
    expect(peers.has(cell)).toBe(false);
    for (const h of UNITS_OF[cell]!) {
      for (const c of HOUSES[h]!) if (c !== cell) expect(peers.has(c)).toBe(true);
    }
  });

  it('computes row/col/box indices correctly', () => {
    expect(ROW_OF[10]).toBe(1);
    expect(COL_OF[10]).toBe(1);
    expect(BOX_OF[0]).toBe(0);
    expect(BOX_OF[80]).toBe(8);
    expect(BOX_OF[30]).toBe(4); // R4C4
  });
});

describe('bitmask helpers', () => {
  it('popcount and digitsOf agree', () => {
    expect(popcount(ALL_CANDIDATES)).toBe(9);
    expect(digitsOf(ALL_CANDIDATES)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const m = maskOf(3) | maskOf(7);
    expect(popcount(m)).toBe(2);
    expect(digitsOf(m)).toEqual([3, 7]);
  });
});

describe('Grid', () => {
  it('round-trips string <-> grid', () => {
    const g = Grid.fromString(PUZZLE);
    expect(g.toString()).toBe(PUZZLE);
  });

  it('rejects wrong-length strings', () => {
    expect(() => Grid.fromString('123')).toThrow();
  });

  it('derives candidates excluding peer digits', () => {
    const g = Grid.fromString(PUZZLE);
    // R1C3 (cell 2) is empty; its row has 5,3,7, etc. It should not allow those.
    const cell = 2;
    expect(g.get(cell)).toBe(0);
    expect(g.hasCandidate(cell, 5)).toBe(false);
    expect(g.hasCandidate(cell, 3)).toBe(false);
    expect(g.hasCandidate(cell, 7)).toBe(false);
  });

  it('place removes the digit from peers', () => {
    const g = Grid.fromString(PUZZLE);
    const cell = 2;
    g.place(cell, 4);
    expect(g.get(cell)).toBe(4);
    expect(g.candidatesOf(cell)).toBe(0);
    for (const p of PEERS_OF[cell]!) {
      if (g.get(p) === 0) expect(g.hasCandidate(p, 4)).toBe(false);
    }
  });

  it('detects solved / valid / contradiction', () => {
    const solved = Grid.fromString(
      '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
    );
    expect(solved.isSolved()).toBe(true);
    expect(solved.isValid()).toBe(true);

    const broken = Grid.fromString(PUZZLE);
    broken.place(0, 5); // R1C1 already 5 in givens region — force a clash
    broken.values[1] = 5; // duplicate 5 in row 1 directly
    expect(broken.isValid()).toBe(false);
  });

  it('clone is independent', () => {
    const g = Grid.fromString(PUZZLE);
    const c = g.clone();
    c.place(2, 4);
    expect(g.get(2)).toBe(0);
  });

  it('tracks givens from fromString and preserves them across place()', () => {
    const g = Grid.fromString(PUZZLE);
    expect(g.isGiven(0)).toBe(true);
    expect(g.isGiven(2)).toBe(false);
    g.place(2, 4);
    expect(g.isGiven(2)).toBe(false);
    expect(g.get(2)).toBe(4);
    const c = g.clone();
    expect(c.isGiven(0)).toBe(true);
    expect(c.isGiven(2)).toBe(false);
  });
});
