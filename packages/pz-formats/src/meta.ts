/**
 * Extracts option metadata from the comments Project Zomboid writes above each setting
 * in <server>.ini, <server>_SandboxVars.lua and sandbox preset .cfg files, e.g.
 *
 *   # The time it takes ... Min: 0 Max: 1000 Default: 2
 *   -- How fast zombies move. Default = Random
 *   -- 1 = Sprinters
 */

export type OptionType = 'boolean' | 'integer' | 'double' | 'string' | 'enum';

export interface EnumChoice {
  value: number;
  label: string;
}

export interface CommentMeta {
  description?: string;
  min?: number;
  max?: number;
  /** Default exactly as written in the comment. */
  defaultRaw?: string;
  /** Label of the default enum entry (`Default = Random`). */
  defaultLabel?: string;
  choices?: EnumChoice[];
  /** True if the comment range used decimals (e.g. `Min: 0.00`). */
  decimal?: boolean;
}

const RANGE_RE = /\s*Min:\s*(-?[\d.]+)\s+Max:\s*(-?[\d.]+)(?:\s+Default:\s*(.*?))?\s*$/;
const DEFAULT_LABEL_RE = /\s*Default\s*=\s*(.+?)\s*$/;
const CHOICE_RE = /^\s*(-?\d+)\s*=\s*(.+?)\s*$/;

/** `lines` are comment bodies with their `#`/`--` prefixes already removed. */
export function parseCommentMeta(lines: string[]): CommentMeta {
  const meta: CommentMeta = {};
  const desc: string[] = [];
  const choices: EnumChoice[] = [];
  for (const raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    const choice = CHOICE_RE.exec(line);
    if (choice && !/Min:|Max:/.test(line)) {
      choices.push({ value: Number(choice[1]), label: choice[2] });
      continue;
    }
    const range = RANGE_RE.exec(line);
    if (range) {
      meta.min = Number(range[1]);
      meta.max = Number(range[2]);
      meta.decimal = range[1].includes('.') || range[2].includes('.');
      if (range[3] !== undefined && range[3] !== '') meta.defaultRaw = range[3];
      line = line.slice(0, range.index).trim();
    }
    const dl = DEFAULT_LABEL_RE.exec(line);
    if (dl && !range) {
      meta.defaultLabel = dl[1];
      line = line.slice(0, dl.index).trim();
    }
    if (line) desc.push(line);
  }
  if (desc.length) meta.description = desc.join(' ');
  if (choices.length) meta.choices = choices;
  return meta;
}

export interface InferredOption {
  type: OptionType;
  min?: number;
  max?: number;
  default?: string | number | boolean;
  choices?: EnumChoice[];
  description?: string;
}

/**
 * Infer an option's type from its current value/raw token and comment metadata.
 * `raw` is the literal as written in the file (needed to tell `1` from `1.0`).
 */
export function inferOption(raw: string, meta: CommentMeta, isLuaString = false): InferredOption {
  const out: InferredOption = { type: 'string', description: meta.description };
  const v = raw.trim();
  if (meta.choices && meta.choices.length) {
    out.type = 'enum';
    out.choices = meta.choices;
    out.min = Math.min(...meta.choices.map((c) => c.value));
    out.max = Math.max(...meta.choices.map((c) => c.value));
    if (meta.defaultLabel) {
      const d = meta.choices.find((c) => c.label === meta.defaultLabel);
      if (d) out.default = d.value;
    }
    return out;
  }
  if (!isLuaString && (v === 'true' || v === 'false')) {
    out.type = 'boolean';
    return out;
  }
  if (meta.min !== undefined && meta.max !== undefined) {
    out.type = meta.decimal || /\./.test(v) ? 'double' : 'integer';
    out.min = meta.min;
    out.max = meta.max;
    if (meta.defaultRaw !== undefined && meta.defaultRaw !== '') {
      const n = Number(meta.defaultRaw);
      if (!Number.isNaN(n)) out.default = n;
    }
    return out;
  }
  if (!isLuaString && /^-?\d+$/.test(v)) {
    out.type = 'integer';
    return out;
  }
  if (!isLuaString && /^-?\d*\.\d+$/.test(v)) {
    out.type = 'double';
    return out;
  }
  if (meta.defaultRaw !== undefined) out.default = meta.defaultRaw;
  return out;
}
