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

## Phase 4: M2 Engine Strategies
1. Read M2 requirements, engine interfaces, existing tests, and technique notes - complete
2. Add failing tests for T1-T3 strategies and solve-rate/soundness coverage - complete
3. Implement strategy helper utilities and independent strategy modules - complete
4. Register strategies by difficulty and expose public exports - complete
5. Add solve-rate script and generated report - complete
6. Write `docs/notes/m2.md` design notes with solve-rate results - complete
7. Run typecheck, full tests, soundness regression, and solve-rate script until green - complete

## M2 Implementation Constraints
- Do not modify core foundation files: `grid.ts`, `trace.ts`, `strategy.ts`, `solver.ts`, `soundness.ts`, `bruteforce.ts`, `parser.ts`.
- Do not modify `data/ground-truth/`, top-level configuration, or existing spec docs under `docs/requirements.md` and `docs/milestones/`.
- Each strategy is an independent pure module under `packages/engine/src/strategies/` and returns only the first applicable step.
- Use bilingual explanations and highlights consistent with `naked-single.ts` and glossary terms.

## M2 Verification Results
- `npm run typecheck` passed.
- `npm test` passed: 7 test files, 42 tests.
- `packages/engine/test/m2-soundness.test.ts` covers all 400 frozen ground-truth puzzles and reported zero violations.
- `npx tsx packages/engine/scripts/solve-rate.ts` generated `data/reports/solve-rate.json`.

## Errors Encountered During M2
| Error | Attempt | Resolution |
|---|---|---|
| Initial M2 test run failed because strategy modules did not exist | TDD red run for `strategies-m2.test.ts` | Added independent strategy modules and registry exports |
| Some chain-pattern tests expected different eliminations | First green run after implementation | Found hand-built candidates invalidated intended strong links or allowed another valid first step; corrected fixtures |
| `typecheck` reported weak tuple inference in fish parameterized tests | First typecheck | Added explicit `fishCases` tuple type |
