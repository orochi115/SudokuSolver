/**
 * Step-granularity exceptions (Roadmap ② gate 5 — anti-drift).
 *
 * Default contract: one trace `Step` = one concrete pattern instance (see
 * Strategy.apply in src/strategy.ts). A strategy that intentionally merges
 * multiple instances or sub-techniques into a single Step is a DEFERRED
 * EXCEPTION and must be listed here with a justification. New strategies must
 * NOT add cross-instance / cross-sub-technique merging.
 *
 * test/strategy-precedence.test.ts asserts that no registered strategy id merges
 * unless it appears in `GRANULARITY_EXCEPTIONS`.
 */

export interface GranularityException {
  readonly strategyId: string;
  readonly reason: string;
}

/**
 * Currently empty: all registered strategies emit one Step per concrete pattern
 * instance. Add an entry here (with reason) only when a deliberate merge is
 * accepted and reviewed.
 */
export const GRANULARITY_EXCEPTIONS: readonly GranularityException[] = [];

export const GRANULARITY_EXCEPTION_IDS: ReadonlySet<string> = new Set(
  GRANULARITY_EXCEPTIONS.map((e) => e.strategyId),
);
