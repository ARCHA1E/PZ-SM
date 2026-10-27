/** Project Zomboid log files (Zomboid/Logs). */

export interface LogFileName {
  /** ISO-ish date string `YYYY-MM-DDTHH:MM[:SS]` when parseable. */
  date?: string;
  type: string;
}

/**
 * `2026-10-26_23-05_DebugLog-server.txt` (B42) or `26-10-26_23-05-21_user.txt` (older,
 * DD-MM-YY_HH-MM-SS).
 */
export function parseLogFileName(name: string): LogFileName | null {
  const base = name.replace(/\.txt$/i, '');
  let m = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})(?:-(\d{2}))?_(.+)$/.exec(base);
  if (m) return { date: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}${m[6] ? ':' + m[6] : ''}`, type: m[7] };
  m = /^(\d{2})-(\d{2})-(\d{2})_(\d{2})-(\d{2})(?:-(\d{2}))?_(.+)$/.exec(base);
  if (m) return { date: `20${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}${m[6] ? ':' + m[6] : ''}`, type: m[7] };
  return null;
}

export interface LogLine {
  /** ISO timestamp (local time, no zone) */
  time?: string;
  text: string;
}

const TS = /^\[(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s?/;

/** Lines start with `[DD-MM-YY HH:MM:SS.mmm]`. */
export function parseLogLine(line: string): LogLine {
  const m = TS.exec(line);
  if (!m) return { text: line };
  return {
    time: `20${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? '.' + m[7].padEnd(3, '0') : ''}`,
    text: line.slice(m[0].length),
  };
}

export interface UserLogEvent {
  steamId?: string;
  username: string;
  action: 'attempting' | 'allowed' | 'disconnected' | 'other';
  detail: string;
}

/** `76561198205571344 "Archaie" attempting to join.` */
export function parseUserLog(text: string): UserLogEvent | null {
  const m = /^(?:(\d{5,20})\s+)?"([^"]*)"\s+(.*)$/.exec(text.trim());
  if (!m) return null;
  const d = m[3];
  const action = d.startsWith('attempting') ? 'attempting' : d.startsWith('allowed') ? 'allowed' : d.startsWith('disconnected') ? 'disconnected' : 'other';
  return { steamId: m[1], username: m[2], action, detail: d };
}

/** `[info] Got message:ChatMessage{chat=Local, author='Archaie', text='HEY YOU!'}.` */
export function parseChatLog(text: string): { chat: string; author: string; message: string } | null {
  const m = /ChatMessage\{chat=([^,]*), author='((?:[^']|'(?!,\s*text=))*)', text='([\s\S]*)'\}\.?\s*$/.exec(text);
  if (!m) return null;
  return { chat: m[1], author: m[2], message: m[3] };
}

/** Parse `key="value"` attribute lists (connections log). */
export function parseAttributes(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of text.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}
