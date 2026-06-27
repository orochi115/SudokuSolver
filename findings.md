# Findings

## Context
- P2a exact IDs: `vwxyz-wing`, `exocet`, `sk-loop`, `msls`, `fireworks`, `aligned-pair-exclusion`, `aligned-triple-exclusion`.
- Existing P1 added `packages/engine/src/strategies/p1-advanced.ts` with conservative aliases/shells for several advanced IDs.
- Hard red line: no oracle/solver APIs and no multi-branch contradiction enumeration in human-default.

## Open Risks
- Exotic techniques may require complex pattern verification; conservative null-returning owner shells are preferable to unsound or search-like eliminations.
- The P2 checklist requires moving members from overlap/boundaries future lists if present; exact existing registry must be inspected before editing.
