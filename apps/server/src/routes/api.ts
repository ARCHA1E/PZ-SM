import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePresetCfg, parseSandboxVars, cfgValueToScalar, sandboxToRecord, writePresetCfg, decodeText } from '@pzsm/pz-formats';
import type { ManagerSettings, OptionValue } from '@pzsm/shared';
import { readFile, rm } from 'node:fs/promises';
import { config } from '../config.js';
import { audit, db, getSettings, kvGet, kvSet, saveSettings } from '../db.js';
import { setPassword, verifyPassword } from '../auth.js';
import { fullStatus } from '../status.js';
import { analyzeBuild, getManifest, summarize } from '../services/buildAnalyzer.js';
import { backupPath, createBackup, deleteBackup, importServerArchive, listBackups, restoreBackup } from '../services/backups.js';
import { listLogFiles, readLog, searchLogs } from '../services/logs.js';
import { getServerSpawnPoints, getSpawnRegions, mapCatalog, setMapOrder, setServerSpawnPoints, setSpawnRegions, suggestSpawnRegions, worldOperation, type WorldOp } from '../services/maps.js';
import { metricsHistory } from '../services/metrics.js';
import { findModPoster, invalidateModScan, modsView, removeWorkshopItem, setActiveMods, getModState, setWorkshopItems } from '../services/mods.js';
import { afterModsChanged, checkGameUpdate, checkModUpdates, downloadWorkshop, installOrUpdate } from '../services/operations.js';
import { installPaths, serverPaths } from '../services/paths.js';
import { addUser, banUser, discardPending, permissionsView, removeUser, setUserPassword, setUserRole, submitOp, unban } from '../services/permissions.js';
import { listPlayers } from '../services/players.js';
import { q } from '../services/rcon.js';
import { deleteSchedule, listSchedules, runScheduleNow, saveSchedule } from '../services/scheduler.js';
import { applySandboxSettings, applyServerSettings, sandboxSettingsView, serverSettingsView, addMissingSandboxDefaults } from '../services/settingsRegistry.js';
import { getCollectionItems, getPublishedFileDetails, parseWorkshopRef } from '../services/steam.js';
import { supervisor } from '../services/supervisor.js';
import { currentTask, runTask, taskLog } from '../services/tasks.js';
import { readSandbox, replaceSandboxText } from '../services/configStore.js';
import { readTextFile } from '../util/fs.js';

/** Fire-and-forget for long operations; errors are reported through the task stream. */
function background(p: Promise<unknown>) {
  p.catch((e) => supervisor.sys(`Error: ${(e as Error).message}`));
}

