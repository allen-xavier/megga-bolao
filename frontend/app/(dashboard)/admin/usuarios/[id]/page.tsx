"use client";

import { useCallback, useEffect, useMemo, useState, type UIEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { api } from "@/lib/api";

type UserOverview = {
  user: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    cpf: string;
    city?: string | null;
    state?: string | null;
    pixKey?: string | null;
    acceptedTerms?: boolean;
    createdAt?: string;
  };
  wallet?: {
    balance: string;
    locked: string;
    updatedAt: string;
  } | null;
  bets: Array<{
    id: string;
    numbers: number[];
    isSurprise: boolean;
    createdAt: string;
    bolao: {
      id: string;
      name: string;
      startsAt: string;
      closedAt?: string | null;
      ticketPrice: string;
    };
  }>;
  prizeWins: Array<{
    id: string;
    amount: string;
    hits: number;
    createdAt: string;
    bet: { id: string; numbers: number[] };
    prizeResult: {
      prizeType: string;
      totalValue: string;
      bolaoResult: {
        closedAt: string;
        bolao: { id: string; name: string };
      };
    };
  }>;
  payments: Array<{
    id: string;
    amount: string;
    type: "DEPOSIT" | "WITHDRAW" | "COMMISSION" | "PRIZE";
    status: string;
    createdAt: string;
    processedAt?: string | null;
    metadata?: { [key: string]: any } | null;
    receiptPath?: string | null;
    receiptFilename?: string | null;
    receiptMime?: string | null;
  }>;
  commissions: Array<{
    id: string;
    amount: string;
    description: string;
    referenceId?: string | null;
    createdAt: string;
  }>;
};

const fetcher = (url: string, token?: string) =>
  api.get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((r) => r.data);

const LIST_PAGE_SIZE = 5;

