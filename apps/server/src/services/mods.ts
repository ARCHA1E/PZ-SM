/**
 * Workshop items and mods: discovery (B42 version folders), dependency resolution,
 * load order, Mods=/WorkshopItems= management and update detection.
 */
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  decodeText,
  formatModsValue,
  parseMapInfo,
  parseModInfo,
  parseModsValue,
  parseSandboxOptions,
  parseTranslation,
  selectVersionDir,
  splitList,
  versionInRange,
  type CustomSandboxOption,
  type ModInfo,
  type TranslationTable,
} from '@pzsm/pz-formats';
import type { ModEntry, ModsView, WorkshopItem } from '@pzsm/shared';
import { config } from '../config.js';
import { audit, db } from '../db.js';
import { listDirs, mtimeMs } from '../util/fs.js';
import { getManifest } from './buildAnalyzer.js';
import { readIni, writeIniValues } from './configStore.js';
import { installPaths } from './paths.js';
import { readWorkshopAcf } from './steam.js';

export interface ModMap {
  folder: string;
  title: string;
  description?: string;
  lots: string[];
  hasSpawnpoints: boolean;
  /** Absolute path of the map folder. */
  dir: string;
}

export interface ScannedMod {
  info: ModInfo;
  id: string;
  workshopId?: string;
  folder: string;
  root: string;
  versionDir?: string;
  /** media dirs in precedence order (version first, then common). */
  mediaDirs: string[];
  hasB42: boolean;
  sandboxOptions: CustomSandboxOption[];
  translations: TranslationTable;
  maps: ModMap[];
  poster?: string;
}

let scanCache: { key: string; mods: ScannedMod[] } | null = null;

export function invalidateModScan(): void {
  scanCache = null;
}

function modRoots(): { dir: string; workshopId?: string }[] {
  const out: { dir: string; workshopId?: string }[] = [];
  const wc = installPaths().workshopContent;
  for (const wid of listDirs(wc)) out.push({ dir: join(wc, wid, 'mods'), workshopId: wid });
  out.push({ dir: join(config.cacheDir, 'mods') });
  out.push({ dir: join(config.cacheDir, 'Workshop') }); // local workshop staging (<Item>/Contents/mods)
  return out;
}

async function readText(p: string): Promise<string | null> {
  try {
    return decodeText(await readFile(p)).text;
  } catch {
    return null;
  }
}

async function scanMod(root: string, folder: string, gameVersion: string, workshopId?: string): Promise<ScannedMod | null> {
  const dirs = listDirs(root);
  const versionDir = selectVersionDir(dirs, gameVersion);
  const infoPath = versionDir && existsSync(join(root, versionDir, 'mod.info')) ? join(root, versionDir, 'mod.info') : join(root, 'mod.info');
  const text = await readText(infoPath);
  if (text === null) return null;
  const info = parseModInfo(text);
  if (!info.id) info.id = folder;
  const mediaDirs = [versionDir ? join(root, versionDir, 'media') : null, join(root, 'common', 'media'), versionDir ? null : join(root, 'media')].filter(
    (d): d is string => !!d && existsSync(d),
  );
  let sandboxOptions: CustomSandboxOption[] = [];
  for (const m of mediaDirs) {
    const t = await readText(join(m, 'sandbox-options.txt'));
    if (t !== null) {
      sandboxOptions = parseSandboxOptions(t).options;
      break;
    }
  }
  const translations: TranslationTable = {};
  for (const m of [...mediaDirs].reverse()) {
    const td = join(m, 'lua', 'shared', 'Translate', 'EN');
    if (!existsSync(td)) continue;
    for (const f of readdirSync(td)) {
      if (!/^(Sandbox(_EN)?\.(json|txt)|UI(_EN)?\.(json|txt))$/i.test(f)) continue;
      const t = await readText(join(td, f));
      if (t !== null) Object.assign(translations, parseTranslation(f, t));
    }
  }
  const maps: ModMap[] = [];
  const seen = new Set<string>();
  for (const m of mediaDirs) {
    const md = join(m, 'maps');
    for (const mf of listDirs(md)) {
      if (seen.has(mf)) continue;
      const mi = await readText(join(md, mf, 'map.info'));
      if (mi === null) continue;
      seen.add(mf);
      const p = parseMapInfo(mi);
      maps.push({ folder: mf, title: p.title ?? mf, description: p.description, lots: p.lots, hasSpawnpoints: existsSync(join(md, mf, 'spawnpoints.lua')), dir: join(md, mf) });
    }
  }
  const posterBase = versionDir ? join(root, versionDir) : root;
  const poster = info.posters[0] && existsSync(join(posterBase, info.posters[0])) ? join(posterBase, info.posters[0]) : undefined;
  return {
    info,
    id: info.id,
    workshopId,
    folder,
    root,
    versionDir,
    mediaDirs,
    hasB42: !!versionDir || existsSync(join(root, 'common')),
    sandboxOptions,
    translations,
    maps,
    poster,
  };
}

