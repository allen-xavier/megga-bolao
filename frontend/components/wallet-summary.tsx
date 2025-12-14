'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
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

export function WalletSummary() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;

  const { data, isLoading } = useSWR<Wallet>(
    token ? '/wallet/me' : null,
    () =>
      api
        .get('/wallet/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => response.data),
    {
      revalidateOnFocus: false,
    },
  );

  if (status !== 'authenticated') {
    return (
      <div className="rounded-3xl bg-megga-navy/60 p-6 text-sm text-white/60">
        Entre com sua conta para ver os dados da carteira.
      </div>
    );
  }

  if (isLoading) {
    return <div className="rounded-3xl bg-megga-navy/60 p-6 text-sm text-white/60">Carregando carteira...</div>;
  }

  const balance = Number(data?.balance ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const locked = Number(data?.locked ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Minha carteira</h2>
        <span className="rounded-full bg-megga-purple/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/70">
          SuitPay conectado
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-megga-magenta via-megga-purple to-megga-teal px-5 py-4 shadow">
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/70">Saldo disponível</span>
          <p className="mt-3 text-3xl font-semibold text-white">R$ {balance}</p>
        </div>
        <div className="rounded-2xl bg-white/5 px-5 py-4">
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">Em processamento</span>
          <p className="mt-3 text-2xl font-semibold text-megga-yellow">R$ {locked}</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-white/5 p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Últimos movimentos</p>
        <ul className="mt-3 space-y-3 text-sm">
          {data?.statements?.slice(0, 3).map((item) => {
            const amount = Number(item.amount);
            const formattedAmount = amount.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-megga-surface/80 px-4 py-3">
                <div>
                  <p className="font-medium text-white/90">{item.description}</p>
                  <p className="text-xs text-white/50">{new Date(item.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <span
                  className={`text-sm font-semibold ${amount >= 0 ? 'text-megga-lime' : 'text-megga-rose'}`}
                >
                  {amount >= 0 ? '+' : '-'}R$ {formattedAmount}
                </span>
              </li>
            );
          })}
          {(!data || (data.statements?.length ?? 0) === 0) && (
            <li className="rounded-xl bg-megga-surface/60 px-4 py-3 text-sm text-white/60">
              Nenhuma movimentação registrada recentemente.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
