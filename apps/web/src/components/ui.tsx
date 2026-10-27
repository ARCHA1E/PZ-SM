import clsx from 'clsx';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { toastError, useToasts } from '../api';

export function Button({
  variant,
  busy,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'ghost'; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      className={clsx('btn', variant === 'primary' && 'btn-primary', variant === 'danger' && 'btn-danger', variant === 'ghost' && 'btn-ghost', className)}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** Button that runs an async action, showing a spinner and reporting errors. */
export function ActionButton({ onAction, confirm, ...rest }: Omit<Parameters<typeof Button>[0], 'onClick'> & { onAction: () => Promise<unknown>; confirm?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      {...rest}
      busy={busy}
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setBusy(true);
        try {
          await onAction();
        } catch (e) {
          toastError(e);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export function Card({ title, actions, children, className, bodyClass }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={clsx('card', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={clsx('p-4', bodyClass)}>{children}</div>
    </section>
  );
}

export function Badge({ children, tone = 'muted', className, title }: { children: ReactNode; tone?: 'ok' | 'warn' | 'bad' | 'muted' | 'accent'; className?: string; title?: string }) {
  const tones = {
    ok: 'border-ok/40 bg-ok/10 text-ok',
    warn: 'border-warn/40 bg-warn/10 text-warn',
    bad: 'border-bad/40 bg-bad/10 text-bad',
    muted: 'border-line bg-panel2 text-muted',
    accent: 'border-accent/40 bg-accent/10 text-accent',
  };
  return (
    <span title={title} className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition disabled:opacity-50', checked ? 'border-accent bg-accent' : 'border-line bg-panel2')}
    >
      <span className={clsx('inline-block h-3.5 w-3.5 rounded-full bg-fg transition', checked ? 'translate-x-[18px] bg-bg' : 'translate-x-[2px]')} />
    </button>
  );
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block space-y-1', className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh]" onMouseDown={onClose}>
      <div className={clsx('card w-full shadow-2xl', wide ? 'max-w-4xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-muted hover:text-fg" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-4 w-4 animate-spin text-muted', className)} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</div>;
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 p-6 text-muted">
      <Spinner /> Loading…
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error instanceof Error ? error.message : String(error)}</div>;
}

export function Notice({ tone = 'warn', children }: { tone?: 'warn' | 'bad' | 'ok' | 'accent'; children: ReactNode }) {
  const tones = { warn: 'border-warn/40 bg-warn/10', bad: 'border-bad/40 bg-bad/10', ok: 'border-ok/40 bg-ok/10', accent: 'border-accent/40 bg-accent/10' };
  return <div className={clsx('rounded-md border px-3 py-2 text-sm', tones[tone])}>{children}</div>;
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { key: T; label: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx('-mb-px border-b-2 px-3 py-2 text-sm font-medium', value === t.key ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Toasts() {
  const list = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-lg',
            t.kind === 'error' ? 'border-bad/50 bg-panel text-bad' : t.kind === 'info' ? 'border-line bg-panel' : 'border-ok/50 bg-panel text-ok',
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

/** Reorderable list with drag & drop plus up/down buttons. */
export function SortableList<T>({ items, keyOf, render, onChange }: { items: T[]; keyOf: (t: T) => string; render: (t: T, i: number) => ReactNode; onChange: (items: T[]) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <ol className="divide-y divide-line/60 rounded-md border border-line">
      {items.map((it, i) => (
        <li
          key={keyOf(it)}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag !== null) move(drag, i);
            setDrag(null);
          }}
          className={clsx('flex items-center gap-2 bg-panel px-2 py-1.5', drag === i && 'opacity-50')}
        >
          <span className="cursor-grab select-none px-1 text-muted" title="Drag to reorder">
            ⋮⋮
          </span>
          <span className="w-6 text-right font-mono text-xs text-muted">{i + 1}</span>
          <div className="min-w-0 flex-1">{render(it, i)}</div>
          <button className="px-1 text-muted hover:text-fg disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
            ▲
          </button>
          <button className="px-1 text-muted hover:text-fg disabled:opacity-30" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
            ▼
          </button>
        </li>
      ))}
    </ol>
  );
}
