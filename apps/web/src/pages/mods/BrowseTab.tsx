import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { WorkshopBrowseItem, WorkshopBrowseResult, WorkshopSort } from '@pzsm/shared';
import clsx from 'clsx';
import { Boxes, Check, ChevronLeft, ChevronRight, Download, Minus, Plus, Search, Star, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fmtBytes, fmtDay, get, useDebounced } from '../../api';
import { Badge, Button, Empty, ErrorBox, InfoTip, Spinner, Tooltip } from '../../components/ui';

const SORTS: { value: WorkshopSort; label: string }[] = [
  { value: 'trend', label: 'Most popular' },
  { value: 'totaluniquesubscribers', label: 'Most subscribed (all time)' },
  { value: 'toprated', label: 'Top rated' },
  { value: 'mostrecent', label: 'Newest' },
  { value: 'lastupdated', label: 'Recently updated' },
  { value: 'textsearch', label: 'Best match' },
];
const DAYS = [
  { value: 1, label: 'today' },
  { value: 7, label: 'this week' },
  { value: 30, label: 'this month' },
  { value: 90, label: '3 months' },
  { value: 365, label: 'all time' },
];
/** Shown first in the tag list; the rest follow alphabetically. */
const PRIMARY_TAGS = ['Build 42', 'Build 41', 'Map', 'Framework', 'Multiplayer', 'QOL'];

type TagState = 'include' | 'exclude';