export async function scanMods(): Promise<ScannedMod[]> {
  const manifest = await getManifest();
  const gameVersion = manifest?.version ?? '42.21';
  const roots = modRoots();
  const key = gameVersion + '|' + roots.map((r) => `${r.dir}:${mtimeMs(r.dir)}`).join('|');
  if (scanCache && scanCache.key === key) return scanCache.mods;
  const mods: ScannedMod[] = [];
  for (const r of roots) {
    for (const folder of listDirs(r.dir)) {
      const m = await scanMod(join(r.dir, folder), folder, gameVersion, r.workshopId);
      if (m) mods.push(m);
    }
  }
  scanCache = { key, mods };
  return mods;
}

/** Resolve the effective mod for an id (first match wins, as the game does). */
function indexById(mods: ScannedMod[]): Map<string, ScannedMod> {
  const m = new Map<string, ScannedMod>();
  for (const x of mods) if (!m.has(x.id)) m.set(x.id, x);
  return m;
}

export async function getModState(): Promise<{ active: string[]; workshopItems: string[] }> {
  const ini = await readIni();
  return {
    active: parseModsValue(ini?.values.Mods ?? ''),
    workshopItems: splitList(ini?.values.WorkshopItems ?? ''),
  };
}

/** Stable topological sort honoring require / loadModAfter / loadModBefore. */
export function suggestOrder(active: string[], byId: Map<string, ScannedMod>): { order: string[]; cycles: string[] } {
  const set = new Set(active);
  const edges = new Map<string, Set<string>>(); // a -> b means a before b
  const add = (a: string, b: string) => {
    if (!set.has(a) || !set.has(b) || a === b) return;
    if (!edges.has(a)) edges.set(a, new Set());
    edges.get(a)!.add(b);
  };
  for (const id of active) {
    const m = byId.get(id);
    if (!m) continue;
    for (const r of m.info.require) add(r, id);
    for (const r of m.info.loadModAfter) add(r, id);
    for (const r of m.info.loadModBefore) add(id, r);
  }
  const indeg = new Map(active.map((id) => [id, 0]));
  for (const [, bs] of edges) for (const b of bs) indeg.set(b, (indeg.get(b) ?? 0) + 1);
  const order: string[] = [];
  const pos = new Map(active.map((id, i) => [id, i]));
  const ready = active.filter((id) => indeg.get(id) === 0);
  while (ready.length) {
    ready.sort((a, b) => pos.get(a)! - pos.get(b)!);
    const n = ready.shift()!;
    order.push(n);
    for (const b of edges.get(n) ?? []) {
      indeg.set(b, indeg.get(b)! - 1);
      if (indeg.get(b) === 0) ready.push(b);
    }
  }
  const cycles = active.filter((id) => !order.includes(id));
  return { order: [...order, ...cycles], cycles };
}

