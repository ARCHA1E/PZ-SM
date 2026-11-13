import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'pzsm-upd-'));
const fake = join(dir, 'steamcmd.sh');
copyFileSync(fileURLToPath(new URL('./fixtures/fake-steamcmd-update.sh', import.meta.url)), fake);
chmodSync(fake, 0o755);
const calls = join(dir, 'calls');
const manifest = join(dir, 'server', 'steamapps', 'appmanifest_380870.acf');
Object.assign(process.env, { PZSM_DATA: dir, STEAMCMD: fake, FAKE_UPDATE_LOG: calls });

type Mod = typeof import('../src/services/steam.js');
let m: Mod;
const lines: string[] = [];
const ctx = { log: (l: string) => void lines.push(l), progress: () => undefined };
const invocations = () => readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean);
const OLD = '"AppState"\n{\n\t"appid"\t\t"380870"\n\t"buildid"\t\t"25485538"\n}\n';

beforeAll(async () => {
  m = await import('../src/services/steam.js');
  m.steamLimits.retryDelayMs = 1;
});
beforeEach(() => {
  writeFileSync(calls, '');
  lines.length = 0;
  mkdirSync(join(dir, 'server', 'steamapps'), { recursive: true });
  writeFileSync(manifest, OLD);
});

describe('game server update', () => {
  it('uses a plain update when it works', async () => {
    process.env.FAKE_UPDATE_MODE = 'ok';
    await m.installOrUpdateServer(ctx);
    expect(invocations()).toHaveLength(1);
    expect(invocations()[0]).not.toMatch(/validate/);
    // The branch is always named, or SteamCMD stays on a previously selected one.
    expect(invocations()[0]).toContain('+app_update 380870 -beta public');
    expect((await m.readInstalledBuild())?.buildId).toBe('26486687');
  });

  it('falls back to validate when the delta update is refused (state 0x6)', async () => {
    process.env.FAKE_UPDATE_MODE = 'needs-validate';
    await m.installOrUpdateServer(ctx);
    const inv = invocations();
    expect(inv).toHaveLength(2);
    expect(inv[1]).toContain('+app_update 380870 -beta public validate');
    expect(lines.join('\n')).toMatch(/Retrying with file validation/);
    expect((await m.readInstalledBuild())?.buildId).toBe('26486687');
  });

  it('resets the install record as a last resort', async () => {
    process.env.FAKE_UPDATE_MODE = 'needs-reset';
    await m.installOrUpdateServer(ctx);
    expect(invocations()).toHaveLength(3);
    expect((await m.readInstalledBuild())?.buildId).toBe('26486687');
    expect(existsSync(`${manifest}.pzsm.bak`)).toBe(false);
  });

  it('keeps the old install record when every attempt fails', async () => {
    process.env.FAKE_UPDATE_MODE = 'fail';
    await expect(m.installOrUpdateServer(ctx)).rejects.toThrow(/did not report a successful install/);
    expect(invocations()).toHaveLength(3);
    expect(readFileSync(manifest, 'utf8')).toBe(OLD);
    expect(existsSync(`${manifest}.pzsm.bak`)).toBe(false);
  });
});
