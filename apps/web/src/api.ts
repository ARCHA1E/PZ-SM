import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ConsoleLine, ServerStatus, TaskInfo, WsMessage } from '@pzsm/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const r = await fetch(path, {
    credentials: 'same-origin',
    ...rest,
    headers: { ...(json !== undefined ? { 'content-type': 'application/json' } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (r.status === 401 && !path.startsWith('/api/auth/')) {
    window.dispatchEvent(new Event('pzsm:unauthorized'));
  }
  const text = await r.text();
  const data = text ? safeJson(text) : null;
  if (!r.ok) throw new ApiError((data as { error?: string })?.error ?? r.statusText, r.status);
  return data as T;
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

export const get = <T,>(p: string) => api<T>(p);
export const post = <T,>(p: string, json?: unknown) => api<T>(p, { method: 'POST', json: json ?? {} });
export const put = <T,>(p: string, json?: unknown) => api<T>(p, { method: 'PUT', json: json ?? {} });
export const del = <T,>(p: string) => api<T>(p, { method: 'DELETE' });

// ------------------------------------------------------------------ live store (websocket)

interface LiveState {
  connected: boolean;
  status: ServerStatus | null;
  console: ConsoleLine[];
  task: TaskInfo | null;
  taskLines: string[];
}

let state: LiveState = { connected: false, status: null, console: [], task: null, taskLines: [] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let ws: WebSocket | null = null;
let retry = 0;

function setState(p: Partial<LiveState>) {
  state = { ...state, ...p };
  emit();
}

export function connectLive() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen = async () => {
    retry = 0;
    setState({ connected: true });
    try {
      const c = await get<{ lines: ConsoleLine[] }>('/api/console');
      setState({ console: c.lines });
      const t = await get<{ task: TaskInfo | null; log: string[] }>('/api/task');
      setState({ task: t.task, taskLines: t.log });
    } catch {
      /* ignore */
    }
  };
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data) as WsMessage;
    if (m.type === 'console') {
      const next = state.console.concat(m.lines);
      setState({ console: next.length > 5000 ? next.slice(-5000) : next });
    } else if (m.type === 'status') setState({ status: m.status });
    else if (m.type === 'task') {
      const lines = m.line ? state.taskLines.concat(m.line).slice(-1000) : state.taskLines;
      setState({ task: m.task, taskLines: m.task && !state.task ? (m.line ? [m.line] : []) : lines });
    }
  };
  ws.onclose = () => {
    setState({ connected: false });
    ws = null;
    retry = Math.min(retry + 1, 6);
    setTimeout(connectLive, 500 * 2 ** retry);
  };
}

export function disconnectLive() {
  ws?.close();
}

export function useLive<T>(sel: (s: LiveState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
  );
}

// ------------------------------------------------------------------ toasts

export interface Toast {
  id: number;
  kind: 'ok' | 'error' | 'info';
  text: string;
}
let toasts: Toast[] = [];
const toastListeners = new Set<() => void>();
let toastId = 1;

export function toast(text: string, kind: Toast['kind'] = 'ok') {
  const t = { id: toastId++, kind, text };
  toasts = [...toasts, t];
  toastListeners.forEach((l) => l());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, kind === 'error' ? 8000 : 4000);
}

export function toastError(e: unknown) {
  toast(e instanceof Error ? e.message : String(e), 'error');
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      toastListeners.add(cb);
      return () => toastListeners.delete(cb);
    },
    () => toasts,
  );
}

// ------------------------------------------------------------------ helpers

export function useDebounced<T>(v: T, ms = 250): T {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function usePrevious<T>(v: T): T | undefined {
  const r = useRef<T>();
  useEffect(() => {
    r.current = v;
  }, [v]);
  return r.current;
}

export function fmtBytes(n?: number): string {
  if (n === undefined || n === null) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
}

export function fmtDuration(sec?: number): string {
  if (!sec && sec !== 0) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${sec % 60}s`;
}

export function fmtDate(s?: string | number): string {
  if (!s) return '—';
  const d = new Date(typeof s === 'number' && s < 1e12 ? s * 1000 : s);
  return d.toLocaleString();
}
