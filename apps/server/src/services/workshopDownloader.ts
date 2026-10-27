/**
 * Resilient Workshop downloads through SteamCMD.
 *
 * Long SteamCMD sessions tend to lose their Steam connection part-way; from then on every
 * remaining item fails instantly with "No Connection". This downloader watches the output
 * live, kills the session as soon as the connection is clearly gone, waits with backoff and
 * starts a fresh session with the items that are still missing, in their original order.
 * Progress is persisted, so an interrupted job (even across a manager restart) can resume.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config.js';
import { kvGet, kvSet } from '../db.js';
import { installPaths } from './paths.js';
import { getPublishedFileDetails, readWorkshopAcf } from './steam.js';
import { SteamcmdWorkshopParser, isConnectionFailure, isPermanentFailure } from './steamcmdOutput.js';
import type { TaskContext } from './tasks.js';

const JOB_KEY = 'workshop_job';

/** Tunables (exported for tests). */
export const downloaderLimits = {
  /** Items per SteamCMD session; fresh sessions are less likely to go stale. */
  batchSize: 40,
  /** Consecutive connection failures before a session is considered dead. */
  deadAfter: 2,
  /** Attempts per item for item-level failures (timeouts, unknown errors). */
  maxItemAttempts: 5,
  /** Give up after this many sessions in a row without a single success. */
  maxStalledSessions: 8,
  /** Backoff after a dead session: base * 2^(stalled-1), capped. Seconds. */
  backoffBase: 15,
  backoffMax: 300,
  /** Kill a session that prints nothing for this long (large items print nothing while downloading). */
  idleTimeoutMs: 30 * 60_000,
  /** Pause before continuing after a session died but made progress. Seconds. */
  resumeDelay: 5,
};

export interface WorkshopJob {
  ids: string[];
  done: string[];
  /** Items that will not succeed (removed/private), with SteamCMD's reason. */
  permanent: Record<string, string>;
  attempts: Record<string, number>;
  lastError?: string;
  startedAt: string;
  updatedAt: string;
}

export interface WorkshopJobStatus {
  total: number;
  done: number;
  remaining: string[];
  permanent: Record<string, string>;
  lastError?: string;
  updatedAt: string;
}

export function workshopJobStatus(): WorkshopJobStatus | null {
  const j = kvGet<WorkshopJob | null>(JOB_KEY, null);
  if (!j) return null;
  const done = new Set(j.done);
  const remaining = j.ids.filter((id) => !done.has(id) && !j.permanent[id]);
  if (!remaining.length) return null;
  return { total: j.ids.length, done: j.done.length, remaining, permanent: j.permanent, lastError: j.lastError, updatedAt: j.updatedAt };
}

export function clearWorkshopJob(): void {
  kvSet(JOB_KEY, null);
}

