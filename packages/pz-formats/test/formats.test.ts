import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  decodeText,
  encodeText,
  formatModsValue,
  parseChatLog,
  parseIni,
  parseLogFileName,
  parseLogLine,
  parseMapInfo,
  parseModInfo,
  parseModsValue,
  parsePresetCfg,
  parseSandboxOptions,
  parseSandboxVars,
  parseSpawnPoints,
  parseSpawnRegions,
  parseTranslationJson,
  parseTranslationTxt,
  parseUserLog,
  parseVdf,
  selectVersionDir,
  serializeIni,
  setIniValues,
  setSandboxValues,
  toAbsolute,
  versionInRange,
  writeSpawnPoints,
  writeSpawnRegions,
} from '../src/index.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fx = (name: string) => join(here, 'fixtures', name);
const raw = (name: string) => readFileSync(fx(name));
const text = (name: string) => decodeText(raw(name)).text;

describe('text encoding', () => {
  it('round-trips utf8 and legacy single-byte files byte-for-byte', () => {
    for (const f of ['b42-modded.ini', 'b41.ini', 'b42-modded_SandboxVars.lua']) {
      const buf = raw(f);
      const d = decodeText(buf);
      expect(Buffer.from(encodeText(d)).equals(buf)).toBe(true);
    }
    expect(decodeText(raw('b41.ini')).encoding).toBe('latin1');
  });
});

describe('server ini', () => {
  it('parses keys, comments and range metadata', () => {
    const doc = parseIni(text('b42-modded.ini'));
    const keys = doc.entries.map((e) => e.key);
    expect(keys.length).toBeGreaterThan(130);
    expect(new Set(keys).size).toBe(keys.length);
    const port = doc.entries.find((e) => e.key === 'DefaultPort')!;
    expect(port.meta.min).toBe(0);
    expect(port.meta.max).toBe(65535);
    expect(port.meta.defaultRaw).toBe('16261');
    const vmin = doc.entries.find((e) => e.key === 'VoiceMinDistance')!;
    expect(vmin.meta.decimal).toBe(true);
    const chat = doc.entries.find((e) => e.key === 'ChatStreams')!;
    expect(chat.comments).toEqual([]);
    const welcome = doc.entries.find((e) => e.key === 'ServerWelcomeMessage')!;
    expect(welcome.value.startsWith(' ')).toBe(true);
  });

  it('round-trips unchanged and edits surgically', () => {
    const src = text('b42-modded.ini');
    expect(serializeIni(parseIni(src))).toBe(src);
    const out = setIniValues(src, { MaxPlayers: '16', BrandNewKey: 'x' }, { comments: { BrandNewKey: ['Added by test'] } });
    const changed = out.split('\r\n');
    const orig = src.split('\r\n');
    // Within the original line range only the MaxPlayers line may differ.
    const diff = orig.map((l, i) => (l !== changed[i] ? i : -1)).filter((i) => i >= 0 && orig[i].trim() !== '');
    expect(diff.map((i) => orig[i])).toEqual(['MaxPlayers=3']);
    expect(out).toContain('\r\nMaxPlayers=16\r\n');
    expect(out).toContain('# Added by test\r\nBrandNewKey=x');
    expect(parseIni(out).entries.find((e) => e.key === 'PVP')!.value).toBe('false');
  });

  it('handles Mods= with and without the B42 backslash prefix', () => {
    expect(parseModsValue('\\ModA;\\Mod B;;ModC')).toEqual(['ModA', 'Mod B', 'ModC']);
    expect(formatModsValue(['A', "GanydeBielovzki's Frockin Splendor! Vol.2"], true)).toBe("\\A;\\GanydeBielovzki's Frockin Splendor! Vol.2");
    expect(formatModsValue(['A', 'B'])).toBe('A;B');
  });
});

