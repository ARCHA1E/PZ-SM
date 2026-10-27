/**
 * Import server config files made in the game (Zomboid/Server/<name>.ini, _SandboxVars.lua,
 * _spawnregions.lua, _spawnpoints.lua) as this server's config: upload → review → apply.
 */
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeConfigBundle, classifyConfigFile, configFileName, decodeText, iniToRecord, parseIni, retargetConfigFile, type ConfigBundle, type ConfigFileInput } from '@pzsm/pz-formats';
import type { ConfigImportOptions, ConfigImportPreview } from '@pzsm/shared';
import { config } from '../config.js';
import { audit, getSettings } from '../db.js';
import { readTextFile, writeTextFileAtomic } from '../util/fs.js';
import { readZipEntries } from '../util/zip.js';
import { createBackup } from './backups.js';
import { getManifest } from './buildAnalyzer.js';
import { afterModsChanged } from './operations.js';
import { invalidateModScan } from './mods.js';
import { serverPaths } from './paths.js';
import { readWorkshopAcf } from './steam.js';
import { downloadWorkshopItems } from './workshopDownloader.js';
import { supervisor } from './supervisor.js';
import { runTask } from './tasks.js';

interface Staged {
  id: string;
  createdAt: number;
  bundle: ConfigBundle;
}

const staged = new Map<string, Staged>();
const TTL_MS = 60 * 60_000;
const MAX_FILE = 8 * 1024 * 1024;

function prune() {
  const now = Date.now();
  for (const [id, s] of staged) if (now - s.createdAt > TTL_MS) staged.delete(id);
}

