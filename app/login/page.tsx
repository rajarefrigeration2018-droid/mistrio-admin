'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Field, inputClass } from '@/components/ui';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const expired = params.get('expired');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken() && !expired) router.replace('/dashboard');
  }, [router, expired]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Could not sign in.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      {/* The mark carries the whole brand here — no illustration, no gradient. */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber">
              <span className="font-mono text-xl font-bold text-ink">M</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Mistrio Console
            </h1>
            <p className="mt-2 text-[15px] text-white/50">
              Dispatch, technicians and revenue in one place.
            </p>
          </div>

          {expired && (
            <div className="mb-5 rounded-lg border border-amber/30 bg-amber/10 px-3.5 py-2.5">
              <p className="text-sm text-amber">
                Your session ended. Sign in to continue.
              </p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="eyebrow text-white/40">Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mistrio.in"
                className="mt-1.5 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 text-[15px] text-white placeholder:text-white/25 focus:border-amber"
              />
            </label>

            <label className="block">
              <span className="eyebrow text-white/40">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-12 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 text-[15px] text-white placeholder:text-white/25 focus:border-amber"
              />
            </label>

            {error && (
              <p className="text-sm font-medium text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="press h-12 w-full rounded-lg bg-amber text-[15px] font-semibold text-ink disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      <p className="pb-8 text-center text-xs text-white/25">
        Staff access only
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ink" />}>
      <LoginForm />
    </Suspense>
  );
}
