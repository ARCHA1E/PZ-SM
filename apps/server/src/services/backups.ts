/**
 * Backups of the managed server: world save, player save, config files and server db,
 * as .tar.gz archives with a JSON sidecar. Also imports an existing server (e.g. from a
 * Windows Zomboid folder) from a .zip or .tar.gz.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';
import yauzl from 'yauzl';
import type { BackupEntry } from '@pzsm/shared';
import { config } from '../config.js';
import { audit, getSettings } from '../db.js';
import { safeJoin } from '../util/fs.js';
import { serverPaths } from './paths.js';
import { supervisor } from './supervisor.js';
import type { TaskContext } from './tasks.js';

mkdirSync(config.backupDir, { recursive: true });

/** Paths (relative to cacheDir) that make up a server. */
function backupMembers(name: string): string[] {
  const c = config.cacheDir;
  const rel: string[] = [];
  for (const f of readdirSafe(join(c, 'Server'))) if ((f === `${name}.ini` || f.startsWith(`${name}_`)) && !/\.pzsm\.(bak|tmp)$/.test(f)) rel.push(join('Server', f));
  for (const p of [join('db', `${name}.db`), join('Saves', 'Multiplayer', name), join('Saves', 'Multiplayer', `${name}_player`)]) if (existsSync(join(c, p))) rel.push(p);
  return rel.map((p) => p.split(sep).join('/'));
}

function readdirSafe(d: string): string[] {
  try {
    return readdirSync(d);
  } catch {
    return [];
  }
}

export function listBackups(): BackupEntry[] {
  const out: BackupEntry[] = [];
  for (const f of readdirSafe(config.backupDir)) {
    if (!f.endsWith('.tar.gz')) continue;
    const full = join(config.backupDir, f);
    let meta: Partial<BackupEntry> = {};
    try {
      meta = JSON.parse(readFileSync(full.replace(/\.tar\.gz$/, '.json'), 'utf8'));
    } catch {
      /* no sidecar */
    }
    const st = statSync(full);
    out.push({ id: f.replace(/\.tar\.gz$/, ''), file: f, createdAt: meta.createdAt ?? st.mtime.toISOString(), size: st.size, kind: meta.kind ?? 'manual', note: meta.note });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createBackup(kind: BackupEntry['kind'], note?: string, ctx?: TaskContext): Promise<BackupEntry> {
  const name = getSettings().serverName;
  const members = backupMembers(name);
  if (!members.length) throw new Error('Nothing to back up yet');
  if (supervisor.state === 'running') {
    await supervisor.command('save', { quiet: true }).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 5000));
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const id = `${name}_${stamp}_${kind}`;
  const file = join(config.backupDir, `${id}.tar.gz`);
  ctx?.log(`Archiving ${members.join(', ')}`);
  await tar.c({ gzip: { level: 6 }, file, cwd: config.cacheDir, portable: true }, members);
  const entry: BackupEntry = { id, file: basename(file), createdAt: new Date().toISOString(), size: statSync(file).size, kind, note };
  writeFileSync(file.replace(/\.tar\.gz$/, '.json'), JSON.stringify({ ...entry, serverName: name, members }, null, 2));
  audit('backup.create', `${entry.file} (${kind})`);
  pruneBackups();
  return entry;
}

/** Keep the newest N automatic backups; manual/import ones are never pruned. */
export function pruneBackups(): void {
  const keep = Math.max(1, getSettings().backupRetention);
  const auto = listBackups().filter((b) => b.kind !== 'manual' && b.kind !== 'import');
  for (const b of auto.slice(keep)) deleteBackup(b.id);
}

export function deleteBackup(id: string): void {
  const f = safeJoin(config.backupDir, `${id}.tar.gz`);
  void rm(f, { force: true });
  void rm(f.replace(/\.tar\.gz$/, '.json'), { force: true });
  audit('backup.delete', id);
}

export function backupPath(id: string): string {
  return safeJoin(config.backupDir, `${id}.tar.gz`);
}

/** Restore a backup into the current server name (renaming if it came from another name). */
export async function restoreBackup(id: string, ctx: TaskContext): Promise<void> {
  if (supervisor.running || supervisor.state === 'stopping') throw new Error('Stop the server first');
  const file = backupPath(id);
  if (!existsSync(file)) throw new Error('Backup not found');
  if (backupMembers(getSettings().serverName).length) {
    ctx.log('Creating pre-restore backup');
    await createBackup('pre-restore', `Before restoring ${id}`, ctx);
  }
  const tmp = await mkdtemp(join(tmpdir(), 'pzsm-restore-'));
  try {
    await tar.x({ file, cwd: tmp });
    await installServerTree(tmp, ctx);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  audit('backup.restore', id);
}

/**
 * Given an extracted tree containing Server/<x>.ini (and optionally Saves/Multiplayer/<x>,
 * db/<x>.db) anywhere inside, install it as the current server.
 */
async function installServerTree(root: string, ctx: TaskContext): Promise<void> {
  const target = getSettings().serverName;
  const iniPath = await findFile(root, (p) => /(^|\/)Server\/[^/]+\.ini$/.test(p));
  if (!iniPath) throw new Error('No Server/<name>.ini found in archive');
  const base = dirname(dirname(join(root, iniPath))); // the Zomboid dir inside the archive
  const src = basename(iniPath, '.ini');
  ctx.log(`Found server "${src}" in archive; installing as "${target}"`);
  const sp = serverPaths(target);
  // Replace existing files for target
  for (const f of readdirSafe(sp.serverDir)) if (f === `${target}.ini` || f.startsWith(`${target}_`)) await rm(join(sp.serverDir, f), { force: true });
  await rm(sp.save, { recursive: true, force: true });
  await rm(sp.savePlayer, { recursive: true, force: true });
  mkdirSync(sp.serverDir, { recursive: true });
  for (const f of readdirSafe(join(base, 'Server'))) {
    if (f === `${src}.ini` || f.startsWith(`${src}_`)) await cp(join(base, 'Server', f), join(sp.serverDir, target + f.slice(src.length)));
  }
  const saves = join(base, 'Saves', 'Multiplayer');
  if (existsSync(join(saves, src))) {
    mkdirSync(dirname(sp.save), { recursive: true });
    await cp(join(saves, src), sp.save, { recursive: true });
  }
  if (existsSync(join(saves, `${src}_player`))) await cp(join(saves, `${src}_player`), sp.savePlayer, { recursive: true });
  if (existsSync(join(base, 'db', `${src}.db`))) {
    mkdirSync(dirname(sp.gameDb), { recursive: true });
    await rm(sp.gameDb, { force: true });
    await cp(join(base, 'db', `${src}.db`), sp.gameDb);
  }
  // spawnregions may reference "<src>_spawnpoints.lua" as serverfile
  const sr = join(sp.serverDir, `${target}_spawnregions.lua`);
  if (src !== target && existsSync(sr)) {
    const text = readFileSync(sr, 'utf8').split(`${src}_spawnpoints.lua`).join(`${target}_spawnpoints.lua`);
    writeFileSync(sr, text);
  }
}

/** Breadth-first search for a file whose path (relative to root, `/`-separated) passes `test`. */
async function findFile(root: string, test: (rel: string) => boolean): Promise<string | null> {
  const queue: string[] = [root];
  while (queue.length) {
    const dir = queue.shift()!;
    if (relative(root, dir).split(sep).length > 8) continue;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isFile() && test(relative(root, full).split(sep).join('/'))) return relative(root, full).split(sep).join('/');
      if (e.isDirectory()) queue.push(full);
    }
  }
  return null;
}

