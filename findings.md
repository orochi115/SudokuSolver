# Findings

## Context
- P2b exact IDs: `subset-exclusion`, `sue-de-coq-extended`, `aic-with-exotic-links`, `twinned-xy-chains`, `franken-fish`, `mutant-fish`, `gurth`.
- P2a exact IDs are already expected to remain registered: `vwxyz-wing`, `exocet`, `sk-loop`, `msls`, `fireworks`, `aligned-pair-exclusion`, `aligned-triple-exclusion`.
- Existing P1/P2a code must be reused where possible, especially aligned exclusion, Sue de Coq, AIC/ALS, fish, and uniqueness owners.
- Hard red line: no oracle/solver APIs and no multi-branch contradiction enumeration in human-default.

## Open Risks
- Exotic techniques may require complex pattern verification; conservative null-returning owner shells are preferable to unsound or search-like eliminations.
- The P2 checklist requires moving members from overlap/boundaries future lists if present; exact existing registry must be inspected before editing.

## P2b Implementation Findings
- `subset-exclusion` is a generalization of APE/ATE; current owner safely reuses the already-tested aligned pair/triple exclusion subcase and retitles it as the owner without adding solver/oracle search.
- `sue-de-coq-extended`, `aic-with-exotic-links`, `twinned-xy-chains`, `franken-fish`, and `mutant-fish` are registered as conservative pure shells until a full non-search matcher is added; this avoids mislabeling ordinary SdC/AIC/XY/fish as exotic variants.
- `gurth` has a bounded human theorem implementation: detect complete clue invariance under diagonal, anti-diagonal, or 180-degree symmetry plus a complete digit permutation, then restrict fixed cells to self-mapped digits.
