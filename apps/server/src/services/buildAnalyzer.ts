/**
 * "Analyze the build": derive every setting, command, capability and map the installed
 * server supports directly from its files, so new builds need no code changes.
 *
 * Sources:
 *  - projectzomboid.jar: ServerOptions / SandboxOptions constructors (types, ranges,
 *    defaults, translation keys), serverCommands annotations, the Capability enum,
 *    and the GameVersion constant.
 *  - media/lua/client/OptionScreens/ServerSettingsScreen.lua: the game's own page layout.
 *  - media/lua/shared/Translate/EN/{UI,Sandbox}.json: labels and tooltips.
 *  - media/maps/*: vanilla maps.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  decodeText,
  enumConstants,
  extractCapabilities,
  extractCommand,
  extractSandboxOptions,
  extractServerOptions,
  parseClass,
  parseMapInfo,
  parseSandboxVars,
  parseSettingsLayout,
  parseTranslationJson,
  type JavaClass,
  type SandboxOptionDef,
  type ServerCommandDef,
  type ServerOptionDef,
  type SettingsLayout,
} from '@pzsm/pz-formats';
import type { BuildManifestSummary } from '@pzsm/shared';
import { db } from '../db.js';
import { readZipEntries } from '../util/zip.js';
import { installPaths } from './paths.js';
import { readInstalledBuild } from './steam.js';

export interface VanillaMap {
  folder: string;
  title: string;
  description?: string;
  lots: string[];
  hasSpawnpoints: boolean;
}

export interface BuildManifest {
  key: string;
  createdAt: string;
  version?: string;
  buildId?: string;
  serverOptions: ServerOptionDef[];
  sandboxOptions: SandboxOptionDef[];
  commands: ServerCommandDef[];
  capabilities: string[];
  layout: SettingsLayout;
  /** Relevant translation strings (UI_ServerOption*, UI_ServerSettingGroup_*, Sandbox_*). */
  text: Record<string, string>;
  maps: VanillaMap[];
  presets: string[];
  /** Preset whose values are a new server's sandbox defaults. */
  defaultPreset?: string;
  /** Java enums used by enum server options (e.g. AntiCheat policies). */
  enums: Record<string, string[]>;
  warnings: string[];
}

let cached: BuildManifest | null = null;

/** Locate game classes: projectzomboid.jar at the root or under java/, or loose class dirs. */
function classSource(): { kind: 'jar'; file: string } | { kind: 'dir'; dir: string } | null {
  const ip = installPaths();
  for (const f of [ip.jar, join(ip.javaDir, 'projectzomboid.jar')]) if (existsSync(f)) return { kind: 'jar', file: f };
  for (const d of [ip.javaDir, ip.root]) if (existsSync(join(d, 'zombie', 'network', 'ServerOptions.class'))) return { kind: 'dir', dir: d };
  return null;
}

const WANTED = (n: string) =>
  n === 'zombie/network/ServerOptions.class' ||
  n === 'zombie/characters/Capability.class' ||
  n === 'zombie/core/Core.class' ||
  /^zombie\/SandboxOptions(\$[A-Za-z]+)?\.class$/.test(n) ||
  /^zombie\/commands\/serverCommands\/[^$]+\.class$/.test(n);

