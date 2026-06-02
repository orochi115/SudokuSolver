# Forcing Chain Boundary Rules (FR-8)

> Defining what counts as "human-acceptable logic" vs "disguised enumeration"

## Core Principle

Forcing chains explore implications from **exhaustive alternatives** of a **limited premise** and act only on **common outcomes** or **contradictions**. The moment a chain search resembles enumeration or backtracking, it crosses the boundary.

## Accepted Logical Forms

### 1. Single-Candidate Forcing Chain (One-to-Many)
- **Definition**: From all candidates of ONE cell, trace implications; if ALL paths lead to the same result, that result is proven.
- **Why acceptable**: The premise (the cell's value) is truly exhaustive — the cell MUST be one of its candidates.
- **Example**: Cell A has {1,2}. If setting A=1 leads to elimination X, AND setting A=2 also leads to elimination X, then X is proven.

### 2. Single-Digit Forcing Chain (House-Based)
- **Definition**: From all locations of ONE digit in ONE house, trace implications; if ALL paths lead to the same result, that result is proven.
- **Why acceptable**: The premise (which cell in the house gets the digit) is exhaustive.
- **Example**: Digit 5 appears in cells {A,B,C} in row 1. If 5→A leads to X, 5→B leads to X, 5→C leads to X, then X is proven.

### 3. Contradiction Chain (Negation Proof)
- **Definition**: If assuming A=true leads to a contradiction (deadly pattern, solved cell with no candidates), then A is false.
- **Why acceptable**: Proof by contradiction is valid logical reasoning.

## Forbidden Forms (Disguised Enumeration)

### 1. Forcing Nets (Multi-Branch Search)
- **Definition**: Chains that branch in multiple directions and merge results.
- **Why forbidden**: Resembles depth-first search; difficult for humans to verify.
- **Example**: "If A=1 and B=2, then C must be 3" — multiple conditions must be tracked simultaneously.

### 2. Nishio (Template Attempt)
- **Definition**: Try each candidate of a cell and count solutions; if only one works, claim that candidate is true.
- **Why forbidden**: This is enumeration disguised as logic.

### 3. Template Enumeration
- **Definition**: Systematically test patterns across the entire grid to find one that works.
- **Why forbidden**: Not traceable as human reasoning.

### 4. Backtracking with Deduction
- **Definition**: Make a guess, follow implications, backtrack if contradiction found.
- **Why forbidden**: Even with "deduction" at each step, the search pattern is enumerative.

### 5. Cell-Based Multi-Branch (More than all candidates of one cell)
- **Definition**: Exploring more than one independent premise simultaneously.
- **Why forbidden**: Exceeds the "limited premise" constraint.

## Engine Configuration

The engine exposes a `ForcingChainConfig` to control boundary:

```typescript
interface ForcingChainConfig {
  /** Enable forcing chains (contradiction-based) */
  enabled: boolean;
  /** Maximum chain depth before stopping (default: 15) */
  maxDepth: number;
  /** Allow single-digit house-based forcing chains */
  allowHouseForcing: boolean;
  /** Allow contradiction chains */
  allowContradiction: boolean;
  /** FORBIDDEN: allow branching nets */
  allowNets: boolean;
  /** FORBIDDEN: allow Nishio/template enumeration */
  allowNishio: boolean;
}
```

## Human Workflow Guideline

1. **Prefer simpler techniques first** — never escalate to forcing chains if AIC/ALS can solve the puzzle.
2. **Single-premise only** — each forcing chain analysis should focus on ONE cell OR one house's digit placements.
3. **Trace implications cleanly** — each step should follow from the previous by a single logical inference (strong or weak link).
4. **No simultaneous conditions** — if you find yourself thinking "if A AND B...", stop. That's a net.
5. **Depth limit** — chains beyond depth 15 are likely nets in disguise.

## Signs a Chain Has Become Enumeration

- You lose track of all the conditions being assumed simultaneously
- The chain requires writing down intermediate states to remember
- The pattern feels "search-y" rather than "follow-y"
- You couldn't explain the chain in one sentence
- The chain depth exceeds 15

## References

- HODOKU-LAST: Forcing Chains
- SUDOKUWIKI: Logic vs Brute Force
- SOTD: Forcing Chains
