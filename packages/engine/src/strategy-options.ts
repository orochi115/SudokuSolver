export interface ForcingBoundary {
  maxChainLength: number;
  allowBranching: boolean;
}

export interface StrategyOptions {
  enableUniqueness: boolean;
  enableSueDeCoq: boolean;
  forcingBoundary: ForcingBoundary;
}

const DEFAULT_OPTIONS: StrategyOptions = {
  enableUniqueness: false,
  enableSueDeCoq: false,
  forcingBoundary: {
    maxChainLength: 12,
    allowBranching: false,
  },
};

let options: StrategyOptions = {
  enableUniqueness: DEFAULT_OPTIONS.enableUniqueness,
  enableSueDeCoq: DEFAULT_OPTIONS.enableSueDeCoq,
  forcingBoundary: { ...DEFAULT_OPTIONS.forcingBoundary },
};

export function getStrategyOptions(): StrategyOptions {
  return options;
}

export function setStrategyOptions(next: Partial<StrategyOptions>): void {
  options = {
    ...options,
    ...next,
    forcingBoundary: {
      ...options.forcingBoundary,
      ...(next.forcingBoundary ?? {}),
    },
  };
}

export function resetStrategyOptions(): void {
  options = {
    enableUniqueness: DEFAULT_OPTIONS.enableUniqueness,
    enableSueDeCoq: DEFAULT_OPTIONS.enableSueDeCoq,
    forcingBoundary: { ...DEFAULT_OPTIONS.forcingBoundary },
  };
}