export async function modsView(): Promise<ModsView> {
  const [mods, state, manifest, acf] = await Promise.all([scanMods(), getModState(), getManifest(), readWorkshopAcf()]);
  const gameVersion = manifest?.version ?? '42.21';
  const byId = indexById(mods);
  const active = new Set(state.active);
  const problems: string[] = [];

  const entries: ModEntry[] = mods.map((m) => {
    const p: string[] = [];
    if (!m.hasB42) p.push('No Build 42 folder (B41-only mod; will not load)');
    if (!versionInRange(gameVersion, m.info.versionMin, m.info.versionMax)) p.push(`Requires game ${m.info.versionMin ?? '*'} – ${m.info.versionMax ?? '*'}`);
    if (active.has(m.id)) {
      for (const r of m.info.require) {
        if (!byId.has(r)) p.push(`Requires "${r}" which is not installed`);
        else if (!active.has(r)) p.push(`Requires "${r}" which is not enabled`);
      }
      for (const r of m.info.incompatible) if (active.has(r)) p.push(`Incompatible with enabled mod "${r}"`);
    }
    return {
      id: m.id,
      name: m.info.name,
      workshopId: m.workshopId,
      folder: m.folder,
      versionDir: m.versionDir,
      enabled: active.has(m.id),
      description: m.info.description,
      author: m.info.author,
      require: m.info.require,
      incompatible: m.info.incompatible,
      loadModAfter: m.info.loadModAfter,
      loadModBefore: m.info.loadModBefore,
      versionMin: m.info.versionMin,
      versionMax: m.info.versionMax,
      hasSandboxOptions: m.sandboxOptions.length > 0,
      maps: m.maps.map((x) => x.folder),
      poster: m.poster ? `/api/mods/poster/${encodeURIComponent(m.workshopId ?? 'local')}/${encodeURIComponent(m.id)}` : undefined,
      problems: p,
    };
  });
  for (const id of state.active) if (!byId.has(id)) problems.push(`Enabled mod "${id}" is not installed`);
  const dupes = new Map<string, number>();
  for (const m of mods) dupes.set(m.id, (dupes.get(m.id) ?? 0) + 1);
  for (const [id, n] of dupes) if (n > 1) problems.push(`Mod id "${id}" is provided by ${n} folders; the first found is used`);

  const metaRows = db.prepare('SELECT * FROM workshop_meta').all() as { workshop_id: string; title: string | null; preview: string | null; time_updated: number | null; size: number | null }[];
  const meta = new Map(metaRows.map((r) => [r.workshop_id, r]));
  const wids = [...new Set([...state.workshopItems, ...mods.filter((m) => m.workshopId).map((m) => m.workshopId!)])];
  const workshop: WorkshopItem[] = wids.map((wid) => {
    const mm = meta.get(wid);
    const local = acf[wid];
    const installed = mods.some((m) => m.workshopId === wid);
    return {
      workshopId: wid,
      title: mm?.title ?? undefined,
      preview: mm?.preview ?? undefined,
      timeUpdated: mm?.time_updated ?? undefined,
      localUpdated: local?.timeUpdated,
      installed,
      needsUpdate: !!(mm?.time_updated && local?.timeUpdated && mm.time_updated > local.timeUpdated),
      modIds: mods.filter((m) => m.workshopId === wid).map((m) => m.id),
      size: local?.size ?? mm?.size ?? undefined,
      inServerConfig: state.workshopItems.includes(wid),
    };
  });
  for (const wid of state.workshopItems) if (!workshop.find((w) => w.workshopId === wid)?.installed) problems.push(`Workshop item ${wid} is configured but not downloaded yet`);

  return {
    mods: entries.sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name)),
    workshop,
    activeOrder: state.active,
    suggestedOrder: suggestOrder(state.active, byId).order,
    problems,
    gameVersion,
  };
}

/** Set the enabled mod list (in load order). Optionally pulls in required dependencies. */
export async function setActiveMods(ids: string[], opts: { withDependencies?: boolean } = {}): Promise<string[]> {
  const mods = await scanMods();
  const byId = indexById(mods);
  let list = [...new Set(ids)];
  if (opts.withDependencies) {
    const seen = new Set(list);
    const queue = [...list];
    while (queue.length) {
      const m = byId.get(queue.shift()!);
      for (const r of m?.info.require ?? []) {
        if (!seen.has(r) && byId.has(r)) {
          seen.add(r);
          list.unshift(r);
          queue.push(r);
        }
      }
    }
    list = suggestOrder(list, byId).order;
  }
  // Keep WorkshopItems in sync with the items providing enabled mods.
  const state = await getModState();
  const needed = new Set(list.map((id) => byId.get(id)?.workshopId).filter((w): w is string => !!w));
  const workshopItems = [...new Set([...state.workshopItems.filter((w) => needed.has(w) || !mods.some((m) => m.workshopId === w)), ...needed])];
  await writeIniValues({ Mods: formatModsValue(list), WorkshopItems: workshopItems.join(';') });
  audit('mods.set', list.join(';'));
  return list;
}

export async function setWorkshopItems(ids: string[]): Promise<void> {
  await writeIniValues({ WorkshopItems: [...new Set(ids)].join(';') });
}

/** Remove a Workshop item from the server config, and disable its mods. */
export async function removeWorkshopItem(wid: string): Promise<void> {
  const [mods, state] = await Promise.all([scanMods(), getModState()]);
  const its = new Set(mods.filter((m) => m.workshopId === wid).map((m) => m.id));
  const active = state.active.filter((id) => !its.has(id));
  await writeIniValues({ Mods: formatModsValue(active), WorkshopItems: state.workshopItems.filter((w) => w !== wid).join(';') });
  audit('workshop.remove', wid);
}

/** Enabled mods (resolved), for sandbox option and map discovery. */
export async function enabledMods(): Promise<ScannedMod[]> {
  const [mods, state] = await Promise.all([scanMods(), getModState()]);
  const byId = indexById(mods);
  return state.active.map((id) => byId.get(id)).filter((m): m is ScannedMod => !!m);
}

export async function findModPoster(workshopId: string, modId: string): Promise<string | undefined> {
  const mods = await scanMods();
  return mods.find((m) => m.id === modId && (m.workshopId ?? 'local') === workshopId)?.poster;
}
