/**
 * ChainPolicy — the engine's forcing-boundary configuration (FR-8).
 *
 * This is the single place that decides "how human-acceptable" the chain search
 * is allowed to be. It implements the boundary documented in
 * `docs/forcing-boundary.md`:
 *
 *   - bounded, non-branching, alternating chains are accepted;
 *   - multi-branch forcing NETS, Nishio, tabling, and over-wide / over-deep
 *     searches are treated as disguised enumeration and disabled by default.
 *
 * Chain-like strategies (`simple-coloring`, `aic`, `als`, `forcing-chain`) read
 * this object to bound their search. The defaults keep the trace teaching-pure.
 */

export interface ChainPolicy {
  /** Max number of nodes in a chain (AIC / coloring / forcing). Beyond → truncated (enumeration). */
  maxChainLength: number;
  /** Max branch width of a forcing premise. 2 = bivalue cell / two-spot digit (human-acceptable). */
  maxForcingWidth: number;
  /** Allow bounded "single bivalue cell" forcing chains. */
  allowCellForcing: boolean;
  /** Allow bounded "single digit, two spots in a house" forcing chains. */
  allowDigitForcing: boolean;
  /** Allow multi-branch forcing NETS (disguised enumeration). Default false. */
  allowNets: boolean;
  /** Enable uniqueness-assumption techniques (UR / AR / BUG). */
  allowUniqueness: boolean;
}

export const DEFAULT_CHAIN_POLICY: ChainPolicy = {
  maxChainLength: 24,
  maxForcingWidth: 2,
  allowCellForcing: true,
  allowDigitForcing: true,
  allowNets: false,
  allowUniqueness: true,
};
