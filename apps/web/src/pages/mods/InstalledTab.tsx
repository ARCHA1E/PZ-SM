import type { ModEntry, ModsView, WorkshopItem } from '@pzsm/shared';
import clsx from 'clsx';
import { AlertTriangle, ArrowDownToLine, Check, Download, FolderOpen, Link2Off, Map as MapIcon, Search, Settings2, Trash2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, fmtBytes, fmtDay, post, useLive } from '../../api';
import { ActionButton, Badge, Empty, InfoTip, Toggle, Tooltip } from '../../components/ui';

export interface ModGroup {
  key: string;
  workshop?: WorkshopItem;
  mods: ModEntry[];
  title: string;
}

type Status = 'all' | 'enabled' | 'disabled' | 'problems' | 'updates' | 'missing' | 'choose';
type Sort = 'enabled' | 'name' | 'updated' | 'size' | 'popular';

export function buildGroups(view: ModsView): ModGroup[] {
  const groups: ModGroup[] = view.workshop.map((w) => {
    const mods = view.mods.filter((m) => m.workshopId === w.workshopId);
    return { key: w.workshopId, workshop: w, mods, title: w.title ?? mods[0]?.name ?? w.workshopId };
  });
  for (const m of view.mods.filter((x) => !x.workshopId)) groups.push({ key: `local:${m.id}`, mods: [m], title: m.name });
  return groups;
}

const groupEnabled = (g: ModGroup) => g.mods.some((m) => m.enabled);
const groupProblems = (g: ModGroup) => g.mods.flatMap((m) => m.problems);
const needsChoice = (g: ModGroup) => g.mods.length > 1 && !groupEnabled(g) && !!g.workshop?.inServerConfig;

