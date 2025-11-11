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
    return <div className="rounded-3xl bg-megga-navy/60 p-6 text-sm text-white/60">Carregando ranking...</div>;
  }

  return (
    <section className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Top apostas</h2>
          <p className="text-xs text-white/60">Ranking atualizado automaticamente após cada sorteio.</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60">
          + acertos
        </span>
      </header>
      <ul className="mt-5 space-y-3">
        {data?.map((entry, index) => (
          <li
            key={entry.userId}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-megga-purple/80 text-base font-semibold text-white">
              #{index + 1}
            </span>
            <div>
              <p className="font-medium text-white">Usuário #{entry.userId.slice(0, 6)}</p>
              <p className="text-xs text-white/60">{entry._count._all} apostas registradas</p>
            </div>
            <span className="rounded-full bg-megga-surface/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-megga-yellow">
              Ranking
            </span>
          </li>
        ))}
        {(!data || data.length === 0) && (
          <li className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/60">
            Nenhum apostador no ranking até o momento.
          </li>
        )}
      </ul>
    </section>
  );
}
