# Progress: Human Sudoku Solving Research

## Session Log

### 2026-06-01
- Created planning files for the research task.
- Created research directory: `research/sudoku-human-solving/sources`.
- Ran initial web searches for comprehensive human Sudoku solving references.
- Logged first taxonomy and source candidates in `findings.md`.
- Fetched HoDoKu core pages and saved a local digest covering terminology, singles, intersections, subsets, fish, wings, and chains.
- Fetched HoDoKu advanced pages and saved local digest covering fish variants, single-digit patterns, coloring, uniqueness, ALS, Sue de Coq, and last-resort methods.
- Fetched SudokuWiki pages and saved local digest covering strategy taxonomy, brute force boundary, basic candidates, intersections, X-Wing, Y-Wing, and AIC.
- Fetched Sudopedia, Sudoku of the Day, Sudoku.com, and Sudoku Bliss supporting sources and saved a local digest.
- Searched and fetched Chinese resources; saved terminology and Chinese-source digest.
- Built `research/sudoku-human-solving/index.md` with source table, technique coverage map, preliminary synthesis direction, and next-phase gaps.
- Verified local research markdown files exist under `research/sudoku-human-solving/`.
- Expanded local library structure under `research/sudoku-human-solving/local-library/`.
- Downloaded source pages as Markdown into `local-library/markdown/` and raw HTML into `local-library/raw-html/`.
- Added `README.md`, `bibliography.md`, `source-manifest.json`, `citation-map.md`, and `glossary.zh-en.md`.
- Added technique-level cards for foundations, singles, locked candidates, subsets, fish, Turbot family, wings, coloring, AIC, ALS, uniqueness, Sue de Coq, and forcing/enumeration boundary.
- Added local retrieval indexes under `local-library/indexes/`.
- Validation: `source-manifest.json`, `technique-to-source.json`, and `source-to-technique.json` parse successfully with `python3 -m json.tool`.
- Validation counts: 40 Markdown source files, 40 raw HTML files, 13 technique cards, and 6 index/mapping files.
- Audited source coverage and associations; fixed manifest/mapping gaps and restored missing local files.
- Added `research/sudoku-human-solving/local-library/audit-report.md` with verification results, coverage assessment, and optional download recommendations.
- Supplemental download pass: added SudokuWiki pages for XY-Chains, X-Cycles, 3D Medusa, W-Wing, XYZ-Wing, BUG, Forcing Nets, AIC with Groups, AIC with ALSs, and AIC with URs.
- Supplemental download pass: added Chinese/Sudoku.com specialty pages for Swordfish, Y-Wing, XY-Wing, and Unique Rectangle.
- Updated manifest, citation map, bibliography, and source/technique mappings for 56 source entries.

### 2026-06-01 M2 Strategy Implementation
- Started M2 implementation in autonomous/headless mode.
- Read required docs: `README.md`, `docs/requirements.md`, `docs/milestones/M2.md`, `strategy.ts`, and `naked-single.ts`.
- Constraint noted: do not modify engine foundation files, ground-truth data, top-level config, or existing requirements/milestone specs.
- Added failing M2 strategy tests first; initial run failed on missing strategy module imports as expected.
- Implemented T1-T3 strategy modules and registered them in difficulty order.
- Added `packages/engine/scripts/solve-rate.ts` and generated `data/reports/solve-rate.json`.
- Initial corpus soundness run exposed over-broad T3 eliminations; tightened single-digit and W-Wing eliminations to exclude pattern cells and require distinct connectors.
- Verification passed: `npm run typecheck`, `npm test`, and `npx tsx packages/engine/scripts/solve-rate.ts`.
