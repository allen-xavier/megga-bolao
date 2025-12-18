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

const fetcher = (url: string) =>
  api.get(url).then((res) => res.data as Winner[]);

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

    const speed = 0.6; // pixels/frame para rolagem suave
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b0d1c] via-[#10152b] to-[#0b1220] px-4 py-4 ring-1 ring-white/10 shadow-[0_0_24px_rgba(0,0,0,0.4)]">
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/70">
        <span
          className="h-2 w-2 rounded-full bg-megga-purple/70 shadow-[0_0_6px_rgba(120,85,255,0.7)]"
          aria-hidden
        />
        Últimos vencedores
      </div>
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-1 text-white scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
      >
        {data.map((w) => (
          <div
            key={w.id}
            className="min-w-[220px] rounded-2xl bg-white/5 px-4 py-3 shadow-lg ring-1 ring-white/10 backdrop-blur"
          >
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
              <span className="h-2 w-2 rounded-full bg-megga-yellow/80" aria-hidden />
              <span>{w.prizeType.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1 text-base font-semibold text-[#f6c960]">
              {formatCurrency(w.amount)}
            </p>
            <p className="text-xs text-white/80">
              {firstName(w.winner.name)} · {w.winner.city ?? "--"} -{" "}
              {w.winner.state ?? "--"}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {w.bolaoName ? `Bolão ${w.bolaoName}` : "Premiação"}{" "}
              {w.closedAt
                ? `· ${new Date(w.closedAt).toLocaleDateString("pt-BR")}`
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
