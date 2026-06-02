import test from 'node:test';
import assert from 'node:assert/strict';
import { modelFailures, selectMutualComparisonCases, selectMutualComparisonFailures } from './analyze-opus-sonnet-cases.mjs';

test('selectMutualComparisonCases finds loser failures solved by winner', () => {
  const cases = selectMutualComparisonCases({
    loserFailures: [1, 2],
    winnerFailures: [2, 3],
  });
  assert.deepEqual(cases, [1]);
});

test('selectMutualComparisonFailures preserves archived puzzle data', () => {
  const failures = selectMutualComparisonFailures({
    loserFailures: [{ index: 2, puzzle: 'puzzle-2' }, { index: 1, puzzle: 'puzzle-1' }],
    winnerFailures: [{ index: 2, puzzle: 'other' }],
  });
  assert.deepEqual(failures, [{ index: 1, puzzle: 'puzzle-1' }]);
});

test('modelFailures throws for missing difficulty data', () => {
  assert.throws(
    () => modelFailures([{ name: 'sonnet46', report: { hard: { failures: [] } } }], 'sonnet46', 'harrd'),
    /missing difficulty/,
  );
});
