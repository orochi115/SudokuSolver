import { verifyDeductions, rc } from './packages/engine/src/worked-example-verify.js';

const puzzle = '080103070000000000001408020570001039000609000920800051030905200000000000010702060';

console.log('test expected:', verifyDeductions(puzzle, {
  eliminations: [
    { cell: rc(1, 3), digit: 5 },
    { cell: rc(3, 7), digit: 5 },
    { cell: rc(3, 9), digit: 5 },
  ],
}));

console.log('research A3 C7 C9:', verifyDeductions(puzzle, {
  eliminations: [
    { cell: rc(3, 1), digit: 5 },
    { cell: rc(7, 3), digit: 5 },
    { cell: rc(9, 3), digit: 5 },
  ],
}));