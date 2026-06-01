# Forcing Chain Boundary Rules (FR-8)

This document establishes the architectural and cognitive boundaries for chaining techniques in our Sudoku human-solving engine. It defines what constitutes "human-acceptable logic" versus "disguised enumeration/search" (which acts as backtracking/brute-force under the guise of chains).

## 1. Cognitive Definitions

To maintain the distinction between an interactive teaching solver and a brute-force solver, we classify chaining techniques into three categories:

| Category | Definition | Status in Engine |
|---|---|---|
| **Human-Acceptable Chains** | Alternating paths starting with a single premise, propagating linearly along alternating strong and weak links. No branching, no nested sub-chains, and constrained by a strict length threshold (e.g., max length $\le 12$). Examples: X-Chain, XY-Chain, AIC. | **Enabled by default** |
| **Forcing Chains / Dual Forcing** | Chains that assume a cell has a value (e.g., R1C1 is 1 vs. R1C1 is not 1, or cell bivalues), propagate both branches, and eliminate candidates that are eliminated by *both* branches. While marginally human-scannable, they introduce a single branch. | **Config-controlled** (disabled by default, enabled via `enableForcingChains`) |
| **Forcing Nets & Nishio** | Multi-branch forcing nets (e.g., cell/house forcing nets, Bowman's Bingo, Nishio trial-and-error, pattern/template enumeration). These are disguised recursive backtrack searches that explore a tree of possibilities. They are cognitively impossible for human solvers to track without paper. | **Disabled / Disallowed** (violates human-solving philosophy) |

## 2. Technical Boundary Rules

The engine enforces the following technical boundaries for all chain-based strategies:

1. **No Branching (Linearity)**:
   The search must follow a single path. BFS is used to locate the *shortest* linear alternating path. No strategy may spawn sub-searches or tree-based explorations.
2. **Path Length Threshold**:
   Humans can rarely trace chains longer than 10–12 nodes. The engine exposes `maxChainLength` (default: 12) to limit the search depth.
3. **Soundness Verification**:
   Chaining strategies must be mathematically sound. They must never make eliminations or placements that contradict the unique solution of the puzzle.

## 3. Configuration Contract

The engine exposes these boundaries through the `EngineConfig` interface:

```typescript
export interface EngineConfig {
  /**
   * Toggle uniqueness-based strategies (Unique Rectangle, BUG+1).
   * These assume the puzzle has a unique solution.
   */
  enableUniqueness: boolean;

  /**
   * Toggle forcing chains (e.g., cell forcing, digit forcing).
   * These require tracking two parallel paths of inference.
   */
  enableForcingChains: boolean;

  /**
   * The maximum chain length (number of links) to search for.
   * Restricts AIC and other chaining techniques to keep them human-readable.
   */
  maxChainLength: number;
}
```
