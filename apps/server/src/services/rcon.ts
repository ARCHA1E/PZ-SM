/**
 * Source RCON client (Project Zomboid's zombie.network.RCONServer).
 *
 * Commands are serialized over one persistent connection. PZ returns each response as one
 * or more SERVERDATA_RESPONSE_VALUE packets carrying the request id; some commands answer
 * nothing at all, so a response completes after a short quiet period or a timeout.
 */
import { Socket } from 'node:net';

const SERVERDATA_AUTH = 3;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_EXECCOMMAND = 2;

interface Pending {
  id: number;
  chunks: string[];
  resolve: (s: string) => void;
  reject: (e: Error) => void;
  timer?: NodeJS.Timeout;
  quiet?: NodeJS.Timeout;
}

export class RconClient {
  private socket: Socket | null = null;
  private buf = Buffer.alloc(0);
  private nextId = 1;
  private pending: Pending | null = null;
  private queue: (() => void)[] = [];
  private authed = false;
  private connecting: Promise<void> | null = null;

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly password: string,
    private readonly timeoutMs = 8000,
  ) {}

  get connected(): boolean {
    return this.authed && !!this.socket && !this.socket.destroyed;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    if (this.connecting) return this.connecting;
    this.connecting = new Promise<void>((resolve, reject) => {
      const s = new Socket();
      this.socket = s;
      this.buf = Buffer.alloc(0);
      this.authed = false;
      const fail = (e: Error) => {
        cleanup();
        s.destroy();
        reject(e);
      };
      const timer = setTimeout(() => fail(new Error('RCON connect timeout')), this.timeoutMs);
      const cleanup = () => clearTimeout(timer);
      s.once('error', fail);
      s.on('data', (d) => this.onData(d));
      s.on('close', () => this.onClose());
      s.connect(this.port, this.host, () => {
        const id = this.nextId++;
        this.authWaiter = (ok) => {
          cleanup();
          s.off('error', fail);
          s.on('error', () => undefined);
          if (ok) {
            this.authed = true;
            resolve();
          } else fail(new Error('RCON authentication failed'));
        };
        this.authId = id;
        s.write(encode(id, SERVERDATA_AUTH, this.password));
      });
    }).finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private authWaiter: ((ok: boolean) => void) | null = null;
  private authId = -1;

  private onData(d: Buffer) {
    this.buf = Buffer.concat([this.buf, d]);
    while (this.buf.length >= 4) {
      const size = this.buf.readInt32LE(0);
      if (size < 10 || size > 1024 * 1024) {
        this.socket?.destroy();
        return;
      }
      if (this.buf.length < size + 4) return;
      const id = this.buf.readInt32LE(4);
      const type = this.buf.readInt32LE(8);
      const body = this.buf.subarray(12, 4 + size - 2).toString('utf8');
      this.buf = this.buf.subarray(size + 4);
      this.onPacket(id, type, body);
    }
  }

  private onPacket(id: number, type: number, body: string) {
    if (this.authWaiter) {
      if (type === SERVERDATA_AUTH_RESPONSE) {
        const w = this.authWaiter;
        this.authWaiter = null;
        w(id === this.authId);
      }
      return;
    }
    const p = this.pending;
    if (!p || id !== p.id) return;
    p.chunks.push(body);
    if (p.quiet) clearTimeout(p.quiet);
    p.quiet = setTimeout(() => this.finish(p, null), 150);
  }

  private onClose() {
    this.authed = false;
    this.socket = null;
    if (this.authWaiter) {
      const w = this.authWaiter;
      this.authWaiter = null;
      w(false);
    }
    if (this.pending) this.finish(this.pending, new Error('RCON connection closed'));
  }

  private finish(p: Pending, err: Error | null) {
    if (this.pending !== p) return;
    clearTimeout(p.timer);
    clearTimeout(p.quiet);
    this.pending = null;
    if (err && !p.chunks.length) p.reject(err);
    else p.resolve(p.chunks.join(''));
    const next = this.queue.shift();
    if (next) next();
  }

  /** Execute a console command; resolves with the response text ('' if none). */
  async exec(command: string): Promise<string> {
    await this.connect();
    return new Promise<string>((resolve, reject) => {
      const run = () => {
        if (!this.connected) {
          reject(new Error('RCON not connected'));
          const next = this.queue.shift();
          if (next) next();
          return;
        }
        const id = this.nextId++;
        const p: Pending = { id, chunks: [], resolve, reject };
        this.pending = p;
        p.timer = setTimeout(() => this.finish(p, null), this.timeoutMs);
        this.socket!.write(encode(id, SERVERDATA_EXECCOMMAND, command));
      };
      if (this.pending) this.queue.push(run);
      else run();
    });
  }

  close(): void {
    this.socket?.destroy();
    this.socket = null;
    this.authed = false;
  }
}

function encode(id: number, type: number, body: string): Buffer {
  const b = Buffer.from(body, 'utf8');
  const out = Buffer.alloc(14 + b.length);
  out.writeInt32LE(10 + b.length, 0);
  out.writeInt32LE(id, 4);
  out.writeInt32LE(type, 8);
  b.copy(out, 12);
  return out;
}

/** Quote an argument for PZ's command parser. */
export function q(arg: string | number): string {
  const s = String(arg);
  return /^[^\s"]+$/.test(s) ? s : `"${s.replace(/"/g, "'")}"`;
}
