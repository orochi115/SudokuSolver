# Forcing Chain Boundary / 强制链边界规则

> FR-8: Define what constitutes "human-acceptable logic" vs "disguised enumeration".

## Core Principle

A forcing chain is **human-acceptable** when:
1. It explores implications from **all exhaustive alternatives** of a **limited, single-premise** choice.
2. The chain alternates strong↔weak links without branching.
3. The conclusion (placement or elimination) follows **necessarily** from the premises, not from search or guessing.

## Acceptable Logical Forms

### 1. Single-Candidate Forcing Chain
All chains starting from **all candidates of one cell** lead to the same result.
- If choosing candidate A in cell X leads to consequence C, and choosing B also leads to C, then C is true regardless.
- This is a **weak forcing chain** — the result is forced by the cell having at least one of those candidates.

### 2. Strong Forcing Chain
A candidate is proven **false** because **every chain from it** leads to a contradiction.
- If assuming A is true forces a contradiction, then A is false.
- This is the Nishio pattern: prove a candidate cannot be true.

### 3. Digit Forcing Chain
All chains from **all locations of one digit in one house** lead to the same result.
- Similar to single-candidate but across a house (row/col/box).

### 4. Contradiction Chain
A chain that proves a candidate must be false by showing it causes inconsistency elsewhere.

## Boundary: What Is NOT Human-Acceptable

The following patterns resemble **enumeration** and should be **disabled or explicitly marked** as computer-assisted:

### ❌ Nishio (Simple)
Trying one candidate at a time and stopping when a contradiction is found is borderline Nishio — acceptable only if it proves the OTHER candidates are true (strong forcing).

### ❌ Forcing Nets (Multi-Branch)
- Multiple independent chains starting from different premises that only **share a conclusion** are not true forcing chains.
- If chain A→B and chain C→D both conclude E, claiming E is true because both A and C lead to it is only valid if A and C are exhaustive alternatives.
- **Net**: a tree of implications from multiple starting points (not a single premise).

### ❌ Nishio with Template / Template Checking
Systematically enumerating all possibilities for a pattern (e.g., all 6 combinations of a UR) to find contradictions is enumeration.

### ❌ Tabling / Subsets
Pre-computing all possibilities for a set of cells and table-lookup to find the solution is brute-force, not human logic.

### ❌ Random Guessing / Backtracking
Any form of trial-and-error without logical necessity.

## Configuration

```typescript
interface ChainConfig {
  /** Allow forcing chains that prove a candidate must be true (weak forcing) */
  allowWeakForcing: boolean;
  /** Allow forcing chains that prove a candidate must be false (strong forcing / Nishio) */
  allowStrongForcing: boolean;
  /** Maximum chain depth for a single path */
  maxChainDepth: number;
  /** Maximum number of simultaneous starting candidates for a forcing chain */
  maxBranchingFactor: number;
}
```

### Recommended Settings for "Human-Only" Mode

```typescript
const HUMAN_BOUNDARY: ChainConfig = {
  allowWeakForcing: true,    // ✅ Cell-based forcing (all-or-nothing from one cell)
  allowStrongForcing: false,  // ❌ Nishio-style elimination (borderline human)
  maxChainDepth: 8,           // ✅ Reasonable for human traceable logic
  maxBranchingFactor: 1,     // ❌ No multi-branch nets
};
```

### Settings for "Extended Human" Mode

```typescript
const EXTENDED_HUMAN: ChainConfig = {
  allowWeakForcing: true,
  allowStrongForcing: true,   // ✅ Nishio acceptable if clearly presented
  maxChainDepth: 12,
  maxBranchingFactor: 2,     // ⚠️ Only for clear two-branch forcing
};
```

## Visual Presentation

When a forcing chain is used, it must be presented as:
1. **Clear premise**: "Assume candidate X in cell Y is true"
2. **Linear chain**: Step-by-step implications with strong/weak link labels
3. **Conclusion**: What is forced or contradicted

If a chain cannot be presented linearly (requires branching), it should be marked as "computer-assisted" or excluded from the human-solvable trace.

## Summary Table

| Technique | Human Acceptable | Reason |
|-----------|-----------------|--------|
| Single-cell forcing (all-or-nothing) | ✅ | Proves result from exhaustive alternatives |
| Digit-in-house forcing | ✅ | Same as above, house-based |
| Contradiction (Nishio) | ⚠️ | Acceptable only if exhaustive |
| Simple Nishio (one candidate) | ❌ | Not exhaustive, just trial |
| Multi-branch forcing net | ❌ | Not a single premise |
| Template enumeration | ❌ | Computer brute-force |
| Backtracking / guessing | ❌ | Not logic-based |

(End of file - total 109 lines)