/**
 * Naked Subset (T2: pairs/triples/quads).
 *
 * If N cells in one house contain exactly N candidate digits in total,
 * eliminate those N digits from all other cells in the house.
 */

import { HOUSES, digitsOf } from '../grid.js';
import type { Grid } from '../grid.js';
import type { Step } from '../trace.js';
import type { Strategy } from '../strategy.js';

export const nakedSubset: Strategy = {
  id: 'naked-subset',
  name: { zh: '显性数组', en: 'Naked Subset' },
  difficulty: 30,

  apply(grid: Grid): Step | null {
    // Try naked pairs, triples, quads
    for (const house of HOUSES) {
      // For each possible subset size (2-4 for pairs/triples/quads)
      for (let size = 2; size <= 4; size++) {
        // Find all combinations of cells in the house
        const combinations = getCombinations(house, size);
        
        for (const combo of combinations) {
          // Get all candidates for these cells
          let allCandidates = 0;
          const comboCandidates: {cell: number, candidates: number}[] = [];
          
          for (const cell of combo) {
            const candidates = grid.candidatesOf(cell);
            allCandidates |= candidates;
            comboCandidates.push({ cell, candidates });
          }
          
          // If the total number of unique candidates equals the size, we have a naked subset
          if (popcount(allCandidates) === size) {
            // Eliminate these digits from other cells in the house
            const eliminations: { cell: number; digit: number }[] = [];
            const highlightCells: number[] = [];
            const highlightCandidates: { cell: number; digit: number }[] = [];
            
            for (const cell of house) {
              if (combo.includes(cell)) {
                highlightCells.push(cell);
                // Highlight all candidates in these cells
                for (const digit of digitsOf(grid.candidatesOf(cell))) {
                  highlightCandidates.push({ cell, digit });
                }
              } else {
                // For other cells, check if they have any of the subset digits
                const candidates = grid.candidatesOf(cell);
                for (const digit of digitsOf(candidates)) {
                  if ((allCandidates & (1 << (digit - 1))) !== 0) {
                    eliminations.push({ cell, digit });
                  }
                }
              }
            }
            
            if (eliminations.length > 0) {
              const sizeName = ['','',(size === 2 ? '数对' : size === 3 ? '三数组' : '四数组')];
              const houseType = ['行','列','宫'];
              const houseIndex = Math.floor(house[0]! / 9);
              const houseTypeName = houseType[houseIndex % 3];
              const houseNum = houseIndex % 3 + 1;
              
              return {
                strategyId: this.id,
                placements: [],
                eliminations,
                highlights: { 
                  cells: highlightCells, 
                  candidates: highlightCandidates, 
                  links: [] 
                },
                explanation: {
                  zh: `在${houseTypeName}${houseNum}中，发现显性${sizeName[size]}，可从其他单元格中消除对应候选数`,
                  en: `Found naked ${sizeName[size]} in ${houseTypeName}${houseNum}, can eliminate corresponding candidates from other cells.`,
                },
              };
            }
          }
        }
      }
    }
    
    return null;
  },
};

// Helper function to compute popcount
function popcount(mask: number): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

// Helper function to get combinations of cells
function getCombinations<T>(arr: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];
  
  const result: T[][] = [];
  const first = arr[0]!;
  const rest = arr.slice(1);
  
  // Combinations that include the first element
  const restCombinations = getCombinations(rest, size - 1);
  for (const combo of restCombinations) {
    result.push([first, ...combo]);
  }
  
  // Combinations that don't include the first element
  const withoutFirst = getCombinations(rest, size);
  for (const combo of withoutFirst) {
    result.push(combo);
  }
  
  return result;
}