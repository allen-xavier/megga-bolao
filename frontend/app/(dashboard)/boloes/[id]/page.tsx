"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { BetsList } from "@/components/bets-list";
import { PlaceBetForm } from "@/components/place-bet-form";
import { TransparencyDownload } from "@/components/transparency-download";

type PrizeInfo = {
  title: string;
  description: string;
};

const prizeInfo: Record<string, PrizeInfo> = {
  PE_QUENTE: { title: "Pe Quente", description: "Ganha quem acertar 10 numeros primeiro" },
  PE_FRIO: { title: "Pe Frio", description: "Ganha quem acertar menos numeros no final" },
  CONSOLACAO: { title: "Consolacao", description: "Ganha quem terminar com 9 acertos" },
  SENA_PRIMEIRO: { title: "Sena 1o sorteio", description: "Ganha quem fizer sena no primeiro sorteio" },
  LIGEIRINHO: { title: "Ligeirinho", description: "Ganha quem tiver mais acertos no primeiro sorteio" },
  OITO_ACERTOS: { title: "8 acertos", description: "Ganha quem finalizar com 8 acertos" },
  INDICACAO_DIRETA: { title: "Indique e ganhe", description: "Comissao por indicacao direta/indireta" },
};

type Bolao = any;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BolaoPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const sessionUserId =
    ((session?.user as any)?.id ||
      (session?.user as any)?.sub ||
      (session?.user as any)?._id ||
      (session?.user as any)?.userId ||
      (session as any)?.id ||
      (session as any)?.user?.id) as string | undefined;

  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleDraws, setVisibleDraws] = useState(7);
  const [visibleBets, setVisibleBets] = useState(15);
  const drawsRef = useRef<HTMLDivElement | null>(null);
  const betsRef = useRef<HTMLDivElement | null>(null);
  const [openSection, setOpenSection] = useState<Record<string, boolean>>({
    premiacoes: false,
    live: false,
    resultados: false,
    sorteios: false,
    apostadores: false,
    minhasApostas: true,
  });
  const myBets = useMemo(() => {
    if (!bolao) return [] as any[];
    const effectiveUserId = (bolao as any)?.currentUserId ?? sessionUserId;
    if (!effectiveUserId) return [];
    const betsSource = (bolao as any).myBets ?? null;
    if (Array.isArray(betsSource)) return betsSource;
    const fallback = bolao.bets ?? [];
    return fallback.filter((b: any) => b.userId === effectiveUserId || b.user?.id === effectiveUserId);
  }, [bolao, sessionUserId]);
  const isParticipant = useMemo(() => {
    if ((bolao as any)?.isParticipant) return true;
    if (myBets.length > 0) return true;
    const effectiveUserId = (bolao as any)?.currentUserId ?? sessionUserId;
    return (bolao?.bets ?? []).some((b: any) => b.userId === effectiveUserId || b.user?.id === effectiveUserId);
  }, [bolao, myBets, sessionUserId]);

  const fetchBolao = async () => {
    try {
      setError(null);
      const response = await api.get(`/boloes/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setBolao(response.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setBolao(null);
      } else {
        setError("Falha ao carregar bolao.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBolao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  useEffect(() => {
    setVisibleDraws(7);
    setVisibleBets(15);
  }, [params.id]);

  // Atualizacao por SSE
  useEffect(() => {
    if (typeof window === "undefined") return;
    let source: EventSource | null = null;
    let reconnect: NodeJS.Timeout | null = null;

    const connect = () => {
      const url = token ? `/api/events?token=${encodeURIComponent(token)}` : `/api/events`;
      source = new EventSource(url);
      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const targetId = payload?.bolaoId;
          if (!bolao || !targetId || targetId !== params.id) return;
          fetchBolao();
        } catch {
          // ignore parsing errors
        }
      };
      source.onerror = () => {
        source?.close();
        if (!reconnect) {
          reconnect = setTimeout(() => {
            reconnect = null;
            connect();
          }, 5000);
        }
      };
    };

    connect();
    return () => {
      source?.close();
      if (reconnect) clearTimeout(reconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, bolao, token]);

  // Scroll infinito: sorteios
  useEffect(() => {
    const handler = () => {
      const target = drawsRef.current;
      if (!target) return;
      const draws = bolao?.draws ?? [];
      const drawsAsc = [...draws].sort((a: any, b: any) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime());
      const list = [...drawsAsc].reverse();
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight - scrollTop - clientHeight < 40 && visibleDraws < list.length) {
        setVisibleDraws((prev) => Math.min(prev + 7, list.length));
      }
    };
    const el = drawsRef.current;
    if (el) el.addEventListener("scroll", handler);
    return () => {
      if (el) el.removeEventListener("scroll", handler);
    };
  }, [bolao, visibleDraws]);

  // Scroll infinito: apostadores
  useEffect(() => {
    const handler = () => {
      const target = betsRef.current;
      if (!target) return;
      const bets = bolao?.bets ?? [];
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight - scrollTop - clientHeight < 40 && visibleBets < bets.length) {
        setVisibleBets((prev) => Math.min(prev + 15, bets.length));
      }
    };
    const el = betsRef.current;
    if (el) el.addEventListener("scroll", handler);
    return () => {
      if (el) el.removeEventListener("scroll", handler);
    };
  }, [bolao, visibleBets]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#111218] p-4 text-white shadow-lg">
        Carregando bolao...
      </div>
    );
  }

  if (!bolao) {
    notFound();
  }

  const startsAt = new Date(bolao.startsAt);
  const isClosed = Boolean(bolao.closedAt);
  const nowTs = Date.now();
  const hasStarted = startsAt.getTime() <= nowTs;
  const statusConfig = isClosed
    ? {
        label: "Encerrado",
        cardClass: "border-[#ff4d4f]/25 bg-gradient-to-br from-[#1c0b10] via-[#141520] to-[#0e1118]",
        headerClass: "bg-[#2a0f12]",
        pillClass: "bg-[#ff4d4f]/15 text-[#ff4d4f]",
        dotClass: "bg-[#ff4d4f]",
        accentClass: "text-[#ff4d4f]",
        panelBorder: "border-[#ff4d4f]/25",
        patternStyle: {
          backgroundImage:
            "radial-gradient(circle at 85% 0%, rgba(255, 77, 79, 0.2), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.05), transparent 50%)",
        },
      }
    : hasStarted
      ? {
          label: "Em andamento",
          cardClass: "border-[#f7b500]/20 bg-gradient-to-br from-[#151824] via-[#121726] to-[#0e1118]",
          headerClass: "bg-[#2a1d0b]",
          pillClass: "bg-[#f7b500]/15 text-[#f7b500]",
          dotClass: "bg-[#f7b500]",
          accentClass: "text-[#f7b500]",
          panelBorder: "border-[#f7b500]/25",
          patternStyle: {
            backgroundImage:
              "radial-gradient(circle at 85% 0%, rgba(247, 181, 0, 0.18), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.06), transparent 50%)",
          },
        }
      : {
          label: "Acumulando",
          cardClass: "border-[#3fdc7c]/25 bg-gradient-to-br from-[#0f2219] via-[#111622] to-[#0d1017]",
          headerClass: "bg-[#12231b]",
          pillClass: "bg-[#3fdc7c]/15 text-[#3fdc7c]",
          dotClass: "bg-[#3fdc7c]",
          accentClass: "text-[#3fdc7c]",
          panelBorder: "border-[#3fdc7c]/25",
          patternStyle: {
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(63, 220, 124, 0.2), transparent 55%), repeating-linear-gradient(135deg, rgba(63, 220, 124, 0.08) 0, rgba(63, 220, 124, 0.08) 1px, transparent 1px, transparent 10px)",
          },
        };
  const summaryPanelClass = "rounded-2xl border border-white/10 bg-[#141823] px-4 py-3 text-right shadow";
  const summaryHighlightClass = `rounded-2xl border ${statusConfig.panelBorder} bg-[#0f141f]/80 px-4 py-3 text-right shadow`;
  const sectionCardClass = "space-y-2 rounded-3xl border border-white/5 bg-[#111218] p-4 text-white shadow-lg";
  const latestResult = bolao.bolaoResults?.[0] ?? null;
  const prizeResults = latestResult?.prizes ?? [];
  const livePrizes = bolao.livePrizes ?? [];
  const senaPotApplied = Number(bolao.senaPotApplied ?? 0);
  const senaPotRolled = Number(bolao.senaPotRolled ?? 0);
  const senaPotGlobal = Number(bolao.senaPotGlobal ?? 0);
  const ticketPrice = Number(bolao.ticketPrice ?? 0);
  const hasTransparency = Boolean(bolao.transparency);
  const draws = bolao.draws ?? [];
  const drawsAsc = [...draws].sort((a: any, b: any) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime());
  const drawsList = [...drawsAsc].reverse();
  const visibleDrawsList = drawsList.slice(0, visibleDraws);
  const winningNumbers: Array<number | string> = Array.from(
    new Set(
      (draws as any[])
        .flatMap((draw: any) => (Array.isArray(draw.numbers) ? draw.numbers : []))
        .map((value: any) => Number(value))
        .filter((value: number) => Number.isFinite(value)),
    ),
  );
  const allBets = bolao.bets ?? [];
  const visibleBetsList = allBets.slice(0, visibleBets);
  const totalCollected = (bolao.bets?.length ?? 0) * Number(bolao.ticketPrice ?? 0);
  const commissionPercent = Number(bolao.commissionPercent ?? 0);
  const netPool = totalCollected * (1 - commissionPercent / 100);
  const guaranteedPrize = Number(bolao.guaranteedPrize ?? 0);
  const prizePool = Math.max(guaranteedPrize, netPool);
  const prizes = bolao.prizes ?? [];
  const totalFixed = prizes.reduce((acc: number, p: any) => acc + Number(p.fixedValue ?? 0), 0);
  const totalPct = prizes.reduce((acc: number, p: any) => acc + Number(p.percentage ?? 0), 0);
  const variablePool = Math.max(prizePool - totalFixed, 0);
  const displayTotal = prizePool + senaPotApplied;
  const showSenaApplied = !isClosed && senaPotApplied > 0;
  const showSenaRolled = !isClosed && senaPotApplied === 0 && (senaPotRolled > 0 || senaPotGlobal > 0);
  const showTrend = !isClosed && !hasStarted;
  const cotaMobileClass = showSenaApplied ? "" : "col-start-2";
  const betActionClass = isClosed
    ? "bg-[#ff4d4f] text-[#0f1117]"
    : hasStarted
      ? "bg-[#f7b500] text-[#0f1117]"
      : "bg-[#3fdc7c] text-[#0f1117]";

  const toggle = (key: string) => setOpenSection((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl bg-red-900/40 p-3 text-sm text-red-100">{error}</div>}

      <section className={`relative overflow-hidden rounded-3xl border text-white shadow-lg ${statusConfig.cardClass}`}>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-70" style={statusConfig.patternStyle} aria-hidden />
        <div className="relative z-10">
          <div
            className={`flex items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-white/70 ${statusConfig.headerClass}`}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full shadow ${statusConfig.dotClass}`} aria-hidden />{" "}
              {statusConfig.label}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {isParticipant && (
                <span className="rounded-full bg-[#1ea7a4]/15 px-3 py-1 text-[#1ea7a4]">Participando</span>
              )}
              <span className="rounded-full bg-white/10 px-3 py-1">Bolao #{bolao.id.slice(0, 6)}</span>
            </div>
          </div>
          <div className="space-y-5 px-4 pb-6 pt-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold leading-tight">{bolao.name}</h1>
                  {showTrend && (
                    <div className="inline-flex items-center rounded-full border border-[#ff4d4f]/35 bg-[#ff4d4f]/10 px-2.5 py-1">
                      <svg viewBox="0 0 64 32" aria-hidden className="h-6 w-10 text-[#ff4d4f]">
                        <defs>
                          <linearGradient id="trend-up" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
                          </linearGradient>
                        </defs>
                        <path d="M4 26 L16 16 L26 19 L36 11 L48 17 L60 8 V30 H4 Z" fill="url(#trend-up)" opacity="0.4" />
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
                  )}
                </div>
                <p className="mt-1 text-sm text-white/60">
                  Inicio{" "}
                  {startsAt.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  as{" "}
                  {startsAt.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Dias oficiais: terca, quinta e sabado</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto md:flex-wrap md:justify-end">
                {showSenaApplied && (
                  <div className={`${summaryPanelClass} order-1 text-left md:order-3 md:text-right`}>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Sena acumulada</p>
                    <p className="mt-2 text-2xl font-semibold text-[#f7b500]">R$ {formatCurrency(senaPotApplied)}</p>
                  </div>
                )}
                <div
                  className={`${summaryPanelClass} order-1 ${cotaMobileClass} justify-self-end md:order-1 md:justify-self-auto`}
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Valor da cota</p>
                  <p className="mt-2 text-xl font-semibold text-[#f7b500] md:text-2xl">R$ {formatCurrency(ticketPrice)}</p>
                </div>
                <div className={`${summaryHighlightClass} order-2 col-span-2 md:order-2 md:col-auto`}>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Premiacao total</p>
                  <p className="mt-2 text-3xl font-semibold text-[#3fdc7c] md:text-2xl">R$ {formatCurrency(displayTotal)}</p>
                  {senaPotApplied > 0 && (
                    <p className="text-[11px] text-white/70">
                      (Base R$ {formatCurrency(prizePool)} + Sena acumulada R$ {formatCurrency(senaPotApplied)})
                    </p>
                  )}
                </div>
                {showSenaRolled && (
                  <div className={`${summaryPanelClass} order-3 col-span-2 md:order-4 md:col-auto`}>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Sena acumulou!</p>
                    <p className="mt-2 text-sm font-semibold text-[#f7b500]">
                      Proximo bolao futuro recebe R$ {formatCurrency(senaPotRolled > 0 ? senaPotRolled : senaPotGlobal)}
                    </p>
                  </div>
                )}
              </div>
            </header>
            <nav className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.24em] text-white/60">
              <a href="#apostar" className="rounded-2xl border border-white/5 bg-[#12141d] px-3 py-2 text-center text-white/70 hover:bg-white/10">
                Apostar
              </a>
              <a href="#sorteios" className="rounded-2xl border border-white/5 bg-[#12141d] px-3 py-2 text-center text-white/70 hover:bg-white/10">
                Sorteios
              </a>
              <a href="#premiacoes" className="rounded-2xl border border-white/5 bg-[#12141d] px-3 py-2 text-center text-white/70 hover:bg-white/10">
                Premiacao
              </a>
              <a href="#apostadores" className="rounded-2xl border border-white/5 bg-[#12141d] px-3 py-2 text-center text-white/70 hover:bg-white/10">
                Apostadores
              </a>
            </nav>
          </div>
        </div>
      </section>

      <div id="apostar">
        <PlaceBetForm bolaoId={bolao.id} actionClassName={betActionClass} />
      </div>

      <section
        id="premiacoes"
        className={sectionCardClass}
      >
        <header className="flex cursor-pointer items-center justify-between" onClick={() => toggle("premiacoes")}>
          <div>
            <h2 className="text-lg font-semibold">Premiacoes</h2>
            <p className="text-sm text-white/60">Distribuicao configurada para este bolao (valores calculados).</p>
          </div>
          <span className="text-xl">{openSection.premiacoes ? "▼" : "▶"}</span>
        </header>
        {openSection.premiacoes && (
          <ul className="space-y-3">
            {bolao.prizes?.map((prize: any) => (
              <li key={prize.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{prizeInfo[prize.type]?.title ?? prize.type}</p>
                  <p className="text-xs text-white/60">{prizeInfo[prize.type]?.description ?? "Premiacao prevista"}</p>
                </div>
                <span className="text-sm font-semibold text-[#f7b500]">
                  {(() => {
                    const fixed = Number(prize.fixedValue ?? 0);
                    const pct = Number(prize.percentage ?? 0);
                    const pctShare = totalPct > 0 ? pct / totalPct : 0;
                    const baseValue = fixed + variablePool * pctShare;
                    const bonusApplied = prize.type === "SENA_PRIMEIRO" ? (senaPotApplied > 0 ? senaPotApplied : 0) : 0;
                    const bonusAwaiting =
                      prize.type === "SENA_PRIMEIRO" && bonusApplied === 0 ? (senaPotRolled > 0 ? senaPotRolled : senaPotGlobal) : 0;
                    const totalValue = baseValue + bonusApplied;

                    if (bonusApplied > 0) {
                      return (
                        <span className="flex flex-col items-end text-right">
                          <span>R$ {formatCurrency(totalValue)}</span>
                          <span className="text-[11px] text-white/70">
                            (Base R$ {formatCurrency(baseValue)} + Acum R$ {formatCurrency(bonusApplied)} = Total)
                          </span>
                        </span>
                      );
                    }

                    if (bonusAwaiting > 0) {
                      return (
                        <span className="flex flex-col items-end text-right">
                          <span>R$ {formatCurrency(baseValue)}</span>
                          <span className="text-[11px] text-white/70">
                            Acumulara para proximo bolao: R$ {formatCurrency(bonusAwaiting)}
                          </span>
                        </span>
                      );
                    }

                    return `R$ ${formatCurrency(totalValue)}`;
                  })()}
                </span>
              </li>
            ))}
            {(!bolao.prizes || bolao.prizes.length === 0) && (
              <li className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/60">
                Nenhuma premiacao configurada para este bolao.
              </li>
            )}
          </ul>
        )}
      </section>

      {!isClosed && livePrizes.length > 0 && (
        <section className={sectionCardClass}>
          <header className="flex cursor-pointer items-center justify-between" onClick={() => toggle("live")}>
            <div>
              <h2 className="text-lg font-semibold">Premiacoes ja atingidas</h2>
              <p className="text-sm text-white/60">Premios liberados antes do encerramento.</p>
            </div>
            <span className="text-xl">{openSection.live ? "▼" : "▶"}</span>
          </header>
          {openSection.live && (
            <div className="space-y-3">
              {livePrizes.map((prize: any) => (
                <div key={prize.prizeType} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">Premiacao</p>
                      <p className="text-base font-semibold">{prize.prizeType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total distribuido</p>
                      <p className="text-lg font-semibold text-[#f7b500]">R$ {formatCurrency(Number(prize.totalValue ?? 0))}</p>
                    </div>
                  </div>
                  {prize.winners?.length ? (
                    <ul className="space-y-1 text-sm text-white/80">
                      {prize.winners.map((winner: any) => (
                        <li
                          key={`${prize.prizeType}-${winner.bet?.id ?? winner.user?.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{winner.user?.fullName ?? "Apostador"}</p>
                            {winner.bet?.numbers && (
                              <p className="text-xs text-white/60">
                                Jogo: {winner.bet.numbers.map((n: number) => n.toString().padStart(2, "0")).join(" - ")} - {winner.hits} acertos
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-[#3fdc7c]">
                            R$ {formatCurrency(Number(winner.amount ?? 0))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/60">Nenhum ganhador nesta categoria.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isClosed && prizeResults.length > 0 && (
        <section className={sectionCardClass}>
          <header className="flex cursor-pointer items-center justify-between" onClick={() => toggle("resultados")}>
            <div>
              <h2 className="text-lg font-semibold">Resultados e ganhadores</h2>
              <p className="text-sm text-white/60">
                Bolao encerrado em{" "}
                {new Date(bolao.closedAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo",
                })}
                .
              </p>
            </div>
            <span className="text-xl">{openSection.resultados ? "▼" : "▶"}</span>
          </header>
          {openSection.resultados && (
            <div className="space-y-3">
              {prizeResults.map((prize: any) => (
                <div key={prize.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">Premiacao</p>
                      <p className="text-base font-semibold">{prizeInfo[prize.prizeType]?.title ?? prize.prizeType}</p>
                      {prizeInfo[prize.prizeType]?.description && (
                        <p className="text-xs text-white/60">{prizeInfo[prize.prizeType].description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total distribuido</p>
                      <p className="text-lg font-semibold text-[#f7b500]">
                        R$ {formatCurrency(Number(prize.totalValue ?? 0))}
                      </p>
                    </div>
                  </div>
                  {prize.winners?.length ? (
                    <ul className="space-y-1 text-sm text-white/80">
                      {prize.winners.map((winner: any) => (
                        <li
                          key={winner.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{winner.user?.fullName ?? "Apostador"}</p>
                            {winner.bet?.numbers && (
                              <p className="text-xs text-white/60">
                                Jogo: {winner.bet.numbers.map((n: number) => n.toString().padStart(2, "0")).join(" - ")}
                                {winner.hits ? ` â€¢ ${winner.hits} acertos` : ""}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-[#3fdc7c]">
                            R$ {formatCurrency(Number(winner.amount ?? 0))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/60">Nenhum ganhador nesta categoria.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section id="sorteios" className={sectionCardClass}>
        <header className="flex cursor-pointer items-center justify-between" onClick={() => toggle("sorteios")}>
          <div>
            <h2 className="text-lg font-semibold">Sorteios</h2>
            <p className="text-sm text-white/60">Resultados oficiais vinculados a este bolao.</p>
          </div>
          <span className="text-xl">{openSection.sorteios ? "▼" : "▶"}</span>
        </header>
        {openSection.sorteios && (
          <>
            {drawsAsc.length === 0 ? (
              <p className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/70">Nenhum sorteio registrado ainda.</p>
            ) : (
              <div ref={drawsRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {visibleDrawsList.map((draw: any) => (
                  <div key={draw.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Data</p>
                        <p className="font-semibold">
                          {new Date(draw.drawnAt).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                            timeZone: "America/Sao_Paulo",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {draw.numbers?.map((num: number) => (
                          <span
                            key={num}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1f2c] text-xs font-semibold text-[#f7b500]"
                          >
                            {num.toString().padStart(2, "0")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section
        id="apostadores"
        className={sectionCardClass}
      >
        <header
          className="flex cursor-pointer flex-wrap items-center justify-between gap-4"
          onClick={() => toggle("apostadores")}
        >
          <h2 className="text-lg font-semibold text-white">Lista de apostadores</h2>
          <TransparencyDownload bolaoId={bolao.id} hasFile={hasTransparency} />
          <span className="text-xl">{openSection.apostadores ? "▼" : "▶"}</span>
        </header>
        {openSection.apostadores && (
          <div ref={betsRef} className="max-h-96 space-y-2 overflow-y-auto pr-1">
            <BetsList bets={visibleBetsList as any[]} winningNumbers={winningNumbers} />
            {allBets.length > visibleBets && (
              <button
                type="button"
                className="w-full rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                onClick={() => setVisibleBets((prev) => Math.min(prev + 15, allBets.length))}
              >
                Carregar mais apostadores
              </button>
            )}
          </div>
        )}
      </section>

      {(isParticipant || myBets.length > 0) && (
        <section className={sectionCardClass}>
          <header className="flex cursor-pointer items-center justify-between" onClick={() => toggle("minhasApostas")}>
            <div>
              <h2 className="text-lg font-semibold">Minhas apostas</h2>
              <p className="text-sm text-white/60">Visualize suas apostas neste bolao.</p>
            </div>
            <span className="text-xl">{openSection.minhasApostas ? "▼" : "▶"}</span>
          </header>
          {openSection.minhasApostas && (
            <div className="max-h-96 overflow-y-auto pr-1">
              <BetsList bets={myBets as any[]} winningNumbers={winningNumbers} />
              {myBets.length === 0 && <p className="text-sm text-white/60">Nenhuma aposta sua aqui ainda.</p>}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
