/**
 * A set of server config files exported from the game (Zomboid/Server/<name>*):
 * <name>.ini, <name>_SandboxVars.lua, <name>_spawnregions.lua, <name>_spawnpoints.lua.
 * Pure analysis + renaming so a bundle made for one server name can be installed as another.
 */
import { iniToRecord, parseIni, parseModsValue, setIniValues, splitList } from './ini.js';
import { parseSandboxVars } from './sandboxVars.js';
import { parseSpawnPoints, parseSpawnRegions } from './spawn.js';
import type { TextEncodingName } from './text.js';

export type ConfigFileKind = 'ini' | 'sandbox' | 'spawnregions' | 'spawnpoints';

export interface ConfigFileInput {
  /** File name as uploaded (directories are ignored). */
  name: string;
  text: string;
  encoding: TextEncodingName;
  bom: boolean;
}

export interface ConfigBundleFile extends ConfigFileInput {
  kind: ConfigFileKind;
}

export interface ConfigBundleSummary {
  publicName?: string;
  maxPlayers?: string;
  maps: string[];
  mods: string[];
  workshopItems: string[];
  hasPassword: boolean;
  sandboxVersion?: number;
  sandboxOptions: number;
  sandboxNamespaces: string[];
  spawnRegions: string[];
  spawnProfessions: string[];
  iniKeys: number;
}

export interface ConfigBundle {
  /** Server name the files were made for (common prefix), if it could be determined. */
  sourceName?: string;
  files: ConfigBundleFile[];
  ignored: string[];
  summary: ConfigBundleSummary;
  /** Problems that block installing the bundle. */
  errors: string[];
  /** Things worth knowing that don't block it. */
  warnings: string[];
}

const SUFFIXES: [ConfigFileKind, RegExp][] = [
  ['sandbox', /^(.+)_SandboxVars\.lua$/i],
  ['spawnregions', /^(.+)_spawnregions\.lua$/i],
  ['spawnpoints', /^(.+)_spawnpoints\.lua$/i],
  ['ini', /^(.+)\.ini$/i],
];

export function classifyConfigFile(name: string): { kind: ConfigFileKind; server: string } | null {
  const base = name.split(/[\\/]/).pop() ?? name;
  if (/\.pzsm\.(bak|tmp)$/i.test(base)) return null;
  for (const [kind, re] of SUFFIXES) {
    const m = re.exec(base);
    if (m) return { kind, server: m[1] };
  }
  return null;
}

/** Keys that exist only in Build 41 server configs. */
const B41_ONLY = /^(AntiCheatProtectionType\d+|AutoCreateUserInWhiteList|DiscordChannelID|MinutesPerPage|KickFastPlayers)$/;

export function analyzeConfigBundle(inputs: ConfigFileInput[]): ConfigBundle {
  const files: ConfigBundleFile[] = [];
  const ignored: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const servers = new Set<string>();
  for (const f of inputs) {
    const c = classifyConfigFile(f.name);
    if (!c) {
      ignored.push(f.name);
      continue;
    }
    if (files.some((x) => x.kind === c.kind)) {
      errors.push(`More than one ${c.kind} file (${f.name}); upload the files of a single server`);
      continue;
    }
    servers.add(c.server);
    files.push({ ...f, kind: c.kind });
  }
  if (servers.size > 1) errors.push(`Files belong to different servers: ${[...servers].join(', ')}`);
  if (!files.length) errors.push('No server config files found (expected <name>.ini, <name>_SandboxVars.lua, <name>_spawnregions.lua, <name>_spawnpoints.lua)');

  const summary: ConfigBundleSummary = {
    maps: [],
    mods: [],
    workshopItems: [],
    hasPassword: false,
    sandboxOptions: 0,
    sandboxNamespaces: [],
    spawnRegions: [],
    spawnProfessions: [],
    iniKeys: 0,
  };

  for (const f of files) {
    try {
      switch (f.kind) {
        case 'ini': {
          const doc = parseIni(f.text);
          const v = iniToRecord(doc);
          summary.iniKeys = doc.entries.length;
          if (!doc.entries.length) errors.push(`${f.name} contains no settings`);
          summary.publicName = v.PublicName;
          summary.maxPlayers = v.MaxPlayers;
          summary.maps = splitList(v.Map ?? '');
          summary.mods = parseModsValue(v.Mods ?? '');
          summary.workshopItems = splitList(v.WorkshopItems ?? '');
          summary.hasPassword = !!v.Password?.trim();
          const b41 = doc.entries.filter((e) => B41_ONLY.test(e.key)).length;
          if (b41) warnings.push(`${f.name} looks like a Build 41 config (${b41} B41-only keys); B42 will ignore those keys`);
          const badIds = summary.workshopItems.filter((w) => !/^\d+$/.test(w));
          if (badIds.length) warnings.push(`WorkshopItems contains non-numeric ids: ${badIds.join(', ')}`);
          break;
        }
        case 'sandbox': {
          const sb = parseSandboxVars(f.text);
          summary.sandboxVersion = sb.version;
          summary.sandboxOptions = sb.entries.length;
          summary.sandboxNamespaces = sb.namespaces;
          if (sb.version !== undefined && sb.version < 6) warnings.push(`${f.name} is SandboxVars version ${sb.version} (Build 41); the game upgrades it on load, some options may reset`);
          break;
        }
        case 'spawnregions':
          summary.spawnRegions = parseSpawnRegions(f.text).map((r) => r.name);
          break;
        case 'spawnpoints':
          summary.spawnProfessions = Object.keys(parseSpawnPoints(f.text));
          break;
      }
    } catch (e) {
      errors.push(`${f.name} could not be parsed: ${(e as Error).message}`);
    }
  }
  if (!files.some((f) => f.kind === 'ini')) warnings.push('No .ini file: server options (including the mod list) stay as they are');
  if (!files.some((f) => f.kind === 'sandbox')) warnings.push('No SandboxVars.lua file: sandbox settings stay as they are');
  if (summary.mods.length && !summary.workshopItems.length) warnings.push('Mods= is set but WorkshopItems= is empty; mods must already be installed locally');

  return { sourceName: servers.size === 1 ? [...servers][0] : undefined, files, ignored, summary, errors, warnings };
}

/**
 * Rewrite a bundle file for installation under `target`:
 * - spawnregions: references to `<source>_spawnpoints.lua` point at `<target>_spawnpoints.lua`
 * - ini: `overrides` replace values (e.g. ports and RCON owned by the host)
 */
export function retargetConfigFile(f: ConfigBundleFile, source: string | undefined, target: string, overrides: Record<string, string> = {}): string {
  let text = f.text;
  if (f.kind === 'spawnregions' && source && source !== target) {
    text = text.split(`${source}_spawnpoints.lua`).join(`${target}_spawnpoints.lua`);
  }
  if (f.kind === 'ini' && Object.keys(overrides).length) text = setIniValues(text, overrides);
  return text;
}

/** File name a bundle file should get for `target`. */
export function configFileName(kind: ConfigFileKind, target: string): string {
  return kind === 'ini' ? `${target}.ini` : kind === 'sandbox' ? `${target}_SandboxVars.lua` : `${target}_${kind}.lua`;
}
