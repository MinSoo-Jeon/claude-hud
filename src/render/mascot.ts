import { RESET } from './colors.ts';
import type { Frame } from './frame.ts';

type Palette = Record<string, [number, number, number]>;

interface Mascot {
  palette: Palette;
  /** One character per pixel, '.' = transparent. */
  art: string[];
}

const ORANGE: Mascot = {
  palette: {
    K: [0, 0, 0],
    O: [232, 148, 63],
    R: [224, 118, 40],
    Y: [249, 224, 79],
    W: [248, 248, 240],
    D: [68, 60, 63],
    T: [224, 208, 144],
  },
  // 21 columns x 19 rows
  art: [
    '.................K...',
    '.....KKK........KRK..',
    '...KKOORK.......KRRK.',
    '..KOOOOORK......KRRK.',
    '..KOOOOOOK.....KRRORK',
    '.KOOOOROOOK....KROYRK',
    '.KOOORWKOOK....KRYYRK',
    'KOOOORDKORK.....KYRK.',
    'KOOOOOKKRRK.....KOK..',
    '.KROOORRRRRK....KOK..',
    '..KKRRRRRRRK...KOOK..',
    '....KKTRRDRRK.KROK...',
    '.....KTTDRORRKRRRK...',
    '.....KTTDORDRRDRK....',
    '....KRRTTDDRRRDK.....',
    '....KWRDTTRRRRK......',
    '.....KKKKDRRRK.......',
    '.........KWRWK.......',
    '..........KKK........',
  ],
};

const BUNNY: Mascot = {
  palette: {
    K: [60, 30, 25],
    T: [253, 246, 200],
    P: [240, 190, 200],
    W: [255, 255, 255],
  },
  // 26 columns x 37 rows
  art: [
    '.........KK.....KK........',
    '........KPTK...KTPK.......',
    '........KPPTK.KTPPK.......',
    '........KPPTK.KTPPK.......',
    '........KPPTK.KTPPK.......',
    '........KPPTK.KTPPK.......',
    '........KPPTK.KTPPK.......',
    '........KPPTK.KTPPK.......',
    '.........KPTK.KTPK........',
    '.........KTTK.KTTK........',
    '......KKTTTTKKKTTTTKK.....',
    '....KKTTTTTTTTTTTTTTTK....',
    '...KTTTTKKTTTTTTKKTTTTK...',
    '..KTTTTKTTTTTTTTTTKTTTTK..',
    '.KTTTTKTTTTTTTTTTTTKTTTTK.',
    '.KTTTKTTTTTTTTTTTTTTKTTTK.',
    'KTTTTKTTTTTTTTTTTTTTKTTTTK',
    'KTTTTTTTKKTTTTTTKKTTTTTTTK',
    'KTTTTTTKKWKTTTTKKWKTTTTTTK',
    'KTTTTTTKWKKTTTTKWKKTTTTTTK',
    'KTTTPPPTKKTTTTTTKKTPPPTTTK',
    'KTTPKPKPTTTTTKTTTTPKPKPTTK',
    'KTTPKPKPTTTKTKTKTTPKPKPTTK',
    'KTTTPPPTTTTTKTKTTTTPPPTTTK',
    '.KTTTTTTTTTTTTTTTTTTTTTTK.',
    '..KTTTTTTTTTKKTTTTTTTTTK..',
    '...KKTTTTTTTTTTTTTTTTTKK..',
    '...KTTTTTTTTTTTTTTTTTTTK..',
    '...KTKTTTTTTTTTTTTTTTKTK..',
    '...KTKTTTTTTTTTTTTTTTKTK..',
    '....KTTTTTTTTTTTTTTTTKK...',
    '.....KTTTTTTTTTTTTTTTK....',
    '.....KTTTTTTTTTTTTTTTK....',
    '.....KTTTTTTTTTTTTTTTK....',
    '.....KTKKKTTTTTTTKKKTK....',
    '.....KTK..KKKKKKK..KTK....',
    '......K.............K.....',
  ],
};

const MASCOTS: Mascot[] = [ORANGE, BUNNY];

export const MASCOT_GAP = 2;
// Narrower terminals drop the mascot rather than squeeze the HUD beside it.
const MIN_TEXT_WIDTH = 40;

const fg = ([r, g, b]: number[]) => `\x1b[38;2;${r};${g};${b}m`;
const bg = ([r, g, b]: number[]) => `\x1b[48;2;${r};${g};${b}m`;

/** The mascot as terminal rows: each row packs two pixel rows into half-block cells. */
function toLines({ palette, art }: Mascot): string[] {
  const width = art[0].length;
  const rows = art.length % 2 === 0 ? art : [...art, '.'.repeat(width)];
  const lines: string[] = [];
  for (let y = 0; y < rows.length; y += 2) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const top = palette[rows[y][x]];
      const bottom = palette[rows[y + 1][x]];
      if (top && bottom) line += `${fg(top)}${bg(bottom)}▀${RESET}`;
      else if (top) line += `${fg(top)}▀${RESET}`;
      else if (bottom) line += `${fg(bottom)}▄${RESET}`;
      else line += ' ';
    }
    lines.push(line);
  }
  return lines;
}

export interface MascotDraw {
  lines: string[];
  width: number;
}

const DRAWS: MascotDraw[] = MASCOTS.map((m) => ({ lines: toLines(m), width: m.art[0].length }));

/** FNV-1a: a stable hash, so a session keeps the mascot it started with. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** The mascot for this session, picked from the session id; the first one when the payload has none. */
export function pickMascot(f: Frame): MascotDraw {
  const id = typeof f.stdin.session_id === 'string' ? f.stdin.session_id.trim() : '';
  return DRAWS[id ? hash(id) % DRAWS.length : 0];
}

/** Whether this frame draws the mascot: it is on and, when the width is known, leaves the HUD room. */
export function mascotShown(f: Frame): boolean {
  return f.config?.display?.mascot === true && (f.width === null || f.width - pickMascot(f).width - MASCOT_GAP >= MIN_TEXT_WIDTH);
}
