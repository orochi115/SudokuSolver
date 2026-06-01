# Forcing-Chain Boundary

This project allows forcing only when it remains a readable logical chain, not a disguised search.

## Allowed By Default

- Single premise: assume one candidate is true or false.
- Linear propagation: each next consequence is forced by a naked single, hidden single, strong link, weak link, or already registered non-branching strategy.
- Bounded depth: propagation must stop at a documented implementation limit.
- Explainable contradiction: the step must name the assumed candidate and the exact contradiction or common consequence.
- Traceable path: `highlights.links` must include the chain segment that justifies the step.

The current `forcing-chain` strategy uses the strictest subset: one true-candidate assumption plus bounded naked-single propagation. If the assumption empties a peer candidate set or duplicates a placed digit, the assumed candidate is eliminated.

## Disabled Or Explicitly Marked

- Multi-branch forcing nets where several assumptions are explored together.
- Nishio-style trial and error that follows a candidate until the puzzle fails without a concise human chain.
- Template enumeration over placements for one digit.
- Backtracking, depth-first search, or choosing among alternatives by solution count.
- Any step that needs the ground-truth solution or brute-force solver output.

These forms may be useful diagnostics, but they are outside the default human-solving engine.

## Engine Boundary

The public strategy contract has no runtime configuration parameter today, so the boundary is exposed by strategy registration order and conservative implementation choices:

- `aic` handles non-branching strong/weak alternating chains first.
- `als`, `uniqueness`, and `sue-de-coq` handle named advanced logical patterns before forcing.
- `forcing-chain` is registered last at difficulty `100` and only performs bounded single-premise propagation.
- Broader forcing nets should be implemented as a separate optional strategy id or behind a future solver configuration flag, not folded into `forcing-chain` silently.

## Human-Acceptable Rule

A forcing step is acceptable when a human can replay it as: "if this one candidate is true, these forced consequences follow, and this local contradiction appears." If the explanation is instead "try possibilities until one survives," it is enumeration and should remain disabled or clearly marked as non-human fallback.
