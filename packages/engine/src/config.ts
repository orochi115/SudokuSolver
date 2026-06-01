export interface EngineConfig {
  /**
   * Toggle uniqueness-based strategies (Unique Rectangle, BUG+1).
   * These assume the puzzle has a unique solution.
   */
  enableUniqueness: boolean;

  /**
   * Toggle forcing chains (e.g., cell forcing, digit forcing).
   * These require tracking two parallel paths of inference.
   */
  enableForcingChains: boolean;

  /**
   * The maximum chain length (number of links) to search for.
   * Restricts AIC and other chaining techniques to keep them human-readable.
   */
  maxChainLength: number;
}

export const defaultConfig: EngineConfig = {
  enableUniqueness: true,
  enableForcingChains: false,
  maxChainLength: 12,
};

export let activeConfig: EngineConfig = { ...defaultConfig };

export function setConfig(config: Partial<EngineConfig>): void {
  activeConfig = { ...activeConfig, ...config };
}
