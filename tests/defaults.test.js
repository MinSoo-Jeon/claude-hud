// This fork turns most elements on by default. These pin that, so a default can't be dropped by accident.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, DEFAULT_ELEMENT_ORDER, DEFAULT_MERGE_GROUPS } from '../src/config.ts';
import { LEGACY_DISPLAY } from './legacy-defaults.js';

test('the extra displays are on by default and the legacy list names exactly them', () => {
  for (const key of Object.keys(LEGACY_DISPLAY).filter((k) => k !== 'mergeGroups')) {
    assert.equal(DEFAULT_CONFIG.display[key], true, `${key} is on by default`);
  }
  assert.equal(DEFAULT_CONFIG.jjStatus.enabled, true);
});

test('the session token summary sits beside the project and the config counts and agents come last', () => {
  assert.deepEqual(DEFAULT_MERGE_GROUPS[0], ['project', 'sessionTokens']);
  assert.deepEqual(DEFAULT_ELEMENT_ORDER.slice(0, 2), ['project', 'sessionTokens']);
  assert.deepEqual(DEFAULT_ELEMENT_ORDER.slice(-2), ['environment', 'agents']);
});

test('the costs, auth, cache, memory, speed and tools stay off', () => {
  for (const key of ['showCost', 'showRoutedCost', 'showDailyCost', 'showWeeklyCost', 'showSpeed', 'showAuth', 'showAuthUser', 'showPromptCache', 'showCacheHitRate', 'showMemoryUsage', 'showTools', 'showOutputStyle', 'showSessionStartDate', 'showLastResponseAt', 'showSessionName', 'showClaudeCodeVersion']) {
    assert.equal(DEFAULT_CONFIG.display[key], false, `${key} is off by default`);
  }
});
