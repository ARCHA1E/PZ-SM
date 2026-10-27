import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ScheduleEntry } from '@pzsm/shared';
import { Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { del, fmtDate, get, post, put, toast, toastError } from '../api';
import { ActionButton, Badge, Button, Card, Empty, Field, Loading, Modal, PageHeader, Toggle } from '../components/ui';

const KINDS: { key: ScheduleEntry['kind']; label: string; help: string }[] = [
  { key: 'restart', label: 'Restart', help: 'Restart with in-game countdown warnings.' },
  { key: 'backup', label: 'Backup', help: 'Create a backup (pruned by retention).' },
  { key: 'mod-update-check', label: 'Mod update check', help: 'Compare Workshop items with Steam; notify or restart.' },
  { key: 'game-update-check', label: 'Game update check', help: 'Check SteamCMD for a new build; optionally update automatically.' },
  { key: 'message', label: 'Broadcast message', help: 'Send a server message to all players.' },
  { key: 'command', label: 'Console command', help: 'Run any server command.' },
];

const PRESETS = [
  ['Every 15 minutes', '*/15 * * * *'],
  ['Hourly', '0 * * * *'],
  ['Every 6 hours', '0 */6 * * *'],
  ['Daily 06:00', '0 6 * * *'],
  ['Twice daily', '0 6,18 * * *'],
];

export default function Schedules() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['schedules'], queryFn: () => get<{ schedules: ScheduleEntry[] }>('/api/schedules') });
  const [edit, setEdit] = useState<Partial<ScheduleEntry> | null>(null);
  if (q.isLoading) return <Loading />;
  const list = q.data?.schedules ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['schedules'] });
  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedules"
        subtitle="Cron schedules (server time zone). Format: minute hour day month weekday."
        actions={
          <Button variant="primary" onClick={() => setEdit({ kind: 'restart', cron: '0 6 * * *', enabled: true, payload: {} })}>
            <Plus className="h-4 w-4" /> New schedule
          </Button>
        }
      />
      <Card bodyClass="p-0">
        {list.length === 0 ? (
          <div className="p-4">
            <Empty>No schedules.</Empty>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Enabled</th>
                <th>Task</th>
                <th>Cron</th>
                <th className="hidden md:table-cell">Next run</th>
                <th className="hidden md:table-cell">Last run</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Toggle checked={s.enabled} onChange={(v) => put('/api/schedules', { ...s, enabled: v }).then(refresh, toastError)} />
                  </td>
                  <td>
                    <button className="text-left font-medium hover:text-accent" onClick={() => setEdit(s)}>
                      {KINDS.find((k) => k.key === s.kind)?.label ?? s.kind}
                    </button>
                    <div className="text-xs text-muted">{summary(s)}</div>
                  </td>
                  <td>
                    <code className="text-xs">{s.cron}</code>
                  </td>
                  <td className="hidden text-xs text-muted md:table-cell">{s.enabled ? fmtDate(s.nextRun) : '—'}</td>
                  <td className="hidden text-xs text-muted md:table-cell">{fmtDate(s.lastRun)}</td>
                  <td className="text-right">
                    <ActionButton variant="ghost" onAction={() => post(`/api/schedules/${s.id}/run`).then(() => toast('Started'))} title="Run now" confirm="Run this task now?">
                      <Play className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton variant="ghost" onAction={() => del(`/api/schedules/${s.id}`).then(refresh)} confirm="Delete this schedule?" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {edit && <EditModal value={edit} onClose={() => setEdit(null)} onSaved={() => (setEdit(null), refresh())} />}
    </div>
  );
}

function summary(s: ScheduleEntry): string {
  const p = s.payload as Record<string, unknown>;
  switch (s.kind) {
    case 'restart':
      return `${p.reason ?? 'Scheduled restart'}${Array.isArray(p.warnings) ? ` · warnings ${(p.warnings as number[]).join('/')} min` : ''}`;
    case 'mod-update-check':
      return `on update: ${p.action ?? 'manager default'}`;
    case 'game-update-check':
      return p.autoUpdate ? 'auto-update' : 'notify only';
    case 'message':
      return String(p.text ?? '');
    case 'command':
      return String(p.command ?? '');
    default:
      return '';
  }
}

function EditModal({ value, onClose, onSaved }: { value: Partial<ScheduleEntry>; onClose: () => void; onSaved: () => void }) {
  const [s, setS] = useState(value);
  const p = (s.payload ?? {}) as Record<string, unknown>;
  const setP = (k: string, v: unknown) => setS({ ...s, payload: { ...p, [k]: v } });
  return (
    <Modal open onClose={onClose} title={s.id ? 'Edit schedule' : 'New schedule'}>
      <div className="space-y-3">
        <Field label="Task" hint={KINDS.find((k) => k.key === s.kind)?.help}>
          <select className="input" value={s.kind} onChange={(e) => setS({ ...s, kind: e.target.value as ScheduleEntry['kind'], payload: {} })}>
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="When (cron)">
          <input className="input font-mono" value={s.cron} onChange={(e) => setS({ ...s, cron: e.target.value })} />
          <div className="mt-1 flex flex-wrap gap-1">
            {PRESETS.map(([l, c]) => (
              <button key={c} className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted hover:text-fg" onClick={() => setS({ ...s, cron: c })}>
                {l}
              </button>
            ))}
          </div>
        </Field>
        {s.kind === 'restart' && (
          <>
            <Field label="Reason (shown to players)">
              <input className="input" value={String(p.reason ?? '')} onChange={(e) => setP('reason', e.target.value)} placeholder="Scheduled restart" />
            </Field>
            <Field label="Warning minutes (comma separated)" hint="Leave empty to use the manager default">
              <input className="input" value={Array.isArray(p.warnings) ? (p.warnings as number[]).join(',') : ''} onChange={(e) => setP('warnings', e.target.value ? e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0) : undefined)} />
            </Field>
          </>
        )}
        {s.kind === 'mod-update-check' && (
          <Field label="When updates are found">
            <select className="input" value={String(p.action ?? '')} onChange={(e) => setP('action', e.target.value || undefined)}>
              <option value="">Use manager default</option>
              <option value="notify">Notify only</option>
              <option value="restart">Restart with warnings (server re-downloads mods)</option>
            </select>
          </Field>
        )}
        {s.kind === 'game-update-check' && (
          <label className="flex items-center gap-2 text-sm">
            <Toggle checked={!!p.autoUpdate} onChange={(v) => setP('autoUpdate', v)} /> Automatically update (restarts with warnings)
          </label>
        )}
        {s.kind === 'message' && (
          <Field label="Message">
            <input className="input" value={String(p.text ?? '')} onChange={(e) => setP('text', e.target.value)} />
          </Field>
        )}
        {s.kind === 'command' && (
          <Field label="Command">
            <input className="input font-mono" value={String(p.command ?? '')} onChange={(e) => setP('command', e.target.value)} placeholder="save" />
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm">
          <Toggle checked={!!s.enabled} onChange={(v) => setS({ ...s, enabled: v })} /> Enabled
        </label>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <ActionButton variant="primary" onAction={() => put('/api/schedules', s).then(() => (toast('Schedule saved'), onSaved()))}>
            Save
          </ActionButton>
        </div>
        {s.id && <Badge>#{s.id}</Badge>}
      </div>
    </Modal>
  );
}
