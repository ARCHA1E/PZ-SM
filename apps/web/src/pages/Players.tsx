import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PermissionsView } from '@pzsm/shared';
import { useState } from 'react';
import { fmtDate, get, post, put, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Button, Card, Empty, Field, Loading, Modal, PageHeader, Toggle } from '../components/ui';

interface PlayerRow {
  username: string;
  online: boolean;
  steamid?: string;
  role?: string;
  lastConnection?: string;
  character?: { name?: string; x: number; y: number; z: number; dead: boolean };
}

export default function Players() {
  const qc = useQueryClient();
  const status = useLive((s) => s.status);
  const q = useQuery({ queryKey: ['players'], queryFn: () => get<{ players: PlayerRow[] }>('/api/players'), refetchInterval: 20_000 });
  const perms = useQuery({ queryKey: ['permissions'], queryFn: () => get<PermissionsView>('/api/permissions') });
  const [sel, setSel] = useState<PlayerRow | null>(null);
  const [filter, setFilter] = useState('');
  const running = status?.state === 'running';
  if (q.isLoading) return <Loading />;
  const list = (q.data?.players ?? []).filter((p) => !filter || p.username.toLowerCase().includes(filter.toLowerCase()) || p.steamid?.includes(filter));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Players"
        subtitle={`${list.filter((p) => p.online).length} online · ${list.length} known`}
        actions={<input className="input w-60" placeholder="Filter by name or Steam ID" value={filter} onChange={(e) => setFilter(e.target.value)} />}
      />
      <Card bodyClass="p-0">
        {list.length === 0 ? (
          <div className="p-4">
            <Empty>No players yet.</Empty>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Role</th>
                <th className="hidden md:table-cell">Character</th>
                <th className="hidden lg:table-cell">Last seen</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.username}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${p.online ? 'bg-ok' : 'bg-line'}`} />
                      <span className="font-medium">{p.username}</span>
                    </div>
                    {p.steamid && (
                      <a className="font-mono text-xs text-muted hover:text-accent" href={`https://steamcommunity.com/profiles/${p.steamid}`} target="_blank" rel="noreferrer">
                        {p.steamid}
                      </a>
                    )}
                  </td>
                  <td>{p.role ? <Badge tone={p.role === 'admin' ? 'accent' : 'muted'}>{p.role}</Badge> : '—'}</td>
                  <td className="hidden text-xs md:table-cell">
                    {p.character ? (
                      <>
                        {p.character.name} {p.character.dead && <Badge tone="bad">dead</Badge>}
                        <div className="font-mono text-muted">
                          {p.character.x}, {p.character.y}, {p.character.z}
                        </div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="hidden text-xs text-muted lg:table-cell">{p.lastConnection ? fmtDate(p.lastConnection) : '—'}</td>
                  <td className="text-right">
                    <Button onClick={() => setSel(p)}>Manage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <PlayerModal player={sel} onClose={() => setSel(null)} running={running} roles={perms.data?.roles ?? []} onChanged={() => qc.invalidateQueries({ queryKey: ['players'] })} />
    </div>
  );
}

function PlayerModal({ player, onClose, running, roles, onChanged }: { player: PlayerRow | null; onClose: () => void; running: boolean; roles: PermissionsView['roles']; onChanged: () => void }) {
  const [reason, setReason] = useState('');
  const [item, setItem] = useState('Base.Axe');
  const [count, setCount] = useState(1);
  const [xp, setXp] = useState('Woodwork=100');
  const [target, setTarget] = useState('');
  const [vehicle, setVehicle] = useState('Base.PickUpTruck');
  const [god, setGod] = useState(false);
  const [invis, setInvis] = useState(false);
  if (!player) return null;
  const u = encodeURIComponent(player.username);
  const act = (body: Record<string, unknown>) =>
    post<{ output: string }>(`/api/players/${u}/action`, body).then((r) => toast(r.output?.trim() || 'Done', 'info'));
  return (
    <Modal open onClose={onClose} title={`Manage ${player.username}`} wide>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Role">
            <select
              className="input"
              value={roles.find((r) => r.name === player.role)?.id ?? ''}
              onChange={async (e) => {
                try {
                  const r = await put<{ output: string }>(`/api/users/${u}/role`, { role: Number(e.target.value) });
                  toast(r.output === 'queued' ? 'Queued; applies on next start' : 'Role updated');
                  onChanged();
                } catch (er) {
                  toastError(er);
                }
              }}
            >
              <option value="" disabled>
                —
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason (kick/ban)">
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <ActionButton disabled={!running || !player.online} onAction={() => act({ action: 'kick', reason })}>
              Kick
            </ActionButton>
            <ActionButton variant="danger" onAction={() => post('/api/bans', { username: player.username, steamid: running ? undefined : player.steamid, reason }).then(() => (toast('Banned'), onChanged()))} confirm={`Ban ${player.username}?`}>
              Ban
            </ActionButton>
            <ActionButton variant="danger" disabled={!running} onAction={() => post('/api/bans', { username: player.username, reason, banIp: true }).then(() => toast('Banned (+IP)'))} confirm={`Ban ${player.username} and their IP?`}>
              Ban + IP
            </ActionButton>
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Toggle checked={god} disabled={!running} onChange={async (v) => (await act({ action: 'godmode', enabled: v }).catch(toastError), setGod(v))} /> God mode
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Toggle checked={invis} disabled={!running} onChange={async (v) => (await act({ action: 'invisible', enabled: v }).catch(toastError), setInvis(v))} /> Invisible
            </label>
          </div>
        </div>
        <div className="space-y-3">
          <Field label="Give item (full type, e.g. Base.Axe)">
            <div className="flex gap-2">
              <input className="input font-mono" value={item} onChange={(e) => setItem(e.target.value)} />
              <input className="input w-20" type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              <ActionButton disabled={!running} onAction={() => act({ action: 'additem', value: item, count })}>
                Give
              </ActionButton>
            </div>
          </Field>
          <Field label="Add XP (Perk=amount)">
            <div className="flex gap-2">
              <input className="input font-mono" value={xp} onChange={(e) => setXp(e.target.value)} />
              <ActionButton disabled={!running} onAction={() => act({ action: 'addxp', value: xp })}>
                Add
              </ActionButton>
            </div>
          </Field>
          <Field label="Spawn vehicle near player">
            <div className="flex gap-2">
              <input className="input font-mono" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
              <ActionButton disabled={!running} onAction={() => act({ action: 'addvehicle', value: vehicle })}>
                Spawn
              </ActionButton>
            </div>
          </Field>
          <Field label="Teleport to player">
            <div className="flex gap-2">
              <input className="input" placeholder="other username" value={target} onChange={(e) => setTarget(e.target.value)} />
              <ActionButton disabled={!running || !target} onAction={() => act({ action: 'teleport-to-player', value: target })}>
                Teleport
              </ActionButton>
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
