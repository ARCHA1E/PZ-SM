/**
 * Supervises the Project Zomboid server JVM: launch, console capture, RCON, graceful stop,
 * crash restart. The JVM is spawned directly (same env as start-server.sh) so we own the
 * real PID and can deliver signals and stdin commands.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setIniValues, parseIni, iniToRecord, decodeText } from '@pzsm/pz-formats';
import type { ConsoleLine, ServerState, ServerStatus } from '@pzsm/shared';
import { config } from '../config.js';
import { audit, getSettings, kvGet, kvSet } from '../db.js';
import { bus } from '../util/events.js';
import { readTextFile, writeTextFileAtomic } from '../util/fs.js';
import { installPaths, serverPaths } from './paths.js';
import { RconClient } from './rcon.js';
import { currentTask } from './tasks.js';

const MAX_CONSOLE = 5000;

/** Lines that indicate the server finished loading and accepts players. */
const READY_PATTERNS = [/\*{3}\s*SERVER STARTED\s*\*{3}/i, /Server Steam ID/i, /server is listening on port/i];

class Supervisor {
  state: ServerState = 'stopped';
  private proc: ChildProcessWithoutNullStreams | null = null;
  private consoleBuf: ConsoleLine[] = [];
  private partial = '';
  private startedAt: Date | null = null;
  private stopRequested = false;
  private rcon: RconClient | null = null;
  private crashTimes: number[] = [];
  lastExitCode: number | null = null;
  pendingRestart = false;
  players: string[] = [];
  /** Run (in order) before every launch, e.g. applying queued role changes. */
  beforeStartHooks: (() => Promise<void>)[] = [];

  get pid(): number | undefined {
    return this.proc?.pid;
  }

  get running(): boolean {
    return this.state === 'running' || this.state === 'starting';
  }

  get consoleLines(): ConsoleLine[] {
    return this.consoleBuf;
  }

  installed(): boolean {
    const ip = installPaths();
    return existsSync(ip.launchJson) && (existsSync(join(ip.javaDir, 'projectzomboid.jar')) || existsSync(ip.jar));
  }

  private push(stream: ConsoleLine['stream'], text: string) {
    const line: ConsoleLine = { t: Date.now(), stream, text };
    this.consoleBuf.push(line);
    if (this.consoleBuf.length > MAX_CONSOLE) this.consoleBuf.splice(0, this.consoleBuf.length - MAX_CONSOLE);
    bus.emit('console', line);
  }

  sys(text: string) {
    this.push('sys', text);
  }

  private setState(s: ServerState) {
    this.state = s;
    bus.emit('status', this.statusSnapshot());
  }

  statusSnapshot(): ServerStatus {
    const s = getSettings();
    return {
      state: this.installed() || this.state === 'installing' ? this.state : currentTask()?.kind === 'install' ? 'installing' : 'not-installed',
      serverName: s.serverName,
      pid: this.pid,
      startedAt: this.startedAt?.toISOString(),
      uptimeSec: this.startedAt ? Math.round((Date.now() - this.startedAt.getTime()) / 1000) : undefined,
      branch: s.branch,
      installed: this.installed(),
      rconConnected: !!this.rcon?.connected,
      players: this.players.map((username) => ({ username })),
      pendingRestart: this.pendingRestart,
      pendingRoleChanges: 0,
      lastExitCode: this.lastExitCode,
      task: currentTask(),
    };
  }

  /** RCON password is generated once and enforced in the ini on every start. */
  private rconPassword(): string {
    let pw = kvGet<string>('rcon_password', '');
    if (!pw) {
      pw = randomBytes(18).toString('base64url');
      kvSet('rcon_password', pw);
    }
    return pw;
  }

  rconPort(): number {
    return kvGet<number>('rcon_port', 27015);
  }

