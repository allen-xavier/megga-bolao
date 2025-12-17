"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useState } from "react";

type AffiliateInfo = {
  code: string;
  inviteLink: string | null;
  directCount: number;
  indirectCount: number;
  earnings: number;
  direct: Array<{ id: string; fullName: string; phone: string; createdAt: string }>;
  indirect: Array<{ id: string; fullName: string; phone: string; createdAt: string }>;
};

type Earning = {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  bolaoId: string | null;
  bolaoName: string | null;
  sourceUser: { name: string; phone: string } | null;
};

const fetcher = (url: string, token?: string) =>
  api.get<AffiliateInfo>(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((r) => r.data);

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatCurrency(value?: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AfiliadosPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const { data, error, isLoading, mutate } = useSWR<AffiliateInfo, any, [string, string] | null>(
    token ? ["/affiliates/me", token] as [string, string] : null,
    ([url, t]) => fetcher(url, t),
    { revalidateOnFocus: true, refreshInterval: 15000, revalidateIfStale: true },
  );
  const { data: earnings } = useSWR<Earning[], any, [string, string] | null>(
    token ? ["/affiliates/earnings", token] as [string, string] : null,
    ([url, t]) => api.get<Earning[]>(url, { headers: { Authorization: `Bearer ${t}` } }).then((res) => res.data),
    { revalidateOnFocus: true, refreshInterval: 15000, revalidateIfStale: true },
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!data?.inviteLink) return;
    await navigator.clipboard.writeText(data.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!token || status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faca login para ver seu programa de indicacoes.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Erro ao carregar afiliados: {error?.message ?? "falha desconhecida"}</p>
      </div>
    );
  }

  if (!data || isLoading) {
    return <p className="rounded-3xl bg-megga-navy/80 p-6 text-sm text-white/70">Carregando afiliados...</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Programa de afiliados</p>
        <h1 className="text-2xl font-semibold">Indique e ganhe</h1>
        <p className="text-sm text-white/70">Compartilhe seu codigo ou link para trazer novos participantes.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Codigo</p>
          <p className="mt-2 text-2xl font-semibold text-megga-yellow">{data.code}</p>
          {data.inviteLink && (
            <button
              type="button"
              onClick={copy}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
            >
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          )}
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Atualizar
          </button>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Indicados</p>
          <p className="mt-2 text-2xl font-semibold text-megga-yellow">
            {data.directCount} diretos · {data.indirectCount} indiretos
          </p>
          <p className="mt-1 text-sm text-white/60">Niveis 1 e 2</p>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Comissoes recebidas</p>
          <p className="mt-2 text-2xl font-semibold text-megga-yellow">{formatCurrency(data.earnings)}</p>
          <p className="mt-1 text-sm text-white/60">Geradas pelas apostas dos seus indicados</p>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Indicados diretos</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">{data.directCount} usuario(s)</span>
        </header>
        <ul className="space-y-2 text-sm text-white/80">
          {data.direct.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-semibold text-white">{u.fullName}</p>
                <p className="text-xs text-white/60">{u.phone}</p>
              </div>
              <span className="text-xs text-white/50">Desde {formatDate(u.createdAt)}</span>
            </li>
          ))}
          {data.direct.length === 0 && <li className="rounded-2xl bg-white/5 px-4 py-3 text-white/70">Nenhum indicado direto ainda.</li>}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Indicados indiretos</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">{data.indirectCount} usuario(s)</span>
        </header>
        <ul className="space-y-2 text-sm text-white/80">
          {data.indirect.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-semibold text-white">{u.fullName}</p>
                <p className="text-xs text-white/60">{u.phone}</p>
              </div>
              <span className="text-xs text-white/50">Desde {formatDate(u.createdAt)}</span>
            </li>
          ))}
          {data.indirect.length === 0 && <li className="rounded-2xl bg-white/5 px-4 py-3 text-white/70">Nenhum indireto ainda.</li>}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Extrato de comissoes</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">{(earnings ?? []).length} lancamento(s)</span>
        </header>
        <ul className="space-y-2 text-sm text-white/80">
          {(earnings ?? []).map((e) => (
            <li key={e.id} className="rounded-2xl bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-megga-lime">{formatCurrency(e.amount)}</p>
                <span className="text-xs text-white/60">{formatDate(e.createdAt)}</span>
              </div>
              <p className="text-xs text-white/70">{e.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
                {e.bolaoName && <span>Bolao: {e.bolaoName}</span>}
                {e.sourceUser && <span>Jogador: {e.sourceUser.name} ({e.sourceUser.phone})</span>}
              </div>
            </li>
          ))}
          {(earnings ?? []).length === 0 && (
            <li className="rounded-2xl bg-white/5 px-4 py-3 text-white/70">Nenhuma comissao registrada ainda.</li>
          )}
        </ul>
      </section>
    </div>
  );
}