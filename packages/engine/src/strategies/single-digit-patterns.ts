import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const singleDigitPatterns: Strategy = {
  id: 'single-digit-patterns',
  name: { zh: '单数字模式', en: 'Single Digit Patterns' },
  difficulty: 45,
  apply(grid: Grid): Step | null {
    // stub: real skyscraper/ kite / ER require 2-string chains; return null to keep soundness
    // (will be covered partially by basic-fish in easy cases)
    return null;
  },
};
