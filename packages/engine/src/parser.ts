/**
 * OpenSudoku parser (FR-2).
 *
 * The .opensudoku files are simple XML: a <folder name="..."> containing many
 * <game data="<81 chars>" ... /> elements. The data string is row-major, '0' = empty.
 *
 * We extract with a regex rather than a full XML parser: the format is flat and
 * regular, and the files are large (up to ~65MB), so avoiding a DOM tree keeps
 * memory and dependencies down.
 */

export interface ParsedPuzzle {
  /** Folder/difficulty label the puzzle came from. */
  folder: string;
  /** 81-char row-major puzzle string, '0' = empty. */
  data: string;
}

const GAME_RE = /<game\b[^>]*\bdata="(\d{81})"[^>]*\/?>/g;
const FOLDER_RE = /<folder\b[^>]*\bname="([^"]*)"/g;

/**
 * Parse the full contents of an .opensudoku file. Returns every game with the
 * name of the folder it appears in.
 */
export function parseOpenSudoku(xml: string): ParsedPuzzle[] {
  // Index folder boundaries so each game can be attributed to its folder.
  const folders: { start: number; name: string }[] = [];
  for (const m of xml.matchAll(FOLDER_RE)) {
    folders.push({ start: m.index ?? 0, name: m[1] ?? '' });
  }
  const folderAt = (pos: number): string => {
    let name = '';
    for (const f of folders) {
      if (f.start <= pos) name = f.name;
      else break;
    }
    return name;
  };

  const out: ParsedPuzzle[] = [];
  for (const m of xml.matchAll(GAME_RE)) {
    const data = m[1]!;
    out.push({ folder: folderAt(m.index ?? 0), data });
  }
  return out;
}

/** Validate that a string is a legal 81-char puzzle (digits 0-9 only). */
export function isValidPuzzleString(s: string): boolean {
  return /^[0-9]{81}$/.test(s);
}
