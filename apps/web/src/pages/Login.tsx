import { useState } from 'react';
import { post, toastError } from '../api';
import { Button } from '../components/ui';

export default function Login({ setup, onDone }: { setup: boolean; onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (setup && pw !== pw2) return setErr('Passwords do not match');
    if (setup && pw.length < 8) return setErr('Use at least 8 characters');
    setBusy(true);
    try {
      await post(setup ? '/api/auth/setup' : '/api/auth/login', { password: pw });
      onDone();
    } catch (e2) {
      setErr((e2 as Error).message);
      if (!setup) toastError(e2);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" className="h-10 w-10" alt="" />
          <div>
            <h1 className="text-lg font-semibold">PZSM</h1>
            <p className="text-sm text-muted">{setup ? 'Create the admin password for this panel' : 'Project Zomboid Server Manager'}</p>
          </div>
        </div>
        <input className="input" type="password" autoFocus placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={setup ? 'new-password' : 'current-password'} />
        {setup && <input className="input" type="password" placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />}
        {err && <p className="text-sm text-bad">{err}</p>}
        <Button type="submit" variant="primary" className="w-full" busy={busy}>
          {setup ? 'Create & sign in' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
