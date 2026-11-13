import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModEntry, ModsView } from '@pzsm/shared';
import { AlertTriangle, ChevronDown, Compass, Download, Eraser, Layers, ListOrdered, MoreHorizontal, Plus, RefreshCw, RotateCcw, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { del, get, post, put, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Button, Card, Empty, ErrorBox, Loading, Modal, Notice, PageHeader, SortableList } from '../components/ui';
import { BrowseTab } from './mods/BrowseTab';
import { InstalledTab, type ModGroup } from './mods/InstalledTab';
import { InstallPlanModal } from './mods/InstallPlanModal';
import { WipeModsModal } from './mods/WipeModsModal';
import { WorkshopDetailModal } from './mods/WorkshopDetailModal';

type Tab = 'installed' | 'browse' | 'order';

export default function Mods() {
  const qc = useQueryClient();
  const task = useLive((s) => s.task);
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'installed';
  const setTab = (t: Tab) => setParams((p) => (p.set('tab', t), p), { replace: true });
  const q = useQuery({ queryKey: ['mods'], queryFn: () => get<ModsView>('/api/mods') });
  const job = useQuery({ queryKey: ['workshop-job'], queryFn: () => get<{ job: { total: number; done: number; remaining: string[]; permanent: Record<string, string>; lastError?: string; updatedAt: string } | null }>('/api/workshop/job') });
  const [plan, setPlan] = useState<{ refs: string[]; input: boolean } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [localMod, setLocalMod] = useState<ModEntry | null>(null);
  const [wipe, setWipe] = useState(false);
  const [showProblems, setShowProblems] = useState(false);

  // Refresh when a background task (download, install, wipe) finishes.
  const hadTask = useRef(false);
  useEffect(() => {
    if (task) hadTask.current = true;
    else if (hadTask.current) {
      hadTask.current = false;
      void qc.invalidateQueries({ queryKey: ['mods'] });
      void qc.invalidateQueries({ queryKey: ['workshop-job'] });
      void qc.invalidateQueries({ queryKey: ['workshop-browse'] });
      void qc.invalidateQueries({ queryKey: ['workshop-item'] });
    }
  }, [task, qc]);

  const view = q.data;
  const byId = useMemo(() => new Map((view?.mods ?? []).map((m) => [m.id, m])), [view]);
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!view) return null;

  const active = view.activeOrder;
  const setActive = async (ids: string[], withDependencies = false) => {
    try {
      const r = await put<{ active: string[]; sandboxDefaultsAdded: string[] }>('/api/mods/active', { ids, withDependencies });
      const pulled = r.active.filter((id) => !ids.includes(id));
      toast(`${r.active.length} mods enabled${pulled.length ? ` · also enabled required: ${pulled.join(', ')}` : ''}${r.sandboxDefaultsAdded.length ? ` · ${r.sandboxDefaultsAdded.length} new sandbox options` : ''}`);
      await qc.invalidateQueries({ queryKey: ['mods'] });
      await qc.invalidateQueries({ queryKey: ['settings'] });
    } catch (e) {
      toastError(e);
    }
  };
  const toggle = (m: ModEntry, on: boolean) => setActive(on ? [...active, m.id] : active.filter((x) => x !== m.id), on);
  const enableMany = (ids: string[], on: boolean) => {
    if (!ids.length) return;
    if (!window.confirm(`${on ? 'Enable' : 'Disable'} ${ids.length} mod(s)?`)) return;
    void setActive(on ? [...active, ...ids.filter((id) => !active.includes(id))] : active.filter((x) => !ids.includes(x)), on);
  };
  const openGroup = (g: ModGroup) => {
    if (g.workshop) setDetailId(g.workshop.workshopId);
    else setLocalMod(g.mods[0]);
  };
  const install = (ids: string[]) => {
    setDetailId(null);
    setPlan({ refs: ids, input: false });
  };

  const installedItems = view.workshop.filter((w) => w.installed).length;
  const updates = view.workshop.filter((w) => w.needsUpdate).length;
  const detailMods = detailId ? view.mods.filter((m) => m.workshopId === detailId) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mods"
        subtitle={`${active.length} enabled · ${view.mods.length} mods in ${installedItems} downloaded Workshop items · game ${view.gameVersion ?? '?'}`}
        actions={
          <>
            <Button variant="primary" onClick={() => setTab('browse')} className={tab === 'browse' ? 'hidden' : ''}>
              <Compass className="h-4 w-4" /> Browse Workshop
            </Button>
            <Button onClick={() => setPlan({ refs: [], input: true })} title="Add Workshop items or collections by id or URL">
              <Plus className="h-4 w-4" /> Add by ID / URL
            </Button>
            <ActionButton disabled={!!task} onAction={() => post('/api/workshop/download', {}).then(() => toast('Download started'))} title="Download every item in WorkshopItems= and apply updates">
              <Download className="h-4 w-4" /> Update all{updates ? ` (${updates})` : ''}
            </ActionButton>
            <ManageMenu onWipe={() => setWipe(true)} />
          </>
        }
      />

      {job.data?.job && !task && (
        <Notice tone="accent">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              A Workshop download stopped before finishing: {job.data.job.done}/{job.data.job.total} done, {job.data.job.remaining.length} left
              {job.data.job.lastError ? ` (last error: ${job.data.job.lastError})` : ''}. It continues from the first missing item.
            </span>
            <ActionButton variant="primary" onAction={() => post('/api/workshop/resume').then(() => toast('Resuming download'))}>
              Resume download
            </ActionButton>
            <ActionButton variant="ghost" onAction={() => del('/api/workshop/job').then(() => qc.invalidateQueries({ queryKey: ['workshop-job'] }))}>
              Dismiss
            </ActionButton>
          </div>
          {Object.keys(job.data.job.permanent).length > 0 && (
            <div className="mt-1 text-xs text-muted">
              Unavailable on the Workshop (skipped): {Object.entries(job.data.job.permanent).map(([id, r]) => `${id} (${r})`).join(', ')}
            </div>
          )}
        </Notice>
      )}
      {view.problems.length > 0 && (
        <Notice>
          <button className="flex w-full items-center gap-2 text-left" onClick={() => setShowProblems(!showProblems)}>
            <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
            <span className="font-medium">
              {view.problems.length} configuration problem{view.problems.length > 1 ? 's' : ''}
            </span>
            <span className="truncate text-xs text-muted">{!showProblems && view.problems[0]}</span>
            <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition ${showProblems ? 'rotate-180' : ''}`} />
          </button>
          {showProblems && (
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
              {view.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-1 border-b border-line">
        {(
          [
            ['installed', Layers, `Installed (${view.workshop.length + view.mods.filter((m) => !m.workshopId).length})`],
            ['browse', Compass, 'Browse Workshop'],
            ['order', ListOrdered, `Load order (${active.length})`],
          ] as const
        ).map(([k, Icon, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`}
          >
            <Icon className="h-4 w-4" />
            {l}
          </button>
        ))}
      </div>

      {tab === 'installed' && <InstalledTab view={view} onToggle={toggle} onEnableMany={enableMany} onOpen={openGroup} onInstall={install} />}
      {tab === 'browse' && <BrowseTab onOpen={setDetailId} onInstall={install} />}
      {tab === 'order' && <LoadOrder view={view} byId={byId} onSave={(ids) => setActive(ids)} />}

      <InstallPlanModal open={!!plan} refs={plan?.refs ?? []} allowInput={plan?.input} onClose={() => setPlan(null)} />
      <WorkshopDetailModal workshopId={detailId} mods={detailMods} onClose={() => setDetailId(null)} onInstall={install} onToggleMod={toggle} />
      <WipeModsModal open={wipe} onClose={() => setWipe(false)} />
      <LocalModModal mod={localMod} onClose={() => setLocalMod(null)} />
    </div>
  );
}

