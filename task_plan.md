# Task Plan: Human Sudoku Solving Research

## Goal
Collect enough reliable internet material to support a later synthesis of a full, formula-like human Sudoku solving workflow that avoids brute-force enumeration.

## Scope
- Focus on standard 9x9 Sudoku human solving techniques.
- Include beginner through extreme logical strategies.
- Save useful source material locally with URLs and topic tags.
- Build an index document that maps sources to strategy families.

## Phases
1. Create local planning and research structure - complete
2. Search authoritative human Sudoku solving references - complete
3. Fetch and save source excerpts and metadata - complete
4. Build source index with URLs, coverage, and notes - complete
5. Summarize coverage gaps and next synthesis direction - complete

## Files
- `findings.md`: running research notes from external sources
- `progress.md`: session log and actions taken
- `research/sudoku-human-solving/index.md`: source index and topic map
- `research/sudoku-human-solving/sources/*.md`: locally saved source excerpts/summaries

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Sudoku.com advanced English URLs returned 404 | Fetch `x-wing` and `xy-wing` under `/sudoku-rules/` | Used SudokuWiki, HoDoKu, SudokuBliss, and Sudoku.com Chinese X-Wing page instead |

## Completion Summary
- Created local research index and five source digests.
- Covered standard 9x9 human-solving techniques from basics through AIC/ALS/forcing chains.
- Identified key boundary issue for the next phase: forcing chains/nets and Nishio can be logical, but may resemble enumeration depending on how they are used.

## Phase 2: Local Library Expansion
1. Create local library directory structure - complete
2. Download source pages as Markdown and raw HTML separately - complete
3. Create bibliography, manifest, glossary, and citation indexes - complete
4. Create technique-level local cards and source mappings - complete
5. Update research index and progress files - complete
6. Validate files, JSON, and git status - complete

## Phase 3: Supplemental Advanced Source Expansion
1. Commit audit fixes - complete
2. Download optional SudokuWiki advanced pages - complete
3. Download optional Chinese specialty pages - complete
4. Update manifest, citations, bibliography, and mappings - complete
5. Validate associations and commit supplemental sources - complete

## Phase 4: M2 Human Strategy Implementation
1. Inspect engine structure, existing tests, strategy conventions, and ground-truth data - complete
2. Add failing unit tests for required M2 strategy ids and exact representative deductions - complete
3. Implement T1/T2 strategies: full-house, hidden-single, locked-candidates, naked-subset, hidden-subset - complete
4. Implement T3 strategies: basic-fish, single-digit-patterns, xy-wing, xyz-wing, w-wing - complete
5. Register strategies by difficulty and add shared helpers where minimal and strategy-local friendly - complete
6. Add solve-rate script and 400-puzzle soundness regression - complete
7. Run typecheck, tests, solve-rate report, and fix issues until green - complete
8. Write `docs/notes/m2.md` with strategy design, tradeoffs, rates, and difficulties - complete

## M2 Constraints
- Do not modify engine core files, ground-truth data, top-level config, or existing spec docs.
- Each strategy module under `packages/engine/src/strategies/` exports a `Strategy` object and does not mutate `Grid`.
- Required registered ids: `full-house`, `hidden-single`, `locked-candidates`, `naked-subset`, `hidden-subset`, `basic-fish`, `single-digit-patterns`, `xy-wing`, `xyz-wing`, `w-wing`.
- Every strategy needs bilingual explanations and highlights.

## M2 Verification Results
- `npm run typecheck`: exit 0.
- `npm test`: 7 files / 33 tests passed.
- `npx tsx packages/engine/scripts/solve-rate.ts`: wrote `data/reports/solve-rate.json`; easy 100%, medium 100%, hard 87%, diabolical 14%; soundness violations 0.
- Independent review found no remaining critical/important findings after fixing an XY-Wing highlight issue and adding an explicit 400-entry regression assertion.

## Phase 5: M3 Advanced Strategy Implementation
1. Inspect M3 requirements, current strategy contract, trace links, tests, and local technique cards - complete
2. Add failing tests for all required M3 strategy ids and representative advanced deductions - complete
3. Implement link graph helpers, Simple Coloring, and AIC/X-chain deductions with link highlights - complete
4. Implement ALS, uniqueness, Sue de Coq, and forcing-chain strategy modules conservatively - complete
5. Register every required exact strategy id by difficulty - complete
6. Add `docs/forcing-boundary.md`, `docs/flow.md`, and `docs/notes/m3.md` - complete
7. Run typecheck, tests, 400-puzzle soundness, and solve-rate report until green - complete

## M3 Constraints
- Do not modify engine foundation files unless absolutely necessary; prefer pure strategy modules under `packages/engine/src/strategies/`.
- Required exact registered ids: `full-house`, `hidden-single`, `locked-candidates`, `naked-subset`, `hidden-subset`, `basic-fish`, `single-digit-patterns`, `xy-wing`, `xyz-wing`, `w-wing`, `simple-coloring`, `aic`, `als`, `uniqueness`, `sue-de-coq`, `forcing-chain`.
- Chain-like strategies must include `highlights.links` paths and must not mutate `Grid`.
- Uniqueness and forcing-chain behavior should be conservative and documented as optional/boundary-controlled where supported by the current interface.

## M3 Verification Results
- Targeted M3 tests: 8 tests passed after red/green implementation.
- Solve-rate report after review fixes: easy 100%, medium 100%, hard 100%, diabolical 97%, 0 soundness violations.
- Independent review found two issues; fixed BUG+1 proof conditions and forcing-chain propagation link paths.
- Final verification: `npm run typecheck`, `npm test`, and `npx tsx packages/engine/scripts/solve-rate.ts` exited 0.
