/** Multi-step operations combining Steam, the supervisor, backups and analysis. */
import { audit, getSettings, kvGet, kvSet } from '../db.js';
import { createBackup } from './backups.js';
import { analyzeBuild, getManifest, summarize } from './buildAnalyzer.js';
import { invalidateModScan, getModState, scanMods, setActiveMods, setWorkshopItems } from './mods.js';
import { addMissingSandboxDefaults } from './settingsRegistry.js';
import { fetchLatestBuildId, getPublishedFileDetails, installOrUpdateServer, readInstalledBuild, readWorkshopAcf } from './steam.js';
import { downloadWorkshopItems, workshopJobStatus } from './workshopDownloader.js';
import { getRequiredItems, resolvePersonas } from './workshopBrowse.js';
import { supervisor } from './supervisor.js';
import { runTask } from './tasks.js';

export async function installOrUpdate(opts: { validate?: boolean; restart?: boolean } = {}): Promise<void> {
  const wasRunning = supervisor.running;
  let failure: unknown;
  try {
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
      invalidateModScan();
      kvSet('update_available', false);
      audit('server.update', `${before?.buildId ?? 'none'} → ${after?.buildId}`);
    });
  } catch (e) {
    failure = e;
    audit('server.update.failed', (e as Error).message);
  }
  // Bring the server back whether or not the update worked: a failed SteamCMD job leaves
  // the installed build untouched, and an offline server is worse than an outdated one.
  if ((wasRunning || (opts.restart && !failure)) && supervisor.installed() && (supervisor.state === 'stopped' || supervisor.state === 'crashed')) {
    if (failure) supervisor.sys(`Update failed (${(failure as Error).message}); starting the server again on the installed build`);
    await supervisor.start(failure ? 'after failed update' : 'after-update').catch((e) => supervisor.sys(`Start failed: ${(e as Error).message}`));
  }
  if (failure) throw failure;
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
  await refreshWorkshopMeta(r.ok).catch(() => undefined);
  audit('workshop.download', `${r.ok.length} ok${r.failed.length ? `, failed: ${r.failed.join(',')}` : ''}`);
  return r;
}

/** Titles, previews, tags, authors and "Required items" for Workshop items, from Steam. */
export async function refreshWorkshopMeta(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const details = await getPublishedFileDetails(ids);
  await Promise.all([
    getRequiredItems(ids).catch(() => ({})),
    resolvePersonas([...new Set(details.map((d) => d.creator).filter((c): c is string => !!c))]).catch(() => ({})),
  ]);
  kvSet('workshop_meta_refreshed', Date.now());
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
/**
 * Add Workshop items (already expanded with their dependencies / collection children) to the
 * server, download them, then enable mods. With enable='auto', items providing exactly one
 * mod are enabled (plus anything those mods require); items with several mods are left for
 * the admin to choose, since they are often variants of each other.
 */
export async function installWorkshopItems(ids: string[], opts: { enable?: 'auto' | 'none' } = {}): Promise<{ enabled: string[]; needsChoice: string[]; failed: string[] }> {
  const st = await getModState();
  await setWorkshopItems([...st.workshopItems, ...ids]);
  audit('workshop.install', ids.join(','));
  const r = await downloadWorkshop(ids);
  await afterModsChanged();
  if (opts.enable === 'none') return { enabled: [], needsChoice: [], failed: r.failed };
  const mods = await scanMods();
  const enable: string[] = [];
  const needsChoice: string[] = [];
  for (const wid of ids) {
    const its = mods.filter((m) => m.workshopId === wid);
    if (its.length === 1) enable.push(its[0].id);
    else if (its.length > 1) needsChoice.push(wid);
  }
  if (enable.length) {
    const now = await getModState();
    await setActiveMods([...now.active, ...enable.filter((id) => !now.active.includes(id))], { withDependencies: true });
    await afterModsChanged();
    if (supervisor.running) supervisor.pendingRestart = true;
  }
  return { enabled: enable, needsChoice, failed: r.failed };
}

export async function afterModsChanged(): Promise<string[]> {
  invalidateModScan();
  return addMissingSandboxDefaults().catch(() => []);
}

export function cachedUpdateInfo(): { updateAvailable: boolean; modUpdates: string[] } {
  return { updateAvailable: kvGet('update_available', false), modUpdates: kvGet<string[]>('mod_updates', []) };
}
