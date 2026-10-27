import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OptionValue, SettingDef, SettingsApplyResult, SettingsView } from '@pzsm/shared';
import clsx from 'clsx';
import { Eye, EyeOff, FileCode, RotateCcw, Search, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post, put, toast, toastError, useDebounced, useLive } from '../api';
import { ActionButton, Badge, Button, Card, Empty, ErrorBox, Loading, Modal, Notice, PageHeader, Toggle } from '../components/ui';

const MANAGED_LINKS: Record<string, { to: string; label: string }> = {
  Mods: { to: '/mods', label: 'Mods page' },
  WorkshopItems: { to: '/mods', label: 'Mods page' },
  Map: { to: '/maps', label: 'Maps page' },
  RCONPassword: { to: '/manager', label: 'managed by PZSM' },
  RCONPort: { to: '/manager', label: 'managed by PZSM' },
};

export default function Settings({ kind }: { kind: 'server' | 'sandbox' }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings', kind], queryFn: () => get<SettingsView>(`/api/settings/${kind}`) });
  const status = useLive((s) => s.status);
  const [page, setPage] = useState<string>('');
  const [search, setSearch] = useState('');
  const dsearch = useDebounced(search, 150);
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [edits, setEdits] = useState<Record<string, OptionValue>>({});
  const [saving, setSaving] = useState(false);
  const [raw, setRaw] = useState(false);
  const [presets, setPresets] = useState(false);

  useEffect(() => {
    setEdits({});
    setPage('');
  }, [kind]);
  const view = q.data;
  useEffect(() => {
    if (view && !page && view.pages[0]) setPage(view.pages[0].key);
  }, [view, page]);

  const filtered = useMemo(() => {
    if (!view) return [];
    const s = dsearch.toLowerCase();
    return view.settings.filter((d) => {
      if (s) {
        if (!(d.key.toLowerCase().includes(s) || d.label.toLowerCase().includes(s) || d.description?.toLowerCase().includes(s))) return false;
      } else if (d.page !== page) return false;
      if (modifiedOnly && !isModified(d, edits[d.key] ?? view.values[d.key])) return false;
      return true;
    });
  }, [view, dsearch, page, modifiedOnly, edits]);

  const pageCounts = useMemo(() => {
    const m = new Map<string, { n: number; mod: number }>();
    for (const d of view?.settings ?? []) {
      const c = m.get(d.page) ?? { n: 0, mod: 0 };
      c.n++;
      if (isModified(d, edits[d.key] ?? view!.values[d.key])) c.mod++;
      m.set(d.page, c);
    }
    return m;
  }, [view, edits]);

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!view) return null;

  const dirty = Object.keys(edits).length;
  const save = async () => {
    setSaving(true);
    try {
      const r = await put<SettingsApplyResult>(`/api/settings/${kind}`, { values: edits });
      const errs = Object.entries(r.errors);
      if (errs.length) toast(`Not saved: ${errs.map(([k, v]) => `${k} (${v})`).join(', ')}`, 'error');
      if (r.written.length) {
        toast(
          `Saved ${r.written.length} setting(s)` +
            (r.appliedLive.length ? ` · ${r.appliedLive.length} applied live` : '') +
            (r.restartRequired.length ? ` · ${r.restartRequired.length} need a restart` : ''),
        );
      }
      setEdits((e) => Object.fromEntries(Object.entries(e).filter(([k]) => r.errors[k])));
      await qc.invalidateQueries({ queryKey: ['settings', kind] });
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = view.pages.find((p) => p.key === page);
  return (
    <div className="pb-20">
      <PageHeader
        title={kind === 'server' ? 'Server Settings' : 'Sandbox Settings'}
        subtitle={
          kind === 'server'
            ? `${view.settings.length} options from the installed build${view.unknownKeys.length ? ` + ${view.unknownKeys.length} unrecognized` : ''}. Most apply live; some need a restart.`
            : `${view.settings.length} options (vanilla + enabled mods). Changes apply on the next restart.`
        }
        actions={
          <>
            {kind === 'sandbox' && (
              <Button onClick={() => setPresets(true)}>
                <Upload className="h-4 w-4" /> Presets
              </Button>
            )}
            <Button onClick={() => setRaw(true)}>
              <FileCode className="h-4 w-4" /> View file
            </Button>
          </>
        }
      />
      {!view.fileExists && <Notice>The {kind === 'server' ? 'server .ini' : 'SandboxVars.lua'} file does not exist yet; start the server once to generate it with defaults (values shown are defaults).</Notice>}
      {kind === 'sandbox' && view.settings.some((s) => view.values[s.key] === null && s.source !== 'file-comment') && view.fileExists && (
        <div className="mt-3">
          <Notice tone="accent">
            Some options (usually from newly enabled mods) are missing from the file and will use their defaults.{' '}
            <button className="underline" onClick={() => post('/api/settings/sandbox/fill-defaults').then(() => qc.invalidateQueries({ queryKey: ['settings', kind] }), toastError)}>
              Write defaults into the file
            </button>
          </Notice>
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted" />
            <input className="input pl-8" placeholder="Search all settings…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={modifiedOnly} onChange={(e) => setModifiedOnly(e.target.checked)} /> Changed from default only
          </label>
          <nav className="card max-h-[70vh] overflow-y-auto p-1">
            {groupPages(view).map((g) => (
              <div key={g.group}>
                {g.group && <div className="label px-2 pb-1 pt-3">{g.group}</div>}
                {g.pages.map((p) => {
                  const c = pageCounts.get(p.key);
                  return (
                    <button
                      key={p.key}
                      onClick={() => {
                        setPage(p.key);
                        setSearch('');
                      }}
                      className={clsx('flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm', page === p.key && !search ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-panel2 hover:text-fg')}
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="ml-2 shrink-0 text-xs">
                        {c?.mod ? <span className="text-warn">{c.mod}/</span> : null}
                        {c?.n ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
        <div>
          <Card title={search ? `Search results (${filtered.length})` : pageTitle?.title} actions={pageTitle?.mod && !search ? <Badge tone="accent">mod: {pageTitle.mod}</Badge> : undefined} bodyClass="p-0">
            {filtered.length === 0 ? (
              <div className="p-4">
                <Empty>No settings match.</Empty>
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {filtered.map((d) => (
                  <SettingRow
                    key={d.key}
                    def={d}
                    value={d.key in edits ? edits[d.key] : view.values[d.key]}
                    fileValue={view.values[d.key]}
                    edited={d.key in edits}
                    running={status?.state === 'running'}
                    kind={kind}
                    onChange={(v) =>
                      setEdits((e) => {
                        const n = { ...e };
                        if (eq(v, view.values[d.key])) delete n[d.key];
                        else n[d.key] = v;
                        return n;
                      })
                    }
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      {dirty > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-panel/95 backdrop-blur md:left-60">
          <div className="flex items-center gap-3 px-6 py-3">
            <span className="text-sm">
              {dirty} unsaved change{dirty > 1 ? 's' : ''}: <span className="text-muted">{Object.keys(edits).slice(0, 6).join(', ')}{dirty > 6 ? '…' : ''}</span>
            </span>
            <div className="ml-auto flex gap-2">
              <Button onClick={() => setEdits({})}>Discard</Button>
              <Button variant="primary" busy={saving} onClick={save}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
      <RawModal open={raw} onClose={() => setRaw(false)} file={kind === 'server' ? 'ini' : 'sandbox'} />
      {kind === 'sandbox' && <PresetsModal open={presets} onClose={() => setPresets(false)} onApplied={() => qc.invalidateQueries({ queryKey: ['settings', kind] })} />}
    </div>
  );
}

function groupPages(view: SettingsView) {
  const vanilla = view.pages.filter((p) => !p.key.startsWith('mod:') && !p.key.startsWith('orphan:') && p.key !== 'Unrecognized');
  const mods = view.pages.filter((p) => p.key.startsWith('mod:'));
  const other = view.pages.filter((p) => p.key.startsWith('orphan:') || p.key === 'Unrecognized');
  return [
    { group: view.kind === 'sandbox' && mods.length ? 'Vanilla' : '', pages: vanilla },
    ...(mods.length ? [{ group: 'Mods', pages: [...mods].sort((a, b) => a.title.localeCompare(b.title)) }] : []),
    ...(other.length ? [{ group: 'Other', pages: other }] : []),
  ];
}

function eq(a: unknown, b: unknown) {
  return a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9);
}

function isModified(d: SettingDef, v: OptionValue | null | undefined) {
  if (v === null || v === undefined || d.default === undefined || d.secret) return false;
  if (typeof d.default === 'number') return !eq(Number(v), d.default);
  return String(v) !== String(d.default);
}

function SettingRow({
  def,
  value,
  fileValue,
  edited,
  running,
  kind,
  onChange,
}: {
  def: SettingDef;
  value: OptionValue | null | undefined;
  fileValue: OptionValue | null | undefined;
  edited: boolean;
  running: boolean;
  kind: 'server' | 'sandbox';
  onChange: (v: OptionValue) => void;
}) {
  const effective = value ?? def.default ?? '';
  const managed = def.managed ? MANAGED_LINKS[def.key] : undefined;
  const modified = isModified(def, value);
  return (
    <div className={clsx('grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_320px]', edited && 'bg-warn/5')}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{def.label}</span>
          <code className="text-[11px] text-muted">{def.key}</code>
          {modified && <Badge tone="warn">changed</Badge>}
          {fileValue === null && <Badge title="Not present in the file; the game uses the default">not in file</Badge>}
          {kind === 'server' && !def.managed && running && (def.live ? <Badge tone="ok">live</Badge> : <Badge>restart</Badge>)}
          {def.source === 'mod' && def.mods && <Badge tone="accent">{def.mods.join(', ')}</Badge>}
          {def.source === 'unknown' && <Badge tone="bad">unrecognized</Badge>}
        </div>
        {def.description && <p className="mt-1 whitespace-pre-line text-xs text-muted">{def.description}</p>}
        <p className="mt-1 text-[11px] text-muted/80">
          {def.default !== undefined && !def.secret && (
            <>
              Default: <span className="font-mono">{fmtDefault(def)}</span>
            </>
          )}
          {def.min !== undefined && def.max !== undefined && def.type !== 'enum' && !def.choices && (
            <span className="ml-2">
              Range {def.min} – {def.max}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-start gap-2">
        {managed ? (
          <div className="text-sm">
            <div className="truncate font-mono text-xs text-muted" title={String(effective)}>
              {String(effective) || '—'}
            </div>
            <Link to={managed.to} className="text-xs text-accent underline">
              Edit on {managed.label}
            </Link>
          </div>
        ) : (
          <Editor def={def} value={effective} onChange={onChange} />
        )}
        {!managed && modified && def.default !== undefined && (
          <button className="mt-1.5 text-muted hover:text-fg" title="Reset to default" onClick={() => onChange(def.default!)}>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function fmtDefault(d: SettingDef): string {
  if (d.choices) {
    const c = d.choices.find((x) => x.value === d.default);
    if (c) return c.label;
  }
  const s = String(d.default);
  return s === '' ? '(empty)' : s.length > 60 ? s.slice(0, 60) + '…' : s;
}

function Editor({ def, value, onChange }: { def: SettingDef; value: OptionValue; onChange: (v: OptionValue) => void }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  if (def.type === 'boolean') return <Toggle checked={value === true || value === 'true'} onChange={onChange} label={def.label} />;
  if (def.choices && (def.type === 'enum' || def.type === 'integer')) {
    return (
      <select className="input" value={String(value)} onChange={(e) => onChange(Number(e.target.value))}>
        {def.choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label === String(c.value) ? c.label : `${c.value} · ${c.label}`}
          </option>
        ))}
        {!def.choices.some((c) => String(c.value) === String(value)) && <option value={String(value)}>{String(value)} (custom)</option>}
      </select>
    );
  }
  if (def.type === 'integer' || def.type === 'double' || def.type === 'enum') {
    const commit = () => {
      if (text.trim() === '' || Number.isNaN(Number(text))) {
        setText(String(value));
        return;
      }
      onChange(Number(text));
    };
    const n = Number(text);
    const invalid = text !== '' && (Number.isNaN(n) || (def.min !== undefined && n < def.min) || (def.max !== undefined && n > def.max) || (def.type !== 'double' && !Number.isInteger(n)));
    return (
      <input
        className={clsx('input font-mono', invalid && 'border-bad')}
        inputMode={def.type === 'double' ? 'decimal' : 'numeric'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
    );
  }
  const long = def.type === 'text' || String(value).length > 60;
  if (def.secret) {
    return (
      <div className="flex w-full gap-1">
        <input className="input font-mono" type={show ? 'text' : 'password'} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text !== String(value) && onChange(text)} />
        <button className="btn btn-ghost px-2" onClick={() => setShow(!show)} aria-label="Show">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
  return long ? (
    <textarea className="input min-h-[72px] font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text !== String(value) && onChange(text)} />
  ) : (
    <input className="input font-mono" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text !== String(value) && onChange(text)} onKeyDown={(e) => e.key === 'Enter' && text !== String(value) && onChange(text)} />
  );
}

function RawModal({ open, onClose, file }: { open: boolean; onClose: () => void; file: string }) {
  const q = useQuery({ queryKey: ['raw', file], queryFn: () => get<{ text: string; exists: boolean }>(`/api/settings/raw/${file}`), enabled: open });
  return (
    <Modal open={open} onClose={onClose} title="File contents (read-only)" wide>
      {q.isLoading ? <Loading /> : <pre className="max-h-[65vh] overflow-auto rounded bg-black/30 p-3 font-mono text-xs">{q.data?.exists ? q.data.text : '(file does not exist yet)'}</pre>}
    </Modal>
  );
}

function PresetsModal({ open, onClose, onApplied }: { open: boolean; onClose: () => void; onApplied: () => void }) {
  const q = useQuery({ queryKey: ['presets'], queryFn: () => get<{ vanilla: string[]; saved: string[] }>('/api/sandbox/presets'), enabled: open });
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const apply = async (body: Record<string, unknown>) => {
    const r = await post<SettingsApplyResult>('/api/sandbox/presets/apply', { ...body, mode });
    toast(`Applied preset: ${r.written.length} value(s) written`);
    onApplied();
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Sandbox presets">
      <div className="space-y-4">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Merge (only keys in preset)
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace (reset others to defaults)
          </label>
        </div>
        <div>
          <div className="label mb-1">Game presets</div>
          <div className="flex flex-wrap gap-2">
            {(q.data?.vanilla ?? []).map((p) => (
              <ActionButton key={p} onAction={() => apply({ source: 'vanilla', name: p })} confirm={`Apply the "${p}" preset?`}>
                {p}
              </ActionButton>
            ))}
          </div>
        </div>
        {!!q.data?.saved.length && (
          <div>
            <div className="label mb-1">Saved presets (Zomboid/Sandbox Presets)</div>
            <div className="flex flex-wrap gap-2">
              {q.data.saved.map((p) => (
                <ActionButton key={p} onAction={() => apply({ source: 'saved', name: p })} confirm={`Apply "${p}"?`}>
                  {p}
                </ActionButton>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="label mb-1">Upload a .cfg preset or SandboxVars.lua</div>
          <input
            type="file"
            accept=".cfg,.lua,.txt"
            className="text-sm"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                await apply({ source: 'upload', content: await f.text() });
              } catch (er) {
                toastError(er);
              }
            }}
          />
        </div>
        <div className="border-t border-line pt-3">
          <a className="btn" href="/api/sandbox/export.cfg">
            Export current settings as .cfg
          </a>
        </div>
      </div>
    </Modal>
  );
}
