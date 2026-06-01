# Human Sudoku Solving Source Index

This index tracks internet sources collected for building a complete, formula-like human Sudoku solving workflow.

## Local Library Entry Points

| File | Purpose |
|---|---|
| `README.md` | Local library usage guide and storage policy |
| `bibliography.md` | Source bibliography, URL list, and copyright/license notes |
| `source-manifest.json` | Machine-readable local source manifest |
| `citation-map.md` | Stable citation IDs for technique cards and synthesis |
| `glossary.zh-en.md` | Bilingual terminology map |
| `local-library/markdown/` | Markdown conversions grouped by source |
| `local-library/raw-html/` | Raw HTML files grouped by source; kept separate from Markdown |
| `local-library/techniques/` | Technique-level model-friendly cards |
| `local-library/indexes/` | Retrieval indexes and JSON source/technique maps |

## Source Table

| ID | Source | URL | Local File | Coverage | Usefulness |
|---|---|---|---|---|---|
| HODOKU-CORE | HoDoKu core techniques | https://hodoku.sourceforge.net/en/techniques.php | `sources/hodoku-core-techniques.md` | terminology, singles, intersections, naked/hidden subsets, basic fish, wings, chains/AIC | Primary source for human-style logical solving and formal technique definitions |
| HODOKU-ADV | HoDoKu advanced techniques | https://hodoku.sourceforge.net/en/techniques.php | `sources/hodoku-advanced-techniques.md` | fish variants, single-digit patterns, uniqueness, coloring, ALS, Sue de Coq, forcing chains/nets, brute-force boundary | Primary source for advanced and last-resort taxonomy |
| SUDOKUWIKI | SudokuWiki strategy system | https://www.sudokuwiki.org/strategy_families | `sources/sudokuwiki-strategy-system.md` | difficulty/family taxonomy, logic vs brute force, intersections, subsets, X-Wing, Y-Wing, AIC | Primary source for ordering strategies and explaining logical-vs-exhaustive solving |
| TAXONOMY | Sudopedia and supporting teaching sources | https://www.sudopedia.org/wiki/Solving_Technique | `sources/taxonomy-and-supporting-sources.md` | broad taxonomy, Sudoku of the Day teaching order, Sudoku.com pointing pairs, Sudoku Bliss advanced checklists | Cross-reference source for completeness and beginner-to-advanced teaching order |
| CHINESE | Chinese sources and terminology | multiple URLs | `sources/chinese-sources-and-terms.md` | Chinese terminology, X-Wing, pointing pairs, Chinese advanced technique summaries, constructed-chain framing | Needed for Chinese documentation and bilingual naming consistency |

## Technique Coverage Map

| Technique Family | Sources | Notes |
|---|---|---|
| Candidate basics and notation | HODOKU-CORE, TAXONOMY, CHINESE | Houses, candidates, peers/seeing, r/c notation, pencil marks |
| Singles | HODOKU-CORE, SUDOKUWIKI, TAXONOMY, CHINESE | Full house, last digit, naked single, hidden single |
| Intersections / locked candidates | HODOKU-CORE, SUDOKUWIKI, TAXONOMY, CHINESE | Pointing and claiming; core early elimination family |
| Naked and hidden subsets | HODOKU-CORE, SUDOKUWIKI, TAXONOMY, CHINESE | Pairs/triples/quads; hidden/naked complements important for formulaic scanning |
| Fish | HODOKU-CORE, HODOKU-ADV, SUDOKUWIKI, TAXONOMY, CHINESE | X-Wing, Swordfish, Jellyfish; HoDoKu's base/cover-set model is most formulaic |
| Finned/complex fish | HODOKU-ADV, TAXONOMY, CHINESE | Finned/sashimi, Franken, Mutant, Kraken; likely late-stage only |
| Single-digit patterns | HODOKU-ADV, TAXONOMY, CHINESE | Skyscraper, 2-String Kite, Turbot Fish, Empty Rectangle; can be modeled as short X-chains |
| Wings / bent sets | HODOKU-CORE, SUDOKUWIKI, TAXONOMY, CHINESE | XY-Wing/Y-Wing, XYZ-Wing, W-Wing, WXYZ-Wing; many are short chains or ALS cases |
| Coloring | HODOKU-ADV, SUDOKUWIKI, TAXONOMY | Human visualization of single-digit chains; color trap/wrap and multi-color |
| Chains and AIC | HODOKU-CORE, HODOKU-ADV, SUDOKUWIKI, TAXONOMY, CHINESE | Strong/weak links, AIC, Nice Loops, X-chain, XY-chain, grouped links; likely unifying advanced framework |
| ALS | HODOKU-ADV, SUDOKUWIKI, TAXONOMY, CHINESE | ALS-XZ, doubly linked ALS, ALS-XY-Wing, ALS chains, Death Blossom; important bridge between subsets and chains |
| Uniqueness | HODOKU-ADV, SUDOKUWIKI, TAXONOMY, CHINESE | Unique Rectangle, Avoidable Rectangle, BUG+1; optional because it assumes uniqueness beyond base rules |
| Exotic and subset counting | HODOKU-ADV, SUDOKUWIKI, TAXONOMY | Sue de Coq, aligned exclusion, pattern overlay, Exocet; advanced/specialized |
| Last resort logical branching | HODOKU-ADV, SUDOKUWIKI, TAXONOMY | Forcing chains/nets, Nishio, tabling; need decide what counts as human formula vs enumeration |
| Brute force / backtracking | HODOKU-ADV, SUDOKUWIKI, TAXONOMY | Explicitly outside desired workflow except for validation or solution counting |

## Preliminary Synthesis Direction

The most promising path to a complete human workflow is not a flat list of named tricks. It should be a layered proof system:

1. Maintain candidates and repeatedly apply all deterministic local reductions.
2. Treat subsets, intersections, fish, and wings as common visual shortcuts.
3. Use strong/weak links and AIC as the general framework when visual shortcuts fail.
4. Add ALS as higher-order chain nodes.
5. Mark uniqueness strategies as optional because they depend on the one-solution assumption.
6. Treat forcing chains/nets as the final non-brute-force layer, but clearly separate them from backtracking enumeration.

## Gaps For Next Phase

- Need define a strict rule for whether Nishio, forcing nets, and tabling count as acceptable human logic or as disguised enumeration.
- Need translate taxonomy into an exact scan order and repeat loop.
- Need decide how much complexity is still realistically human-solvable by hand.
- Need examples for each major layer if building a guide rather than only a taxonomy.

## Localized Library Expansion

- Markdown and raw HTML are now stored separately under `local-library/`.
- Raw HTML is retained for sources where Markdown conversion may omit structure or where later reprocessing is useful.
- Sources with unclear copyright are retained locally for research/reference and marked in `bibliography.md` and `source-manifest.json`.
- Technique-level cards now provide a compact retrieval layer for LLM synthesis.
