import test from 'node:test';
import assert from 'node:assert/strict';
import {
  candidateSnapshotHash,
  canonicalOrder,
  classifyCase,
  firstDivergence,
  firstDifferentFixedPoint,
  isCompleteValidGrid,
  isSolvedGridValid,
  normalizeAction,
  normalizeCandidateSnapshot,
  runnerSource,
  sameAction,
  summarizeDivergenceProbe,
  validateComparisonModels,
  worktreeRootPrefix,
} from './trace-archive-case.mjs';

test('summarizeDivergenceProbe labels winner-only detection for suspect strategy', () => {
  assert.deepEqual(summarizeDivergenceProbe({
    winnerProbe: { aic: { producedStep: true } },
    loserProbe: { aic: { producedStep: false } },
    suspectStrategyId: 'aic',
  }), {
    suspectStrategyId: 'aic',
    label: 'winner-only-detection',
  });
});

test('summarizeDivergenceProbe labels candidate-state mismatch before strategy comparison', () => {
  assert.equal(summarizeDivergenceProbe({
    candidateHashesMatchAtDivergence: false,
    winnerProbe: { aic: { producedStep: true } },
    loserProbe: { aic: { producedStep: false } },
    suspectStrategyId: 'aic',
  }).label, 'candidate-state-mismatch');
});

test('summarizeDivergenceProbe labels same-strategy different effect', () => {
  assert.equal(summarizeDivergenceProbe({
    candidateHashesMatchAtDivergence: true,
    winnerProbe: { aic: { producedStep: true, placements: [], eliminations: [{ cell: 1, digit: 2 }] } },
    loserProbe: { aic: { producedStep: true, placements: [], eliminations: [{ cell: 1, digit: 3 }] } },
    suspectStrategyId: 'aic',
  }).label, 'same-strategy-different-effect');
});

test('summarizeDivergenceProbe labels inconclusive without suspect winner-only or effect difference', () => {
  assert.equal(summarizeDivergenceProbe({
    candidateHashesMatchAtDivergence: true,
    winnerProbe: { aic: { producedStep: false } },
    loserProbe: { aic: { producedStep: false } },
    suspectStrategyId: 'aic',
  }).label, 'inconclusive');
});

test('classifyCase marks missing detection when winner rescues loser stuck grid', () => {
  assert.equal(classifyCase({ winnerRescueStrategyId: 'aic', firstDivergence: { kind: 'one-stuck' } }), 'missing-detection');
});

test('classifyCase marks early path dependency when rescue is impossible', () => {
  assert.equal(classifyCase({ winnerRescueStrategyId: null, firstDivergence: { kind: 'different-strategy-selection' } }), 'early-path-dependency');
});

test('classifyCase is inconclusive when loser also rescues reconstructed stuck grid', () => {
  assert.equal(classifyCase({
    winnerRescueStrategyId: 'aic',
    loserRescueStrategyId: 'aic',
    firstDivergence: { kind: 'one-stuck' },
  }), 'inconclusive');
});

test('classifyCase is inconclusive when rescue is not applicable', () => {
  assert.equal(classifyCase({
    rescueApplicable: false,
    firstDivergence: { kind: 'both-stuck-or-solved-identical-prefix' },
  }), 'inconclusive');
});

test('isCompleteValidGrid rejects filled grids with duplicate digits', () => {
  assert.equal(isCompleteValidGrid('1'.repeat(81)), false);
});

test('isSolvedGridValid rejects complete grids that change givens', () => {
  const final = '924716538753284961618359742587143296462978153139625487891532674246897315375461829';
  assert.equal(isSolvedGridValid(`1${'0'.repeat(80)}`, final), false);
});

test('runnerSource includes rescue probe fields and limitation', () => {
  const source = runnerSource();
  assert.match(source, /RESCUE_PUZZLE/);
  assert.match(source, /rescueScan/);
  assert.match(source, /rescue probe reconstructs candidates from grid values only; prior candidate eliminations are not preserved/);
});

test('runnerSource includes divergence probe fields and candidate restoration status', () => {
  const source = runnerSource();
  assert.match(source, /PROBE_GRID/);
  assert.match(source, /PROBE_CANDIDATE_SNAPSHOT/);
  assert.match(source, /candidateStateRestored/);
  assert.match(source, /candidateHashAfterIfApplied/);
});

test('firstDifferentFixedPoint finds first strategy whose afterGrid differs', () => {
  const left = [{ strategyId: 'a', afterGrid: 'same' }, { strategyId: 'b', afterGrid: 'left' }];
  const right = [{ strategyId: 'a', afterGrid: 'same' }, { strategyId: 'b', afterGrid: 'right' }];
  assert.deepEqual(firstDifferentFixedPoint(left, right), { strategyId: 'b', index: 1 });
});

test('firstDifferentFixedPoint handles missing fixed-point lists', () => {
  assert.deepEqual(firstDifferentFixedPoint(null, [{ strategyId: 'a', afterGrid: 'grid' }]), { strategyId: 'a', index: 0 });
});

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

test('normalizeCandidateSnapshot sorts cell candidates deterministically', () => {
  assert.deepEqual(normalizeCandidateSnapshot([
    { cell: 2, candidates: [9, 1] },
    { cell: 1, candidates: [3, 2] },
  ]), [
    { cell: 1, candidates: [2, 3] },
    { cell: 2, candidates: [1, 9] },
  ]);
});

test('candidateSnapshotHash is stable for equivalent snapshots', () => {
  assert.equal(
    candidateSnapshotHash([{ cell: 1, candidates: [3, 2] }]),
    candidateSnapshotHash([{ cell: 1, candidates: [2, 3] }]),
  );
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
  assert.match(source, /beforeCandidateSnapshot/);
  assert.match(source, /beforeCandidateHash/);
  assert.match(source, /afterGrid/);
  assert.match(source, /afterCandidateSnapshot/);
  assert.match(source, /afterCandidateHash/);
  assert.match(source, /explanation/);
});

test('runnerSource preserves digit regex escaping for final-grid validation', () => {
  assert.match(runnerSource(), /\/\^\\d\{81\}\$\//);
});

test('runnerSource records required saturation fixed-point fields', () => {
  const source = runnerSource();
  assert.match(source, /saturation/);
  assert.match(source, /beforeCandidateSnapshot/);
  assert.match(source, /beforeCandidateHash/);
  assert.match(source, /afterCandidateSnapshot/);
  assert.match(source, /afterCandidateHash/);
});
