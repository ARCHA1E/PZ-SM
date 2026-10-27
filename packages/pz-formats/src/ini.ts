/**
 * Project Zomboid server .ini (`Key=Value` lines, each optionally preceded by `#` comments).
 * Edits are applied line-by-line so the rest of the file stays byte-identical.
 */
import { parseCommentMeta, type CommentMeta } from './meta.js';

export interface IniEntry {
  key: string;
  /** Value exactly as written (not trimmed: the game keeps leading spaces in some strings). */
  value: string;
  comments: string[];
  meta: CommentMeta;
  /** Zero-based line index. */
  line: number;
}

export interface IniDocument {
  eol: '\r\n' | '\n';
  lines: string[];
  trailingNewline: boolean;
  entries: IniEntry[];
}

export function parseIni(text: string): IniDocument {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = text.endsWith('\n');
  const body = trailingNewline ? text.slice(0, text.length - (text.endsWith('\r\n') ? 2 : 1)) : text;
  const lines = body.length ? body.split(/\r?\n/) : [];
  const entries: IniEntry[] = [];
  let pending: string[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t === '') {
      pending = [];
      return;
    }
    if (t.startsWith('#') || t.startsWith(';')) {
      pending.push(t.replace(/^[#;]\s?/, ''));
      return;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      pending = [];
      return;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    entries.push({ key, value, comments: pending, meta: parseCommentMeta(pending), line: i });
    pending = [];
  });
  return { eol, lines, trailingNewline, entries };
}

export function serializeIni(doc: IniDocument): string {
  return doc.lines.join(doc.eol) + (doc.trailingNewline ? doc.eol : '');
}

export function iniToRecord(doc: IniDocument): Record<string, string> {
  const o: Record<string, string> = {};
  for (const e of doc.entries) o[e.key] = e.value;
  return o;
}

export interface IniNewKey {
  key: string;
  value: string;
  comments?: string[];
}

/**
 * Set values in an ini text. Existing keys are replaced in place (first occurrence; later
 * duplicates removed). Unknown keys are appended with their optional comments.
 */
export function setIniValues(
  text: string,
  changes: Record<string, string>,
  opts: { comments?: Record<string, string[]> } = {},
): string {
  const doc = parseIni(text);
  const seen = new Set<string>();
  const drop = new Set<number>();
  for (const e of doc.entries) {
    if (!(e.key in changes)) continue;
    if (seen.has(e.key)) {
      drop.add(e.line);
      continue;
    }
    seen.add(e.key);
    doc.lines[e.line] = `${e.key}=${sanitizeIniValue(changes[e.key])}`;
  }
  if (drop.size) doc.lines = doc.lines.filter((_, i) => !drop.has(i));
  for (const [key, value] of Object.entries(changes)) {
    if (seen.has(key)) continue;
    if (doc.lines.length && doc.lines[doc.lines.length - 1].trim() !== '') doc.lines.push('');
    for (const c of opts.comments?.[key] ?? []) doc.lines.push(`# ${c}`);
    doc.lines.push(`${key}=${sanitizeIniValue(value)}`);
    doc.lines.push('');
    doc.trailingNewline = true;
  }
  if (doc.lines.length && doc.lines[doc.lines.length - 1] === '' && doc.trailingNewline) {
    // Avoid accumulating blank lines at EOF.
    while (doc.lines.length > 1 && doc.lines[doc.lines.length - 1] === '' && doc.lines[doc.lines.length - 2] === '') {
      doc.lines.pop();
    }
  }
  return serializeIni(doc);
}

export function removeIniKeys(text: string, keys: string[]): string {
  const doc = parseIni(text);
  const kill = new Set<number>();
  for (const e of doc.entries) {
    if (!keys.includes(e.key)) continue;
    kill.add(e.line);
    // Remove the comment block directly above, and one following blank line.
    let i = e.line - 1;
    while (i >= 0 && doc.lines[i].trim().startsWith('#')) kill.add(i--);
    if (doc.lines[e.line + 1]?.trim() === '') kill.add(e.line + 1);
  }
  doc.lines = doc.lines.filter((_, i) => !kill.has(i));
  return serializeIni(doc);
}

/** ini values are single-line; strip line breaks rather than corrupt the file. */
export function sanitizeIniValue(v: string): string {
  return String(v).replace(/\r?\n/g, ' ');
}

/** Split a `;`-separated list (Mods=, WorkshopItems=, Map=) into trimmed, non-empty items. */
export function splitList(value: string, sep = ';'): string[] {
  return value
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Mod IDs from Mods= with the cosmetic B42 `\` prefix removed. */
export function parseModsValue(value: string): string[] {
  return splitList(value.replace(/\\/g, ''));
}

export function formatModsValue(ids: string[], backslash = false): string {
  return ids.map((id) => (backslash ? `\\${id}` : id)).join(';');
}
