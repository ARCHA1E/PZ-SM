import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BackupEntry } from '@pzsm/shared';
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, del, fmtBytes, fmtDate, get, post, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Card, Empty, Loading, Notice, PageHeader } from '../components/ui';

export default function Backups() {
  const qc = useQueryClient();
  const status = useLive((s) => s.status);
  const task = useLive((s) => s.task);
  const q = useQuery({ queryKey: ['backups'], queryFn: () => get<{ backups: BackupEntry[] }>('/api/backups') });
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!task) void qc.invalidateQueries({ queryKey: ['backups'] });
  }, [task, qc]);
  const stopped = status?.state === 'stopped' || status?.state === 'crashed' || status?.state === 'not-installed';
  if (q.isLoading) return <Loading />;
  const list = q.data?.backups ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Backups" subtitle="World save, player save, server config and server database." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Create backup">
          <div className="flex gap-2">
            <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <ActionButton variant="primary" disabled={!!task} onAction={() => post('/api/backups', { note: note || undefined }).then(() => (toast('Backup created'), setNote(''), qc.invalidateQueries({ queryKey: ['backups'] })))}>
              Back up now
            </ActionButton>
          </div>
          <p className="mt-2 text-xs text-muted">While running, the world is saved first. Scheduled backups are configured under Schedules; retention is set on the Manager page.</p>
        </Card>
        <Card title="Import an existing server">
          <p className="mb-2 text-sm text-muted">
            Upload a .zip or .tar.gz of a Zomboid folder (or part of it) containing <code>Server/&lt;name&gt;.ini</code> and optionally <code>Saves/Multiplayer/&lt;name&gt;</code> and <code>db/&lt;name&gt;.db</code>. It is renamed to this server. The server must be stopped.
          </p>
          <label className={`btn ${!stopped || uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Choose archive'}
            <input
              type="file"
              className="hidden"
              accept=".zip,.tar.gz,.tgz"
              disabled={!stopped || uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  const fd = new FormData();
                  fd.append('file', f);
                  await api('/api/import', { method: 'POST', body: fd });
                  toast('Upload complete; importing…');
                } catch (er) {
                  toastError(er);
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </Card>
      </div>
      {!stopped && <Notice tone="accent">Stop the server to restore or import.</Notice>}
      <Card title={`Backups (${list.length})`} bodyClass="p-0">
        {list.length === 0 ? (
          <div className="p-4">
            <Empty>No backups yet.</Empty>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Kind</th>
                <th className="hidden md:table-cell">Note</th>
                <th>Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td>
                    {fmtDate(b.createdAt)}
                    <div className="font-mono text-[11px] text-muted">{b.file}</div>
                  </td>
                  <td>
                    <Badge tone={b.kind === 'manual' ? 'accent' : 'muted'}>{b.kind}</Badge>
                  </td>
                  <td className="hidden text-xs md:table-cell">{b.note ?? ''}</td>
                  <td className="text-xs">{fmtBytes(b.size)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <a className="btn btn-ghost px-2" href={`/api/backups/${encodeURIComponent(b.id)}/download`} title="Download">
                        <Download className="h-4 w-4" />
                      </a>
                      <ActionButton variant="ghost" disabled={!stopped || !!task} onAction={() => post(`/api/backups/${encodeURIComponent(b.id)}/restore`).then(() => toast('Restore started'))} confirm="Restore this backup? The current world is backed up first and then replaced." title="Restore">
                        <RotateCcw className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton variant="ghost" onAction={() => del(`/api/backups/${encodeURIComponent(b.id)}`).then(() => qc.invalidateQueries({ queryKey: ['backups'] }))} confirm="Delete this backup permanently?" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
