import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalOrder,
  firstDivergence,
  normalizeAction,
  runnerSource,
  sameAction,
  validateComparisonModels,
  worktreeRootPrefix,
} from './trace-archive-case.mjs';

test('firstDivergence detects same strategy with different eliminations', () => {
  const a = [{ strategyId: 'aic', placements: [], eliminations: [{ cell: 1, digit: 2 }] }];
  const b = [{ strategyId: 'aic', placements: [], eliminations: [{ cell: 1, digit: 3 }] }];
  assert.deepEqual(firstDivergence(a, b), {
    stepIndex: 0,
    kind: 'same-strategy-different-effect',
    leftStrategyId: 'aic',
    rightStrategyId: 'aic',
  });
});

test('normalizeAction sorts placements and eliminations for stable comparison', () => {
  assert.deepEqual(normalizeAction({ placements: [{ cell: 2, digit: 1 }, { cell: 1, digit: 9 }], eliminations: [] }), {
    placements: [{ cell: 1, digit: 9 }, { cell: 2, digit: 1 }],
    eliminations: [],
  });
});

test('sameAction compares sorted placements and eliminations', () => {
  assert.equal(sameAction(
    { placements: [{ cell: 2, digit: 1 }, { cell: 1, digit: 9 }], eliminations: [{ cell: 5, digit: 6 }] },
    { placements: [{ cell: 1, digit: 9 }, { cell: 2, digit: 1 }], eliminations: [{ cell: 5, digit: 6 }] },
  ), true);
  assert.equal(sameAction(
    { placements: [{ cell: 2, digit: 1 }], eliminations: [] },
    { placements: [{ cell: 2, digit: 3 }], eliminations: [] },
  ), false);
});

test('canonicalOrder returns the archive comparison strategy sequence', () => {
  assert.deepEqual(canonicalOrder(), [
    'full-house',
    'naked-single',
    'hidden-single',
    'locked-candidates',
    'naked-subset',
    'hidden-subset',
    'basic-fish',
    'single-digit-patterns',
    'xy-wing',
    'xyz-wing',
    'w-wing',
    'simple-coloring',
    'aic',
    'als',
    'uniqueness',
    'sue-de-coq',
    'forcing-chain',
  ]);
});

test('firstDivergence detects different strategy selection', () => {
  assert.deepEqual(firstDivergence(
    [{ strategyId: 'hidden-single', placements: [{ cell: 1, digit: 2 }], eliminations: [] }],
    [{ strategyId: 'naked-single', placements: [{ cell: 1, digit: 2 }], eliminations: [] }],
  ), {
    stepIndex: 0,
    kind: 'different-strategy-selection',
    leftStrategyId: 'hidden-single',
    rightStrategyId: 'naked-single',
  });
});

test('firstDivergence detects same strategy different final grid', () => {
  assert.deepEqual(firstDivergence(
    [{ strategyId: 'aic', placements: [], eliminations: [], finalGrid: '1'.repeat(81) }],
    [{ strategyId: 'aic', placements: [], eliminations: [], finalGrid: '2'.repeat(81) }],
  ), {
    stepIndex: 0,
    kind: 'same-strategy-different-final-grid',
    leftStrategyId: 'aic',
    rightStrategyId: 'aic',
  });
});

test('firstDivergence detects one stuck after identical prefix', () => {
  assert.deepEqual(firstDivergence(
    [{ strategyId: 'aic', placements: [], eliminations: [], finalGrid: '1'.repeat(81) }],
    [{ strategyId: 'aic', placements: [], eliminations: [], finalGrid: '1'.repeat(81) }, { strategyId: 'als', placements: [], eliminations: [{ cell: 2, digit: 3 }] }],
  ), {
    stepIndex: 1,
    kind: 'one-stuck',
    leftStrategyId: null,
    rightStrategyId: 'als',
  });
});

test('firstDivergence reports identical prefix when neither trace diverges', () => {
  assert.deepEqual(firstDivergence(
    [{ strategyId: 'aic', placements: [], eliminations: [], finalGrid: '1'.repeat(81) }],
    [{ strategyId: 'aic', placements: [], eliminations: [], finalGrid: '1'.repeat(81) }],
  ), {
    stepIndex: 1,
    kind: 'both-stuck-or-solved-identical-prefix',
    leftStrategyId: null,
    rightStrategyId: null,
  });
});

test('validateComparisonModels rejects ambiguous multi-model comparisons', () => {
  assert.throws(
    () => validateComparisonModels(['opus48', 'sonnet46', 'third']),
    /exactly two/,
  );
});

test('worktreeRootPrefix includes process-unique segment for safe mkdtemp roots', () => {
  assert.match(
    worktreeRootPrefix('/tmp/sudoku-trace-wt', '20260602-123456', 12345),
    /\/tmp\/sudoku-trace-wt\/20260602-123456-12345-/,
  );
});

test('runnerSource records required trace step fields', () => {
  const source = runnerSource();
  assert.match(source, /beforeGrid/);
  assert.match(source, /afterGrid/);
  assert.match(source, /explanation/);
});
