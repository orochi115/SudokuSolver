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
| Manifest source entries | 56 |
| Local Markdown source files | 56 |
| Local raw HTML source files | 56 |
| Technique cards | 13 |
| Index/mapping files | 6 |

## Coverage Assessment

### Strong Coverage

- Foundations: candidates, houses, peers, strong/weak links.
- Basic solving: singles, locked candidates, naked/hidden subsets.
- Fish: fish theory, X-Wing, Swordfish, Jellyfish, finned/sashimi, complex fish.
- Single-digit patterns: Skyscraper, 2-String Kite, Turbot Fish, Empty Rectangle.
- Wings: XY-Wing/Y-Wing, XYZ-Wing, W-Wing.
- Chains: X-chain, XY-chain, Nice Loop, AIC, grouped links, ALS in chains.
- ALS: ALS-XZ, doubly linked ALS-XZ, ALS-XY-Wing, ALS chains, Death Blossom.
- Uniqueness: Unique Rectangle family, Avoidable Rectangle, BUG+1.
- Exotic/last resort: Sue de Coq, forcing chains/nets, templates, Kraken Fish, brute-force boundary.
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
