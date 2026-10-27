/**
 * Translation files: B42 JSON (`Translate/EN/Sandbox.json`) and legacy Lua-style
 * `Sandbox_EN.txt` (`Sandbox_EN = { Key = "Value", }`).
 */

export type TranslationTable = Record<string, string>;

export function parseTranslationJson(text: string): TranslationTable {
  const clean = text.replace(/^﻿/, '');
  try {
    return flatten(JSON.parse(clean));
  } catch {
    // Mods sometimes ship trailing commas or // comments.
    const relaxed = clean
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/,(\s*[}\]])/g, '$1');
    try {
      return flatten(JSON.parse(relaxed));
    } catch {
      return {};
    }
  }
}

function flatten(o: unknown): TranslationTable {
  const out: TranslationTable = {};
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
  }
  return out;
}

const TXT_LINE = /^\s*([A-Za-z0-9_.\-]+)\s*=\s*"((?:[^"\\]|\\.)*)"/;

export function parseTranslationTxt(text: string): TranslationTable {
  const out: TranslationTable = {};
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = TXT_LINE.exec(line);
    if (!m) continue;
    // `Sandbox_EN = {` header lines have no quoted value and are skipped by the regex.
    let v = m[2].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    // Concatenations ("a" .. "b") on one line.
    const rest = line.slice(m[0].length);
    const more = rest.matchAll(/\.\.\s*"((?:[^"\\]|\\.)*)"/g);
    for (const x of more) v += x[1].replace(/\\"/g, '"');
    out[m[1]] = v;
  }
  return out;
}

export function parseTranslation(fileName: string, text: string): TranslationTable {
  return fileName.toLowerCase().endsWith('.json') ? parseTranslationJson(text) : parseTranslationTxt(text);
}
