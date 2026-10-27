/** Periodic sampling of the server process (CPU, RSS) and player count. */
import pidusage from 'pidusage';
import type { MetricPoint } from '@pzsm/shared';
import { db } from '../db.js';
import { bus } from '../util/events.js';
import { supervisor } from './supervisor.js';

let latest: { cpu?: number; rss?: number } = {};

export function latestMetrics() {
  return latest;
}

async function sample(): Promise<void> {
  const pid = supervisor.pid;
  if (!pid) {
    latest = {};
    return;
  }
  try {
    const s = await pidusage(pid);
    latest = { cpu: Math.round(s.cpu * 10) / 10, rss: s.memory };
  } catch {
    latest = {};
  }
  const players = supervisor.state === 'running' ? (await supervisor.refreshPlayers().catch(() => supervisor.players)).length : 0;
  db.prepare('INSERT OR REPLACE INTO metrics (t, cpu, rss, players) VALUES (?, ?, ?, ?)').run(Date.now(), latest.cpu ?? null, latest.rss ?? null, players);
  bus.emit('status', supervisor.statusSnapshot());
}

export function metricsHistory(hours = 24): MetricPoint[] {
  const since = Date.now() - hours * 3600_000;
  return db.prepare('SELECT t, cpu, rss, players FROM metrics WHERE t >= ? ORDER BY t').all(since) as MetricPoint[];
}

export function startMetrics(): void {
  setInterval(() => void sample(), 30_000).unref();
  setInterval(() => db.prepare('DELETE FROM metrics WHERE t < ?').run(Date.now() - 7 * 86400_000), 3600_000).unref();
}
