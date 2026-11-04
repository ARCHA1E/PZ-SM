import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Scratch data dir with a Workshop content tree built from real mod layouts.
const dir = mkdtempSync(join(tmpdir(), 'pzsm-scan-'));
const content = join(dir, 'server', 'steamapps', 'workshop', 'content', '108600');
cpSync(fileURLToPath(new URL('./fixtures/workshop', import.meta.url)), content, { recursive: true });
Object.assign(process.env, { PZSM_DATA: dir, PZ_INSTALL_DIR: join(dir, 'server') });

describe('mod scan', () => {
  it('finds mods whose mod.info lives only in common/', async () => {
    const { scanMods } = await import('../src/services/mods.js');
    const mods = await scanMods();
    const byId = new Map(mods.map((m) => [m.id, m]));
    // common/ only, no version folder
    expect(byId.get('neonMoodleLevelsMILPack')).toMatchObject({ workshopId: '3392116408', folder: 'neonMoodleIndicatorMIL', hasB42: true });
    // common/mod.info + a version folder with only media/
    expect(byId.get('immersive_hotwire')).toMatchObject({ workshopId: '3653092321', versionDir: '42.15', hasB42: true });
    expect(byId.get('immersive_hotwire')!.mediaDirs.some((d) => d.endsWith(join('42.15', 'media')))).toBe(true);
    // classic layout: mod.info in the version folder
    expect(byId.get('Video_Game_Consoles')).toMatchObject({ workshopId: '2831786301', versionDir: '42' });
  });
});
