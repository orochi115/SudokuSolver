# Human Solving Flow

This flow is derived from `packages/engine/src/strategies/index.ts`. The solver tries strategies in ascending difficulty and restarts from the beginning after every successful step.

## Strategy Order

1. `full-house` (`10`): place the last missing digit in a completed house.
2. `naked-single` (`10`): place a cell with one remaining candidate.
3. `hidden-single` (`15`): place a digit that appears once in a house.
4. `locked-candidates` (`20`): apply pointing and claiming eliminations.
5. `naked-subset` (`30`): remove naked pair/triple/quad digits from the rest of a house.
6. `hidden-subset` (`35`): remove extra digits from hidden pair/triple/quad cells.
7. `basic-fish` (`40`): X-Wing, Swordfish, and Jellyfish as base/cover fish.
8. `single-digit-patterns` (`45`): short single-digit chains such as Skyscraper, 2-String Kite, Turbot, and Empty Rectangle.
9. `xy-wing` (`50`): bivalue pivot with two pincers.
10. `xyz-wing` (`55`): trivalue pivot with two bivalue pincers.
11. `w-wing` (`55`): two equal bivalue cells bridged by a strong link.
12. `simple-coloring` (`60`): conjugate graph coloring with trap and wrap eliminations.
13. `aic` (`70`): candidate-node strong/weak alternating chains.
14. `als` (`80`): ALS-XZ style eliminations using restricted common candidates.
15. `uniqueness` (`90`): Unique Rectangle Type 1 and BUG+1, relying on unique-solution assumption.
16. `sue-de-coq` (`95`): row/box intersection locking pattern.
17. `forcing-chain` (`100`): bounded single-premise forcing, last resort only.

## Representative Worked Traces

Simple Coloring wrap:
Cells `R1C1`, `R1C2`, `R2C1`, and `R2C2` form a conjugate graph for digit `5`. When two same-colored candidates see each other, that color cannot be true, so the strategy removes `5` from those color cells. The trace stores every conjugate edge as a strong `Link`.

AIC same-digit endpoints:
The test chain `R1C1(1)-R1C1(2)-R1C2(2)-R1C2(3)-R2C2(3)-R2C2(1)` alternates strong and weak links. The endpoints are both digit `1`, so at least one endpoint is true. Any candidate `1` seeing both endpoints, such as `R2C1(1)`, is eliminated.

ALS-XZ:
Two almost locked sets share a restricted common candidate `2`. Because `2` can live in only one cross-seeing cell from each ALS, shared candidate `3` cannot survive in any outside cell that sees all `3` occurrences in both ALSs.

Forcing-chain boundary example:
If assuming `R1C1=1` immediately removes the only candidate from a peer, the assumption is false and `R1C1(1)` is eliminated. The engine stops at bounded naked-single propagation and does not branch into forcing nets.

## Current Report

`data/reports/solve-rate.json` after M3 reports:

- Easy: `100/100`, zero soundness violations.
- Medium: `100/100`, zero soundness violations.
- Hard: `100/100`, zero soundness violations.
- Diabolical: `97/100`, zero soundness violations.

Advanced usage in the diabolical set confirms the higher tier is active: `aic` 227 steps, `als` 52 steps, `forcing-chain` 97 steps, plus coloring, wings, fish, and one uniqueness step.
