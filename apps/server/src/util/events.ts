import { EventEmitter } from 'node:events';
import type { ConsoleLine, ServerStatus, TaskInfo } from '@pzsm/shared';

interface BusEvents {
  console: [ConsoleLine];
  status: [ServerStatus];
  task: [TaskInfo | null, string | undefined];
  /** Raw server stdout line (for log watchers). */
  serverLine: [string];
  serverStarted: [];
  serverStopped: [number | null];
}

class Bus extends EventEmitter {
  override emit<K extends keyof BusEvents>(event: K, ...args: BusEvents[K]): boolean {
    return super.emit(event, ...args);
  }
  override on<K extends keyof BusEvents>(event: K, listener: (...args: BusEvents[K]) => void): this {
    return super.on(event, listener as (...a: unknown[]) => void);
  }
  override off<K extends keyof BusEvents>(event: K, listener: (...args: BusEvents[K]) => void): this {
    return super.off(event, listener as (...a: unknown[]) => void);
  }
}

export const bus = new Bus();
bus.setMaxListeners(100);
