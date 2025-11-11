'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

interface Wallet {
  balance: string;
  locked: string;
  statements: Array<{
    id: string;
    amount: string;
    description: string;
    createdAt: string;
  }>;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);

export function WalletSummary() {
  const { data, isLoading } = useSWR<Wallet>('/wallet/me', fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div className="rounded-2xl bg-slate-900/60 p-6">Carregando carteira...</div>;
  }

  return (
    <section className="grid gap-4 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 md:grid-cols-3">
      <div className="rounded-xl bg-primary-500/20 p-4 text-white">
        <p className="text-sm uppercase tracking-widest text-primary-100">Saldo disponível</p>
        <p className="mt-2 text-3xl font-semibold">R$ {Number(data?.balance ?? 0).toFixed(2)}</p>
      </div>
      <div className="rounded-xl bg-slate-950/60 p-4 text-white ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-widest text-slate-300">Saldo em processamento</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">R$ {Number(data?.locked ?? 0).toFixed(2)}</p>
      </div>
      <div className="rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/10">
        <p className="text-sm font-semibold text-white">Últimos movimentos</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          {data?.statements?.slice(0, 3).map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <span>{item.description}</span>
              <span className={Number(item.amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {Number(item.amount) >= 0 ? '+' : ''}R$ {Number(item.amount).toFixed(2)}
              </span>
            </li>
          ))}
          {data?.statements?.length === 0 && <li>Nenhum lançamento recente.</li>}
        </ul>
      </div>
    </section>
  );
}
