"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

type User = {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  pixKey?: string | null;
  acceptedTerms?: boolean;
  createdAt?: string;
};

const fetcher = (url: string, token?: string) =>
  api
    .get(url, {
      params: { page: 1, perPage: 100 },
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    })
    .then((response) => response.data);

function statusLabel(user: User) {
  return user.acceptedTerms ? "Verificado" : "Pendente";
}

function StatusPill({ status }: { status: string }) {
  const isVerified = status === "Verificado";
  const color = isVerified ? "bg-megga-lime/15 text-megga-lime border-megga-lime/30" : "bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "verificado" | "pendente">("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: users, isLoading, error, mutate } = useSWR<User[]>(
    token && isAdmin ? ["/users", token] as const : null,
    ([url, t]: [string, string]) => fetcher(url, t),
    { revalidateOnFocus: false },
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return (users ?? []).filter((u) => {
      const name = (u.fullName ?? "").toLowerCase();
      const cpfDigits = (u.cpf ?? "").replace(/\D/g, "");
      const phoneDigits = (u.phone ?? "").replace(/\D/g, "");
      const matchesTerm =
        term.length === 0 ||
        name.includes(term) ||
        (digits.length > 0 && (cpfDigits.includes(digits) || phoneDigits.includes(digits)));
      const statusValue = statusLabel(u);
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "verificado" && statusValue === "Verificado") ||
        (statusFilter === "pendente" && statusValue === "Pendente");
      return matchesTerm && matchesStatus;
    });
  }, [users, query, statusFilter]);

  async function handleDelete(id: string) {
    if (!token) return;
    const ok = window.confirm("Excluir o usu\u00e1rio? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.");
    if (!ok) return;
    try {
      setDeletingId(id);
      await api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await mutate((prev) => (prev ? prev.filter((u) => u.id !== id) : prev), false);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "N\u00e3o foi poss\u00edvel excluir o usu\u00e1rio.";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faca login como administrador para acessar esta pagina.</p>
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
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Voce nao tem permissao para acessar esta pagina.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestao de contas</p>
        <h1 className="text-2xl font-semibold">Usuarios cadastrados</h1>
        <p className="text-sm text-white/70">Pesquisa por nome/CPF/telefone, filtro por status e links para perfil/saque.</p>
      </header>

      <section className="space-y-3 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Filtro rapido</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, CPF ou telefone"
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white focus:border-megga-magenta focus:outline-none"
            >
              <option value="todos" className="bg-megga-navy">Todos os status</option>
              <option value="verificado" className="bg-megga-navy">Verificado</option>
              <option value="pendente" className="bg-megga-navy">Pendente</option>
            </select>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-2xl bg-megga-yellow px-4 py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {error?.response?.status === 401 && (
          <div className="space-y-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-megga-yellow">
            <p>Sessao expirada ou sem permissao. Faca login novamente.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
            >
              Ir para login
            </Link>
          </div>
        )}
        {isLoading && <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Carregando usuarios...</p>}
        {error && (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-megga-rose">
            Erro ao carregar usuarios: {error?.message ?? "falha desconhecida"}
          </p>
        )}

        <ul className="space-y-3 text-sm text-white/80">
          {filtered.map((user) => {
            const statusValue = statusLabel(user);
            const isOpen = expanded === user.id;
            return (
              <li key={user.id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.fullName}</p>
                    <p className="text-xs text-white/60">{user.phone}</p>
                  </div>
                  <StatusPill status={statusValue} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                  <span>CPF: {user.cpf}</span>
                  <span>Email: {user.email ?? "--"}</span>
                  <span>UF: {user.state ?? "--"}</span>
                </div>
                {isOpen && (
                  <div className="mt-3 grid gap-2 text-xs text-white/70 md:grid-cols-2">
                    <p><span className="text-white/50">Cidade:</span> {user.city ?? "--"}</p>
                    <p><span className="text-white/50">PIX:</span> {user.pixKey ?? "--"}</p>
                    <p>
                      <span className="text-white/50">Criado em:</span>{" "}
                      {user.createdAt ? new Date(user.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "--"}
                    </p>
                  </div>
                )}
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : user.id)}
                    className="rounded-2xl bg-[#f7b500] py-3 font-semibold text-[#0f1117] transition hover:brightness-110"
                  >
                    {isOpen ? "Fechar perfil" : "Ver perfil"}
                  </button>
                  <Link
                    href={`/admin/usuarios/${user.id}/editar`}
                    className="rounded-2xl bg-[#1ea7a4] py-3 text-center font-semibold text-[#0f1117] transition hover:brightness-110"
                  >
                    Editar perfil
                  </Link>
                  <Link
                    href={`/admin/saques?userId=${user.id}`}
                    className="rounded-2xl bg-[#1ea7a4] py-3 text-center font-semibold text-[#0f1117] transition hover:brightness-110"
                  >
                    Liberar saque
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="rounded-2xl border border-red-500/50 bg-red-500/10 py-3 font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === user.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && !isLoading && (
            <li className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Nenhum usuario encontrado.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
