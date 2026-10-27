import { chmodSync, copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Point the manager at a scratch data dir and a fake SteamCMD before loading modules.
const dir = mkdtempSync(join(tmpdir(), 'pzsm-dl-'));
const fake = join(dir, 'steamcmd.sh');
copyFileSync(fileURLToPath(new URL('./fixtures/fake-steamcmd.sh', import.meta.url)), fake);
chmodSync(fake, 0o755);
const plan = join(dir, 'plan');
const log = join(dir, 'downloaded');
const state = join(dir, 'state');
Object.assign(process.env, { PZSM_DATA: dir, STEAMCMD: fake, FAKE_STEAM_PLAN: plan, FAKE_STEAM_LOG: log, FAKE_STEAM_STATE: state });

type Mod = typeof import('../src/services/workshopDownloader.js');
let m: Mod;
const lines: string[] = [];
const ctx = { log: (l: string) => void lines.push(l), progress: () => undefined };
const ids = Array.from({ length: 12 }, (_, i) => String(3000000000 + i));
const downloaded = () => readFileSync(log, 'utf8').trim().split('\n').filter(Boolean);

beforeAll(async () => {
  m = await import('../src/services/workshopDownloader.js');
  Object.assign(m.downloaderLimits, { batchSize: 5, backoffBase: 0.01, backoffMax: 0.05, resumeDelay: 0.01, idleTimeoutMs: 2000 });
});
beforeEach(() => {
  writeFileSync(log, '');
  writeFileSync(state, '0');
  lines.length = 0;
  m.clearWorkshopJob();
});

describe('resilient workshop downloads', () => {
  it('kills a dead session and resumes from the first missing item', async () => {
    writeFileSync(plan, 'drop:3\nok\nok\nok\n');
    const r = await m.downloadWorkshopItems(ids, ctx, { force: true });
    expect(r.failed).toEqual([]);
    expect(r.ok).toEqual(ids);
    // Every item downloaded exactly once, in order: nothing is redone after the drop.
    expect(downloaded()).toEqual(ids);
    expect(lines.join('\n')).toMatch(/connection lost \(No Connection\)\. Resuming from 3000000003/);
    expect(m.workshopJobStatus()).toBeNull();
  });

  it('retries through login failures and hung sessions', async () => {
    writeFileSync(plan, 'loginfail\nhang\nok\nok\nok\n');
    const r = await m.downloadWorkshopItems(ids, ctx, { force: true });
    expect(r.failed).toEqual([]);
    expect(downloaded()).toEqual(ids);
    const text = lines.join('\n');
    expect(text).toMatch(/could not log in to Steam/);
    expect(text).toMatch(/no output from SteamCMD/);
  }, 30000);

  it('gives up after repeated stalls but keeps progress for a later resume', async () => {
    Object.assign(m.downloaderLimits, { maxStalledSessions: 3 });
    writeFileSync(plan, 'drop:4\ndrop:0\ndrop:0\ndrop:0\n');
    const r = await m.downloadWorkshopItems(ids, ctx, { force: true });
    expect(r.ok).toEqual(ids.slice(0, 4));
    expect(r.failed).toEqual(ids.slice(4));
    const st = m.workshopJobStatus()!;
    expect(st.done).toBe(4);
    expect(st.remaining[0]).toBe(ids[4]);

    // A later run (e.g. after a restart) keeps what finished and continues.
    writeFileSync(plan, 'ok\nok\nok\n');
    writeFileSync(state, '0');
    writeFileSync(log, '');
    const again = await m.downloadWorkshopItems(ids, ctx, { force: true });
    expect(again.failed).toEqual([]);
    expect(downloaded()).toEqual(ids.slice(4));
    expect(m.workshopJobStatus()).toBeNull();
    Object.assign(m.downloaderLimits, { maxStalledSessions: 8 });
  });
});
