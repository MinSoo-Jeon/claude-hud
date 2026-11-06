import { RESET } from './colors.ts';
import type { Frame } from './frame.ts';

const PALETTE: Record<string, [number, number, number]> = {
  K: [0, 0, 0],
  O: [232, 148, 63],
  R: [224, 118, 40],
  Y: [249, 224, 79],
  W: [248, 248, 240],
  D: [68, 60, 63],
  T: [224, 208, 144],
};

// 21 columns x 19 rows, '.' = transparent
const ART = [
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
];

export const MASCOT_WIDTH = ART[0].length;
export const MASCOT_GAP = 2;
// Narrower terminals drop the mascot rather than squeeze the HUD beside it.
const MIN_TEXT_WIDTH = 40;

/** Whether this frame draws the mascot: it is on and, when the width is known, leaves the HUD room. */
export function mascotShown(f: Frame): boolean {
  return f.config?.display?.mascot === true && (f.width === null || f.width - MASCOT_WIDTH - MASCOT_GAP >= MIN_TEXT_WIDTH);
}

const fg = ([r, g, b]: number[]) => `\x1b[38;2;${r};${g};${b}m`;
const bg = ([r, g, b]: number[]) => `\x1b[48;2;${r};${g};${b}m`;

/** The mascot as terminal rows: each row packs two pixel rows into half-block cells. */
export const MASCOT_LINES: string[] = (() => {
  const rows = ART.length % 2 === 0 ? ART : [...ART, '.'.repeat(MASCOT_WIDTH)];
  const lines: string[] = [];
  for (let y = 0; y < rows.length; y += 2) {
    let line = '';
    for (let x = 0; x < MASCOT_WIDTH; x++) {
      const top = PALETTE[rows[y][x]];
      const bottom = PALETTE[rows[y + 1][x]];
      if (top && bottom) line += `${fg(top)}${bg(bottom)}▀${RESET}`;
      else if (top) line += `${fg(top)}▀${RESET}`;
      else if (bottom) line += `${fg(bottom)}▄${RESET}`;
      else line += ' ';
    }
    lines.push(line);
  }
  return lines;
})();
