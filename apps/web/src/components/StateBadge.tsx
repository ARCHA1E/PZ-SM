import type { ServerState } from '@pzsm/shared';
import { Badge } from './ui';

const MAP: Record<ServerState, { tone: 'ok' | 'warn' | 'bad' | 'muted' | 'accent'; label: string }> = {
  'not-installed': { tone: 'muted', label: 'Not installed' },
  installing: { tone: 'accent', label: 'Installing' },
  stopped: { tone: 'muted', label: 'Stopped' },
  starting: { tone: 'warn', label: 'Starting' },
  running: { tone: 'ok', label: 'Running' },
  stopping: { tone: 'warn', label: 'Stopping' },
  updating: { tone: 'accent', label: 'Updating' },
  crashed: { tone: 'bad', label: 'Crashed' },
};

export function StateBadge({ state }: { state: ServerState }) {
  const m = MAP[state];
  return (
    <Badge tone={m.tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${state === 'running' ? 'bg-ok' : state === 'crashed' ? 'bg-bad' : 'bg-current'}`} />
      {m.label}
    </Badge>
  );
}
