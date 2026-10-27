/** <server>_spawnregions.lua and spawnpoints.lua files. */
import { isTable, luaKey, luaString, parseTableAfter, toPlain, type LuaTable } from './lua.js';

export interface SpawnRegion {
  name: string;
  /** Path relative to game/mod root, e.g. `media/maps/Muldraugh, KY/spawnpoints.lua`. */
  file?: string;
  /** File in the server's own config dir, e.g. `servertest_spawnpoints.lua`. */
  serverfile?: string;
}

export function parseSpawnRegions(text: string): SpawnRegion[] {
  const t = parseTableAfter(text, /return\s*\{/);
  const out: SpawnRegion[] = [];
  for (const f of t.fields) {
    if (!isTable(f.value)) continue;
    const o = toPlain(f.value) as Record<string, unknown>;
    out.push({
      name: String(o.name ?? ''),
      file: typeof o.file === 'string' ? o.file : undefined,
      serverfile: typeof o.serverfile === 'string' ? o.serverfile : undefined,
    });
  }
  return out;
}

export function writeSpawnRegions(regions: SpawnRegion[], eol = '\r\n'): string {
  const lines = ['function SpawnRegions()', '\treturn {'];
  for (const r of regions) {
    const parts = [`name = ${luaString(r.name)}`];
    if (r.file) parts.push(`file = ${luaString(r.file)}`);
    if (r.serverfile) parts.push(`serverfile = ${luaString(r.serverfile)}`);
    lines.push(`\t\t{ ${parts.join(', ')} },`);
  }
  lines.push('\t}', 'end');
  return lines.join(eol) + eol;
}

/**
 * A spawn point. B42 files use cell-relative `worldX/worldY` (cell) + `posX/posY` (within cell);
 * older/absolute files use world `posX/posY` directly. `posZ` is the floor.
 */
export interface SpawnPoint {
  worldX?: number;
  worldY?: number;
  posX: number;
  posY: number;
  posZ?: number;
}

/** profession id (e.g. `unemployed`, `policeofficer`) → points */
export type SpawnPoints = Record<string, SpawnPoint[]>;

export function parseSpawnPoints(text: string): SpawnPoints {
  const t: LuaTable = parseTableAfter(text, /return\s*\{/);
  const out: SpawnPoints = {};
  for (const f of t.fields) {
    if (!isTable(f.value)) continue;
    const list = toPlain(f.value);
    const arr = Array.isArray(list) ? list : [];
    out[String(f.key)] = arr
      .filter((p): p is Record<string, number> => typeof p === 'object' && p !== null)
      .map((p) => {
        const sp: SpawnPoint = { posX: Number(p.posX ?? 0), posY: Number(p.posY ?? 0) };
        if (p.worldX !== undefined) sp.worldX = Number(p.worldX);
        if (p.worldY !== undefined) sp.worldY = Number(p.worldY);
        if (p.posZ !== undefined) sp.posZ = Number(p.posZ);
        return sp;
      });
  }
  return out;
}

export function writeSpawnPoints(points: SpawnPoints, eol = '\r\n'): string {
  const lines = ['function SpawnPoints()', '\treturn {'];
  for (const [prof, list] of Object.entries(points)) {
    lines.push(`\t\t${luaKey(prof)} = {`);
    for (const p of list) {
      const parts: string[] = [];
      if (p.worldX !== undefined) parts.push(`worldX = ${p.worldX}`);
      if (p.worldY !== undefined) parts.push(`worldY = ${p.worldY}`);
      parts.push(`posX = ${p.posX}`, `posY = ${p.posY}`);
      if (p.posZ !== undefined) parts.push(`posZ = ${p.posZ}`);
      lines.push(`\t\t\t{ ${parts.join(', ')} },`);
    }
    lines.push('\t\t},');
  }
  lines.push('\t}', 'end');
  return lines.join(eol) + eol;
}

/** Convert a spawn point to absolute world tile coordinates (B42 cells are 256 tiles). */
export function toAbsolute(p: SpawnPoint, cellSize = 256): { x: number; y: number; z: number } {
  if (p.worldX !== undefined && p.worldY !== undefined) {
    return { x: p.worldX * cellSize + p.posX, y: p.worldY * cellSize + p.posY, z: p.posZ ?? 0 };
  }
  return { x: p.posX, y: p.posY, z: p.posZ ?? 0 };
}
