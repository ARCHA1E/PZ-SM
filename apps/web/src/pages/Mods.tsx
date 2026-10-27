import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModEntry, ModsView } from '@pzsm/shared';
import { AlertTriangle, Download, ExternalLink, Plus, RefreshCw, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { del, fmtBytes, fmtDate, get, post, put, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Button, Card, Empty, ErrorBox, Loading, Modal, Notice, PageHeader, SortableList, Tabs, Toggle } from '../components/ui';

export default function Mods() {
  const qc = useQueryClient();
  const task = useLive((s) => s.task);
  const q = useQuery({ queryKey: ['mods'], queryFn: () => get<ModsView>('/api/mods') });
  const [tab, setTab] = useState<'mods' | 'order' | 'workshop'>('mods');
  const [add, setAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const [detail, setDetail] = useState<ModEntry | null>(null);

  // Refresh when a workshop download finishes
  const prevTask = useLive((s) => s.task?.kind);
  useEffect(() => {
    if (!task) void qc.invalidateQueries({ queryKey: ['mods'] });
  }, [task, prevTask, qc]);

  const view = q.data;
  const byId = useMemo(() => new Map((view?.mods ?? []).map((m) => [m.id, m])), [view]);
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!view) return null;

  const active = view.activeOrder;
  const setActive = async (ids: string[], withDependencies = false) => {
    try {
      const r = await put<{ active: string[]; sandboxDefaultsAdded: string[] }>('/api/mods/active', { ids, withDependencies });
      toast(`Mods updated (${r.active.length} enabled)${r.sandboxDefaultsAdded.length ? ` · ${r.sandboxDefaultsAdded.length} new sandbox options` : ''}`);
      await qc.invalidateQueries({ queryKey: ['mods'] });
      await qc.invalidateQueries({ queryKey: ['settings'] });
    } catch (e) {
      toastError(e);
    }
  };
  const toggle = (m: ModEntry, on: boolean) => setActive(on ? [...active, m.id] : active.filter((x) => x !== m.id), on);

  const f = filter.toLowerCase();
  const mods = view.mods.filter((m) => (!onlyEnabled || m.enabled) && (!f || m.name.toLowerCase().includes(f) || m.id.toLowerCase().includes(f) || m.workshopId?.includes(f)));
  const currentOrder = order ?? active;
  const orderChanged = order !== null && order.join('|') !== active.join('|');
  const suggestedDiffers = view.suggestedOrder.join('|') !== active.join('|');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mods"
        subtitle={`${active.length} enabled · ${view.mods.length} installed mods in ${view.workshop.filter((w) => w.installed).length} Workshop items · game ${view.gameVersion}`}
        actions={
          <>
            <Button variant="primary" onClick={() => setAdd(true)}>
              <Plus className="h-4 w-4" /> Add from Workshop
            </Button>
            <ActionButton disabled={!!task} onAction={() => post('/api/workshop/download', {}).then(() => toast('Download started'))}>
              <Download className="h-4 w-4" /> Download / update all
            </ActionButton>
            <ActionButton onAction={() => post<{ outdated: string[] }>('/api/workshop/check-updates').then((r) => (toast(r.outdated.length ? `${r.outdated.length} item(s) have updates` : 'All Workshop items are up to date', 'info'), qc.invalidateQueries({ queryKey: ['mods'] })))}>
              <RefreshCw className="h-4 w-4" /> Check updates
            </ActionButton>
          </>
        }
      />
      {view.problems.length > 0 && (
        <Notice>
          <ul className="list-inside list-disc">
            {view.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'mods', label: `Installed mods (${view.mods.length})` },
          { key: 'order', label: `Load order (${active.length})` },
          { key: 'workshop', label: `Workshop items (${view.workshop.length})` },
        ]}
      />

      {tab === 'mods' && (
        <Card
          bodyClass="p-0"
          title={
            <div className="flex items-center gap-3">
              <input className="input w-64" placeholder="Filter by name, id or Workshop id…" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <label className="flex items-center gap-1.5 text-sm font-normal text-muted">
                <input type="checkbox" checked={onlyEnabled} onChange={(e) => setOnlyEnabled(e.target.checked)} /> Enabled only
              </label>
            </div>
          }
        >
          {mods.length === 0 ? (
            <div className="p-4">
              <Empty>No mods. Add Workshop items to get started.</Empty>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">On</th>
                  <th>Mod</th>
                  <th className="hidden md:table-cell">Workshop</th>
                  <th className="hidden lg:table-cell">Provides</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mods.map((m) => (
                  <tr key={`${m.workshopId}-${m.id}`} className="hover:bg-panel2/50">
                    <td>
                      <Toggle checked={m.enabled} onChange={(v) => void toggle(m, v)} label={`Enable ${m.name}`} />
                    </td>
                    <td className="min-w-0">
                      <button className="text-left font-medium hover:text-accent" onClick={() => setDetail(m)}>
                        {m.name}
                      </button>
                      <div className="font-mono text-xs text-muted">
                        {m.id}
                        {m.versionDir ? ` · ${m.versionDir}/` : ''}
                      </div>
                      {m.require.length > 0 && <div className="text-xs text-muted">requires {m.require.join(', ')}</div>}
                    </td>
                    <td className="hidden md:table-cell">
                      {m.workshopId ? (
                        <a className="inline-flex items-center gap-1 font-mono text-xs text-muted hover:text-accent" href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${m.workshopId}`} target="_blank" rel="noreferrer">
                          {m.workshopId} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Badge>local</Badge>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {m.hasSandboxOptions && <Badge tone="accent">sandbox options</Badge>}
                        {m.maps.map((x) => (
                          <Badge key={x} tone="accent">
                            map: {x}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      {m.problems.length ? (
                        <span className="inline-flex items-start gap-1 text-xs text-warn" title={m.problems.join('\n')}>
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {m.problems[0]}
                          {m.problems.length > 1 && ` (+${m.problems.length - 1})`}
                        </span>
                      ) : (
                        <span className="text-xs text-ok">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'order' && (
        <Card
          title="Mods= load order"
          actions={
            <>
              {suggestedDiffers && (
                <Button onClick={() => setOrder(view.suggestedOrder)} title="Order by require / loadModAfter / loadModBefore">
                  <Wand2 className="h-4 w-4" /> Auto-sort by dependencies
                </Button>
              )}
              {orderChanged && <Button onClick={() => setOrder(null)}>Reset</Button>}
              <ActionButton variant="primary" disabled={!orderChanged} onAction={async () => {
                await setActive(currentOrder);
                setOrder(null);
              }}>
                Save order
              </ActionButton>
            </>
          }
        >
          {currentOrder.length === 0 ? (
            <Empty>No mods enabled.</Empty>
          ) : (
            <SortableList
              items={currentOrder}
              keyOf={(x) => x}
              onChange={setOrder}
              render={(id) => {
                const m = byId.get(id);
                return (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{m?.name ?? id}</span>
                    <code className="truncate text-xs text-muted">{id}</code>
                    {!m && <Badge tone="bad">not installed</Badge>}
                    {m?.problems.length ? <Badge tone="warn" title={m.problems.join('\n')}>{m.problems.length} issue(s)</Badge> : null}
                  </div>
                );
              }}
            />
          )}
          <p className="mt-3 text-xs text-muted">Mods load top to bottom. Dependencies should come before the mods that need them. Map mods must also be added on the Maps page.</p>
        </Card>
      )}

      {tab === 'workshop' && (
        <Card title="Workshop items" bodyClass="p-0">
          {view.workshop.length === 0 ? (
            <div className="p-4">
              <Empty>No Workshop items.</Empty>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Mods</th>
                  <th className="hidden md:table-cell">Updated</th>
                  <th className="hidden md:table-cell">Size</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {view.workshop.map((w) => (
                  <tr key={w.workshopId}>
                    <td>
                      <div className="flex items-center gap-2">
                        {w.preview && <img src={w.preview} className="h-9 w-9 rounded object-cover" alt="" loading="lazy" />}
                        <div>
                          <div className="font-medium">{w.title ?? w.workshopId}</div>
                          <a className="font-mono text-xs text-muted hover:text-accent" href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${w.workshopId}`} target="_blank" rel="noreferrer">
                            {w.workshopId}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs">{w.modIds.join(', ') || '—'}</td>
                    <td className="hidden text-xs text-muted md:table-cell">{w.timeUpdated ? fmtDate(w.timeUpdated) : '—'}</td>
                    <td className="hidden text-xs text-muted md:table-cell">{fmtBytes(w.size)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {!w.installed && <Badge tone="warn">not downloaded</Badge>}
                        {w.needsUpdate && <Badge tone="accent">update available</Badge>}
                        {w.installed && !w.needsUpdate && <Badge tone="ok">installed</Badge>}
                        {!w.inServerConfig && <Badge title="Not in WorkshopItems=; the server won't keep it updated">unlisted</Badge>}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <ActionButton variant="ghost" disabled={!!task} onAction={() => post('/api/workshop/download', { ids: [w.workshopId] })} title="Download / update">
                          <Download className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton variant="ghost" onAction={() => del(`/api/workshop/${w.workshopId}`).then(() => qc.invalidateQueries({ queryKey: ['mods'] }))} confirm="Remove this item from the server (WorkshopItems) and disable its mods?" title="Remove">
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-t border-line p-3">
            <ActionButton onAction={() => post('/api/workshop/refresh-meta').then(() => qc.invalidateQueries({ queryKey: ['mods'] }))}>Refresh titles & update times from Steam</ActionButton>
          </div>
        </Card>
      )}

      <AddModal open={add} onClose={() => setAdd(false)} onAdded={() => qc.invalidateQueries({ queryKey: ['mods'] })} />
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} wide>
        {detail && (
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            {detail.poster ? <img src={detail.poster} className="w-full rounded" alt="" /> : <div />}
            <div className="space-y-2 text-sm">
              <div>
                <span className="label">Mod id</span> <code>{detail.id}</code>
              </div>
              {detail.author && (
                <div>
                  <span className="label">Author</span> {detail.author}
                </div>
              )}
              <div>
                <span className="label">Folder</span> <code>{detail.folder}{detail.versionDir ? `/${detail.versionDir}` : ''}</code>
              </div>
              {(detail.versionMin || detail.versionMax) && (
                <div>
                  <span className="label">Game versions</span> {detail.versionMin ?? '*'} – {detail.versionMax ?? '*'}
                </div>
              )}
              {[
                ['Requires', detail.require],
                ['Incompatible', detail.incompatible],
                ['Load after', detail.loadModAfter],
                ['Load before', detail.loadModBefore],
              ].map(([l, v]) =>
                (v as string[]).length ? (
                  <div key={l as string}>
                    <span className="label">{l as string}</span> {(v as string[]).join(', ')}
                  </div>
                ) : null,
              )}
              {detail.problems.length > 0 && (
                <Notice>
                  {detail.problems.map((p) => (
                    <div key={p}>{p}</div>
                  ))}
                </Notice>
              )}
              {detail.description && <p className="whitespace-pre-line text-muted">{detail.description.replace(/<LINE>/gi, '\n').replace(/<[^>]+>/g, '')}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AddModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Add Workshop items">
      <div className="space-y-3">
        <p className="text-sm text-muted">Paste Workshop IDs or URLs, one per line. Collection links are expanded into their items. Items are downloaded now, then you can enable their mods.</p>
        <textarea className="input min-h-[140px] font-mono text-xs" placeholder={'2392709985\nhttps://steamcommunity.com/sharedfiles/filedetails/?id=2875848298'} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            busy={busy}
            onClick={async () => {
              const refs = text.split(/[\s,]+/).filter(Boolean);
              if (!refs.length) return;
              setBusy(true);
              try {
                const r = await post<{ added: string[] }>('/api/workshop/add', { refs });
                toast(`Added ${r.added.length} item(s); downloading…`);
                setText('');
                onAdded();
                onClose();
              } catch (e) {
                toastError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            Add & download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
