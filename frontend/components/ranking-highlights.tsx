'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

interface RankingEntry {
  userId: string;
  _count: { _all: number };
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);

export function RankingHighlights() {
  const { data, isLoading } = useSWR<RankingEntry[]>('/rankings/global?limit=5', fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div className="rounded-2xl bg-slate-900/60 p-6">Carregando ranking...</div>;
  }

  return (
    <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <h2 className="text-lg font-semibold text-white">Top apostadores</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {data?.map((entry, index) => (
          <li key={entry.userId} className="flex items-center justify-between rounded-xl bg-slate-950/60 px-4 py-3">
            <span className="font-medium text-white">#{index + 1}</span>
            <span className="text-slate-200">Usuário #{entry.userId.slice(0, 6)}</span>
            <span className="text-primary-300">{entry._count._all} apostas</span>
          </li>
        ))}
        {data?.length === 0 && <li>Nenhuma aposta registrada até o momento.</li>}
      </ul>
    </section>
  );
}
