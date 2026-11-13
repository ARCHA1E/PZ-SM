/**
 * Browse the Steam Workshop for Project Zomboid without a Steam Web API key, and resolve
 * "Required items" dependencies.
 *
 * Without a key the browse page is read from Steam's server-rendered HTML (the
 * `valve-ssr-data` JSON blob); item pages are scraped for their required items. With a key
 * the official IPublishedFileService/QueryFiles API is used (falling back to the web path).
 */
import type {
  WorkshopAuthor,
  WorkshopBrowseItem,
  WorkshopBrowseQuery,
  WorkshopBrowseResult,
  WorkshopInstallPlan,
  WorkshopInstallPlanItem,
  WorkshopItemDetails,
  WorkshopSort,
} from '@pzsm/shared';
import { db, getSettings, kvGet, kvSet } from '../db.js';
import { getCollectionItems } from './steam.js';

const APP_ID = 108600;
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const STEAM_ID_BASE = 76561197960265728n;
/** Steam's SSR browse page always returns 30 results per page, whatever numperpage says. */
const WEB_PER_PAGE = 30;

// ---------------------------------------------------------------- injectable network layer

export interface RawPublishedFile {
  publishedfileid: string;
  result: number;
  title?: string;
  description?: string;
  creator?: string;
  preview_url?: string;
  tags?: { tag: string }[];
  subscriptions?: number;
  favorited?: number;
  time_created?: number;
  time_updated?: number;
  file_size?: number | string;
}

