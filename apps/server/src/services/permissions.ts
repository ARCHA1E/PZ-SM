/**
 * B42 roles & capabilities, whitelist and bans, stored in Zomboid/db/<server>.db.
 *
 * The running server caches roles in memory, so structural role edits are only written
 * while it is stopped; otherwise they are queued and applied before the next launch.
 * User-level actions on a running server go through RCON commands.
 */
import Database from 'better-sqlite3';
import { copyFileSync, existsSync } from 'node:fs';
import type { BanEntry, PendingChange, PermissionsView, RoleView, WhitelistUser } from '@pzsm/shared';
import { audit, db as managerDb } from '../db.js';
import { getManifest } from './buildAnalyzer.js';
import { serverPaths } from './paths.js';
import { q } from './rcon.js';
import { supervisor } from './supervisor.js';

type Op =
  | { kind: 'saveRole'; role: { id?: number; name: string; description: string; color: [number, number, number]; position?: number; capabilities: string[] } }
  | { kind: 'deleteRole'; id: number }
  | { kind: 'setDefaultRole'; name: string; role: number }
  | { kind: 'setUserRole'; username: string; role: number }
  | { kind: 'deleteUser'; username: string }
  | { kind: 'ban'; steamid?: string; ip?: string; username?: string; reason?: string }
  | { kind: 'unban'; steamid?: string; ip?: string };

function open(readonly: boolean): Database.Database | null {
  const p = serverPaths().gameDb;
  if (!existsSync(p)) return null;
  const d = new Database(p, { readonly, fileMustExist: true });
  d.pragma('busy_timeout = 5000');
  return d;
}

function hasTable(d: Database.Database, t: string): boolean {
  return !!d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
}

export async function permissionsView(): Promise<PermissionsView> {
  const manifest = await getManifest();
  const pending = (managerDb.prepare('SELECT id, created_at, description, op FROM pending_role_ops ORDER BY id').all() as { id: number; created_at: string; description: string; op: string }[]).map(
    (r): PendingChange => ({ id: r.id, createdAt: r.created_at, description: r.description, op: JSON.parse(r.op) }),
  );
  const base: PermissionsView = { available: false, roles: [], capabilities: manifest?.capabilities ?? [], defaultRoles: {}, users: [], bans: [], pending };
  const d = open(true);
  if (!d) return { ...base, reason: 'The server database does not exist yet. Start the server once to create it.' };
  try {
    if (!hasTable(d, 'role')) return { ...base, reason: 'This server database has no roles table (pre-B42 world?).' };
    const caps = d.prepare('SELECT name, role FROM capabilities').all() as { name: string; role: number }[];
    const roles: RoleView[] = (d.prepare('SELECT * FROM role ORDER BY position').all() as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      description: String(r.description ?? ''),
      color: [Number(r.colorR ?? 1), Number(r.colorG ?? 1), Number(r.colorB ?? 1)],
      readonly: Number(r.readonly ?? 0) === 1,
      position: Number(r.position ?? 0),
      capabilities: caps.filter((c) => c.role === Number(r.id)).map((c) => c.name),
    }));
    const defaultRoles: Record<string, number> = {};
    if (hasTable(d, 'defaultRoles')) for (const r of d.prepare('SELECT name, role FROM defaultRoles').all() as { name: string; role: number }[]) defaultRoles[r.name] = r.role;
    const online = new Set(supervisor.players.map((p) => p.toLowerCase()));
    const users: WhitelistUser[] = (d.prepare('SELECT id, username, role, steamid, displayName, lastConnection FROM whitelist ORDER BY username COLLATE NOCASE').all() as Record<string, unknown>[]).map((u) => ({
      id: Number(u.id),
      username: String(u.username),
      role: Number(u.role),
      roleName: roles.find((r) => r.id === Number(u.role))?.name,
      steamid: u.steamid ? String(u.steamid) : undefined,
      displayName: u.displayName ? String(u.displayName) : undefined,
      lastConnection: u.lastConnection ? String(u.lastConnection) : undefined,
      online: online.has(String(u.username).toLowerCase()),
    }));
    const bans: BanEntry[] = [];
    if (hasTable(d, 'bannedid')) for (const b of d.prepare('SELECT steamid, reason FROM bannedid').all() as { steamid: string; reason: string }[]) bans.push({ kind: 'steamid', value: b.steamid, reason: b.reason ?? undefined });
    if (hasTable(d, 'bannedip')) for (const b of d.prepare('SELECT ip, username, reason FROM bannedip').all() as { ip: string; username: string; reason: string }[]) bans.push({ kind: 'ip', value: b.ip, username: b.username ?? undefined, reason: b.reason ?? undefined });
    const capabilities = [...new Set([...(manifest?.capabilities ?? []), ...caps.map((c) => c.name)])].filter((c) => c !== 'None').sort();
    return { available: true, roles, capabilities, defaultRoles, users, bans, pending };
  } finally {
    d.close();
  }
}

