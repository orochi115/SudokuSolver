# Local Library Audit Report

Audit date: 2026-06-01

## Summary

The local Sudoku human-solving library now covers the previously selected information sources and has consistent local source associations. Markdown and raw HTML copies are present for every source in `source-manifest.json`, and all citation IDs used by technique cards and indexes resolve to manifest entries.

## Verification Results

| Check | Result |
|---|---|
| Manifest JSON parses | Pass |
| Technique-to-source JSON parses | Pass |
| Source-to-technique JSON parses | Pass |
| Manifest entries with missing local files | 0 |
| Downloaded Markdown files not in manifest | 0 |
| Downloaded raw HTML files not in manifest | 0 |
| Source IDs referenced by mappings but absent from manifest | 0 |
| Manifest sources missing from `source-to-technique.json` | 0 |
| Citation IDs absent from manifest | 0 |
| Manifest IDs absent from citation map | 0 |

## Local File Counts

| Type | Count |
|---|---:|
| Manifest source entries | 90 |
| Local Markdown source files | 90 |
| Local raw HTML source files | 90 |
| Technique cards | 41 |
| Index/mapping files | 6 |

> Update 2026-06-23: added 5 exotic sources (`SUDOKUWIKI-EXOCET`, `SUDOKUWIKI-SK-LOOP`, `ENJOYSUDOKU-MSLS`, `SUDOKUWIKI-FIREWORKS`, `SUDOKUWIKI-APE`; new `enjoysudoku` group) and 5 technique cards (Exocet, SK-Loop, MSLS, Fireworks, Aligned Pair/Triple Exclusion) under `11-exotic/`, in support of [`docs/plans/diabolical-727.md`](../../../../docs/plans/diabolical-727.md)'s P2 exotic tier.

> Update 2026-06-23 (card-library expansion): added 24 source mirrors (13 SudokuWiki, 9 Sudopedia, 2 enjoysudoku) and 21 technique cards (Finned/Sashimi Fish, Franken/Mutant Fish, Broken Wing, Bent Sets, Remote Pairs, WXYZ-Wing, 3D Medusa, Multi-Coloring, AIC-with-ALS/-Exotic-Links/-UR, Grouped AIC, Nice Loops, Twinned XY-Chains, XY-Chain, AHS, Avoidable Rectangle, Extended UR, Gurth's Theorem, Subset Exclusion, Tridagon). Also reconciled stale citation IDs in card frontmatter (`SUDOKUWIKI-NAKED-CANDIDATES`→`SUDOKUWIKI-NAKED`, `SUDOKUWIKI-HIDDEN-CANDIDATES`→`SUDOKUWIKI-HIDDEN`, `SUDOPEDIA-ALS`→`SUDOKUWIKI-ALS`, `SUDOKUWIKI-FINNED-X-WING`→`SUDOKUWIKI-FINNED-XWING`, `SUDOKUWIKI-X-WING`→`SUDOKUWIKI-XWING`). Counts above reflect post-update totals.

> Update 2026-06-23 (coverage-gap fill): added 5 source notes and 2 cards for Rectangle Elimination plus Rank/SET/Phistomefel/Oddagon boundary coverage. P3 red-line names are now boundary-card covered rather than marked as missing implementation cards.

> Update 2026-06-23 (raw mirror fill): replaced the 5 coverage-gap raw-HTML placeholder notes with fetched source HTML mirrors for Rectangle Elimination, bivalue oddagon, SET explanations, SudokuOne rank logic, and Phistomefel.

## Coverage Assessment

### Strong Coverage

- Foundations: candidates, houses, peers, strong/weak links.
- Basic solving: singles, locked candidates, naked/hidden subsets.
- Fish: fish theory, X-Wing, Swordfish, Jellyfish, finned/sashimi, complex fish.
- Single-digit patterns: Skyscraper, 2-String Kite, Turbot Fish, Empty Rectangle, Rectangle Elimination.
- Wings: XY-Wing/Y-Wing, XYZ-Wing, W-Wing.
- Chains: X-chain, XY-chain, Nice Loop, AIC, grouped links, ALS in chains.
- ALS: ALS-XZ, doubly linked ALS-XZ, ALS-XY-Wing, ALS chains, Death Blossom.
- Uniqueness: Unique Rectangle family, Avoidable Rectangle, BUG+1.
- Exotic/last resort: Sue de Coq, Rank/SET/Phistomefel/Oddagon theory boundary, forcing chains/nets, templates, Kraken Fish, brute-force boundary.
- Chinese terminology: bilingual names and Chinese source explanations.

### Supplemental Coverage Added

- SudokuWiki: XY-Chains, X-Cycles, 3D Medusa, W-Wing, XYZ-Wing, BUG, Forcing Nets, AIC with Groups, AIC with ALSs, AIC with Unique Rectangles.
- Chinese/Sudoku.com: Swordfish, Y-Wing, XY-Wing, Unique Rectangle specialty pages.

### Association Quality

- Every technique card has source IDs.
- Every source ID used by a technique card exists in `source-manifest.json`.
- Every manifest source maps back to at least one technique or framework in `source-to-technique.json`.
- `citation-map.md` now covers every manifest source ID.
- `bibliography.md` distinguishes clear GNU FDL sources from copyright-unclear sources.

## Remaining Optional Downloads

The current library is sufficient for synthesizing a complete human-solving workflow. Optional downloads could improve example coverage but are not blockers:

- Worked example puzzle pages or exemplar URLs for each major technique if the next deliverable needs step-by-step examples rather than only technique rules.
- More Chinese ALS-specific sources, if Chinese documentation needs a dedicated ALS explanation rather than English-source-backed terminology.

## Recommendation

Proceed to synthesis. Before writing a final all-difficulty process, decide the boundary between acceptable human logic and enumeration-like methods: especially Nishio, forcing nets, tabling, templates, and long multiple forcing chains.
