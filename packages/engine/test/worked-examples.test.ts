/**
 * Verifies research-card worked examples against brute-force ground truth.
 * Cards with passing cases can drop their FLAG markers.
 */

import { describe, expect, it } from 'vitest';
import {
  checkPuzzle,
  decodeS9B,
  puzzleFromBd,
  rc,
  verifyDeductions,
  verifyRestoredStepSoundness,
} from '../src/worked-example-verify.js';

function expectSound(
  cardId: string,
  puzzle: string,
  opts: Parameters<typeof verifyDeductions>[1],
): void {
  const result = verifyDeductions(puzzle, opts);
  if (!result.ok) {
    console.error(`[${cardId}]`, result.violations);
  }
  expect(result.solvable, `[${cardId}] puzzle unsolvable`).toBe(true);
  expect(result.unique, `[${cardId}] puzzle not unique`).toBe(true);
  expect(result.ok, `[${cardId}] ${result.violations.join('; ')}`).toBe(true);
}

describe('research card worked examples (ground-truth verification)', () => {
  describe('01-singles', () => {
    it('full-house places the last missing digit in a row', () => {
      const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
      const puzzle = solved.slice(0, 1) + '0' + solved.slice(2); // r1c1 empty → only 5 fits
      expectSound('singles-full-house', puzzle, {
        placements: [{ cell: rc(1, 1), digit: 5 }],
      });
    });
  });

  describe('02-intersections', () => {
    it('pointing pair eliminates 3 from row B in box 1', () => {
      expectSound('locked-candidates-pointing', '010903600000080000900000507002010430000402000064070200701000005000030000005601020', {
        eliminations: [
          { cell: rc(2, 1), digit: 3 },
          { cell: rc(2, 2), digit: 3 },
          { cell: rc(2, 3), digit: 3 },
        ],
      });
    });

    it('claiming eliminates 2 from rest of box 2', () => {
      expectSound('locked-candidates-claiming', '016007803000800000070001060048000300600000002009000650060900020000002000904600510', {
        eliminations: [
          { cell: rc(2, 5), digit: 2 },
          { cell: rc(3, 4), digit: 2 },
          { cell: rc(3, 5), digit: 2 },
        ],
      });
    });
  });

  describe('03-subsets', () => {
    it('naked pair {1,6} in row A eliminates from peers', () => {
      expectSound('naked-pair', '400000038002004100005300240070609004020000070600703090057008300003900400240000009', {
        eliminations: [
          { cell: rc(1, 4), digit: 1 },
          { cell: rc(1, 5), digit: 1 },
          { cell: rc(1, 6), digit: 1 },
          { cell: rc(1, 7), digit: 1 },
          { cell: rc(1, 8), digit: 1 },
          { cell: rc(1, 9), digit: 1 },
        ],
      });
    });

    it('hidden pair {6,7} in box 3 strips non-pair digits from A8 and A9', () => {
      expectSound(
        'hidden-pair',
        '000000000904607000076804100309701080008000300050308702007502610000403208000000000',
        {
          eliminations: [
            { cell: rc(1, 8), digit: 2 },
            { cell: rc(1, 8), digit: 3 },
            { cell: rc(1, 8), digit: 4 },
            { cell: rc(1, 8), digit: 5 },
            { cell: rc(1, 8), digit: 9 },
            { cell: rc(1, 9), digit: 3 },
            { cell: rc(1, 9), digit: 4 },
            { cell: rc(1, 9), digit: 5 },
            { cell: rc(1, 9), digit: 9 },
          ],
        },
      );
    });
  });

  describe('04-fish', () => {
    it('finned sashimi x-wing eliminates 4 from E6 and F6', () => {
      expectSound('finned-sashimi-xwing', '300002500000080060080700041700001300000070000008200005510008020030090000004500009', {
        eliminations: [
          { cell: rc(5, 6), digit: 4 },
          { cell: rc(6, 6), digit: 4 },
        ],
      });
    });

    it('finned sashimi swordfish eliminates 7 from A6', () => {
      expectSound('finned-sashimi-swordfish', '420000095000000000001903400060802010042010980090406030007604800000000000680000041', {
        eliminations: [{ cell: rc(1, 6), digit: 7 }],
      });
    });

    it('finned franken swordfish eliminates 8 from r3c7 (HoDoKu fff301)', () => {
      expectSound(
        'franken-mutant',
        '006700091009000062300000000000030004007200010400001000031008075000900000065000030',
        { eliminations: [{ cell: rc(3, 7), digit: 8 }] },
      );
    });
  });

  describe('05-single-digit-patterns', () => {
    it('rectangle elimination removes 9 from A2', () => {
      expectSound('rectangle-elimination', '200709006190000002080002030070503040000000000050904060060300090800000053900407001', {
        eliminations: [{ cell: rc(1, 2), digit: 9 }],
      });
    });

    it('broken wing double guardians eliminate 7 from G7 (SudokuWiki Guardian 2)', () => {
      expectSound(
        'broken-wing-guardian2',
        '103896520020753010090214063010569382200437195030182070002945031350621040001378250',
        { eliminations: [{ cell: rc(7, 7), digit: 7 }] },
      );
    });

    it('broken wing disruptive guardians eliminate 1 from G4 (SudokuWiki Guardian 3)', () => {
      expectSound(
        'broken-wing-guardian3',
        '070500030804003600030000000401020003763800521920310064007000000042900308010002070',
        { eliminations: [{ cell: rc(7, 4), digit: 1 }] },
      );
    });

    it('broken wing single guardian places 3 in D7 (SudokuWiki Guardian 1)', () => {
      expectSound(
        'broken-wing-guardian1',
        '008057600000000007040903000070590040900000001020084070000409010200000000003870500',
        { placements: [{ cell: rc(4, 7), digit: 3 }] },
      );
    });
  });

  describe('06-wings', () => {
    it('xy-wing eliminates 2 from E7', () => {
      expectSound('xy-wing', '034500000802060400600008000003900004050000090900005800000300008001040605000007120', {
        eliminations: [{ cell: rc(5, 7), digit: 2 }],
      });
    });

    it('xyz-wing eliminates 1 from F7', () => {
      expectSound('xyz-wing', '090001700500200008000030200070004960200060005069700030008090000700003009003800040', {
        eliminations: [{ cell: rc(6, 7), digit: 1 }],
      });
    });

    it('w-wing eliminates 3 from D6 and E6', () => {
      expectSound('w-wing', '000020007000507800057090030008900010700040008020001900090050740002109000600080000', {
        eliminations: [
          { cell: rc(4, 6), digit: 3 },
          { cell: rc(5, 6), digit: 3 },
        ],
      });
    });

    it('almost locked pair via xyz-wing example eliminates from starred cells', () => {
      // Bent-set ALP is subsumed by XYZ-Wing Example 1 (cited in bent-sets.md).
      expectSound('bent-sets-alp', '090001700500200008000030200070004960200060005069700030008090000700003009003800040', {
        eliminations: [{ cell: rc(6, 7), digit: 1 }],
      });
    });
  });

  describe('05-turbot-family', () => {
    it('skyscraper eliminates 1 from r1c78 and r3c45 (HoDoKu sk01)', () => {
      expectSound(
        'turbot-skyscraper',
        '000000000001902060000006790902000600370000950005000004140003005709024000000800000',
        {
          eliminations: [
            { cell: rc(1, 7), digit: 1 },
            { cell: rc(1, 8), digit: 1 },
            { cell: rc(3, 4), digit: 1 },
            { cell: rc(3, 5), digit: 1 },
          ],
        },
      );
    });
  });

  describe('07-coloring', () => {
    it('simple coloring color-trap eliminates 7 from r9c3', () => {
      expectSound('simple-coloring', '007000200000054009061000008300740905000000000508016002700000590800370000005000300', {
        eliminations: [{ cell: rc(9, 3), digit: 7 }],
      });
    });
  });

  describe('07-3d-medusa', () => {
    it('Rule 3 two-colors-in-cell eliminates 8 from C2', () => {
      expectSound(
        '3d-medusa-r3',
        '290000030000020070000109402800760200600000007009045008903407000060030000050000084',
        { eliminations: [{ cell: rc(3, 2), digit: 8 }] },
      );
    });

    it('Rule 4 two-colors-in-unit eliminates 6 from B1 and C8', () => {
      expectSound(
        '3d-medusa-r4',
        '100056000043090000800003002000000010950421037020000000300900005000010970000670001',
        {
          eliminations: [
            { cell: rc(2, 1), digit: 6 },
            { cell: rc(3, 8), digit: 6 },
          ],
        },
      );
    });

    it('Rule 1 twice-in-cell forces 1 in H1 (Jacobs corollary)', () => {
      expectSound(
        '3d-medusa-r1',
        '093804500005600000206070000020060040000208000070040090000010703000002600002507180',
        { placements: [{ cell: rc(8, 1), digit: 1 }] },
      );
    });

    it('Rule 5 unit+cell eliminates 1 and 7 from E5/E6 and 1 from F5', () => {
      expectSound(
        '3d-medusa-r5',
        '900407000876050004000200030060000100430000059005000060090002000200030486000708002',
        {
          eliminations: [
            { cell: rc(5, 5), digit: 1 },
            { cell: rc(5, 5), digit: 7 },
            { cell: rc(5, 6), digit: 7 },
            { cell: rc(6, 5), digit: 1 },
          ],
        },
      );
    });

    it('Rule 2 exemplar 3 is uniquely solvable (SudokuWiki)', () => {
      const result = checkPuzzle('000000009010503000003290700400001300900050008006300005008037400000108060700000000');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('Rule 2 exemplar 4 is uniquely solvable (SudokuWiki)', () => {
      const result = checkPuzzle('900008007000000060000710403005030006009802000100090800403059000050000000700600000');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('Rule 2 twice-in-unit eliminates yellow 7s from column 7 (SudokuWiki FTS)', () => {
      expectSound(
        '3d-medusa-r2',
        '300050000250300010004607500090200805070000030408005060005408300030006084000020006',
        {
          eliminations: [
            { cell: rc(1, 7), digit: 7 },
            { cell: rc(2, 7), digit: 7 },
            { cell: rc(8, 7), digit: 7 },
            { cell: rc(9, 7), digit: 7 },
          ],
        },
      );
    });

    it('Rule 2 global yellow-7 purge eliminates 16 candidates (SudokuWiki Load state)', () => {
      expectSound(
        '3d-medusa-r2-global',
        '300050000250300010004607500090200805070000030408005060005408300030006084000020006',
        {
          eliminations: [
            { cell: rc(1, 3), digit: 7 },
            { cell: rc(1, 7), digit: 7 },
            { cell: rc(1, 8), digit: 7 },
            { cell: rc(2, 7), digit: 7 },
            { cell: rc(2, 9), digit: 7 },
            { cell: rc(4, 8), digit: 7 },
            { cell: rc(6, 4), digit: 7 },
            { cell: rc(6, 9), digit: 7 },
            { cell: rc(7, 1), digit: 7 },
            { cell: rc(7, 5), digit: 7 },
            { cell: rc(7, 9), digit: 7 },
            { cell: rc(8, 3), digit: 7 },
            { cell: rc(8, 5), digit: 7 },
            { cell: rc(8, 7), digit: 7 },
            { cell: rc(9, 3), digit: 7 },
            { cell: rc(9, 7), digit: 7 },
          ],
        },
      );
    });

    it('Rule 2 exemplar 5 is uniquely solvable (SudokuWiki)', () => {
      const result = checkPuzzle('001042000000309000790000080408000900009618200005000806050000031000403000000170600');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('Rule 2 exemplar 8 is uniquely solvable (SudokuWiki)', () => {
      const result = checkPuzzle('009010500040500090200003017000060008000209000700030000960100002030008070005020600');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });
  });

  describe('08-chains', () => {
    it('xy-chain eliminates 5 from cells seeing both endpoints', () => {
      expectSound('xy-chain', '080103070000000000001408020570001039000609000920800051030905200000000000010702060', {
        eliminations: [
          { cell: rc(1, 3), digit: 5 },
          { cell: rc(3, 7), digit: 5 },
          { cell: rc(3, 9), digit: 5 },
        ],
      });
    });

    it('aic-with-ur Rule 2 places 2 in C5 (SudokuWiki Example A)', () => {
      expectSound('aic-with-ur', '010070050004000000600100003009435800020800100008002004050009030300080009000000500', {
        placements: [{ cell: rc(3, 5), digit: 2 }],
      });
    });

    it('aic-with-ur Example B UR loop forces D6<>9 and places 6 in G6', () => {
      expectSound(
        'aic-with-ur-b',
        '006050900100263007000800000020000008500000070009310600000030000700981006001700400',
        {
          eliminations: [{ cell: rc(4, 6), digit: 9 }],
          placements: [{ cell: rc(7, 6), digit: 6 }],
        },
      );
    });

    it('twinned xy-chain Example A Load Example S9B is a restored post-solve state', () => {
      const s9b =
        'S9B9f0887049i021u923m9o80805y060544800106808g01d2ba4k8g6i7x078t1ubucb03234a0r0508020u1r09071m038r8r5udmcb5f23020h8sak1u011m3o1w03051s3k464g5a391h090l1l1l09140704081u';
      const fromStart = '080402000000065001600100000070000300058200970300000002800010003500000009000907480';
      const decoded = decodeS9B(s9b);
      // Load Example carries solved cells beyond givens (e.g. r6c7=8) — not identical to From the Start.
      expect(decoded.givens).not.toBe(fromStart);
      expect(checkPuzzle(fromStart).unique).toBe(true);
      expect(checkPuzzle(decoded.givens).unique).toBe(true);
    });

    it('twinned xy-chain Example B off-chain eliminations along row A spine', () => {
      expectSound(
        'twinned-xy-chains-b',
        '850900000000010000067030400020300009003050600600001070006040510000070000000003082',
        {
          eliminations: [
            { cell: rc(1, 5), digit: 2 },
            { cell: rc(9, 7), digit: 1 },
            { cell: rc(1, 3), digit: 2 },
            { cell: rc(1, 6), digit: 2 },
            { cell: rc(1, 9), digit: 1 },
          ],
        },
      );
    });

    it('twinned xy-chain Example C strips foreign digits from F3 locked-set wing', () => {
      expectSound(
        'twinned-xy-chains-c',
        '270000400009120300000009080000300509000010000620007000002500000080074050040000906',
        {
          eliminations: [
            { cell: rc(6, 3), digit: 3 },
            { cell: rc(6, 3), digit: 4 },
          ],
        },
      );
    });

    it('twinned xy-chain Example A naked sextuple off-chain eliminations (Nils Leder)', () => {
      expectSound(
        'twinned-xy-chains-a',
        '080402000000065001600100000070000300058200970300000002800010003500000009000907480',
        {
          eliminations: [
            { cell: rc(1, 1), digit: 1 },
            { cell: rc(4, 1), digit: 1 },
            { cell: rc(9, 2), digit: 2 },
            { cell: rc(9, 3), digit: 2 },
            { cell: rc(1, 5), digit: 3 },
            { cell: rc(3, 5), digit: 3 },
            { cell: rc(8, 5), digit: 3 },
            { cell: rc(5, 6), digit: 4 },
            { cell: rc(1, 9), digit: 6 },
            { cell: rc(4, 9), digit: 6 },
          ],
        },
      );
    });
  });

  describe('07-multi-coloring', () => {
    it('multi-colors type 1 eliminates 1 from r5c23 (HoDoKu mc01)', () => {
      expectSound(
        'multi-coloring-mc01',
        '000006000007030040106080095700900850900040020400008000093050010000007000000060002',
        {
          eliminations: [
            { cell: rc(5, 2), digit: 1 },
            { cell: rc(5, 3), digit: 1 },
          ],
        },
      );
    });

    it('multi-colors type 2 eliminates 3 from r6c2, r7c3, r8c6 (HoDoKu mc02)', () => {
      expectSound(
        'multi-coloring-mc02',
        '.17....28.8..4...........7...4.9...696...7..15....2..............891.54...58..31.'.replace(
          /\./g,
          '0',
        ),
        {
          eliminations: [
            { cell: rc(6, 2), digit: 3 },
            { cell: rc(7, 3), digit: 3 },
            { cell: rc(8, 6), digit: 3 },
          ],
        },
      );
    });

    it('X-Colors Example 1 promotion trap eliminates 2 from r2c8 (Sudopedia)', () => {
      expectSound('x-colors-ex1', '401708003000501000000002017802604071000000000140809306900200000000003000500406108', {
        eliminations: [{ cell: rc(2, 8), digit: 2 }],
      });
    });

    it('X-Colors Example 2 multi-iteration promotion eliminates 6 from r1c1 and r1c3 (Sudopedia)', () => {
      expectSound('x-colors-ex2', '000084000080309000001257800240090058108405900060728431710942086000800000804500109', {
        eliminations: [
          { cell: rc(1, 1), digit: 6 },
          { cell: rc(1, 3), digit: 6 },
        ],
      });
    });

    it('X-Colors Example 3 wrap places 8 in r1c8, r7c2, r9c5 and eliminates from r2c7 and r2c9 (Sudopedia)', () => {
      expectSound('x-colors-ex3', '092700604040060000076020593050148762020090005061572030204030050030010000600209340', {
        eliminations: [
          { cell: rc(2, 7), digit: 8 },
          { cell: rc(2, 9), digit: 8 },
        ],
        placements: [
          { cell: rc(1, 8), digit: 8 },
          { cell: rc(7, 2), digit: 8 },
          { cell: rc(9, 5), digit: 8 },
        ],
      });
    });

    it('X-Colors Example 4 iterated promotion eliminates 5 from r8c7 and r8c8 (Sudopedia)', () => {
      expectSound('x-colors-ex4', '401708003000501000000002017802604971000000000140809306900200000000003000500406108', {
        eliminations: [
          { cell: rc(8, 7), digit: 5 },
          { cell: rc(8, 8), digit: 5 },
        ],
      });
    });

    it('X-Colors Example 5 column contradiction places 3 in r8c6 (Sudopedia)', () => {
      expectSound('x-colors-ex5', '276900001800001760031007002090002006000000000600300050700806090062500804180004600', {
        placements: [{ cell: rc(8, 6), digit: 3 }],
      });
    });

    it('X-Colors Example 6 house-empty rule places 1 in r2c7 and r3c4 (Sudopedia)', () => {
      expectSound('x-colors-ex6', '001583674437620000568074000000005400046012800005400000004250003000047520852390740', {
        placements: [
          { cell: rc(2, 7), digit: 1 },
          { cell: rc(3, 4), digit: 1 },
        ],
      });
    });

    it('X-Colors augmented with pointing pair eliminates 8 from r3c1 (Sudopedia ER)', () => {
      expectSound('x-colors-er', '300407800070063400040501370004070003200304009003100040001040530480035900530019604', {
        eliminations: [{ cell: rc(3, 1), digit: 8 }],
      });
    });
  });

  describe('11-exotic', () => {
    it('sue de coq basic 2/4 eliminates from row and box (HoDoKu sdc01)', () => {
      expectSound(
        'sue-de-coq-sdc01',
        '008307009260000300000000040300052108704008005050000000080006007000005200001000000',
        {
          eliminations: [
            { cell: rc(7, 5), digit: 4 },
            { cell: rc(7, 8), digit: 5 },
            { cell: rc(8, 1), digit: 9 },
            { cell: rc(9, 1), digit: 9 },
          ],
        },
      );
    });

    it('sue de coq basic 3/5 locked-inside eliminates 4 (HoDoKu sdc02)', () => {
      expectSound(
        'sue-de-coq-sdc02',
        '000728400102030070000100009680000000000009601000050008700400000006000390501000000',
        {
          eliminations: [
            { cell: rc(7, 8), digit: 2 },
            { cell: rc(9, 8), digit: 2 },
            { cell: rc(4, 9), digit: 4 },
            { cell: rc(9, 8), digit: 4 },
            { cell: rc(1, 9), digit: 5 },
            { cell: rc(4, 9), digit: 5 },
            { cell: rc(1, 9), digit: 6 },
          ],
        },
      );
    });

    it('MSLS Example 2 rank-0 MS-NS eliminates 17 candidates (David P Bird)', () => {
      expectSound(
        'msls-ex2',
        '3.....9...7...1.5...2.....4....76.1....3.5....6.81....4.....2...5.6...8...9.....3'.replace(
          /\./g,
          '0',
        ),
        {
          eliminations: [
            { cell: rc(1, 3), digit: 4 },
            { cell: rc(1, 9), digit: 2 },
            { cell: rc(2, 5), digit: 6 },
            { cell: rc(2, 5), digit: 8 },
            { cell: rc(3, 1), digit: 9 },
            { cell: rc(3, 7), digit: 3 },
            { cell: rc(4, 2), digit: 8 },
            { cell: rc(5, 2), digit: 1 },
            { cell: rc(5, 2), digit: 8 },
            { cell: rc(5, 8), digit: 6 },
            { cell: rc(5, 8), digit: 7 },
            { cell: rc(6, 8), digit: 7 },
            { cell: rc(7, 3), digit: 3 },
            { cell: rc(7, 9), digit: 9 },
            { cell: rc(8, 6), digit: 7 },
            { cell: rc(9, 1), digit: 2 },
            { cell: rc(9, 7), digit: 4 },
          ],
        },
      );
    });

    it('MSLS Example 3 balanced rank-0 MS-NS eliminates 13 candidates (David P Bird)', () => {
      expectSound(
        'msls-ex3',
        '98.7.....6.7...8......85...4...3..2..9....6.......1..4.6.5..9......4...3.....2.1.'.replace(
          /\./g,
          '0',
        ),
        {
          eliminations: [
            { cell: rc(1, 7), digit: 5 },
            { cell: rc(2, 4), digit: 9 },
            { cell: rc(3, 8), digit: 3 },
            { cell: rc(3, 8), digit: 4 },
            { cell: rc(3, 9), digit: 1 },
            { cell: rc(3, 9), digit: 2 },
            { cell: rc(4, 9), digit: 1 },
            { cell: rc(5, 1), digit: 5 },
            { cell: rc(5, 1), digit: 7 },
            { cell: rc(5, 1), digit: 8 },
            { cell: rc(5, 3), digit: 5 },
            { cell: rc(5, 3), digit: 8 },
            { cell: rc(5, 4), digit: 8 },
          ],
        },
      );
    });

    it('MSLS Example 1 rank-0 multi-sector naked set eliminates 21 candidates (David P Bird)', () => {
      expectSound(
        'msls-ex1',
        '1......8......92....6.3...52....8.....5.7.....6.5....4..47...........91..3..6...7'.replace(
          /\./g,
          '0',
        ),
        {
          eliminations: [
            { cell: rc(1, 6), digit: 2 },
            { cell: rc(2, 1), digit: 8 },
            { cell: rc(3, 2), digit: 4 },
            { cell: rc(3, 2), digit: 7 },
            { cell: rc(3, 4), digit: 4 },
            { cell: rc(4, 7), digit: 1 },
            { cell: rc(4, 8), digit: 9 },
            { cell: rc(5, 2), digit: 4 },
            { cell: rc(5, 4), digit: 3 },
            { cell: rc(5, 4), digit: 4 },
            { cell: rc(5, 4), digit: 6 },
            { cell: rc(5, 9), digit: 3 },
            { cell: rc(5, 9), digit: 6 },
            { cell: rc(6, 3), digit: 3 },
            { cell: rc(6, 3), digit: 7 },
            { cell: rc(7, 2), digit: 5 },
            { cell: rc(7, 5), digit: 5 },
            { cell: rc(7, 9), digit: 3 },
            { cell: rc(7, 9), digit: 6 },
            { cell: rc(8, 1), digit: 8 },
            { cell: rc(8, 6), digit: 2 },
          ],
        },
      );
    });

    it('easter monster outer-link SK-Loop eliminates 3 and 8 from B5 and B6', () => {
      expectSound(
        'sk-loop-easter-monster',
        '100000002090400050006000700050903000000070000000850040700000600030009080002000001',
        {
          eliminations: [
            { cell: rc(2, 5), digit: 3 },
            { cell: rc(2, 5), digit: 8 },
            { cell: rc(2, 6), digit: 3 },
            { cell: rc(2, 6), digit: 8 },
          ],
        },
      );
    });

    it('easter monster inner-link SK-Loop eliminates loop digits outside mini-rows/columns', () => {
      expectSound(
        'sk-loop-easter-monster-inner',
        '100000002090400050006000700050903000000070000000850040700000600030009080002000001',
        {
          eliminations: [
            // box A (B1): inner {2,7}
            { cell: rc(1, 3), digit: 2 },
            { cell: rc(1, 3), digit: 7 },
            { cell: rc(3, 1), digit: 2 },
            { cell: rc(3, 1), digit: 7 },
            { cell: rc(3, 3), digit: 2 },
            { cell: rc(3, 3), digit: 7 },
            // box C (B3): inner {1,6}
            { cell: rc(1, 7), digit: 1 },
            { cell: rc(1, 7), digit: 6 },
            { cell: rc(1, 9), digit: 1 },
            { cell: rc(1, 9), digit: 6 },
            { cell: rc(3, 7), digit: 1 },
            { cell: rc(3, 7), digit: 6 },
            { cell: rc(3, 9), digit: 1 },
            { cell: rc(3, 9), digit: 6 },
            // box G (B7): inner {4,8}
            { cell: rc(7, 1), digit: 4 },
            { cell: rc(7, 1), digit: 8 },
            { cell: rc(7, 3), digit: 4 },
            { cell: rc(7, 3), digit: 8 },
            { cell: rc(9, 1), digit: 4 },
            { cell: rc(9, 3), digit: 4 },
            { cell: rc(9, 3), digit: 8 },
            // box I (B9): inner {2,7}
            { cell: rc(7, 7), digit: 2 },
            { cell: rc(7, 7), digit: 7 },
            { cell: rc(7, 9), digit: 2 },
            { cell: rc(7, 9), digit: 7 },
            { cell: rc(9, 7), digit: 2 },
            { cell: rc(9, 7), digit: 7 },
            { cell: rc(9, 9), digit: 2 },
            { cell: rc(9, 9), digit: 7 },
          ],
        },
      );
    });

    it('type 3-1-3-1 SK-Loop puzzle is uniquely solvable (SudokuWiki)', () => {
      const result = checkPuzzle('100020003040000050006000700000506000800090001000300000007000600050000090200030008');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('SK-Loop with solved cells is uniquely solvable (SudokuWiki)', () => {
      const result = checkPuzzle('200000004080500070001020300000700090000060000070008000003000100090007050400001002');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('subset exclusion Sudopedia example eliminates 7 from r2c4', () => {
      expectSound(
        'subset-exclusion-sudopedia',
        '193008602008030001004100389371495268580010403240080015437021806002000034005000027',
        { eliminations: [{ cell: rc(2, 4), digit: 7 }] },
      );
    });

    it('sue de coq extended eliminates from row/box (HoDoKu sdc03)', () => {
      expectSound(
        'sue-de-coq-sdc03',
        '..1..8.2.8...9.64.5.2.....7.8..2.........9..3...41..............6.9..51...714..6.'.replace(
          /\./g,
          '0',
        ),
        {
          eliminations: [
            { cell: rc(7, 1), digit: 2 },
            { cell: rc(7, 1), digit: 4 },
            { cell: rc(4, 3), digit: 5 },
            { cell: rc(5, 3), digit: 5 },
            { cell: rc(6, 2), digit: 5 },
            { cell: rc(4, 3), digit: 9 },
          ],
        },
      );
    });

    it('sue de coq extended eliminates from row/box (HoDoKu sdc04)', () => {
      expectSound(
        'sue-de-coq-sdc04',
        '..4....9765.....2191...73.42.1.3....5.32.6...............6........1746..7...9..1.'.replace(
          /\./g,
          '0',
        ),
        {
          eliminations: [
            { cell: rc(7, 8), digit: 3 },
            { cell: rc(7, 8), digit: 5 },
            { cell: rc(5, 7), digit: 7 },
            { cell: rc(5, 8), digit: 7 },
            { cell: rc(4, 9), digit: 8 },
            { cell: rc(6, 9), digit: 8 },
            { cell: rc(5, 8), digit: 8 },
            { cell: rc(4, 9), digit: 9 },
            { cell: rc(6, 9), digit: 9 },
            { cell: rc(5, 6), digit: 9 },
            { cell: rc(5, 7), digit: 9 },
          ],
        },
      );
    });

    it('fireworks triple F1|F4|C4 locked set eliminates 4/5/6 from C4', () => {
      expectSound(
        'fireworks-triple-f4',
        '230008005060200000000090100006000320403000501025000900007080000000002070100900058',
        {
          eliminations: [
            { cell: rc(3, 4), digit: 4 },
            { cell: rc(3, 4), digit: 5 },
            { cell: rc(3, 4), digit: 6 },
          ],
        },
      );
    });

    it('fireworks quad exemplar (Cobra Roll) is uniquely solvable', () => {
      const result = checkPuzzle('002300500010040090000500006076000000800020040900000803000005002000006010000870000');
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it.each([
      ['exemplar-1', '609000015000050000030000080000007000207004600100800003000080034900020000400105070'],
      ['exemplar-2', '000902300507600000600807005000300600070000010800010000400080000002000094905400000'],
      ['exemplar-3', '000400300060907005080201000004000010000700000190005006000000803000006001740000060'],
      ['exemplar-4', '100000400000010000098000006000420000700005300002086700900000005300002000470600000'],
      ['exemplar-5', '500007038000908002070000150340100000000000800200060000003600009000009040706000000'],
      ['exemplar-6', '001036850009005000000000000000050900600000023120900000000080004410000700036090010'],
      ['exemplar-7', '004008007000060000500100028000400096000070080300000210100003470027000000050010000'],
    ])('fireworks %s is uniquely solvable', (_id, puzzle) => {
      const result = checkPuzzle(puzzle);
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('exocet rule 1 eliminates non-base digits from target cells', () => {
      expectSound(
        'exocet-r1',
        '007020004930000600600300000000000050200010008006900400003700900020050001000008000',
        {
          eliminations: [
            { cell: rc(2, 4), digit: 4 },
            { cell: rc(3, 7), digit: 2 },
            { cell: rc(3, 7), digit: 7 },
          ],
        },
      );
    });
  });

  describe('11-exotic/aligned-exclusion', () => {
    it('APE type 1 eliminates 8 from base pair G2/G3', () => {
      expectSound(
        'aligned-exclusion-ape1',
        '090000040030040700000670003200900506006000100104008007700091000009030050060000070',
        {
          eliminations: [
            { cell: rc(7, 2), digit: 8 },
            { cell: rc(7, 3), digit: 8 },
          ],
        },
      );
    });

    it('APE type 2 eliminates 8 from B1 (non-aligned pair)', () => {
      expectSound(
        'aligned-exclusion-ape4',
        '004003600000040002900600005700500030000367000050004001200005009500010000003200800',
        { eliminations: [{ cell: rc(2, 1), digit: 8 }] },
      );
    });

    it('APE example 3 eliminates 7 from B3', () => {
      expectSound(
        'aligned-exclusion-ape3',
        '000000370706000000000102009007030500530406028004010900600305000000000403083000000',
        { eliminations: [{ cell: rc(2, 3), digit: 7 }] },
      );
    });

    it('APE example 6 eliminates 6 from D1', () => {
      expectSound(
        'aligned-exclusion-ape6',
        '000000106002590000308040000080000070000204000090070040000050603000038900105000000',
        { eliminations: [{ cell: rc(4, 1), digit: 6 }] },
      );
    });
  });

  describe('s9b decoder', () => {
    it('twinned Example A Load Example eliminations pass restored-state check', () => {
      const s9b =
        'S9B9f0887049i021u923m9o80805y060544800106808g01d2ba4k8g6i7x078t1ubucb03234a0r0508020u1r09071m038r8r5udmcb5f23020h8sak1u011m3o1w03051s3k464g5a391h090l1l1l09140704081u';
      const result = verifyRestoredStepSoundness(s9b, {
        strategyId: 'twinned-xy-chains',
        difficulty: 100,
        placements: [],
        eliminations: [
          { cell: rc(1, 1), digit: 1 },
          { cell: rc(4, 1), digit: 1 },
          { cell: rc(9, 2), digit: 2 },
          { cell: rc(9, 3), digit: 2 },
          { cell: rc(1, 5), digit: 3 },
          { cell: rc(3, 5), digit: 3 },
          { cell: rc(8, 5), digit: 3 },
          { cell: rc(5, 6), digit: 4 },
          { cell: rc(1, 9), digit: 6 },
          { cell: rc(4, 9), digit: 6 },
        ],
        highlights: { cells: [], candidates: [], links: [] },
      });
      expect(result.ok).toBe(true);
    });

    it('aic-with-ur Example B explore option 4 weak-link eliminations pass restored-state check', () => {
      const s9b =
        'S9B4g4e060a050g090w0o010i160206030h16070o120g087u7u110f150f020u160g8a0n7n08050a4e0f7u440o07804a0g09030144061018b64y4k1603220g438507160s0908011414067q5i01070b1u04b682';
      const result = verifyRestoredStepSoundness(s9b, {
        strategyId: 'aic-with-ur',
        difficulty: 100,
        placements: [],
        eliminations: [
          { cell: rc(9, 5), digit: 5 },
          { cell: rc(9, 6), digit: 6 },
        ],
        highlights: { cells: [], candidates: [], links: [] },
      });
      expect(result.ok).toBe(true);
    });

    it('Brenner 8-cell APE Load Example eliminations pass restored-state check', () => {
      const s9b =
        'S9B1307028308120604821b0906070l1c0814101a1208067o1ca0a0019u109u03ad1g7p08040608017u9o2c88889w9i0o047n05087p069g02012q080309042q0608049u02363m9u01039u0603162i019w9w08';
      const result = verifyRestoredStepSoundness(s9b, {
        strategyId: 'aligned-exclusion',
        difficulty: 100,
        placements: [],
        eliminations: [
          { cell: rc(4, 5), digit: 1 },
          { cell: rc(5, 5), digit: 4 },
        ],
        highlights: { cells: [], candidates: [], links: [] },
      });
      expect(result.ok).toBe(true);
    });

    it('decodes fireworks Load Example givens to match From the Start', () => {
      const s9b =
        'S9B02037v1n1n080g8i059u067n022v2v0h7q0d2q5u4a3y093y011i0bb60a064q168a03020g049e03360baa050h015u02055y2f2f090d0f1i82072208220b0a7q1ibmb61v1v020d077q010d0b092e2e0f0508';
      const fromStart = '230008005060200000000090100006000320403000501025000900007080000000002070100900058';
      expect(decodeS9B(s9b).givens).toBe(fromStart);
      expect(puzzleFromBd(s9b)).toBe(fromStart);
      expect(puzzleFromBd(fromStart)).toBe(fromStart);
    });
  });

  describe('10-uniqueness', () => {
    it('avoidable rectangle type 1 eliminates 9 from r2c9 (HoDoKu ar101)', () => {
      expectSound(
        'avoidable-rectangle-ar101',
        '.5........6.5.42....8.71...4....36.8.........89.1..7..3...........2.7.1..72.3..9.'.replace(
          /\./g,
          '0',
        ),
        { eliminations: [{ cell: rc(2, 9), digit: 9 }] },
      );
    });

    it('avoidable rectangle type 1 eliminates 3 from r5c7 (HoDoKu ar102)', () => {
      expectSound(
        'avoidable-rectangle-ar102',
        '086040000200000000100076090000407000800090000009683070000752008000000045700300100',
        { eliminations: [{ cell: rc(5, 7), digit: 3 }] },
      );
    });

    it('avoidable rectangle type 2 eliminates 9 from column 3 and rows 7-8 (HoDoKu ar201)', () => {
      expectSound(
        'avoidable-rectangle-ar201',
        '900000600001006038706080000000000076004100000050947020200000005000250000000090001',
        {
          eliminations: [
            { cell: rc(4, 3), digit: 9 },
            { cell: rc(7, 2), digit: 9 },
            { cell: rc(8, 2), digit: 9 },
          ],
        },
      );
    });

    it('avoidable rectangle type 2 eliminates 9 from seven cells (HoDoKu ar202)', () => {
      expectSound(
        'avoidable-rectangle-ar202',
        '085000060000004700030000100000000050600043000070820300000459670000000000904160003',
        {
          eliminations: [
            { cell: rc(1, 7), digit: 9 },
            { cell: rc(8, 7), digit: 9 },
            { cell: rc(4, 9), digit: 9 },
            { cell: rc(5, 9), digit: 9 },
            { cell: rc(6, 9), digit: 9 },
            { cell: rc(5, 8), digit: 9 },
            { cell: rc(6, 8), digit: 9 },
          ],
        },
      );
    });

    it('SudokuWiki Frisbee Load Example S9B decodes to a unique givens puzzle', () => {
      const s9b =
        'S9B1u2b040i2q021v03084i2b02066e2e17170903095e044i0a071w10900301082c9e1u1w04901g3m130d7q4j5h2t04446a0z0l0603092t444c090n0n054a0706011m1i0g0i08021612070546020f0d09430n';
      const fromStart = '004002038002600009390400700031800004000000000400006390009005076100008200750200900';
      expect(decodeS9B(s9b).givens).toBe(fromStart);
      const result = checkPuzzle(fromStart);
      expect(result.solvable).toBe(true);
      expect(result.unique).toBe(true);
    });

    it('SudokuWiki AVR narrative Type 1 places 9 in r2c4 (B4)', () => {
      // Top-third givens from 04-AVR2.png; rows 4–9 from 03-AVR1.png full grid (unique puzzle).
      expectSound(
        'avoidable-rectangle-sudokuwiki-b4',
        '500403001000000000040020039475632198926158437138749652813275946297864315654391287',
        {
          eliminations: [{ cell: rc(2, 4), digit: 8 }],
          placements: [{ cell: rc(2, 4), digit: 9 }],
        },
      );
    });
  });
});