function ManageMenu({ onWipe }: { onWipe: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  const item = 'flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm hover:bg-panel2';
  const run = (fn: () => Promise<unknown>) => async () => {
    setOpen(false);
    try {
      await fn();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setOpen(!open)} aria-label="More mod actions" title="More actions">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="card absolute right-0 z-30 mt-1 w-72 p-1 shadow-xl">
          <button
            className={item}
            onClick={run(() => post<{ outdated: string[] }>('/api/workshop/check-updates').then((r) => (toast(r.outdated.length ? `${r.outdated.length} item(s) have updates` : 'All Workshop items are up to date', 'info'), qc.invalidateQueries({ queryKey: ['mods'] }))))}
          >
            <RefreshCw className="h-4 w-4 text-muted" /> Check for updates
          </button>
          <button className={item} onClick={run(() => post('/api/workshop/refresh-meta').then(() => (toast('Refreshed titles, authors, tags and requirements'), qc.invalidateQueries({ queryKey: ['mods'] }))))}>
            <RotateCcw className="h-4 w-4 text-muted" /> Refresh from Steam
            <span className="ml-auto text-[11px] text-muted">titles, tags, deps</span>
          </button>
          <button className={item} onClick={run(() => post('/api/mods/rescan').then(() => qc.invalidateQueries({ queryKey: ['mods'] })))}>
            <Layers className="h-4 w-4 text-muted" /> Rescan mod folders
          </button>
          <button className={item} onClick={run(() => post('/api/workshop/download', { validate: true }).then(() => toast('Verifying all Workshop items')))}>
            <Download className="h-4 w-4 text-muted" /> Verify all downloads
          </button>
          <div className="my-1 border-t border-line" />
          <button
            className={`${item} text-bad`}
            onClick={() => {
              setOpen(false);
              onWipe();
            }}
          >
            <Eraser className="h-4 w-4" /> Remove mods / reset mod settings…
          </button>
        </div>
      )}
    </div>
  );
}

