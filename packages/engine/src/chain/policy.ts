export interface ChainPolicy {
  maxChainLength: number;
  maxForcingWidth: number;
  allowCellForcing: boolean;
  allowDigitForcing: boolean;
  allowNets: boolean;
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
