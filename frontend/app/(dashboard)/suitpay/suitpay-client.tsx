"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

type SuitpayConfig = {
  environment: "sandbox" | "production";
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string | null;
  autoApprovalLimit: number;
};

const fetcher = <T,>(url: string, token?: string) =>
  api.get<T>(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((r) => r.data);

export default function SuitPayConfigPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";
  const { data, error, mutate } = useSWR<SuitpayConfig, any, [string, string] | null>(
    token && isAdmin ? ["/admin/suitpay/config", token] as [string, string] : null,
    ([url, t]) => fetcher<SuitpayConfig>(url, t),
    { revalidateOnFocus: false },
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<SuitpayConfig | null>(null);

  const config = form ?? data;

  const handleChange = (field: keyof SuitpayConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: SuitpayConfig[keyof SuitpayConfig] = e.target.value as SuitpayConfig[keyof SuitpayConfig];
    if (field === "environment") {
      value = e.target.value as SuitpayConfig["environment"];
    }
    if (field === "autoApprovalLimit") {
      value = Number(e.target.value);
    }
    setForm((prev) => {
      const base = prev ?? data ?? {
        environment: "sandbox",
        apiUrl: "https://sandbox.ws.suitpay.app",
        clientId: "",
        clientSecret: "",
        autoApprovalLimit: 0,
      };
      const next = { ...base, [field]: value };
      if (field === "environment") {
        next.apiUrl = value === "production" ? "https://ws.suitpay.app" : "https://sandbox.ws.suitpay.app";
      }
      return next;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !config) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        environment: config.environment,
        apiUrl: config.apiUrl,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        webhookSecret: config.webhookSecret ?? undefined,
        autoApprovalLimit: Number(config.autoApprovalLimit ?? 0),
      };
      await api.patch("/admin/suitpay/config", payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Configuração atualizada com sucesso.");
      setForm(null);
      mutate();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? "Falha ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faça login como administrador para acessar as configurações da SuitPay.</p>
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
        <p className="text-sm text-megga-rose">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pagamentos</p>
        <h1 className="text-2xl font-semibold">SuitPay - Configuração</h1>
        <p className="text-sm text-white/70">Defina ambiente, endpoint e chaves de acesso (homologacao ou producao).</p>
      </header>

      <section className="rounded-3xl bg-megga-navy/80 p-6 shadow-lg ring-1 ring-white/5">
        {error && (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-megga-rose">
            Erro ao carregar configuração: {error?.message ?? "falha desconhecida"}
          </p>
        )}
        {!config && !error && (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Carregando configuração...</p>
        )}
        {config && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-white/70">
                <span>Ambiente</span>
                <select
                  value={config.environment}
                  onChange={handleChange("environment")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white focus:border-megga-magenta focus:outline-none"
                >
                  <option value="sandbox" className="bg-megga-navy">Homologacao</option>
                  <option value="production" className="bg-megga-navy">Producao</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-white/70">
                <span>API URL</span>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={handleChange("apiUrl")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-white/70">
                <span>Client ID (ci)</span>
                <input
                  type="text"
                  value={config.clientId}
                  onChange={handleChange("clientId")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-white/70">
                <span>Client Secret (cs)</span>
                <input
                  type="password"
                  value={config.clientSecret}
                  onChange={handleChange("clientSecret")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-white/70">
                <span>Webhook Secret (opcional)</span>
                <input
                  type="text"
                  value={config.webhookSecret ?? ""}
                  onChange={handleChange("webhookSecret")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-white/70">
                <span>Limite de aprovacao automatica (R$)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.autoApprovalLimit ?? 0}
                  onChange={handleChange("autoApprovalLimit")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-megga-yellow px-6 py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar configuração"}
              </button>
              <p className="text-xs text-white/60">Sandbox: https://sandbox.ws.suitpay.app | Producao: https://ws.suitpay.app</p>
            </div>
            {message && <p className="text-sm text-megga-lime">{message}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
