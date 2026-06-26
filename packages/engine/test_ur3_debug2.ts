import { Grid } from './src/grid.js';
import { solveBruteforce } from './src/bruteforce.js';
import { solve } from './src/solver.js';
import { STRATEGIES } from './src/strategies/index.js';
import { 
  CELLS, ROWS, COLS, BOXES, HOUSES, 
  ROW_OF, COL_OF, BOX_OF, 
  PEERS_OF, maskOf, popcount, digitsOf 
} from './src/grid.js';

function* allRectangles(): Generator<[number, number, number, number]> {
  for (let r1 = 0; r1 < 8; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 8; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const cell11 = r1 * 9 + c1;
          const cell12 = r1 * 9 + c2;
          const cell21 = r2 * 9 + c1;
          const cell22 = r2 * 9 + c2;
          const boxes = new Set([BOX_OF[cell11]!, BOX_OF[cell12]!, BOX_OF[cell21]!, BOX_OF[cell22]!]);
          if (boxes.size !== 2) continue;
          yield [cell11, cell12, cell21, cell22];
        }
      }
    }
  }
}

function getCommonHouses(c1: number, c2: number): number[] {
  const units1 = new Set([ROW_OF[c1]!, 9 + COL_OF[c1]!, 18 + BOX_OF[c1]!]);
  return [ROW_OF[c2]!, 9 + COL_OF[c2]!, 18 + BOX_OF[c2]!].filter((h) => units1.has(h));
}

const puzzle = '150040076027000450090000010300107005002604300500090007000000000008060100000782000';

// Apply 16 steps first to get the right grid state
const g0 = Grid.fromString(puzzle);
const strategiesNoUR3 = STRATEGIES.filter(s => s.id !== 'unique-rectangle-type-3');
const trace = solve(g0, strategiesNoUR3);
console.log('Steps without UR3:', trace.steps.length);

// Now apply all those steps to get the grid state at step 16
const g = Grid.fromString(puzzle);
let stepCount = 0;
for (const step of trace.steps) {
  if (stepCount >= 16) break;
  for (const p of step.placements) g.place(p.cell, p.digit);
  for (const e of step.eliminations) g.eliminate(e.cell, e.digit);
  stepCount++;
}
console.log('Grid at step 16');

// Now manually search for the UR Type-3 that fires (bad)
for (const [c11, c12, c21, c22] of allRectangles()) {
  const cells = [c11, c12, c21, c22];
  const masks = cells.map((c) => (g.get(c) === 0 ? g.candidatesOf(c) : 0));
  
  const intersect = masks[0]! & masks[1]! & masks[2]! & masks[3]!;
  if (popcount(intersect) !== 2) continue;
  if (masks.some((m, i) => m !== 0 && (m & intersect) !== intersect)) continue;
  
  const roofCells = cells.filter((_, i) => masks[i] !== intersect && masks[i] !== 0);
  const floorCells = cells.filter((_, i) => masks[i] === intersect);
  
  if (roofCells.length !== 2) continue;
  
  const sharedHouses = getCommonHouses(roofCells[0]!, roofCells[1]!);
  if (sharedHouses.length === 0) continue;
  
  const roofIdx0 = cells.indexOf(roofCells[0]!);
  const roofIdx1 = cells.indexOf(roofCells[1]!);
  const extra0 = masks[roofIdx0]! & ~intersect;
  const extra1 = masks[roofIdx1]! & ~intersect;
  const pseudoMask = extra0 | extra1;
  const pseudoCount = popcount(pseudoMask);
  
  // Check if cell 13 could be eliminated here
  const has13 = cells.includes(13) || roofCells.includes(13) ||
    sharedHouses.some(h => HOUSES[h]!.includes(13));
  
  if (!has13) continue;
  
  for (const houseIdx of sharedHouses) {
    const house = HOUSES[houseIdx]!;
    if (!house.includes(13)) continue;
    
    console.log('UR rectangle:', cells, 'roof:', roofCells, 'pseudo:', digitsOf(pseudoMask));
    console.log('house:', houseIdx, 'outsideCells count:', house.filter(c => !cells.includes(c) && g.get(c) === 0).length);
    console.log('pseudoCount:', pseudoCount);
    
    const outsideCells = house.filter(c => !cells.includes(c) && g.get(c) === 0 && g.candidatesOf(c) !== 0);
    for (let k = 0; k <= Math.min(2, outsideCells.length); k++) {
      const targetSubsetSize = pseudoCount + k;
      console.log(`k=${k}, targetSubsetSize=${targetSubsetSize}`);
    }
  }
}
