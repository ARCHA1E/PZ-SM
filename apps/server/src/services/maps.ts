/** Map catalog, Map= order, spawn regions/points and world operations. */
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { parseSpawnPoints, parseSpawnRegions, splitList, writeSpawnPoints, writeSpawnRegions, type SpawnPoints, type SpawnRegion } from '@pzsm/pz-formats';
import type { MapEntry, SpawnRegionView } from '@pzsm/shared';
import { audit, kvSet } from '../db.js';
import { readTextFile, writeTextFileAtomic } from '../util/fs.js';
import { getManifest } from './buildAnalyzer.js';
import { readIni, writeIniValues } from './configStore.js';
import { enabledMods, scanMods } from './mods.js';
import { installPaths, serverPaths } from './paths.js';
import { supervisor } from './supervisor.js';

const VANILLA_BASE = 'Muldraugh, KY';

export async function mapCatalog(): Promise<{ maps: (MapEntry & { modEnabled?: boolean })[]; order: string[]; problems: string[] }> {
  const [manifest, all, enabled, ini] = await Promise.all([getManifest(), scanMods(), enabledMods(), readIni()]);
  const enabledIds = new Set(enabled.map((m) => m.id));
  const maps: (MapEntry & { modEnabled?: boolean })[] = [];
  for (const v of manifest?.maps ?? []) {
    maps.push({ folder: v.folder, title: v.title, description: v.description, lots: v.lots, source: 'vanilla', hasSpawnpoints: v.hasSpawnpoints, spawnpointsFile: v.hasSpawnpoints ? `media/maps/${v.folder}/spawnpoints.lua` : undefined });
  }
  for (const m of all) {
    for (const mp of m.maps) {
      if (maps.some((x) => x.folder === mp.folder && x.source === 'mod' && x.mod === m.id)) continue;
      maps.push({
        folder: mp.folder,
        title: mp.title,
        description: mp.description,
        lots: mp.lots,
        source: 'mod',
        mod: m.id,
        modEnabled: enabledIds.has(m.id),
        hasSpawnpoints: mp.hasSpawnpoints,
        spawnpointsFile: mp.hasSpawnpoints ? `media/maps/${mp.folder}/spawnpoints.lua` : undefined,
      });
    }
  }
  const order = splitList(ini?.values.Map ?? VANILLA_BASE);
  const problems: string[] = [];
  for (const f of order) {
    const candidates = maps.filter((m) => m.folder === f);
    if (!candidates.length) problems.push(`Map "${f}" is not provided by the game or any installed mod`);
    else if (candidates.every((c) => c.source === 'mod' && !c.modEnabled)) problems.push(`Map "${f}" comes from a mod that is not enabled (${candidates.map((c) => c.mod).join(', ')})`);
  }
  const baseIdx = order.indexOf(VANILLA_BASE);
  if (baseIdx >= 0 && baseIdx !== order.length - 1) problems.push(`"${VANILLA_BASE}" should be last so mod maps can override it`);
  return { maps, order, problems };
}

export async function setMapOrder(order: string[]): Promise<void> {
  const list = [...new Set(order.map((s) => s.trim()).filter(Boolean))];
  if (!list.length) list.push(VANILLA_BASE);
  await writeIniValues({ Map: list.join(';') });
  audit('maps.order', list.join(';'));
  if (supervisor.running) supervisor.pendingRestart = true;
}

/** Resolve `media/...` relative paths against the game install and enabled mods. */
async function resolveMediaPath(rel: string): Promise<string | null> {
  const norm = rel.replace(/\\/g, '/');
  const candidates = [join(installPaths().root, norm)];
  if (norm.startsWith('media/')) {
    for (const m of await enabledMods()) for (const md of m.mediaDirs) candidates.push(join(md, norm.slice('media/'.length)));
  }
  return candidates.find((c) => existsSync(c)) ?? null;
}

