import { useQueryClient } from '@tanstack/react-query';
import type { ConfigImportOptions, ConfigImportPreview } from '@pzsm/shared';
import clsx from 'clsx';
import { CheckCircle2, FileText, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { api, del, post, toast, toastError, useLive } from '../api';
import { Badge, Button, Modal, Notice, Toggle } from './ui';

const KIND_LABEL: Record<string, string> = {
  ini: 'Server options (.ini)',
  sandbox: 'Sandbox settings (SandboxVars.lua)',
  spawnregions: 'Spawn regions',
  spawnpoints: 'Spawn points',
};

/** Upload the config files a server was set up with in-game, review them, then install them here. */
export function ImportConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const task = useLive((s) => s.task);
  const [p, setP] = useState<ConfigImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [showMods, setShowMods] = useState(false);
  const [opts, setOpts] = useState<ConfigImportOptions>({ keepPorts: true, wipeWorld: false, downloadMods: true, startAfter: false });

  const close = () => {
    if (p) void del(`/api/import/config/${p.id}`).catch(() => undefined);
    setP(null);
    setShowMods(false);
    onClose();
  };

  const upload = async (files: FileList | File[]) => {
    const list = [...files];
    if (!list.length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      for (const f of list) fd.append('files', f, f.name);
      const r = await api<ConfigImportPreview>('/api/import/config', { method: 'POST', body: fd });
      setP(r);
      setOpts((o) => ({ ...o, wipeWorld: false, startAfter: r.current.serverRunning }));
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!p) return;
    if (p.current.serverRunning && !window.confirm('The server will be stopped (players are disconnected), the config installed, and the server started again. Continue?')) return;
    if (opts.wipeWorld && !window.confirm('Delete the current world save? A backup is taken first.')) return;
    setBusy(true);
    try {
      await post(`/api/import/config/${p.id}/apply`, opts);
      toast('Importing… progress is shown at the top of the page');
      setP(null);
      onClose();
      setTimeout(() => void qc.invalidateQueries(), 1500);
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const s = p?.summary;
  return (
    <Modal open={open} onClose={close} title="Import server config from the game" wide>
      {!p ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Choose the files of a server you set up in Project Zomboid (Host / server settings). On Windows they are in{' '}
            <code className="text-fg">%USERPROFILE%\Zomboid\Server\</code>:
          </p>
          <ul className="ml-4 list-disc font-mono text-xs text-muted">
            <li>&lt;name&gt;.ini</li>
            <li>&lt;name&gt;_SandboxVars.lua</li>
            <li>&lt;name&gt;_spawnregions.lua</li>
            <li>&lt;name&gt;_spawnpoints.lua</li>
          </ul>
          <p className="text-sm text-muted">Select them together (or a .zip containing them). They are renamed for this server; nothing is changed until you review and confirm.</p>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void upload(e.dataTransfer.files);
            }}
            className={clsx('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-sm', drag ? 'border-accent bg-accent/10' : 'border-line hover:border-accent')}
          >
            <Upload className="h-6 w-6 text-muted" />
            {busy ? 'Reading files…' : 'Drop the files here, or click to choose'}
            <input type="file" multiple accept=".ini,.lua,.zip" className="hidden" disabled={busy} onChange={(e) => e.target.files && void upload(e.target.files)} />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              Config <b>{p.sourceName ?? '(unknown)'}</b> → this server <b>{p.targetName}</b>
            </span>
            {s?.publicName && <Badge tone="accent">{s.publicName}</Badge>}
          </div>

          {p.errors.length > 0 && (
            <Notice tone="bad">
              {p.errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </Notice>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="label">Files</div>
              {(['ini', 'sandbox', 'spawnregions', 'spawnpoints'] as const).map((k) => {
                const f = p.files.find((x) => x.kind === k);
                return (
                  <div key={k} className="flex items-center gap-2 text-sm">
                    {f ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <XCircle className="h-4 w-4 text-muted" />}
                    <span className={f ? '' : 'text-muted'}>{KIND_LABEL[k]}</span>
                    {f && <span className="truncate font-mono text-[11px] text-muted">{f.name}</span>}
                  </div>
                );
              })}
              {p.ignored.length > 0 && <div className="text-xs text-muted">Ignored: {p.ignored.join(', ')}</div>}
            </div>
            <div className="space-y-1 text-sm">
              <div className="label">What it sets up</div>
              <div>
                <b>{s!.mods.length}</b> mods from <b>{s!.workshopItems.length}</b> Workshop items
                {p.workshopToDownload.length > 0 && <span className="text-muted"> ({p.workshopToDownload.length} to download)</span>}
                {s!.mods.length > 0 && (
                  <button className="ml-2 text-xs text-accent underline" onClick={() => setShowMods(!showMods)}>
                    {showMods ? 'hide' : 'show'}
                  </button>
                )}
              </div>
              <div>Maps: {s!.maps.join(' · ') || '—'}</div>
              <div>
                Sandbox: {s!.sandboxOptions} options{s!.sandboxNamespaces.length ? `, ${s!.sandboxNamespaces.length} sections` : ''}
                {s!.sandboxVersion !== undefined && ` (v${s!.sandboxVersion})`}
              </div>
              <div>Spawn regions: {s!.spawnRegions.length ? s!.spawnRegions.join(', ') : '—'}</div>
              {s!.maxPlayers && <div>Max players: {s!.maxPlayers}</div>}
              {s!.hasPassword && <div className="text-warn">Includes a server join password</div>}
            </div>
          </div>
          {showMods && (
            <div className="max-h-40 overflow-y-auto rounded border border-line bg-panel2 p-2 font-mono text-[11px] text-muted">
              {s!.mods.map((m, i) => (
                <div key={m}>
                  {i + 1}. {m}
                </div>
              ))}
            </div>
          )}

          {(p.warnings.length > 0 || p.unknownIniKeys.length > 0) && (
            <Notice>
              {p.warnings.map((w) => (
                <div key={w}>{w}</div>
              ))}
              {p.unknownIniKeys.length > 0 && (
                <div>
                  {p.unknownIniKeys.length} ini key(s) aren't used by this game build and will be kept as-is: <span className="font-mono text-xs">{p.unknownIniKeys.slice(0, 12).join(', ')}{p.unknownIniKeys.length > 12 ? '…' : ''}</span>
                </div>
              )}
            </Notice>
          )}

          <div className="space-y-2 rounded-md border border-line p-3">
            <Option checked={opts.keepPorts} onChange={(v) => setOpts({ ...opts, keepPorts: v })} title="Keep this server's ports" hint="Recommended: the game ports must match the ports published by Docker/LXC. RCON stays managed by PZ-SM either way." />
            <Option
              checked={opts.downloadMods}
              onChange={(v) => setOpts({ ...opts, downloadMods: v })}
              title="Download the Workshop mods now"
              hint={p.workshopToDownload.length ? `${p.workshopToDownload.length} item(s) to download with SteamCMD. Otherwise the server fetches them on its next start.` : 'All items are already downloaded; updates are checked.'}
            />
            <Option
              checked={opts.wipeWorld}
              onChange={(v) => setOpts({ ...opts, wipeWorld: v })}
              title="Start a fresh world"
              hint={p.current.hasWorld ? 'Deletes the current world save (accounts, roles and bans are kept). A backup is taken first.' : 'There is no world yet; one is created on first start.'}
              danger
            />
            {!p.current.serverRunning && <Option checked={opts.startAfter} onChange={(v) => setOpts({ ...opts, startAfter: v })} title="Start the server when done" />}
            {p.current.hasConfig && <p className="text-xs text-muted">The current config is backed up first; you can restore it from Backups.</p>}
          </div>

          <div className="flex justify-between gap-2">
            <Button
              onClick={() => {
                void del(`/api/import/config/${p.id}`).catch(() => undefined);
                setP(null);
              }}
            >
              <FileText className="h-4 w-4" /> Choose other files
            </Button>
            <div className="flex gap-2">
              <Button onClick={close}>Cancel</Button>
              <Button variant="primary" busy={busy} disabled={p.errors.length > 0 || !!task} onClick={apply} title={task ? `Busy: ${task.label}` : undefined}>
                {p.current.serverRunning ? 'Stop server & import' : 'Import'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Option({ checked, onChange, title, hint, danger }: { checked: boolean; onChange: (v: boolean) => void; title: string; hint?: string; danger?: boolean }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <span className="mt-0.5">
        <Toggle checked={checked} onChange={onChange} label={title} />
      </span>
      <span>
        <span className={clsx('font-medium', danger && checked && 'text-bad')}>{title}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
