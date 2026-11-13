import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Archive,
  CalendarClock,
  FileText,
  Gauge,
  Map as MapIcon,
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

const NAV: { group: string; items: { to: string; label: string; icon: typeof Gauge; end?: boolean }[] }[] = [
  {
    group: 'Server',
    items: [
      { to: '/', label: 'Dashboard', icon: Gauge, end: true },
      { to: '/console', label: 'Console', icon: Terminal },
    ],
  },
  {
    group: 'Configure',
    items: [
      { to: '/settings/server', label: 'Server', icon: SlidersHorizontal },
      { to: '/settings/sandbox', label: 'Sandbox', icon: Settings2 },
      { to: '/mods', label: 'Mods', icon: Package },
      { to: '/maps', label: 'Maps', icon: MapIcon },
    ],
  },
  {
    group: 'People',
    items: [
      { to: '/players', label: 'Players', icon: Users },
      { to: '/permissions', label: 'Roles', icon: Shield },
    ],
  },
  {
    group: 'Operate',
    items: [
      { to: '/logs', label: 'Logs', icon: ScrollText },
      { to: '/backups', label: 'Backups', icon: Archive },
      { to: '/schedules', label: 'Schedules', icon: CalendarClock },
      { to: '/manager', label: 'Manager', icon: Wrench },
    ],
  },
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
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-panel/85 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[1500px] items-center gap-3 px-4">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <img src="/favicon.svg" className="h-7 w-7" alt="" />
            <span className="font-semibold tracking-tight">
              PZ<span className="text-accent">-</span>SM
            </span>
          </NavLink>
          <div className="mx-1 h-5 w-px bg-line" />
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="truncate font-medium">{status?.serverName ?? '…'}</span>
            {status && <StateBadge state={status.state} />}
            {status?.buildVersion && <span className="hidden text-xs text-muted sm:inline">B{status.buildVersion}</span>}
            {!!status?.players.length && <span className="hidden text-xs text-muted md:inline">· {status.players.length} online</span>}
            {!connected && <span className="text-xs text-warn">reconnecting…</span>}
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <button className="btn btn-ghost px-2" onClick={toggleTheme} aria-label="Toggle theme" title={dark ? 'Light theme' : 'Dark theme'}>
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
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((g, gi) => (
            <div key={g.group} className="flex shrink-0 items-center gap-0.5">
              {gi > 0 && <div className="mx-2 h-4 w-px bg-line" aria-hidden />}
              {g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} title={n.label} className={({ isActive }) => clsx('navtab', isActive && 'navtab-on')}>
                  {({ isActive }) => (
                    <>
                      <n.icon className="h-4 w-4" />
                      <span className={isActive ? '' : 'hidden xl:inline'}>{n.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <TaskBar />
      </header>
      <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 md:p-6">
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
      <Toasts />
    </div>
  );
}
