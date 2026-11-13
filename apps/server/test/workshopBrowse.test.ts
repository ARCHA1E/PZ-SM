import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'pzsm-browse-'));
process.env.PZSM_DATA = dir;

type Mod = typeof import('../src/services/workshopBrowse.js');
let m: Mod;
const fx = (n: string) => readFileSync(fileURLToPath(new URL(`./fixtures/steam/${n}`, import.meta.url)), 'utf8');
const original = {} as Mod['http'];

beforeAll(async () => {
  m = await import('../src/services/workshopBrowse.js');
  Object.assign(original, m.http);
});
beforeEach(() => {
  Object.assign(m.http, original);
  m.clearBrowseCache();
});

const reqPage = (...ids: string[]) =>
  `<div class="requiredItemsContainer" id="RequiredItems">${ids
    .map((i) => `<a href="https://steamcommunity.com/workshop/filedetails/?id=${i}" target="_blank"><div class="requiredItem">T${i}</div></a>`)
    .join('')}</div>`;

describe('parseBrowsePage', () => {
  it('parses items, totals, tags and author names', () => {
    const { result, personas } = m.parseBrowsePage(fx('browse_items.html'));
    expect(result.items).toHaveLength(30);
    expect(result.total).toBe(769);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(26);
    const first = result.items[0];
    expect(first.workshopId).toBe('3837614147');
    expect(first.title).toBe('Living World [NPC] [B42]');
    expect(first.isCollection).toBe(false);
    expect(first.tags).toContain('Farming');
    expect(first.subscriptions).toBe(3121);
    expect(first.size).toBe(11315037);
    expect(first.stars).toBe(4);
    expect(first.author).toEqual({ steamid: '76561198110597323', name: 'Zaetic' });
    expect(personas['76561198049096547']).toBe('Usp45Master');
    expect(result.availableTags).toEqual(expect.arrayContaining(['Build 42', 'Farming', 'Animals']));
    expect(result.availableTags).not.toContain('');
  });

  it('flags collections (file_type 2) and child counts', () => {
    const { result } = m.parseBrowsePage(fx('browse_collections.html'));
    expect(result.items.length).toBe(30);
    expect(result.items.every((i) => i.isCollection)).toBe(true);
    expect(result.items[0].title).toBe("QUIET's Modpack");
    expect(result.items[0].numChildren).toBe(197);
  });

  it('throws clearly when the blob is missing', () => {
    expect(() => m.parseBrowsePage('<html>nope</html>')).toThrow(/valve-ssr-data/);
    const empty = '<script type="application/json" id="valve-ssr-data">{"renderContext":{"queryData":"{\\"queries\\":[]}"}}</script>';
    expect(() => m.parseBrowsePage(empty)).toThrow(/workshop_browse/);
  });
});

describe('buildBrowseUrl', () => {
  it('builds the browse query', () => {
    const u = new URL(m.buildBrowseUrl({ q: 'farming', sort: 'trend', days: 30, tags: ['Build 42'], excludeTags: ['Build 41'], page: 2 }));
    expect(u.origin + u.pathname).toBe('https://steamcommunity.com/workshop/browse/');
    expect(u.searchParams.get('appid')).toBe('108600');
    expect(u.searchParams.get('searchtext')).toBe('farming');
    expect(u.searchParams.get('browsesort')).toBe('trend');
    expect(u.searchParams.get('actualsort')).toBe('trend');
    expect(u.searchParams.get('days')).toBe('30');
    expect(u.searchParams.get('section')).toBe('readytouseitems');
    expect(u.searchParams.getAll('requiredtags[]')).toEqual(['Build 42']);
    expect(u.searchParams.getAll('excludedtags[]')).toEqual(['Build 41']);
    expect(u.searchParams.get('p')).toBe('2');
    expect(u.searchParams.get('numperpage')).toBe('30');
  });
  it('defaults sort, maps collections and all-time days', () => {
    expect(new URL(m.buildBrowseUrl({})).searchParams.get('browsesort')).toBe('trend');
    expect(new URL(m.buildBrowseUrl({ q: 'x' })).searchParams.get('browsesort')).toBe('textsearch');
    expect(new URL(m.buildBrowseUrl({ section: 'collections' })).searchParams.get('section')).toBe('collections');
    expect(new URL(m.buildBrowseUrl({ sort: 'trend', days: -1 })).searchParams.get('days')).toBe('365');
    expect(new URL(m.buildBrowseUrl({ sort: 'mostrecent', days: 7 })).searchParams.has('days')).toBe(false);
  });
});