/** Import an uploaded archive (.zip or .tar.gz) containing a server. */
export async function importServerArchive(uploadPath: string, originalName: string, ctx: TaskContext): Promise<void> {
  if (supervisor.running || supervisor.state === 'stopping') throw new Error('Stop the server first');
  if (backupMembers(getSettings().serverName).length) await createBackup('pre-restore', `Before import of ${originalName}`, ctx);
  const tmp = await mkdtemp(join(tmpdir(), 'pzsm-import-'));
  try {
    if (/\.zip$/i.test(originalName)) await extractZip(uploadPath, tmp);
    else await tar.x({ file: uploadPath, cwd: tmp });
    await installServerTree(tmp, ctx);
    // Keep a copy as an import backup
    const keep = join(config.backupDir, `${getSettings().serverName}_${Date.now()}_import.tar.gz`);
    const members = backupMembers(getSettings().serverName);
    if (members.length) {
      await tar.c({ gzip: true, file: keep, cwd: config.cacheDir, portable: true }, members);
      writeFileSync(keep.replace(/\.tar\.gz$/, '.json'), JSON.stringify({ createdAt: new Date().toISOString(), kind: 'import', note: originalName }));
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  audit('server.import', originalName);
}

function extractZip(file: string, dest: string): Promise<void> {
  return new Promise((res, rej) => {
    yauzl.open(file, { lazyEntries: true }, (err, zip) => {
      if (err || !zip) return rej(err);
      zip.on('error', rej);
      zip.on('end', () => res());
      zip.on('entry', (e: yauzl.Entry) => {
        const out = resolve(dest, e.fileName);
        if (!out.startsWith(resolve(dest) + sep)) return rej(new Error(`Unsafe path in zip: ${e.fileName}`));
        if (e.fileName.endsWith('/')) {
          mkdirSync(out, { recursive: true });
          zip.readEntry();
          return;
        }
        mkdirSync(dirname(out), { recursive: true });
        zip.openReadStream(e, (e2, s) => {
          if (e2 || !s) return rej(e2);
          pipeline(s, createWriteStream(out)).then(() => zip.readEntry(), rej);
        });
      });
      zip.readEntry();
    });
  });
}
