import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PermissionsView, RoleView } from '@pzsm/shared';
import clsx from 'clsx';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { del, get, post, put, toast, toastError, useLive } from '../api';
import { ActionButton, Badge, Button, Card, Empty, Field, Loading, Modal, Notice, PageHeader, Tabs } from '../components/ui';

const GROUPS: [string, RegExp][] = [
  ['Login & accounts', /Login|Kick|Ban|User|Whitelist|AccessLevel|Password|Network|Role|Ticket/],
  ['Server', /Server|Option|Lua|Mods|Save|Quit|Statistic|Debug|Log|Command|Weather|Horde|Zombie|Time|Chopper|Gunshot|Alarm|Lightning|Thunder|Rain|Storm/],
  ['Teleport & movement', /Teleport|Noclip|Fly|Speed/],
  ['Self abilities', /Himself|GodMod|Invisible|Invincible|Toggle/],
  ['World & items', /Item|Loot|Vehicle|Spawn|Map|Symbol|Brush|Build|Destroy|Fire|Animal|Corpse|Container|Erosion|Tile/],
  ['Safehouses & factions', /Safehouse|Faction/],
  ['Chat & radio', /Chat|Radio|Message|Voice|Seen/],
];

function groupOf(cap: string) {
  return GROUPS.find(([, re]) => re.test(cap))?.[0] ?? 'Other';
}
const human = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2');

export default function Permissions() {
  const qc = useQueryClient();
  const status = useLive((s) => s.status);
  const q = useQuery({ queryKey: ['permissions'], queryFn: () => get<PermissionsView>('/api/permissions') });
  const [tab, setTab] = useState<'roles' | 'users' | 'bans'>('roles');
  const refresh = () => qc.invalidateQueries({ queryKey: ['permissions'] });
  if (q.isLoading) return <Loading />;
  const v = q.data!;
  const running = status?.state === 'running' || status?.state === 'starting';

  return (
    <div className="space-y-4">
      <PageHeader title="Roles & Access" subtitle="Build 42 roles and capabilities, whitelist accounts and bans (stored in the server database)." />
      {!v.available && <Notice>{v.reason}</Notice>}
      {running && <Notice tone="accent">The server is running: role/capability edits are queued and applied automatically before the next start. User role changes, kicks and bans apply immediately.</Notice>}
      {v.pending.length > 0 && (
        <Card title={`Queued changes (${v.pending.length})`} actions={<ActionButton onAction={() => del('/api/permissions/pending').then(refresh)}>Discard all</ActionButton>}>
          <ul className="space-y-1 text-sm">
            {v.pending.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="flex-1">{p.description}</span>
                <span className="text-xs text-muted">{new Date(p.createdAt).toLocaleString()}</span>
                <button className="text-muted hover:text-bad" onClick={() => del(`/api/permissions/pending/${p.id}`).then(refresh)} aria-label="Discard">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {v.available && (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'roles', label: `Roles (${v.roles.length})` },
              { key: 'users', label: `Accounts (${v.users.length})` },
              { key: 'bans', label: `Bans (${v.bans.length})` },
            ]}
          />
          {tab === 'roles' && <Roles v={v} refresh={refresh} />}
          {tab === 'users' && <Users v={v} refresh={refresh} running={status?.state === 'running'} />}
          {tab === 'bans' && <Bans v={v} refresh={refresh} />}
        </>
      )}
    </div>
  );
}

