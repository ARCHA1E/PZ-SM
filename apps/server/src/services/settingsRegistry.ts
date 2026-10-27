/**
 * Dynamic settings: merges the build manifest (vanilla server + sandbox options), the
 * enabled mods' sandbox-options.txt, and whatever keys actually exist in the files.
 * Nothing in the files is ever hidden: unknown keys are surfaced as raw settings.
 */
import { inferOption, parseCommentMeta, stripPzMarkup, type LuaScalar, type SandboxChange } from '@pzsm/pz-formats';
import type { OptionValue, SettingDef, SettingsApplyResult, SettingsPageDef, SettingsView } from '@pzsm/shared';
import { getManifest, type BuildManifest } from './buildAnalyzer.js';
import { readIni, readSandbox, writeIniValues, writeSandboxValues } from './configStore.js';
import { enabledMods } from './mods.js';
import { supervisor } from './supervisor.js';

const SECRET_KEYS = new Set(['Password', 'RCONPassword', 'DiscordToken', 'WebhookAddress']);
/** Edited on dedicated pages / owned by the manager. */
const MANAGED_KEYS = new Set(['Mods', 'WorkshopItems', 'Map', 'RCONPassword', 'RCONPort']);
/** Cannot take effect without a restart even via changeoption. */
const RESTART_KEYS = new Set([
  'DefaultPort', 'UDPPort', 'RCONPort', 'RCONPassword', 'Mods', 'WorkshopItems', 'Map', 'Public', 'PublicName', 'PublicDescription',
  'MaxPlayers', 'SteamVAC', 'UPnP', 'server_browser_announced_ip', 'Seed', 'DoLuaChecksum', 'ResetID', 'ServerPlayerID', 'SteamScoreboard',
  'DiscordEnable', 'DiscordToken', 'VoiceEnable', 'BackupsCount', 'BackupsOnStart', 'BackupsOnVersionChange', 'BackupsPeriod', 'SaveWorldEveryMinutes',
]);

/** Fallback pages for options the game's own UI doesn't place. */
function fallbackIniPage(name: string): string {
  if (/^AntiCheat/.test(name)) return 'AntiCheat';
  if (/^(BadWord|GoodWord|Chat|GlobalChat)/.test(name)) return 'Chat';
  if (/^(Discord|Webhook)/.test(name)) return 'Discord';
  if (/^(PVP|Safety)/.test(name)) return 'PVP';
  if (/^(Mods|WorkshopItems)$/.test(name)) return 'Mods';
  if (/^(Map|SpawnPoint|Seed)$/.test(name)) return 'Map';
  if (/(Towing|CarEngine|Vehicle)/.test(name)) return 'Vehicles';
  if (/^(LoginQueue|DenyLogin|SteamVAC|server_browser)/.test(name)) return 'Details';
  return 'Other';
}

function fallbackSandboxPage(name: string): string {
  if (/LootFactor|Loot/.test(name)) return 'Loot';
  if (/^(StartYear|NightLength|DayLength)/.test(name)) return 'TimeOptions';
  if (/^(Farming|PlantAbundance|Nature)/.test(name)) return 'NatureOptions';
  if (/^Animal/.test(name)) return 'Animal';
  if (/^AlarmDecay/.test(name)) return 'WorldOptions';
  const dot = name.indexOf('.');
  return dot > 0 ? name.slice(0, dot) : 'Other';
}

/** "1=Hidden 2=Friends 3=…" or "1 - ban, 2 - kick, …" embedded in a tooltip. */
function inlineChoices(text: string | undefined, n?: number): { value: number; label: string }[] | undefined {
  if (!text) return undefined;
  const out: { value: number; label: string }[] = [];
  for (const m of text.matchAll(/(?:^|[\s,:;.])(\d+)\s*(?:=|-|:)\s*([^,;\n]+?)(?=(?:[,;]?\s*\d+\s*(?:=|-|:)\s)|[,;.]?\s*(?:\\n|\n|$))/g)) {
    out.push({ value: Number(m[1]), label: m[2].trim() });
  }
  if (out.length < 2 || (n && out.length < n)) return undefined;
  return n ? out.slice(0, n) : out;
}

