/**
 * Remove every mod from the server while keeping the vanilla configuration:
 * Mods=/WorkshopItems= are cleared, mod sandbox namespaces are dropped from SandboxVars,
 * Map= keeps only vanilla maps, and spawn regions pointing at mod maps are removed.
 */
import { rm } from 'node:fs/promises';
import { parseSpawnRegions, removeSandboxNamespaces, splitList } from '@pzsm/pz-formats';
import type { ModWipeOptions, ModWipeResult } from '@pzsm/shared';
import { audit, kvSet } from '../db.js';
import { readTextFile, writeTextFileAtomic } from '../util/fs.js';
import { createBackup } from './backups.js';
import { getManifest } from './buildAnalyzer.js';
import { readIni, readSandbox, writeIniValues } from './configStore.js';
import { setSpawnRegions, suggestSpawnRegions } from './maps.js';
import { getModState, invalidateModScan } from './mods.js';
import { installPaths, serverPaths } from './paths.js';
import { addMissingSandboxDefaults } from './settingsRegistry.js';
import { supervisor } from './supervisor.js';
import type { TaskContext } from './tasks.js';
import { clearWorkshopJob } from './workshopDownloader.js';

const VANILLA_BASE = 'Muldraugh, KY';

/** Sandbox namespaces the vanilla game defines (from the analyzed build). */
async function vanillaNamespaces(): Promise<Set<string>> {
  const manifest = await getManifest();
  if (!manifest?.sandboxOptions.length) throw new Error('The game build has not been analyzed yet; install the server first');
  return new Set(manifest.sandboxOptions.filter((o) => o.name.includes('.')).map((o) => o.name.slice(0, o.name.indexOf('.'))));
}

/** What a wipe would remove, without changing anything. */
export async function previewModWipe(): Promise<Omit<ModWipeResult, 'backup' | 'deletedFiles'> & { modNamespaces: string[] }> {
  const [state, sandbox, vanilla, ini, manifest] = await Promise.all([getModState(), readSandbox(), vanillaNamespaces(), readIni(), getManifest()]);
  const modNamespaces = (sandbox?.namespaces ?? []).filter((n) => !vanilla.has(n));
  const vanillaMaps = new Set((manifest?.maps ?? []).map((m) => m.folder));
  const maps = splitList(ini?.values.Map ?? VANILLA_BASE);
  const removedMaps = maps.filter((m) => !vanillaMaps.has(m) && m !== VANILLA_BASE);
  const regions = await spawnRegionsToRemove(vanillaMaps);
  return {
    removedMods: state.active.length,
    removedWorkshopItems: state.workshopItems.length,
    removedSandboxKeys: (sandbox?.entries ?? []).filter((e) => modNamespaces.includes(e.namespace)).length,
    removedMaps,
    removedSpawnRegions: regions.remove,
    modNamespaces,
  };
}

async function spawnRegionsToRemove(vanillaMaps: Set<string>) {
  const f = await readTextFile(serverPaths().spawnregions);
  if (!f) return { keep: null, remove: 0 };
  try {
    const regions = parseSpawnRegions(f.text);
    const keep = regions.filter((r) => {
      if (r.serverfile) return true;
      const m = /^media[\\/]maps[\\/]([^\\/]+)[\\/]/i.exec(r.file ?? '');
      return !m || vanillaMaps.has(m[1]);
    });
    return { keep, remove: regions.length - keep.length };
  } catch {
    return { keep: null, remove: 0 };
  }
}

export async function wipeMods(opts: ModWipeOptions, ctx: TaskContext): Promise<ModWipeResult> {
  if (supervisor.running || supervisor.state === 'stopping') throw new Error('Stop the server first');
  const preview = await previewModWipe();
  ctx.log('Backing up the server config and save first');
  let backup: string | undefined;
  try {
    backup = (await createBackup('pre-mod-wipe', opts.sandboxOnly ? 'Before resetting mod sandbox options' : 'Before removing all mods', ctx)).id;
  } catch (e) {
    // Nothing to back up yet (fresh server) is fine; anything else stops the wipe.
    if (!/Nothing to back up/.test((e as Error).message)) throw e;
  }

  const sp = serverPaths();
  const sandbox = await readTextFile(sp.sandbox);
  if (sandbox && preview.modNamespaces.length) {
    ctx.log(`Removing ${preview.modNamespaces.length} mod sandbox section(s): ${preview.modNamespaces.join(', ')}`);
    await writeTextFileAtomic(sp.sandbox, { ...sandbox, text: removeSandboxNamespaces(sandbox.text, preview.modNamespaces) });
  }

  if (opts.sandboxOnly) {
    // Mods stay enabled: write their defaults back so the file is complete again.
    const added = await addMissingSandboxDefaults();
    ctx.log(`Wrote ${added.length} mod sandbox default(s)`);
    audit('mods.reset-sandbox', `${preview.removedSandboxKeys} keys removed, ${added.length} defaults written`);
    return { backup, removedMods: 0, removedWorkshopItems: 0, removedSandboxKeys: preview.removedSandboxKeys, removedMaps: [], removedSpawnRegions: 0, deletedFiles: false };
  }

  const ini = await readIni();
  const manifest = await getManifest();
  const vanillaMaps = new Set((manifest?.maps ?? []).map((m) => m.folder));
  const maps = splitList(ini?.values.Map ?? VANILLA_BASE).filter((m) => vanillaMaps.has(m) || m === VANILLA_BASE);
  if (!maps.includes(VANILLA_BASE)) maps.push(VANILLA_BASE);
  ctx.log(`Clearing Mods= and WorkshopItems=; Map=${maps.join(';')}`);
  await writeIniValues({ Mods: '', WorkshopItems: '', Map: maps.join(';') });

  const regions = await spawnRegionsToRemove(vanillaMaps);
  if (regions.keep && regions.remove) {
    const keep = regions.keep.length ? regions.keep : await suggestSpawnRegions();
    ctx.log(`Removing ${regions.remove} spawn region(s) on mod maps`);
    await setSpawnRegions(keep);
  }

  let deletedFiles = false;
  if (opts.deleteFiles) {
    const ip = installPaths();
    ctx.log('Deleting downloaded Workshop files');
    await rm(ip.workshopContent, { recursive: true, force: true });
    await rm(ip.workshopAcf, { force: true });
    deletedFiles = true;
  }
  clearWorkshopJob();
  kvSet('mod_updates', []);
  invalidateModScan();
  audit('mods.wipe', `${preview.removedMods} mods, ${preview.removedWorkshopItems} items, ${preview.removedSandboxKeys} sandbox keys${deletedFiles ? ', files deleted' : ''}`);
  return { backup, ...preview, deletedFiles };
}
