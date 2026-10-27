/** Game version helpers (e.g. "42.21.0") and B42 mod version-folder selection. */

export function parseVersion(v: string): number[] {
  const m = /^\s*(\d+(?:\.\d+)*)/.exec(v);
  if (!m) return [];
  return m[1].split('.').map(Number);
}

export function compareVersions(a: string | number[], b: string | number[]): number {
  const x = typeof a === 'string' ? parseVersion(a) : a;
  const y = typeof b === 'string' ? parseVersion(b) : b;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export const VERSION_DIR = /^\d+(?:\.\d+)*$/;

/**
 * Choose the version folder the game would load: the highest numeric folder name that is
 * <= the game version. Returns undefined when none qualifies (e.g. B41-only mods).
 */
export function selectVersionDir(dirNames: string[], gameVersion: string): string | undefined {
  const candidates = dirNames.filter((d) => VERSION_DIR.test(d) && compareVersions(d, gameVersion) <= 0);
  candidates.sort((a, b) => compareVersions(b, a));
  return candidates[0];
}

/** True if `gameVersion` satisfies optional versionMin/versionMax from mod.info. */
export function versionInRange(gameVersion: string, min?: string, max?: string): boolean {
  if (min && compareVersions(gameVersion, min) < 0) return false;
  if (max && compareVersions(gameVersion, max) > 0) return false;
  return true;
}
