/**
 * Mod `media/sandbox-options.txt` definitions (parsed in-game by zombie.sandbox.CustomSandboxOptions).
 *
 *   VERSION = 1,
 *   option CompanionDogs.TameThreshold
 *   {
 *       type = integer, min = 1, max = 1000, default = 100,
 *       page = CompanionDogs, translation = CompanionDogs_TameThreshold,
 *   }
 */

export type CustomOptionType = 'boolean' | 'integer' | 'double' | 'enum' | 'string';

export interface CustomSandboxOption {
  /** Full dotted name, e.g. `CompanionDogs.TameThreshold`. */
  name: string;
  namespace: string;
  key: string;
  type: CustomOptionType;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  numValues?: number;
  page?: string;
  translation?: string;
  valueTranslation?: string;
  tooltip?: string;
  maxLength?: number;
  /** All properties as written. */
  props: Record<string, string>;
}

export interface SandboxOptionsFile {
  version?: number;
  options: CustomSandboxOption[];
  warnings: string[];
}

const TYPES = new Set(['boolean', 'integer', 'double', 'enum', 'string']);

export function parseSandboxOptions(text: string): SandboxOptionsFile {
  const src = stripComments(text.replace(/^﻿/, ''));
  const warnings: string[] = [];
  const vm = /\bVERSION\s*=\s*(\d+)/.exec(src);
  const options: CustomSandboxOption[] = [];
  const re = /\boption\s+([A-Za-z0-9_.\-]+)\s*=?\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const bodyStart = m.index + m[0].length;
    const close = findClose(src, bodyStart);
    if (close < 0) {
      warnings.push(`Unterminated option block for ${m[1]}`);
      break;
    }
    const props = parseProps(src.slice(bodyStart, close));
    re.lastIndex = close + 1;
    const name = m[1];
    const dot = name.indexOf('.');
    const type = (props.type ?? '').toLowerCase();
    if (!TYPES.has(type)) {
      warnings.push(`Option ${name} has unknown type '${props.type ?? ''}'`);
      continue;
    }
    const opt: CustomSandboxOption = {
      name,
      namespace: dot < 0 ? '' : name.slice(0, dot),
      key: dot < 0 ? name : name.slice(dot + 1),
      type: type as CustomOptionType,
      props,
    };
    const num = (k: string) => (props[k] !== undefined && props[k] !== '' && !Number.isNaN(Number(props[k])) ? Number(props[k]) : undefined);
    opt.min = num('min');
    opt.max = num('max');
    opt.numValues = num('numValues');
    opt.maxLength = num('maxLength');
    opt.page = props.page;
    opt.translation = props.translation;
    opt.valueTranslation = props.valueTranslation;
    opt.tooltip = props.tooltip;
    if (props.default !== undefined) {
      const d = props.default;
      if (opt.type === 'boolean') opt.default = d.toLowerCase() === 'true';
      else if (opt.type === 'integer' || opt.type === 'double' || opt.type === 'enum') {
        const n = Number(d);
        opt.default = Number.isNaN(n) ? d : n;
      } else opt.default = d;
    }
    if (opt.type === 'enum' && opt.numValues === undefined) warnings.push(`Enum ${name} has no numValues`);
    options.push(opt);
  }
  return { version: vm ? Number(vm[1]) : undefined, options, warnings };
}

function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(--|\/\/).*$/, ''))
    .join('\n');
}

function findClose(s: string, from: number): number {
  let inStr: string | null = null;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === inStr) inStr = null;
    } else if (c === '"') inStr = c;
    else if (c === '}') return i;
  }
  return -1;
}

/**
 * Split a block body into `key = value` pairs. Pairs are separated by commas or newlines.
 * A fragment without `=` is a continuation of the previous value (unquoted defaults may
 * contain commas), so it is re-joined with a comma.
 */
function parseProps(body: string): Record<string, string> {
  const props: Record<string, string> = {};
  const frags: string[] = [];
  let cur = '';
  let inStr = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"') inStr = !inStr;
    if (!inStr && (c === ',' || c === '\n')) {
      frags.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  frags.push(cur);
  let lastKey: string | null = null;
  for (const raw of frags) {
    const f = raw.trim();
    if (!f) continue;
    const eq = f.indexOf('=');
    const keyCandidate = eq > 0 ? f.slice(0, eq).trim() : '';
    if (eq > 0 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(keyCandidate)) {
      lastKey = keyCandidate;
      props[lastKey] = unquote(f.slice(eq + 1).trim());
    } else if (lastKey) {
      props[lastKey] = `${props[lastKey]},${unquote(f)}`;
    }
  }
  return props;
}

function unquote(v: string): string {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\"/g, '"');
  return v;
}
