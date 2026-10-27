/** Read/write the managed server's config files with snapshots and audit. */
import { parseIni, parseSandboxVars, setIniValues, setSandboxValues, iniToRecord, type IniDocument, type SandboxChange, type SandboxDocument } from '@pzsm/pz-formats';
import { audit } from '../db.js';
import { bus } from '../util/events.js';
import { readTextFile, writeTextFileAtomic } from '../util/fs.js';
import { serverPaths } from './paths.js';
import { supervisor } from './supervisor.js';

export async function readIni(): Promise<{ doc: IniDocument; values: Record<string, string>; encoding: 'utf8' | 'latin1'; bom: boolean } | null> {
  const f = await readTextFile(serverPaths().ini);
  if (!f) return null;
  const doc = parseIni(f.text);
  return { doc, values: iniToRecord(doc), encoding: f.encoding, bom: f.bom };
}

async function writeIniFile(changes: Record<string, string>, comments?: Record<string, string[]>): Promise<void> {
  const p = serverPaths().ini;
  const f = (await readTextFile(p)) ?? { text: '', encoding: 'utf8' as const, bom: false };
  await writeTextFileAtomic(p, { ...f, text: setIniValues(f.text, changes, { comments }) });
}

function waitForRunning(timeoutMs: number): Promise<boolean> {
  if (supervisor.state === 'running') return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(t);
      bus.off('status', onStatus);
      resolve(ok);
    };
    const onStatus = () => {
      if (supervisor.state === 'running') done(true);
      else if (supervisor.state !== 'starting') done(false);
    };
    const t = setTimeout(() => done(supervisor.state === 'running'), timeoutMs);
    bus.on('status', onStatus);
  });
}

/**
 * Write ini values. A running server keeps every option in memory and rewrites the ini
 * from memory (on startup, on changeoption, on reloadoptions), so while it runs each
 * change is also pushed into it with `changeoption`; otherwise the file is edited directly.
 * Returns the keys that the running server accepted.
 */
export async function writeIniValues(changes: Record<string, string>, comments?: Record<string, string[]>): Promise<{ live: string[] }> {
  const keys = Object.keys(changes);
  if (!keys.length) return { live: [] };
  audit('ini.write', keys.map((k) => (/password|token|webhook/i.test(k) ? `${k}=***` : `${k}=${changes[k]}`)).join(', '));
  if (supervisor.state === 'starting') await waitForRunning(10 * 60_000);
  if (supervisor.state !== 'running') {
    await writeIniFile(changes, comments);
    return { live: [] };
  }
  const live: string[] = [];
  for (const [k, v] of Object.entries(changes)) {
    try {
      await supervisor.command(`changeoption ${k} "${v.replace(/"/g, "'")}"`, { quiet: true });
      live.push(k);
    } catch {
      /* fall back to the file below */
    }
  }
  // Persist anything the server did not write back (unknown keys, refused values).
  const after = await readIni();
  const missing = Object.fromEntries(Object.entries(changes).filter(([k, v]) => after?.values[k] !== v));
  if (Object.keys(missing).length) await writeIniFile(missing, comments);
  return { live };
}

export async function readSandbox(): Promise<SandboxDocument | null> {
  const f = await readTextFile(serverPaths().sandbox);
  if (!f) return null;
  return parseSandboxVars(f.text);
}

export async function writeSandboxValues(changes: Record<string, SandboxChange>): Promise<void> {
  if (!Object.keys(changes).length) return;
  const p = serverPaths().sandbox;
  const f = (await readTextFile(p)) ?? { text: 'SandboxVars = {\r\n    VERSION = 6,\r\n}\r\n', encoding: 'utf8' as const, bom: false };
  await writeTextFileAtomic(p, { ...f, text: setSandboxValues(f.text, changes) });
  audit('sandbox.write', Object.entries(changes).map(([k, v]) => `${k}=${String(v.value)}`).join(', '));
}

/** Replace the whole SandboxVars file (preset import). */
export async function replaceSandboxText(text: string): Promise<void> {
  const p = serverPaths().sandbox;
  await writeTextFileAtomic(p, { text, encoding: 'utf8' });
  audit('sandbox.replace', `${text.length} bytes`);
}