export async function apiRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------- status & control
  app.get('/api/status', async () => fullStatus());
  app.get('/api/console', async () => ({ lines: supervisor.consoleLines.slice(-2000) }));
  app.get('/api/task', async () => ({ task: currentTask(), log: taskLog() }));

  app.post('/api/server/start', async () => {
    await supervisor.start('manual');
    return { ok: true };
  });
  app.post('/api/server/stop', async (req) => {
    const b = z.object({ warn: z.boolean().optional() }).parse(req.body ?? {});
    background(
      (async () => {
        if (b.warn && supervisor.state === 'running') {
          const s = getSettings();
          for (const m of [...s.restartWarningMinutes].sort((a, b2) => b2 - a)) {
            await supervisor.command(`servermsg "Server shutting down in ${m} minute(s)."`).catch(() => undefined);
            await new Promise((r) => setTimeout(r, 60_000));
          }
        }
        await supervisor.stop({ reason: 'manual' });
      })(),
    );
    return { ok: true };
  });
  app.post('/api/server/restart', async (req) => {
    const b = z.object({ warn: z.boolean().optional() }).parse(req.body ?? {});
    background(b.warn ? supervisor.restartWithWarnings('Restart requested by admin') : supervisor.restart('manual'));
    return { ok: true };
  });
  app.post('/api/server/kill', async () => {
    const pid = supervisor.pid;
    if (pid) process.kill(pid, 'SIGKILL');
    audit('server.kill');
    return { ok: true };
  });
  app.post('/api/server/command', async (req) => {
    const b = z.object({ command: z.string().min(1).max(2000) }).parse(req.body);
    audit('console', b.command);
    const output = await supervisor.command(b.command);
    return { output };
  });
  app.post('/api/server/message', async (req) => {
    const b = z.object({ message: z.string().min(1).max(500) }).parse(req.body);
    return { output: await supervisor.command(`servermsg ${q(b.message)}`) };
  });
  app.post('/api/server/save', async () => ({ output: await supervisor.command('save') }));

  app.post('/api/server/install', async (req) => {
    const b = z.object({ validate: z.boolean().optional() }).parse(req.body ?? {});
    background(installOrUpdate({ validate: b.validate }));
    return { ok: true };
  });
  app.post('/api/server/check-update', async () => checkGameUpdate());

  // ---------------------------------------------------------------- build analysis
  app.get('/api/build', async () => {
    const m = await getManifest();
    return m ? { manifest: summarize(m), warnings: m.warnings, presets: m.presets } : { manifest: null };
  });
  app.post('/api/build/analyze', async () => summarize(await analyzeBuild()));
  app.get('/api/build/commands', async () => {
    const m = await getManifest();
    return (m?.commands ?? []).map((c) => ({
      names: c.names,
      argSets: c.argSets,
      help: c.helpKey ? m!.text[c.helpKey] ?? c.helpKey : undefined,
      capabilities: c.capabilities.map((x) => x.capability),
    }));
  });

  // ---------------------------------------------------------------- settings
  app.get('/api/settings/server', async () => serverSettingsView());
  app.put('/api/settings/server', async (req) => {
    const b = z.object({ values: z.record(z.union([z.string(), z.number(), z.boolean()])) }).parse(req.body);
    return applyServerSettings(b.values);
  });
  app.get('/api/settings/sandbox', async () => sandboxSettingsView());
  app.put('/api/settings/sandbox', async (req) => {
    const b = z.object({ values: z.record(z.union([z.string(), z.number(), z.boolean()])) }).parse(req.body);
    return applySandboxSettings(b.values);
  });
  app.post('/api/settings/sandbox/fill-defaults', async () => ({ added: await addMissingSandboxDefaults() }));
  app.get('/api/settings/raw/:file', async (req, reply) => {
    const { file } = req.params as { file: string };
    const sp = serverPaths();
    const map: Record<string, string> = { ini: sp.ini, sandbox: sp.sandbox, spawnregions: sp.spawnregions, spawnpoints: sp.spawnpoints };
    if (!map[file]) return reply.code(404).send({ error: 'unknown file' });
    const f = await readTextFile(map[file]);
    let text = f?.text ?? '';
    if (file === 'ini') text = text.replace(/^(Password|RCONPassword|DiscordToken|WebhookAddress)=.+$/gm, '$1=********');
    return { text, exists: !!f };
  });

  // Sandbox presets: vanilla (game) and .cfg (Zomboid/Sandbox Presets)
  app.get('/api/sandbox/presets', async () => {
    const m = await getManifest();
    const { readdirSync } = await import('node:fs');
    let cfgs: string[] = [];
    try {
      cfgs = readdirSync(serverPaths().presets).filter((f) => f.endsWith('.cfg'));
    } catch {
      /* none */
    }
    return { vanilla: m?.presets ?? [], saved: cfgs.map((f) => f.replace(/\.cfg$/, '')) };
  });
  app.post('/api/sandbox/presets/apply', async (req) => {
    const b = z.object({ source: z.enum(['vanilla', 'saved', 'upload']), name: z.string().optional(), content: z.string().optional(), mode: z.enum(['merge', 'replace']).default('merge') }).parse(req.body);
    let values: Record<string, OptionValue> = {};
    if (b.source === 'vanilla') {
      const f = await readTextFile(join(installPaths().presetsLua, `${b.name}.lua`));
      if (!f) throw new Error('Preset not found');
      values = sandboxToRecord(parseSandboxVars(f.text)) as Record<string, OptionValue>;
    } else {
      const text = b.source === 'saved' ? (await readTextFile(join(serverPaths().presets, `${b.name}.cfg`)))?.text : b.content;
      if (!text) throw new Error('Preset not found');
      if (/SandboxVars\s*=|return\s*\{/.test(text)) values = sandboxToRecord(parseSandboxVars(text)) as Record<string, OptionValue>;
      else {
        const view = await sandboxSettingsView();
        const types = new Map(view.settings.map((s) => [s.key, s.type]));
        const cfg = parsePresetCfg(text);
        for (const [k, v] of Object.entries(cfg.values)) values[k] = cfgValueToScalar(v, types.get(k)) as OptionValue;
      }
    }
    for (const k of Object.keys(values)) if (values[k] === null) delete values[k];
    if (b.mode === 'replace') {
      const view = await sandboxSettingsView();
      for (const s of view.settings) if (!(s.key in values) && s.default !== undefined && s.source !== 'file-comment') values[s.key] = s.default;
    }
    audit('sandbox.preset', `${b.source}:${b.name ?? 'upload'} (${b.mode})`);
    return applySandboxSettings(values);
  });
  app.get('/api/sandbox/export.cfg', async (_req, reply) => {
    const sb = await readSandbox();
    if (!sb) return reply.code(404).send({ error: 'No SandboxVars yet' });
    const vals = sandboxToRecord(sb);
    const comments = Object.fromEntries(sb.entries.map((e) => [e.path, e.comments.map((c) => c.trim())]));
    reply.header('content-type', 'text/plain; charset=utf-8').header('content-disposition', `attachment; filename="${getSettings().serverName}.cfg"`);
    return writePresetCfg(sb.version ?? 6, vals, comments);
  });
  app.post('/api/sandbox/import-lua', async (req) => {
    const b = z.object({ text: z.string().min(10) }).parse(req.body);
    parseSandboxVars(b.text); // validate
    await replaceSandboxText(b.text);
    return { ok: true };
  });

  // ---------------------------------------------------------------- mods & workshop
  app.get('/api/mods', async () => modsView());
  app.post('/api/mods/rescan', async () => {
    invalidateModScan();
    return modsView();
  });
  app.put('/api/mods/active', async (req) => {
    const b = z.object({ ids: z.array(z.string()), withDependencies: z.boolean().optional() }).parse(req.body);
    const list = await setActiveMods(b.ids, { withDependencies: b.withDependencies });
    const added = await afterModsChanged();
    if (supervisor.running) supervisor.pendingRestart = true;
    return { active: list, sandboxDefaultsAdded: added };
  });
  app.post('/api/workshop/add', async (req) => {
    const b = z.object({ refs: z.array(z.string()).min(1), download: z.boolean().default(true) }).parse(req.body);
    const ids = new Set<string>();
    for (const r of b.refs) {
      const id = parseWorkshopRef(r);
      if (!id) throw new Error(`Not a Workshop id/URL: ${r}`);
      ids.add(id);
    }
    // Expand collections
    const details = await getPublishedFileDetails([...ids]).catch(() => []);
    for (const d of details) {
      if (d.result !== 1) continue;
      const children = await getCollectionItems(d.publishedfileid).catch(() => []);
      if (children.length) {
        ids.delete(d.publishedfileid);
        children.forEach((c) => ids.add(c));
      }
    }
    const state = await getModState();
    await setWorkshopItems([...state.workshopItems, ...ids]);
    audit('workshop.add', [...ids].join(','));
    if (b.download) background(downloadWorkshop([...ids]).then(() => afterModsChanged()));
    return { added: [...ids] };
  });
  app.post('/api/workshop/download', async (req) => {
    const b = z.object({ ids: z.array(z.string()).optional() }).parse(req.body ?? {});
    const ids = b.ids?.length ? b.ids : (await getModState()).workshopItems;
    background(downloadWorkshop(ids).then(() => afterModsChanged()));
    return { ok: true, count: ids.length };
  });
  app.delete('/api/workshop/:id', async (req) => {
    const { id } = req.params as { id: string };
    await removeWorkshopItem(id);
    return { ok: true };
  });
  app.post('/api/workshop/check-updates', async () => ({ outdated: await checkModUpdates() }));
  app.post('/api/workshop/refresh-meta', async () => {
    const st = await getModState();
    const view = await modsView();
    await getPublishedFileDetails([...new Set([...st.workshopItems, ...view.workshop.map((w) => w.workshopId)])]);
    return { ok: true };
  });
  app.get('/api/mods/poster/:wid/:id', async (req, reply) => {
    const { wid, id } = req.params as { wid: string; id: string };
    const p = await findModPoster(wid, id);
    if (!p) return reply.code(404).send();
    reply.header('cache-control', 'max-age=3600').type('image/png');
    return reply.send(createReadStream(p));
  });

  // ---------------------------------------------------------------- maps & spawns
  app.get('/api/maps', async () => mapCatalog());
  app.put('/api/maps/order', async (req) => {
    const b = z.object({ order: z.array(z.string()) }).parse(req.body);
    await setMapOrder(b.order);
    return mapCatalog();
  });
  app.get('/api/maps/spawnregions', async () => ({ ...(await getSpawnRegions()), suggested: await suggestSpawnRegions() }));
  app.put('/api/maps/spawnregions', async (req) => {
    const b = z.object({ regions: z.array(z.object({ name: z.string(), file: z.string().optional(), serverfile: z.string().optional() })) }).parse(req.body);
    await setSpawnRegions(b.regions);
    return getSpawnRegions();
  });
  app.get('/api/maps/spawnpoints', async () => ({ points: await getServerSpawnPoints(), file: `${getSettings().serverName}_spawnpoints.lua` }));
  app.put('/api/maps/spawnpoints', async (req) => {
    const pt = z.object({ worldX: z.number().optional(), worldY: z.number().optional(), posX: z.number(), posY: z.number(), posZ: z.number().optional() });
    const b = z.object({ points: z.record(z.array(pt)) }).parse(req.body);
    await setServerSpawnPoints(b.points);
    return { ok: true };
  });
  app.post('/api/world/:op', async (req) => {
    const { op } = req.params as { op: string };
    const ops: WorldOp[] = ['soft-reset', 'new-worldgen', 'wipe-world', 'wipe-all'];
    if (!ops.includes(op as WorldOp)) throw new Error('Unknown operation');
    if (op !== 'soft-reset') await runTask('backup', 'Backup before world operation', (ctx) => createBackup('pre-wipe', `Before ${op}`, ctx)).catch((e) => {
      if (!/Nothing to back up/.test((e as Error).message)) throw e;
    });
    await worldOperation(op as WorldOp);
    return { ok: true };
  });

  // ---------------------------------------------------------------- permissions & players
  app.get('/api/permissions', async () => permissionsView());
  app.put('/api/permissions/roles', async (req) => {
    const b = z
      .object({ id: z.number().optional(), name: z.string().min(1).max(32), description: z.string().max(200).default(''), color: z.tuple([z.number(), z.number(), z.number()]), position: z.number().optional(), capabilities: z.array(z.string()) })
      .parse(req.body);
    return { result: submitOp({ kind: 'saveRole', role: b }) };
  });
  app.delete('/api/permissions/roles/:id', async (req) => ({ result: submitOp({ kind: 'deleteRole', id: Number((req.params as { id: string }).id) }) }));
  app.put('/api/permissions/default-roles', async (req) => {
    const b = z.object({ name: z.string(), role: z.number() }).parse(req.body);
    return { result: submitOp({ kind: 'setDefaultRole', ...b }) };
  });
  app.delete('/api/permissions/pending/:id?', async (req) => {
    const { id } = req.params as { id?: string };
    discardPending(id ? Number(id) : undefined);
    return { ok: true };
  });
  app.post('/api/users', async (req) => {
    const b = z.object({ username: z.string().min(1).max(50), password: z.string().min(1).max(100) }).parse(req.body);
    return { output: await addUser(b.username, b.password) };
  });
  app.delete('/api/users/:username', async (req) => ({ output: await removeUser((req.params as { username: string }).username) }));
  app.put('/api/users/:username/role', async (req) => {
    const b = z.object({ role: z.number() }).parse(req.body);
    return { output: await setUserRole((req.params as { username: string }).username, b.role) };
  });
  app.put('/api/users/:username/password', async (req) => {
    const b = z.object({ password: z.string().min(1).max(100) }).parse(req.body);
    return { output: await setUserPassword((req.params as { username: string }).username, b.password) };
  });
  app.post('/api/bans', async (req) => {
    const b = z.object({ username: z.string().optional(), steamid: z.string().optional(), ip: z.string().optional(), reason: z.string().max(200).optional(), banIp: z.boolean().optional() }).parse(req.body);
    return { output: await banUser(b) };
  });
  app.post('/api/bans/remove', async (req) => {
    const b = z.object({ username: z.string().optional(), steamid: z.string().optional(), ip: z.string().optional() }).parse(req.body);
    return { output: await unban(b) };
  });
  app.get('/api/players', async () => {
    await supervisor.refreshPlayers().catch(() => undefined);
    return { players: await listPlayers() };
  });
  app.post('/api/players/:username/action', async (req) => {
    const { username } = req.params as { username: string };
    const b = z
      .object({
        action: z.enum(['kick', 'godmode', 'invisible', 'additem', 'addxp', 'teleport-to-player', 'addvehicle', 'voiceban', 'message']),
        reason: z.string().max(200).optional(),
        value: z.string().max(200).optional(),
        count: z.number().int().min(1).max(1000).optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);
    const u = q(username);
    let cmd: string;
    switch (b.action) {
      case 'kick':
        cmd = `kickuser ${u}${b.reason ? ` -r ${q(b.reason)}` : ''}`;
        break;
      case 'godmode':
        cmd = `godmodplayer ${u} ${b.enabled === false ? '-false' : '-true'}`;
        break;
      case 'invisible':
        cmd = `invisibleplayer ${u} ${b.enabled === false ? '-false' : '-true'}`;
        break;
      case 'additem':
        cmd = `additem ${u} ${q(b.value ?? '')} ${b.count ?? 1}`;
        break;
      case 'addxp':
        cmd = `addxp ${u} ${b.value ?? ''}`;
        break;
      case 'teleport-to-player':
        cmd = `teleportplayer ${u} ${q(b.value ?? '')}`;
        break;
      case 'addvehicle':
        cmd = `addvehicle ${q(b.value ?? '')} ${u}`;
        break;
      case 'voiceban':
        cmd = `voiceban ${u} ${b.enabled === false ? '-false' : '-true'}`;
        break;
      case 'message':
        cmd = `servermsg ${q(`${username}: ${b.value ?? ''}`)}`;
        break;
    }
    audit('player.action', cmd);
    return { output: await supervisor.command(cmd) };
  });

  // ---------------------------------------------------------------- logs, metrics, audit
  app.get('/api/logs', async () => ({ files: listLogFiles() }));
  app.get('/api/logs/read', async (req) => {
    const qy = z.object({ path: z.string(), search: z.string().optional(), limit: z.coerce.number().optional(), from: z.enum(['start', 'end']).optional() }).parse(req.query);
    return readLog(qy);
  });
  app.get('/api/logs/search', async (req) => {
    const qy = z.object({ types: z.string().default(''), q: z.string().min(1), limit: z.coerce.number().default(500) }).parse(req.query);
    return { results: await searchLogs(qy.types.split(',').filter(Boolean), qy.q, qy.limit) };
  });
  app.get('/api/metrics', async (req) => {
    const qy = z.object({ hours: z.coerce.number().min(1).max(168).default(24) }).parse(req.query);
    return { points: metricsHistory(qy.hours) };
  });
  app.get('/api/audit', async (req) => {
    const qy = z.object({ limit: z.coerce.number().max(1000).default(200) }).parse(req.query);
    return { entries: db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT ?').all(qy.limit) };
  });

  // ---------------------------------------------------------------- backups
  app.get('/api/backups', async () => ({ backups: listBackups() }));
  app.post('/api/backups', async (req) => {
    const b = z.object({ note: z.string().max(200).optional() }).parse(req.body ?? {});
    return runTask('backup', 'Manual backup', (ctx) => createBackup('manual', b.note, ctx));
  });
  app.delete('/api/backups/:id', async (req) => {
    deleteBackup((req.params as { id: string }).id);
    return { ok: true };
  });
  app.post('/api/backups/:id/restore', async (req) => {
    const { id } = req.params as { id: string };
    background(runTask('restore', `Restore ${id}`, (ctx) => restoreBackup(id, ctx)));
    return { ok: true };
  });
  app.get('/api/backups/:id/download', async (req, reply) => {
    const p = backupPath((req.params as { id: string }).id);
    if (!existsSync(p)) return reply.code(404).send();
    reply.header('content-disposition', `attachment; filename="${p.split(/[\\/]/).pop()}"`).type('application/gzip');
    return reply.send(createReadStream(p));
  });
  app.post('/api/import', async (req) => {
    const file = await req.file();
    if (!file) throw new Error('No file uploaded');
    const dir = join(tmpdir(), 'pzsm-upload');
    mkdirSync(dir, { recursive: true });
    const dest = join(dir, `${Date.now()}-${file.filename.replace(/[^\w.\-]/g, '_')}`);
    await pipeline(file.file, createWriteStream(dest));
    background(runTask('import', `Import ${file.filename}`, (ctx) => importServerArchive(dest, file.filename, ctx)).finally(() => rm(dest, { force: true })));
    return { ok: true };
  });

  // ---------------------------------------------------------------- schedules
  app.get('/api/schedules', async () => ({ schedules: listSchedules() }));
  app.put('/api/schedules', async (req) => {
    const b = z
      .object({
        id: z.number().optional(),
        kind: z.enum(['restart', 'backup', 'mod-update-check', 'game-update-check', 'message', 'command']),
        cron: z.string().min(5).max(100),
        enabled: z.boolean(),
        payload: z.record(z.unknown()).default({}),
      })
      .parse(req.body);
    return saveSchedule(b);
  });
  app.delete('/api/schedules/:id', async (req) => {
    deleteSchedule(Number((req.params as { id: string }).id));
    return { ok: true };
  });
  app.post('/api/schedules/:id/run', async (req) => {
    background(runScheduleNow(Number((req.params as { id: string }).id)));
    return { ok: true };
  });

  // ---------------------------------------------------------------- manager settings
  app.get('/api/manager/settings', async () => {
    const s = getSettings();
    return { settings: { ...s, branchPassword: s.branchPassword ? '********' : '', steamApiKey: s.steamApiKey ? '********' : '' }, ingameAdmin: kvGet('ingame_admin', null), paths: { install: config.installDir, cache: config.cacheDir, backups: config.backupDir } };
  });
  app.put('/api/manager/settings', async (req) => {
    const b = z
      .object({
        serverName: z.string().regex(/^[A-Za-z0-9_\-]{1,40}$/, 'letters, digits, _ and - only').optional(),
        branch: z.string().regex(/^[\w.\-]{1,40}$/).optional(),
        branchPassword: z.string().max(100).optional(),
        javaMaxMemory: z.string().regex(/^\d+[mMgG]$/, 'e.g. 8g or 6144m').optional(),
        javaMinMemory: z.string().regex(/^(\d+[mMgG])?$/).optional(),
        extraJvmArgs: z.string().max(1000).optional(),
        extraServerArgs: z.string().max(1000).optional(),
        bindIp: z.string().max(64).optional(),
        autoStart: z.boolean().optional(),
        restartOnCrash: z.boolean().optional(),
        updateOnStart: z.boolean().optional(),
        validateOnUpdate: z.boolean().optional(),
        backupRetention: z.number().int().min(1).max(500).optional(),
        restartWarningMinutes: z.array(z.number().int().min(1).max(120)).max(10).optional(),
        restartWarningMessage: z.string().max(200).optional(),
        modUpdateAction: z.enum(['notify', 'restart']).optional(),
        steamApiKey: z.string().max(100).optional(),
        adminUsername: z.string().max(50).optional(),
      })
      .parse(req.body) as Partial<ManagerSettings>;
    if (b.branchPassword === '********') delete b.branchPassword;
    if (b.steamApiKey === '********') delete b.steamApiKey;
    if (b.serverName && b.serverName !== getSettings().serverName && supervisor.running) throw new Error('Stop the server before changing the server name');
    const s = saveSettings(b);
    audit('manager.settings', Object.keys(b).join(', '));
    invalidateModScan();
    return { settings: s };
  });
  app.put('/api/manager/password', async (req) => {
    const b = z.object({ current: z.string(), next: z.string().min(8) }).parse(req.body);
    if (!verifyPassword(b.current)) throw Object.assign(new Error('Current password is wrong'), { statusCode: 403 });
    setPassword(b.next);
    audit('manager.password');
    return { ok: true };
  });
  app.put('/api/manager/ingame-admin', async (req) => {
    const b = z.object({ username: z.string().min(1).max(50), password: z.string().min(4).max(100) }).parse(req.body);
    if (supervisor.state === 'running') {
      const out = await supervisor.command(`setpassword ${q(b.username)} ${q(b.password)}`);
      kvSet('ingame_admin', b);
      return { output: out };
    }
    kvSet('pending_admin', b);
    kvSet('ingame_admin', b);
    return { output: 'Will be applied on next start' };
  });

  // Raw file read for the default sandbox/ini (used by "view file")
  app.get('/api/files/vanilla-preset/:name', async (req) => {
    const { name } = req.params as { name: string };
    if (!/^[\w\-]+$/.test(name)) throw new Error('bad name');
    const t = await readFile(join(installPaths().presetsLua, `${name}.lua`));
    return { text: decodeText(t).text };
  });
}
