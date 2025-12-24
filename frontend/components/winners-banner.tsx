'use client';

import useSWR from "swr";
import { api } from "@/lib/api";
import { useEffect, useRef } from "react";

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
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function firstName(full?: string | null) {
  if (!full) return "Ganhador";
  const parts = full.split(" ");
  return parts[0] ?? full;
}

export function WinnersBanner() {
  const { data } = useSWR<Winner[]>("/winners/latest?limit=20", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const speed = 1.2;
    const step = () => {
      if (!container) return;
      container.scrollLeft += speed;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) {
        animationRef.current = requestAnimationFrame(step);
        return;
      }
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
    <div className="relative w-full max-w-[96vw] overflow-hidden rounded-2xl py-3 -mt-4 md:mt-0 md:max-w-none md:rounded-3xl md:bg-[#0f1014] md:px-4 md:py-4 md:ring-1 md:ring-white/10 md:shadow-[0_0_24px_rgba(0,0,0,0.45)]">
      <span className="light-sweep light-sweep-fast" aria-hidden />
      <div className="relative z-10 mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/70">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f7b500]/30 bg-[#f7b500]/15 text-[#f7b500] shadow-[0_0_8px_rgba(247,181,0,0.35)]"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              d="M7 5h10v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V5zM5 6H3a3 3 0 0 0 3 3M19 6h2a3 3 0 0 1-3 3M9 12v3h6v-3M8 18h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="font-semibold text-[#f7b500]">Premiacoes</span>
        <span className="text-white/70">Ultimos vencedores</span>
      </div>
      <div
        ref={containerRef}
        className="relative z-10 flex w-full max-w-[96vw] gap-3 overflow-x-auto pb-1 text-white scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 md:max-w-full"
      >
        {data.map((w) => (
          <div
            key={w.id}
            className="relative flex-shrink-0 min-w-[70px] sm:min-w-[100px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0f16] px-3 py-3 shadow md:rounded-2xl md:px-4 md:py-3 md:shadow-lg md:ring-1 md:ring-white/10"
          >
            <span className="light-sweep" aria-hidden />
            <div className="relative z-10">
              <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
                <span className="h-2 w-2 rounded-full bg-[#1ea7a4]" aria-hidden />
                <span>{w.prizeType.replace(/_/g, " ")}</span>
              </div>
              <p className="text-base font-semibold text-[#f7b500]">{formatCurrency(w.amount)}</p>
              <p className="text-xs text-white/80">
                {firstName(w.winner.name)} - {w.winner.city ?? "--"} - {w.winner.state ?? "--"}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                {w.bolaoName ? `Bolão ${w.bolaoName}` : "Premiação"}{" "}
                {w.closedAt ? `- ${new Date(w.closedAt).toLocaleDateString("pt-BR")}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
