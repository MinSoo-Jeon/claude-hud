import type { RenderContext } from '../types.ts';
import { RESET } from './colors.ts';
import { wrapToWidth } from './ansi.ts';
import { compactLines } from './compact.ts';
import { expandedLines } from './expanded.ts';
import { createFrame } from './frame.ts';
import { MASCOT_LINES, MASCOT_WIDTH } from './mascot.ts';

const MASCOT_GAP = 2;

/** The lines the HUD prints, wrapped to the terminal width when it is known. */
export function renderLines(ctx: RenderContext, columns: number | null, now: number): string[] {
  const frame = createFrame(ctx, columns, now);
  const mascot = ctx.config?.display?.mascot === true;
  const textWidth = mascot && frame.width !== null ? Math.max(1, frame.width - MASCOT_WIDTH - MASCOT_GAP) : frame.width ?? 0;
  const lines = (ctx.config?.lineLayout ?? 'expanded') === 'expanded' ? expandedLines(frame) : compactLines(frame);
  const text = lines
    .flatMap((line) => line.split('\n'))
    .flatMap((line) => wrapToWidth(line, textWidth))
    .map((line) => `${RESET}${line}`);
  return mascot ? besideMascot(text) : text;
}

/** The HUD lines centered vertically next to the mascot; extra lines continue below it. */
function besideMascot(text: string[]): string[] {
  const height = Math.max(MASCOT_LINES.length, text.length);
  const offset = Math.floor((MASCOT_LINES.length - Math.min(text.length, MASCOT_LINES.length)) / 2);
  return Array.from({ length: height }, (_, i) => {
    const art = MASCOT_LINES[i] ?? ' '.repeat(MASCOT_WIDTH);
    const line = text[i - offset];
    return `${RESET}${art}${line === undefined ? '' : `${' '.repeat(MASCOT_GAP)}${line}`}`;
  });
}
