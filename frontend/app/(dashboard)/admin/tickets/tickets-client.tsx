"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

type TicketPrize = {
  amount: string;
  hits: number;
  prizeResult: {
    prizeType: string;
  };
};

type Ticket = {
  id: string;
  numbers: number[];
  isSurprise: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    cpf: string;
    phone?: string | null;
    email?: string | null;
  };
  bolao: {
    id: string;
    name: string;
    startsAt: string;
    closedAt?: string | null;
    ticketPrice: string;
    transparency?: { id: string } | null;
  };
  prizeWinners: TicketPrize[];
};

const fetcher = <T,>(url: string, token?: string) =>
  api.get<T>(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((r) => r.data);

const statusStyles: Record<string, string> = {
  Premiado: "bg-megga-lime/15 text-megga-lime border-megga-lime/30",
  "Em andamento": "bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30",
  Aguardando: "bg-white/10 text-white/70 border-white/15",
  "Nao premiado": "bg-red-500/10 text-red-200 border-red-500/30",
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const formatNumbers = (numbers: number[]) =>
  numbers.map((num) => num.toString().padStart(2, "0"));

function getTicketStatus(ticket: Ticket) {
  const prizeTotal = ticket.prizeWinners.reduce((acc, winner) => acc + Number(winner.amount ?? 0), 0);
  if (prizeTotal > 0) return "Premiado";
  if (ticket.bolao?.closedAt) return "Nao premiado";
  const startsAt = new Date(ticket.bolao.startsAt);
  if (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= Date.now()) return "Em andamento";
  return "Aguardando";
}

function StatusPill({ status }: { status: string }) {
  const colors = statusStyles[status] ?? "bg-white/10 text-white/70 border-white/15";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${colors}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export default function TicketsAdminClient() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const [userFilter, setUserFilter] = useState("");
  const [bolaoFilter, setBolaoFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const ticketsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (userFilter.trim()) params.set("search", userFilter.trim());
    if (bolaoFilter.trim()) params.set("bolao", bolaoFilter.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    params.set("page", "1");
    params.set("perPage", "200");
    return `/admin/tickets?${params.toString()}`;
  }, [userFilter, bolaoFilter, dateFrom, dateTo]);

  const { data, error, isLoading, mutate } = useSWR<Ticket[], any, [string, string] | null>(
    token && isAdmin ? [ticketsUrl, token] as [string, string] : null,
    ([url, t]) => fetcher<Ticket[]>(url, t),
    { revalidateOnFocus: false },
  );

  const tickets = data ?? [];
  const totalPrize = useMemo(
    () => tickets.reduce((acc, ticket) => acc + ticket.prizeWinners.reduce((sum, win) => sum + Number(win.amount ?? 0), 0), 0),
    [tickets],
  );

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-white shadow-lg ring-1 ring-white/5 md:p-6">
        <p className="text-sm text-white/80">Faca login como administrador para acessar os tickets.</p>
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
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Administracao</p>
        <h1 className="text-2xl font-semibold">Tickets de apostas</h1>
        <p className="text-sm text-white/70">Filtre tickets por usuario, bolao ou periodo.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl bg-megga-navy/80 px-2 py-4 shadow-lg ring-1 ring-white/5 md:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Total de tickets</p>
          <p className="mt-2 text-2xl font-semibold text-white">{tickets.length}</p>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 px-2 py-4 shadow-lg ring-1 ring-white/5 md:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Premios pagos</p>
          <p className="mt-2 text-2xl font-semibold text-megga-lime">R$ {formatCurrency(totalPrize)}</p>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 px-2 py-4 shadow-lg ring-1 ring-white/5 md:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Atualizacao</p>
          <p className="mt-2 text-sm text-white/70">Atualize para conferir novos tickets.</p>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 px-2 py-5 shadow-lg ring-1 ring-white/5 md:p-6 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Filtros</p>
            <p className="text-sm text-white/70">Usuario, bolao e periodo.</p>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
          >
            Atualizar
          </button>
        </div>

        <div className="grid w-full min-w-0 max-w-full gap-3 overflow-hidden md:grid-cols-3">
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            Usuario
            <input
              type="text"
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
              placeholder="Nome, CPF ou telefone"
              className="mt-2 block w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            Bolao
            <input
              type="text"
              value={bolaoFilter}
              onChange={(event) => setBolaoFilter(event.target.value)}
              placeholder="Nome ou codigo"
              className="mt-2 block w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            De
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-2 block w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
          <label className="flex w-full min-w-0 flex-col overflow-hidden text-[11px] uppercase tracking-[0.3em] text-white/50">
            Ate
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-2 block w-full min-w-0 max-w-full rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none box-border"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setUserFilter("");
              setBolaoFilter("");
              setDateFrom("");
              setDateTo("");
            }}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
          >
            Limpar filtros
          </button>
        </div>

        {isLoading && <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">Carregando tickets...</p>}
        {error && (
          <p className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-megga-rose md:px-4">
            Erro ao carregar tickets: {error?.message ?? "falha desconhecida"}
          </p>
        )}

        <div className="space-y-4">
          {tickets.map((ticket) => {
            const statusLabel = getTicketStatus(ticket);
            const prizeAmount = ticket.prizeWinners.reduce((acc, winner) => acc + Number(winner.amount ?? 0), 0);
            const numbers = formatNumbers(ticket.numbers ?? []);
            const hasTransparency = Boolean(ticket.bolao?.transparency);
            const prizeText = prizeAmount > 0
              ? `R$ ${formatCurrency(prizeAmount)}`
              : statusLabel === "Nao premiado"
                ? "Sem premio"
                : "Aguardando";

            return (
              <article key={ticket.id} className="rounded-3xl bg-megga-navy/80 px-2 py-4 shadow-lg ring-1 ring-white/5 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Ticket #{ticket.id.slice(0, 8)}</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">{ticket.bolao?.name ?? "Bolao"}</h2>
                    <p className="mt-1 text-xs text-white/60">Criado em: {formatDate(ticket.createdAt)}</p>
                  </div>
                  <StatusPill status={statusLabel} />
                </div>

                <div className="mt-3 rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Usuario</p>
                  <p className="mt-2 text-sm font-semibold text-white">{ticket.user?.fullName ?? "Usuario"}</p>
                  <p className="text-xs text-white/60">CPF: {ticket.user?.cpf ?? "--"} | Tel: {ticket.user?.phone ?? "--"}</p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Numeros apostados</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {numbers.map((num) => (
                        <span
                          key={`${ticket.id}-${num}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1f2c] text-xs font-semibold text-[#f7b500]"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-[0.3em] text-white/40">Premiacao</span>
                      <span className={`text-base font-semibold ${prizeAmount > 0 ? "text-megga-lime" : "text-megga-yellow"}`}>
                        {prizeText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Cota</span>
                      <span>R$ {formatCurrency(Number(ticket.bolao?.ticketPrice ?? 0))}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Tipo</span>
                      <span>{ticket.isSurprise ? "Surpresinha" : "Manual"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/boloes/${ticket.bolao?.id}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
                  >
                    Ver bolao
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasTransparency) return;
                      window.open(`/api/boloes/${ticket.bolao?.id}/transparency`, "_blank", "noopener");
                    }}
                    disabled={!hasTransparency}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Baixar transparencia
                  </button>
                </div>
              </article>
            );
          })}

          {!isLoading && tickets.length === 0 && (
            <div className="rounded-2xl bg-white/5 px-2 py-3 text-sm text-white/70 md:px-4">
              Nenhum ticket encontrado para este filtro.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
