import * as path from 'node:path';
import { DEFAULT_CONFIG } from '../config.ts';
import type { Frame, Layout } from './frame.ts';
import type { GitStatus } from '../git.ts';
import { critical, dim, git as gitColor, gitBranch, green, red, warning, yellow } from './colors.ts';
import { getFileHref, safeHyperlink } from '../utils/hyperlinks.ts';
import { sanitizeDisplayText } from '../utils/sanitize.ts';

function aheadCount(f: Frame, ahead: number): string {
  const config = f.config.gitStatus ?? DEFAULT_CONFIG.gitStatus;
  const colors = f.config?.colors;
  const value = `↑${ahead}`;
  if (config.pushCriticalThreshold > 0 && ahead >= config.pushCriticalThreshold) return critical(value, colors);
  if (config.pushWarningThreshold > 0 && ahead >= config.pushWarningThreshold) return warning(value, colors);
  return gitBranch(value, colors);
}

function vcsConfig(f: Frame) {
  const git = f.config.gitStatus ?? DEFAULT_CONFIG.gitStatus;
  const jj = f.config.jjStatus ?? DEFAULT_CONFIG.jjStatus;
  const isJj = f.gitStatus?.vcs === 'jj';
  return { git, jj, isJj, enabled: isJj ? jj.enabled : git.enabled };
}

function branchName(f: Frame, status: GitStatus): string {
  const { git, jj, isJj } = vcsConfig(f);
  const dirty = (isJj ? jj.showDirty : git.showDirty) && status.isDirty;
  return safeHyperlink(isJj ? undefined : status.branchUrl, gitBranch(`${sanitizeDisplayText(status.branch)}${dirty ? '*' : ''}`, f.config?.colors));
}

function worktreeSuffix(f: Frame): string {
  const { git, isJj } = vcsConfig(f);
  const name = !isJj && git.showWorktree ? sanitizeDisplayText(f.stdin.workspace?.git_worktree ?? '').trim() : '';
  return name ? ` ${gitColor(`⎇ ${name}`, f.config?.colors)}` : '';
}

/** The branch name (with its link and dirty mark) and the worktree name, as one part of the project row. */
export function branchPart(f: Frame): string | null {
  const status = f.gitStatus;
  if (!status || !vcsConfig(f).enabled) return null;
  return `${branchName(f, status)}${worktreeSuffix(f)}`;
}

/**
 * `branch:(main* ↑2)` or `jj:(…)`, plus the worktree name. Expanded adds line diffs;
 * compact adds Starship-style file counts instead. jj never shows git-only details.
 * With `branchShown` the branch and worktree are left out (the project row has them) and
 * only the changes remain, without the label; null when there are none.
 */
export function vcsPart(f: Frame, layout: Layout, branchShown = false): string | null {
  const status = f.gitStatus;
  if (!status) return null;
  const { git, jj, isJj, enabled } = vcsConfig(f);
  if (!enabled) return null;

  const colors = f.config?.colors;
  const inner: string[] = [];
  if (!branchShown) inner.push(branchName(f, status));

  if (!isJj && git.showAheadBehind) {
    if (status.ahead > 0) inner.push(aheadCount(f, status.ahead));
    if (status.behind > 0) inner.push(gitBranch(`↓${status.behind}`, colors));
  }
  if (!isJj && git.showFileStats) {
    if (layout === 'expanded' && status.lineDiff) {
      const diff = [status.lineDiff.added > 0 ? green(`+${status.lineDiff.added}`) : '', status.lineDiff.deleted > 0 ? red(`-${status.lineDiff.deleted}`) : '']
        .filter(Boolean);
      if (diff.length > 0) inner.push(`[${diff.join(' ')}]`);
    }
    if (layout === 'compact' && status.fileStats) {
      const { modified, added, deleted, untracked } = status.fileStats;
      const counts = [[modified, '!'], [added, '+'], [deleted, '✘'], [untracked, '?']]
        .filter(([count]) => (count as number) > 0)
        .map(([count, symbol]) => `${symbol}${count}`);
      if (counts.length > 0) inner.push(gitBranch(counts.join(' '), colors));
    }
  }
  if (isJj && jj.showConflicts && status.conflict === true) inner.push(critical('!conflict', colors));
  if (branchShown) return inner.length > 0 ? inner.join(' ') : null;

  return `${gitColor(isJj ? 'jj:(' : 'branch:(', colors)}${inner.join(' ')}${gitColor(')', colors)}${worktreeSuffix(f)}`;
}

function insideCwd(cwd: string, candidate: string): string | null {
  const resolved = path.resolve(cwd, candidate);
  const relative = path.relative(path.resolve(cwd), resolved);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)) ? resolved : null;
}

const MAX_FILES = 6;

/** Changed files in git's order, with per-file line diffs (expanded, gitStatus.showFileStats). */
export function gitFilesLine(f: Frame): string | null {
  const stats = f.gitStatus?.fileStats;
  if (!(f.config?.gitStatus?.showFileStats ?? false) || !stats) return null;
  if (stats.trackedFiles.length === 0 && stats.untracked === 0) return null;
  if (f.width !== null && f.width < 60) return null;

  const cwd = f.stdin.cwd;
  const files = stats.trackedFiles;

  const colorFor = { added: green, deleted: red, modified: yellow } as const;
  const prefix = { added: '+', deleted: '-', modified: '~' } as const;
  const entries = files.slice(0, MAX_FILES).map((file) => {
    const color = colorFor[file.type];
    const resolved = cwd ? insideCwd(cwd, file.fullPath) : null;
    const name = color(sanitizeDisplayText(file.basename));
    let entry = `${color(prefix[file.type])}${resolved ? safeHyperlink(getFileHref(resolved), name) : name}`;
    const diff = file.lineDiff;
    const diffParts = diff ? [diff.added > 0 ? green(`+${diff.added}`) : '', diff.deleted > 0 ? red(`-${diff.deleted}`) : ''].filter(Boolean) : [];
    if (diffParts.length > 0) entry += dim(`(${diffParts.join(' ')})`);
    return entry;
  });

  if (files.length > MAX_FILES) entries.push(dim(`+${files.length - MAX_FILES} more`));
  if (stats.untracked > 0) entries.push(dim(`?${stats.untracked}`));
  return entries.join('  ');
}
