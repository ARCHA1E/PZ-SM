/**
 * <server>_SandboxVars.lua and vanilla preset files (media/lua/shared/Sandbox/*.lua).
 *
 * Settings are addressed by path: top-level `Zombies`, nested `ZombieLore.Speed`
 * (vanilla sub-tables and mod namespaces are both one level deep).
 */
import {
  applyEdits,
  detectEol,
  formatLuaScalar,
  isTable,
  lineIndent,
  luaKey,
  parseTableAfter,
  type LuaField,
  type LuaScalar,
  type LuaTable,
  type TextEdit,
} from './lua.js';
import { inferOption, parseCommentMeta, type CommentMeta, type InferredOption } from './meta.js';

export interface SandboxEntry {
  path: string;
  /** Namespace (sub-table) or '' for top level. */
  namespace: string;
  key: string;
  value: LuaScalar;
  raw: string;
  isString: boolean;
  comments: string[];
  meta: CommentMeta;
  inferred: InferredOption;
  field: LuaField;
}

export interface SandboxDocument {
  text: string;
  root: LuaTable;
  version?: number;
  entries: SandboxEntry[];
  /** Namespaces (sub-tables) in file order. */
  namespaces: string[];
}

const ROOT_MARKER = /(?:SandboxVars\s*=\s*\{|return\s*\{)/;

export function parseSandboxVars(text: string): SandboxDocument {
  const root = parseTableAfter(text, ROOT_MARKER);
  const entries: SandboxEntry[] = [];
  const namespaces: string[] = [];
  let version: number | undefined;
  const add = (field: LuaField, namespace: string) => {
    const key = String(field.key);
    if (!namespace && /^version$/i.test(key)) {
      if (typeof field.value === 'number') version = field.value;
      return;
    }
    const value = field.value as LuaScalar;
    const isString = typeof value === 'string';
    const meta = parseCommentMeta(field.comments);
    entries.push({
      path: namespace ? `${namespace}.${key}` : key,
      namespace,
      key,
      value,
      raw: field.raw,
      isString,
      comments: field.comments,
      meta,
      inferred: inferOption(field.raw, meta, isString),
      field,
    });
  };
  for (const f of root.fields) {
    if (isTable(f.value)) {
      namespaces.push(String(f.key));
      for (const sub of f.value.fields) if (!isTable(sub.value)) add(sub, String(f.key));
    } else {
      add(f, '');
    }
  }
  return { text, root, version, entries, namespaces };
}

export function sandboxToRecord(doc: SandboxDocument): Record<string, LuaScalar> {
  const o: Record<string, LuaScalar> = {};
  for (const e of doc.entries) o[e.path] = e.value;
  return o;
}

export interface SandboxChange {
  value: LuaScalar;
  /** Needed to write doubles as `1.0`. */
  kind?: 'integer' | 'double';
}

/**
 * Apply value changes to SandboxVars text. Existing values are replaced in place; missing
 * keys are inserted at the end of their namespace table (created if needed).
 */
export function setSandboxValues(text: string, changes: Record<string, SandboxChange>): string {
  const doc = parseSandboxVars(text);
  const eol = detectEol(text);
  const edits: TextEdit[] = [];
  const byPath = new Map(doc.entries.map((e) => [e.path, e]));
  const missing = new Map<string, [string, SandboxChange][]>();

  for (const [path, ch] of Object.entries(changes)) {
    const existing = byPath.get(path);
    if (existing) {
      const kind = ch.kind ?? (typeof existing.value === 'number' && existing.raw.includes('.') ? 'double' : undefined);
      edits.push({ start: existing.field.valueSpan.start, end: existing.field.valueSpan.end, text: formatLuaScalar(ch.value, kind) });
      continue;
    }
    const dot = path.indexOf('.');
    const ns = dot < 0 ? '' : path.slice(0, dot);
    const key = dot < 0 ? path : path.slice(dot + 1);
    if (!missing.has(ns)) missing.set(ns, []);
    missing.get(ns)!.push([key, ch]);
  }

  const rootIndent = '    ';
  for (const [ns, items] of missing) {
    const nsField = ns ? doc.root.fields.find((f) => String(f.key) === ns && isTable(f.value)) : undefined;
    if (!ns || nsField) {
      const table = nsField ? (nsField.value as LuaTable) : doc.root;
      const ind = table.fields.length
        ? lineIndent(text, table.fields[table.fields.length - 1].fieldSpan.start)
        : lineIndent(text, table.closeSpan.start) + rootIndent;
      const insertAt = closeInsertPos(text, table);
      addMissingSeparator(text, table, edits);
      const body = items.map(([k, ch]) => `${ind}${luaKey(k)} = ${formatLuaScalar(ch.value, ch.kind)},${eol}`).join('');
      edits.push({ start: insertAt, end: insertAt, text: ensureLeadingNewline(text, insertAt, eol) + body });
    } else {
      const insertAt = closeInsertPos(text, doc.root);
      addMissingSeparator(text, doc.root, edits);
      const ind = rootIndent;
      let body = `${ind}${luaKey(ns)} = {${eol}`;
      for (const [k, ch] of items) body += `${ind}${ind}${luaKey(k)} = ${formatLuaScalar(ch.value, ch.kind)},${eol}`;
      body += `${ind}},${eol}`;
      edits.push({ start: insertAt, end: insertAt, text: ensureLeadingNewline(text, insertAt, eol) + body });
    }
  }
  return applyEdits(text, mergeSamePosition(edits));
}

/** Ensure the table's last field ends with a separator before we append after it. */
function addMissingSeparator(text: string, table: LuaTable, edits: TextEdit[]): void {
  const last = table.fields[table.fields.length - 1];
  if (!last) return;
  const between = text.slice(last.valueSpan.end, table.closeSpan.start).replace(/--[^\n]*/g, '');
  if (/[,;]/.test(between)) return;
  if (edits.some((e) => e.start === last.valueSpan.end && e.end === last.valueSpan.end && e.text === ',')) return;
  edits.push({ start: last.valueSpan.end, end: last.valueSpan.end, text: ',' });
}

/** Position at the start of the line holding the table's closing brace. */
function closeInsertPos(text: string, table: LuaTable): number {
  const lineStart = text.lastIndexOf('\n', table.closeSpan.start - 1) + 1;
  const before = text.slice(lineStart, table.closeSpan.start);
  return before.trim() === '' ? lineStart : table.closeSpan.start;
}

function ensureLeadingNewline(text: string, pos: number, eol: string): string {
  return pos === 0 || text[pos - 1] === '\n' ? '' : eol;
}

function mergeSamePosition(edits: TextEdit[]): TextEdit[] {
  const out: TextEdit[] = [];
  for (const e of edits) {
    const same = out.find((o) => o.start === e.start && o.end === e.end && o.start === o.end);
    if (same) same.text += e.text;
    else out.push(e);
  }
  return out;
}

export interface SandboxWriteOption {
  path: string;
  value: LuaScalar;
  kind?: 'integer' | 'double';
  comments?: string[];
}

/** Generate a complete SandboxVars.lua in the game's own layout. */
export function generateSandboxVars(version: number, options: SandboxWriteOption[], eol = '\r\n'): string {
  const top: SandboxWriteOption[] = [];
  const nested = new Map<string, SandboxWriteOption[]>();
  for (const o of options) {
    const dot = o.path.indexOf('.');
    if (dot < 0) top.push(o);
    else {
      const ns = o.path.slice(0, dot);
      if (!nested.has(ns)) nested.set(ns, []);
      nested.get(ns)!.push(o);
    }
  }
  const lines: string[] = ['SandboxVars = {', `    VERSION = ${version},`];
  const emit = (o: SandboxWriteOption, ind: string) => {
    for (const c of o.comments ?? []) lines.push(`${ind}-- ${c}`);
    const key = o.path.includes('.') ? o.path.slice(o.path.indexOf('.') + 1) : o.path;
    lines.push(`${ind}${luaKey(key)} = ${formatLuaScalar(o.value, o.kind)},`);
  };
  for (const o of top) emit(o, '    ');
  for (const [ns, opts] of nested) {
    lines.push(`    ${luaKey(ns)} = {`);
    for (const o of opts) emit(o, '        ');
    lines.push('    },');
  }
  lines.push('}');
  return lines.join(eol) + eol;
}