function describe(op: Op): string {
  switch (op.kind) {
    case 'saveRole':
      return `${op.role.id ? 'Update' : 'Create'} role "${op.role.name}" (${op.role.capabilities.length} capabilities)`;
    case 'deleteRole':
      return `Delete role #${op.id}`;
    case 'setDefaultRole':
      return `Default role for ${op.name} → #${op.role}`;
    case 'setUserRole':
      return `Set role of ${op.username} → #${op.role}`;
    case 'deleteUser':
      return `Remove ${op.username} from whitelist`;
    case 'ban':
      return `Ban ${op.steamid ?? op.ip ?? op.username}`;
    case 'unban':
      return `Unban ${op.steamid ?? op.ip}`;
  }
}

function applyOp(d: Database.Database, op: Op): void {
  switch (op.kind) {
    case 'saveRole': {
      const r = op.role;
      if (!/^[\w \-]{1,32}$/.test(r.name)) throw new Error('Role name must be 1-32 letters, digits, spaces, - or _');
      let id = r.id;
      if (id) {
        const ex = d.prepare('SELECT readonly FROM role WHERE id = ?').get(id) as { readonly: number } | undefined;
        if (!ex) throw new Error(`Role #${id} not found`);
        if (ex.readonly) {
          // Built-in roles: only capabilities may be changed.
        } else {
          d.prepare('UPDATE role SET name=?, description=?, colorR=?, colorG=?, colorB=?, position=COALESCE(?, position) WHERE id=?').run(r.name, r.description, r.color[0], r.color[1], r.color[2], r.position ?? null, id);
        }
      } else {
        if (d.prepare('SELECT 1 FROM role WHERE name = ? COLLATE NOCASE').get(r.name)) throw new Error(`Role "${r.name}" already exists`);
        const max = d.prepare('SELECT COALESCE(MAX(id),0) AS m, COALESCE(MAX(position),0) AS p FROM role').get() as { m: number; p: number };
        id = max.m + 1;
        d.prepare('INSERT INTO role (id, name, description, colorR, colorG, colorB, readonly, position) VALUES (?, ?, ?, ?, ?, ?, 0, ?)').run(id, r.name, r.description, r.color[0], r.color[1], r.color[2], r.position ?? max.p + 100);
      }
      d.prepare('DELETE FROM capabilities WHERE role = ?').run(id);
      const ins = d.prepare('INSERT INTO capabilities (name, role) VALUES (?, ?)');
      for (const c of new Set(r.capabilities)) ins.run(c, id);
      break;
    }
    case 'deleteRole': {
      const ex = d.prepare('SELECT readonly FROM role WHERE id = ?').get(op.id) as { readonly: number } | undefined;
      if (!ex) return;
      if (ex.readonly) throw new Error('Built-in roles cannot be deleted');
      const fallback = (d.prepare("SELECT role FROM defaultRoles WHERE name='defaultForUser'").get() as { role: number } | undefined)?.role ?? 2;
      d.prepare('UPDATE whitelist SET role = ? WHERE role = ?').run(fallback, op.id);
      d.prepare('UPDATE defaultRoles SET role = ? WHERE role = ?').run(fallback, op.id);
      d.prepare('DELETE FROM capabilities WHERE role = ?').run(op.id);
      d.prepare('DELETE FROM role WHERE id = ?').run(op.id);
      break;
    }
    case 'setDefaultRole':
      d.prepare('UPDATE defaultRoles SET role = ? WHERE name = ?').run(op.role, op.name);
      break;
    case 'setUserRole':
      d.prepare('UPDATE whitelist SET role = ? WHERE username = ? COLLATE NOCASE').run(op.role, op.username);
      break;
    case 'deleteUser':
      d.prepare('DELETE FROM whitelist WHERE username = ? COLLATE NOCASE').run(op.username);
      break;
    case 'ban':
      if (op.steamid) d.prepare('INSERT INTO bannedid (steamid, reason) VALUES (?, ?)').run(op.steamid, op.reason ?? '');
      if (op.ip) d.prepare('INSERT INTO bannedip (ip, username, reason) VALUES (?, ?, ?)').run(op.ip, op.username ?? '', op.reason ?? '');
      break;
    case 'unban':
      if (op.steamid) d.prepare('DELETE FROM bannedid WHERE steamid = ?').run(op.steamid);
      if (op.ip) d.prepare('DELETE FROM bannedip WHERE ip = ?').run(op.ip);
      break;
  }
}

