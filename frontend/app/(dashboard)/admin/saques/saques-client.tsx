"use client";

import { useEffect, useMemo, useState, type UIEvent } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type WithdrawStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELED";

type WithdrawPayment = {
  id: string;
  amount: string;
  status: WithdrawStatus;
  createdAt: string;
  processedAt?: string | null;
  metadata?: {
    note?: string;
    reason?: string;
    requiresApproval?: boolean;
    auto?: boolean;
  } | null;
  user: {
    id: string;
    fullName: string;
    cpf: string;
    pixKey?: string | null;
    phone?: string | null;
    email?: string | null;
  };
};

const fetcher = <T,>(url: string, token?: string) =>
  api.get<T>(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((r) => r.data);

const HISTORY_PAGE_SIZE = 20;

const statusStyles = (status: WithdrawStatus) => {
  if (status === "COMPLETED") return "bg-megga-lime/15 text-megga-lime border-megga-lime/30";
  if (status === "FAILED") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (status === "CANCELED") return "bg-white/10 text-white/60 border-white/20";
  if (status === "PENDING") return "bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30";
  return "bg-megga-yellow/20 text-megga-yellow border-megga-yellow/40";
};

export default function SaquesClient() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId") ?? "";

  const [actionId, setActionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const approvalsUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", "PROCESSING");
    if (userIdParam) {
      params.set("userId", userIdParam);
    }
    return `/payments/admin/withdraws?${params.toString()}`;
  }, [userIdParam]);

  const {
    data: approvals,
    error: approvalsError,
    isLoading: approvalsLoading,
    mutate: mutateApprovals,
  } = useSWR<WithdrawPayment[], any, [string, string] | null>(
    token && isAdmin ? [approvalsUrl, token] as [string, string] : null,
    ([url, t]) => fetcher<WithdrawPayment[]>(url, t),
    { revalidateOnFocus: false },
  );

  const getHistoryKey = (pageIndex: number, previousPageData: WithdrawPayment[] | null) => {
    if (previousPageData && previousPageData.length < HISTORY_PAGE_SIZE) return null;
    const params = new URLSearchParams();
    params.set("page", String(pageIndex + 1));
    params.set("perPage", String(HISTORY_PAGE_SIZE));
    if (historySearch.trim()) {
      params.set("search", historySearch.trim());
    }
    if (historyFrom) {
      params.set("from", historyFrom);
    }
    if (historyTo) {
      params.set("to", historyTo);
    }
    if (userIdParam) {
      params.set("userId", userIdParam);
    }
    return `/payments/admin/withdraws?${params.toString()}`;
  };

  const historyKeyLoader = (index: number, previous: WithdrawPayment[] | null) => {
    if (!token || !isAdmin) return null;
    const key = getHistoryKey(index, previous ?? null);
    if (!key) return null;
    return [key, token] as const;
  };

  const {
    data: historyPages,
    error: historyError,
    isLoading: historyLoading,
    size,
    setSize,
    mutate: mutateHistory,
  } = useSWRInfinite<WithdrawPayment[], any>(
    historyKeyLoader,
    ([url, t]: readonly [string, string]) => fetcher<WithdrawPayment[]>(url, t),
    { revalidateOnFocus: false },
  );

  const historyItems = useMemo(
    () =>
      historyPages
        ? historyPages.filter((page): page is WithdrawPayment[] => Boolean(page)).flat()
        : [],
    [historyPages],
  );
  const historyLastPage = historyPages ? historyPages[historyPages.length - 1] : undefined;
  const historyReachedEnd = historyPages ? (historyLastPage ? historyLastPage.length < HISTORY_PAGE_SIZE : false) : false;
  const historyLoadingMore = Boolean(historyPages && historyPages[historyPages.length - 1] === undefined);

  useEffect(() => {
    setSize(1);
  }, [historySearch, historyFrom, historyTo, userIdParam, setSize]);

  const formatCurrency = (value: string) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

  const refreshAll = () => {
    mutateApprovals();
    mutateHistory();
  };

  const handleHistoryScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (historyLoading || historyLoadingMore || historyReachedEnd) return;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (nearBottom) {
      setSize((current) => current + 1);
    }
  };

  const handleComplete = async (paymentId: string) => {
    if (!token) return;
    const ok = window.confirm("Concluir este saque?");
    if (!ok) return;
    setActionId(paymentId);
    setActionMessage(null);
    try {
      await api.patch(`/payments/${paymentId}/withdraw/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setActionMessage("Saque aprovado com sucesso.");
      refreshAll();
    } catch (err: any) {
      setActionMessage(err?.response?.data?.message ?? "Falha ao concluir saque.");
    } finally {
      setActionId(null);
    }
  };

  const handleFail = async (paymentId: string) => {
    if (!token) return;
    const ok = window.confirm("Negar este saque?");
    if (!ok) return;
    const reasonInput = window.prompt("Motivo da negacao (opcional):");
    const reason = reasonInput?.trim();
    setActionId(paymentId);
    setActionMessage(null);
    try {
      await api.patch(
        `/payments/${paymentId}/withdraw/fail`,
        reason ? { reason } : {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setActionMessage("Saque negado e saldo liberado.");
      refreshAll();
    } catch (err: any) {
      setActionMessage(err?.response?.data?.message ?? "Falha ao negar saque.");
    } finally {
      setActionId(null);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-white shadow-lg ring-1 ring-white/5 md:p-6">
        <p className="text-sm text-white/80">Faca login como administrador para acessar as aprovacoes de saque.</p>
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
        <p className="text-sm text-megga-rose">Voce nao tem permissao para acessar esta pagina.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pagamentos</p>
        <h1 className="text-2xl font-semibold">Aprovacoes de saque</h1>
        <p className="text-sm text-white/70">Gerencie pedidos pendentes e acompanhe o historico completo de saques.</p>
      </header>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pedidos em aberto</p>
            <h2 className="mt-2 text-xl font-semibold">Saques para aprovacao</h2>
            <p className="text-sm text-white/70">Apenas saques em processamento aparecem aqui.</p>
          </div>
          <button
            type="button"
            onClick={() => mutateApprovals()}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
          >
            Atualizar
          </button>
        </div>

        {userIdParam && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-xs text-white/70 md:px-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Filtro</p>
            <p className="mt-2 text-sm">Usuario filtrado: {userIdParam}</p>
            <Link href="/admin/saques" className="mt-2 inline-flex text-xs text-megga-yellow hover:underline">
              Ver todos
            </Link>
          </div>
        )}

        {actionMessage && <p className="rounded-2xl bg-white/10 px-2 py-3 text-sm text-megga-lime md:px-4">{actionMessage}</p>}
        {approvalsLoading && (
          <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">Carregando saques...</p>
        )}
        {approvalsError && (
          <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-megga-rose md:px-4">
            Erro ao carregar saques: {approvalsError?.message ?? "falha desconhecida"}
          </p>
        )}

        <ul className="space-y-3">
          {(approvals ?? []).map((payment) => {
            const disableActions = actionId === payment.id;
            return (
              <li key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 text-sm text-white/80 md:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{payment.user?.fullName ?? "Usuario"}</p>
                    <p className="text-xs text-white/60">CPF: {payment.user?.cpf ?? "--"} | PIX: {payment.user?.pixKey ?? "--"}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusStyles(payment.status)}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                      {payment.status}
                    </span>
                    <p className="mt-2 text-lg font-semibold text-megga-yellow">R$ {formatCurrency(payment.amount)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-white/60 md:grid-cols-2">
                  <p>
                    <span className="text-white/40">Solicitado em:</span> {formatDate(payment.createdAt)}
                  </p>
                  <p>
                    <span className="text-white/40">Nota:</span> {payment.metadata?.note ?? "--"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleComplete(payment.id)}
                    disabled={disableActions}
                    className="rounded-2xl bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-megga-navy transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFail(payment.id)}
                    disabled={disableActions}
                    className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Negar
                  </button>
                </div>
              </li>
            );
          })}
          {!approvalsLoading && (approvals?.length ?? 0) === 0 && (
            <li className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">
              Nenhum saque aguardando aprovacao.
            </li>
          )}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Extrato</p>
            <h2 className="mt-2 text-xl font-semibold">Historico de saques</h2>
            <p className="text-sm text-white/70">Pedidos, aprovados e negados com filtros por usuario e data.</p>
          </div>
          <button
            type="button"
            onClick={() => mutateHistory()}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
          >
            Atualizar
          </button>
        </div>

        <div className="grid w-full min-w-0 gap-3 md:grid-cols-3">
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            Usuario (nome, CPF ou PIX)
            <input
              type="text"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              className="mt-2 w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            De
            <input
              type="date"
              value={historyFrom}
              onChange={(event) => setHistoryFrom(event.target.value)}
              className="mt-2 w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            Ate
            <input
              type="date"
              value={historyTo}
              onChange={(event) => setHistoryTo(event.target.value)}
              className="mt-2 w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setHistorySearch("");
              setHistoryFrom("");
              setHistoryTo("");
            }}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
          >
            Limpar filtros
          </button>
        </div>

        {historyLoading && (
          <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">Carregando historico...</p>
        )}
        {historyError && (
          <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-megga-rose md:px-4">
            Erro ao carregar historico: {historyError?.message ?? "falha desconhecida"}
          </p>
        )}

        <div className="max-h-[70vh] overflow-y-auto pr-2 md:max-h-[720px]" onScroll={handleHistoryScroll}>
          <ul className="space-y-3">
            {historyItems.map((payment) => (
              <li key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-4 text-sm text-white/80 md:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{payment.user?.fullName ?? "Usuario"}</p>
                    <p className="text-xs text-white/60">CPF: {payment.user?.cpf ?? "--"} | PIX: {payment.user?.pixKey ?? "--"}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusStyles(payment.status)}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                      {payment.status}
                    </span>
                    <p className="mt-2 text-lg font-semibold text-megga-yellow">R$ {formatCurrency(payment.amount)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-white/60 md:grid-cols-2">
                  <p>
                    <span className="text-white/40">Solicitado em:</span> {formatDate(payment.createdAt)}
                  </p>
                  <p>
                    <span className="text-white/40">Processado em:</span> {formatDate(payment.processedAt)}
                  </p>
                  <p>
                    <span className="text-white/40">Nota:</span> {payment.metadata?.note ?? "--"}
                  </p>
                  <p>
                    <span className="text-white/40">Motivo:</span> {payment.metadata?.reason ?? "--"}
                  </p>
                </div>
              </li>
            ))}
            {historyLoadingMore && (
              <li className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">
                Carregando mais saques...
              </li>
            )}
            {!historyLoading && historyItems.length === 0 && (
              <li className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-sm text-white/60 md:px-4">
                Nenhum saque encontrado para este filtro.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
