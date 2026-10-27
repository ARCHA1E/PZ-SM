import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuditEntry, BuildManifestSummary, ManagerSettings } from '@pzsm/shared';
import { useEffect, useState } from 'react';
import { get, post, put, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Card, Field, Loading, Notice, PageHeader, Toggle } from '../components/ui';

interface MgrResp {
  settings: ManagerSettings;
  ingameAdmin: { username: string; password: string } | null;
  paths: { install: string; cache: string; backups: string };
}

export default function Manager() {
  const qc = useQueryClient();
  const status = useLive((s) => s.status);
  const task = useLive((s) => s.task);
  const q = useQuery({ queryKey: ['manager'], queryFn: () => get<MgrResp>('/api/manager/settings') });
  const build = useQuery({ queryKey: ['build'], queryFn: () => get<{ manifest: BuildManifestSummary | null; warnings?: string[] }>('/api/build') });
  const audit = useQuery({ queryKey: ['audit'], queryFn: () => get<{ entries: AuditEntry[] }>('/api/audit?limit=100') });
  const [s, setS] = useState<ManagerSettings | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [ig, setIg] = useState({ username: 'admin', password: '' });
  useEffect(() => {
    if (q.data) {
      setS(q.data.settings);
      if (q.data.ingameAdmin) setIg({ username: q.data.ingameAdmin.username, password: '' });
    }
  }, [q.data]);
  if (q.isLoading || !s) return <Loading />;
  const running = status?.state === 'running' || status?.state === 'starting';
  const set = <K extends keyof ManagerSettings>(k: K, v: ManagerSettings[K]) => setS({ ...s, [k]: v });
  const m = build.data?.manifest;

  return (
    <div className="space-y-4">
      <PageHeader title="Manager" subtitle="Panel, process and update settings." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Server process"
          actions={
            <ActionButton variant="primary" onAction={() => put('/api/manager/settings', s).then(() => (toast('Saved; applies on next start'), qc.invalidateQueries({ queryKey: ['manager'] })))}>
              Save
            </ActionButton>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Server name" hint={running ? 'Stop the server to rename' : 'Selects Server/<name>.ini, save and db'}>
              <input className="input" disabled={running} value={s.serverName} onChange={(e) => set('serverName', e.target.value)} />
            </Field>
            <Field label="Java max heap (-Xmx)" hint="Leave ~3 GB of the container/LXC for native memory">
              <input className="input" value={s.javaMaxMemory} onChange={(e) => set('javaMaxMemory', e.target.value)} placeholder="8g" />
            </Field>
            <Field label="Java min heap (-Xms)">
              <input className="input" value={s.javaMinMemory} onChange={(e) => set('javaMinMemory', e.target.value)} placeholder="(unset)" />
            </Field>
            <Field label="Bind IP (-ip)">
              <input className="input" value={s.bindIp} onChange={(e) => set('bindIp', e.target.value)} placeholder="all interfaces" />
            </Field>
            <Field label="Extra JVM arguments" className="md:col-span-2">
              <input className="input font-mono" value={s.extraJvmArgs} onChange={(e) => set('extraJvmArgs', e.target.value)} />
            </Field>
            <Field label="Extra server arguments" className="md:col-span-2" hint="e.g. -no-worldgen, -debuglog=Network">
              <input className="input font-mono" value={s.extraServerArgs} onChange={(e) => set('extraServerArgs', e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(
              [
                ['autoStart', 'Start server when the manager starts'],
                ['restartOnCrash', 'Restart automatically after a crash'],
                ['updateOnStart', 'Update the game when the manager starts'],
                ['validateOnUpdate', 'Validate files on every update'],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Toggle checked={!!s[k]} onChange={(v) => set(k, v)} /> {l}
              </label>
            ))}
          </div>
        </Card>

        <Card
          title="Restarts, updates & backups"
          actions={
            <ActionButton variant="primary" onAction={() => put('/api/manager/settings', s).then(() => toast('Saved'))}>
              Save
            </ActionButton>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Restart warning minutes" hint="Countdown messages before restarts">
              <input className="input" value={s.restartWarningMinutes.join(',')} onChange={(e) => set('restartWarningMinutes', e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0))} />
            </Field>
            <Field label="Warning message" hint="{minutes} and {reason} are replaced">
              <input className="input" value={s.restartWarningMessage} onChange={(e) => set('restartWarningMessage', e.target.value)} />
            </Field>
            <Field label="When Workshop updates are found">
              <select className="input" value={s.modUpdateAction} onChange={(e) => set('modUpdateAction', e.target.value as 'notify' | 'restart')}>
                <option value="notify">Notify only</option>
                <option value="restart">Restart with warnings</option>
              </select>
            </Field>
            <Field label="Automatic backups to keep">
              <input className="input" type="number" min={1} value={s.backupRetention} onChange={(e) => set('backupRetention', Number(e.target.value))} />
            </Field>
            <Field label="Steam branch" hint="public, unstable, legacy41, or a pinned build branch">
              <input className="input" value={s.branch} onChange={(e) => set('branch', e.target.value)} />
            </Field>
            <Field label="Branch password">
              <input className="input" type="password" value={s.branchPassword} onChange={(e) => set('branchPassword', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card
          title="Game server install"
          actions={
            <>
              <ActionButton disabled={!!task} onAction={() => post('/api/server/install', {}).then(() => toast('Update started'))}>
                {status?.installed ? 'Update now' : 'Install now'}
              </ActionButton>
              <ActionButton disabled={!!task} onAction={() => post('/api/server/install', { validate: true }).then(() => toast('Validation started'))} confirm="Validate all game files? This can take a while.">
                Validate files
              </ActionButton>
            </>
          }
        >
          {m ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge tone="accent">Game {m.version}</Badge>
                <Badge>build {m.buildId}</Badge>
                <Badge>{m.serverOptions} server options</Badge>
                <Badge>{m.sandboxOptions} sandbox options</Badge>
                <Badge>{m.commands} commands</Badge>
                <Badge>{m.capabilities} capabilities</Badge>
                <Badge>{m.maps} vanilla maps</Badge>
              </div>
              <p className="text-xs text-muted">Analyzed {new Date(m.createdAt).toLocaleString()} from the installed game files. Re-analysis runs automatically after every update.</p>
              {m.diff && (m.diff.added.length > 0 || m.diff.removed.length > 0 || m.diff.changedDefaults.length > 0) && (
                <Notice tone="accent">
                  <div className="font-medium">Changes since previous build</div>
                  {m.diff.added.length > 0 && <div className="text-xs">Added: {m.diff.added.join(', ')}</div>}
                  {m.diff.removed.length > 0 && <div className="text-xs">Removed: {m.diff.removed.join(', ')}</div>}
                  {m.diff.changedDefaults.length > 0 && <div className="text-xs">New defaults: {m.diff.changedDefaults.join(', ')}</div>}
                </Notice>
              )}
              {build.data?.warnings?.map((w) => (
                <Notice key={w}>{w}</Notice>
              ))}
              <ActionButton onAction={() => post('/api/build/analyze').then(() => (toast('Build re-analyzed'), build.refetch()))}>Re-analyze build</ActionButton>
            </div>
          ) : (
            <p className="text-sm text-muted">Not installed yet.</p>
          )}
          <div className="mt-3 space-y-0.5 text-xs text-muted">
            <div>Install: {q.data?.paths.install}</div>
            <div>Data (cachedir): {q.data?.paths.cache}</div>
            <div>Backups: {q.data?.paths.backups}</div>
          </div>
        </Card>

        <Card title="Accounts">
          <div className="space-y-4">
            <div>
              <div className="label mb-1">In-game admin account</div>
              {q.data?.ingameAdmin && (
                <p className="mb-2 text-sm">
                  User <code>{q.data.ingameAdmin.username}</code>, password{' '}
                  <button className="font-mono text-accent" onClick={() => setShowAdmin(!showAdmin)}>
                    {showAdmin ? q.data.ingameAdmin.password : '•••••••• (show)'}
                  </button>
                </p>
              )}
              <div className="flex gap-2">
                <input className="input" placeholder="username" value={ig.username} onChange={(e) => setIg({ ...ig, username: e.target.value })} />
                <input className="input" type="password" placeholder="new password" value={ig.password} onChange={(e) => setIg({ ...ig, password: e.target.value })} />
                <ActionButton onAction={() => put<{ output: string }>('/api/manager/ingame-admin', ig).then((r) => (toast(r.output || 'Saved'), qc.invalidateQueries({ queryKey: ['manager'] })))}>Set</ActionButton>
              </div>
            </div>
            <div>
              <div className="label mb-1">Panel password</div>
              <div className="flex gap-2">
                <input className="input" type="password" placeholder="current" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                <input className="input" type="password" placeholder="new (min 8)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                <ActionButton
                  onAction={async () => {
                    try {
                      await put('/api/manager/password', pw);
                      toast('Password changed; please sign in again');
                      setTimeout(() => location.reload(), 1200);
                    } catch (e) {
                      toastError(e);
                    }
                  }}
                >
                  Change
                </ActionButton>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Audit log" bodyClass="p-0">
        <div className="max-h-96 overflow-y-auto">
          <table className="table">
            <tbody>
              {(audit.data?.entries ?? []).map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-xs text-muted">{new Date(e.at).toLocaleString()}</td>
                  <td className="whitespace-nowrap font-mono text-xs">{e.action}</td>
                  <td className="break-all text-xs">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
