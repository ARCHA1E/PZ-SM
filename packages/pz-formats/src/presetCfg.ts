/**
 * Sandbox preset .cfg files (Zomboid/Sandbox Presets/*.cfg): a flattened SandboxVars.
 *
 *   Version=6
 *   # How zombies are distributed across the map. Default = Urban Focused
 *       -- 1 = Urban Focused
 *   Distribution=1
 *   ZombieLore.Speed=4
 */
import type { LuaScalar } from './lua.js';

export interface PresetCfg {
  version?: number;
  values: Record<string, string>;
  comments: Record<string, string[]>;
}

export function parsePresetCfg(text: string): PresetCfg {
  const values: Record<string, string> = {};
  const comments: Record<string, string[]> = {};
  let version: number | undefined;
  let pending: string[] = [];
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      pending = [];
      continue;
    }
    if (line.startsWith('#')) {
      pending.push(line.replace(/^#\s?/, ''));
      continue;
    }
    if (line.startsWith('--')) {
      pending.push(line.replace(/^--\s?/, ''));
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    if (/^version$/i.test(key)) {
      version = Number(value);
      pending = [];
      continue;
    }
    values[key] = value;
    if (pending.length) comments[key] = pending;
    pending = [];
  }
  return { version, values, comments };
}

/** Convert a cfg string value to a Lua scalar for SandboxVars. */
export function cfgValueToScalar(v: string, type?: string): LuaScalar {
  if (type === 'string') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (type !== 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v);
  return v;
}

export function writePresetCfg(version: number, values: Record<string, LuaScalar>, comments: Record<string, string[]> = {}, eol = '\r\n'): string {
  const lines = [`Version=${version}`];
  for (const [k, v] of Object.entries(values)) {
    for (const c of comments[k] ?? []) {
      lines.push(/^-?\d+\s*=/.test(c) ? `    -- ${c}` : `# ${c}`);
    }
    const s = typeof v === 'number' && Number.isInteger(v) ? String(v) : String(v ?? '');
    lines.push(`${k}=${s}`, '');
  }
  return lines.join(eol);
}
