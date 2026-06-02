import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWinnerCasePairs,
  modelFailures,
  selectFailuresSolvedByAnyWinner,
  selectMutualComparisonCases,
  selectMutualComparisonFailures,
} from './analyze-opus-sonnet-cases.mjs';

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

test('selectFailuresSolvedByAnyWinner finds loser failures solved by at least one winner', () => {
  const loserFailures = [{ index: 1, puzzle: 'p1' }, { index: 2, puzzle: 'p2' }, { index: 3, puzzle: 'p3' }];
  const winnerFailuresByName = new Map([
    ['opus48', [{ index: 2 }]],
    ['gpt55', [{ index: 3 }]],
  ]);

  assert.deepEqual(selectFailuresSolvedByAnyWinner({ loserFailures, winnerFailuresByName }), [
    { index: 1, puzzle: 'p1', solvedBy: ['opus48', 'gpt55'] },
    { index: 2, puzzle: 'p2', solvedBy: ['gpt55'] },
    { index: 3, puzzle: 'p3', solvedBy: ['opus48'] },
  ]);
});

test('buildWinnerCasePairs keeps one pair per winner that solved a case', () => {
  const cases = [{ index: 10, puzzle: 'p10', solvedBy: ['opus48', 'gemini35flash'] }];
  assert.deepEqual(buildWinnerCasePairs({ cases, loser: 'analysis-sonnet46-strategy-fix' }), [
    { winner: 'opus48', loser: 'analysis-sonnet46-strategy-fix', index: 10, puzzle: 'p10' },
    { winner: 'gemini35flash', loser: 'analysis-sonnet46-strategy-fix', index: 10, puzzle: 'p10' },
  ]);
});