describe('SandboxVars.lua', () => {
  const src = text('b42-modded_SandboxVars.lua');
  const doc = parseSandboxVars(src);

  it('parses vanilla and mod namespaces with metadata', () => {
    expect(doc.version).toBe(6);
    expect(doc.namespaces).toContain('ZombieLore');
    expect(doc.namespaces).toContain('CompanionDogs');
    expect(doc.namespaces.length).toBeGreaterThan(80);
    const zombies = doc.entries.find((e) => e.path === 'Zombies')!;
    expect(zombies.inferred.type).toBe('enum');
    expect(zombies.inferred.choices?.length).toBe(6);
    expect(zombies.inferred.default).toBe(4);
    const speed = doc.entries.find((e) => e.path === 'ZombieLore.Speed')!;
    expect(speed.inferred.choices?.[0]).toEqual({ value: 1, label: 'Sprinters' });
    const dmg = doc.entries.find((e) => e.path === 'CompanionDogs.DogDamageMultiplier')!;
    expect(dmg.inferred.type).toBe('double');
    expect(dmg.inferred.max).toBe(5);
    const list = doc.entries.find((e) => e.path === 'WorldItemRemovalList')!;
    expect(list.inferred.type).toBe('string');
  });

  it('edits in place, inserts missing keys and namespaces', () => {
    const out = setSandboxValues(src, {
      Zombies: { value: 2 },
      'CompanionDogs.DogDamageMultiplier': { value: 2, kind: 'double' },
      'RVM.NewThing': { value: true },
      'BrandNewMod.Opt': { value: 'hello "world"' },
    });
    const re = parseSandboxVars(out);
    const get = (p: string) => re.entries.find((e) => e.path === p)?.value;
    expect(get('Zombies')).toBe(2);
    expect(get('CompanionDogs.DogDamageMultiplier')).toBe(2);
    expect(out).toContain('DogDamageMultiplier = 2.0,');
    expect(get('RVM.NewThing')).toBe(true);
    expect(get('BrandNewMod.Opt')).toBe('hello "world"');
    expect(re.entries.length).toBe(doc.entries.length + 2);
    // Untouched content preserved
    expect(out.startsWith(src.slice(0, 200))).toBe(true);
  });

  it('parses vanilla preset files (return { ... })', () => {
    const p = parseSandboxVars(text('Apocalypse.lua'));
    expect(p.entries.find((e) => e.path === 'Zombies')).toBeTruthy();
    expect(p.namespaces).toContain('ZombieLore');
  });
});

describe('sandbox-options.txt', () => {
  it('parses enum options', () => {
    const f = parseSandboxOptions(text('sandbox-options/enum.txt'));
    expect(f.version).toBe(1);
    const e = f.options.find((o) => o.type === 'enum')!;
    expect(e.numValues).toBeGreaterThan(1);
    expect(f.warnings).toEqual([]);
  });

  it('keeps unquoted string defaults containing ; and commas', () => {
    const f = parseSandboxOptions(text('sandbox-options/semicolon.txt'));
    const s = f.options.find((o) => o.name === 'CF8KSweeper.SpriteWhitelist')!;
    expect(s.type).toBe('string');
    expect(String(s.default)).toContain('brokenglass_1_;trash_01_');
    expect(String(s.default)).toContain('damaged_objects_01_21');
    expect(s.page).toBe('StreetSweeper');
  });

  it('accepts both `option X {` and `option X = {`', () => {
    const a = parseSandboxOptions(text('sandbox-options/braces.txt'));
    const b = parseSandboxOptions(text('sandbox-options/equals.txt'));
    expect(a.options.length).toBeGreaterThan(0);
    expect(b.options[0]).toMatchObject({ name: 'DAMN.AllowOinkerSpawns', type: 'boolean', default: true, page: 'DAMN_Spawns' });
  });
});