export function InstalledTab({
  view,
  onToggle,
  onEnableMany,
  onOpen,
  onInstall,
}: {
  view: ModsView;
  onToggle: (m: ModEntry, on: boolean) => void;
  onEnableMany: (ids: string[], on: boolean) => void;
  onOpen: (g: ModGroup) => void;
  onInstall: (ids: string[]) => void;
}) {
  const task = useLive((s) => s.task);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [feature, setFeature] = useState<'' | 'sandbox' | 'maps'>('');
  const [sort, setSort] = useState<Sort>('enabled');
  const groups = useMemo(() => buildGroups(view), [view]);
  const listed = useMemo(() => new Set(view.workshop.filter((w) => w.inServerConfig).map((w) => w.workshopId)), [view]);

  const authors = useMemo(() => [...new Set(groups.map((g) => g.workshop?.author?.name ?? g.mods[0]?.author).filter((a): a is string => !!a))].sort((a, b) => a.localeCompare(b)), [groups]);
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of groups) for (const t of g.workshop?.tags ?? []) if (!/^Build 4[0-2]$/.test(t)) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [groups]);

  const counts: Record<Status, number> = {
    all: groups.length,
    enabled: groups.filter(groupEnabled).length,
    disabled: groups.filter((g) => !groupEnabled(g)).length,
    problems: groups.filter((g) => groupProblems(g).length > 0).length,
    updates: groups.filter((g) => g.workshop?.needsUpdate).length,
    missing: groups.filter((g) => g.workshop && !g.workshop.installed).length,
    choose: groups.filter(needsChoice).length,
  };

  const f = text.trim().toLowerCase();
  const list = groups
    .filter((g) => {
      if (status === 'enabled' && !groupEnabled(g)) return false;
      if (status === 'disabled' && groupEnabled(g)) return false;
      if (status === 'problems' && !groupProblems(g).length) return false;
      if (status === 'updates' && !g.workshop?.needsUpdate) return false;
      if (status === 'missing' && !(g.workshop && !g.workshop.installed)) return false;
      if (status === 'choose' && !needsChoice(g)) return false;
      if (author && (g.workshop?.author?.name ?? g.mods[0]?.author) !== author) return false;
      if (tags.length && !tags.every((t) => g.workshop?.tags?.includes(t))) return false;
      if (feature === 'sandbox' && !g.mods.some((m) => m.hasSandboxOptions)) return false;
      if (feature === 'maps' && !g.mods.some((m) => m.maps.length)) return false;
      if (f) {
        const hay = [g.title, g.key, g.workshop?.author?.name, ...(g.workshop?.tags ?? []), ...g.mods.flatMap((m) => [m.name, m.id, m.author])].join(' ').toLowerCase();
        if (!hay.includes(f)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'enabled':
          return Number(groupEnabled(b)) - Number(groupEnabled(a)) || a.title.localeCompare(b.title);
        case 'updated':
          return (b.workshop?.timeUpdated ?? 0) - (a.workshop?.timeUpdated ?? 0);
        case 'size':
          return (b.workshop?.size ?? 0) - (a.workshop?.size ?? 0);
        case 'popular':
          return (b.workshop?.subscriptions ?? 0) - (a.workshop?.subscriptions ?? 0);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const filtersOn = !!(f || status !== 'all' || author || tags.length || feature);
  const visibleMods = list.flatMap((g) => (g.mods.length === 1 ? g.mods : []));

  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted" />
            <input className="input pl-8" placeholder="Search name, mod id, author, tag or Workshop id…" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <select className="input w-auto max-w-[200px]" value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Author">
            <option value="">All authors</option>
            {authors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select className="input w-auto" value={feature} onChange={(e) => setFeature(e.target.value as typeof feature)} aria-label="Feature">
            <option value="">Any content</option>
            <option value="sandbox">Has sandbox options</option>
            <option value="maps">Adds maps</option>
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="enabled">Enabled first</option>
            <option value="name">Name</option>
            <option value="updated">Recently updated</option>
            <option value="popular">Most subscribers</option>
            <option value="size">Largest</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', 'All'],
              ['enabled', 'Enabled'],
              ['disabled', 'Disabled'],
              ['problems', 'Problems'],
              ['updates', 'Updates'],
              ['missing', 'Not downloaded'],
              ['choose', 'Pick a mod'],
            ] as [Status, string][]
          )
            .filter(([k]) => k === 'all' || k === 'enabled' || k === 'disabled' || counts[k] > 0)
            .map(([k, l]) => (
              <button key={k} className={clsx('chip', status === k && 'chip-on', k === 'problems' && status !== k && 'text-warn')} onClick={() => setStatus(k)}>
                {l} <span className="opacity-70">{counts[k]}</span>
              </button>
            ))}
          <InfoTip content={'"Pick a mod" lists Workshop items that contain several mods and none is enabled yet. Such items usually offer variants (e.g. lite/full), so choose the one you want.'} />
        </div>
        {tagCounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label mr-1">Tags</span>
            {tagCounts.slice(0, 24).map(([t, n]) => (
              <button key={t} className={clsx('chip', tags.includes(t) && 'chip-on')} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>
                {t} <span className="opacity-60">{n}</span>
              </button>
            ))}
            {tags.length === 0 && view.workshop.some((w) => !w.tags) && <InfoTip content="Tags and authors come from Steam. Use “Refresh from Steam” in the menu if some items have none yet." />}
          </div>
        )}
        {filtersOn && (
          <div className="flex items-center gap-3 text-xs text-muted">
            Showing {list.length} of {groups.length}
            <button
              className="inline-flex items-center gap-1 text-accent hover:underline"
              onClick={() => {
                setText('');
                setStatus('all');
                setAuthor('');
                setTags([]);
                setFeature('');
              }}
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
            {visibleMods.length > 1 && (
              <>
                <button className="text-accent hover:underline" onClick={() => onEnableMany(visibleMods.filter((m) => !m.enabled).map((m) => m.id), true)}>
                  Enable shown
                </button>
                <button className="text-accent hover:underline" onClick={() => onEnableMany(visibleMods.filter((m) => m.enabled).map((m) => m.id), false)}>
                  Disable shown
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <Empty>{groups.length ? 'No mods match these filters.' : 'No mods yet. Browse the Workshop to add some.'}</Empty>
      ) : (
        <div className="card divide-y divide-line/60 overflow-hidden">
          {list.map((g) => (
            <GroupRow key={g.key} g={g} busy={!!task} missingDeps={(g.workshop?.requiredItems ?? []).filter((d) => !listed.has(d))} onToggle={onToggle} onOpen={() => onOpen(g)} onInstall={onInstall} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupRow({ g, busy, missingDeps, onToggle, onOpen, onInstall }: { g: ModGroup; busy: boolean; missingDeps: string[]; onToggle: (m: ModEntry, on: boolean) => void; onOpen: () => void; onInstall: (ids: string[]) => void }) {
  const qc = useQueryClient();
  const w = g.workshop;
  const single = g.mods.length === 1 ? g.mods[0] : null;
  const problems = groupProblems(g);
  const enabled = groupEnabled(g);
  return (
    <div className={clsx('flex gap-3 px-3 py-2.5 transition hover:bg-panel2/40', !enabled && 'opacity-[0.85]')}>
      <div className="pt-1">
        {single ? (
          <Toggle checked={single.enabled} onChange={(v) => onToggle(single, v)} label={`Enable ${single.name}`} />
        ) : (
          <Tooltip content={g.mods.length ? `${g.mods.filter((m) => m.enabled).length} of ${g.mods.length} mods enabled; toggle them individually below` : 'Not downloaded yet'}>
            <span className={clsx('flex h-5 w-9 items-center justify-center rounded-full border text-[10px]', enabled ? 'border-accent/60 text-accent' : 'border-line text-muted')}>
              {g.mods.filter((m) => m.enabled).length}/{g.mods.length}
            </span>
          </Tooltip>
        )}
      </div>
      <button className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line bg-panel2" onClick={onOpen} aria-label={`Details for ${g.title}`}>
        {w?.preview ? <img src={w.preview} className="h-full w-full object-cover" alt="" loading="lazy" referrerPolicy="no-referrer" /> : single?.poster ? <img src={single.poster} className="h-full w-full object-cover" alt="" /> : <FolderOpen className="m-auto h-5 w-5 text-muted" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <button className="truncate text-left font-medium hover:text-accent" onClick={onOpen}>
            {g.title}
          </button>
          {(w?.author?.name || single?.author) && <span className="truncate text-xs text-muted">by {w?.author?.name ?? single?.author}</span>}
          {!w && <Badge>local</Badge>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {w && !w.installed && <Badge tone="warn">not downloaded</Badge>}
          {w?.needsUpdate && <Badge tone="accent">update available</Badge>}
          {w && !w.inServerConfig && (
            <Tooltip content="Downloaded but not in WorkshopItems=, so the server won't keep it updated. Enabling one of its mods adds it.">
              <Badge>unlisted</Badge>
            </Tooltip>
          )}
          {needsChoice(g) && <Badge tone="warn">pick a mod</Badge>}
          {(w?.tags ?? [])
            .filter((t) => !/^Build 4[0-2]$/.test(t))
            .slice(0, 4)
            .map((t) => (
              <Badge key={t} className="text-[10px]">
                {t}
              </Badge>
            ))}
          {w?.tags?.includes('Build 41') && !w.tags.includes('Build 42') && <Badge tone="warn">B41 tag</Badge>}
        </div>
        {single ? (
          <ModLine m={single} showName={single.name !== g.title} />
        ) : (
          g.mods.length > 0 && (
            <div className="mt-1.5 space-y-1 border-l-2 border-line pl-3">
              {g.mods.map((m) => (
                <div key={m.id} className="flex items-start gap-2">
                  <Toggle checked={m.enabled} onChange={(v) => onToggle(m, v)} label={`Enable ${m.name}`} />
                  <div className="min-w-0 flex-1">
                    <ModLine m={m} showName />
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {problems.length > 0 && (
          <Tooltip content={<ul className="list-inside list-disc">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}>
            <span className="mt-1 inline-flex items-start gap-1 text-xs text-warn">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {problems[0]}
              {problems.length > 1 && ` (+${problems.length - 1})`}
            </span>
          </Tooltip>
        )}
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1 text-right text-[11px] text-muted md:flex">
        {w?.timeUpdated && <span>upd. {fmtDay(w.timeUpdated)}</span>}
        {!!w?.size && <span>{fmtBytes(w.size)}</span>}
      </div>
      {w && (
        <div className="flex shrink-0 items-start gap-0.5">
          {(w.needsUpdate || !w.installed) && (
            <ActionButton variant="ghost" className="px-2" disabled={busy} onAction={() => post('/api/workshop/download', { ids: [w.workshopId] })} title={w.installed ? 'Download the update' : 'Download now'}>
              {w.installed ? <ArrowDownToLine className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            </ActionButton>
          )}
          {missingDeps.length > 0 && (
            <Tooltip content={`Requires ${missingDeps.length} Workshop item(s) that aren't added yet`}>
              <button className="btn btn-ghost px-2 text-warn" onClick={() => onInstall(missingDeps)} aria-label="Install missing requirements">
                <Link2Off className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
          <ActionButton variant="ghost" className="px-2" onAction={() => del(`/api/workshop/${w.workshopId}`).then(() => qc.invalidateQueries({ queryKey: ['mods'] }))} confirm={`Remove "${g.title}" from the server and disable its mods? Downloaded files are kept.`} title="Remove from server">
            <Trash2 className="h-4 w-4" />
          </ActionButton>
        </div>
      )}
    </div>
  );
}

function ModLine({ m, showName }: { m: ModEntry; showName: boolean }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
      {showName && <span className={clsx('font-medium', m.enabled ? 'text-fg' : '')}>{m.name}</span>}
      <code className="text-[11px]">{m.id}</code>
      {m.versionDir && <span>{m.versionDir}/</span>}
      {m.require.length > 0 && (
        <Tooltip content={`Requires: ${m.require.join(', ')}`}>
          <span className="cursor-help underline decoration-dotted underline-offset-2">needs {m.require.length}</span>
        </Tooltip>
      )}
      {m.hasSandboxOptions && (
        <Link className="inline-flex items-center gap-0.5 text-accent hover:underline" to={`/settings/sandbox?mod=${encodeURIComponent(m.id)}`}>
          <Settings2 className="h-3 w-3" /> configure
        </Link>
      )}
      {m.maps.length > 0 && (
        <Tooltip content={`Adds map folder(s): ${m.maps.join(', ')}. Add them on the Maps page.`}>
          <Link className="inline-flex items-center gap-0.5 text-accent hover:underline" to="/maps">
            <MapIcon className="h-3 w-3" /> {m.maps.length} map{m.maps.length > 1 ? 's' : ''}
          </Link>
        </Tooltip>
      )}
      {m.enabled && !m.problems.length && <Check className="h-3 w-3 text-ok" aria-label="enabled, no problems" />}
    </div>
  );
}
