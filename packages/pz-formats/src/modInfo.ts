/** mod.info and map.info (`key=value` lines). */

export interface ModInfo {
  id: string;
  name: string;
  description?: string;
  author?: string;
  modversion?: string;
  url?: string;
  icon?: string;
  posters: string[];
  categories: string[];
  require: string[];
  incompatible: string[];
  loadModAfter: string[];
  loadModBefore: string[];
  versionMin?: string;
  versionMax?: string;
  pack?: string;
  tiledefs: string[];
  /** Every key → all values in file order (lower-cased keys). */
  raw: Record<string, string[]>;
}

function parseKeyValues(text: string): Record<string, string[]> {
  const raw: Record<string, string[]> = {};
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim().toLowerCase();
    if (!key || key.startsWith('#')) continue;
    (raw[key] ??= []).push(line.slice(eq + 1).trim());
  }
  return raw;
}

/** Split a comma list of mod IDs, removing the B42 `\` prefix and blanks. */
export function parseModIdList(values: string[] | undefined): string[] {
  if (!values) return [];
  return values
    .flatMap((v) => v.split(','))
    .map((s) => s.trim().replace(/^\\+/, ''))
    .filter(Boolean);
}

export function parseModInfo(text: string): ModInfo {
  const raw = parseKeyValues(text);
  const first = (k: string) => raw[k]?.[0];
  return {
    id: (first('id') ?? '').replace(/^\\+/, ''),
    name: first('name') ?? first('id') ?? '',
    description: raw.description?.join(' '),
    author: first('author'),
    modversion: first('modversion'),
    url: first('url'),
    icon: first('icon'),
    posters: raw.poster ?? [],
    categories: (raw.category ?? []).flatMap((c) => c.split(',')).map((c) => c.trim()).filter(Boolean),
    require: parseModIdList(raw.require),
    incompatible: parseModIdList(raw.incompatible),
    loadModAfter: parseModIdList(raw.loadmodafter),
    loadModBefore: parseModIdList(raw.loadmodbefore),
    versionMin: first('versionmin'),
    versionMax: first('versionmax'),
    pack: first('pack'),
    tiledefs: raw.tiledef ?? [],
    raw,
  };
}

export interface MapInfo {
  title?: string;
  lots: string[];
  description?: string;
  fixed2x?: boolean;
  zoomX?: number;
  zoomY?: number;
  zoomS?: number;
  demoVideo?: string;
  raw: Record<string, string[]>;
}

export function parseMapInfo(text: string): MapInfo {
  const raw = parseKeyValues(text);
  const first = (k: string) => raw[k]?.[0];
  const num = (k: string) => (first(k) !== undefined && !Number.isNaN(Number(first(k))) ? Number(first(k)) : undefined);
  return {
    title: first('title'),
    lots: (raw.lots ?? []).map((l) => l.trim()).filter(Boolean),
    description: raw.description?.join(' '),
    fixed2x: first('fixed2x') !== undefined ? first('fixed2x') === 'true' : undefined,
    zoomX: num('zoomx'),
    zoomY: num('zoomy'),
    zoomS: num('zooms'),
    demoVideo: first('demovideo'),
    raw,
  };
}

/** Strip PZ rich-text markup (<LINE>, <RGB:r,g,b>, <SIZE:..>, …) for plain display. */
export function stripPzMarkup(s: string): string {
  return s
    .replace(/<\s*LINE\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[A-Z]+(?::[^>]*)?>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
