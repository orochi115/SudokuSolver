import test from 'node:test';
import assert from 'node:assert/strict';
import { selectMutualComparisonCases } from './analyze-opus-sonnet-cases.mjs';

test('selectMutualComparisonCases finds loser failures solved by winner', () => {
  const cases = selectMutualComparisonCases({
    loserFailures: [1, 2],
    winnerFailures: [2, 3],
  });
  assert.deepEqual(cases, [1]);
});
