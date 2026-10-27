/** Multi-step operations combining Steam, the supervisor, backups and analysis. */
import { audit, getSettings, kvGet, kvSet } from '../db.js';
import { createBackup } from './backups.js';
import { analyzeBuild, getManifest, summarize } from './buildAnalyzer.js';
import { invalidateModScan, getModState } from './mods.js';
import { addMissingSandboxDefaults } from './settingsRegistry.js';
import { fetchLatestBuildId, getPublishedFileDetails, installOrUpdateServer, readInstalledBuild, readWorkshopAcf } from './steam.js';
import { downloadWorkshopItems, workshopJobStatus } from './workshopDownloader.js';
import { supervisor } from './supervisor.js';
import { runTask } from './tasks.js';

export async function installOrUpdate(opts: { validate?: boolean; restart?: boolean } = {}): Promise<void> {
  const wasRunning = supervisor.running;
  await runTask(supervisor.installed() ? 'update' : 'install', supervisor.installed() ? 'Update game server' : 'Install game server', async (ctx) => {
    if (wasRunning) {
      ctx.log('Stopping server for update');
      await supervisor.stop({ reason: 'update' });
    }
    if (supervisor.installed() && (await getManifest())) {
      try {
        await createBackup('pre-update', 'Before game update', ctx);
      } catch (e) {
        ctx.log(`Backup skipped: ${(e as Error).message}`);
      }
    }
    const before = await readInstalledBuild();
    await installOrUpdateServer(ctx, { validate: opts.validate });
    const after = await readInstalledBuild();
    ctx.log(`Build ${before?.buildId ?? '(none)'} → ${after?.buildId ?? '?'}`);
    ctx.log('Analyzing build…');
    const m = await analyzeBuild();
    const sum = summarize(m);
    ctx.log(`Found ${sum.serverOptions} server options, ${sum.sandboxOptions} sandbox options, ${sum.commands} commands, ${sum.capabilities} capabilities (game ${m.version ?? '?'})`);
    if (sum.diff && (sum.diff.added.length || sum.diff.removed.length)) ctx.log(`Changes vs previous build: +${sum.diff.added.length} / -${sum.diff.removed.length} options`);
    kvSet('update_available', false);
    audit('server.update', `${before?.buildId ?? 'none'} → ${after?.buildId}`);
  });
  if (wasRunning || opts.restart) await supervisor.start('after-update');
}

export async function checkGameUpdate(): Promise<{ installed?: string; latest?: string; updateAvailable: boolean }> {
  const [inst, latest] = await Promise.all([readInstalledBuild(), fetchLatestBuildId(getSettings().branch)]);
  const updateAvailable = !!(inst?.buildId && latest && inst.buildId !== latest);
  kvSet('update_available', updateAvailable);
  kvSet('latest_build', latest ?? null);
  return { installed: inst?.buildId, latest, updateAvailable };
}

/** Download (or update) Workshop items now, then refresh mod scan and sandbox defaults. */
export async function downloadWorkshop(ids: string[], opts: { validate?: boolean; force?: boolean } = {}): Promise<{ ok: string[]; failed: string[] }> {
  const r = await runTask('workshop', `Download ${ids.length} Workshop item(s)`, (ctx) => downloadWorkshopItems(ids, ctx, opts));
  invalidateModScan();
  await getPublishedFileDetails(r.ok).catch(() => []);
  audit('workshop.download', `${r.ok.length} ok${r.failed.length ? `, failed: ${r.failed.join(',')}` : ''}`);
  return r;
}

/** Continue an interrupted Workshop download from where it stopped. */
export async function resumeWorkshopDownload(): Promise<{ ok: string[]; failed: string[] }> {
  const st = workshopJobStatus();
  if (!st) throw new Error('No interrupted Workshop download to resume');
  return downloadWorkshop([...st.remaining]);
}

/** Compare Workshop time_updated with the local install; returns outdated item ids. */
export async function checkModUpdates(): Promise<string[]> {
  const { workshopItems } = await getModState();
  if (!workshopItems.length) {
    kvSet('mod_updates', []);
    return [];
  }
  const [details, acf] = await Promise.all([getPublishedFileDetails(workshopItems), readWorkshopAcf()]);
  const outdated = details.filter((d) => d.result === 1 && d.time_updated && acf[d.publishedfileid] && d.time_updated > acf[d.publishedfileid].timeUpdated).map((d) => d.publishedfileid);
  kvSet('mod_updates', outdated);
  return outdated;
}

let modUpdateRestartPending = false;

/** Scheduled job: detect updates and act per settings (notify or restart with warnings). */
export async function modUpdateJob(actionOverride?: 'notify' | 'restart'): Promise<string[]> {
  const outdated = await checkModUpdates();
  const action = actionOverride ?? getSettings().modUpdateAction;
  if (!outdated.length) return outdated;
  supervisor.sys(`Workshop updates available for: ${outdated.join(', ')}`);
  if (action === 'restart' && supervisor.state === 'running' && !modUpdateRestartPending) {
    modUpdateRestartPending = true;
    try {
      await supervisor.restartWithWarnings('Workshop mod update');
      // The server downloads updated items itself on startup.
      kvSet('mod_updates', []);
    } finally {
      modUpdateRestartPending = false;
    }
  }
  return outdated;
}

/** After mods change: rescan and seed default values for newly available sandbox options. */
export async function afterModsChanged(): Promise<string[]> {
  invalidateModScan();
  return addMissingSandboxDefaults().catch(() => []);
}

export function cachedUpdateInfo(): { updateAvailable: boolean; modUpdates: string[] } {
  return { updateAvailable: kvGet('update_available', false), modUpdates: kvGet<string[]>('mod_updates', []) };
}
