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
- Started M2 engine strategy implementation session.
- Read required context: `README.md`, `docs/requirements.md`, `docs/milestones/M2.md`, `strategy.ts`, `naked-single.ts`, core grid/solver/trace/soundness files, registry, tests, package scripts, ground-truth shape, and glossary.
- Added M2 tests for full house, hidden single, pointing, claiming, naked/hidden subsets, fish, turbot-family patterns, wings, purity, and all-ground-truth soundness.
- Implemented M2 strategies under `packages/engine/src/strategies/` plus shared `utils.ts`.
- Registered all M2 strategies in difficulty order and exported them from the engine public surface.
- Added `packages/engine/scripts/solve-rate.ts` and generated `data/reports/solve-rate.json`.
- Added M2 design notes at `docs/notes/m2.md` with implementation choices and solve-rate table.
- Verification passed: `npm run typecheck`, `npm test`, and solve-rate generation.