interface SessionResult {
  succeeded: string[];
  failures: { id: string; reason: string }[];
  /** Session was ended early because the connection was lost. */
  dead: boolean;
  deadReason?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One SteamCMD process downloading `batch` in order; stops early when the connection dies. */
function runSession(batch: string[], validate: boolean, ctx: TaskContext, onSuccess: (id: string, bytes: number) => void): Promise<SessionResult> {
  const args = ['+force_install_dir', config.installDir, '+login', 'anonymous'];
  for (const id of batch) {
    args.push('+workshop_download_item', String(config.workshopAppId), id);
    if (validate) args.push('validate');
  }
  args.push('+quit');
  return new Promise((resolve, reject) => {
    const res: SessionResult = { succeeded: [], failures: [], dead: false };
    // Own process group: steamcmd.sh is a wrapper around the real binary, and both must die.
    const p = spawn(config.steamcmd, args, { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    const killGroup = (sig: NodeJS.Signals) => {
      try {
        if (p.pid) process.kill(-p.pid, sig);
      } catch {
        p.kill(sig);
      }
    };
    const parser = new SteamcmdWorkshopParser();
    let connFailStreak = 0;
    let finished = false;
    let idle: NodeJS.Timeout;
    const kill = (reason: string) => {
      if (res.dead) return;
      res.dead = true;
      res.deadReason = reason;
      killGroup('SIGTERM');
      setTimeout(() => {
        if (!finished) killGroup('SIGKILL');
      }, 5000).unref();
    };
    const resetIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => kill('no output from SteamCMD for too long'), downloaderLimits.idleTimeoutMs);
    };
    resetIdle();
    const onData = (d: Buffer) => {
      resetIdle();
      for (const ev of parser.feed(d.toString('utf8'))) {
        if (res.dead) return;
        switch (ev.type) {
          case 'success':
            connFailStreak = 0;
            res.succeeded.push(ev.id);
            onSuccess(ev.id, ev.bytes);
            break;
          case 'failure':
            res.failures.push({ id: ev.id, reason: ev.reason });
            if (isConnectionFailure(ev.reason)) {
              connFailStreak++;
              if (connFailStreak >= downloaderLimits.deadAfter) kill(`connection lost (${ev.reason})`);
            } else {
              ctx.log(`✖ ${ev.id}: ${ev.reason}`);
            }
            break;
          case 'login-failed':
            kill(`could not log in to Steam (${ev.reason})`);
            break;
        }
      }
    };
    p.stdout.on('data', onData);
    p.stderr.on('data', onData);
    p.on('error', (e) => {
      finished = true;
      clearTimeout(idle);
      reject(e);
    });
    p.on('close', () => {
      finished = true;
      clearTimeout(idle);
      resolve(res);
    });
  });
}

function fmtMB(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Download/update Workshop items into the server install dir (where the server looks).
 * Already up-to-date items are skipped unless `validate` or `force` is set.
 */
export async function downloadWorkshopItems(
  ids: string[],
  ctx: TaskContext,
  opts: { validate?: boolean; force?: boolean } = {},
): Promise<{ ok: string[]; failed: string[] }> {
  const order = [...new Set(ids.map((i) => i.trim()).filter((i) => /^\d+$/.test(i)))];
  if (!order.length) return { ok: [], failed: [] };
  if (!config.dryRun && !existsSync(config.steamcmd)) throw new Error(`SteamCMD not found at ${config.steamcmd} (set STEAMCMD)`);

  // Resume a previous job for the same items, keeping what already finished.
  const prev = kvGet<WorkshopJob | null>(JOB_KEY, null);
  const now = new Date().toISOString();
  const job: WorkshopJob = { ids: order, done: [], permanent: {}, attempts: {}, startedAt: now, updatedAt: now };
  if (prev && !opts.validate) {
    const wanted = new Set(order);
    job.done = prev.done.filter((id) => wanted.has(id));
    if (job.done.length) ctx.log(`Resuming: ${job.done.length} item(s) finished in an earlier run`);
  }
  const done = new Set(job.done);
  const save = () => {
    job.done = [...done];
    job.updatedAt = new Date().toISOString();
    kvSet(JOB_KEY, job);
  };

  // Skip items that are installed and not older than the Workshop version.
  if (!opts.validate && !opts.force) {
    try {
      const [details, acf] = await Promise.all([getPublishedFileDetails(order.filter((i) => !done.has(i))), readWorkshopAcf()]);
      const content = installPaths().workshopContent;
      let skipped = 0;
      for (const d of details) {
        const local = acf[d.publishedfileid];
        if (d.result === 1 && local && d.time_updated && local.timeUpdated >= d.time_updated && existsSync(join(content, d.publishedfileid))) {
          done.add(d.publishedfileid);
          skipped++;
        } else if (d.result !== 1 && d.result !== undefined) {
          job.permanent[d.publishedfileid] = `not available on the Workshop (result ${d.result})`;
        }
      }
      if (skipped) ctx.log(`${skipped} item(s) already up to date`);
      for (const [id, r] of Object.entries(job.permanent)) ctx.log(`✖ ${id}: ${r}`);
    } catch (e) {
      ctx.log(`Could not check for updates (${(e as Error).message}); downloading everything`);
    }
  }
  save();

  const total = order.length;
  const report = () => ctx.progress((done.size / total) * 100, `${done.size}/${total} Workshop items`);
  report();
  let stalled = 0;
  let session = 0;

  for (;;) {
    const remaining = order.filter((id) => !done.has(id) && !job.permanent[id] && (job.attempts[id] ?? 0) < downloaderLimits.maxItemAttempts);
    if (!remaining.length) break;
    const batch = remaining.slice(0, downloaderLimits.batchSize);
    session++;
    ctx.log(`SteamCMD session ${session}: ${batch.length} item(s), starting with ${batch[0]} (${remaining.length} left)`);

    let r: SessionResult;
    if (config.dryRun) {
      r = { succeeded: batch, failures: [], dead: false };
      batch.forEach((id) => done.add(id));
    } else {
      r = await runSession(batch, !!opts.validate, ctx, (id, bytes) => {
        done.add(id);
        delete job.attempts[id];
        ctx.log(`✔ ${id} (${fmtMB(bytes)}) — ${done.size}/${total}`);
        save();
        report();
      });
    }

    // Item-level outcomes. Connection failures are the session's fault, not the item's,
    // except the first one of a streak, which may be an item that times out every time.
    let firstConnFailureCounted = false;
    for (const f of r.failures) {
      if (done.has(f.id)) continue;
      if (isPermanentFailure(f.reason)) job.permanent[f.id] = f.reason;
      else if (!isConnectionFailure(f.reason) || (!firstConnFailureCounted && /timeout/i.test(f.reason))) {
        job.attempts[f.id] = (job.attempts[f.id] ?? 0) + 1;
        if (isConnectionFailure(f.reason)) firstConnFailureCounted = true;
      }
    }
    // Items the session never reached were not attempted at all.
    if (!r.dead && !r.succeeded.length && !r.failures.length) {
      // SteamCMD exited without reporting anything (crash/self-update): count against the first item.
      job.attempts[batch[0]] = (job.attempts[batch[0]] ?? 0) + 1;
      r.dead = true;
      r.deadReason = 'SteamCMD exited without downloading anything';
    }
    job.lastError = r.deadReason ?? job.lastError;
    save();
    report();

    stalled = r.succeeded.length ? 0 : stalled + 1;
    if (stalled >= downloaderLimits.maxStalledSessions) {
      ctx.log(`Giving up after ${stalled} sessions without progress (${job.lastError ?? 'unknown error'}). Use "Resume download" to continue later.`);
      break;
    }
    if (r.dead || stalled) {
      const wait = stalled ? Math.min(downloaderLimits.backoffMax, downloaderLimits.backoffBase * 2 ** (stalled - 1)) : downloaderLimits.resumeDelay;
      const next = order.find((id) => !done.has(id) && !job.permanent[id]);
      ctx.log(`Session ended: ${r.deadReason ?? 'no items succeeded'}. Resuming${next ? ` from ${next}` : ''} in ${wait}s`);
      await sleep(wait * 1000);
    }
  }

  const ok = order.filter((id) => done.has(id));
  const failed = order.filter((id) => !done.has(id));
  if (!failed.filter((id) => !job.permanent[id]).length) clearWorkshopJob();
  if (failed.length) ctx.log(`${failed.length} item(s) not downloaded: ${failed.map((id) => (job.permanent[id] ? `${id} (${job.permanent[id]})` : id)).join(', ')}`);
  else ctx.log(`All ${total} Workshop item(s) are up to date`);
  return { ok, failed };
}
