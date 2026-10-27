import { useQuery } from '@tanstack/react-query';
import type { MetricPoint } from '@pzsm/shared';
import { AlertTriangle, Download, Play, RotateCcw, Save, Square, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtBytes, fmtDuration, get, post, toast, useLive } from '../api';
import { StateBadge } from '../components/StateBadge';
import { ActionButton, Badge, Card, Notice, PageHeader } from '../components/ui';

export default function Dashboard() {
  const status = useLive((s) => s.status);
  const task = useLive((s) => s.task);
  const metrics = useQuery({ queryKey: ['metrics'], queryFn: () => get<{ points: MetricPoint[] }>('/api/metrics?hours=24'), refetchInterval: 60_000 });
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!status) return null;
  const uptime = status.startedAt ? Math.max(0, Math.round((now - new Date(status.startedAt).getTime()) / 1000)) : undefined;
  const running = status.state === 'running';
  const busy = !!task;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle={`Server "${status.serverName}" · branch ${status.branch}${status.buildId ? ` · build ${status.buildId}` : ''}`}
        actions={
          <>
            {!status.installed ? (
              <ActionButton variant="primary" disabled={busy} onAction={() => post('/api/server/install')}>
                <Download className="h-4 w-4" /> Install server
              </ActionButton>
            ) : status.state === 'stopped' || status.state === 'crashed' ? (
              <ActionButton variant="primary" disabled={busy} onAction={() => post('/api/server/start')}>
                <Play className="h-4 w-4" /> Start
              </ActionButton>
            ) : (
              <>
                <ActionButton disabled={!running} onAction={() => post('/api/server/restart', { warn: true }).then(() => toast('Restart scheduled with in-game warnings'))}>
                  <RotateCcw className="h-4 w-4" /> Restart (warn)
                </ActionButton>
                <ActionButton disabled={!running} onAction={() => post('/api/server/restart')} confirm="Restart now without warning players?">
                  <Zap className="h-4 w-4" /> Restart now
                </ActionButton>
                <ActionButton variant="danger" onAction={() => post('/api/server/stop')} confirm="Stop the server? Players will be disconnected.">
                  <Square className="h-4 w-4" /> Stop
                </ActionButton>
              </>
            )}
          </>
        }
      />

      {status.pendingRestart && <Notice>Some changes need a server restart to take effect.</Notice>}
      {status.pendingRoleChanges > 0 && (
        <Notice tone="accent">
          {status.pendingRoleChanges} permission change(s) are queued and will be applied on the next start. <Link className="underline" to="/permissions">Review</Link>
        </Notice>
      )}
      {status.updateAvailable && (
        <Notice tone="accent">
          A game server update is available.{' '}
          <button className="underline" onClick={() => post('/api/server/install')}>
            Update now
          </button>
        </Notice>
      )}
      {!!status.modUpdatesAvailable && (
        <Notice tone="accent">
          {status.modUpdatesAvailable} Workshop item(s) have updates. <Link className="underline" to="/mods">Open mods</Link>
        </Notice>
      )}
      {status.state === 'crashed' && (
        <Notice tone="bad">
          <AlertTriangle className="mr-1 inline h-4 w-4" />
          The server exited unexpectedly (code {String(status.lastExitCode)}). Check the <Link className="underline" to="/console">console</Link>.
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="State" value={<StateBadge state={status.state} />} sub={status.pid ? `PID ${status.pid}` : undefined} />
        <Stat label="Players online" value={status.players.length} sub={status.players.map((p) => p.username).join(', ') || '—'} />
        <Stat label="Uptime" value={fmtDuration(uptime)} sub={status.rconConnected ? 'RCON connected' : 'RCON offline'} />
        <Stat label="CPU / Memory" value={status.cpu !== undefined ? `${status.cpu.toFixed(0)}%` : '—'} sub={fmtBytes(status.memRss)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Last 24 hours" className="lg:col-span-2">
          <Charts points={metrics.data?.points ?? []} />
        </Card>
        <Card title="Quick actions">
          <div className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!msg.trim()) return;
                await post('/api/server/message', { message: msg }).then(() => toast('Message sent'), (er) => toast(er.message, 'error'));
                setMsg('');
              }}
            >
              <input className="input" placeholder="Broadcast message to players" value={msg} onChange={(e) => setMsg(e.target.value)} disabled={!running} />
              <button className="btn" disabled={!running}>
                Send
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={!running} onAction={() => post('/api/server/save').then(() => toast('World saved'))}>
                <Save className="h-4 w-4" /> Save world
              </ActionButton>
              <ActionButton disabled={busy} onAction={() => post('/api/backups', {}).then(() => toast('Backup created'))}>
                Backup now
              </ActionButton>
              <ActionButton onAction={() => post<{ updateAvailable: boolean; latest?: string }>('/api/server/check-update').then((r) => toast(r.updateAvailable ? `Update available (build ${r.latest})` : 'Game server is up to date', 'info'))}>
                Check for update
              </ActionButton>
            </div>
            <div className="text-xs text-muted">
              Game {status.buildVersion ?? '?'} · {status.installed ? 'installed' : 'not installed'}
              {status.updateAvailable && <Badge tone="accent" className="ml-2">update</Badge>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Charts({ points }: { points: MetricPoint[] }) {
  if (points.length < 2) return <p className="text-sm text-muted">Collecting data… (samples every 30s while the server runs)</p>;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Spark label="Players" points={points.map((p) => p.players ?? 0)} fmt={(v) => String(Math.round(v))} />
      <Spark label="CPU %" points={points.map((p) => p.cpu ?? 0)} fmt={(v) => `${v.toFixed(0)}%`} />
      <Spark label="Memory" points={points.map((p) => p.rss ?? 0)} fmt={(v) => fmtBytes(v)} />
    </div>
  );
}

function Spark({ label, points, fmt }: { label: string; points: number[]; fmt: (v: number) => string }) {
  const w = 300;
  const h = 70;
  const max = Math.max(...points, 1);
  const step = w / Math.max(points.length - 1, 1);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`).join(' ');
  return (
    <div>
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>
          now {fmt(points[points.length - 1])} · max {fmt(max)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-[70px] w-full" preserveAspectRatio="none">
        <path d={`${d} L${w},${h} L0,${h} Z`} className="fill-accent/10" />
        <path d={d} className="fill-none stroke-accent" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
