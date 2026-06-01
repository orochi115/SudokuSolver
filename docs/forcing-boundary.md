# Forcing-Chain Boundary Rules (FR-8)

## Purpose

Define the boundary between "human-acceptable logic" and "disguised enumeration" in the Sudoku tutorial engine's forcing-chain strategy.

## Human-Acceptable Logic

The following chain patterns are considered human-acceptable and are enabled by default:

- **X-Chain**: Single-digit alternating inference chains of length ≤ 8 nodes (4 strong links + 3 weak links)
- **XY-Chain**: Multi-digit chains through bivalue cells, length ≤ 6 cells
- **Simple Coloring**: Single-digit conjugate-pair graph analysis (trap/wrap)
- **ALS Chains**: Almost Locked Set chains with clear RCC (restricted common candidate) links

## Disguised Enumeration (Disabled)

The following are considered beyond human-acceptable logic and are **disabled** by default:

- **Nets / Branching**: Multiple simultaneous assumptions (forcing nets)
- **Nishio / Template Enumeration**: Trial-and-error with candidate templates
- **Unbounded Depth**: Chains longer than the thresholds above
- **Multi-Direction Nets**: Simultaneous exploration of multiple branches

## Configuration

The `forcing-chain` strategy respects the following configurable limits:

- `MAX_DEPTH`: Maximum chain depth (default: 6)
- `ALLOW_BRANCHING`: Whether to allow branching nets (default: false)

## Rationale

Human solvers can typically follow chains up to 6-8 nodes without losing track. Beyond that, the logic becomes indistinguishable from trial-and-error. The engine exposes these limits so that:

1. Easy/hard modes can adjust the depth
2. The tutorial can explain why longer chains are "too complex"
3. Soundness is maintained by avoiding unconstrained search

## Enforcement

The engine's `forcing-chain` strategy implements only single-path depth-limited chains. Branching is explicitly rejected by the implementation.