function writeOps(ops: Op[]): void {
  const p = serverPaths().gameDb;
  if (!existsSync(p)) throw new Error('Server database does not exist yet');
  copyFileSync(p, `${p}.pzsm.bak`);
  const d = open(false)!;
  try {
    d.transaction(() => ops.forEach((o) => applyOp(d, o)))();
  } finally {
    d.close();
  }
}

/** Apply now (server stopped) or queue for the next launch. Returns 'applied' | 'queued'. */
export function submitOp(op: Op): 'applied' | 'queued' {
  audit('permissions', describe(op));
  if (supervisor.running || supervisor.state === 'stopping') {
    managerDb.prepare('INSERT INTO pending_role_ops (created_at, description, op) VALUES (?, ?, ?)').run(new Date().toISOString(), describe(op), JSON.stringify(op));
    return 'queued';
  }
  writeOps([op]);
  return 'applied';
}

export function discardPending(id?: number): void {
  if (id === undefined) managerDb.prepare('DELETE FROM pending_role_ops').run();
  else managerDb.prepare('DELETE FROM pending_role_ops WHERE id = ?').run(id);
}

export function pendingCount(): number {
  return (managerDb.prepare('SELECT COUNT(*) AS n FROM pending_role_ops').get() as { n: number }).n;
}

/** Hook: apply queued ops before the server starts. */
export async function applyPendingOps(): Promise<void> {
  const rows = managerDb.prepare('SELECT id, op FROM pending_role_ops ORDER BY id').all() as { id: number; op: string }[];
  if (!rows.length || !existsSync(serverPaths().gameDb)) return;
  writeOps(rows.map((r) => JSON.parse(r.op) as Op));
  managerDb.prepare('DELETE FROM pending_role_ops WHERE id <= ?').run(rows[rows.length - 1].id);
  supervisor.sys(`Applied ${rows.length} queued permission change(s)`);
}

// ------------------------------------------------------------------ user actions (live via RCON)

async function roleName(id: number): Promise<string> {
  const v = await permissionsView();
  const r = v.roles.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown role #${id}`);
  return r.name;
}

export async function setUserRole(username: string, role: number): Promise<string> {
  if (supervisor.state === 'running') {
    const out = await supervisor.command(`setaccesslevel ${q(username)} ${q(await roleName(role))}`);
    audit('user.role', `${username} → ${role}`);
    return out || 'ok';
  }
  return submitOp({ kind: 'setUserRole', username, role });
}

export async function addUser(username: string, password: string): Promise<string> {
  if (supervisor.state !== 'running') throw new Error('Adding accounts requires the server to be running (the game hashes passwords itself)');
  audit('user.add', username);
  return supervisor.command(`adduser ${q(username)} ${q(password)}`);
}

export async function removeUser(username: string): Promise<string> {
  if (supervisor.state === 'running') {
    audit('user.remove', username);
    return supervisor.command(`removeuserfromwhitelist ${q(username)}`);
  }
  return submitOp({ kind: 'deleteUser', username });
}

export async function setUserPassword(username: string, password: string): Promise<string> {
  if (supervisor.state !== 'running') throw new Error('Changing passwords requires the server to be running');
  audit('user.password', username);
  return supervisor.command(`setpassword ${q(username)} ${q(password)}`);
}

export async function banUser(opts: { username?: string; steamid?: string; ip?: string; reason?: string; banIp?: boolean }): Promise<string> {
  if (supervisor.state === 'running') {
    audit('ban', opts);
    if (opts.username) return supervisor.command(`banuser ${q(opts.username)}${opts.banIp ? ' -ip' : ''}${opts.reason ? ` -r ${q(opts.reason)}` : ''}`);
    if (opts.steamid) return supervisor.command(`banid ${q(opts.steamid)}`);
    if (opts.ip) return supervisor.command(`banip ${q(opts.ip)}`);
    throw new Error('Nothing to ban');
  }
  if (!opts.steamid && !opts.ip) throw new Error('With the server stopped, ban by Steam ID or IP');
  return submitOp({ kind: 'ban', steamid: opts.steamid, ip: opts.ip, username: opts.username, reason: opts.reason });
}

export async function unban(opts: { username?: string; steamid?: string; ip?: string }): Promise<string> {
  if (supervisor.state === 'running') {
    audit('unban', opts);
    if (opts.username) return supervisor.command(`unbanuser ${q(opts.username)}`);
    if (opts.steamid) return supervisor.command(`unbanid ${q(opts.steamid)}`);
    if (opts.ip) return supervisor.command(`unbanip ${q(opts.ip)}`);
    throw new Error('Nothing to unban');
  }
  return submitOp({ kind: 'unban', steamid: opts.steamid, ip: opts.ip });
}

export type { Op as PermissionOp };
