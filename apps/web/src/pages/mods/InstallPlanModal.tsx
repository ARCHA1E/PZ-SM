import { useQueryClient } from '@tanstack/react-query';
import type { WorkshopInstallPlan } from '@pzsm/shared';
import { Boxes, Download, Link2, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { post, toast, toastError, useLive } from '../../api';
import { Badge, Button, ErrorBox, Modal, Notice, Spinner, ToggleRow } from '../../components/ui';

/**
 * Resolve Workshop ids/URLs (expanding collections and "Required items"), let the admin
 * review the list, then add + download + enable everything in one go.
 */
export function InstallPlanModal({ refs, open, onClose, allowInput }: { refs: string[]; open: boolean; onClose: () => void; allowInput?: boolean }) {
  const qc = useQueryClient();
  const task = useLive((s) => s.task);
  const [text, setText] = useState('');
  const [plan, setPlan] = useState<WorkshopInstallPlan | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [autoEnable, setAutoEnable] = useState(true);
  const [busy, setBusy] = useState(false);

  const resolve = async (list: string[]) => {
    if (!list.length) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const p = await post<WorkshopInstallPlan>('/api/workshop/plan', { refs: list });
      setPlan(p);
      setSelected(new Set(p.items.filter((i) => !i.alreadyInServer || !i.installed).map((i) => i.workshopId)));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setPlan(null);
    setError(null);
    setText('');
    if (refs.length) void resolve(refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refs.join(',')]);

  const toInstall = plan?.items.filter((i) => selected.has(i.workshopId)) ?? [];
  const install = async () => {
    setBusy(true);
    try {
      await post('/api/workshop/install', { ids: toInstall.map((i) => i.workshopId), enable: autoEnable ? 'auto' : 'none' });
      toast(`Installing ${toInstall.length} Workshop item(s)…`);
      void qc.invalidateQueries({ queryKey: ['mods'] });
      void qc.invalidateQueries({ queryKey: ['workshop-browse'] });
      onClose();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const icon = (r: string) => (r === 'dependency' ? <Link2 className="h-3.5 w-3.5" /> : r === 'collection' ? <Boxes className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />);
  const title = (id?: string) => plan?.items.find((i) => i.workshopId === id)?.title ?? id;

  return (
    <Modal open={open} onClose={onClose} title="Install from the Workshop" wide>
      <div className="space-y-3">
        {allowInput && !refs.length && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Paste Workshop item or collection IDs/URLs (one per line). Collections are expanded and required items are added automatically.</p>
            <textarea
              className="input min-h-[110px] font-mono text-xs"
              placeholder={'2392709985\nhttps://steamcommunity.com/sharedfiles/filedetails/?id=2875848298'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={() => resolve(text.split(/[\s,]+/).filter(Boolean))} busy={loading} disabled={!text.trim()}>
                Check dependencies
              </Button>
            </div>
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Resolving collections and required items…
          </div>
        )}
        {!!error && <ErrorBox error={error} />}
        {plan && (
          <>
            {plan.warnings?.map((w) => (
              <Notice key={w}>
                {w}. Those items are listed, but anything they need is missing from this plan. You can install now and use the missing-requirements button on the Installed tab later, or close this and try again in a few minutes.
              </Notice>
            ))}
            {plan.unavailable.length > 0 && <Notice tone="bad">Not available on the Workshop (removed, private or wrong id): {plan.unavailable.join(', ')}</Notice>}
            <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        checked={plan.items.length > 0 && selected.size === plan.items.length}
                        onChange={(e) => setSelected(new Set(e.target.checked ? plan.items.map((i) => i.workshopId) : []))}
                        aria-label="Select all"
                      />
                    </th>
                    <th>Item</th>
                    <th>Why</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((i) => (
                    <tr key={i.workshopId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(i.workshopId)}
                          onChange={(e) => {
                            const n = new Set(selected);
                            if (e.target.checked) n.add(i.workshopId);
                            else n.delete(i.workshopId);
                            setSelected(n);
                          }}
                          aria-label={`Install ${i.title ?? i.workshopId}`}
                        />
                      </td>
                      <td>
                        <div className="font-medium">{i.title ?? i.workshopId}</div>
                        <a className="font-mono text-xs text-muted hover:text-accent" href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${i.workshopId}`} target="_blank" rel="noreferrer">
                          {i.workshopId}
                        </a>
                      </td>
                      <td className="text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          {icon(i.reason)}
                          {i.reason === 'requested' ? 'Requested' : i.reason === 'collection' ? `In collection ${title(i.via)}` : `Required by ${title(i.via)}`}
                        </span>
                      </td>
                      <td>
                        {i.installed ? <Badge tone="ok">installed</Badge> : i.alreadyInServer ? <Badge tone="warn">added, not downloaded</Badge> : <Badge>new</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan.items.some((i) => i.reason === 'dependency' && !selected.has(i.workshopId) && !i.installed) && (
              <Notice>Some required items are unchecked; the mods that need them will not load without them.</Notice>
            )}
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
              <ToggleRow
                checked={autoEnable}
                onChange={setAutoEnable}
                label="Enable mods after download"
                tip="Items that contain a single mod are enabled (with anything they require) and placed in dependency order. Items with several mods are often variants of each other, so you pick those yourself on the Installed tab."
              />
              <div className="ml-auto flex gap-2">
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="primary" busy={busy} disabled={!toInstall.length || !!task} onClick={install} title={task ? `Busy: ${task.label}` : undefined}>
                  <Download className="h-4 w-4" /> Install {toInstall.length} item{toInstall.length === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