/** Network access; tests replace these members. */
export const http = {
  async fetchText(url: string, init?: { method?: string; body?: URLSearchParams }): Promise<string> {
    const r = await fetch(url, {
      method: init?.method,
      body: init?.body,
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw new Error(`Steam ${r.status} for ${new URL(url).pathname}`);
    return r.text();
  },
  /** Keyless ISteamRemoteStorage/GetPublishedFileDetails (any number of ids). */
  async publishedDetails(ids: string[]): Promise<RawPublishedFile[]> {
    const out: RawPublishedFile[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const body = new URLSearchParams({ itemcount: String(chunk.length) });
      chunk.forEach((id, j) => body.set(`publishedfileids[${j}]`, id));
      const text = await http.fetchText('https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/', { method: 'POST', body });
      const j = JSON.parse(text) as { response?: { publishedfiledetails?: RawPublishedFile[] } };
      out.push(...(j.response?.publishedfiledetails ?? []));
    }
    return out;
  },
  /** Child item ids of a collection ([] when it is not one). */
  collectionItems: (id: string): Promise<string[]> => getCollectionItems(id),
};

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// ---------------------------------------------------------------- browse: URL

/** Fallback when no web page has been fetched yet. */
const FALLBACK_TAGS = [
  'Build 40', 'Build 41', 'Build 42', 'Animals', 'Audio', 'Balance', 'Building', 'Clothing/Armor', 'Farming', 'Food', 'Framework',
  'Hardmode', 'Interface', 'Map', 'Military', 'Misc', 'Models', 'Occupations', 'QOL', 'Realistic', 'Textures', 'Traits', 'Vehicles',
  'Weapons', 'Language', 'Multiplayer', 'Pack', 'Retextures', 'Tools',
];

const SORTS: WorkshopSort[] = ['trend', 'mostrecent', 'lastupdated', 'totaluniquesubscribers', 'toprated', 'textsearch'];
/** Values of `days=` Steam distinguishes for trend sorting (anything >90 behaves as all time). */
const TREND_DAYS = [1, 7, 30, 90, 180, 365];

function effectiveSort(q: WorkshopBrowseQuery): WorkshopSort {
  if (q.sort && SORTS.includes(q.sort)) return q.sort;
  return q.q?.trim() ? 'textsearch' : 'trend';
}

export function buildBrowseUrl(q: WorkshopBrowseQuery): string {
  const sort = effectiveSort(q);
  const p = new URLSearchParams();
  p.set('appid', String(APP_ID));
  if (q.q?.trim()) p.set('searchtext', q.q.trim());
  p.set('browsesort', sort);
  p.set('section', q.section === 'collections' ? 'collections' : 'readytouseitems');
  for (const t of q.tags ?? []) if (t) p.append('requiredtags[]', t);
  for (const t of q.excludeTags ?? []) if (t) p.append('excludedtags[]', t);
  p.set('actualsort', sort);
  if (sort === 'trend' && q.days != null) {
    p.set('days', String(q.days <= 0 || !TREND_DAYS.includes(q.days) ? 365 : q.days));
  }
  p.set('p', String(Math.max(1, Math.floor(q.page ?? 1))));
  p.set('numperpage', String(WEB_PER_PAGE));
  return `https://steamcommunity.com/workshop/browse/?${p.toString()}`;
}

// ---------------------------------------------------------------- browse: parse

interface SsrQuery {
  queryKey: unknown[];
  state?: { data?: unknown };
}

interface RawBrowseResult {
  publishedfileid: string;
  creator?: string;
  file_type?: number;
  preview_url?: string;
  title?: string;
  short_description?: string;
  num_children?: number;
  time_created?: number;
  time_updated?: number;
  file_size?: string | number;
  tags?: { tag?: string; display_name?: string }[];
  subscriptions?: number;
  favorited?: number;
  star_rating?: number;
  total_votes?: number;
}

function ssrQueries(html: string): SsrQuery[] {
  const m = /<script[^>]*id="valve-ssr-data"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error('Steam browse page has no valve-ssr-data blob (Steam changed its page layout or returned an error page)');
  let blob: { renderContext?: { queryData?: unknown } };
  try {
    blob = JSON.parse(m[1]);
  } catch {
    throw new Error('Steam browse page: valve-ssr-data is not valid JSON');
  }
  let qd = blob.renderContext?.queryData;
  if (typeof qd === 'string') {
    try {
      qd = JSON.parse(qd);
    } catch {
      throw new Error('Steam browse page: renderContext.queryData is not valid JSON');
    }
  }
  const queries = (qd as { queries?: SsrQuery[] } | undefined)?.queries;
  if (!Array.isArray(queries)) throw new Error('Steam browse page: no queries in the render context');
  return queries;
}

export function parseBrowsePage(html: string): { result: Omit<WorkshopBrowseResult, 'source'>; personas: Record<string, string> } {
  const queries = ssrQueries(html);
  const personas: Record<string, string> = {};
  const addPersona = (pd: { public_data?: { steamid?: string; persona_name?: string } } | undefined) => {
    const d = pd?.public_data;
    if (d?.steamid && d.persona_name) personas[d.steamid] = d.persona_name;
  };
  let browse: { eresult?: number; current_page?: number; total_pages?: number; total_count?: number; results?: RawBrowseResult[]; creator_player_link_details?: unknown[] } | undefined;
  let availableTags: string[] = [];
  for (const q of queries) {
    const key = q.queryKey;
    const data = q.state?.data as Record<string, unknown> | undefined;
    if (!Array.isArray(key) || !data) continue;
    if (key[0] === 'workshop_browse') browse = data as typeof browse;
    else if (key[0] === 'PlayerLinkDetails') addPersona(data as never);
    else if (key[0] === 'declared_tags_v6' && key[1] === APP_ID) {
      const groups = (data.mtx_tags ?? []) as { tags?: { name?: string; admin_only?: boolean }[] }[];
      availableTags = groups.flatMap((g) => g.tags ?? []).filter((t) => t.name && !t.admin_only).map((t) => t.name as string);
    }
  }
  if (!browse) throw new Error('Steam browse page has no workshop_browse query (Steam changed its page layout or returned an error page)');
  for (const d of browse.creator_player_link_details ?? []) addPersona(d as never);
  const items: WorkshopBrowseItem[] = (browse.results ?? []).map((r) => {
    const steamid = r.creator ?? '';
    const size = Number(r.file_size ?? 0);
    return {
      workshopId: r.publishedfileid,
      title: r.title ?? r.publishedfileid,
      preview: r.preview_url || undefined,
      shortDescription: r.short_description || undefined,
      author: { steamid, name: personas[steamid] },
      tags: (r.tags ?? []).map((t) => t.tag ?? t.display_name ?? '').filter(Boolean),
      subscriptions: r.subscriptions,
      favorited: r.favorited,
      stars: r.star_rating,
      votes: r.total_votes,
      timeCreated: r.time_created,
      timeUpdated: r.time_updated,
      size: size > 0 ? size : undefined,
      numChildren: r.num_children ?? 0,
      isCollection: r.file_type === 2,
    };
  });
  return {
    result: {
      items,
      total: browse.total_count ?? items.length,
      page: browse.current_page ?? 1,
      totalPages: browse.total_pages ?? 1,
      availableTags,
    },
    personas,
  };
}

// ---------------------------------------------------------------- DB helpers

interface MetaRow {
  workshopId: string;
  title?: string;
  preview?: string;
  timeUpdated?: number;
  size?: number;
  tags?: string[];
  creator?: string;
  subscriptions?: number;
}

/** Upsert basic metadata; never touches the deps columns. */
function upsertMeta(rows: MetaRow[]): void {
  if (!rows.length) return;
  const up = db.prepare(
    `INSERT INTO workshop_meta (workshop_id, title, preview, time_updated, size, fetched_at, tags, creator, subscriptions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(workshop_id) DO UPDATE SET title=excluded.title, preview=excluded.preview, time_updated=excluded.time_updated,
       size=excluded.size, fetched_at=excluded.fetched_at, tags=excluded.tags, creator=excluded.creator, subscriptions=excluded.subscriptions`,
  );
  const now = Date.now();
  db.transaction(() => {
    for (const r of rows) {
      up.run(r.workshopId, r.title ?? null, r.preview ?? null, r.timeUpdated ?? null, r.size ?? null, now, JSON.stringify(r.tags ?? []), r.creator ?? null, r.subscriptions ?? null);
    }
  })();
}

function metaFromBrowse(items: WorkshopBrowseItem[]): MetaRow[] {
  return items
    .filter((i) => !i.isCollection)
    .map((i) => ({ workshopId: i.workshopId, title: i.title, preview: i.preview, timeUpdated: i.timeUpdated, size: i.size, tags: i.tags, creator: i.author.steamid || undefined, subscriptions: i.subscriptions }));
}

function metaFromRaw(d: RawPublishedFile): MetaRow {
  return {
    workshopId: d.publishedfileid,
    title: d.title,
    preview: d.preview_url,
    timeUpdated: d.time_updated,
    size: Number(d.file_size ?? 0) || undefined,
    tags: (d.tags ?? []).map((t) => t.tag),
    creator: d.creator,
    subscriptions: d.subscriptions,
  };
}

function storePersonas(personas: Record<string, string>): void {
  const entries = Object.entries(personas);
  if (!entries.length) return;
  const up = db.prepare('INSERT INTO steam_personas (steamid, name, fetched_at) VALUES (?, ?, ?) ON CONFLICT(steamid) DO UPDATE SET name=excluded.name, fetched_at=excluded.fetched_at');
  const now = Date.now();
  db.transaction(() => {
    for (const [id, name] of entries) up.run(id, name, now);
  })();
}

function storeDeps(id: string, deps: string[]): void {
  db.prepare(
    `INSERT INTO workshop_meta (workshop_id, deps, deps_fetched_at) VALUES (?, ?, ?)
     ON CONFLICT(workshop_id) DO UPDATE SET deps=excluded.deps, deps_fetched_at=excluded.deps_fetched_at`,
  ).run(id, JSON.stringify(deps), Date.now());
}

function metaTitles(ids: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const get = db.prepare('SELECT title FROM workshop_meta WHERE workshop_id = ?');
  for (const id of ids) {
    const r = get.get(id) as { title: string | null } | undefined;
    if (r?.title) out.set(id, r.title);
  }
  return out;
}

// ---------------------------------------------------------------- personas

const PERSONA_TTL_MS = 30 * 86400_000;

export async function resolvePersonas(steamids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const todo: string[] = [];
  const get = db.prepare('SELECT name, fetched_at FROM steam_personas WHERE steamid = ?');
  for (const id of [...new Set(steamids.filter(Boolean))]) {
    const r = get.get(id) as { name: string | null; fetched_at: number } | undefined;
    if (r?.name && Date.now() - r.fetched_at < PERSONA_TTL_MS) out[id] = r.name;
    else todo.push(id);
  }
  const fetched: Record<string, string> = {};
  await mapLimit(todo, 4, async (id) => {
    try {
      const xml = await http.fetchText(`https://steamcommunity.com/profiles/${encodeURIComponent(id)}/?xml=1`);
      const m = /<steamID><!\[CDATA\[([\s\S]*?)\]\]><\/steamID>/.exec(xml) ?? /<steamID>([^<]+)<\/steamID>/.exec(xml);
      const name = m?.[1].trim();
      if (name) fetched[id] = decodeEntities(name);
    } catch {
      /* skip */
    }
  });
  storePersonas(fetched);
  return { ...out, ...fetched };
}

// ---------------------------------------------------------------- browse

const BROWSE_TTL_MS = 5 * 60_000;
const browseCache = new Map<string, { at: number; result: WorkshopBrowseResult }>();

export function clearBrowseCache(): void {
  browseCache.clear();
  detailsCache.clear();
}

const API_QUERY_TYPE: Record<WorkshopSort, number> = {
  toprated: 0,
  mostrecent: 1,
  trend: 3,
  totaluniquesubscribers: 9,
  textsearch: 12,
  lastupdated: 21,
};

async function browseViaApi(q: WorkshopBrowseQuery, key: string): Promise<WorkshopBrowseResult> {
  const sort = effectiveSort(q);
  const perPage = Math.min(100, Math.max(1, q.perPage ?? WEB_PER_PAGE));
  const page = Math.max(1, Math.floor(q.page ?? 1));
  const p = new URLSearchParams({
    key,
    appid: String(APP_ID),
    query_type: String(API_QUERY_TYPE[sort]),
    page: String(page),
    numperpage: String(perPage),
    return_tags: 'true',
    return_short_description: 'true',
    return_children: 'true',
    return_vote_data: 'true',
    return_metadata: 'false',
    filetype: q.section === 'collections' ? '1' : '0',
  });
  if (q.q?.trim()) p.set('search_text', q.q.trim());
  if (sort === 'trend' && q.days != null && q.days > 0) p.set('days', String(q.days));
  (q.tags ?? []).forEach((t, i) => p.set(`requiredtags[${i}]`, t));
  (q.excludeTags ?? []).forEach((t, i) => p.set(`excludedtags[${i}]`, t));
  const text = await http.fetchText(`https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/?${p.toString()}`);
  const j = JSON.parse(text) as {
    response?: {
      total?: number;
      publishedfiledetails?: (RawBrowseResult & { vote_data?: { score?: number; votes_up?: number; votes_down?: number }; result?: number })[];
    };
  };
  const rows = j.response?.publishedfiledetails;
  if (!rows) throw new Error('Steam API returned no publishedfiledetails');
  const ids = [...new Set(rows.map((r) => r.creator).filter((x): x is string => !!x))];
  const personas: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 100) {
    try {
      const t = await http.fetchText(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?${new URLSearchParams({ key, steamids: ids.slice(i, i + 100).join(',') })}`);
      const s = JSON.parse(t) as { response?: { players?: { steamid: string; personaname?: string }[] } };
      for (const pl of s.response?.players ?? []) if (pl.personaname) personas[pl.steamid] = pl.personaname;
    } catch {
      /* names are optional */
    }
  }
  storePersonas(personas);
  const total = j.response?.total ?? rows.length;
  const items: WorkshopBrowseItem[] = rows.map((r) => {
    const steamid = r.creator ?? '';
    const size = Number(r.file_size ?? 0);
    const score = r.vote_data?.score;
    const votes = r.vote_data ? (r.vote_data.votes_up ?? 0) + (r.vote_data.votes_down ?? 0) : undefined;
    return {
      workshopId: r.publishedfileid,
      title: r.title ?? r.publishedfileid,
      preview: r.preview_url || undefined,
      shortDescription: r.short_description || undefined,
      author: { steamid, name: personas[steamid] },
      tags: (r.tags ?? []).map((t) => t.tag ?? t.display_name ?? '').filter(Boolean),
      subscriptions: r.subscriptions,
      favorited: r.favorited,
      stars: score != null && votes ? Math.round(score * 5) : undefined,
      votes,
      timeCreated: r.time_created,
      timeUpdated: r.time_updated,
      size: size > 0 ? size : undefined,
      numChildren: r.num_children ?? 0,
      isCollection: q.section === 'collections' || r.file_type === 2,
    };
  });
  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    availableTags: kvGet<string[]>('workshop_tags', []).length ? kvGet<string[]>('workshop_tags', []) : FALLBACK_TAGS,
    source: 'api',
  };
}

async function browseViaWeb(q: WorkshopBrowseQuery): Promise<WorkshopBrowseResult> {
  const url = buildBrowseUrl(q);
  const hit = browseCache.get(url);
  if (hit && Date.now() - hit.at < BROWSE_TTL_MS) return hit.result;
  const { result, personas } = parseBrowsePage(await http.fetchText(url));
  storePersonas(personas);
  if (result.availableTags.length) kvSet('workshop_tags', result.availableTags);
  else result.availableTags = kvGet<string[]>('workshop_tags', FALLBACK_TAGS);
  const full: WorkshopBrowseResult = { ...result, source: 'web' };
  browseCache.set(url, { at: Date.now(), result: full });
  return full;
}

export async function browseWorkshop(q: WorkshopBrowseQuery): Promise<WorkshopBrowseResult> {
  const key = getSettings().steamApiKey?.trim();
  let result: WorkshopBrowseResult | undefined;
  if (key) {
    try {
      result = await browseViaApi(q, key);
    } catch {
      /* fall back to the web path */
    }
  }
  result ??= await browseViaWeb(q);
  try {
    upsertMeta(metaFromBrowse(result.items));
  } catch {
    /* metadata is a cache only */
  }
  return result;
}

// ---------------------------------------------------------------- item page

export interface ParsedItemPage {
  requiredItems: { workshopId: string; title?: string }[];
  creators: { steamid?: string; name: string }[];
  /** The page lists collection children. */
  isCollection: boolean;
}

export function parseItemPage(html: string): ParsedItemPage {
  const requiredItems: { workshopId: string; title?: string }[] = [];
  const marker = /<div[^>]*id="RequiredItems"[^>]*>/.exec(html);
  if (marker) {
    const re = /\s*<a\s[^>]*href="[^"]*[?&]id=(\d+)[^"]*"[^>]*>\s*<div class="requiredItem">([\s\S]*?)<\/div>\s*<\/a>/y;
    re.lastIndex = marker.index + marker[0].length;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const title = decodeEntities(m[2].replace(/<[^>]*>/g, '')).trim();
      if (!requiredItems.some((r) => r.workshopId === m![1])) requiredItems.push({ workshopId: m[1], title: title || undefined });
      re.lastIndex = m.index + m[0].length;
    }
  }
  const creators: { steamid?: string; name: string }[] = [];
  const cb = html.indexOf('class="creatorsBlock"');
  if (cb >= 0) {
    const section = html.slice(cb, cb + 8000);
    const re = /data-miniprofile="(\d+)"[\s\S]*?href="([^"]*)"[\s\S]*?class="friendBlockContent">\s*([^<]*?)\s*<br>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(section))) {
      const prof = /\/profiles\/(\d{17})/.exec(m[2]);
      const steamid = prof ? prof[1] : (STEAM_ID_BASE + BigInt(m[1])).toString();
      const name = decodeEntities(m[3]).trim();
      if (name) creators.push({ steamid, name });
    }
  }
  return { requiredItems, creators, isCollection: /class="collectionItem[ "]/.test(html) };
}

function itemUrl(id: string): string {
  return `https://steamcommunity.com/sharedfiles/filedetails/?id=${encodeURIComponent(id)}`;
}

// ---------------------------------------------------------------- item details

const DETAILS_TTL_MS = 3600_000;
const detailsCache = new Map<string, { at: number; value: WorkshopItemDetails }>();

export async function getItemDetails(id: string): Promise<WorkshopItemDetails> {
  const hit = detailsCache.get(id);
  if (hit && Date.now() - hit.at < DETAILS_TTL_MS) return hit.value;
  const raw = (await http.publishedDetails([id])).find((d) => d.publishedfileid === id);
  if (!raw || raw.result !== 1) throw new Error(`Workshop item ${id} was not found (it may be private or removed)`);
  let page: ParsedItemPage | undefined;
  try {
    page = parseItemPage(await http.fetchText(itemUrl(id)));
  } catch {
    /* the keyless API data is still useful */
  }
  let children: string[] = [];
  if (!page || page.isCollection) {
    try {
      children = await http.collectionItems(id);
    } catch {
      /* ignore */
    }
  }
  const isCollection = children.length > 0;
  const creatorId = raw.creator ?? page?.creators[0]?.steamid ?? '';
  let name = page?.creators.find((c) => c.steamid === creatorId)?.name ?? (page?.creators.length === 1 ? page.creators[0].name : undefined);
  if (name && creatorId) storePersonas({ [creatorId]: name });
  else if (creatorId) name = (await resolvePersonas([creatorId]))[creatorId];
  const author: WorkshopAuthor = { steamid: creatorId, name };
  const requiredItems = isCollection ? [] : page?.requiredItems ?? [];
  const desc = raw.description ?? '';
  const size = Number(raw.file_size ?? 0);
  const value: WorkshopItemDetails = {
    workshopId: id,
    title: raw.title ?? id,
    preview: raw.preview_url || undefined,
    shortDescription: desc ? desc.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) || undefined : undefined,
    author,
    tags: (raw.tags ?? []).map((t) => t.tag),
    subscriptions: raw.subscriptions,
    favorited: raw.favorited,
    timeCreated: raw.time_created,
    timeUpdated: raw.time_updated,
    size: size > 0 ? size : undefined,
    numChildren: children.length,
    isCollection,
    description: desc || undefined,
    requiredItems,
    collectionItems: isCollection ? children : undefined,
  };
  try {
    upsertMeta([metaFromRaw(raw)]);
    if (page) storeDeps(id, requiredItems.map((r) => r.workshopId));
  } catch {
    /* cache only */
  }
  detailsCache.set(id, { at: Date.now(), value });
  return value;
}

// ---------------------------------------------------------------- dependencies

export async function getRequiredItems(ids: string[], opts: { maxAgeMs?: number } = {}): Promise<Record<string, string[]>> {
  const maxAge = opts.maxAgeMs ?? 86400_000;
  const out: Record<string, string[]> = {};
  const get = db.prepare('SELECT deps, deps_fetched_at FROM workshop_meta WHERE workshop_id = ?');
  const todo: string[] = [];
  for (const id of [...new Set(ids)]) {
    const r = get.get(id) as { deps: string | null; deps_fetched_at: number | null } | undefined;
    if (r?.deps && r.deps_fetched_at && Date.now() - r.deps_fetched_at < maxAge) {
      try {
        out[id] = JSON.parse(r.deps) as string[];
        continue;
      } catch {
        /* refetch */
      }
    }
    todo.push(id);
  }
  await mapLimit(todo, 4, async (id) => {
    try {
      const deps = parseItemPage(await http.fetchText(itemUrl(id))).requiredItems.map((r) => r.workshopId);
      out[id] = deps;
      storeDeps(id, deps);
    } catch {
      out[id] = [];
    }
  });
  return out;
}

// ---------------------------------------------------------------- install plan

export async function resolveInstallPlan(ids: string[], known: { inServer: Set<string>; installed: Set<string> }): Promise<WorkshopInstallPlan> {
  const seen = new Set<string>();
  const items: WorkshopInstallPlanItem[] = [];
  const unavailable: string[] = [];
  let level: { id: string; reason: WorkshopInstallPlanItem['reason']; via?: string }[] = [...new Set(ids)].map((id) => ({ id, reason: 'requested' }));
  let first = true;
  while (level.length) {
    level = level.filter((e) => !seen.has(e.id));
    level.forEach((e) => seen.add(e.id));
    if (!level.length) break;
    const details = new Map((await http.publishedDetails(level.map((e) => e.id))).map((d) => [d.publishedfileid, d]));
    const next: typeof level = [];
    const expandable: { id: string }[] = [];
    const found: RawPublishedFile[] = [];
    const accepted: typeof level = [];
    for (const e of level) {
      const d = details.get(e.id);
      if (!d || d.result !== 1) {
        unavailable.push(e.id);
        continue;
      }
      found.push(d);
      accepted.push(e);
    }
    try {
      upsertMeta(found.map(metaFromRaw));
    } catch {
      /* cache only */
    }
    const titles = metaTitles(accepted.map((e) => e.id));
    // Only ids the user typed can be collections; Steam does not allow collections as requirements.
    const collections = new Map<string, string[]>();
    if (first) {
      await mapLimit(accepted, 4, async (e) => {
        try {
          const kids = await http.collectionItems(e.id);
          if (kids.length) collections.set(e.id, kids);
        } catch {
          /* treat as a plain item */
        }
      });
    }
    for (const e of accepted) {
      const kids = collections.get(e.id);
      if (kids) {
        for (const k of kids) next.push({ id: k, reason: 'collection', via: e.id });
        continue;
      }
      items.push({
        workshopId: e.id,
        title: details.get(e.id)?.title ?? titles.get(e.id),
        reason: e.reason,
        via: e.via,
        alreadyInServer: known.inServer.has(e.id),
        installed: known.installed.has(e.id),
      });
      expandable.push({ id: e.id });
    }
    first = false;
    const deps = await getRequiredItems(expandable.map((x) => x.id));
    for (const { id } of expandable) {
      for (const dep of deps[id] ?? []) if (!seen.has(dep)) next.push({ id: dep, reason: 'dependency', via: id });
    }
    level = next;
  }
  return { items, unavailable };
}