export function BrowseTab({ onOpen, onInstall }: { onOpen: (id: string) => void; onInstall: (ids: string[]) => void }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 400);
  const [sort, setSort] = useState<WorkshopSort>('trend');
  const [days, setDays] = useState(7);
  const [section, setSection] = useState<'items' | 'collections'>('items');
  const [tags, setTags] = useState<Record<string, TagState>>({ 'Build 42': 'include' });
  const [page, setPage] = useState(1);
  const [showAllTags, setShowAllTags] = useState(false);
  useEffect(() => setPage(1), [dq, sort, days, section, tags]);

  const include = Object.entries(tags).filter(([, v]) => v === 'include').map(([k]) => k);
  const exclude = Object.entries(tags).filter(([, v]) => v === 'exclude').map(([k]) => k);
  const params = new URLSearchParams();
  if (dq.trim()) params.set('q', dq.trim());
  params.set('sort', dq.trim() && sort === 'trend' ? 'textsearch' : sort);
  if (sort === 'trend') params.set('days', String(days));
  if (include.length) params.set('tags', include.join(','));
  if (exclude.length) params.set('excludeTags', exclude.join(','));
  params.set('page', String(page));
  params.set('section', section);
  const r = useQuery({
    queryKey: ['workshop-browse', params.toString()],
    queryFn: () => get<WorkshopBrowseResult>(`/api/workshop/browse?${params}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
  const data = r.data;
  const allTags = data?.availableTags ?? PRIMARY_TAGS;
  const orderedTags = [...PRIMARY_TAGS.filter((t) => allTags.includes(t)), ...allTags.filter((t) => !PRIMARY_TAGS.includes(t)).sort()];
  const visibleTags = showAllTags ? orderedTags : orderedTags.slice(0, 14);
  const cycle = (t: string) =>
    setTags((s) => {
      const n = { ...s };
      if (!n[t]) n[t] = 'include';
      else if (n[t] === 'include') n[t] = 'exclude';
      else delete n[t];
      return n;
    });

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted" />
            <input className="input pl-8" placeholder={section === 'items' ? 'Search the Workshop…' : 'Search collections…'} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="inline-flex rounded-md border border-line p-0.5">
            {(['items', 'collections'] as const).map((s) => (
              <button key={s} className={clsx('rounded px-3 py-1 text-sm', section === s ? 'bg-accent/15 text-accent' : 'text-muted hover:text-fg')} onClick={() => setSection(s)}>
                {s === 'items' ? 'Mods' : 'Collections'}
              </button>
            ))}
          </div>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as WorkshopSort)} aria-label="Sort">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {sort === 'trend' && (
            <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <InfoTip content="Click a tag once to require it, again to exclude it, and a third time to clear it. Build 42 is required by default so you only see mods for this server's game version." />
          {visibleTags.map((t) => (
            <button key={t} onClick={() => cycle(t)} className={clsx('chip', tags[t] === 'include' && 'chip-on', tags[t] === 'exclude' && 'border-bad/60 bg-bad/10 text-bad line-through')}>
              {tags[t] === 'include' ? <Check className="h-3 w-3" /> : tags[t] === 'exclude' ? <Minus className="h-3 w-3" /> : null}
              {t}
            </button>
          ))}
          {orderedTags.length > 14 && (
            <button className="chip" onClick={() => setShowAllTags(!showAllTags)}>
              {showAllTags ? 'Fewer tags' : `+${orderedTags.length - 14} more`}
            </button>
          )}
          {Object.keys(tags).length > 0 && (
            <button className="chip" onClick={() => setTags({})}>
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {r.error && <ErrorBox error={r.error} />}
      {r.isLoading && (
        <div className="flex items-center gap-2 p-4 text-muted">
          <Spinner /> Searching the Workshop…
        </div>
      )}
      {data && (
        <>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {data.total.toLocaleString()} result{data.total === 1 ? '' : 's'}
              {r.isFetching && <Spinner className="ml-2 inline h-3.5 w-3.5" />}
            </span>
            <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </div>
          {data.items.length === 0 ? (
            <Empty>Nothing found. Try fewer tags or a different search.</Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {data.items.map((it) => (
                <BrowseCard key={it.workshopId} item={it} onOpen={() => onOpen(it.workshopId)} onInstall={() => onInstall([it.workshopId])} />
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" className="px-2" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs">
        Page {page} / {totalPages.toLocaleString()}
      </span>
      <Button variant="ghost" className="px-2" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function BrowseCard({ item, onOpen, onInstall }: { item: WorkshopBrowseItem; onOpen: () => void; onInstall: () => void }) {
  const b41only = item.tags.includes('Build 41') && !item.tags.includes('Build 42');
  return (
    <div className="card group flex overflow-hidden transition hover:border-accent/50">
      <button className="relative w-28 shrink-0 bg-panel2" onClick={onOpen} aria-label={`Details for ${item.title}`}>
        {item.preview ? <img src={item.preview} className="h-full w-full object-cover" alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Boxes className="m-auto h-8 w-8 text-muted" />}
        {item.isCollection && (
          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {item.numChildren} items
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <button className="text-left text-sm font-semibold leading-snug hover:text-accent" onClick={onOpen}>
          <span className="line-clamp-2">{item.title}</span>
        </button>
        <div className="mt-0.5 truncate text-xs text-muted">by {item.author.name ?? item.author.steamid}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
          {!!item.stars && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current text-warn" />
              {item.stars}
            </span>
          )}
          {item.subscriptions !== undefined && (
            <Tooltip content="Current subscribers">
              <span className="inline-flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {item.subscriptions.toLocaleString()}
              </span>
            </Tooltip>
          )}
          {item.timeUpdated && <span>upd. {fmtDay(item.timeUpdated)}</span>}
          {!!item.size && <span>{fmtBytes(item.size)}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.tags
            .filter((t) => !/^Build 4[0-2]$/.test(t))
            .slice(0, 4)
            .map((t) => (
              <Badge key={t} className="text-[10px]">
                {t}
              </Badge>
            ))}
          {b41only && <Badge tone="warn">B41 only</Badge>}
          {!!item.numChildren && !item.isCollection && (
            <Tooltip content="This item lists other Workshop items it needs. They're added automatically when you install it.">
              <Badge tone="accent">+{item.numChildren} required</Badge>
            </Tooltip>
          )}
        </div>
        <div className="mt-auto flex items-center justify-end pt-2">
          {item.installed ? (
            <Badge tone="ok">
              <Check className="h-3 w-3" /> Installed
            </Badge>
          ) : item.inServer ? (
            <Button className="px-2 py-1 text-xs" onClick={onInstall}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          ) : (
            <Button variant="primary" className="px-2 py-1 text-xs" onClick={onInstall}>
              <Plus className="h-3.5 w-3.5" /> Install
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
