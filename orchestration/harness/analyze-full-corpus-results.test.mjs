import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFailureIndex, compareFailureOverlap } from './analyze-full-corpus-results.mjs';

test('compareFailureOverlap identifies loser failures solved by winner', () => {
  const results = [
    { name: 'opus48', report: { hard: { failures: [{ index: 1 }, { index: 3 }] } } },
    { name: 'sonnet46', report: { hard: { failures: [{ index: 2 }, { index: 3 }] } } },
  ];
  const index = buildFailureIndex(results, 'hard');
  assert.deepEqual(compareFailureOverlap(index, 'sonnet46', 'opus48'), {
    loser: 'sonnet46',
    winner: 'opus48',
    loserFailures: 2,
    bothFailed: [3],
    winnerSolvedLoserFailed: [2],
  });
});