/** Uploaded files (raw .ini/.lua, or .zip archives containing them) → bundle inputs. */
async function toInputs(uploads: { filename: string; data: Buffer }[]): Promise<{ inputs: ConfigFileInput[]; ignored: string[] }> {
  const inputs: ConfigFileInput[] = [];
  const ignored: string[] = [];
  for (const u of uploads) {
    if (/\.zip$/i.test(u.filename)) {
      const dir = await mkdtemp(join(tmpdir(), 'pzsm-cfg-'));
      try {
        const zipPath = join(dir, 'upload.zip');
        await writeFile(zipPath, u.data);
        const entries = await readZipEntries(zipPath, (n) => !!classifyConfigFile(n) && !/(^|\/)(Saves|db|Logs)\//.test(n));
        for (const [name, data] of entries) if (data.length <= MAX_FILE) inputs.push({ name: name.split('/').pop()!, ...decodeText(data) });
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
      continue;
    }
    if (u.data.length > MAX_FILE) {
      ignored.push(`${u.filename} (too large)`);
      continue;
    }
    inputs.push({ name: u.filename, ...decodeText(u.data) });
  }
  return { inputs, ignored };
}

async function preview(s: Staged): Promise<ConfigImportPreview> {
  const { bundle } = s;
  const manifest = await getManifest().catch(() => null);
  const known = new Set(manifest?.serverOptions.map((o) => o.name) ?? []);
  const ini = bundle.files.find((f) => f.kind === 'ini');
  const unknownIniKeys = ini && known.size ? parseIni(ini.text).entries.map((e) => e.key).filter((k) => !known.has(k)) : [];
  const acf = await readWorkshopAcf();
  const sp = serverPaths();
  return {
    id: s.id,
    sourceName: bundle.sourceName,
    targetName: getSettings().serverName,
    files: bundle.files.map((f) => ({ kind: f.kind, name: f.name, size: f.text.length })),
    ignored: bundle.ignored,
    summary: bundle.summary,
    errors: bundle.errors,
    warnings: bundle.warnings,
    unknownIniKeys,
    workshopToDownload: bundle.summary.workshopItems.filter((w) => !acf[w]),
    current: { hasConfig: existsSync(sp.ini), hasWorld: existsSync(sp.save), serverRunning: supervisor.running },
  };
}

export async function stageConfigUpload(uploads: { filename: string; data: Buffer }[]): Promise<ConfigImportPreview> {
  prune();
  const { inputs, ignored } = await toInputs(uploads);
  const bundle = analyzeConfigBundle(inputs);
  bundle.ignored.push(...ignored);
  const s: Staged = { id: randomUUID(), createdAt: Date.now(), bundle };
  staged.set(s.id, s);
  return preview(s);
}

export async function getStaged(id: string): Promise<ConfigImportPreview> {
  const s = staged.get(id);
  if (!s) throw Object.assign(new Error('Upload expired; upload the files again'), { statusCode: 404 });
  return preview(s);
}

export function discardStaged(id: string): void {
  staged.delete(id);
}

/** Install a staged bundle as the current server's config (runs as a task). */
export async function applyStaged(id: string, opts: ConfigImportOptions): Promise<void> {
  const s = staged.get(id);
  if (!s) throw Object.assign(new Error('Upload expired; upload the files again'), { statusCode: 404 });
  if (s.bundle.errors.length) throw new Error(`Cannot import: ${s.bundle.errors.join('; ')}`);
  const wasRunning = supervisor.running;
  const target = getSettings().serverName;
  const sp = serverPaths(target);

  await runTask('import-config', `Import config "${s.bundle.sourceName ?? 'upload'}"`, async (ctx) => {
    if (wasRunning) {
      ctx.log('Stopping the server');
      await supervisor.stop({ reason: 'config import' });
    }
    if (existsSync(sp.ini) || existsSync(sp.save)) {
      ctx.log('Backing up the current config and world');
      await createBackup('pre-import', `Before importing ${s.bundle.sourceName ?? 'config'}`, ctx).catch((e) => ctx.log(`Backup skipped: ${(e as Error).message}`));
    }

    // Host-owned ini values: ports must match the published container/LXC ports.
    const overrides: Record<string, string> = {};
    const current = await readTextFile(sp.ini);
    const cur = current ? iniToRecord(parseIni(current.text)) : {};
    if (opts.keepPorts) {
      for (const k of ['DefaultPort', 'UDPPort'] as const) if (cur[k]) overrides[k] = cur[k];
      if (!cur.DefaultPort && config.initial.gamePort) overrides.DefaultPort = String(config.initial.gamePort);
      if (!cur.UDPPort && config.initial.udpPort) overrides.UDPPort = String(config.initial.udpPort);
    }
    if (cur.RCONPort) overrides.RCONPort = cur.RCONPort;
    if (cur.RCONPassword) overrides.RCONPassword = cur.RCONPassword;

    for (const f of s.bundle.files) {
      const dest = join(sp.serverDir, configFileName(f.kind, target));
      const text = retargetConfigFile(f, s.bundle.sourceName, target, f.kind === 'ini' ? overrides : {});
      await writeTextFileAtomic(dest, { text, encoding: f.encoding, bom: f.bom });
      ctx.log(`Wrote ${configFileName(f.kind, target)}`);
    }

    if (opts.wipeWorld) {
      ctx.log('Removing the current world save (accounts and roles are kept)');
      await rm(sp.save, { recursive: true, force: true });
      await rm(sp.savePlayer, { recursive: true, force: true });
    }

    invalidateModScan();
    const ids = s.bundle.summary.workshopItems.filter((w) => /^\d+$/.test(w));
    if (opts.downloadMods && ids.length) {
      ctx.log(`Downloading ${ids.length} Workshop item(s); this can take a while`);
      const r = await downloadWorkshopItems(ids, ctx);
      if (r.failed.length) ctx.log(`Could not download: ${r.failed.join(', ')} (the server retries on start)`);
      invalidateModScan();
    }
    const added = await afterModsChanged();
    if (added.length) ctx.log(`Added defaults for ${added.length} mod sandbox option(s) missing from the file`);
    audit('config.import', {
      source: s.bundle.sourceName,
      files: s.bundle.files.map((f) => f.kind),
      mods: s.bundle.summary.mods.length,
      workshopItems: ids.length,
      keepPorts: opts.keepPorts,
      wipeWorld: opts.wipeWorld,
    });
  });
  staged.delete(id);
  if (wasRunning || opts.startAfter) await supervisor.start('after config import');
}