describe('mod.info / map.info', () => {
  it('parses dependencies and strips backslashes', () => {
    const m = parseModInfo(text('modinfo/multireq.info'));
    expect(m.id).toBe('SwapIt');
    expect(m.require).toEqual(['ChuckleberryFinnAlertSystem', 'errorMagnifier']);
    const lo = parseModInfo(text('modinfo/loadorder.info'));
    expect(lo.loadModBefore).toContain('ProjectSummerCar');
    expect(lo.incompatible).toEqual(['SimpleAutoParts']);
    const c = parseModInfo(text('modinfo/cleanui.info'));
    expect(c.versionMin).toBe('42.13.0');
    expect(versionInRange('42.21.0', c.versionMin, c.versionMax)).toBe(false);
  });

  it('parses map.info', () => {
    const m = parseMapInfo(text('modinfo/map.info'));
    expect(m.title).toBe('map_distanciado');
    expect(m.lots).toEqual(['Muldraugh, KY']);
    expect(m.fixed2x).toBe(true);
  });

  it('selects the version dir the game would load', () => {
    expect(selectVersionDir(['42', '42.13', '42.20', 'common', 'media'], '42.21.0')).toBe('42.20');
    expect(selectVersionDir(['42.0', '42.22'], '42.21.0')).toBe('42.0');
    expect(selectVersionDir(['common', 'media'], '42.21.0')).toBeUndefined();
  });
});

describe('spawn files', () => {
  it('parses and rewrites spawnregions', () => {
    const r = parseSpawnRegions(text('spawnregions.lua'));
    expect(r[0]).toEqual({ name: 'Muldraugh, KY', file: 'media/maps/Muldraugh, KY/spawnpoints.lua', serverfile: undefined });
    expect(parseSpawnRegions(writeSpawnRegions(r))).toEqual(r);
  });

  it('parses both spawnpoint coordinate styles', () => {
    const cell = parseSpawnPoints(text('spawnpoints-cell.lua'));
    expect(cell.unemployed[0]).toEqual({ worldX: 40, worldY: 22, posX: 67, posY: 201 });
    expect(toAbsolute(cell.unemployed[0])).toEqual({ x: 40 * 256 + 67, y: 22 * 256 + 201, z: 0 });
    const abs = parseSpawnPoints(text('spawnpoints-abs.lua'));
    expect(abs.unemployed[0]).toEqual({ posX: 12067, posY: 6801, posZ: 0 });
    expect(parseSpawnPoints(writeSpawnPoints(abs))).toEqual(abs);
  });
});

describe('translations, presets, logs, vdf', () => {
  it('parses json and legacy txt translations', () => {
    const v = parseTranslationJson(text('translations/vanilla-Sandbox.json'));
    expect(v.Sandbox_ZombieCount).toBe('Zombie Count');
    const t = parseTranslationTxt(text('translations/Sandbox_EN.txt'));
    expect(Object.keys(t)[0]).toBe('Sandbox_DAMN_AllowOinkerSpawns');
  });

  it('parses sandbox preset cfg', () => {
    const p = parsePresetCfg(text('preset.cfg'));
    expect(p.version).toBe(6);
    expect(p.values['Basement.SpawnFrequency']).toBe('4');
    expect(p.comments['Basement.SpawnFrequency']).toContain('1 = Never');
  });

  it('parses log names and lines', () => {
    expect(parseLogFileName('2026-10-26_23-05_DebugLog-server.txt')).toEqual({ date: '2026-10-26T23:05', type: 'DebugLog-server' });
    expect(parseLogFileName('26-10-25_23-05-21_user.txt')?.date).toBe('2025-10-26T23:05:21');
    const l = parseLogLine('[26-10-26 23:05:21.742] 76561198205571344 "Archaie" attempting to join.');
    expect(l.time).toBe('2026-10-26T23:05:21.742');
    expect(parseUserLog(l.text)).toMatchObject({ steamId: '76561198205571344', username: 'Archaie', action: 'attempting' });
    expect(parseChatLog("[info] Got message:ChatMessage{chat=Local, author='Archaie', text='HEY YOU!'}.")).toEqual({ chat: 'Local', author: 'Archaie', message: 'HEY YOU!' });
  });

  it('parses Steam acf files', () => {
    const v = parseVdf(text('appworkshop_108600.acf'));
    const aw = v.AppWorkshop as Record<string, unknown>;
    expect(aw.appid).toBe('108600');
    expect(Object.keys(aw.WorkshopItemsInstalled as object).length).toBeGreaterThan(10);
  });
});
