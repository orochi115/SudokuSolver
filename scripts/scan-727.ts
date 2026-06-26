import { readFileSync } from 'node:fs';
import { Grid } from '../packages/engine/src/grid.js';
import { solve } from '../packages/engine/src/solver.js';
import { HUMAN_DEFAULT_STRATEGIES } from '../packages/engine/src/strategies/profiles.js';

function validSolved(initial: string, final: string): boolean {
  if (!/^\d{81}$/.test(final) || final.includes('0')) return false;
  for (let i = 0; i < 81; i++) if (initial[i] !== '0' && initial[i] !== final[i]) return false;
  const houses: number[][] = [];
  for (let r = 0; r < 9; r++) houses.push([...Array(9)].map((_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) houses.push([...Array(9)].map((_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const cells: number[] = [];
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) cells.push((br * 3 + dr) * 9 + bc * 3 + dc);
    houses.push(cells);
  }
  for (const house of houses) {
    const seen = new Set(house.map((i) => final[i]));
    if (seen.size !== 9 || seen.has('0')) return false;
  }
  return true;
}

const lines = readFileSync('data/failing-diabolical/puzzles.txt', 'utf8').split(/\r?\n/).filter((l) => l.length === 81);
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? lines.length);
let solved = 0, valid = 0, stuck = 0, errors = 0;
for (let i = start; i < end; i++) {
  try {
    const trace = solve(Grid.fromString(lines[i]!), HUMAN_DEFAULT_STRATEGIES);
    if (trace.outcome === 'solved') {
      solved++;
      if (validSolved(lines[i]!, trace.final)) valid++;
    } else stuck++;
  } catch { errors++; }
}
console.log(`${start}-${end}: solved=${solved} valid=${valid} stuck=${stuck} errors=${errors}`);
