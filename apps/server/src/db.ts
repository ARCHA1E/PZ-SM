import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ManagerSettings } from '@pzsm/shared';
import { config } from './config.js';

mkdirSync(config.managerDir, { recursive: true });

export const db: Database.Database = new Database(join(config.managerDir, 'pzsm.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const MIGRATIONS: string[] = [
  `CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
   CREATE TABLE audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL);
   CREATE TABLE sessions (token TEXT PRIMARY KEY, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
   CREATE TABLE metrics (t INTEGER PRIMARY KEY, cpu REAL, rss INTEGER, players INTEGER);
   CREATE TABLE schedules (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, cron TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL DEFAULT '{}', last_run TEXT);
   CREATE TABLE pending_role_ops (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, description TEXT NOT NULL, op TEXT NOT NULL);
   CREATE TABLE manifests (key TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL);
   CREATE TABLE workshop_meta (workshop_id TEXT PRIMARY KEY, title TEXT, preview TEXT, time_updated INTEGER, size INTEGER, fetched_at INTEGER);
   CREATE TABLE players_seen (username TEXT PRIMARY KEY, steamid TEXT, first_seen TEXT, last_seen TEXT, last_ip TEXT);`,
];

function migrate() {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (v INTEGER NOT NULL)');
  const row = db.prepare('SELECT v FROM schema_version').get() as { v: number } | undefined;
  let v = row?.v ?? 0;
  if (!row) db.prepare('INSERT INTO schema_version (v) VALUES (0)').run();
  while (v < MIGRATIONS.length) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.prepare('UPDATE schema_version SET v = ?').run(v + 1);
    })();
    v++;
  }
}
migrate();

export function kvGet<T>(key: string, fallback: T): T {
  const r = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined;
  if (!r) return fallback;
  try {
    return JSON.parse(r.value) as T;
  } catch {
    return fallback;
  }
}

export function kvSet(key: string, value: unknown): void {
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
}

export const DEFAULT_SETTINGS: ManagerSettings = {
  serverName: 'pzserver',
  branch: 'public',
  branchPassword: '',
  javaMaxMemory: '8g',
  javaMinMemory: '',
  extraJvmArgs: '',
  extraServerArgs: '',
  bindIp: '',
  autoStart: true,
  restartOnCrash: true,
  updateOnStart: false,
  validateOnUpdate: false,
  backupRetention: 10,
  restartWarningMinutes: [15, 5, 1],
  restartWarningMessage: 'Server restarting in {minutes} minute(s).',
  modUpdateAction: 'notify',
  steamApiKey: '',
  adminUsername: 'admin',
};

export function getSettings(): ManagerSettings {
  const stored = kvGet<Partial<ManagerSettings> | null>('settings', null);
  if (!stored) {
    const init: ManagerSettings = { ...DEFAULT_SETTINGS };
    if (config.initial.serverName) init.serverName = config.initial.serverName;
    if (config.initial.branch) init.branch = config.initial.branch;
    if (config.initial.javaMaxMemory) init.javaMaxMemory = config.initial.javaMaxMemory;
    kvSet('settings', init);
    return init;
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(patch: Partial<ManagerSettings>): ManagerSettings {
  const next = { ...getSettings(), ...patch };
  kvSet('settings', next);
  return next;
}

export function audit(action: string, detail: unknown = ''): void {
  db.prepare('INSERT INTO audit (at, action, detail) VALUES (?, ?, ?)').run(
    new Date().toISOString(),
    action,
    typeof detail === 'string' ? detail : JSON.stringify(detail),
  );
}
