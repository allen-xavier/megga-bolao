'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { useEffect, useRef } from 'react';

type Winner = {
  id: string;
  amount: number;
  prizeType: string;
  bolaoName: string | null;
  closedAt: string | null;
  winner: { name: string | null; city: string | null; state: string | null };
  createdAt: string;
};

const fetcher = (url: string) => api.get(url).then((res) => res.data as Winner[]);

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function firstName(full?: string | null) {
  if (!full) return 'Ganhador';
  const parts = full.split(' ');
  return parts[0] ?? full;
}

export function WinnersBanner() {
  const { data } = useSWR<Winner[]>('/winners/latest?limit=20', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const speed = 0.6; // pixels/frame para rolagem visível
    const step = () => {
      if (!container) return;
      container.scrollLeft += speed;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll) {
        container.scrollLeft = 0;
      }
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-megga-purple/80 via-megga-navy/90 to-megga-teal/70 px-4 py-3 ring-1 ring-white/10">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
        <span className="h-2 w-2 rounded-full bg-megga-lime shadow" aria-hidden />
        Últimos vencedores
      </div>
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-1 text-white scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
      >
        {data.map((w) => (
          <div
            key={w.id}
            className="min-w-[220px] rounded-xl bg-white/10 px-3 py-2 shadow-sm ring-1 ring-white/10"
          >
            <p className="text-sm font-semibold text-megga-lime">{formatCurrency(w.amount)}</p>
            <p className="text-xs text-white/80">
              {firstName(w.winner.name)} • {w.winner.city ?? '--'} - {w.winner.state ?? '--'}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
              {w.prizeType.replace(/_/g, ' ')} {w.bolaoName ? ` • ${w.bolaoName}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
