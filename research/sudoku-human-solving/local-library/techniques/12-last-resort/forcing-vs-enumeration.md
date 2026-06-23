---
id: technique.forcing-vs-enumeration
name_en: Forcing Chains, Nets, and Enumeration Boundary
name_zh: 强制链/强制网与枚举边界
family: last-resort
difficulty: extreme
sources:
  - HODOKU-LAST
  - SUDOKUWIKI-LOGIC-VS-BRUTE
  - SOTD-FORCING-CHAINS
  - SUDOKUWIKI-FORCING-NETS
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Forcing Chains, Nets, and Enumeration Boundary / 强制链与枚举边界

## One-Sentence Rule

Forcing logic explores implications from exhaustive alternatives of a limited premise and acts only on common outcomes or contradictions.

## Accepted Logical Forms

- Multiple chains from all candidates of one cell lead to the same result.
- Multiple chains from all locations of one digit in one house lead to the same result.
- A premise causes contradiction, so that premise is false.

## Named Red-Line Forms

These names are intentionally tracked for coverage completeness. They are not implementation-ready cards in this roadmap.

- **Forcing Nets**: branching implication graphs rather than a single readable chain. HoDoKu and SudokuWiki treat them as last-resort methods; keep disabled unless a future flag explicitly permits them.
- **Nishio / Digit Forcing**: single-digit contradiction logic. It may be logically valid, but it is still trial-assumption driven and remains outside the default target workflow.
- **Kraken Fish**: a fish plus one or more chains. HoDoKu describes Type 1 as proving an elimination for every possible fin, and Type 2 as chaining from base candidates/fins to a common conclusion. This is best classified as fish-shaped forcing-chain/net logic; do not implement as ordinary fish.
- **Templates / Pattern Overlay Method (POM)**: enumerate all valid placements/templates for a digit and eliminate candidates absent from every remaining template. HoDoKu explicitly says templates are not meant for human players.
- **Tabling / Trebor's Tables / GEM / Braid Analysis / Bowman Bingo**: broad implication-table or marking systems that approach exhaustive implication tracking.

## Boundary Warning

Forcing chains can remain logical, but forcing nets, Nishio, Kraken Fish, tabling, templates/POM, GEM, Bowman Bingo, braid analysis, and broad branching can resemble enumeration. The final human workflow must define an explicit cutoff.

## Excluded From Target Workflow

- Random guessing.
- Backtracking search.
- Computer brute-force solution counting.
- Generic template enumeration / POM.
- Unbounded implication tabling or net expansion.

## Worked example status

This boundary card contains source-backed named examples but intentionally no restored-state fixtures. If a P3 technique is ever promoted behind a flag, it needs a separate implementation card with a bounded detector and an independently verified 81-char worked example.

## Sources

HODOKU-LAST, SUDOKUWIKI-LOGIC-VS-BRUTE, SUDOKUWIKI-FORCING-NETS, SOTD-FORCING-CHAINS, SUDOPEDIA-SOLVING-TECHNIQUE