function LoadOrder({ view, byId, onSave }: { view: ModsView; byId: Map<string, ModEntry>; onSave: (ids: string[]) => Promise<void> }) {
  const [order, setOrder] = useState<string[] | null>(null);
  const active = view.activeOrder;
  const current = order ?? active;
  const changed = order !== null && order.join('|') !== active.join('|');
  const suggestedDiffers = view.suggestedOrder.join('|') !== current.join('|');
  return (
    <Card
      title="Mods= load order"
      actions={
        <>
          {suggestedDiffers && (
            <Button onClick={() => setOrder(view.suggestedOrder)} title="Order by require / loadModAfter / loadModBefore from each mod.info">
              <Wand2 className="h-4 w-4" /> Auto-sort by dependencies
            </Button>
          )}
          {changed && <Button onClick={() => setOrder(null)}>Reset</Button>}
          <ActionButton
            variant="primary"
            disabled={!changed}
            onAction={async () => {
              await onSave(current);
              setOrder(null);
            }}
          >
            Save order
          </ActionButton>
        </>
      }
    >
      {current.length === 0 ? (
        <Empty>No mods enabled.</Empty>
      ) : (
        <SortableList
          items={current}
          keyOf={(x) => x}
          onChange={setOrder}
          render={(id) => {
            const m = byId.get(id);
            return (
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate">{m?.name ?? id}</span>
                <code className="truncate text-xs text-muted">{id}</code>
                {!m && <Badge tone="bad">not installed</Badge>}
                {m?.problems.length ? (
                  <Badge tone="warn" title={m.problems.join('\n')}>
                    {m.problems.length} issue(s)
                  </Badge>
                ) : null}
              </div>
            );
          }}
        />
      )}
      <p className="mt-3 text-xs text-muted">Mods load top to bottom. Dependencies should come before the mods that need them. Map mods must also be added on the Maps page.</p>
    </Card>
  );
}

function LocalModModal({ mod, onClose }: { mod: ModEntry | null; onClose: () => void }) {
  return (
    <Modal open={!!mod} onClose={onClose} title={mod?.name ?? ''} wide>
      {mod && (
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          {mod.poster ? <img src={mod.poster} className="w-full rounded" alt="" /> : <div />}
          <div className="space-y-2 text-sm">
            <div>
              <span className="label">Mod id</span> <code>{mod.id}</code>
            </div>
            {mod.author && (
              <div>
                <span className="label">Author</span> {mod.author}
              </div>
            )}
            <div>
              <span className="label">Folder</span>{' '}
              <code>
                {mod.folder}
                {mod.versionDir ? `/${mod.versionDir}` : ''}
              </code>
            </div>
            {[
              ['Requires', mod.require],
              ['Incompatible', mod.incompatible],
              ['Load after', mod.loadModAfter],
              ['Load before', mod.loadModBefore],
            ].map(([l, v]) =>
              (v as string[]).length ? (
                <div key={l as string}>
                  <span className="label">{l as string}</span> {(v as string[]).join(', ')}
                </div>
              ) : null,
            )}
            {mod.problems.length > 0 && (
              <Notice>
                {mod.problems.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </Notice>
            )}
            {mod.description && <p className="whitespace-pre-line text-muted">{mod.description.replace(/<LINE>/gi, '\n').replace(/<[^>]+>/g, '')}</p>}
          </div>
        </div>
      )}
    </Modal>
  );
}
