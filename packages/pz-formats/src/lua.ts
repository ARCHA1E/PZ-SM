/**
 * Minimal Lua table-literal parser for the files Project Zomboid reads and writes
 * (SandboxVars, sandbox presets, spawnregions, spawnpoints, legacy translations).
 *
 * It records source spans for every value so callers can make surgical edits that
 * leave comments, ordering and formatting untouched.
 */

export type LuaScalar = string | number | boolean | null;
export type LuaValue = LuaScalar | LuaTable;

export interface Span {
  start: number;
  end: number;
}

export interface LuaField {
  /** Identifier/string key, or 1-based index for positional entries. */
  key: string | number;
  value: LuaValue;
  /** Raw source text of the value token (for scalars). */
  raw: string;
  /** Comment lines (without the leading `--`) immediately preceding this field. */
  comments: string[];
  valueSpan: Span;
  /** Span covering the whole field from key start to value end. */
  fieldSpan: Span;
}

export interface LuaTable {
  kind: 'table';
  fields: LuaField[];
  openSpan: Span;
  /** Position of the closing `}`. */
  closeSpan: Span;
  /** Comment lines found after the last field, before `}`. */
  trailingComments: string[];
}

type TokType = 'ident' | 'number' | 'string' | 'punct' | 'eof';

interface Token {
  type: TokType;
  text: string;
  value?: string | number;
  start: number;
  end: number;
  /** Comments seen between the previous token and this one. */
  comments: string[];
}

export class LuaParseError extends Error {
  constructor(
    message: string,
    public readonly offset: number,
  ) {
    super(message);
  }
}

class Lexer {
  pos = 0;
  constructor(private readonly src: string) {}

