"use client";

import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

type Bolao = {
  id: string;
  name: string;
  startsAt: string;
  closedAt?: string | null;
  guaranteedPrize?: number | null;
  ticketPrice?: number | null;
  minimumQuotas?: number | null;
};

type AdminStats = {
  totalBets: number;
  totalPaid: number;
  adminBalance: number;
  walletOutstanding: number;
};

const fetcher = (url: string, token?: string) =>
  api
    .get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((response) => response.data);

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "R$ 0,00";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;

  const { data: boloes, error: boloesError } = useSWR<Bolao[]>(
    token ? ["/boloes", token] as const : null,
    ([url, t]: [string, string]) => fetcher(url, t),
    { revalidateOnFocus: false },
  );
  const { data: statsData, error: statsError } = useSWR<AdminStats>(
    token ? ["/admin/stats", token] as const : null,
    ([url, t]: [string, string]) => fetcher(url, t),
    { revalidateOnFocus: false },
  );

  const now = Date.now();
  const bolaoStats = (() => {
    const list = boloes ?? [];
    const andamento = list.filter((b) => !b.closedAt && new Date(b.startsAt).getTime() <= now);
    const futuros = list.filter((b) => !b.closedAt && new Date(b.startsAt).getTime() > now);
    const encerrados = list.filter((b) => b.closedAt);
    const garantida = andamento.reduce((acc, b) => acc + Number(b.guaranteedPrize ?? 0), 0);
    return { andamento, futuros, encerrados, garantida };
  })();

  const destaques = (bolo: Bolao[]) =>
    bolo
      ?.filter((b) => !b.closedAt)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 3) ?? [];

  if (!token || status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faca login como administrador para acessar o painel.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  const unauthorized = boloesError?.response?.status === 401 || statsError?.response?.status === 401;
  if (unauthorized) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Sessao expirada ou sem permissao. Faca login novamente.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Administracao</p>
        <h1 className="text-2xl font-semibold">Painel do administrador</h1>
        <p className="text-sm text-white/70">Indicadores reais dos boloes e da carteira administrativa.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Premiacao garantida (ativos)</p>
          <p className="mt-3 text-2xl font-semibold text-megga-yellow">{formatCurrency(bolaoStats.garantida)}</p>
          <p className="mt-2 text-sm text-white/60">{bolaoStats.andamento.length} bolao(s) em andamento</p>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Carteira administrativa</p>
          <p className="mt-3 text-2xl font-semibold text-megga-yellow">
            {formatCurrency(statsData?.adminBalance ?? 0)}
          </p>
          <p className="mt-2 text-sm text-white/60">Total apostado menos premios pagos</p>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Boloes</p>
          <p className="mt-3 text-2xl font-semibold text-megga-yellow">
            {bolaoStats.andamento.length} ativos · {bolaoStats.futuros.length} futuros · {bolaoStats.encerrados.length} encerrados
          </p>
          <p className="mt-2 text-sm text-white/60">Dados em tempo real via API</p>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Saldo dos usuarios</p>
          <p className="mt-3 text-2xl font-semibold text-megga-yellow">
            {formatCurrency(statsData?.walletOutstanding ?? 0)}
          </p>
          <p className="mt-2 text-sm text-white/60">Soma dos saldos em carteira (premios/comissoes nao sacados)</p>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Boloes em destaque</p>
            <h2 className="mt-1 text-lg font-semibold">Visao geral das campanhas</h2>
          </div>
          <Link
            href="/admin/boloes"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Ver todos
          </Link>
        </header>
        <ul className="space-y-3">
          {destaques(boloes ?? []).map((highlight) => {
            const hasStarted = new Date(highlight.startsAt).getTime() <= now;
            const statusLabel = highlight.closedAt ? "Encerrado" : hasStarted ? "Em andamento" : "Futuro";
            return (
              <li
                key={highlight.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{statusLabel}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{highlight.name}</h3>
                  <p className="text-xs text-white/60">Inicio: {formatDate(highlight.startsAt)}</p>
                </div>
                <span className="text-sm font-semibold text-megga-lime">
                  Premiacao garantida {formatCurrency(highlight.guaranteedPrize ?? 0)}
                </span>
              </li>
            );
          })}
          {destaques(boloes ?? []).length === 0 && (
            <li className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
              Nenhum bolao em destaque no momento.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
