import { useQuery } from '@tanstack/react-query';
import type { CommandDef } from '@pzsm/shared';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { get, post, toastError, useLive } from '../api';
import { Button, PageHeader } from '../components/ui';

export default function Console() {
  const lines = useLive((s) => s.console);
  const status = useLive((s) => s.status);
  const cmds = useQuery({ queryKey: ['commands'], queryFn: () => get<CommandDef[]>('/api/build/commands') });
  const [filter, setFilter] = useState('');
  const [cmd, setCmd] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [follow, setFollow] = useState(true);
  const [hideNoise, setHideNoise] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => {
    const f = filter.toLowerCase();
    return lines.filter((l) => (!f || l.text.toLowerCase().includes(f)) && (!hideNoise || !/^LOG {2}: General {6}f:0 st:[\d,]+> \S+: Warning$/.test(l.text.trim())));
  }, [lines, filter, hideNoise]);

  useEffect(() => {
    if (follow && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [shown, follow]);

  const word = cmd.split(/\s+/)[0]?.toLowerCase() ?? '';
  const suggestions = useMemo(() => {
    if (!word || cmd.includes(' ')) return [];
    return (cmds.data ?? []).filter((c) => c.names.some((n) => n.toLowerCase().startsWith(word))).slice(0, 8);
  }, [cmds.data, word, cmd]);
  const current = (cmds.data ?? []).find((c) => c.names.some((n) => n.toLowerCase() === word));

  const send = async () => {
    const c = cmd.trim().replace(/^\//, '');
    if (!c) return;
    setHistory((h) => [c, ...h.filter((x) => x !== c)].slice(0, 50));
    setHIdx(-1);
    setCmd('');
    try {
      await post('/api/server/command', { command: c });
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Console"
        subtitle="Live server output. Commands are sent over RCON (or the console when RCON is not ready)."
        actions={
          <>
            <input className="input w-56" placeholder="Filter output…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={hideNoise} onChange={(e) => setHideNoise(e.target.checked)} /> Hide log-level noise
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow
            </label>
          </>
        }
      />
      <div ref={box} className="card min-h-[300px] flex-1 overflow-auto bg-black/40 p-3 font-mono text-xs leading-relaxed">
        {shown.map((l, i) => (
          <div key={i} className={clsx('whitespace-pre-wrap break-all', l.stream === 'err' && 'text-bad', l.stream === 'sys' && 'text-accent', /\bERROR\b|Exception/.test(l.text) && 'text-bad', /\bWARN/.test(l.text) && 'text-warn')}>
            <span className="mr-2 text-muted/60">{new Date(l.t).toLocaleTimeString()}</span>
            {l.text}
          </div>
        ))}
      </div>
      <div className="relative mt-3">
        {suggestions.length > 0 && (
          <div className="card absolute bottom-full mb-1 w-full max-w-xl overflow-hidden shadow-xl">
            {suggestions.map((s) => (
              <button key={s.names[0]} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-panel2" onClick={() => setCmd(s.names[0] + ' ')}>
                <span className="font-mono text-accent">{s.names.join(' / ')}</span>
                <span className="ml-2 text-muted">{s.help}</span>
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            className="input font-mono"
            placeholder={status?.state === 'running' ? 'Type a command, e.g. players, save, servermsg "Hello"' : 'Server is not running'}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && history.length) {
                e.preventDefault();
                const n = Math.min(hIdx + 1, history.length - 1);
                setHIdx(n);
                setCmd(history[n]);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const n = hIdx - 1;
                setHIdx(Math.max(n, -1));
                setCmd(n >= 0 ? history[n] : '');
              } else if (e.key === 'Tab' && suggestions[0]) {
                e.preventDefault();
                setCmd(suggestions[0].names[0] + ' ');
              }
            }}
            disabled={status?.state !== 'running'}
          />
          <Button type="submit" variant="primary" disabled={status?.state !== 'running'}>
            Send
          </Button>
        </form>
        {current && (
          <p className="mt-1.5 text-xs text-muted">
            <span className="font-mono text-fg">{current.names[0]}</span> {current.help}
            {current.argSets.length > 0 && (
              <span className="ml-2 font-mono">
                {current.argSets.map((a) => a.argName ?? a.required.join(' ')).join(' | ')}
              </span>
            )}
            {current.capabilities.length > 0 && <span className="ml-2">requires {current.capabilities.join(', ')}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
