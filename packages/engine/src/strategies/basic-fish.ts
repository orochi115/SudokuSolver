import { COLS, ROWS } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';
import { candidateCells, candidateHighlights, cellName, combinations } from './common.js';

export const basicFish: Strategy = {
  id: 'basic-fish',
  name: { zh: '基础鱼', en: 'Basic Fish' },
  difficulty: 40,

  apply(grid): Step | null {
    for (let size = 2; size <= 4; size++) {
      for (let digit = 1; digit <= 9; digit++) {
        const rowFish = findFish(grid, digit, size, 'row');
        if (rowFish) return fishStep(this.id, digit, size, rowFish.patternCells, rowFish.eliminations, 'row');
        const colFish = findFish(grid, digit, size, 'col');
        if (colFish) return fishStep(this.id, digit, size, colFish.patternCells, colFish.eliminations, 'col');
      }
    }
    return null;
  },
};

function findFish(grid: Parameters<Strategy['apply']>[0], digit: number, size: number, orientation: 'row' | 'col'): { patternCells: number[]; eliminations: Array<{ cell: number; digit: number }> } | null {
  const bases = orientation === 'row' ? ROWS : COLS;
  const covers = orientation === 'row' ? COLS : ROWS;
  const baseCandidates = bases
    .map((house, index) => ({ index, positions: candidateCells(grid, house, digit) }))
    .filter((entry) => entry.positions.length >= 2 && entry.positions.length <= size);

  for (const selected of combinations(baseCandidates, size)) {
    const coverIndexes = new Set<number>();
    const patternCells = selected.flatMap((entry) => entry.positions);
    for (const cell of patternCells) coverIndexes.add(orientation === 'row' ? cell % 9 : Math.floor(cell / 9));
    if (coverIndexes.size !== size) continue;

    const baseIndexes = new Set(selected.map((entry) => entry.index));
    const eliminations: Array<{ cell: number; digit: number }> = [];
    for (const coverIndex of [...coverIndexes].sort((a, b) => a - b)) {
      for (const cell of covers[coverIndex]!) {
        const baseIndex = orientation === 'row' ? Math.floor(cell / 9) : cell % 9;
        if (!baseIndexes.has(baseIndex) && grid.hasCandidate(cell, digit)) eliminations.push({ cell, digit });
      }
    }
    if (eliminations.length > 0) return { patternCells: [...new Set(patternCells)].sort((a, b) => a - b), eliminations };
  }
  return null;
}

function fishStep(strategyId: string, digit: number, size: number, patternCells: number[], eliminations: Array<{ cell: number; digit: number }>, orientation: 'row' | 'col'): Step {
  const name = fishName(size);
  const baseZh = orientation === 'row' ? '行' : '列';
  const baseEn = orientation === 'row' ? 'rows' : 'columns';
  return {
    strategyId,
    placements: [],
    eliminations,
    highlights: { cells: patternCells, candidates: candidateHighlights(patternCells, [digit]), links: [] },
    explanation: {
      zh: `${patternCells.map(cellName).join('、')} 对数字 ${digit} 形成 ${name.zh}：${size} 个基础${baseZh}被 ${size} 个覆盖集锁定，因此可删除覆盖集外的 ${digit}。`,
      en: `${patternCells.map(cellName).join(', ')} form a ${name.en} for ${digit}: ${size} base ${baseEn} are covered by ${size} cover sets, so remove ${digit} from cover cells outside the bases.`,
    },
  };
}

function fishName(size: number): { zh: string; en: string } {
  if (size === 2) return { zh: 'X翼', en: 'X-Wing' };
  if (size === 3) return { zh: '剑鱼', en: 'Swordfish' };
  return { zh: '水母', en: 'Jellyfish' };
}