describe('browseWorkshop (web)', () => {
  it('fetches, caches and stores personas and metadata', async () => {
    let calls = 0;
    m.http.fetchText = async () => {
      calls++;
      return fx('browse_items.html');
    };
    const a = await m.browseWorkshop({ q: 'farming', tags: ['Build 42'] });
    const b = await m.browseWorkshop({ q: 'farming', tags: ['Build 42'] });
    expect(calls).toBe(1);
    expect(a.source).toBe('web');
    expect(b.items).toHaveLength(30);
    const { db } = await import('../src/db.js');
    const row = db.prepare('SELECT title, creator, tags FROM workshop_meta WHERE workshop_id = ?').get('3837614147') as { title: string; creator: string; tags: string };
    expect(row.title).toBe('Living World [NPC] [B42]');
    expect(row.creator).toBe('76561198110597323');
    expect(JSON.parse(row.tags)).toContain('Farming');
    const p = db.prepare('SELECT name FROM steam_personas WHERE steamid = ?').get('76561198110597323') as { name: string };
    expect(p.name).toBe('Zaetic');
  });
});

describe('parseItemPage', () => {
  it('reads required items and the creator', () => {
    const p = m.parseItemPage(fx('item_with_required.html'));
    expect(p.requiredItems).toEqual([
      { workshopId: '3690770492', title: 'zdk' },
      { workshopId: '3619862853', title: 'ZombieBuddy' },
    ]);
    expect(p.creators).toEqual([{ steamid: '76561198043849998', name: 'Zed' }]);
    expect(p.isCollection).toBe(false);
  });
  it('returns nothing for items without requirements', () => {
    const p = m.parseItemPage(fx('item_plain.html'));
    expect(p.requiredItems).toEqual([]);
    expect(p.creators[0]?.name).toBeTruthy();
  });
});

describe('resolvePersonas', () => {
  it('reads the profile xml and caches it', async () => {
    let calls = 0;
    m.http.fetchText = async (url) => {
      calls++;
      if (url.includes('76561198000000001')) throw new Error('boom');
      return '<?xml version="1.0"?><profile><steamID64>76561198000000000</steamID64><steamID><![CDATA[jolyne cujoh]]></steamID></profile>';
    };
    const r = await m.resolvePersonas(['76561198000000000', '76561198000000001']);
    expect(r).toEqual({ '76561198000000000': 'jolyne cujoh' });
    await m.resolvePersonas(['76561198000000000']);
    expect(calls).toBe(2);
  });
});

describe('getRequiredItems', () => {
  it('scrapes, caches and tolerates failures', async () => {
    let calls = 0;
    m.http.fetchText = async (url) => {
      calls++;
      if (url.endsWith('id=7000002')) throw new Error('429');
      return reqPage('7000099');
    };
    const r = await m.getRequiredItems(['7000001', '7000002']);
    expect(r).toEqual({ '7000001': ['7000099'], '7000002': [] });
    await m.getRequiredItems(['7000001']);
    expect(calls).toBe(2);
  });
});

describe('resolveInstallPlan', () => {
  it('expands collections, follows dependencies transitively, survives cycles and flags unavailable ids', async () => {
    const deps: Record<string, string[]> = { '8000001': ['8000002'], '8000002': ['8000003'], '8000003': ['8000001'], '8000004': [], '8000010': ['8000004'] };
    const gone = new Set(['8000099']);
    m.http.publishedDetails = async (ids) => ids.map((id) => ({ publishedfileid: id, result: gone.has(id) ? 9 : 1, title: `Title ${id}` }));
    m.http.collectionItems = async (id) => (id === '8000100' ? ['8000010', '8000099', '8000001'] : []);
    m.http.fetchText = async (url) => reqPage(...(deps[/id=(\d+)/.exec(url)![1]] ?? []));
    const plan = await m.resolveInstallPlan(['8000100', '8000001', '8000098'], { inServer: new Set(['8000001']), installed: new Set(['8000004']) });
    const by = Object.fromEntries(plan.items.map((i) => [i.workshopId, i]));
    expect(plan.items.map((i) => i.workshopId).sort()).toEqual(['8000001', '8000002', '8000003', '8000004', '8000010', '8000098']);
    expect(by['8000100']).toBeUndefined();
    expect(by['8000001']).toMatchObject({ reason: 'requested', alreadyInServer: true, title: 'Title 8000001' });
    expect(by['8000010']).toMatchObject({ reason: 'collection', via: '8000100' });
    expect(by['8000004']).toMatchObject({ reason: 'dependency', via: '8000010', installed: true });
    expect(by['8000002']).toMatchObject({ reason: 'dependency', via: '8000001' });
    expect(by['8000003']).toMatchObject({ reason: 'dependency', via: '8000002' });
    expect(plan.unavailable).toEqual(['8000099']);
  });
});
