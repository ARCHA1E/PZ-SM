import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLive } from '../api';
import { Spinner } from './ui';

/** Shows the running maintenance task (install, update, download, restore) with its log. */
export function TaskBar() {
  const task = useLive((s) => s.task);
  const lines = useLive((s) => s.taskLines);
  const [open, setOpen] = useState(false);
  const [lastDone, setLastDone] = useState<string | null>(null);
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!task && lines.length) {
      const last = lines[lines.length - 1];
      if (last?.startsWith('✔') || last?.startsWith('✖')) {
        setLastDone(last);
        const t = setTimeout(() => setLastDone(null), 10000);
        return () => clearTimeout(t);
      }
    }
  }, [task, lines]);
  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines, open]);
  if (!task && !lastDone) return null;
  return (
    <div className="border-b border-line bg-panel2">
      <div className="flex items-center gap-3 px-4 py-2 text-sm">
        {task ? <Spinner /> : null}
        <span className="font-medium">{task ? task.label : lastDone}</span>
        {task?.progress !== undefined && (
          <div className="h-1.5 w-40 overflow-hidden rounded bg-line">
            <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, task.progress)}%` }} />
          </div>
        )}
        {task?.progress !== undefined && <span className="text-xs text-muted">{task.progress.toFixed(1)}%</span>}
        <span className="hidden truncate text-xs text-muted md:inline">{task?.message}</span>
        <button className="ml-auto text-muted hover:text-fg" onClick={() => setOpen(!open)} aria-label="Toggle task log">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <pre ref={ref} className="max-h-60 overflow-auto border-t border-line px-4 py-2 font-mono text-xs text-muted">
          {lines.join('\n')}
        </pre>
      )}
    </div>
  );
}
