'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';

interface WalletResponse {
  balance: string;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);

export function TopBar() {
  const { data } = useSWR<WalletResponse>('/wallet/me', fetcher, {
    revalidateOnFocus: false,
  });

  const balance = Number(data?.balance ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <header className="rounded-3xl bg-megga-navy/80 px-5 py-4 text-white shadow-glow backdrop-blur">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
        <span>Bolão entre Amigos</span>
        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-megga-yellow shadow">
          Saldo R$ {balance}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60">Bem-vindo de volta,</p>
          <p className="text-2xl font-semibold">Jogador</p>
        </div>
        <Link
          href="/perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80 transition hover:border-megga-magenta/60 hover:text-white"
        >
          <span className="sr-only">Ir para o perfil</span>
          <span aria-hidden>MB</span>
        </Link>
      </div>
    </header>
  );
}
