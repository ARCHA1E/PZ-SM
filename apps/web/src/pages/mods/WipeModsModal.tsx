import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModWipeResult } from '@pzsm/shared';
import clsx from 'clsx';
import { Eraser, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { get, post, toast, useLive } from '../../api';
import { ActionButton, ErrorBox, Modal, Notice, Spinner, ToggleRow } from '../../components/ui';

type Preview = Omit<ModWipeResult, 'backup' | 'deletedFiles'> & { modNamespaces: string[] };

export function WipeModsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const status = useLive((s) => s.status);
  const [mode, setMode] = useState<'all' | 'sandbox'>('all');
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const p = useQuery({ queryKey: ['mod-wipe-preview'], queryFn: () => get<Preview>('/api/mods/wipe/preview'), enabled: open });
  const stopped = !status || status.state === 'stopped' || status.state === 'crashed' || status.state === 'not-installed';
  const d = p.data;
  const needsTyping = mode === 'all';
  return (
    <Modal open={open} onClose={onClose} title="Remove mods / reset mod settings">
      <div className="space-y-4 text-sm">
        <div className="grid gap-2">
          {(
            [
              ['all', Eraser, 'Remove all mods', 'Clears Mods= and WorkshopItems=, removes every mod section from SandboxVars, keeps only vanilla maps in Map= and drops spawn regions on mod maps. All vanilla server and sandbox settings stay as they are.'],
              ['sandbox', RotateCcw, 'Reset mod sandbox options only', 'Keeps your mods enabled but throws away their sandbox settings and writes their defaults back. Vanilla sandbox settings are untouched.'],
            ] as const
          ).map(([k, Icon, title, text]) => (
            <button key={k} onClick={() => setMode(k)} className={clsx('flex gap-3 rounded-lg border p-3 text-left transition', mode === k ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/50')}>
              <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', mode === k ? 'text-accent' : 'text-muted')} />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-xs text-muted">{text}</span>
              </span>
            </button>
          ))}
        </div>
        {p.isLoading && <Spinner />}
        {p.error && <ErrorBox error={p.error} />}
        {d && (
          <div className="rounded-lg border border-line bg-panel2/50 p-3 text-xs">
            <div className="label mb-1">This will remove</div>
            <ul className="list-inside list-disc space-y-0.5">
              {mode === 'all' && <li>{d.removedMods} enabled mod(s) and {d.removedWorkshopItems} Workshop item(s) from the server config</li>}
              <li>
                {d.removedSandboxKeys} mod sandbox value(s) in {d.modNamespaces.length} section(s)
                {d.modNamespaces.length > 0 && <span className="text-muted"> ({d.modNamespaces.slice(0, 8).join(', ')}{d.modNamespaces.length > 8 ? '…' : ''})</span>}
              </li>
              {mode === 'all' && d.removedMaps.length > 0 && <li>Mod maps from Map=: {d.removedMaps.join(', ')}</li>}
              {mode === 'all' && d.removedSpawnRegions > 0 && <li>{d.removedSpawnRegions} spawn region(s) on mod maps</li>}
            </ul>
          </div>
        )}
        {mode === 'all' && (
          <ToggleRow
            checked={deleteFiles}
            onChange={setDeleteFiles}
            label="Also delete downloaded Workshop files"
            tip="Frees disk space. Leave off if you might re-add these mods soon: keeping the files saves re-downloading them."
          />
        )}
        <Notice tone="accent">A backup of the config and save is taken first (kind "pre-mod-wipe" on the Backups page). The world save itself is not touched, but a world that relied on map or item mods may not load cleanly without them.</Notice>
        {!stopped && <Notice tone="bad">Stop the server first.</Notice>}
        {needsTyping && (
          <label className="block space-y-1">
            <span className="label">Type REMOVE to confirm</span>
            <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <ActionButton
            variant="danger"
            disabled={!stopped || (needsTyping && confirmText.trim().toUpperCase() !== 'REMOVE')}
            onAction={async () => {
              const r = await post<ModWipeResult>('/api/mods/wipe', { sandboxOnly: mode === 'sandbox', deleteFiles: mode === 'all' && deleteFiles });
              toast(mode === 'sandbox' ? `Reset ${r.removedSandboxKeys} mod sandbox value(s)` : `Removed ${r.removedMods} mod(s) and ${r.removedSandboxKeys} mod sandbox value(s)`);
              setConfirmText('');
              await Promise.all([qc.invalidateQueries({ queryKey: ['mods'] }), qc.invalidateQueries({ queryKey: ['settings'] }), qc.invalidateQueries({ queryKey: ['mod-wipe-preview'] })]);
              onClose();
            }}
          >
            {mode === 'sandbox' ? 'Reset mod settings' : 'Remove all mods'}
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
