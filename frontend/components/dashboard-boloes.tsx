/**
 * Cartões de bolões para o dashboard.
 * Foco: melhorar o card "Acumulando" sem alterar fluxo geral.
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { api } from "@/lib/api";

type PrizeConfig = { type?: string; value?: number };
type BetLite = { userId: string };
type BetCount = { bets?: number };

interface Bolao {
  id: string;
  name: string;
  startsAt: string;
  closedAt?: string | null;
  ticketPrice: string | number;
  minimumQuotas: number;
  prizeCount?: number;
  prizeConfigurations?: PrizeConfig[];
  prizes?: PrizeConfig[];
  isParticipant?: boolean;
  myBets?: BetLite[];
  bets?: BetLite[];
  commissionPercent?: number | string;
  comissaoPercentual?: number | string;
  commission?: number | string;
  guaranteedPrize?: number | string;
  premiacaoGarantida?: number | string;
  premiacaoTotal?: number | string;
  prizeTotal?: number | string;
  prizePool?: number | string;
  prizePoolValue?: number | string;
  prizePoolList?: number | string;
  estimatedPrize?: number | string;
  estimatedTotalPrize?: number | string;
  estimatedPool?: number | string;
  totalPrize?: number | string;
  totalPrizeValue?: number | string;
  _count?: BetCount;
  hasPrize?: boolean;
  // Variantes de sena acumulada
  sena?: number | string;
  senaAcumulada?: number | string;
  senaAcumuladaValor?: number | string;
  senaAccumulated?: number | string;
  senaAccumulatedValue?: number | string;
  senaReserved?: number | string;
  senaReservedAmount?: number | string;
  senaPot?: number | string;
  senaPotValue?: number | string;
  senaPotAmount?: number | string;
  senaPotReserved?: number | string;
  senaPotApplied?: number | string;
  senaApplied?: number | string;
  senaCurrentPot?: number | string;
  senaPotCurrent?: number | string;
  senaPotRollover?: number | string;
  senaPotTotal?: number | string;
  senaPotAccumulated?: number | string;
  senaAcumuladaTotal?: number | string;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);
const authedFetcher = ([url, token]: [string, string]) =>
  api
    .get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((response) => response.data);

function parseAmount(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  let normalized = trimmed;
  if (hasComma && hasDot) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = trimmed.replace(",", ".");
  } else if (hasDot && trimmed.split(".").length > 2) {
    normalized = trimmed.replace(/\./g, "");
  }
  normalized = normalized.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function getUserId(session: any): string | undefined {
  return (
    session?.user?.id ??
    session?.user?._id ??
    session?.user?.sub ??
    session?.user?.userId ??
    (session as any)?.id ??
    (session as any)?.userId
  );
}

function formatStartsAt(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getSaoPauloDate(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

function getStartLabel(startsAt: Date) {
  const nowSp = getSaoPauloDate(new Date());
  const startSp = getSaoPauloDate(startsAt);

  const startMidnight = new Date(startSp);
  startMidnight.setHours(0, 0, 0, 0);
  const nowMidnight = new Date(nowSp);
  nowMidnight.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((startMidnight.getTime() - nowMidnight.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "HOJE";
  if (diffDays === 1) return "AMANHÃ";
  return formatStartsAt(startSp);
}

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}s`;
}

function getStartDisplay(startsAt: Date, now: Date) {
  const nowSp = getSaoPauloDate(now);
  const startSp = getSaoPauloDate(startsAt);
  const diffMs = startSp.getTime() - nowSp.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diffMs > 0 && diffMs <= oneDayMs) {
    return { label: formatCountdown(diffMs), isCountdown: true };
  }

  return { label: getStartLabel(startsAt), isCountdown: false };
}

function getNextDrawLabel() {
  const now = new Date();
  const nowSp = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const targetDays = [2, 4, 6]; // terça, quinta, sábado
  for (let add = 0; add < 7; add += 1) {
    const candidate = new Date(nowSp.getTime() + add * 24 * 60 * 60 * 1000);
    if (targetDays.includes(candidate.getDay())) {
      if (add === 0) return "Hoje";
      return candidate.toLocaleDateString("pt-BR", { weekday: "long" });
    }
  }
  return "";
}

function estimatePrize(bolao: Bolao) {
  const ticket = parseAmount(bolao.ticketPrice);
  const betsCount = bolao._count?.bets ?? bolao.bets?.length ?? 0;
  const commissionPercent =
    parseAmount(bolao.commissionPercent) ||
    parseAmount(bolao.commission) ||
    parseAmount(bolao.comissaoPercentual);
  const commissionRate = Math.min(Math.max(commissionPercent / 100, 0), 1);
  const netPool = betsCount * ticket * (1 - commissionRate);

  const garantido =
    parseAmount(bolao.guaranteedPrize) ||
    parseAmount(bolao.premiacaoGarantida);

  const poolCandidates = [
    parseAmount(bolao.totalPrize),
    parseAmount(bolao.premiacaoTotal),
    parseAmount(bolao.prizeTotal),
    parseAmount(bolao.totalPrizeValue),
    parseAmount(bolao.estimatedTotalPrize),
    parseAmount(bolao.estimatedPrize),
    parseAmount(bolao.estimatedPool),
    parseAmount(bolao.prizePool),
    parseAmount(bolao.prizePoolValue),
    parseAmount(bolao.prizePoolList),
  ];

  const senaCandidates = [
    parseAmount(bolao.sena),
    parseAmount(bolao.senaAcumulada),
    parseAmount(bolao.senaAcumuladaValor),
    parseAmount(bolao.senaAccumulated),
    parseAmount(bolao.senaAccumulatedValue),
    parseAmount(bolao.senaReserved),
    parseAmount(bolao.senaReservedAmount),
    parseAmount(bolao.senaPot),
    parseAmount(bolao.senaPotValue),
    parseAmount(bolao.senaPotAmount),
    parseAmount(bolao.senaPotReserved),
    parseAmount(bolao.senaPotApplied),
    parseAmount(bolao.senaApplied),
    parseAmount(bolao.senaCurrentPot),
    parseAmount(bolao.senaPotCurrent),
    parseAmount(bolao.senaPotRollover),
    parseAmount(bolao.senaPotTotal),
    parseAmount(bolao.senaPotAccumulated),
    parseAmount(bolao.senaAcumuladaTotal),
  ];

  const computedPool = Math.max(garantido, netPool);
  const poolFallback = Math.max(0, ...poolCandidates);
  const basePool = computedPool > 0 ? computedPool : poolFallback;
  const senaTotal = Math.max(0, ...senaCandidates);
  const totalEstimado = basePool + senaTotal;

  const premiosPrevistos =
    bolao.prizeCount ??
    bolao.prizes?.length ??
    bolao.prizeConfigurations?.length ??
    0;

  return { totalEstimado, senaTotal, premiosPrevistos };
}

export function DashboardBoloes() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const userId = getUserId(session);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, isLoading } = useSWR<Bolao[]>(
    token ? ["/boloes", token] : "/boloes",
    token ? authedFetcher : fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      refreshInterval: 15000,
    }
  );

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-megga-surface p-6 text-sm text-white/75 ring-1 ring-white/5 shadow-lg">
        Carregando bolões...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section className="rounded-3xl bg-megga-surface p-6 text-sm text-white/75 shadow-lg ring-1 ring-white/5">
        <h2 className="text-lg font-semibold text-white">Bolões em andamento</h2>
        <p className="mt-4 text-sm text-white/65">
          Nenhum bolão ativo no momento. Volte mais tarde para acompanhar novas oportunidades.
        </p>
      </section>
    );
  }

  const nowTimestamp = now;
  const nowDate = new Date(nowTimestamp);
  const futuros = data.filter((b) => new Date(b.startsAt).getTime() > nowTimestamp);
  const andamento = data.filter((b) => {
    const start = new Date(b.startsAt).getTime();
    const closed = b.closedAt ? new Date(b.closedAt).getTime() : null;
    return start <= nowTimestamp && (!closed || closed > nowTimestamp);
  });

  const cards = [...futuros, ...andamento];

  return (
    <section className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
        {cards.map((bolao) => {
          const startsAt = new Date(bolao.startsAt);
          const hasStarted = startsAt.getTime() <= nowTimestamp;
          const { label: startLabel, isCountdown: startIsCountdown } = getStartDisplay(startsAt, nowDate);

          const statusLabel = hasStarted ? "Em andamento" : "Acumulando";
          const hasPrize = Boolean(bolao.hasPrize);
          const inferredParticipant =
            bolao.isParticipant ||
            bolao.myBets?.some?.((b) => b.userId === userId) ||
            bolao.bets?.some?.((b) => b.userId === userId) ||
            hasPrize;
          const participationLabel = inferredParticipant ? "Participando" : statusLabel;
          const nextDrawLabel = getNextDrawLabel();

          const { totalEstimado, senaTotal, premiosPrevistos } = estimatePrize(bolao);

          const buttonClass = hasStarted
            ? "bg-megga-yellow text-megga-navy hover:opacity-90"
            : "bg-[#2fdb7b] text-[#0b1218] animate-shake-strong btn-shake-xy hover:opacity-95 scale-100 hover:scale-105 transition-transform";
          const bodyClass = hasStarted
            ? "space-y-2 px-4 pb-4 pt-1.5 md:space-y-3 md:px-5 md:pb-6 md:pt-4"
            : "space-y-2 px-4 pb-2 pt-1.5 md:space-y-3 md:px-5 md:pb-3 md:pt-4";
          const buttonWrapperClass = hasStarted ? "pb-1" : "pb-0";
          const cardClass = hasStarted
            ? "border-[#f7b500]/20 bg-gradient-to-br from-[#151824] via-[#121726] to-[#0e1118]"
            : "border-[#3fdc7c]/25 bg-gradient-to-br from-[#0f2219] via-[#111622] to-[#0d1017]";
          const headerClass = hasStarted ? "bg-[#2a1d0b]" : "bg-[#12231b]";
          const statusPillClass = hasStarted ? "bg-[#f7b500]/15 text-[#f7b500]" : "bg-[#3fdc7c]/15 text-[#3fdc7c]";
          const patternStyle = hasStarted
            ? {
                backgroundImage:
                  "radial-gradient(circle at 85% 0%, rgba(247, 181, 0, 0.18), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.06), transparent 50%)",
              }
            : {
                backgroundImage:
                  "radial-gradient(circle at 15% 0%, rgba(63, 220, 124, 0.2), transparent 55%), repeating-linear-gradient(135deg, rgba(63, 220, 124, 0.08) 0, rgba(63, 220, 124, 0.08) 1px, transparent 1px, transparent 10px)",
              };
          const accumPanelClass = "border-white/5 bg-[#0c111b]/70";
          const progressPanelClass = "border-[#f7b500]/20 bg-[#0f141f]/70";

          return (
            <article
              key={bolao.id}
              className={`relative overflow-hidden rounded-xl border text-white shadow md:rounded-2xl md:shadow-lg ${cardClass}`}
            >
              <div className="pointer-events-none absolute inset-0 z-0 opacity-70" style={patternStyle} aria-hidden />
              <div className="relative z-10">
                <div className={`flex items-center justify-between px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] md:px-5 md:py-3 md:text-[11px] md:tracking-[0.18em] ${headerClass}`}>
                  <span className="inline-flex flex-wrap items-center gap-2 font-semibold text-[#3fdc7c]">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-[#3fdc7c] shadow-[0_0_8px_rgba(63,220,124,0.65)]"
                      aria-hidden
                    />
                    {participationLabel}
                    {hasPrize && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#ff4d4f]/35 bg-[#ff4d4f]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#ff4d4f] winner-badge-pulse">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
                          <path
                            d="M3 7h18v4H3zM5 11h14v9H5zM12 7v13M9 7c-1.1 0-2-.9-2-2s.9-2 2-2c2 0 3 2 3 4M15 7c1.1 0 2-.9 2-2s-.9-2-2-2c-2 0-3 2-3 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Ganhou
                      </span>
                    )}
                  </span>
                  <span className={`rounded-full px-3 py-1 ${statusPillClass}`}>{statusLabel}</span>
                </div>

                <div className={bodyClass}>
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 self-center">
                    <h3 className="text-xl font-semibold leading-tight text-white">{bolao.name}</h3>
                    <p className="mt-0.5 text-xs text-white/65">
                      {hasStarted ? "Bolão em andamento" : "Bolão inicia em " + formatStartsAt(startsAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-end self-end rounded-xl border border-white/10 bg-[#141823] px-4 py-3 text-right md:rounded-2xl">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 md:tracking-[0.2em]">Cota</p>
                    <p className="text-lg font-semibold text-[#f7b500]">
                      R$ {parseAmount(bolao.ticketPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </header>

                {!hasStarted && (
                  <div className="space-y-3">
                    <div className={`rounded-2xl border px-4 py-1 text-white shadow-inner ${accumPanelClass}`}>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
                        <span>Valor estimado até o momento</span>
                        <svg
                          viewBox="0 0 64 32"
                          aria-hidden
                          className="h-10 w-14 text-red-400"
                        >
                          <defs>
                            <linearGradient id="rise" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
                            </linearGradient>
                          </defs>
                          <path d="M4 26 L16 16 L26 19 L36 11 L48 17 L60 8 V30 H4 Z" fill="url(#rise)" opacity="0.4" />
                          <polyline
                            points="4,26 16,16 26,19 36,11 48,17 60,8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="trend-line-base"
                          />
                          <polyline
                            points="4,26 16,16 26,19 36,11 48,17 60,8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="trend-line-draw"
                          />
                          <circle cx="4" cy="26" r="3.2" fill="currentColor" className="trend-dot-move" />
                        </svg>
                      </div>
                      <p className="mt-0.5 text-center text-3xl font-bold text-[#3fdc7c] animate-[pulse_0.9s_ease-in-out_infinite]">
                        {formatCurrency(totalEstimado)}
                      </p>
                      {senaTotal > 0 && (
                        <p className="text-center text-xs font-semibold text-[#3fdc7c]">
                          Sena acumulada {formatCurrency(senaTotal)}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded-2xl border px-4 py-3 text-white ${accumPanelClass}`}>
                        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Inicia em</span>
                        <span
                          className={`mt-1 block text-base font-semibold text-megga-yellow ${startIsCountdown ? "animate-pulse" : ""}`}
                        >
                          {startLabel}
                        </span>
                      </div>
                      <div className={`rounded-2xl border px-4 py-3 text-white ${accumPanelClass}`}>
                        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Prêmios previstos</span>
                        <span className="mt-1 block text-base font-semibold text-white">
                          {premiosPrevistos > 0 ? `${premiosPrevistos} prêmio${premiosPrevistos > 1 ? "s" : ""}` : "Em configuração"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {hasStarted && (
                  <div className="space-y-3">
                    <div className={`rounded-2xl border px-4 py-1 text-white shadow-inner ${progressPanelClass}`}>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
                        <span>Valor da premiação</span>
                      </div>
                      <p className="mt-0.5 text-center text-3xl font-bold text-megga-yellow">
                        {formatCurrency(totalEstimado)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-wide text-white/65">
                      <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                        <span className="block text-[10px] text-white/40">Próximo sorteio</span>
                        <span className="mt-1 block text-base font-semibold text-white">{nextDrawLabel}</span>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                        <span className="block text-[10px] text-white/40">Prêmios configurados</span>
                        <span className="mt-1 block text-base font-semibold text-white">
                          {premiosPrevistos > 0 ? `${premiosPrevistos} prêmio${premiosPrevistos > 1 ? "s" : ""}` : "Em configuração"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                  <div className={buttonWrapperClass}>
                    <Link
                      href={`/boloes/${bolao.id}`}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow transition md:rounded-2xl md:shadow-lg ${buttonClass}`}
                    >
                      {hasStarted ? "Acompanhar agora" : "Aposte Agora!"}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