async function loadClasses(): Promise<{ files: Map<string, Buffer>; loadExtra: (name: string) => Promise<Buffer | undefined>; fingerprint: string }> {
  const src = classSource();
  if (!src) throw new Error('Game classes not found (is the server installed?)');
  if (src.kind === 'jar') {
    const st = statSync(src.file);
    const files = await readZipEntries(src.file, WANTED);
    return {
      files,
      loadExtra: async (name) => (await readZipEntries(src.file, (n) => n === `${name}.class`)).get(`${name}.class`),
      fingerprint: `${st.size}-${Math.floor(st.mtimeMs)}`,
    };
  }
  const files = new Map<string, Buffer>();
  const walk = async (rel: string) => {
    for (const e of readdirSync(join(src.dir, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(r);
      else if (WANTED(r)) files.set(r, await readFile(join(src.dir, r)));
    }
  };
  await walk('zombie');
  const so = statSync(join(src.dir, 'zombie', 'network', 'ServerOptions.class'));
  return {
    files,
    loadExtra: async (name) => {
      const p = join(src.dir, `${name}.class`);
      return existsSync(p) ? readFile(p) : undefined;
    },
    fingerprint: `dir-${so.size}-${Math.floor(so.mtimeMs)}`,
  };
}

/** Version from `new GameVersion(major, minor, suffix)` in Core.<clinit>. */
function extractGameVersion(core: JavaClass | undefined): string | undefined {
  if (!core) return undefined;
  // The static initializer holds the real version; other methods build sentinel versions.
  const methods = [...core.methods].sort((a, b) => Number(b.name === '<clinit>') - Number(a.name === '<clinit>'));
  for (const m of methods) {
    const ev = m.events ?? [];
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      if (e.k === 'new' && e.type.endsWith('/GameVersion')) {
        const consts: (string | number)[] = [];
        for (let j = i + 1; j < ev.length; j++) {
          const x = ev[j];
          if (x.k === 'const') consts.push(x.v);
          if (x.k === 'call' && x.name === '<init>' && x.owner.endsWith('/GameVersion')) break;
        }
        const nums = consts.filter((c): c is number => typeof c === 'number');
        if (nums.length >= 2) return `${nums[0]}.${nums[1]}`;
      }
    }
  }
  return undefined;
}

async function loadTranslations(): Promise<Record<string, string>> {
  const dir = installPaths().translateEN;
  const out: Record<string, string> = {};
  for (const f of ['UI.json', 'Sandbox.json', 'IG_UI.json']) {
    const p = join(dir, f);
    if (!existsSync(p)) continue;
    const t = parseTranslationJson(decodeText(await readFile(p)).text);
    for (const [k, v] of Object.entries(t)) {
      if (/^(UI_ServerOption|UI_ServerSettingGroup_|UI_ServerOptionDesc_|Sandbox_|UI_Capability|IGUI_Capability|UI_Role)/.test(k)) out[k] = v;
    }
  }
  return out;
}

async function loadVanillaMaps(): Promise<VanillaMap[]> {
  const dir = installPaths().maps;
  const out: VanillaMap[] = [];
  if (!existsSync(dir)) return out;
  for (const folder of readdirSync(dir)) {
    const info = join(dir, folder, 'map.info');
    if (!existsSync(info)) continue;
    const mi = parseMapInfo(decodeText(await readFile(info)).text);
    let title = mi.title ?? folder;
    if (title.startsWith('See ')) title = folder;
    const description = mi.description?.startsWith('See ') ? undefined : mi.description;
    out.push({ folder, title, description, lots: mi.lots, hasSpawnpoints: existsSync(join(dir, folder, 'spawnpoints.lua')) });
  }
  return out;
}

export async function analyzeBuild(): Promise<BuildManifest> {
  const warnings: string[] = [];
  const { files, loadExtra, fingerprint } = await loadClasses();
  const build = await readInstalledBuild();
  const parse = (n: string, code = false) => {
    const b = files.get(n);
    return b ? parseClass(b, { code }) : undefined;
  };

  const so = parse('zombie/network/ServerOptions.class', true);
  const serverOptions = so ? extractServerOptions(so) : [];
  if (!serverOptions.length) warnings.push('Could not extract ServerOptions from game classes');

  const sbClasses = [...files.keys()].filter((n) => /^zombie\/SandboxOptions(\$(ZombieLore|ZombieConfig|Map|Basement|MultiplierConfig|[A-Z][A-Za-z]+))?\.class$/.test(n) && !/SandboxOption\.class$|(Boolean|Double|Enum|StrongEnum|Integer|String)SandboxOption\.class$/.test(n));
  const enumCache = new Map<string, string[] | undefined>();
  const enumNames = new Set<string>();
  // First pass discovers strong-enum classes; load them, then extract for real.
  const sbParsed = sbClasses.map((n) => parseClass(files.get(n)!, { code: true }));
  extractSandboxOptions(sbParsed, (c) => {
    enumNames.add(c);
    return undefined;
  });
  for (const c of enumNames) {
    const b = await loadExtra(c);
    enumCache.set(c, b ? enumConstants(parseClass(b)) : undefined);
  }
  const sandboxOptions = extractSandboxOptions(sbParsed, (c) => enumCache.get(c));
  if (!sandboxOptions.length) warnings.push('Could not extract SandboxOptions from game classes');

  // A new server's effective defaults come from the preset SandboxVars.lua requires
  // (Apocalypse in vanilla), not from the Java constructor defaults.
  let defaultPreset: string | undefined;
  try {
    const sv = decodeText(await readFile(join(installPaths().presetsLua, 'SandboxVars.lua'))).text;
    defaultPreset = /require\s*\(?\s*["']Sandbox\/([\w\-]+)["']/.exec(sv)?.[1];
    if (defaultPreset) {
      const preset = parseSandboxVars(decodeText(await readFile(join(installPaths().presetsLua, `${defaultPreset}.lua`))).text);
      const byName = new Map(preset.entries.map((e) => [e.path, e.value]));
      for (const o of sandboxOptions) {
        const v = byName.get(o.name);
        if (v !== undefined && v !== null) o.default = v;
      }
    }
  } catch {
    /* presets unavailable; keep code defaults */
  }

  const commands: ServerCommandDef[] = [];
  for (const [n, b] of files) {
    if (!n.startsWith('zombie/commands/serverCommands/')) continue;
    const c = extractCommand(parseClass(b));
    if (c) commands.push(c);
  }
  commands.sort((a, b) => a.names[0].localeCompare(b.names[0]));

  const capCls = parse('zombie/characters/Capability.class');
  const capabilities = capCls ? extractCapabilities(capCls) : [];

  let layout: SettingsLayout = { ini: [], sandbox: [] };
  const lp = installPaths().settingsScreen;
  if (existsSync(lp)) {
    try {
      layout = parseSettingsLayout(decodeText(await readFile(lp)).text);
    } catch (e) {
      warnings.push(`Settings layout unreadable: ${(e as Error).message}`);
    }
  }

  const presetsDir = installPaths().presetsLua;
  const presets = existsSync(presetsDir)
    ? readdirSync(presetsDir)
        .filter((f) => f.endsWith('.lua') && f !== 'SandboxVars.lua')
        .map((f) => f.replace(/\.lua$/, ''))
    : [];

  const enums: Record<string, string[]> = {};
  for (const [k, cls] of [
    ['AntiCheatPolicy', 'zombie/network/anticheats/AntiCheat$Policy'],
    ['WordsFilterPolicy', 'zombie/core/WordsFilter$Policy'],
  ] as const) {
    const b = await loadExtra(cls);
    if (b) enums[k] = enumConstants(parseClass(b));
  }

  const version = extractGameVersion(parse('zombie/core/Core.class', true));
  const key = createHash('sha1').update(`${build?.buildId ?? ''}|${fingerprint}`).digest('hex').slice(0, 16);

  const manifest: BuildManifest = {
    key,
    createdAt: new Date().toISOString(),
    version,
    buildId: build?.buildId,
    serverOptions,
    sandboxOptions,
    commands,
    capabilities,
    layout,
    text: await loadTranslations(),
    maps: await loadVanillaMaps(),
    presets,
    defaultPreset,
    enums,
    warnings,
  };
  db.prepare('INSERT INTO manifests (key, created_at, data) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET created_at = excluded.created_at, data = excluded.data').run(
    key,
    manifest.createdAt,
    JSON.stringify(manifest),
  );
  cached = manifest;
  return manifest;
}

/** Current manifest: cached, else latest stored, else analyze now. Null if not installed. */
export async function getManifest(opts: { refresh?: boolean } = {}): Promise<BuildManifest | null> {
  if (cached && !opts.refresh) return cached;
  if (!opts.refresh) {
    const row = db.prepare('SELECT data FROM manifests ORDER BY created_at DESC LIMIT 1').get() as { data: string } | undefined;
    if (row) {
      cached = JSON.parse(row.data) as BuildManifest;
      return cached;
    }
  }
  if (!classSource()) return null;
  return analyzeBuild();
}

export function diffManifests(prev: BuildManifest, next: BuildManifest): NonNullable<BuildManifestSummary['diff']> {
  const names = (m: BuildManifest) => new Map([...m.serverOptions.map((o) => [`ini:${o.name}`, o.default] as const), ...m.sandboxOptions.map((o) => [`sandbox:${o.name}`, o.default] as const)]);
  const a = names(prev);
  const b = names(next);
  return {
    added: [...b.keys()].filter((k) => !a.has(k)),
    removed: [...a.keys()].filter((k) => !b.has(k)),
    changedDefaults: [...b.keys()].filter((k) => a.has(k) && JSON.stringify(a.get(k)) !== JSON.stringify(b.get(k))),
  };
}

export function summarize(m: BuildManifest): BuildManifestSummary {
  const prevRow = db.prepare('SELECT data FROM manifests WHERE key != ? ORDER BY created_at DESC LIMIT 1').get(m.key) as { data: string } | undefined;
  return {
    key: m.key,
    version: m.version,
    buildId: m.buildId,
    createdAt: m.createdAt,
    serverOptions: m.serverOptions.length,
    sandboxOptions: m.sandboxOptions.length,
    commands: m.commands.length,
    capabilities: m.capabilities.length,
    maps: m.maps.length,
    diff: prevRow ? diffManifests(JSON.parse(prevRow.data) as BuildManifest, m) : undefined,
  };
}
