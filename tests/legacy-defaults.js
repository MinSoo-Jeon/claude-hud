// The settings this fork turned on by default, set back to what upstream ships. Cases that are
// about one element pin these so they keep testing that element; the `default/` golden cases and
// tests/defaults.test.js follow the real defaults.
export const LEGACY_DISPLAY = {
  showLaunchDir: false,
  showConfigCounts: false,
  showDuration: false,
  usagePace: false,
  showSkills: false,
  showMcp: false,
  showAgents: false,
  agentProgress: false,
  showAgentEffort: false,
  showTodos: false,
  showEffortLevel: false,
  showSessionTokens: false,
  showCompactions: false,
  showProvider: false,
  mergeGroups: [['context', 'usage']],
};
export const LEGACY_ELEMENT_ORDER = [
  'project', 'addedDirs', 'context', 'usage', 'promptCache', 'cacheHitRate', 'memory', 'environment', 'tools', 'skills', 'mcp', 'agents', 'todos', 'sessionTime',
];
export const LEGACY_JJ = { enabled: false };

/** `config` with the legacy settings underneath: whatever `config` sets still wins. */
export function withLegacyDefaults(config = {}) {
  return {
    elementOrder: LEGACY_ELEMENT_ORDER,
    ...config,
    jjStatus: { ...LEGACY_JJ, ...config.jjStatus },
    display: { ...LEGACY_DISPLAY, ...config.display },
  };
}