const formatCurrency = (value?: string | number | null) => {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const downloadReceipt = async (paymentId: string, token?: string | null) => {
  if (!token) return;
  try {
    const response = await api.get(`/payments/${paymentId}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] ?? "";
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const filename = match?.[1] ?? `comprovante-${paymentId}.pdf`;
    const url = window.URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
};

const formatNumbers = (numbers?: number[]) => {
  if (!numbers || numbers.length === 0) return "--";
  return numbers.join(", ");
};

type SectionKey = "boloes" | "apostas" | "ganhos" | "depositos" | "saques" | "comissoes";

export default function AdminUsuarioOverviewPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [visibleCounts, setVisibleCounts] = useState({
    boloes: LIST_PAGE_SIZE,
    apostas: LIST_PAGE_SIZE,
    ganhos: LIST_PAGE_SIZE,
    depositos: LIST_PAGE_SIZE,
    saques: LIST_PAGE_SIZE,
    comissoes: LIST_PAGE_SIZE,
  });

  const { data, error, isLoading } = useSWR<UserOverview>(
    token && isAdmin && userId ? [`/admin/users/${userId}/overview`, token] as const : null,
    ([url, t]: readonly [string, string]) => fetcher(url, t),
    { revalidateOnFocus: false },
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [],
  );

  const isWithinRange = useCallback((value?: string | null) => {
    if (!filterFrom && !filterTo) return true;
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const key = dateFormatter.format(date);
    if (filterFrom && key < filterFrom) return false;
    if (filterTo && key > filterTo) return false;
    return true;
  }, [filterFrom, filterTo, dateFormatter]);

  const filteredBets = useMemo(() => (data?.bets ?? []).filter((bet) => isWithinRange(bet.createdAt)), [data?.bets, isWithinRange]);
  const filteredPrizeWins = useMemo(
    () => (data?.prizeWins ?? []).filter((win) => isWithinRange(win.createdAt)),
    [data?.prizeWins, isWithinRange],
  );
  const filteredPayments = useMemo(
    () => (data?.payments ?? []).filter((payment) => isWithinRange(payment.createdAt)),
    [data?.payments, isWithinRange],
  );
  const filteredCommissions = useMemo(
    () => (data?.commissions ?? []).filter((entry) => isWithinRange(entry.createdAt)),
    [data?.commissions, isWithinRange],
  );

  const betsByBolao = useMemo(() => {
    const map = new Map<string, { bolaoId: string; name: string; startsAt?: string; closedAt?: string | null; count: number }>();
    filteredBets.forEach((bet) => {
      const existing = map.get(bet.bolao.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(bet.bolao.id, {
          bolaoId: bet.bolao.id,
          name: bet.bolao.name,
          startsAt: bet.bolao.startsAt,
          closedAt: bet.bolao.closedAt,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [filteredBets]);

  const allDeposits = useMemo(() => (data?.payments ?? []).filter((p) => p.type === "DEPOSIT"), [data?.payments]);
  const allWithdraws = useMemo(() => (data?.payments ?? []).filter((p) => p.type === "WITHDRAW"), [data?.payments]);
  const deposits = useMemo(() => filteredPayments.filter((p) => p.type === "DEPOSIT"), [filteredPayments]);
  const withdraws = useMemo(() => filteredPayments.filter((p) => p.type === "WITHDRAW"), [filteredPayments]);
  const totalDeposits = useMemo(
    () => allDeposits.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0),
    [allDeposits],
  );
  const totalWithdraws = useMemo(
    () => allWithdraws.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0),
    [allWithdraws],
  );
  const totalCommissions = useMemo(
    () => (data?.commissions ?? []).reduce((acc, entry) => acc + Number(entry.amount ?? 0), 0),
    [data?.commissions],
  );
  const totalPrizes = useMemo(
    () => (data?.prizeWins ?? []).reduce((acc, win) => acc + Number(win.amount ?? 0), 0),
    [data?.prizeWins],
  );

  useEffect(() => {
    setVisibleCounts({
      boloes: LIST_PAGE_SIZE,
      apostas: LIST_PAGE_SIZE,
      ganhos: LIST_PAGE_SIZE,
      depositos: LIST_PAGE_SIZE,
      saques: LIST_PAGE_SIZE,
      comissoes: LIST_PAGE_SIZE,
    });
  }, [filterFrom, filterTo, data?.bets?.length, data?.prizeWins?.length, data?.payments?.length, data?.commissions?.length]);

  const handleListScroll = (section: SectionKey, total: number) => (event: UIEvent<HTMLDivElement>) => {
    if (total <= LIST_PAGE_SIZE) return;
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (!nearBottom) return;
    setVisibleCounts((current) => {
      if (current[section] >= total) return current;
      return {
        ...current,
        [section]: Math.min(total, current[section] + LIST_PAGE_SIZE),
      };
    });
  };

  const toggleSection = (section: SectionKey) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const visibleBoloes = betsByBolao.slice(0, visibleCounts.boloes);
  const visibleBets = filteredBets.slice(0, visibleCounts.apostas);
  const visibleWins = filteredPrizeWins.slice(0, visibleCounts.ganhos);
  const visibleDeposits = deposits.slice(0, visibleCounts.depositos);
  const visibleWithdraws = withdraws.slice(0, visibleCounts.saques);
  const visibleCommissions = filteredCommissions.slice(0, visibleCounts.comissoes);

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-white shadow-lg ring-1 ring-white/5 md:p-6">
        <p className="text-sm text-white/80">Faça login como administrador para acessar esta página.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-white shadow-lg ring-1 ring-white/5 md:p-6">
        <p className="text-sm text-megga-rose">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Usuário</p>
        <h1 className="text-2xl font-semibold">{data?.user?.fullName ?? "Perfil do usuario"}</h1>
        <p className="text-sm text-white/70">
          Atividade completa do usuário: apostas, bolões, ganhos, depósitos, saques e comissões.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/usuarios"
          className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
        >
          Voltar
        </Link>
        {userId && (
          <Link
            href={`/admin/usuarios/${userId}/editar`}
            className="rounded-2xl bg-[#1ea7a4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f1117] transition hover:brightness-110"
          >
            Editar perfil
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-sm text-white/70 shadow-lg ring-1 ring-white/5 md:p-6">
          Carregando perfil do usuario...
        </div>
      )}
      {error && (
        <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-sm text-megga-rose shadow-lg ring-1 ring-white/5 md:p-6">
          Erro ao carregar detalhes: {error?.message ?? "falha desconhecida"}
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Saldo</p>
              <p className="mt-3 text-2xl font-semibold text-megga-yellow">R$ {formatCurrency(data.wallet?.balance)}</p>
              <p className="mt-2 text-sm text-white/60">Bloqueado: R$ {formatCurrency(data.wallet?.locked)}</p>
            </div>
            <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Resumo</p>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p>Apostas: {data.bets.length}</p>
                <p>Bolões: {betsByBolao.length}</p>
                <p>Premiacoes: R$ {formatCurrency(totalPrizes)}</p>
                <p>Depositos: R$ {formatCurrency(totalDeposits)}</p>
                <p>Saques: R$ {formatCurrency(totalWithdraws)}</p>
                <p>Comissões: R$ {formatCurrency(totalCommissions)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Filtro de periodo</p>
                <p className="mt-2 text-sm text-white/70">Aplica-se aos menus abaixo.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                  De
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(event) => setFilterFrom(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
                  />
                </label>
                <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                  Até
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(event) => setFilterTo(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <button
              type="button"
              onClick={() => toggleSection("boloes")}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={openSection === "boloes"}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Bolões</p>
                <h2 className="mt-2 text-xl font-semibold">Bolões participados</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                {openSection === "boloes" ? "Fechar" : "Abrir"}
              </span>
            </button>
            {openSection === "boloes" && (
              <div className="mt-4 max-h-[320px] overflow-y-auto pr-2" onScroll={handleListScroll("boloes", betsByBolao.length)}>
                {betsByBolao.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">Nenhum bolao encontrado.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/80">
                    {visibleBoloes.map((bolao) => (
                      <li key={bolao.bolaoId} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 md:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{bolao.name}</p>
                            <p className="text-xs text-white/60">Inicia em: {formatDate(bolao.startsAt)}</p>
                          </div>
                          <div className="text-right text-sm text-white/70">
                            <p>{bolao.count} aposta(s)</p>
                            <p className="text-xs text-white/50">{bolao.closedAt ? "Encerrado" : "Em andamento"}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <button
              type="button"
              onClick={() => toggleSection("apostas")}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={openSection === "apostas"}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Apostas</p>
                <h2 className="mt-2 text-xl font-semibold">Apostas realizadas</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                {openSection === "apostas" ? "Fechar" : "Abrir"}
              </span>
            </button>
            {openSection === "apostas" && (
              <div className="mt-4 max-h-[320px] overflow-y-auto pr-2" onScroll={handleListScroll("apostas", filteredBets.length)}>
                {filteredBets.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">Nenhuma aposta registrada.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/80">
                    {visibleBets.map((bet) => (
                      <li key={bet.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 md:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{bet.bolao.name}</p>
                            <p className="text-xs text-white/60">Feita em: {formatDate(bet.createdAt)}</p>
                          </div>
                          <div className="text-right text-sm text-white/70">
                            <p>{bet.isSurprise ? "Surpresinha" : "Manual"}</p>
                            <p className="text-xs text-white/50">Cota: R$ {formatCurrency(bet.bolao.ticketPrice)}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/70">
                          Numeros: {formatNumbers(bet.numbers)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <button
              type="button"
              onClick={() => toggleSection("ganhos")}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={openSection === "ganhos"}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ganhos</p>
                <h2 className="mt-2 text-xl font-semibold">Premiacoes recebidas</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                {openSection === "ganhos" ? "Fechar" : "Abrir"}
              </span>
            </button>
            {openSection === "ganhos" && (
              <div className="mt-4 max-h-[320px] overflow-y-auto pr-2" onScroll={handleListScroll("ganhos", filteredPrizeWins.length)}>
                {filteredPrizeWins.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">Nenhuma premiação registrada.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/80">
                    {visibleWins.map((win) => (
                      <li key={win.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 md:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{win.prizeResult.bolaoResult.bolao.name}</p>
                            <p className="text-xs text-white/60">Prêmio: {win.prizeResult.prizeType}</p>
                          </div>
                          <div className="text-right text-sm text-white/70">
                            <p className="text-megga-lime">R$ {formatCurrency(win.amount)}</p>
                            <p className="text-xs text-white/50">{formatDate(win.createdAt)}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/70">
                          Numeros: {formatNumbers(win.bet.numbers)} | Acertos: {win.hits}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <button
              type="button"
              onClick={() => toggleSection("depositos")}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={openSection === "depositos"}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Depositos</p>
                <h2 className="mt-2 text-xl font-semibold">Histórico de depósitos</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                {openSection === "depositos" ? "Fechar" : "Abrir"}
              </span>
            </button>
            {openSection === "depositos" && (
              <div className="mt-4 max-h-[320px] overflow-y-auto pr-2" onScroll={handleListScroll("depositos", deposits.length)}>
                {deposits.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">Nenhum deposito registrado.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/80">
                    {visibleDeposits.map((payment) => (
                      <li key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 md:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">R$ {formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-white/60">Solicitado em: {formatDate(payment.createdAt)}</p>
                          </div>
                          <div className="text-right text-xs uppercase tracking-[0.3em] text-white/60">
                            <span>{payment.status}</span>
                            {payment.receiptPath && (
                              <button
                                type="button"
                                onClick={() => downloadReceipt(payment.id, token)}
                                className="mt-2 inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/70 transition hover:border-megga-yellow hover:text-white"
                                aria-label="Baixar comprovante"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M12 3v12" />
                                  <path d="m7 10 5 5 5-5" />
                                  <path d="M5 21h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <button
              type="button"
              onClick={() => toggleSection("saques")}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={openSection === "saques"}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Saques</p>
                <h2 className="mt-2 text-xl font-semibold">Histórico de saques</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                {openSection === "saques" ? "Fechar" : "Abrir"}
              </span>
            </button>
            {openSection === "saques" && (
              <div className="mt-4 max-h-[320px] overflow-y-auto pr-2" onScroll={handleListScroll("saques", withdraws.length)}>
                {withdraws.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">Nenhum saque registrado.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/80">
                    {visibleWithdraws.map((payment) => (
                      <li key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 md:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">R$ {formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-white/60">Solicitado em: {formatDate(payment.createdAt)}</p>
                          </div>
                          <div className="text-right text-xs uppercase tracking-[0.3em] text-white/60">
                            <span>{payment.status}</span>
                            {payment.receiptPath && (
                              <button
                                type="button"
                                onClick={() => downloadReceipt(payment.id, token)}
                                className="mt-2 inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/70 transition hover:border-megga-yellow hover:text-white"
                                aria-label="Baixar comprovante"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M12 3v12" />
                                  <path d="m7 10 5 5 5-5" />
                                  <path d="M5 21h14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-white/50">Processado em: {formatDate(payment.processedAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
            <button
              type="button"
              onClick={() => toggleSection("comissoes")}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={openSection === "comissoes"}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Afiliados</p>
                <h2 className="mt-2 text-xl font-semibold">Comissões de afiliados</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                {openSection === "comissoes" ? "Fechar" : "Abrir"}
              </span>
            </button>
            {openSection === "comissoes" && (
              <div className="mt-4 max-h-[320px] overflow-y-auto pr-2" onScroll={handleListScroll("comissoes", filteredCommissions.length)}>
                {filteredCommissions.length === 0 ? (
                  <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">Nenhuma comissão registrada.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/80">
                    {visibleCommissions.map((entry) => (
                      <li key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 md:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">R$ {formatCurrency(entry.amount)}</p>
                            <p className="text-xs text-white/60">{entry.description}</p>
                          </div>
                          <p className="text-xs text-white/50">{formatDate(entry.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