const humanize = (k: string) =>
  k
    .replace(/^.*\./, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

function clean(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return stripPzMarkup(s.replace(/\\n/g, '\n')).trim() || undefined;
}

// ------------------------------------------------------------------ server (ini)

export async function serverSettingsView(): Promise<SettingsView> {
  const [manifest, ini] = await Promise.all([getManifest(), readIni()]);
  const values: Record<string, OptionValue | null> = {};
  const settings: SettingDef[] = [];
  const pagesSeen = new Map<string, SettingsPageDef>();
  const t = manifest?.text ?? {};
  const fileEntries = new Map((ini?.doc.entries ?? []).map((e) => [e.key, e]));
  const pageOf = new Map<string, string>();
  for (const p of manifest?.layout.ini ?? []) for (const s of p.settings) if (!pageOf.has(s)) pageOf.set(s, p.name);
  const addPage = (key: string) => {
    if (!pagesSeen.has(key)) pagesSeen.set(key, { key, title: t[`UI_ServerSettingGroup_${key}`] ?? (key === 'AntiCheat' ? 'Anti-Cheat' : humanize(key)) });
  };
  for (const p of manifest?.layout.ini ?? []) addPage(p.name);

  const defs = manifest?.serverOptions ?? [];
  for (const d of defs) {
    const fe = fileEntries.get(d.name);
    const tooltip = clean(t[`UI_ServerOption_${d.name}_tooltip`]) ?? fe?.meta.description;
    const page = pageOf.get(d.name) ?? fallbackIniPage(d.name);
    addPage(page);
    let choices: SettingDef['choices'];
    if (d.type === 'enum') {
      choices = inlineChoices(t[`UI_ServerOption_${d.name}_tooltip`], d.numValues) ?? inlineChoices(fe?.meta.description, d.numValues);
      if (!choices && /^AntiCheat/.test(d.name) && manifest?.enums.AntiCheatPolicy?.length === d.numValues) {
        choices = manifest!.enums.AntiCheatPolicy.map((label, i) => ({ value: i + 1, label: humanize(label.toLowerCase().replace(/^./, (c) => c.toUpperCase())) }));
      }
      choices ??= Array.from({ length: d.numValues ?? 0 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
    } else if (d.type === 'integer' && d.min !== undefined && d.max !== undefined && d.max - d.min < 12) {
      // Small integer ranges are often enums documented inline ("1=Hidden 2=Friends …").
      const c = inlineChoices(t[`UI_ServerOption_${d.name}_tooltip`], d.max - d.min + 1);
      if (c && c[0].value === d.min) choices = c;
    }
    settings.push({
      key: d.name,
      type: d.type,
      label: humanize(d.name),
      description: tooltip,
      default: d.default,
      min: d.min,
      max: d.max,
      maxLength: d.maxLength !== undefined && d.maxLength > 0 ? d.maxLength : undefined,
      choices,
      page,
      source: 'build',
      secret: SECRET_KEYS.has(d.name),
      live: !RESTART_KEYS.has(d.name),
      managed: MANAGED_KEYS.has(d.name),
    });
    values[d.name] = fe ? coerce(fe.value, d.type) : null;
  }
  // Keys present in the file that the build doesn't define (older builds, typos, future keys).
  const known = new Set(defs.map((d) => d.name));
  const unknownKeys: string[] = [];
  for (const [key, fe] of fileEntries) {
    if (known.has(key)) continue;
    unknownKeys.push(key);
    const inf = inferOption(fe.value, fe.meta);
    const page = manifest ? 'Unrecognized' : fallbackIniPage(key);
    addPage(page);
    settings.push({
      key,
      type: inf.type,
      label: humanize(key),
      description: fe.meta.description,
      default: inf.default,
      min: inf.min,
      max: inf.max,
      choices: inf.choices,
      page,
      source: manifest ? 'unknown' : 'file-comment',
      secret: SECRET_KEYS.has(key),
      live: !RESTART_KEYS.has(key),
      managed: MANAGED_KEYS.has(key),
    });
    values[key] = coerce(fe.value, inf.type);
  }
  if (unknownKeys.length && manifest) pagesSeen.set('Unrecognized', { key: 'Unrecognized', title: 'Unrecognized' });
  for (const s of settings) if (s.secret && values[s.key]) values[s.key] = '********';
  const usedPages = new Set(settings.map((s) => s.page));
  return {
    kind: 'server',
    pages: [...pagesSeen.values()].filter((p) => usedPages.has(p.key)),
    settings,
    values,
    unknownKeys,
    fileExists: !!ini,
  };
}

function coerce(raw: string, type: string): OptionValue {
  const v = raw.trim();
  if (type === 'boolean') return v.toLowerCase() === 'true';
  if (type === 'integer' || type === 'enum') return Number.isNaN(parseInt(v, 10)) ? v : parseInt(v, 10);
  if (type === 'double') return Number.isNaN(Number(v)) ? v : Number(v);
  return raw;
}

function validate(def: SettingDef, v: OptionValue): { value: OptionValue } | { error: string } {
  switch (def.type) {
    case 'boolean':
      if (typeof v === 'boolean') return { value: v };
      if (v === 'true' || v === 'false') return { value: v === 'true' };
      return { error: 'must be true or false' };
    case 'integer':
    case 'enum':
    case 'double': {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isNaN(n)) return { error: 'must be a number' };
      if (def.type !== 'double' && !Number.isInteger(n)) return { error: 'must be a whole number' };
      if (def.min !== undefined && n < def.min) return { error: `must be ≥ ${def.min}` };
      if (def.max !== undefined && n > def.max) return { error: `must be ≤ ${def.max}` };
      return { value: n };
    }
    default: {
      const s = String(v);
      if (def.maxLength && s.length > def.maxLength) return { error: `must be at most ${def.maxLength} characters` };
      if (/[\r\n]/.test(s) && def.type !== 'text') return { error: 'must be a single line' };
      return { value: s };
    }
  }
}

function iniString(def: SettingDef, v: OptionValue): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (def.type === 'double' && typeof v === 'number') return Number.isInteger(v) ? v.toFixed(1) : String(v);
  return String(v).replace(/\r?\n/g, ' <LINE> ');
}

export async function applyServerSettings(changes: Record<string, OptionValue>, opts: { allowManaged?: boolean } = {}): Promise<SettingsApplyResult> {
  const view = await serverSettingsView();
  const defs = new Map(view.settings.map((s) => [s.key, s]));
  const res: SettingsApplyResult = { written: [], appliedLive: [], restartRequired: [], errors: {} };
  const toWrite: Record<string, string> = {};
  for (const [key, raw] of Object.entries(changes)) {
    let def = defs.get(key);
    if (!def) def = { key, type: 'string', label: key, page: 'Other', source: 'unknown' };
    if (def.managed && !opts.allowManaged) {
      res.errors[key] = 'managed on its own page';
      continue;
    }
    if (def.secret && raw === '********') continue;
    const r = validate(def, raw);
    if ('error' in r) {
      res.errors[key] = r.error;
      continue;
    }
    toWrite[key] = iniString(def, r.value);
  }
  const { live } = await writeIniValues(toWrite);
  res.written.push(...Object.keys(toWrite));
  for (const key of live) {
    if (defs.get(key)?.live) res.appliedLive.push(key);
    else res.restartRequired.push(key);
  }
  if (res.restartRequired.length) supervisor.pendingRestart = true;
  return res;
}

// ------------------------------------------------------------------ sandbox

interface SandboxDefInternal extends SettingDef {
  kind?: 'integer' | 'double';
}

async function sandboxDefs(manifest: BuildManifest | null): Promise<{ defs: SandboxDefInternal[]; pages: SettingsPageDef[] }> {
  const defs: SandboxDefInternal[] = [];
  const pages = new Map<string, SettingsPageDef>();
  const t = manifest?.text ?? {};
  const pageOf = new Map<string, string>();
  for (const p of manifest?.layout.sandbox ?? []) {
    for (const s of p.settings) if (!pageOf.has(s)) pageOf.set(s, p.name);
    pages.set(p.name, { key: p.name, title: p.title ?? t[`Sandbox_${p.name}`] ?? humanize(p.name) });
  }
  for (const d of manifest?.sandboxOptions ?? []) {
    const tk = d.translation ?? d.name.replace(/\./g, '_');
    const vk = d.valueTranslation ?? tk;
    const page = pageOf.get(d.name) ?? fallbackSandboxPage(d.name);
    if (!pages.has(page)) pages.set(page, { key: page, title: t[`Sandbox_${page}`] ?? humanize(page) });
    let choices: SettingDef['choices'];
    if (d.type === 'enum') {
      choices = Array.from({ length: d.numValues ?? 0 }, (_, i) => ({
        value: i + 1,
        label: t[`Sandbox_${vk}_option${i + 1}`] ?? (d.enumValues?.[i] ? humanize(d.enumValues[i].toLowerCase().replace(/^./, (c) => c.toUpperCase())) : String(i + 1)),
      }));
    }
    defs.push({
      key: d.name,
      type: d.type,
      label: t[`Sandbox_${tk}`] ?? humanize(d.name),
      description: clean(t[`Sandbox_${tk}_tooltip`]),
      default: d.default,
      min: d.min,
      max: d.max,
      maxLength: d.maxLength !== undefined && d.maxLength > 0 ? d.maxLength : undefined,
      choices,
      page,
      source: 'build',
      kind: d.type === 'double' ? 'double' : d.type === 'integer' || d.type === 'enum' ? 'integer' : undefined,
    });
  }
  // Mod options
  for (const m of await enabledMods()) {
    const tr = { ...t, ...m.translations };
    for (const o of m.sandboxOptions) {
      const existing = defs.find((d) => d.key === o.name);
      if (existing) {
        existing.mods = [...new Set([...(existing.mods ?? []), m.id])];
        continue;
      }
      const tk = o.translation ?? o.name.replace(/\./g, '_');
      const vk = o.valueTranslation ?? tk;
      const page = `mod:${o.page ?? o.namespace ?? m.id}`;
      if (!pages.has(page)) {
        const pageName = o.page ?? o.namespace ?? m.id;
        pages.set(page, { key: page, title: tr[`Sandbox_${pageName}`] ?? humanize(pageName), mod: m.info.name });
      }
      let choices: SettingDef['choices'];
      if (o.type === 'enum') {
        choices = Array.from({ length: o.numValues ?? 0 }, (_, i) => ({ value: i + 1, label: tr[`Sandbox_${vk}_option${i + 1}`] ?? String(i + 1) }));
      }
      defs.push({
        key: o.name,
        type: o.type,
        label: tr[`Sandbox_${tk}`] ?? humanize(o.key),
        description: clean(tr[`Sandbox_${tk}_tooltip`] ?? (o.tooltip ? tr[o.tooltip] ?? o.tooltip : undefined)),
        default: o.default,
        min: o.min,
        max: o.max,
        maxLength: o.maxLength,
        choices,
        page,
        source: 'mod',
        mods: [m.id],
        kind: o.type === 'double' ? 'double' : o.type === 'integer' || o.type === 'enum' ? 'integer' : undefined,
      });
    }
  }
  return { defs, pages: [...pages.values()] };
}

export async function sandboxSettingsView(): Promise<SettingsView> {
  const [manifest, sb] = await Promise.all([getManifest(), readSandbox()]);
  const { defs, pages } = await sandboxDefs(manifest);
  const values: Record<string, OptionValue | null> = {};
  const fileEntries = new Map((sb?.entries ?? []).map((e) => [e.path, e]));
  for (const d of defs) {
    const fe = fileEntries.get(d.key);
    values[d.key] = fe ? (fe.value as OptionValue | null) : null;
    if (!d.description && fe?.meta.description) d.description = fe.meta.description;
  }
  const known = new Set(defs.map((d) => d.key));
  const unknownKeys: string[] = [];
  const settings: SettingDef[] = defs.map(({ kind: _k, ...d }) => d);
  for (const [path, fe] of fileEntries) {
    if (known.has(path)) continue;
    unknownKeys.push(path);
    const page = fe.namespace ? `orphan:${fe.namespace}` : 'Unrecognized';
    if (!pages.find((p) => p.key === page)) pages.push({ key: page, title: fe.namespace ? `${fe.namespace} (mod not enabled)` : 'Unrecognized' });
    const meta = parseCommentMeta(fe.comments);
    const inf = inferOption(fe.raw, meta, fe.isString);
    settings.push({
      key: path,
      type: inf.type,
      label: humanize(fe.key),
      description: inf.description,
      default: inf.default,
      min: inf.min,
      max: inf.max,
      choices: inf.choices,
      page,
      source: 'file-comment',
    });
    values[path] = fe.value as OptionValue | null;
  }
  const used = new Set(settings.map((s) => s.page));
  return { kind: 'sandbox', pages: pages.filter((p) => used.has(p.key)), settings, values, unknownKeys, fileExists: !!sb };
}

export async function applySandboxSettings(changes: Record<string, OptionValue>): Promise<SettingsApplyResult> {
  const view = await sandboxSettingsView();
  const manifest = await getManifest();
  const { defs } = await sandboxDefs(manifest);
  const kinds = new Map(defs.map((d) => [d.key, d.kind]));
  const defMap = new Map(view.settings.map((s) => [s.key, s]));
  const res: SettingsApplyResult = { written: [], appliedLive: [], restartRequired: [], errors: {} };
  const toWrite: Record<string, SandboxChange> = {};
  for (const [key, raw] of Object.entries(changes)) {
    const def = defMap.get(key) ?? ({ key, type: typeof raw === 'number' ? 'double' : typeof raw === 'boolean' ? 'boolean' : 'string', label: key, page: '', source: 'unknown' } as SettingDef);
    const r = validate(def, raw);
    if ('error' in r) {
      res.errors[key] = r.error;
      continue;
    }
    toWrite[key] = { value: r.value as LuaScalar, kind: kinds.get(key) ?? (def.type === 'double' ? 'double' : def.type === 'integer' || def.type === 'enum' ? 'integer' : undefined) };
  }
  await writeSandboxValues(toWrite);
  res.written = Object.keys(toWrite);
  if (supervisor.running && res.written.length) {
    res.restartRequired = [...res.written];
    supervisor.pendingRestart = true;
  }
  return res;
}

/** Fill in any options missing from SandboxVars (e.g. after enabling a mod) with defaults. */
export async function addMissingSandboxDefaults(): Promise<string[]> {
  const view = await sandboxSettingsView();
  const missing = view.settings.filter((s) => view.values[s.key] === null && s.default !== undefined && s.source !== 'file-comment');
  if (!missing.length || !view.fileExists) return [];
  await applySandboxSettings(Object.fromEntries(missing.map((s) => [s.key, s.default!])));
  return missing.map((s) => s.key);
}
