import { Grid } from './packages/engine/src/grid.js';
import { solve } from './packages/engine/src/solver.js';
import { STRATEGIES } from './packages/engine/src/strategies/index.js';
import { ROW_OF, COL_OF, digitsOf, PEERS_OF } from './packages/engine/src/grid.js';
import { allRectangles } from './packages/engine/src/uniqueness/ur-engine.js';

const puzzle = '000003106500000000030100780002009807070020030805600400059008070000000005703200000';

// Replay to step 11
let g = Grid.fromString(puzzle);
const trace = solve(g, STRATEGIES);
// Re-solve step by step to get grid state at step 11
g = Grid.fromString(puzzle);
for (let i = 0; i < 11; i++) {
  const step = trace.steps[i]!;
  for (const p of step.placements) g.place(p.cell, p.digit);
  for (const e of step.eliminations) g.eliminate(e.cell, e.digit);
}

function rc(r: number, c: number) { return (r-1)*9 + (c-1); }
function showCell(c: number) {
  const v = g.get(c);
  const cands = digitsOf(g.candidatesOf(c));
  return `R${ROW_OF[c]!+1}C${COL_OF[c]!+1}=${v||'{'+cands.join(',')+'}'}`;
}

console.log('Grid at step 11:');
for (let r = 1; r <= 9; r++) {
  let row = '';
  for (let c = 1; c <= 9; c++) {
    const cell = rc(r,c);
    const v = g.get(cell);
    row += v || '.';
    if (c === 3 || c === 6) row += '|';
  }
  if (r === 3 || r === 6) console.log('------+------+------');
  console.log(row);
}

// Check rectangles involving R3C5 (22) and R9C6 (77)
const targets = [22, 77];
for (const rect of allRectangles()) {
  if (!rect.some(c => targets.includes(c))) continue;
  const intersect = rect.map(c => g.get(c)===0 ? g.candidatesOf(c) : 0).reduce((a,b) => a&b);
  if (digitsOf(intersect).length !== 2) continue;
  const [x,y] = digitsOf(intersect);
  console.log('\nRect', rect.map(c => showCell(c)).join(' '));
  console.log('  UR pair', x, y);
  for (const c of rect) {
    const extra = g.candidatesOf(c) & ~intersect;
    console.log('  ', showCell(c), 'extra:', digitsOf(extra));
  }
  // Check digit 5 x-wing
  const bit = 1 << 4; // digit 5
  const rows = new Set([ROW_OF[rect[0]!]!, ROW_OF[rect[1]!]!]);
  const cols = new Set([COL_OF[rect[0]!]!, COL_OF[rect[2]!]!]);
  let ok = true;
  for (const r of rows) {
    for (let c = 0; c < 9; c++) {
      const cell = r*9+c;
      if (g.get(cell)===0 && (g.candidatesOf(cell)&bit) && !rect.includes(cell)) {
        console.log('  5 outside rect in row', r+1, ':', showCell(cell));
        ok = false;
      }
    }
  }
  for (const col of cols) {
    for (let r = 0; r < 9; r++) {
      const cell = r*9+col;
      if (g.get(cell)===0 && (g.candidatesOf(cell)&bit) && !rect.includes(cell)) {
        console.log('  5 outside rect in col', col+1, ':', showCell(cell));
        ok = false;
      }
    }
  }
  console.log('  X-Wing on 5:', ok);
}