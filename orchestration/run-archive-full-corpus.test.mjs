import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseModels,
  selectHardCandidates,
  parsePuzzlesFromXmlText,
  summarizeRuns,
  markdownReport,
  resolveWorkerCount,
  shouldReportProgress,
} from './run-archive-full-corpus.mjs';

test('parseModels reads provider/model and short names while ignoring comments', () => {
  const models = parseModels(`
    # comment
    openai/gpt-5.5 gpt55
    anthropic/claude-sonnet-4-6        sonnet46
  `);

  assert.deepEqual(models, new Map([
    ['openai/gpt-5.5', 'gpt55'],
    ['anthropic/claude-sonnet-4-6', 'sonnet46'],
  ]));
});

test('selectHardCandidates keeps only PASS/PASS hard 100% rows with zero violations', () => {
  const models = new Map([
    ['openai/gpt-5.5', 'gpt55'],
    ['alibaba-cn/qwen3-coder-plus', 'qwen3coder'],
    ['xai/grok-4.3', 'grok43'],
  ]);
  const report = `
| 模型 | M2 | M3 | strat | medium | hard | diabolical | viol |
|---|---|---|---|---|---|---|---|
| \`openai/gpt-5.5\` | PASS | PASS | 17 | 100% | 100% | 97% | 0 |
| \`alibaba-cn/qwen3-coder-plus\` | FAIL | SKIP | 11 | 100% | 100% | 76% | 1876 |
| \`xai/grok-4.3\` | PASS | PASS | 17 | 67% | 0% | 0% | 0 |
  `;

  assert.deepEqual(selectHardCandidates(report, models), [
    { model: 'openai/gpt-5.5', name: 'gpt55' },
  ]);
});

test('parsePuzzlesFromXmlText extracts all puzzle data strings and honors a limit', () => {
  const xml = `
    <game data="${'1'.repeat(81)}" />
    <game data="${'2'.repeat(81)}" note="x" />
    <game data="${'3'.repeat(81)}" />
  `;

  assert.deepEqual(parsePuzzlesFromXmlText(xml, 2), ['1'.repeat(81), '2'.repeat(81)]);
  assert.deepEqual(parsePuzzlesFromXmlText(xml), ['1'.repeat(81), '2'.repeat(81), '3'.repeat(81)]);
});

test('summarizeRuns totals per difficulty and formats solve rates', () => {
  const summary = summarizeRuns([
    {
      name: 'gpt55',
      model: 'openai/gpt-5.5',
      report: {
        hard: { n: 4, solved: 3, validSolved: 3, stuck: 1, errors: 0, elapsedMs: 1200 },
        easy: { n: 2, solved: 2, validSolved: 2, stuck: 0, errors: 0, elapsedMs: 100 },
      },
    },
  ]);

  assert.equal(summary.rows[0].hard.solveRate, 0.75);
  assert.equal(summary.rows[0].hard.solveRateText, '75.00%');
  assert.equal(summary.rows[0].total.n, 6);
  assert.equal(summary.rows[0].total.solved, 5);
});

test('summarizeRuns ignores failure detail arrays when totaling numeric stats', () => {
  const summary = summarizeRuns([
    {
      name: 'opus48',
      model: 'anthropic/claude-opus-4-8',
      report: {
        hard: {
          n: 2,
          solved: 1,
          validSolved: 1,
          stuck: 1,
          errors: 0,
          elapsedMs: 10,
          failures: [{ index: 2, puzzle: '0'.repeat(81), outcome: 'stuck', final: '0'.repeat(81) }],
        },
      },
    },
  ]);

  assert.equal(summary.rows[0].total.n, 2);
  assert.equal(summary.rows[0].total.stuck, 1);
  assert.equal(summary.rows[0].total.failures, undefined);
});

test('markdownReport points readers to failure details in the JSON results', () => {
  const md = markdownReport(
    [
      {
        name: 'opus48',
        model: 'anthropic/claude-opus-4-8',
        strategies: 17,
        report: {
          hard: {
            n: 2,
            solved: 1,
            validSolved: 1,
            stuck: 1,
            errors: 0,
            elapsedMs: 10,
            failures: [{ index: 2, puzzle: '0'.repeat(81), outcome: 'stuck', final: '0'.repeat(81) }],
          },
        },
      },
    ],
    summarizeRuns([
      {
        name: 'opus48',
        model: 'anthropic/claude-opus-4-8',
        report: {
          hard: {
            n: 2,
            solved: 1,
            validSolved: 1,
            stuck: 1,
            errors: 0,
            elapsedMs: 10,
            failures: [{ index: 2, puzzle: '0'.repeat(81), outcome: 'stuck', final: '0'.repeat(81) }],
          },
        },
      },
    ]),
    { archiveTag: 'final', difficulties: ['hard'], limit: null },
  );

  assert.match(md, /Failures: 1/);
  assert.match(md, /See `results\.json`/);
  assert.doesNotMatch(md, /"puzzle"/);
});

test('resolveWorkerCount defaults to one less than available CPUs and validates overrides', () => {
  assert.equal(resolveWorkerCount(null, 8), 7);
  assert.equal(resolveWorkerCount(null, 1), 1);
  assert.equal(resolveWorkerCount('3', 8), 3);
  assert.throws(() => resolveWorkerCount('0', 8), /--workers must be a positive integer/);
  assert.throws(() => resolveWorkerCount('abc', 8), /--workers must be a positive integer/);
});

test('shouldReportProgress reports on count threshold or elapsed interval', () => {
  assert.equal(shouldReportProgress({ processed: 9999, nextProgress: 10000, nowMs: 1000, lastReportMs: 0, intervalMs: 5000 }), false);
  assert.equal(shouldReportProgress({ processed: 10000, nextProgress: 10000, nowMs: 1000, lastReportMs: 900, intervalMs: 5000 }), true);
  assert.equal(shouldReportProgress({ processed: 5000, nextProgress: 10000, nowMs: 6000, lastReportMs: 900, intervalMs: 5000 }), true);
});
