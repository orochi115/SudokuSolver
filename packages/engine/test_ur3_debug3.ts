import { Grid } from './src/grid.js';
import { solveBruteforce } from './src/bruteforce.js';
import { solve } from './src/solver.js';
import { STRATEGIES } from './src/strategies/index.js';
import { 
  CELLS, ROWS, COLS, BOXES, HOUSES, 
  ROW_OF, COL_OF, BOX_OF, 
  PEERS_OF, maskOf, popcount, digitsOf 
} from './src/grid.js';

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

const puzzle = '150040076027000450090000010300107005002604300500090007000000000008060100000782000';
const sol = solveBruteforce(puzzle)!;

// Apply first 16 steps
const g0 = Grid.fromString(puzzle);
const strategiesNoUR3 = STRATEGIES.filter(s => s.id !== 'unique-rectangle-type-3');
const trace = solve(g0, strategiesNoUR3);

const g = Grid.fromString(puzzle);
for (let i = 0; i < 16; i++) {
  const step = trace.steps[i]!;
  for (const p of step.placements) g.place(p.cell, p.digit);
  for (const e of step.eliminations) g.eliminate(e.cell, e.digit);
}

// The rectangle is [12, 14, 48, 50], roof is [12, 14]
const roofCells = [12, 14];
const cells = [12, 14, 48, 50];
const masks = cells.map(c => g.get(c) === 0 ? g.candidatesOf(c) : 0);
const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
const extra0 = masks[0]! & ~intersect;
const extra1 = masks[1]! & ~intersect;
const pseudoMask = extra0 | extra1;

console.log('Cells:', cells.map((c, i) => `c${c}(${g.get(c) === 0 ? digitsOf(masks[i]!).join(',') : 'SOLVED:'+g.get(c)})`));
console.log('Intersect:', digitsOf(intersect));
console.log('pseudoMask:', digitsOf(pseudoMask), 'count:', popcount(pseudoMask));

// House 1 = row 1
const house1 = HOUSES[1]!;
console.log('House 1 cells:', house1.map(c => `c${c}(${g.get(c) === 0 ? digitsOf(g.candidatesOf(c)).join(',') : 'solved:'+g.get(c)})`));

// Find outside cells
const outsideCells = house1.filter(c => !cells.includes(c) && g.get(c) === 0 && g.candidatesOf(c) !== 0);
console.log('Outside cells:', outsideCells);

// k=1: try combining pseudoMask with one outside cell
for (const oc of outsideCells) {
  let unionMask = pseudoMask;
  unionMask |= g.candidatesOf(oc);
  const unionCount = popcount(unionMask);
  const targetSubsetSize = popcount(pseudoMask) + 1; // k=1
  console.log(`Outside cell ${oc} cands=${digitsOf(g.candidatesOf(oc)).join(',')} union=${digitsOf(unionMask).join(',')} count=${unionCount} target=${targetSubsetSize} match=${unionCount === targetSubsetSize}`);
  if (unionCount === targetSubsetSize) {
    console.log('Would eliminate from house cells!');
    const subsetCells = new Set([...roofCells, oc]);
    for (const houseCell of house1) {
      if (subsetCells.has(houseCell)) continue;
      if (g.get(houseCell) !== 0) continue;
      for (const d of digitsOf(unionMask)) {
        if (g.hasCandidate(houseCell, d)) {
          const expected = parseInt(sol[houseCell]!);
          console.log(`  Would elim: cell ${houseCell} digit ${d} expected=${expected} BAD=${expected === d}`);
        }
      }
    }
  }
}
