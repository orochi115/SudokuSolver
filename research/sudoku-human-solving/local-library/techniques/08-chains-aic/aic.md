---
id: technique.aic
name_en: Alternating Inference Chains
name_zh: 交替推理链
family: chains-aic
difficulty: diabolical-extreme
sources:
  - HODOKU-CHAINS
  - SUDOKUWIKI-AIC
  - CHINESE-JWANGL5-ADVANCED
---

# Alternating Inference Chains / 交替推理链

## One-Sentence Rule

Connect candidate entities with alternating strong and weak links; endpoints or loop discontinuities produce placements or eliminations.

## Core Logic

- Strong link: if A is false, B is true.
- Weak link: if A is true, B is false.
- A strong link can be used as a weak link if the chain position requires it.
- Alternation is the key constraint.

## Common Outcomes

- Type 1 endpoint: endpoints on the same digit imply one endpoint is true, so remove that digit from cells seeing both.
- Type 2 endpoint: endpoints on different digits in seeing cells remove crossed candidates.
- Continuous loop: weak links become effectively strong for off-chain eliminations.
- Discontinuous loop: contradiction at the break places or removes a candidate.

## Formula Role

AIC is the main candidate for an all-difficulty non-enumerative human framework. Named techniques can be treated as shortcuts or special cases.

## Sources

HODOKU-CHAINS, SUDOKUWIKI-AIC, CHINESE-JWANGL5-ADVANCED
