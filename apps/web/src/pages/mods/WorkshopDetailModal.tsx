import { useQuery } from '@tanstack/react-query';
import type { ModEntry, WorkshopItemDetails } from '@pzsm/shared';
import { Download, ExternalLink, Heart, Settings2, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtBytes, fmtDay, get } from '../../api';
import { Badge, Button, ErrorBox, Modal, Notice, Spinner, Toggle, Tooltip } from '../../components/ui';
import { bbcodeToHtml } from './bbcode';

type Detail = Omit<WorkshopItemDetails, 'requiredItems'> & { requiredItems: (WorkshopItemDetails['requiredItems'][number] & { inServer?: boolean; installed?: boolean })[] };

export function WorkshopDetailModal({
  workshopId,
  onClose,
  mods = [],
  onInstall,
  onToggleMod,
}: {
  workshopId: string | null;
  onClose: () => void;
  /** Installed mods from this item (when installed). */
  mods?: ModEntry[];
  onInstall: (ids: string[]) => void;
  onToggleMod?: (m: ModEntry, on: boolean) => void;
}) {
  const q = useQuery({
    queryKey: ['workshop-item', workshopId],
    queryFn: () => get<Detail>(`/api/workshop/item/${workshopId}`),
    enabled: !!workshopId,
    staleTime: 5 * 60_000,
  });
  const d = q.data;
  const missingDeps = d?.requiredItems.filter((r) => !r.inServer) ?? [];
  return (
    <Modal open={!!workshopId} onClose={onClose} title={d?.title ?? (mods[0]?.name || 'Workshop item')} wide>
      {q.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> Loading from the Workshop…
        </div>
      )}
      {q.error && <ErrorBox error={q.error} />}
      {d && (
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="space-y-3">
            {d.preview && <img src={d.preview} className="aspect-square w-full rounded-lg border border-line object-cover" alt="" />}
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {d.stars !== undefined && d.stars > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current text-warn" /> {d.stars}/5{d.votes ? ` (${d.votes})` : ''}
                </span>
              )}
              {d.subscriptions !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {d.subscriptions.toLocaleString()}
                </span>
              )}
              {d.favorited !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {d.favorited.toLocaleString()}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted">Author</dt>
              <dd>{d.author.name ?? d.author.steamid}</dd>
              {d.timeUpdated && (
                <>
                  <dt className="text-muted">Updated</dt>
                  <dd>{fmtDay(d.timeUpdated)}</dd>
                </>
              )}
              {d.timeCreated && (
                <>
                  <dt className="text-muted">Created</dt>
                  <dd>{fmtDay(d.timeCreated)}</dd>
                </>
              )}
              {!!d.size && (
                <>
                  <dt className="text-muted">Size</dt>
                  <dd>{fmtBytes(d.size)}</dd>
                </>
              )}
              <dt className="text-muted">Id</dt>
              <dd className="font-mono">{d.workshopId}</dd>
            </dl>
            <div className="flex flex-wrap gap-1">
              {d.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {d.installed ? (
                <Badge tone="ok" className="justify-center py-1">
                  Installed
                </Badge>
              ) : (
                <Button variant="primary" onClick={() => onInstall([d.workshopId])}>
                  <Download className="h-4 w-4" /> {d.isCollection ? `Install collection (${d.collectionItems?.length ?? d.numChildren} items)` : d.inServer ? 'Download' : 'Install'}
                </Button>
              )}
              <a className="btn" href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${d.workshopId}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open on Steam
              </a>
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            {d.tags.includes('Build 41') && !d.tags.includes('Build 42') && <Notice>This item is tagged for Build 41 only. It will probably not load on a Build 42 server.</Notice>}
            {d.requiredItemsUnknown && <Notice>Required items could not be checked: {d.requiredItemsUnknown}</Notice>}
            {d.requiredItems.length > 0 && (
              <section>
                <h4 className="label mb-1.5">Required items</h4>
                <ul className="divide-y divide-line/60 rounded-lg border border-line">
                  {d.requiredItems.map((r) => (
                    <li key={r.workshopId} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{r.title ?? r.workshopId}</span>
                      {r.installed ? <Badge tone="ok">installed</Badge> : r.inServer ? <Badge tone="warn">not downloaded</Badge> : d.installed ? <Badge tone="bad">missing</Badge> : <Badge tone="accent">added on install</Badge>}
                    </li>
                  ))}
                </ul>
                {d.installed && missingDeps.length > 0 && (
                  <Button className="mt-2" onClick={() => onInstall(missingDeps.map((r) => r.workshopId))}>
                    <Download className="h-4 w-4" /> Install {missingDeps.length} missing requirement{missingDeps.length > 1 ? 's' : ''}
                  </Button>
                )}
              </section>
            )}
            {mods.length > 0 && (
              <section>
                <h4 className="label mb-1.5">Mods in this item</h4>
                <ul className="divide-y divide-line/60 rounded-lg border border-line">
                  {mods.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                      {onToggleMod && <Toggle checked={m.enabled} onChange={(v) => onToggleMod(m, v)} label={`Enable ${m.name}`} />}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{m.name}</div>
                        <div className="font-mono text-xs text-muted">
                          {m.id}
                          {m.versionDir ? ` · ${m.versionDir}/` : ''}
                        </div>
                        {m.require.length > 0 && <div className="text-xs text-muted">requires {m.require.join(', ')}</div>}
                        {m.incompatible.length > 0 && <div className="text-xs text-warn">incompatible with {m.incompatible.join(', ')}</div>}
                        {m.problems.map((p) => (
                          <div key={p} className="text-xs text-warn">
                            {p}
                          </div>
                        ))}
                      </div>
                      {m.hasSandboxOptions && (
                        <Tooltip content="Open this mod's sandbox options">
                          <Link className="btn btn-ghost px-2 py-1 text-xs" to={`/settings/sandbox?mod=${encodeURIComponent(m.id)}`} onClick={onClose}>
                            <Settings2 className="h-3.5 w-3.5" /> Configure
                          </Link>
                        </Tooltip>
                      )}
                      {m.maps.map((x) => (
                        <Badge key={x} tone="accent">
                          map: {x}
                        </Badge>
                      ))}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {d.description && <div className="bb max-h-[55vh] overflow-y-auto rounded-lg border border-line bg-panel2/40 p-4 text-sm" dangerouslySetInnerHTML={{ __html: bbcodeToHtml(d.description) }} />}
          </div>
        </div>
      )}
    </Modal>
  );
}
