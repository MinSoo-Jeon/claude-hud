import type { RenderContext } from '../types.ts';
import { RESET } from './colors.ts';
import { wrapToWidth } from './ansi.ts';
import { compactLines } from './compact.ts';
import { expandedLines } from './expanded.ts';
import { createFrame } from './frame.ts';
import { MASCOT_GAP, mascotShown, pickMascot, type MascotDraw } from './mascot.ts';

/** The lines the HUD prints, wrapped to the terminal width when it is known. */
export function renderLines(ctx: RenderContext, columns: number | null, now: number): string[] {
  const frame = createFrame(ctx, columns, now);
  const mascot = mascotShown(frame) ? pickMascot(frame) : null;
  const textWidth = mascot && frame.width !== null ? frame.width - mascot.width - MASCOT_GAP : frame.width ?? 0;
  const lines = (ctx.config?.lineLayout ?? 'expanded') === 'expanded' ? expandedLines(frame) : compactLines(frame);
  const text = lines
    .flatMap((line) => line.split('\n'))
    .flatMap((line) => wrapToWidth(line, textWidth))
    .map((line) => `${RESET}${line}`);
  return mascot ? besideMascot(mascot, text) : text;
}

/** The HUD lines centered vertically next to the mascot; extra lines continue below it. */
function besideMascot({ lines, width }: MascotDraw, text: string[]): string[] {
  const height = Math.max(lines.length, text.length);
  const offset = Math.floor((lines.length - Math.min(text.length, lines.length)) / 2);
  return Array.from({ length: height }, (_, i) => {
    const art = lines[i] ?? ' '.repeat(width);
    const line = text[i - offset];
    return `${RESET}${art}${line === undefined ? '' : `${' '.repeat(MASCOT_GAP)}${line}`}`;
  });
}