  /** Make sure manager-owned ini keys (RCON) are in place before launching. */
  private async prepareIni(): Promise<void> {
    const sp = serverPaths();
    const f = await readTextFile(sp.ini);
    if (!f) {
      // First start: seed a minimal ini; the game fills in every other option with defaults.
      let text = `RCONPort=${this.rconPort()}\r\nRCONPassword=${this.rconPassword()}\r\n`;
      if (config.initial.gamePort) text += `DefaultPort=${config.initial.gamePort}\r\n`;
      if (config.initial.udpPort) text += `UDPPort=${config.initial.udpPort}\r\n`;
      await writeTextFileAtomic(sp.ini, { text, encoding: 'utf8' });
      return;
    }
    const vals = iniToRecord(parseIni(f.text));
    const want: Record<string, string> = { RCONPassword: this.rconPassword() };
    if (!vals.RCONPort || vals.RCONPort === '0') want.RCONPort = String(this.rconPort());
    else kvSet('rcon_port', Number(vals.RCONPort));
    const changed = Object.entries(want).filter(([k, v]) => vals[k] !== v);
    if (changed.length) await writeTextFileAtomic(sp.ini, { ...f, text: setIniValues(f.text, Object.fromEntries(changed)) });
  }

  buildLaunch(): { cmd: string; args: string[]; env: NodeJS.ProcessEnv; cwd: string } {
    const ip = installPaths();
    const s = getSettings();
    const sp = serverPaths();
    const launch = JSON.parse(readFileSync(ip.launchJson, 'utf8')) as { mainClass: string; classpath: string[]; vmArgs: string[] };
    let vmArgs = launch.vmArgs.filter((a) => !/^-Xm[xs]/.test(a));
    if (s.javaMaxMemory) vmArgs.unshift(`-Xmx${s.javaMaxMemory}`);
    if (s.javaMinMemory) vmArgs.unshift(`-Xms${s.javaMinMemory}`);
    vmArgs.push('-Drconlo=true');
    vmArgs.push(`-Ddeployment.user.cachedir=${config.cacheDir}`);
    if (s.extraJvmArgs.trim()) vmArgs = vmArgs.concat(splitArgs(s.extraJvmArgs));
    vmArgs = vmArgs.concat(kvGet<string[]>('oneshot_jvm_args', []));
    const sep = process.platform === 'win32' ? ';' : ':';
    const cp = launch.classpath.join(sep);
    const serverArgs = [`-cachedir=${config.cacheDir}`, '-servername', sp.name];
    if (s.bindIp) serverArgs.push('-ip', s.bindIp);
    let pendingAdmin = kvGet<{ username: string; password: string } | null>('pending_admin', null);
    if (!pendingAdmin && !existsSync(sp.gameDb)) {
      // A brand-new world prompts for an admin password on stdin; provide one up front.
      pendingAdmin = { username: s.adminUsername || 'admin', password: randomBytes(12).toString('base64url') };
      kvSet('ingame_admin', pendingAdmin);
      kvSet('pending_admin', pendingAdmin);
    }
    if (pendingAdmin) serverArgs.push('-adminusername', pendingAdmin.username, '-adminpassword', pendingAdmin.password);
    if (s.extraServerArgs.trim()) serverArgs.push(...splitArgs(s.extraServerArgs));
    const javaBin = join(ip.root, 'jre64', 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    const ld = [join(ip.root, 'linux64'), ip.root, join(ip.root, 'jre64', 'lib'), join(ip.root, 'jre64', 'lib', 'amd64'), process.env.LD_LIBRARY_PATH ?? ''].filter(Boolean).join(':');
    return {
      cmd: existsSync(javaBin) ? javaBin : 'java',
      args: [...vmArgs, '-cp', cp, launch.mainClass.replace(/\//g, '.'), ...serverArgs],
      env: { ...process.env, LD_LIBRARY_PATH: ld, PATH: `${join(ip.root, 'jre64', 'bin')}:${process.env.PATH ?? ''}` },
      cwd: ip.root,
    };
  }

  async start(reason = 'manual'): Promise<void> {
    if (this.proc) throw new Error('Server is already running');
    if (!this.installed()) throw new Error('Server is not installed');
    const task = currentTask();
    if (task && task.kind !== 'restart') throw new Error(`Busy: ${task.label}`);
    mkdirSync(config.cacheDir, { recursive: true });
    for (const hook of this.beforeStartHooks) {
      try {
        await hook();
      } catch (e) {
        this.sys(`Pre-start step failed: ${(e as Error).message}`);
      }
    }
    await this.prepareIni();
    const l = this.buildLaunch();
    kvSet('oneshot_jvm_args', []);
    this.stopRequested = false;
    this.players = [];
    this.pendingRestart = false;
    this.setState('starting');
    this.sys(`Starting server (${reason}): ${redact([l.cmd, ...l.args].join(' '))}`);
    audit('server.start', reason);
    if (config.dryRun) {
      this.startedAt = new Date();
      this.setState('running');
      return;
    }
    const p = spawn(l.cmd, l.args, { cwd: l.cwd, env: l.env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc = p;
    this.startedAt = new Date();
    p.stdout.on('data', (d: Buffer) => this.onOutput('out', d));
    p.stderr.on('data', (d: Buffer) => this.onOutput('err', d));
    p.on('error', (e) => this.sys(`Process error: ${e.message}`));
    p.on('exit', (code, signal) => this.onExit(code, signal));
    if (kvGet('pending_admin', null)) kvSet('pending_admin', null);
  }

  private onOutput(stream: 'out' | 'err', d: Buffer) {
    this.partial += d.toString('utf8');
    const lines = this.partial.split(/\r?\n/);
    this.partial = lines.pop() ?? '';
    for (const line of lines) {
      this.push(stream, line);
      bus.emit('serverLine', line);
      if (this.state === 'starting' && READY_PATTERNS.some((r) => r.test(line))) {
        this.setState('running');
        bus.emit('serverStarted');
      }
      if (/RCON: listening on port/.test(line)) void this.connectRcon();
    }
  }

  private async onExit(code: number | null, signal: NodeJS.Signals | null) {
    this.proc = null;
    this.lastExitCode = code;
    this.rcon?.close();
    this.rcon = null;
    this.players = [];
    this.startedAt = null;
    const expected = this.stopRequested;
    this.sys(`Server exited (code ${code ?? 'null'}${signal ? `, signal ${signal}` : ''})`);
    bus.emit('serverStopped', code);
    if (!expected) {
      this.setState('crashed');
      audit('server.crash', { code, signal });
      const s = getSettings();
      const now = Date.now();
      this.crashTimes = this.crashTimes.filter((t) => now - t < 10 * 60_000);
      this.crashTimes.push(now);
      if (s.restartOnCrash && this.crashTimes.length <= 3) {
        this.sys('Restarting after crash in 10s…');
        setTimeout(() => {
          if (this.state === 'crashed') void this.start('crash-recovery').catch((e) => this.sys(`Restart failed: ${(e as Error).message}`));
        }, 10_000);
      } else if (s.restartOnCrash) {
        this.sys('Crashed 3 times within 10 minutes; not restarting automatically.');
      }
    } else {
      this.setState('stopped');
    }
  }

  async connectRcon(): Promise<RconClient | null> {
    if (this.rcon?.connected) return this.rcon;
    const sp = serverPaths();
    const f = await readTextFile(sp.ini);
    if (!f) return null;
    const vals = iniToRecord(parseIni(f.text));
    if (!vals.RCONPassword) return null;
    const client = new RconClient('127.0.0.1', Number(vals.RCONPort || 27015), vals.RCONPassword);
    try {
      await client.connect();
      this.rcon = client;
      bus.emit('status', this.statusSnapshot());
      return client;
    } catch (e) {
      this.sys(`RCON unavailable: ${(e as Error).message}`);
      return null;
    }
  }

  /** Run a console command: RCON when available, otherwise stdin (no response). */
  async command(cmd: string, opts: { quiet?: boolean } = {}): Promise<string> {
    if (!this.proc && !config.dryRun) throw new Error('Server is not running');
    if (!opts.quiet) this.sys(`> ${cmd}`);
    const r = await this.connectRcon();
    if (r) {
      try {
        const out = await r.exec(cmd);
        if (!opts.quiet && out.trim()) for (const l of out.split(/\r?\n/)) this.push('out', l);
        return out;
      } catch (e) {
        this.sys(`RCON error (${(e as Error).message}); falling back to console input`);
      }
    }
    if (config.dryRun) return '';
    this.proc!.stdin.write(cmd + '\n');
    return '';
  }

  async refreshPlayers(): Promise<string[]> {
    if (this.state !== 'running') return (this.players = []);
    const out = await this.command('players', { quiet: true }).catch(() => '');
    // "Players connected (2):\n-Alice\n-Bob"
    const names = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('-'))
      .map((l) => l.slice(1).trim());
    if (/Players connected/i.test(out)) this.players = names;
    return this.players;
  }

  /** Graceful stop: optional warnings, save, quit, then signals as a last resort. */
  async stop(opts: { reason?: string; timeoutMs?: number } = {}): Promise<void> {
    if (!this.proc) {
      if (config.dryRun && this.state === 'running') {
        this.setState('stopped');
        this.startedAt = null;
      }
      return;
    }
    this.stopRequested = true;
    this.setState('stopping');
    audit('server.stop', opts.reason ?? 'manual');
    const p = this.proc;
    const exited = new Promise<void>((resolve) => p.once('exit', () => resolve()));
    try {
      await this.command('save', { quiet: true });
    } catch {
      /* ignore */
    }
    try {
      await this.command('quit');
    } catch {
      p.stdin.write('quit\n');
    }
    const timeout = opts.timeoutMs ?? 120_000;
    const timer = (ms: number) => new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), ms));
    if ((await Promise.race([exited.then(() => 'ok' as const), timer(timeout)])) === 'timeout') {
      this.sys('Server did not exit in time; sending SIGTERM');
      p.kill('SIGTERM');
      if ((await Promise.race([exited.then(() => 'ok' as const), timer(30_000)])) === 'timeout') {
        this.sys('Sending SIGKILL');
        p.kill('SIGKILL');
        await exited;
      }
    }
  }

  async restart(reason = 'manual'): Promise<void> {
    await this.stop({ reason });
    await this.start(reason);
  }

  /** Broadcast countdown messages, then restart. */
  async restartWithWarnings(reason: string, minutes?: number[]): Promise<void> {
    const s = getSettings();
    const marks = [...(minutes ?? s.restartWarningMinutes)].filter((m) => m > 0).sort((a, b) => b - a);
    if (this.state === 'running' && marks.length) {
      for (let i = 0; i < marks.length; i++) {
        const msg = s.restartWarningMessage.replace('{minutes}', String(marks[i])).replace('{reason}', reason);
        await this.command(`servermsg "${msg.replace(/"/g, "'")}"`).catch(() => undefined);
        const wait = (marks[i] - (marks[i + 1] ?? 0)) * 60_000;
        await new Promise((r) => setTimeout(r, wait));
        if (this.state !== 'running') return;
      }
    }
    await this.restart(reason);
  }
}

function splitArgs(s: string): string[] {
  return [...s.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]);
}

function redact(s: string): string {
  return s.replace(/(-adminpassword\s+)\S+/, '$1******');
}

export const supervisor = new Supervisor();

/** Read the game version string the server last reported (cachedir/version.txt if present). */
export function readRuntimeVersion(): string | undefined {
  for (const p of [join(config.cacheDir, 'version.txt')]) {
    try {
      return decodeText(readFileSync(p)).text.split(/\s+/)[0];
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
