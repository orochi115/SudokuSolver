# FR-8: Forcing Chain Boundary Rule

## Purpose
Define the boundary between **human-acceptable logical forcing** and **disguised enumeration** that should be disabled or explicitly tagged. This rule governs the `forcing-chain` strategy (difficulty 100).

## Accepted (Human-Acceptable) Forms

### 1. Bivalue Cell Forcing
From a bivalue cell `{A, B}`, follow naked-single implications for each case:
- If both paths lead to the same placement → place it.
- If both paths lead to the same elimination → eliminate it.

**Rationale**: Only one cell, two branches, single-depth propagation of forced singles. This is traceable and verifiable by a human.

### 2. House Digit Forcing
From all positions of digit D in a house (2-4 cells), follow implications:
- If all positions lead to the same result → accept it.

**Rationale**: Exhaustive within one house, bounded branching.

## Rejected (Disguised Enumeration) Forms

| Technique | Reason for Rejection |
|-----------|---------------------|
| Nishio | Tests one premise against the entire board; indistinguishable from backtracking |
| Forcing Nets (multi-branch, multi-level) | Branching factor exceeds human traceability |
| Template Enumeration | Computes all valid placements; pure search |
| Tabling | Maintains multiple solution states; not logical deduction |
| Random guessing | Not a technique |
| Backtracking search | Computer brute force |

## Engine Configuration

The engine exposes the following configuration interface:

```typescript
interface ForcingConfig {
  /** Maximum depth of naked-single propagation */
  maxDepth: number;  // default: 10
  /** Enable forcing chain strategy */
  enabled: boolean;  // default: true
  /** Maximum number of starting premises for one forcing analysis */
  maxPremises: number;  // default: 2
}
```

## Design Principles

1. **Traceability**: Every forcing chain step must be explainable as: "Cell X = {A,B}. If A → ..., if B → ..., therefore C = D."
2. **Bounded Depth**: Propagation is limited to naked-single deductions only (popcount === 1), never deeper logical chains.
3. **No Recursion**: Forcing chains never call other strategies or chain-like reasoning. Only direct candidate elimination via placement rules.