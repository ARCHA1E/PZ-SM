import { useQuery } from '@tanstack/react-query';
import type { LogFileEntry } from '@pzsm/shared';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { fmtBytes, get, useDebounced } from '../api';
import { Card, Empty, Loading, PageHeader } from '../components/ui';

const TYPE_LABELS: Record<string, string> = {
  'DebugLog-server': 'Server debug',
  user: 'Joins / leaves',
  connections: 'Connections',
  chat: 'Chat',
  admin: 'Admin actions',
  cmd: 'Commands',
  PerkLog: 'Skills & deaths',
  pvp: 'PvP',
  item: 'Items',
  map: 'Map edits',
  ClientActionLog: 'Player actions',
};

export default function Logs() {
  const files = useQuery({ queryKey: ['logs'], queryFn: () => get<{ files: LogFileEntry[] }>('/api/logs'), refetchInterval: 30_000 });
  const [type, setType] = useState<string>('');
  const [sel, setSel] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const ds = useDebounced(search, 300);
  const [global, setGlobal] = useState(false);

  const types = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of files.data?.files ?? []) m.set(f.type, (m.get(f.type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [files.data]);
  const list = (files.data?.files ?? []).filter((f) => !type || f.type === type);
  const current = sel ?? list[0]?.path ?? null;
  const content = useQuery({
    queryKey: ['log', current, ds],
    queryFn: () => get<{ lines: { time?: string; text: string }[]; truncated: boolean }>(`/api/logs/read?path=${encodeURIComponent(current!)}&limit=3000${ds ? `&search=${encodeURIComponent(ds)}` : ''}`),
    enabled: !!current && !global,
  });
  const searchAll = useQuery({
    queryKey: ['logsearch', type, ds],
    queryFn: () => get<{ results: { file: string; time?: string; text: string }[] }>(`/api/logs/search?q=${encodeURIComponent(ds)}&types=${encodeURIComponent(type)}`),
    enabled: global && ds.length > 1,
  });

  if (files.isLoading) return <Loading />;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Logs"
        subtitle="Zomboid/Logs, including archived sessions"
        actions={
          <>
            <input className="input w-64" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={global} onChange={(e) => setGlobal(e.target.checked)} /> Search all files
            </label>
          </>
        }
      />
      <div className="flex flex-wrap gap-1">
        <button className={clsx('btn', !type && 'border-accent text-accent')} onClick={() => (setType(''), setSel(null))}>
          All
        </button>
        {types.map(([t, n]) => (
          <button key={t} className={clsx('btn', type === t && 'border-accent text-accent')} onClick={() => (setType(t), setSel(null))}>
            {TYPE_LABELS[t] ?? t} <span className="text-xs text-muted">{n}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card bodyClass="p-1 max-h-[70vh] overflow-y-auto">
          {list.length === 0 ? (
            <Empty>No log files.</Empty>
          ) : (
            list.slice(0, 400).map((f) => (
              <button key={f.path} onClick={() => (setSel(f.path), setGlobal(false))} className={clsx('block w-full rounded px-2 py-1.5 text-left text-xs', current === f.path && !global ? 'bg-accent/15 text-accent' : 'hover:bg-panel2')}>
                <div className="truncate font-medium">{TYPE_LABELS[f.type] ?? f.type}</div>
                <div className="flex justify-between text-muted">
                  <span>{f.date?.replace('T', ' ') ?? f.name}</span>
                  <span>{fmtBytes(f.size)}</span>
                </div>
                {f.archive && <div className="truncate text-[10px] text-muted/70">{f.archive}</div>}
              </button>
            ))
          )}
        </Card>
        <Card bodyClass="p-0">
          <div className="max-h-[70vh] overflow-auto p-3 font-mono text-xs leading-relaxed">
            {global ? (
              ds.length < 2 ? (
                <p className="text-muted">Type at least 2 characters to search all {type ? TYPE_LABELS[type] ?? type : ''} logs.</p>
              ) : searchAll.isLoading ? (
                <Loading />
              ) : (
                (searchAll.data?.results ?? []).map((r, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">
                    <span className="mr-2 text-muted">{r.time?.replace('T', ' ')}</span>
                    {r.text}
                    <span className="ml-2 text-muted/60">{r.file}</span>
                  </div>
                ))
              )
            ) : content.isLoading ? (
              <Loading />
            ) : (
              <>
                {content.data?.truncated && <div className="mb-2 text-warn">Showing the last 3000 matching lines.</div>}
                {(content.data?.lines ?? []).map((l, i) => (
                  <div key={i} className={clsx('whitespace-pre-wrap break-all', /ERROR|Exception/.test(l.text) && 'text-bad', /WARN/.test(l.text) && 'text-warn')}>
                    {l.time && <span className="mr-2 text-muted">{l.time.replace('T', ' ').slice(0, 19)}</span>}
                    {l.text}
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
