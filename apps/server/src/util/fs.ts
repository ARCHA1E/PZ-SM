import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { decodeText, encodeText, type DecodedText } from '@pzsm/pz-formats';

export async function readTextFile(p: string): Promise<DecodedText | null> {
  try {
    return decodeText(await readFile(p));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

/** Atomic write (temp file + rename), keeping a `.pzsm.bak` copy of the previous version. */
export async function writeTextFileAtomic(p: string, d: Pick<DecodedText, 'text' | 'encoding'> & { bom?: boolean }): Promise<void> {
  mkdirSync(dirname(p), { recursive: true });
  if (existsSync(p)) await copyFile(p, `${p}.pzsm.bak`);
  const tmp = `${p}.pzsm.tmp`;
  await writeFile(tmp, encodeText(d));
  await rename(tmp, p);
}

export function listDirs(p: string): string[] {
  try {
    return readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

export function listFiles(p: string): string[] {
  try {
    return readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

export function fileSize(p: string): number {
  try {
    return statSync(p).size;
  } catch {
    return 0;
  }
}

export function mtimeMs(p: string): number {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

export function dirSize(p: string): number {
  let total = 0;
  const walk = (d: string) => {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) total += fileSize(full);
    }
  };
  walk(p);
  return total;
}

/** Ensure a path stays inside `root` (guards user-supplied relative paths). */
export function safeJoin(root: string, rel: string): string {
  const full = join(root, rel);
  const norm = (s: string) => s.replace(/\\/g, '/').replace(/\/+$/, '');
  if (!norm(full).startsWith(norm(root) + '/') && norm(full) !== norm(root)) throw new Error('Path escapes root');
  return full;
}
