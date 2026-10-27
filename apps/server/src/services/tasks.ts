import { randomUUID } from 'node:crypto';
import type { TaskInfo } from '@pzsm/shared';
import { bus } from '../util/events.js';

/**
 * One long-running maintenance task at a time (install, update, workshop download, backup
 * restore...). Progress and output lines are broadcast to the panel.
 */
let current: TaskInfo | null = null;
const history: string[] = [];

export function currentTask(): TaskInfo | null {
  return current;
}

export function taskLog(): string[] {
  return history.slice(-500);
}

export class TaskBusyError extends Error {
  constructor(public readonly task: TaskInfo) {
    super(`Another task is running: ${task.label}`);
  }
}

export interface TaskContext {
  progress(p: number | undefined, message?: string): void;
  log(line: string): void;
}

export async function runTask<T>(kind: string, label: string, fn: (ctx: TaskContext) => Promise<T>): Promise<T> {
  if (current) throw new TaskBusyError(current);
  current = { id: randomUUID(), kind, label, startedAt: new Date().toISOString() };
  history.length = 0;
  bus.emit('task', current, `▶ ${label}`);
  const ctx: TaskContext = {
    progress(p, message) {
      if (!current) return;
      current = { ...current, progress: p, message: message ?? current.message };
      bus.emit('task', current, undefined);
    },
    log(line) {
      history.push(line);
      if (history.length > 2000) history.splice(0, history.length - 2000);
      bus.emit('task', current, line);
    },
  };
  try {
    const r = await fn(ctx);
    bus.emit('task', null, `✔ ${label} finished`);
    return r;
  } catch (e) {
    bus.emit('task', null, `✖ ${label} failed: ${(e as Error).message}`);
    throw e;
  } finally {
    current = null;
  }
}
