'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { AppDrawer } from '@/components/app-drawer';

interface WalletResponse {
  balance: string;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);

export function TopBar() {
  const { data: session } = useSession();
  const { data } = useSWR<WalletResponse>(
    session?.user?.accessToken ? ['/wallet/me', session.user.accessToken] : null,
    ([url, token]) =>
      api
        .get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => response.data),
    {
      revalidateOnFocus: true,
      refreshInterval: 15000,
      revalidateIfStale: true,
    },
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const balance = Number(data?.balance ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <header className="rounded-3xl bg-megga-surface/90 px-5 py-4 text-white shadow-glow ring-1 ring-white/5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:border-megga-magenta hover:text-white md:hidden"
            aria-label="Abrir menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex flex-1 flex-col items-center">
            <span className="text-[11px] uppercase tracking-[0.28em] text-white/50">Bolão entre Amigos</span>
            <span className="mt-1 text-lg font-semibold">Megga Bolão</span>
          </div>
          <Link
            href="/perfil"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            <span className="sr-only">Ir para o perfil</span>
            <span aria-hidden>MB</span>
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
            <span className="uppercase tracking-[0.3em] text-white/40">Saldo</span>
            <span className="text-base font-semibold text-megga-yellow">R$ {balance}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
            <span className="uppercase tracking-[0.3em] text-white/40">Próximo Sorteio</span>
            <span className="flex items-center gap-2 font-semibold text-megga-lime">
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
                <path
                  d="M12 3a9 9 0 1 1-6.364 2.636"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Quinta-feira
            </span>
          </div>
        </div>
      </header>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
