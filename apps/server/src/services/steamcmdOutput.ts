/**
 * Incremental parser for SteamCMD Workshop output. SteamCMD often prints several results
 * on one line with no newline between them ("...failed (No Connection).Downloading item 123 ..."),
 * so this scans the accumulated text rather than individual lines. Every pattern ends in a
 * fixed literal, so a match is never taken from a partially received message.
 */

export type WorkshopEvent =
  | { type: 'start'; id: string }
  | { type: 'success'; id: string; bytes: number }
  | { type: 'failure'; id: string; reason: string }
  | { type: 'login-failed'; reason: string };

const PATTERNS: { re: RegExp; make: (m: RegExpExecArray) => WorkshopEvent }[] = [
  { re: /Downloading item (\d+) \.\.\./g, make: (m) => ({ type: 'start', id: m[1] }) },
  { re: /Success\. Downloaded item (\d+) to "[^"]*" \((\d+) bytes\)/g, make: (m) => ({ type: 'success', id: m[1], bytes: Number(m[2]) }) },
  { re: /ERROR! Download item (\d+) failed \(([^)]*)\)/g, make: (m) => ({ type: 'failure', id: m[1], reason: m[2] }) },
  {
    re: /(?:Connecting anonymously to Steam Public|Logging in user [^.\n]*|Waiting for client config|Waiting for user info)\.\.\.FAILED(?: \(([^)]*)\))?/g,
    make: (m) => ({ type: 'login-failed', reason: m[1] ?? 'login failed' }),
  },
];

/** Failures caused by the connection/session rather than the item itself. */
export function isConnectionFailure(reason: string): boolean {
  return /no connection|timeout|connection|network|service unavailable|rate limit|busy|try again|login failed/i.test(reason);
}

/** Failures that will not succeed on retry (removed/private items). */
export function isPermanentFailure(reason: string): boolean {
  return !isConnectionFailure(reason) && /file not found|access denied|not found|no subscription|invalid/i.test(reason);
}

export class SteamcmdWorkshopParser {
  private buf = '';
  private scanned = 0;

  /** Feed raw output; returns newly completed events in output order. */
  feed(chunk: string): WorkshopEvent[] {
    this.buf += chunk.replace(/\u001b\[[0-9;]*m/g, '');
    const found: { at: number; end: number; ev: WorkshopEvent }[] = [];
    for (const p of PATTERNS) {
      p.re.lastIndex = this.scanned;
      let m: RegExpExecArray | null;
      while ((m = p.re.exec(this.buf))) found.push({ at: m.index, end: m.index + m[0].length, ev: p.make(m) });
    }
    found.sort((a, b) => a.at - b.at);
    if (found.length) this.scanned = Math.max(...found.map((f) => f.end));
    if (this.scanned > 65536) {
      this.buf = this.buf.slice(this.scanned);
      this.scanned = 0;
    }
    return found.map((f) => f.ev);
  }
}
