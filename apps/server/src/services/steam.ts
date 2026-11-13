/** SteamCMD (install/update/workshop downloads) and the public Steam Web API. */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, rename, rm } from 'node:fs/promises';
import { parseVdf, type VdfObject } from '@pzsm/pz-formats';
import type { SteamBranch } from '@pzsm/shared';
import { config } from '../config.js';
import { db, getSettings, kvGet, kvSet } from '../db.js';
import { installPaths } from './paths.js';
import type { TaskContext } from './tasks.js';

export function runSteamcmd(args: string[], ctx?: TaskContext): Promise<{ code: number | null; output: string }> {
  if (config.dryRun) {
    ctx?.log(`[dry-run] steamcmd ${args.join(' ')}`);
    return Promise.resolve({ code: 0, output: '' });
  }
  if (!existsSync(config.steamcmd)) {
    return Promise.reject(new Error(`SteamCMD not found at ${config.steamcmd} (set STEAMCMD)`));
  }
  return new Promise((resolve, reject) => {
    const p = spawn(config.steamcmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let partial = '';
    const onChunk = (d: Buffer) => {
      const s = d.toString('utf8');
      output += s;
      if (output.length > 4_000_000) output = output.slice(-2_000_000);
      partial += s;
      const lines = partial.split(/\r?\n|\r/);
      partial = lines.pop() ?? '';
      for (const rawLine of lines) {
        const line = rawLine.replace(/\u001b\[[0-9;]*m/g, "");
        if (!line.trim()) continue;
        ctx?.log(line);
        const m = /progress:\s*([\d.]+)/.exec(line);
        if (m) ctx?.progress(Number(m[1]), line.trim());
      }
    };
    p.stdout.on('data', onChunk);
    p.stderr.on('data', onChunk);
    p.on('error', reject);
    p.on('close', (code) => resolve({ code, output }));
  });
}

/** Tunables (exported for tests). */
export const steamLimits = { retryDelayMs: 5000 };

/** Install or update the dedicated server on the configured branch. */
export async function installOrUpdateServer(ctx: TaskContext, opts: { validate?: boolean } = {}): Promise<void> {
  const s = getSettings();
  mkdirSync(config.installDir, { recursive: true });
  const update = ['+app_update', String(config.steamAppId)];
  // Always name the branch: without "-beta public" SteamCMD stays on whatever branch the
  // install was last switched to.
  update.push('-beta', s.branch || 'public');
  if (s.branch && s.branch !== 'public' && s.branchPassword) update.push('-betapassword', s.branchPassword);
  const known = kvGet<{ branches: SteamBranch[] } | null>('steam_branches', null)?.branches ?? [];
  if (known.length && !known.some((b) => b.name === (s.branch || 'public'))) {
    ctx.log(`Note: Steam does not list a branch named "${s.branch}" (available: ${known.map((b) => b.name).join(', ')})`);
  }
  const manifest = installPaths().appManifest;
  const manifestBak = `${manifest}.pzsm.bak`;
  // 1. As requested (a fast delta update when possible).
  // 2. With validate. A delta update needs the manifest of the build that is installed now;
  //    once that build leaves the branch Steam refuses it ("Access Denied", app state 0x6)
  //    unless SteamCMD still has it cached. Validating against the new build doesn't need it.
  // 3. Forget the install record and validate, so SteamCMD treats the folder as a fresh
  //    install and only downloads files that differ.
  const plans = [
    { validate: opts.validate ?? s.validateOnUpdate, reset: false },
    { validate: true, reset: false },
    { validate: true, reset: true },
  ];
  try {
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      if (plan.reset && existsSync(manifest)) {
        ctx.log('Resetting the SteamCMD install record and verifying all files');
        await rename(manifest, manifestBak);
      }
      const args = ['+force_install_dir', config.installDir, '+login', 'anonymous', ...update, ...(plan.validate ? ['validate'] : []), '+quit'];
      const { code, output } = await runSteamcmd(args, ctx);
      if (/Success! App '\d+' (fully installed|already up to date)/.test(output) || (config.dryRun && code === 0)) {
        await rm(manifestBak, { force: true });
        return;
      }
      ctx.log(`SteamCMD exited with ${code}; attempt ${i + 1}/${plans.length} failed`);
      // Retrying cannot fix these.
      if (/Failed to set beta/i.test(output)) {
        throw new Error(`Steam has no branch named "${s.branch}" for the dedicated server (or its password is wrong). Pick another branch on the Manager page.`);
      }
      if (/Invalid platform|No subscription|Invalid Password/i.test(output)) break;
      if (i + 1 < plans.length) {
        if (!plan.validate) ctx.log('Retrying with file validation (slower, but does not need the previous build)');
        await new Promise((r) => setTimeout(r, steamLimits.retryDelayMs));
      }
    }
  } finally {
    // A failed reset attempt must not leave the install without its record.
    if (existsSync(manifestBak) && !existsSync(manifest)) await rename(manifestBak, manifest).catch(() => undefined);
  }
  throw new Error('SteamCMD did not report a successful install (see task log)');
}


export interface InstalledBuild {
  buildId?: string;
  branch?: string;
  lastUpdated?: number;
  sizeOnDisk?: number;
}

export async function readInstalledBuild(): Promise<InstalledBuild | null> {
  try {
    const v = parseVdf(await readFile(installPaths().appManifest, 'utf8'));
    const st = v.AppState as VdfObject;
    const uc = (st.UserConfig ?? {}) as VdfObject;
    const mc = (st.MountedConfig ?? {}) as VdfObject;
    return {
      buildId: st.buildid as string,
      branch: ((mc.BetaKey ?? uc.BetaKey ?? uc.betakey) as string) || 'public',
      lastUpdated: Number(st.LastUpdated ?? 0),
      sizeOnDisk: Number(st.SizeOnDisk ?? 0),
    };
  } catch {
    return null;
  }
}

/** Branches of the dedicated server app as Steam lists them (anonymous `app_info_print`). */
export async function fetchBranches(): Promise<SteamBranch[]> {
  const { output } = await runSteamcmd(['+login', 'anonymous', '+app_info_update', '1', '+app_info_print', String(config.steamAppId), '+quit']);
  const start = output.indexOf(`"${config.steamAppId}"`);
  if (start < 0) return [];
  try {
    const v = parseVdf(output.slice(start));
    const app = v[String(config.steamAppId)] as VdfObject;
    const raw = ((app.depots as VdfObject)?.branches ?? {}) as VdfObject;
    const branches: SteamBranch[] = Object.entries(raw)
      .filter(([, b]) => typeof b === 'object')
      .map(([name, b]) => {
        const o = b as VdfObject;
        return {
          name,
          buildId: String(o.buildid ?? ''),
          description: typeof o.description === 'string' ? o.description : undefined,
          timeUpdated: o.timeupdated ? Number(o.timeupdated) : undefined,
          passwordRequired: o.pwdrequired === '1',
        };
      });
    if (branches.length) kvSet('steam_branches', { branches, fetchedAt: new Date().toISOString() });
    return branches;
  } catch {
    return [];
  }
}

export function cachedBranches(): { branches: SteamBranch[]; fetchedAt?: string } {
  return kvGet<{ branches: SteamBranch[]; fetchedAt?: string }>('steam_branches', { branches: [] });
}

/** Latest buildid of a branch. */
export async function fetchLatestBuildId(branch: string): Promise<string | undefined> {
  const branches = await fetchBranches();
  return branches.find((b) => b.name === (branch || 'public'))?.buildId || undefined;
}

// ---------------------------------------------------------------- Steam Web API

export interface PublishedFileDetails {
  publishedfileid: string;
  result: number;
  title?: string;
  preview_url?: string;
  time_updated?: number;
  file_size?: number | string;
  consumer_app_id?: number;
  creator?: string;
  tags?: { tag: string }[];
  subscriptions?: number;
}

const API = 'https://api.steampowered.com';

export async function getPublishedFileDetails(ids: string[]): Promise<PublishedFileDetails[]> {
  if (!ids.length) return [];
  const out: PublishedFileDetails[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const body = new URLSearchParams({ itemcount: String(chunk.length) });
    chunk.forEach((id, j) => body.set(`publishedfileids[${j}]`, id));
    const r = await fetch(`${API}/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, { method: 'POST', body, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`Steam API ${r.status}`);
    const j = (await r.json()) as { response?: { publishedfiledetails?: PublishedFileDetails[] } };
    out.push(...(j.response?.publishedfiledetails ?? []));
  }
  const up = db.prepare(
    'INSERT INTO workshop_meta (workshop_id, title, preview, time_updated, size, fetched_at, tags, creator, subscriptions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(workshop_id) DO UPDATE SET title=excluded.title, preview=excluded.preview, time_updated=excluded.time_updated, size=excluded.size, fetched_at=excluded.fetched_at, tags=excluded.tags, creator=excluded.creator, subscriptions=excluded.subscriptions',
  );
  for (const d of out) {
    if (d.result === 1)
      up.run(d.publishedfileid, d.title ?? null, d.preview_url ?? null, d.time_updated ?? null, Number(d.file_size ?? 0), Date.now(), d.tags ? JSON.stringify(d.tags.map((t) => t.tag)) : null, d.creator ?? null, d.subscriptions ?? null);
  }
  return out;
}

/** Expand a Workshop collection into its child item ids. */
export async function getCollectionItems(collectionId: string): Promise<string[]> {
  const body = new URLSearchParams({ collectioncount: '1', 'publishedfileids[0]': collectionId });
  const r = await fetch(`${API}/ISteamRemoteStorage/GetCollectionDetails/v1/`, { method: 'POST', body, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Steam API ${r.status}`);
  const j = (await r.json()) as { response?: { collectiondetails?: { result: number; children?: { publishedfileid: string; filetype: number }[] }[] } };
  const c = j.response?.collectiondetails?.[0];
  if (!c || c.result !== 1) return [];
  return (c.children ?? []).filter((x) => x.filetype === 0).map((x) => x.publishedfileid);
}

/** Parse a Workshop id from an id, URL (`?id=123`) or text. */
export function parseWorkshopRef(s: string): string | null {
  const m = /(?:[?&]id=)?(\d{6,12})/.exec(s.trim());
  return m ? m[1] : null;
}

/** Local install times for Workshop items (from appworkshop_108600.acf). */
export async function readWorkshopAcf(): Promise<Record<string, { timeUpdated: number; size: number }>> {
  try {
    const v = parseVdf(await readFile(installPaths().workshopAcf, 'utf8'));
    const aw = v.AppWorkshop as VdfObject;
    const items = (aw.WorkshopItemsInstalled ?? {}) as VdfObject;
    const out: Record<string, { timeUpdated: number; size: number }> = {};
    for (const [id, it] of Object.entries(items)) {
      const o = it as VdfObject;
      out[id] = { timeUpdated: Number(o.timeupdated ?? 0), size: Number(o.size ?? 0) };
    }
    return out;
  } catch {
    return {};
  }
}
