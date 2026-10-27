/** Cron-style schedules stored in the manager db. */
import { Cron } from 'croner';
import type { ScheduleEntry } from '@pzsm/shared';
import { audit, db, kvGet, kvSet } from '../db.js';
import { createBackup } from './backups.js';
import { checkGameUpdate, installOrUpdate, modUpdateJob } from './operations.js';
import { supervisor } from './supervisor.js';
import { currentTask, runTask } from './tasks.js';

const jobs = new Map<number, Cron>();

interface Row {
  id: number;
  kind: ScheduleEntry['kind'];
  cron: string;
  enabled: number;
  payload: string;
  last_run: string | null;
}

function toEntry(r: Row): ScheduleEntry {
  return {
    id: r.id,
    kind: r.kind,
    cron: r.cron,
    enabled: !!r.enabled,
    payload: JSON.parse(r.payload || '{}'),
    lastRun: r.last_run ?? undefined,
    nextRun: jobs.get(r.id)?.nextRun()?.toISOString(),
  };
}

export function listSchedules(): ScheduleEntry[] {
  return (db.prepare('SELECT * FROM schedules ORDER BY id').all() as Row[]).map(toEntry);
}

async function runJob(e: ScheduleEntry): Promise<void> {
  db.prepare('UPDATE schedules SET last_run = ? WHERE id = ?').run(new Date().toISOString(), e.id);
  const p = e.payload as Record<string, unknown>;
  switch (e.kind) {
    case 'restart':
      if (supervisor.state === 'running') await supervisor.restartWithWarnings(String(p.reason ?? 'Scheduled restart'), Array.isArray(p.warnings) ? (p.warnings as number[]) : undefined);
      break;
    case 'backup':
      if (!currentTask()) await runTask('backup', 'Scheduled backup', (ctx) => createBackup('scheduled', undefined, ctx));
      break;
    case 'mod-update-check':
      await modUpdateJob(p.action === 'restart' || p.action === 'notify' ? p.action : undefined);
      break;
    case 'game-update-check': {
      const r = await checkGameUpdate();
      if (r.updateAvailable && p.autoUpdate) {
        if (supervisor.state === 'running') {
          await supervisor.restartWithWarnings('Game update').catch(() => undefined);
          await supervisor.stop({ reason: 'game update' });
        }
        await installOrUpdate({ restart: true });
      }
      break;
    }
    case 'message':
      if (supervisor.state === 'running' && p.text) await supervisor.command(`servermsg "${String(p.text).replace(/"/g, "'")}"`);
      break;
    case 'command':
      if (supervisor.state === 'running' && p.command) await supervisor.command(String(p.command));
      break;
  }
}

export function reloadSchedules(): void {
  for (const j of jobs.values()) j.stop();
  jobs.clear();
  for (const e of listSchedules()) {
    if (!e.enabled) continue;
    try {
      const job = new Cron(e.cron, { protect: true, catch: (err) => supervisor.sys(`Schedule #${e.id} (${e.kind}) failed: ${(err as Error).message}`) }, () => runJob(e));
      jobs.set(e.id, job);
    } catch (err) {
      supervisor.sys(`Invalid cron for schedule #${e.id}: ${(err as Error).message}`);
    }
  }
}

export function saveSchedule(e: Omit<ScheduleEntry, 'id' | 'lastRun' | 'nextRun'> & { id?: number }): ScheduleEntry {
  new Cron(e.cron, { paused: true }).stop(); // validates the expression
  let id = e.id;
  if (id) db.prepare('UPDATE schedules SET kind=?, cron=?, enabled=?, payload=? WHERE id=?').run(e.kind, e.cron, e.enabled ? 1 : 0, JSON.stringify(e.payload ?? {}), id);
  else id = Number(db.prepare('INSERT INTO schedules (kind, cron, enabled, payload) VALUES (?, ?, ?, ?)').run(e.kind, e.cron, e.enabled ? 1 : 0, JSON.stringify(e.payload ?? {})).lastInsertRowid);
  audit('schedule.save', `${e.kind} ${e.cron}`);
  reloadSchedules();
  return listSchedules().find((s) => s.id === id)!;
}

export function deleteSchedule(id: number): void {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  audit('schedule.delete', String(id));
  reloadSchedules();
}

export async function runScheduleNow(id: number): Promise<void> {
  const e = listSchedules().find((s) => s.id === id);
  if (!e) throw new Error('Schedule not found');
  await runJob(e);
}

/** Sensible defaults on first boot. */
export function seedSchedules(): void {
  if (kvGet('schedules_seeded', false)) return;
  const ins = db.prepare('INSERT INTO schedules (kind, cron, enabled, payload) VALUES (?, ?, ?, ?)');
  ins.run('mod-update-check', '*/15 * * * *', 1, JSON.stringify({}));
  ins.run('backup', '0 */6 * * *', 1, JSON.stringify({}));
  ins.run('game-update-check', '0 * * * *', 1, JSON.stringify({ autoUpdate: false }));
  ins.run('restart', '0 6 * * *', 0, JSON.stringify({ reason: 'Daily restart' }));
  kvSet('schedules_seeded', true);
}
