import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Archive,
  CalendarClock,
  FileText,
  Gauge,
  Map as MapIcon,
  Menu,
  Moon,
  Package,
  ScrollText,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sun,
  Terminal,
  Users,
  Wrench,
  LogOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { connectLive, disconnectLive, get, post, useLive } from './api';
import { StateBadge } from './components/StateBadge';
import { TaskBar } from './components/TaskBar';
import { Toasts } from './components/ui';
import Backups from './pages/Backups';
import Console from './pages/Console';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Manager from './pages/Manager';
import Maps from './pages/Maps';
import Mods from './pages/Mods';
import Permissions from './pages/Permissions';
import Players from './pages/Players';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';

const NAV = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/console', label: 'Console', icon: Terminal },
  { to: '/settings/server', label: 'Server Settings', icon: SlidersHorizontal },
  { to: '/settings/sandbox', label: 'Sandbox', icon: Settings2 },
  { to: '/mods', label: 'Mods', icon: Package },
  { to: '/maps', label: 'Maps & Spawns', icon: MapIcon },
  { to: '/players', label: 'Players', icon: Users },
  { to: '/permissions', label: 'Roles & Access', icon: Shield },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/backups', label: 'Backups', icon: Archive },
  { to: '/schedules', label: 'Schedules', icon: CalendarClock },
  { to: '/manager', label: 'Manager', icon: Wrench },
];

export default function App() {
  const qc = useQueryClient();
  const auth = useQuery({ queryKey: ['auth'], queryFn: () => get<{ setup: boolean; loggedIn: boolean }>('/api/auth/state') });
  useEffect(() => {
    const h = () => qc.invalidateQueries({ queryKey: ['auth'] });
    window.addEventListener('pzsm:unauthorized', h);
    return () => window.removeEventListener('pzsm:unauthorized', h);
  }, [qc]);
  useEffect(() => {
    if (auth.data?.loggedIn) connectLive();
    else disconnectLive();
  }, [auth.data?.loggedIn]);

  if (auth.isLoading) return null;
  if (!auth.data?.loggedIn) return <Login setup={!!auth.data?.setup} onDone={() => qc.invalidateQueries({ queryKey: ['auth'] })} />;
  return <Shell />;
}

function Shell() {
  const [open, setOpen] = useState(false);
  const status = useLive((s) => s.status);
  const connected = useLive((s) => s.connected);
  const qc = useQueryClient();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('pzsm-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex h-full">
      <aside className={clsx('fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-line bg-panel transition-transform md:static md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <img src="/favicon.svg" className="h-7 w-7" alt="" />
          <div className="leading-tight">
            <div className="font-semibold">PZSM</div>
            <div className="text-[11px] text-muted">Zomboid Server Manager</div>
          </div>
        </div>
        <nav className="space-y-0.5 p-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm', isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-panel2 hover:text-fg')}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{status?.serverName ?? '…'}</span>
            {status && <StateBadge state={status.state} />}
            {status?.buildVersion && <span className="hidden text-xs text-muted sm:inline">B{status.buildVersion}</span>}
            {!connected && <span className="text-xs text-warn">reconnecting…</span>}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button className="btn btn-ghost px-2" onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a className="btn btn-ghost hidden px-2 sm:inline-flex" href="https://pzwiki.net/wiki/Dedicated_server" target="_blank" rel="noreferrer" title="Dedicated server docs">
              <FileText className="h-4 w-4" />
            </a>
            <button
              className="btn btn-ghost px-2"
              title="Log out"
              onClick={async () => {
                await post('/api/auth/logout');
                qc.invalidateQueries({ queryKey: ['auth'] });
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <TaskBar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/console" element={<Console />} />
            <Route path="/settings/server" element={<Settings kind="server" />} />
            <Route path="/settings/sandbox" element={<Settings kind="sandbox" />} />
            <Route path="/mods" element={<Mods />} />
            <Route path="/maps" element={<Maps />} />
            <Route path="/players" element={<Players />} />
            <Route path="/permissions" element={<Permissions />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/backups" element={<Backups />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/manager" element={<Manager />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <Toasts />
    </div>
  );
}
