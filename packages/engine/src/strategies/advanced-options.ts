export interface ForcingBoundaryConfig {
  /** Maximum edge count for a single non-branching chain. */
  maxChainEdges: number;
  /** Whether branching forcing nets are allowed. */
  allowBranchingNets: boolean;
  /** Whether trial-and-error style forcing should be allowed. */
  allowTrialEnumeration: boolean;
}

export interface AdvancedStrategyOptions {
  /** Uniqueness techniques rely on a unique-solution assumption. */
  enableUniqueness: boolean;
  /** ALS and chain engines share this boundary so policy is centralised. */
  forcingBoundary: ForcingBoundaryConfig;
}

const options: AdvancedStrategyOptions = {
  enableUniqueness: false,
  forcingBoundary: {
    maxChainEdges: 9,
    allowBranchingNets: false,
    allowTrialEnumeration: false,
  },
};

export function getAdvancedStrategyOptions(): Readonly<AdvancedStrategyOptions> {
  return options;
}

export function setAdvancedStrategyOptions(next: Partial<AdvancedStrategyOptions>): void {
  if (typeof next.enableUniqueness === 'boolean') {
    options.enableUniqueness = next.enableUniqueness;
  }
  if (next.forcingBoundary) {
    options.forcingBoundary = {
      ...options.forcingBoundary,
      ...next.forcingBoundary,
    };
  }
}
