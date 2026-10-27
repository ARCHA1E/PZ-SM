import type { ServerStatus } from '@pzsm/shared';
import { getManifest } from './services/buildAnalyzer.js';
import { latestMetrics } from './services/metrics.js';
import { cachedUpdateInfo } from './services/operations.js';
import { pendingCount } from './services/permissions.js';
import { readInstalledBuild } from './services/steam.js';
import { supervisor } from './services/supervisor.js';

let buildCache: { at: number; buildId?: string } = { at: 0 };

export async function fullStatus(): Promise<ServerStatus> {
  const s = supervisor.statusSnapshot();
  if (Date.now() - buildCache.at > 60_000) buildCache = { at: Date.now(), buildId: (await readInstalledBuild())?.buildId };
  const m = await getManifest().catch(() => null);
  const upd = cachedUpdateInfo();
  return {
    ...s,
    ...latestMetrics() && { cpu: latestMetrics().cpu, memRss: latestMetrics().rss },
    buildId: buildCache.buildId,
    buildVersion: m?.version,
    pendingRoleChanges: pendingCount(),
    updateAvailable: upd.updateAvailable,
    modUpdatesAvailable: upd.modUpdates.length,
  };
}
