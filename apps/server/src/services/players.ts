/** Known players: whitelist accounts + characters in players.db + live list. */
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { serverPaths } from './paths.js';
import { permissionsView } from './permissions.js';
import { supervisor } from './supervisor.js';

export interface PlayerRow {
  username: string;
  online: boolean;
  steamid?: string;
  role?: string;
  lastConnection?: string;
  character?: { name?: string; x: number; y: number; z: number; dead: boolean };
}

export async function listPlayers(): Promise<PlayerRow[]> {
  const perms = await permissionsView().catch(() => null);
  const online = new Set(supervisor.players.map((p) => p.toLowerCase()));
  const rows = new Map<string, PlayerRow>();
  for (const u of perms?.users ?? []) {
    rows.set(u.username.toLowerCase(), { username: u.username, online: online.has(u.username.toLowerCase()), steamid: u.steamid, role: u.roleName, lastConnection: u.lastConnection });
  }
  const pdb = join(serverPaths().save, 'players.db');
  if (existsSync(pdb)) {
    const d = new Database(pdb, { readonly: true, fileMustExist: true });
    try {
      const chars = d.prepare('SELECT username, name, x, y, z, isDead, steamid FROM networkPlayers').all() as { username: string; name: string; x: number; y: number; z: number; isDead: number; steamid: string }[];
      for (const c of chars) {
        const key = String(c.username).toLowerCase();
        const r = rows.get(key) ?? { username: c.username, online: online.has(key) };
        // Keep the living character if there are several.
        if (!r.character || r.character.dead) r.character = { name: c.name, x: Math.round(c.x), y: Math.round(c.y), z: Math.round(c.z), dead: c.isDead === 1 };
        r.steamid ??= c.steamid ? String(c.steamid) : undefined;
        rows.set(key, r);
      }
    } catch {
      /* schema differs; ignore */
    } finally {
      d.close();
    }
  }
  for (const p of supervisor.players) if (!rows.has(p.toLowerCase())) rows.set(p.toLowerCase(), { username: p, online: true });
  return [...rows.values()].sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));
}
