'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DEFAULT_REDIRECT_TARGET = '/dashboard';
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

function getSafeRedirectTarget(rawRedirect: string | null): string {
  if (!rawRedirect || CONTROL_CHAR_PATTERN.test(rawRedirect)) {
    return DEFAULT_REDIRECT_TARGET;
  }

  if (!rawRedirect.startsWith('/') || rawRedirect.startsWith('//') || rawRedirect.includes('\\')) {
    return DEFAULT_REDIRECT_TARGET;
  }

  return rawRedirect;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTarget = getSafeRedirectTarget(searchParams.get('redirect'));

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!active) return;
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.authenticated === true) {
          router.replace(redirectTarget);
        }
      } catch {
        // Mantém tela de login quando não há sessão válida.
      }
    };
    checkSession();
    return () => {
      active = false;
    };
  }, [router, redirectTarget]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload?.error || 'Não foi possível autenticar.');
        return;
      }

      router.replace(redirectTarget);
    } catch {
      setError('Falha de rede durante autenticação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0E1117] text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <h1 className="text-2xl font-semibold">Acesso ao Dashboard</h1>
        <p className="mt-2 text-sm text-white/70">
          Faça login para acessar métricas e dados protegidos.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="seu-email@empresa.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="********"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="min-h-screen bg-[#0E1117] text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <h1 className="text-2xl font-semibold">Acesso ao Dashboard</h1>
        <p className="mt-2 text-sm text-white/70">Carregando...</p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}
