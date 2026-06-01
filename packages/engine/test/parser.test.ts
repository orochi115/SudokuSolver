import { describe, it, expect } from 'vitest';
import { parseOpenSudoku, isValidPuzzleString } from '../src/parser.js';

const XML = `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<opensudoku version="2">
  <folder name="Easy (All)" created="1778054847256">
    <game data="050703060007000800000816000000030000005000100730040086906000204840572093000409000" state="0" time="0" />
    <game data="302401809001000300000000000040708010780502036000090000200609003900000008800070005" state="0" time="0" />
  </folder>
  <folder name="Hard (All)">
    <game data="000823001003000400070000052300960010000102000010038006830000040002000900600789000" state="0" />
  </folder>
</opensudoku>`;

describe('parseOpenSudoku', () => {
  it('extracts all games with their folder', () => {
    const puzzles = parseOpenSudoku(XML);
    expect(puzzles.length).toBe(3);
    expect(puzzles[0]!.data.length).toBe(81);
    expect(puzzles[0]!.folder).toBe('Easy (All)');
    expect(puzzles[2]!.folder).toBe('Hard (All)');
  });

  it('isValidPuzzleString validates 81 digits', () => {
    expect(isValidPuzzleString('0'.repeat(81))).toBe(true);
    expect(isValidPuzzleString('0'.repeat(80))).toBe(false);
    expect(isValidPuzzleString('x'.repeat(81))).toBe(false);
  });
});