function Roles({ v, refresh }: { v: PermissionsView; refresh: () => void }) {
  const [selId, setSelId] = useState<number | 'new'>(v.roles[v.roles.length - 1]?.id ?? 'new');
  const role = selId === 'new' ? null : v.roles.find((r) => r.id === selId) ?? null;
  const [draft, setDraft] = useState<{ name: string; description: string; color: [number, number, number]; capabilities: string[] }>({ name: '', description: '', color: [1, 1, 1], capabilities: [] });
  const [filter, setFilter] = useState('');
  useEffect(() => {
    if (role) setDraft({ name: role.name, description: role.description, color: role.color, capabilities: role.capabilities });
    else setDraft({ name: 'custom', description: '', color: [0.6, 0.8, 1], capabilities: ['LoginOnServer'] });
  }, [role, selId]);
  const groups = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of v.capabilities) {
      if (filter && !c.toLowerCase().includes(filter.toLowerCase())) continue;
      const g = groupOf(c);
      m.set(g, [...(m.get(g) ?? []), c]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [v.capabilities, filter]);
  const has = new Set(draft.capabilities);
  const toggle = (c: string) => setDraft((d) => ({ ...d, capabilities: has.has(c) ? d.capabilities.filter((x) => x !== c) : [...d.capabilities, c] }));
  const hex = (c: [number, number, number]) => '#' + c.map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  const fromHex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card title="Roles" actions={<Button onClick={() => setSelId('new')}><Plus className="h-4 w-4" /> New</Button>} bodyClass="p-1">
        {v.roles.map((r) => (
          <button key={r.id} onClick={() => setSelId(r.id)} className={clsx('flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm', selId === r.id ? 'bg-accent/15' : 'hover:bg-panel2')}>
            <span className="h-3 w-3 rounded-full border border-line" style={{ background: hex(r.color) }} />
            <span className="flex-1">{r.name}</span>
            {r.readonly && <Lock className="h-3 w-3 text-muted" />}
            <span className="text-xs text-muted">{r.capabilities.length}</span>
          </button>
        ))}
        <div className="mt-2 border-t border-line p-2">
          <div className="label mb-1">Default roles</div>
          {Object.entries(v.defaultRoles).map(([k, id]) => (
            <label key={k} className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted">{k.replace(/^defaultFor/, '')}</span>
              <select className="input w-32 py-0.5 text-xs" value={id} onChange={(e) => put('/api/permissions/default-roles', { name: k, role: Number(e.target.value) }).then(() => (toast('Saved'), refresh()), toastError)}>
                {v.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Card>
      <Card
        title={role ? `Role: ${role.name}` : 'New role'}
        actions={
          <>
            {role && !role.readonly && (
              <ActionButton variant="danger" onAction={() => del<{ result: string }>(`/api/permissions/roles/${role.id}`).then((r) => (toast(r.result === 'queued' ? 'Deletion queued' : 'Role deleted'), setSelId('new'), refresh()))} confirm={`Delete role "${role.name}"? Users with it fall back to the default user role.`}>
                Delete
              </ActionButton>
            )}
            <ActionButton
              variant="primary"
              onAction={async () => {
                const r = await put<{ result: string }>('/api/permissions/roles', { id: role?.id, ...draft });
                toast(r.result === 'queued' ? 'Saved; queued until the server stops' : 'Role saved');
                refresh();
              }}
            >
              Save role
            </ActionButton>
          </>
        }
      >
        {role?.readonly && <p className="mb-3 text-xs text-muted">Built-in role: name and colour are fixed, capabilities can be changed.</p>}
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Field label="Name">
            <input className="input" disabled={role?.readonly} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <input className="input" disabled={role?.readonly} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <Field label="Colour">
            <input type="color" className="h-[34px] w-14 rounded border border-line bg-panel2" disabled={role?.readonly} value={hex(draft.color)} onChange={(e) => setDraft({ ...draft, color: fromHex(e.target.value) })} />
          </Field>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input className="input w-60" placeholder="Filter capabilities" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Button onClick={() => setDraft({ ...draft, capabilities: [...v.capabilities] })}>All</Button>
          <Button onClick={() => setDraft({ ...draft, capabilities: [] })}>None</Button>
          <span className="text-xs text-muted">
            {draft.capabilities.length} / {v.capabilities.length} selected
          </span>
          <select className="input w-auto" value="" onChange={(e) => {
            const src = v.roles.find((r) => r.id === Number(e.target.value));
            if (src) setDraft({ ...draft, capabilities: [...src.capabilities] });
          }}>
            <option value="">Copy from role…</option>
            {v.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map(([g, caps]) => (
            <div key={g}>
              <div className="label mb-1 flex items-center justify-between">
                {g}
                <button className="text-[10px] normal-case text-accent" onClick={() => {
                  const all = caps.every((c) => has.has(c));
                  setDraft({ ...draft, capabilities: all ? draft.capabilities.filter((c) => !caps.includes(c)) : [...new Set([...draft.capabilities, ...caps])] });
                }}>
                  toggle all
                </button>
              </div>
              {caps.map((c) => (
                <label key={c} className="flex items-center gap-2 py-0.5 text-sm">
                  <input type="checkbox" checked={has.has(c)} onChange={() => toggle(c)} />
                  <span title={c}>{human(c)}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Users({ v, refresh, running }: { v: PermissionsView; refresh: () => void; running: boolean }) {
  const [add, setAdd] = useState(false);
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [f, setF] = useState('');
  const list = v.users.filter((x) => !f || x.username.toLowerCase().includes(f.toLowerCase()));
  return (
    <Card
      title={<input className="input w-60" placeholder="Filter accounts" value={f} onChange={(e) => setF(e.target.value)} />}
      actions={<Button onClick={() => setAdd(true)} disabled={!running} title={running ? '' : 'Server must be running'}><Plus className="h-4 w-4" /> Add account</Button>}
      bodyClass="p-0"
    >
      {list.length === 0 ? (
        <div className="p-4">
          <Empty>No accounts.</Empty>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th className="hidden md:table-cell">Steam ID</th>
              <th className="hidden md:table-cell">Last connection</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.id}>
                <td>
                  <span className="font-medium">{x.username}</span> {x.online && <Badge tone="ok">online</Badge>}
                  {x.displayName && x.displayName !== x.username && <div className="text-xs text-muted">{x.displayName}</div>}
                </td>
                <td>
                  <select className="input w-36 py-1" value={x.role} onChange={(e) => put<{ output: string }>(`/api/users/${encodeURIComponent(x.username)}/role`, { role: Number(e.target.value) }).then((r) => (toast(r.output === 'queued' ? 'Queued' : 'Role updated'), refresh()), toastError)}>
                    {v.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="hidden font-mono text-xs text-muted md:table-cell">{x.steamid ?? '—'}</td>
                <td className="hidden text-xs text-muted md:table-cell">{x.lastConnection ?? '—'}</td>
                <td className="text-right">
                  <ActionButton variant="ghost" onAction={async () => {
                    const pw = window.prompt(`New password for ${x.username}`);
                    if (pw) await put(`/api/users/${encodeURIComponent(x.username)}/password`, { password: pw }).then(() => toast('Password changed'));
                  }} disabled={!running}>
                    Password
                  </ActionButton>
                  <ActionButton variant="ghost" onAction={() => del(`/api/users/${encodeURIComponent(x.username)}`).then(() => (toast('Removed'), refresh()))} confirm={`Remove ${x.username} from the whitelist?`}>
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal open={add} onClose={() => setAdd(false)} title="Add whitelist account">
        <div className="space-y-3">
          <Field label="Username">
            <input className="input" value={u} onChange={(e) => setU(e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <ActionButton variant="primary" onAction={() => post('/api/users', { username: u, password: p }).then(() => (toast('Account added'), setAdd(false), setU(''), setP(''), refresh()))}>
              Add
            </ActionButton>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function Bans({ v, refresh }: { v: PermissionsView; refresh: () => void }) {
  const [kind, setKind] = useState<'steamid' | 'ip' | 'username'>('steamid');
  const [val, setVal] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card bodyClass="p-0" title="Active bans">
        {v.bans.length === 0 ? (
          <div className="p-4">
            <Empty>No bans.</Empty>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Reason</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {v.bans.map((b) => (
                <tr key={b.kind + b.value}>
                  <td>
                    <Badge>{b.kind}</Badge>
                  </td>
                  <td className="font-mono text-xs">
                    {b.value}
                    {b.username && <div className="text-muted">{b.username}</div>}
                  </td>
                  <td className="text-xs">{b.reason || '—'}</td>
                  <td className="text-right">
                    <ActionButton variant="ghost" onAction={() => post('/api/bans/remove', b.kind === 'ip' ? { ip: b.value } : { steamid: b.value }).then(() => (toast('Unbanned'), refresh()))}>
                      Unban
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card title="Add ban">
        <div className="space-y-3">
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="steamid">Steam ID</option>
            <option value="ip">IP address</option>
            <option value="username">Username (server running)</option>
          </select>
          <input className="input font-mono" placeholder={kind === 'steamid' ? '7656119…' : kind === 'ip' ? '1.2.3.4' : 'username'} value={val} onChange={(e) => setVal(e.target.value)} />
          <input className="input" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <ActionButton variant="danger" disabled={!val} onAction={() => post('/api/bans', { [kind]: val, reason }).then(() => (toast('Banned'), setVal(''), refresh()))}>
            Ban
          </ActionButton>
        </div>
      </Card>
    </div>
  );
}

export type { RoleView };
