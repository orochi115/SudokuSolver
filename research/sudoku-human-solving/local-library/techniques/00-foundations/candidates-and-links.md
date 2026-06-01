---
id: technique.candidates-and-links
name_en: Candidates and Links
name_zh: 候选数与链关系
family: foundations
difficulty: foundation
sources:
  - HODOKU-INTRO
  - HODOKU-CHAINS
  - SUDOKUWIKI-AIC
---

# Candidates and Links / 候选数与链关系

## One-Sentence Rule

Human solving is candidate elimination: every technique either places a forced value or removes candidates until forced values appear.

## Core Concepts

- A `house` is a row, column, or box.
- Two cells `see` each other if they share a house.
- A candidate is possible until a proven rule eliminates it.
- A weak link means two candidate entities cannot both be true.
- A strong link means two candidate entities cannot both be false.
- In AIC-style reasoning, links alternate strong and weak.

## Human Scan Procedure

1. Fill or refresh candidates.
2. Check whether each elimination follows from a house, subset, fish, or chain rule.
3. After every placement, remove the placed digit from peers.
4. Repeat simpler scans before escalating.

## Formula Role

This card is the foundation for all advanced techniques. Fish, wings, coloring, AIC, ALS, and forcing chains can be expressed in terms of candidate entities and strong/weak inferences.

## Sources

HODOKU-INTRO, HODOKU-CHAINS, SUDOKUWIKI-AIC
