import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MapEntry, SpawnRegionView } from '@pzsm/shared';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { get, post, put, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Button, Card, Empty, Loading, Notice, PageHeader, SortableList } from '../components/ui';

type Catalog = { maps: (MapEntry & { modEnabled?: boolean })[]; order: string[]; problems: string[] };
type Spawn = { regions: SpawnRegionView[]; exists: boolean; suggested: { name: string; file?: string; serverfile?: string }[] };
type Pt = { worldX?: number; worldY?: number; posX: number; posY: number; posZ?: number };

export default function Maps() {
  const qc = useQueryClient();
  const status = useLive((s) => s.status);
  const cat = useQuery({ queryKey: ['maps'], queryFn: () => get<Catalog>('/api/maps') });
  const spawn = useQuery({ queryKey: ['spawnregions'], queryFn: () => get<Spawn>('/api/maps/spawnregions') });
  const points = useQuery({ queryKey: ['spawnpoints'], queryFn: () => get<{ points: Record<string, Pt[]> | null; file: string }>('/api/maps/spawnpoints') });
  const [order, setOrder] = useState<string[] | null>(null);
  const [regions, setRegions] = useState<SpawnRegionView[] | null>(null);
  const running = status?.state === 'running' || status?.state === 'starting';

  useEffect(() => setRegions(null), [spawn.data]);
  if (cat.isLoading) return <Loading />;
  const c = cat.data!;
  const current = order ?? c.order;
  const available = c.maps.filter((m) => !current.includes(m.folder) && (m.source === 'mod' || m.folder === 'Muldraugh, KY'));
  const regs = regions ?? spawn.data?.regions ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Maps & Spawns" subtitle="Map load order (Map=), spawn regions, custom spawn points and world operations." />
      {c.problems.length > 0 && (
        <Notice>
          {c.problems.map((p) => (
            <div key={p}>{p}</div>
          ))}
        </Notice>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Active maps (Map=)"
          actions={
            <ActionButton
              variant="primary"
              disabled={order === null}
              onAction={async () => {
                await put('/api/maps/order', { order: current });
                setOrder(null);
                toast('Map order saved (applies on restart)');
                await qc.invalidateQueries({ queryKey: ['maps'] });
              }}
            >
              Save
            </ActionButton>
          }
        >
          {current.length === 0 ? (
            <Empty>No maps.</Empty>
          ) : (
            <SortableList
              items={current}
              keyOf={(x) => x}
              onChange={setOrder}
              render={(f) => {
                const m = c.maps.find((x) => x.folder === f);
                return (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{m?.title ?? f}</span>
                    {m && m.title !== f && <code className="truncate text-xs text-muted">{f}</code>}
                    {!m && <Badge tone="bad">missing</Badge>}
                    {m?.source === 'mod' && <Badge tone={m.modEnabled ? 'accent' : 'warn'}>{m.mod}{m.modEnabled ? '' : ' (disabled)'}</Badge>}
                    <button className="ml-auto text-muted hover:text-bad" onClick={() => setOrder(current.filter((x) => x !== f))} aria-label="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }}
            />
          )}
          <p className="mt-2 text-xs text-muted">Mod maps go above "Muldraugh, KY" so they override the vanilla world.</p>
        </Card>
        <Card title="Available maps">
          {available.length === 0 ? (
            <Empty>No other maps found. Install map mods from the Mods page.</Empty>
          ) : (
            <ul className="divide-y divide-line/60">
              {available.map((m) => (
                <li key={`${m.mod}-${m.folder}`} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.title}</div>
                    <div className="truncate text-xs text-muted">
                      {m.folder} · {m.source === 'mod' ? `mod ${m.mod}${m.modEnabled ? '' : ' (not enabled)'}` : 'vanilla'}
                      {m.lots.length ? ` · uses ${m.lots.join(', ')}` : ''}
                    </div>
                  </div>
                  <Button onClick={() => setOrder([m.folder, ...current])}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Spawn regions"
        actions={
          <>
            <Button onClick={() => setRegions(spawn.data?.suggested.map((s) => ({ ...s, valid: true })) ?? [])}>
              <Wand2 className="h-4 w-4" /> Generate from active maps
            </Button>
            <Button onClick={() => setRegions([...regs, { name: 'New region', file: 'media/maps/Muldraugh, KY/spawnpoints.lua', valid: true }])}>
              <Plus className="h-4 w-4" /> Add
            </Button>
            <ActionButton
              variant="primary"
              disabled={regions === null}
              onAction={async () => {
                await put('/api/maps/spawnregions', { regions: regs.map(({ name, file, serverfile }) => ({ name, file, serverfile })) });
                toast('Spawn regions saved');
                await qc.invalidateQueries({ queryKey: ['spawnregions'] });
              }}
            >
              Save
            </ActionButton>
          </>
        }
        bodyClass="p-0"
      >
        {!spawn.data?.exists && regs.length === 0 ? (
          <div className="p-4">
            <Empty>No spawnregions file yet (created on first start).</Empty>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Spawnpoints file</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {regs.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input className="input" value={r.name} onChange={(e) => setRegions(regs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  </td>
                  <td>
                    <input
                      className="input font-mono text-xs"
                      value={r.serverfile ?? r.file ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const isServer = !v.includes('/');
                        setRegions(regs.map((x, j) => (j === i ? { ...x, file: isServer ? undefined : v, serverfile: isServer ? v : undefined } : x)));
                      }}
                    />
                  </td>
                  <td>{regions !== null ? <Badge>unsaved</Badge> : r.valid ? <Badge tone="ok">ok</Badge> : <Badge tone="bad" title={r.problem}>{r.problem}</Badge>}</td>
                  <td>
                    <button className="text-muted hover:text-bad" onClick={() => setRegions(regs.filter((_, j) => j !== i))} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <SpawnPointsCard data={points.data} onSaved={() => qc.invalidateQueries({ queryKey: ['spawnpoints'] })} />

      <Card title="World operations" className="border-bad/40">
        <p className="mb-3 text-sm text-muted">These need the server to be stopped. A backup is taken automatically before destructive operations.</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton disabled={running} onAction={() => post('/api/world/soft-reset').then(() => toast('Soft reset will run on next start'))} confirm="Soft reset on next start? The world resets (buildings, loot, zombies) but player characters are kept.">
            Soft reset on next start
          </ActionButton>
          <ActionButton disabled={running} onAction={() => post('/api/world/new-worldgen').then(() => toast('World generation data removed'))} confirm="Delete map_worldgen.bin so a changed Seed takes effect?">
            Regenerate worldgen (new seed)
          </ActionButton>
          <ActionButton variant="danger" disabled={running} onAction={() => post('/api/world/wipe-world').then(() => toast('World wiped'))} confirm="Wipe the world and all characters? Accounts, roles and bans are kept.">
            Wipe world
          </ActionButton>
          <ActionButton variant="danger" disabled={running} onAction={() => post('/api/world/wipe-all').then(() => toast('Everything wiped'))} confirm="Wipe world AND server database (accounts, roles, bans)? This is a full reset.">
            Full reset
          </ActionButton>
        </div>
      </Card>
    </div>
  );
}

function SpawnPointsCard({ data, onSaved }: { data?: { points: Record<string, Pt[]> | null; file: string }; onSaved: () => void }) {
  const [pts, setPts] = useState<Record<string, Pt[]> | null>(null);
  useEffect(() => setPts(null), [data]);
  const cur = pts ?? data?.points ?? {};
  const rows = Object.entries(cur).flatMap(([prof, list]) => list.map((p, i) => ({ prof, i, p })));
  const update = (prof: string, i: number, patch: Partial<Pt>) => setPts({ ...cur, [prof]: cur[prof].map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const num = (v: string) => (v === '' ? undefined : Number(v));
  return (
    <Card
      title={`Custom spawn points (${data?.file ?? ''})`}
      actions={
        <>
          <Button onClick={() => setPts({ ...cur, unemployed: [...(cur.unemployed ?? []), { posX: 0, posY: 0, posZ: 0 }] })}>
            <Plus className="h-4 w-4" /> Add point
          </Button>
          <ActionButton
            variant="primary"
            disabled={pts === null}
            onAction={async () => {
              await put('/api/maps/spawnpoints', { points: cur });
              toast('Spawn points saved');
              onSaved();
            }}
          >
            Save
          </ActionButton>
        </>
      }
      bodyClass="p-0"
    >
      {rows.length === 0 ? (
        <div className="p-4">
          <Empty>No custom spawn points. Reference this file from a spawn region with serverfile = "{data?.file}".</Empty>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Profession</th>
              <th>Cell X / Y</th>
              <th>Pos X / Y / Z</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ prof, i, p }) => (
              <tr key={`${prof}-${i}`}>
                <td className="font-mono text-xs">{prof}</td>
                <td>
                  <div className="flex gap-1">
                    <input className="input w-20" placeholder="—" value={p.worldX ?? ''} onChange={(e) => update(prof, i, { worldX: num(e.target.value) })} />
                    <input className="input w-20" placeholder="—" value={p.worldY ?? ''} onChange={(e) => update(prof, i, { worldY: num(e.target.value) })} />
                  </div>
                </td>
                <td>
                  <div className="flex gap-1">
                    <input className="input w-24" value={p.posX} onChange={(e) => update(prof, i, { posX: Number(e.target.value) || 0 })} />
                    <input className="input w-24" value={p.posY} onChange={(e) => update(prof, i, { posY: Number(e.target.value) || 0 })} />
                    <input className="input w-14" value={p.posZ ?? ''} onChange={(e) => update(prof, i, { posZ: num(e.target.value) })} />
                  </div>
                </td>
                <td>
                  <button className="text-muted hover:text-bad" onClick={() => setPts({ ...cur, [prof]: cur[prof].filter((_, j) => j !== i) })} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        Leave Cell X/Y empty for absolute world coordinates; with cells, Pos is relative to the 256×256 cell. Find coordinates at map.projectzomboid.com.
      </p>
    </Card>
  );
}
