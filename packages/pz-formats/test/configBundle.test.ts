import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analyzeConfigBundle, classifyConfigFile, configFileName, decodeText, parseIni, retargetConfigFile, type ConfigFileInput } from '../src/index.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const load = (fixture: string, as: string): ConfigFileInput => ({ name: as, ...decodeText(readFileSync(join(here, 'fixtures', fixture))) });

// The sophie-server-42-2 files exported from the game (secrets scrubbed).
const sophie = () => [
  load('b42-modded.ini', 'sophie-server-42-2.ini'),
  load('b42-modded_SandboxVars.lua', 'sophie-server-42-2_SandboxVars.lua'),
  load('spawnregions.lua', 'sophie-server-42-2_spawnregions.lua'),
  load('spawnpoints-cell.lua', 'sophie-server-42-2_spawnpoints.lua'),
];

describe('config bundles', () => {
  it('classifies files by suffix', () => {
    expect(classifyConfigFile(String.raw`C:\Users\x\Zomboid\Server\sophie-server-42-2_SandboxVars.lua`)).toEqual({ kind: 'sandbox', server: 'sophie-server-42-2' });
    expect(classifyConfigFile('a_b.ini')).toEqual({ kind: 'ini', server: 'a_b' });
    expect(classifyConfigFile('x.ini.pzsm.bak')).toBeNull();
    expect(classifyConfigFile('readme.txt')).toBeNull();
  });

  it('analyzes a full modded B42 server', () => {
    const b = analyzeConfigBundle(sophie());
    expect(b.errors).toEqual([]);
    expect(b.sourceName).toBe('sophie-server-42-2');
    expect(b.files.map((f) => f.kind).sort()).toEqual(['ini', 'sandbox', 'spawnpoints', 'spawnregions']);
    expect(b.summary.mods.length).toBeGreaterThan(50);
    expect(b.summary.workshopItems.length).toBeGreaterThan(50);
    expect(b.summary.maps).toContain('Muldraugh, KY');
    expect(b.summary.sandboxVersion).toBe(6);
    expect(b.summary.sandboxNamespaces).toContain('CompanionDogs');
    expect(b.summary.spawnProfessions).toContain('unemployed');
  });

  it('rejects mixed servers and duplicate kinds, flags B41 configs', () => {
    const mixed = analyzeConfigBundle([load('b42-modded.ini', 'a.ini'), load('b42-modded_SandboxVars.lua', 'b_SandboxVars.lua')]);
    expect(mixed.errors.join()).toMatch(/different servers/);
    const dup = analyzeConfigBundle([load('b42-modded.ini', 'a.ini'), load('b42-early.ini', 'a.ini')]);
    expect(dup.errors.join()).toMatch(/More than one ini/);
    const b41 = analyzeConfigBundle([load('b41.ini', 'old.ini')]);
    expect(b41.warnings.join()).toMatch(/Build 41/);
    expect(analyzeConfigBundle([{ name: 'x.txt', text: '', encoding: 'utf8', bom: false }]).errors.length).toBe(1);
  });

  it('retargets file names, spawnpoint references and host-owned ini keys', () => {
    const b = analyzeConfigBundle(sophie());
    const regions = { ...b.files.find((f) => f.kind === 'spawnregions')!, text: 'function SpawnRegions() return { { name = "x", serverfile = "sophie-server-42-2_spawnpoints.lua" } } end' };
    expect(retargetConfigFile(regions, b.sourceName, 'pzserver')).toContain('serverfile = "pzserver_spawnpoints.lua"');
    const ini = b.files.find((f) => f.kind === 'ini')!;
    const out = parseIni(retargetConfigFile(ini, b.sourceName, 'pzserver', { DefaultPort: '17000', RCONPassword: 'x' }));
    const v = Object.fromEntries(out.entries.map((e) => [e.key, e.value]));
    expect(v.DefaultPort).toBe('17000');
    expect(v.RCONPassword).toBe('x');
    expect(v.Mods).toBe(Object.fromEntries(parseIni(ini.text).entries.map((e) => [e.key, e.value])).Mods);
    expect(configFileName('sandbox', 'pzserver')).toBe('pzserver_SandboxVars.lua');
    expect(configFileName('spawnpoints', 'pzserver')).toBe('pzserver_spawnpoints.lua');
  });
});
