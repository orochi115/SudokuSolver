# Human-Readable Solving Flow (FR-9)

Derived from STRATEGIES registry order + representative traces.

## Phase Order (by difficulty)
1. Singles (10): Naked Single, Hidden Single
2. Intersections (20): Pointing, Claiming
3. Subsets (30): Naked/Hidden Pairs/Triples/Quads
4. Fish (40): X-Wing, Swordfish, Jellyfish
5. Wings (50): XY-Wing, XYZ-Wing, W-Wing
6. Coloring (60): Simple Coloring
7. Chains/AIC (70): AIC engine (X-Chain, XY-Chain, Nice Loops, AIC Type1/2)
8. ALS (80): ALS-XZ, ALS-XY-Wing, Death Blossom, ALS chains
9. Uniqueness (90, optional): Unique Rectangle, Avoidable Rectangle (flag controlled)
10. Exotic (95): Sue de Coq (if needed)
11. Forcing (100, strict boundary only): short non-branching chains per forcing-boundary.md

## Representative Worked Traces
(See test fixtures and ground-truth traces for full JSON; examples show AIC link paths and ALS regions used to eliminate candidates.)

The registry guarantees cheaper strategies are tried first; solver loop applies first hit.
All steps carry `highlights.links` for chain visualization and bilingual explanations.
