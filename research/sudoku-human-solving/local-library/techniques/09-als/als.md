---
id: technique.als
name_en: Almost Locked Sets
name_zh: 几乎锁定集
family: als
difficulty: extreme
sources:
  - HODOKU-ALS
  - SUDOKUBLISS-ALS
  - SUDOPEDIA-SOLVING-TECHNIQUE
---

# Almost Locked Sets / 几乎锁定集

## One-Sentence Rule

An ALS is N cells with N+1 candidates; when linked to another ALS by restricted common candidates, it can lock or eliminate shared candidates.

## Core Terms

- ALS: N cells in one house with N+1 candidates.
- RCC: restricted common candidate shared by two ALS where all instances in one see all instances in the other.
- Unrestricted common candidate: shared candidate without full mutual visibility.

## Main Patterns

- ALS-XZ: two ALS share RCC X and common candidate Z; remove Z from cells seeing all Z instances in both ALS.
- Doubly linked ALS-XZ: two RCCs create stronger locking.
- ALS-XY-Wing: three ALS linked through two RCCs; remove shared endpoint digit.
- ALS Chain: sequence of ALS nodes connected by RCCs.
- Death Blossom: stem cell connects to ALS petals.

## Formula Role

ALS extends subset logic into chain logic. It is a high-value abstraction for hard puzzles because many named advanced patterns are ALS cases.

## Sources

HODOKU-ALS, SUDOKUBLISS-ALS, SUDOPEDIA-SOLVING-TECHNIQUE