export async function getSpawnRegions(): Promise<{ regions: SpawnRegionView[]; exists: boolean }> {
  const sp = serverPaths();
  const f = await readTextFile(sp.spawnregions);
  if (!f) return { regions: [], exists: false };
  let regions: SpawnRegion[];
  try {
    regions = parseSpawnRegions(f.text);
  } catch (e) {
    return { regions: [{ name: 'Parse error', valid: false, problem: (e as Error).message }], exists: true };
  }
  const out: SpawnRegionView[] = [];
  for (const r of regions) {
    let valid = true;
    let problem: string | undefined;
    if (r.serverfile) {
      if (!existsSync(join(sp.serverDir, r.serverfile))) {
        valid = false;
        problem = `Server file ${r.serverfile} not found`;
      }
    } else if (r.file) {
      if (!(await resolveMediaPath(r.file))) {
        valid = false;
        problem = `File not found in game or enabled mods: ${r.file}`;
      }
    } else {
      valid = false;
      problem = 'Region has neither file nor serverfile';
    }
    out.push({ ...r, valid, problem });
  }
  return { regions: out, exists: true };
}

export async function setSpawnRegions(regions: SpawnRegion[]): Promise<void> {
  const clean = regions.map((r) => ({ name: r.name.trim(), file: r.file?.trim() || undefined, serverfile: r.serverfile?.trim() || undefined })).filter((r) => r.name && (r.file || r.serverfile));
  await writeTextFileAtomic(serverPaths().spawnregions, { text: writeSpawnRegions(clean), encoding: 'utf8' });
  audit('spawnregions.write', clean.map((r) => r.name).join(', '));
  if (supervisor.running) supervisor.pendingRestart = true;
}

/** Spawn regions for every map in Map= that ships spawnpoints. */
export async function suggestSpawnRegions(): Promise<SpawnRegion[]> {
  const { maps, order } = await mapCatalog();
  const out: SpawnRegion[] = [];
  for (const folder of order) {
    const m = maps.find((x) => x.folder === folder && x.hasSpawnpoints);
    if (m?.spawnpointsFile) out.push({ name: m.title || folder, file: m.spawnpointsFile });
  }
  // Vanilla towns are separate "maps" sharing Muldraugh's lots.
  if (order.includes(VANILLA_BASE)) {
    for (const m of maps) if (m.source === 'vanilla' && m.folder !== VANILLA_BASE && m.lots.includes(VANILLA_BASE) && m.spawnpointsFile && !out.some((o) => o.file === m.spawnpointsFile)) out.push({ name: m.folder, file: m.spawnpointsFile });
  }
  return out;
}

export async function getServerSpawnPoints(): Promise<SpawnPoints | null> {
  const f = await readTextFile(serverPaths().spawnpoints);
  if (!f) return null;
  return parseSpawnPoints(f.text);
}

export async function setServerSpawnPoints(points: SpawnPoints): Promise<void> {
  await writeTextFileAtomic(serverPaths().spawnpoints, { text: writeSpawnPoints(points), encoding: 'utf8' });
  audit('spawnpoints.write', Object.keys(points).join(', '));
}

// ------------------------------------------------------------------ world operations

export type WorldOp = 'soft-reset' | 'new-worldgen' | 'wipe-world' | 'wipe-all';

/**
 * - soft-reset: next launch with -Dsoftreset (the game resets the world, keeping players)
 * - new-worldgen: delete map_worldgen.bin so a changed Seed takes effect
 * - wipe-world: delete the save (players' characters too) but keep accounts/permissions
 * - wipe-all: also delete the server database (accounts, roles, bans)
 */
export async function worldOperation(op: WorldOp): Promise<void> {
  if (supervisor.running || supervisor.state === 'stopping') throw new Error('Stop the server first');
  const sp = serverPaths();
  switch (op) {
    case 'soft-reset':
      kvSet('oneshot_jvm_args', ['-Dsoftreset']);
      break;
    case 'new-worldgen':
      await rm(join(sp.save, 'map_worldgen.bin'), { force: true });
      break;
    case 'wipe-all':
      await rm(sp.gameDb, { force: true });
    // falls through
    case 'wipe-world':
      await rm(sp.save, { recursive: true, force: true });
      await rm(sp.savePlayer, { recursive: true, force: true });
      break;
  }
  audit('world.op', op);
}

export function readMapValue(values: Record<string, string>): string[] {
  return splitList(values.Map ?? VANILLA_BASE);
}
