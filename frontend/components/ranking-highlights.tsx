'use client';

import useSWR from "swr";
import { api } from "@/lib/api";

interface RankingEntry {
  userId: string;
  fullName: string;
  city: string | null;
  state: string | null;
  totalPrizesWon: number;
  totalPrizeValue: number;
}

interface RankingResponse {
  lastDraw: { drawnAt: string; numbers: number[] } | null;
  entries: RankingEntry[];
}

const fetcher = (url: string) => api.get(url).then((response) => response.data as RankingResponse);

function formatLocation(entry: RankingEntry) {
  if (!entry.city || !entry.state) return "Localização não informada";
  return `${entry.city} - ${entry.state}`;
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "R$ 0,00";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function RankingHighlights() {
  const { data, isLoading } = useSWR<RankingResponse>("/rankings/global?limit=5", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-white/60 md:p-6">Carregando ranking...</div>;
  }

  const drawDate = data?.lastDraw?.drawnAt ? new Date(data.lastDraw.drawnAt) : null;
  const entries = (data?.entries ?? []).slice(0, 5);

  return (
    <section className="rounded-3xl bg-[#0f1117] p-5 text-white shadow-lg ring-1 ring-white/5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Top apostadores</h2>
          <p className="text-xs text-white/60">
            Ranking calculado considerando acertos e premiações até o último sorteio disponível.
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.24em] text-white/60">Atualizado</span>
      </div>

      <div className="mt-4 space-y-3">
        {data?.lastDraw ? (
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">Último sorteio</span>
              <span className="rounded-full border border-[#1ea7a4]/40 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#1ea7a4]">
                {drawDate?.toLocaleDateString("pt-BR")} às{" "}
                {drawDate?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.lastDraw.numbers.map((number, index) => (
                <span
                  key={`${number}-${index}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-[#f7b500]"
                >
                  {number.toString().padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60">
            Assim que o primeiro sorteio for registrado, o ranking será exibido automaticamente.
          </p>
        )}

        <ul className="space-y-3">
          {entries.map((entry, index) => (
            <li
              key={entry.userId}
              className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7b500] text-base font-semibold text-[#0f1117]">
                #{index + 1}
              </span>
              <div>
                <p className="font-medium text-white">{entry.fullName.split(" ")[0]}</p>
                <p className="text-xs text-white/50">{formatLocation(entry)}</p>
                <p className="text-xs text-white/60">
                  Premiações: {entry.totalPrizesWon} · Recebido: {formatCurrency(entry.totalPrizeValue)}
                </p>
              </div>
              <span className="rounded-full bg-[#1a1c25] px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#1ea7a4]">
                {drawDate ? "Atual" : "Prévia"}
              </span>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              Nenhum apostador aparece no ranking no momento.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
