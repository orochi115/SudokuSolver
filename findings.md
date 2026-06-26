# P2 Findings

- P1 implemented many named techniques as overlap-owned presentation wrappers around existing sound detectors (`p1.ts`). This is the safest local pattern for P2 IDs that are documented as shared detectors or special cases.
- P2 required IDs are missing from `STRATEGIES`, `CANONICAL_STRATEGY_ORDER`, `OVERLAP_FAMILIES`, and chain boundary metadata.
- The current P1 baseline recorded in `progress.md` is human-default 14/727 solved, 0 errors.
- `overlap.ts` has P2 reservations in `bent-wing-oddagon` and `exotic`; chain P2 reservations need moving into `members` when registered.
