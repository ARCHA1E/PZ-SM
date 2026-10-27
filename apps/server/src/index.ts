import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ZodError } from 'zod';
import type { TaskInfo, WsMessage } from '@pzsm/shared';
import { config } from './config.js';
import { audit, getSettings } from './db.js';
import {
  bootstrapPassword,
  createSession,
  destroySession,
  isPasswordSet,
  loginAllowed,
  recordLoginFailure,
  requestToken,
  sessionCookie,
  setPassword,
  validSession,
} from './auth.js';
import { apiRoutes } from './routes/api.js';
import { fullStatus } from './status.js';
import { bus } from './util/events.js';
import { getManifest } from './services/buildAnalyzer.js';
import { startMetrics } from './services/metrics.js';
import { applyPendingOps } from './services/permissions.js';
import { reloadSchedules, seedSchedules } from './services/scheduler.js';
import { supervisor } from './services/supervisor.js';
import { afterModsChanged, installOrUpdate, resumeWorkshopDownload } from './services/operations.js';
import { workshopJobStatus } from './services/workshopDownloader.js';
import { TaskBusyError } from './services/tasks.js';

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  trustProxy: config.trustProxy,
  bodyLimit: 10 * 1024 * 1024,
  disableRequestLogging: true,
});

await app.register(cookie);
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 * 1024 } });
await app.register(websocket);

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) return reply.code(400).send({ error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
  if (err instanceof TaskBusyError) return reply.code(409).send({ error: err.message });
  const code = (err as { statusCode?: number }).statusCode ?? 400;
  if (code >= 500) app.log.error(err);
  return reply.code(code).send({ error: (err as Error).message });
});

// ------------------------------------------------------------------ auth
const PUBLIC = new Set(['/api/auth/login', '/api/auth/state', '/api/auth/setup', '/healthz']);
app.addHook('onRequest', async (req, reply) => {
  const url = req.url.split('?')[0];
  if (!url.startsWith('/api/') && url !== '/ws') return;
  if (PUBLIC.has(url)) return;
  if (!validSession(requestToken(req))) return reply.code(401).send({ error: 'Not logged in' });
});

app.get('/healthz', async () => ({ ok: true, state: supervisor.state }));
app.get('/api/auth/state', async (req) => ({ setup: !isPasswordSet(), loggedIn: validSession(requestToken(req)) }));
app.post('/api/auth/setup', async (req, reply) => {
  if (isPasswordSet()) return reply.code(409).send({ error: 'Already set up' });
  const { password } = (req.body ?? {}) as { password?: string };
  setPassword(String(password ?? ''));
  audit('auth.setup');
  sessionCookie(reply, createSession());
  return { ok: true };
});
app.post('/api/auth/login', async (req, reply) => {
  const ip = req.ip;
  if (!loginAllowed(ip)) return reply.code(429).send({ error: 'Too many attempts; try again later' });
  const { password } = (req.body ?? {}) as { password?: string };
  const { verifyPassword } = await import('./auth.js');
  if (!password || !verifyPassword(password)) {
    recordLoginFailure(ip);
    audit('auth.fail', ip);
    return reply.code(401).send({ error: 'Wrong password' });
  }
  sessionCookie(reply, createSession());
  audit('auth.login', ip);
  return { ok: true };
});
app.post('/api/auth/logout', async (req, reply) => {
  destroySession(requestToken(req));
  sessionCookie(reply, null);
  return { ok: true };
});

// ------------------------------------------------------------------ websocket (console, status, tasks)
app.register(async (f) => {
  f.get('/ws', { websocket: true }, (socket) => {
    const send = (m: WsMessage) => {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(m));
    };
    let pending: WsMessage & { type: 'console' } = { type: 'console', lines: [] };
    let flush: NodeJS.Timeout | null = null;
    const onConsole = (l: (typeof pending.lines)[number]) => {
      pending.lines.push(l);
      flush ??= setTimeout(() => {
        send(pending);
        pending = { type: 'console', lines: [] };
        flush = null;
      }, 100);
    };
    let statusTimer: NodeJS.Timeout | null = null;
    const onStatus = () => {
      statusTimer ??= setTimeout(async () => {
        statusTimer = null;
        send({ type: 'status', status: await fullStatus() });
      }, 200);
    };
    const onTask = (task: TaskInfo | null, line?: string) => send({ type: 'task', task, line });
    bus.on('console', onConsole);
    bus.on('status', onStatus);
    bus.on('task', onTask);
    onStatus();
    socket.on('close', () => {
      bus.off('console', onConsole);
      bus.off('status', onStatus);
      bus.off('task', onTask);
    });
  });
});

await app.register(apiRoutes);

// ------------------------------------------------------------------ web panel
if (existsSync(join(config.webDir, 'index.html'))) {
  await app.register(fastifyStatic, { root: config.webDir, wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
    return reply.sendFile('index.html');
  });
} else {
  app.log.warn(`Web panel not found at ${config.webDir}; API only`);
}

// ------------------------------------------------------------------ boot
bootstrapPassword();
supervisor.beforeStartHooks.push(applyPendingOps);
seedSchedules();
reloadSchedules();
startMetrics();
bus.on('task', () => bus.emit('status', supervisor.statusSnapshot()));

async function boot() {
  const s = getSettings();
  if (!supervisor.installed()) {
    supervisor.sys('Game server not installed yet. Use "Install" in the panel.');
    if (process.env.PZSM_AUTO_INSTALL === '1') await installOrUpdate().catch((e) => supervisor.sys(`Install failed: ${(e as Error).message}`));
  } else {
    await getManifest().catch((e) => supervisor.sys(`Build analysis failed: ${(e as Error).message}`));
    if (s.updateOnStart) await installOrUpdate().catch((e) => supervisor.sys(`Update failed: ${(e as Error).message}`));
  }
  // A Workshop download was interrupted (e.g. the container restarted): finish it first.
  const job = workshopJobStatus();
  if (job) {
    supervisor.sys(`Resuming interrupted Workshop download (${job.done}/${job.total} done)`);
    await resumeWorkshopDownload()
      .then(() => afterModsChanged())
      .catch((e) => supervisor.sys(`Workshop resume failed: ${(e as Error).message}`));
  }
  if (supervisor.installed() && s.autoStart && supervisor.state === 'stopped') {
    await supervisor.start('autostart').catch((e) => supervisor.sys(`Autostart failed: ${(e as Error).message}`));
  }
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info(`${signal} received; stopping game server`);
  try {
    await supervisor.stop({ reason: `manager ${signal}`, timeoutMs: 90_000 });
  } finally {
    await app.close();
    process.exit(0);
  }
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ host: config.host, port: config.port });
void boot();
