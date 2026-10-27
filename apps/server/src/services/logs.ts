/** Browse and search Zomboid/Logs (current session + logs_* archives). */
import { createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { parseLogFileName, parseLogLine } from '@pzsm/pz-formats';
import type { LogFileEntry } from '@pzsm/shared';
import { listDirs, listFiles, safeJoin } from '../util/fs.js';
import { serverPaths } from './paths.js';

export function listLogFiles(): LogFileEntry[] {
  const root = serverPaths().logs;
  const out: LogFileEntry[] = [];
  const add = (dir: string, archive?: string) => {
    for (const f of listFiles(dir)) {
      if (!f.endsWith('.txt')) continue;
      const parsed = parseLogFileName(f);
      let size = 0;
      try {
        size = statSync(join(dir, f)).size;
      } catch {
        continue;
      }
      out.push({ path: archive ? `${archive}/${f}` : f, name: f, type: parsed?.type ?? f.replace(/\.txt$/, ''), date: parsed?.date, size, archive });
    }
  };
  add(root);
  for (const d of listDirs(root)) if (d.startsWith('logs_')) add(join(root, d), d);
  return out.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.name.localeCompare(b.name));
}

export interface LogQuery {
  path: string;
  search?: string;
  limit?: number;
  /** Return the last N matching lines (default) or the first N. */
  from?: 'end' | 'start';
}

export async function readLog(q: LogQuery): Promise<{ lines: { time?: string; text: string }[]; truncated: boolean }> {
  const file = safeJoin(serverPaths().logs, q.path);
  const limit = Math.min(q.limit ?? 1000, 20000);
  const needle = q.search?.toLowerCase();
  const lines: { time?: string; text: string }[] = [];
  let truncated = false;
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const raw of rl) {
    if (needle && !raw.toLowerCase().includes(needle)) continue;
    lines.push(parseLogLine(raw));
    if (q.from === 'start' && lines.length >= limit) {
      truncated = true;
      rl.close();
      break;
    }
    if (q.from !== 'start' && lines.length > limit) {
      lines.shift();
      truncated = true;
    }
  }
  return { lines, truncated };
}

/** Search all files of the given types (newest first) for a string. */
export async function searchLogs(types: string[], search: string, limit = 500): Promise<{ file: string; time?: string; text: string }[]> {
  const files = listLogFiles().filter((f) => !types.length || types.includes(f.type));
  const out: { file: string; time?: string; text: string }[] = [];
  for (const f of files) {
    const r = await readLog({ path: f.path, search, limit: limit - out.length, from: 'start' });
    for (const l of r.lines) out.push({ file: f.path, ...l });
    if (out.length >= limit) break;
  }
  return out;
}