  next(): Token {
    const comments: string[] = [];
    const s = this.src;
    for (;;) {
      while (this.pos < s.length && /\s/.test(s[this.pos])) this.pos++;
      if (s.startsWith('--', this.pos)) {
        const long = /^--\[(=*)\[/.exec(s.slice(this.pos, this.pos + 20));
        if (long) {
          const close = `]${long[1]}]`;
          const endIdx = s.indexOf(close, this.pos + long[0].length);
          const stop = endIdx < 0 ? s.length : endIdx;
          comments.push(...s.slice(this.pos + long[0].length, stop).split(/\r?\n/));
          this.pos = endIdx < 0 ? s.length : endIdx + close.length;
        } else {
          let e = s.indexOf('\n', this.pos);
          if (e < 0) e = s.length;
          comments.push(s.slice(this.pos + 2, e).replace(/\r$/, ''));
          this.pos = e;
        }
        continue;
      }
      break;
    }
    const start = this.pos;
    if (start >= s.length) return { type: 'eof', text: '', start, end: start, comments };
    const c = s[start];

    if (/[A-Za-z_]/.test(c)) {
      let e = start + 1;
      while (e < s.length && /[A-Za-z0-9_]/.test(s[e])) e++;
      this.pos = e;
      return { type: 'ident', text: s.slice(start, e), start, end: e, comments };
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[start + 1] ?? ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(s.slice(start));
      const text = m![0];
      this.pos = start + text.length;
      return { type: 'number', text, value: Number(text), start, end: this.pos, comments };
    }
    if (c === '"' || c === "'") {
      let e = start + 1;
      let out = '';
      while (e < s.length && s[e] !== c) {
        if (s[e] === '\\') {
          const n = s[e + 1];
          const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'", '\n': '\n' };
          if (n in map) {
            out += map[n];
            e += 2;
            continue;
          }
          const dm = /^\d{1,3}/.exec(s.slice(e + 1));
          if (dm) {
            out += String.fromCharCode(Number(dm[0]));
            e += 1 + dm[0].length;
            continue;
          }
          out += n ?? '';
          e += 2;
          continue;
        }
        out += s[e];
        e++;
      }
      if (e >= s.length) throw new LuaParseError('Unterminated string', start);
      this.pos = e + 1;
      return { type: 'string', text: s.slice(start, this.pos), value: out, start, end: this.pos, comments };
    }
    const lb = /^\[(=*)\[/.exec(s.slice(start, start + 20));
    if (lb) {
      const close = `]${lb[1]}]`;
      const endIdx = s.indexOf(close, start + lb[0].length);
      if (endIdx < 0) throw new LuaParseError('Unterminated long string', start);
      let body = s.slice(start + lb[0].length, endIdx);
      if (body.startsWith('\r\n')) body = body.slice(2);
      else if (body.startsWith('\n')) body = body.slice(1);
      this.pos = endIdx + close.length;
      return { type: 'string', text: s.slice(start, this.pos), value: body, start, end: this.pos, comments };
    }
    if (s.startsWith('..', start)) {
      this.pos = start + 2;
      return { type: 'punct', text: '..', start, end: this.pos, comments };
    }
    this.pos = start + 1;
    return { type: 'punct', text: c, start, end: this.pos, comments };
  }
}

class Parser {
  private lex: Lexer;
  private tok: Token;

  constructor(private readonly src: string, startPos = 0) {
    this.lex = new Lexer(src);
    this.lex.pos = startPos;
    this.tok = this.lex.next();
  }

  private advance(): Token {
    const t = this.tok;
    this.tok = this.lex.next();
    return t;
  }

  private expect(text: string): Token {
    if (this.tok.text !== text || (this.tok.type !== 'punct' && this.tok.type !== 'ident')) {
      throw new LuaParseError(`Expected '${text}' but found '${this.tok.text || 'EOF'}'`, this.tok.start);
    }
    return this.advance();
  }

  get current(): Token {
    return this.tok;
  }

  parseTable(): LuaTable {
    const open = this.expect('{');
    const fields: LuaField[] = [];
    let index = 1;
    for (;;) {
      const t = this.tok;
      if (t.type === 'punct' && t.text === '}') {
        const close = this.advance();
        return {
          kind: 'table',
          fields,
          openSpan: { start: open.start, end: open.end },
          closeSpan: { start: close.start, end: close.end },
          trailingComments: t.comments,
        };
      }
      if (t.type === 'eof') throw new LuaParseError('Unterminated table', open.start);
      const comments = t.comments;
      const fieldStart = t.start;
      let key: string | number;

      if (t.type === 'ident' && !['true', 'false', 'nil'].includes(t.text) && this.peekIsAssign()) {
        key = t.text;
        this.advance();
        this.expect('=');
      } else if (t.type === 'punct' && t.text === '[') {
        this.advance();
        const k = this.advance();
        if (k.type !== 'string' && k.type !== 'number') throw new LuaParseError('Unsupported table key', k.start);
        key = k.value as string | number;
        this.expect(']');
        this.expect('=');
      } else {
        key = index++;
      }
      const { value, raw, span } = this.parseValue();
      fields.push({ key, value, raw, comments, valueSpan: span, fieldSpan: { start: fieldStart, end: span.end } });
      if (this.tok.type === 'punct' && (this.tok.text === ',' || this.tok.text === ';')) this.advance();
    }
  }

  /** True when the current ident token is followed by `=` (but not `==`). */
  private peekIsAssign(): boolean {
    const saved = this.lex.pos;
    const next = this.lex.next();
    const after = this.src[next.end];
    this.lex.pos = saved;
    return next.type === 'punct' && next.text === '=' && after !== '=';
  }

  parseValue(): { value: LuaValue; raw: string; span: Span } {
    const t = this.tok;
    if (t.type === 'punct' && t.text === '{') {
      const tbl = this.parseTable();
      const span = { start: tbl.openSpan.start, end: tbl.closeSpan.end };
      return { value: tbl, raw: this.src.slice(span.start, span.end), span };
    }
    if (t.type === 'punct' && t.text === '-') {
      this.advance();
      const n = this.advance();
      if (n.type !== 'number') throw new LuaParseError('Expected number after -', n.start);
      return { value: -(n.value as number), raw: this.src.slice(t.start, n.end), span: { start: t.start, end: n.end } };
    }
    if (t.type === 'number') {
      this.advance();
      return { value: t.value as number, raw: t.text, span: { start: t.start, end: t.end } };
    }
    if (t.type === 'string') {
      this.advance();
      let value = t.value as string;
      let end = t.end;
      // Support simple concatenation: "a" .. "b"
      while (this.tok.type === 'punct' && this.tok.text === '..') {
        this.advance();
        const n = this.advance();
        if (n.type !== 'string' && n.type !== 'number') throw new LuaParseError('Unsupported concatenation', n.start);
        value += String(n.value);
        end = n.end;
      }
      return { value, raw: this.src.slice(t.start, end), span: { start: t.start, end } };
    }
    if (t.type === 'ident') {
      this.advance();
      if (t.text === 'true') return { value: true, raw: t.text, span: { start: t.start, end: t.end } };
      if (t.text === 'false') return { value: false, raw: t.text, span: { start: t.start, end: t.end } };
      if (t.text === 'nil') return { value: null, raw: t.text, span: { start: t.start, end: t.end } };
      // Unknown identifier/expression (e.g. a function call). Capture it verbatim up to a separator.
      let end = t.end;
      let depth = 0;
      while (this.tok.type !== 'eof') {
        const x = this.tok;
        if (depth === 0 && x.type === 'punct' && [',', ';', '}'].includes(x.text)) break;
        if (x.type === 'punct' && ['(', '{', '['].includes(x.text)) depth++;
        if (x.type === 'punct' && [')', '}', ']'].includes(x.text)) depth--;
        end = x.end;
        this.advance();
      }
      const raw = this.src.slice(t.start, end);
      return { value: raw, raw, span: { start: t.start, end } };
    }
    throw new LuaParseError(`Unexpected token '${t.text}'`, t.start);
  }
}

/** Parse the first table literal that follows `marker` (a regex) in `src`. */
export function parseTableAfter(src: string, marker: RegExp): LuaTable {
  const m = marker.exec(src);
  if (!m) throw new LuaParseError(`Marker ${marker} not found`, 0);
  const brace = src.indexOf('{', m.index + m[0].length - 1);
  if (brace < 0) throw new LuaParseError('No table found after marker', m.index);
  const p = new Parser(src, brace);
  return p.parseTable();
}

export function parseTableAt(src: string, pos: number): LuaTable {
  return new Parser(src, pos).parseTable();
}

export function isTable(v: LuaValue): v is LuaTable {
  return typeof v === 'object' && v !== null && (v as LuaTable).kind === 'table';
}

export function getField(t: LuaTable, key: string | number): LuaField | undefined {
  return t.fields.find((f) => f.key === key);
}

/** Convert a parsed table into plain JS (objects for keyed tables, arrays for positional ones). */
export function toPlain(v: LuaValue): unknown {
  if (!isTable(v)) return v;
  const allPositional = v.fields.length > 0 && v.fields.every((f) => typeof f.key === 'number');
  if (allPositional) return v.fields.map((f) => toPlain(f.value));
  const o: Record<string, unknown> = {};
  for (const f of v.fields) o[String(f.key)] = toPlain(f.value);
  return o;
}

export function luaString(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
}

export const LUA_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function luaKey(k: string): string {
  return LUA_IDENT.test(k) ? k : `[${luaString(k)}]`;
}

/**
 * Format a scalar the way Project Zomboid writes it. Doubles always carry a decimal
 * point (`1.0`) so the game reads them back as doubles.
 */
export function formatLuaScalar(v: LuaScalar, kind?: 'integer' | 'double'): string {
  if (v === null) return 'nil';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return formatNumber(v, kind);
  return luaString(v);
}

export function formatNumber(v: number, kind?: 'integer' | 'double'): string {
  if (!Number.isFinite(v)) throw new Error(`Cannot serialize non-finite number ${v}`);
  if (kind === 'integer') return String(Math.trunc(v));
  if (kind === 'double' && Number.isInteger(v)) return v.toFixed(1);
  return String(v);
}

export interface TextEdit {
  start: number;
  end: number;
  text: string;
}

/** Apply non-overlapping edits to `src`. */
export function applyEdits(src: string, edits: TextEdit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let out = src;
  let lastStart = Infinity;
  for (const e of sorted) {
    if (e.end > lastStart) throw new Error('Overlapping edits');
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    lastStart = e.start;
  }
  return out;
}

/** Indentation (leading whitespace) of the line containing `pos`. */
export function lineIndent(src: string, pos: number): string {
  const ls = src.lastIndexOf('\n', pos - 1) + 1;
  const m = /^[ \t]*/.exec(src.slice(ls));
  return m ? m[0] : '';
}

export function detectEol(src: string): '\r\n' | '\n' {
  return src.includes('\r\n') ? '\r\n' : '\n';
}
