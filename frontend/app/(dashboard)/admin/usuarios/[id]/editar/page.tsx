"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
};

const fetcher = (url: string, token?: string) =>
  api
    .get<User>(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((res) => res.data);

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const { data: user, error } = useSWR<User, any, [string, string] | null>(
    token && userId && isAdmin ? [`/users/${userId}`, token] as [string, string] : null,
    ([url, t]) => fetcher(url, t),
    { revalidateOnFocus: false },
  );

  const [form, setForm] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleChange = (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === "acceptedTerms" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !token) return;
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        cpf: form.cpf,
        email: form.email ?? undefined,
        city: form.city ?? undefined,
        state: form.state ?? undefined,
        pixKey: form.pixKey ?? undefined,
        acceptedTerms: form.acceptedTerms ?? false,
      };
      await api.patch(`/users/${userId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Perfil atualizado com sucesso.");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? "Falha ao atualizar usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faca login como administrador para editar usuarios.</p>
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

  if (error?.response?.status === 401) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Sessao expirada ou sem permissao. Faca login novamente.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Erro ao carregar usuario: {error?.message ?? "falha desconhecida"}</p>
        <Link href="/admin/usuarios" className="mt-3 inline-flex text-xs text-megga-yellow underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  if (!form) {
    return <p className="rounded-3xl bg-megga-navy/80 p-6 text-sm text-white/70">Carregando dados do usuario...</p>;
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestao de contas</p>
        <h1 className="text-2xl font-semibold">Editar usuario</h1>
        <p className="text-sm text-white/70">Atualize dados cadastrais e status de verificacao.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-megga-navy/80 p-6 shadow-lg ring-1 ring-white/5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-white/70">
            <span>Nome completo</span>
            <input
              type="text"
              value={form.fullName ?? ""}
              onChange={handleChange("fullName")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Telefone (WhatsApp)</span>
            <input
              type="text"
              value={form.phone ?? ""}
              onChange={handleChange("phone")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>CPF</span>
            <input
              type="text"
              value={form.cpf ?? ""}
              onChange={handleChange("cpf")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Email</span>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={handleChange("email")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Cidade</span>
            <input
              type="text"
              value={form.city ?? ""}
              onChange={handleChange("city")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Estado</span>
            <input
              type="text"
              value={form.state ?? ""}
              onChange={handleChange("state")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Chave PIX</span>
            <input
              type="text"
              value={form.pixKey ?? ""}
              onChange={handleChange("pixKey")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={!!form.acceptedTerms}
              onChange={handleChange("acceptedTerms")}
              className="h-4 w-4 rounded border-white/30 bg-transparent text-megga-teal focus:ring-megga-magenta"
            />
            <span>Usuario verificado (aceitou termos)</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-megga-yellow px-6 py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alteracoes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Cancelar
          </button>
        </div>

        {message && <p className="text-sm text-megga-lime">{message}</p>}
        {errorMsg && <p className="text-sm text-megga-rose">{errorMsg}</p>}
      </form>
    </div>
  );
}
