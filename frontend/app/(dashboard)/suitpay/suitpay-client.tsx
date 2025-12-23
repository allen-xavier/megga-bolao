"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type SuitpayConfig = {
  environment: "sandbox" | "production";
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string | null;
};

type WithdrawStatus = "ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELED";

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

export default function SuitPayConfigPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId") ?? "";

  const { data: configData, error: configError, mutate: mutateConfig } = useSWR<
    SuitpayConfig,
    any,
    [string, string] | null
  >(
    token ? ["/admin/suitpay/config", token] as [string, string] : null,
    ([url, t]) => fetcher<SuitpayConfig>(url, t),
    { revalidateOnFocus: false },
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<SuitpayConfig | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus>("PROCESSING");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawActionId, setWithdrawActionId] = useState<string | null>(null);

  const config = form ?? configData;

  const withdrawUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (withdrawStatus !== "ALL") {
      params.set("status", withdrawStatus);
    }
    if (userIdParam) {
      params.set("userId", userIdParam);
    }
    const query = params.toString();
    return `/payments/admin/withdraws${query ? `?${query}` : ""}`;
  }, [withdrawStatus, userIdParam]);

  const {
    data: withdraws,
    error: withdrawError,
    isLoading: withdrawLoading,
    mutate: mutateWithdraws,
  } = useSWR<WithdrawPayment[], any, [string, string] | null>(
    token ? [withdrawUrl, token] as [string, string] : null,
    ([url, t]) => fetcher<WithdrawPayment[]>(url, t),
    { revalidateOnFocus: false },
  );

  const handleChange = (field: keyof SuitpayConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === "environment" ? (e.target.value as SuitpayConfig["environment"]) : e.target.value;
    setForm((prev) => ({
      ...(prev ?? configData ?? { environment: "sandbox", apiUrl: "", clientId: "", clientSecret: "" }),
      [field]: value,
    }));
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
      };
      await api.patch("/admin/suitpay/config", payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Configuracao atualizada com sucesso.");
      setForm(null);
      mutateConfig();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? "Falha ao salvar configuracao.");
    } finally {
      setSaving(false);
    }
  };

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

  const handleComplete = async (paymentId: string) => {
    if (!token) return;
    const ok = window.confirm("Concluir este saque?");
    if (!ok) return;
    setWithdrawActionId(paymentId);
    setWithdrawMessage(null);
    try {
      await api.patch(`/payments/${paymentId}/withdraw/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setWithdrawMessage("Saque concluido com sucesso.");
      mutateWithdraws();
    } catch (err: any) {
      setWithdrawMessage(err?.response?.data?.message ?? "Falha ao concluir saque.");
    } finally {
      setWithdrawActionId(null);
    }
  };

  const handleFail = async (paymentId: string) => {
    if (!token) return;
    const ok = window.confirm("Estornar este saque?");
    if (!ok) return;
    const reasonInput = window.prompt("Motivo do estorno (opcional):");
    const reason = reasonInput?.trim();
    setWithdrawActionId(paymentId);
    setWithdrawMessage(null);
    try {
      await api.patch(
        `/payments/${paymentId}/withdraw/fail`,
        reason ? { reason } : {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setWithdrawMessage("Saque estornado e saldo liberado.");
      mutateWithdraws();
    } catch (err: any) {
      setWithdrawMessage(err?.response?.data?.message ?? "Falha ao estornar saque.");
    } finally {
      setWithdrawActionId(null);
    }
  };

  if (!token || status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faca login como administrador para acessar as configuracoes da SuitPay.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pagamentos</p>
        <h1 className="text-2xl font-semibold">SuitPay - Saques e configuracao</h1>
        <p className="text-sm text-white/70">Acompanhe saques pendentes e mantenha as chaves da integracao atualizadas.</p>
      </header>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-6 shadow-lg ring-1 ring-white/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aprovacoes manuais</p>
            <h2 className="mt-2 text-xl font-semibold">Saques em processamento</h2>
            <p className="text-sm text-white/70">Finalize saques pendentes enquanto o webhook nao estiver ativo.</p>
          </div>
          <button
            type="button"
            onClick={() => mutateWithdraws()}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-megga-yellow hover:text-white"
          >
            Atualizar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
            Status
            <select
              value={withdrawStatus}
              onChange={(event) => setWithdrawStatus(event.target.value as WithdrawStatus)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white focus:border-megga-yellow focus:outline-none"
            >
              <option value="PROCESSING" className="bg-megga-navy">Em processamento</option>
              <option value="PENDING" className="bg-megga-navy">Pendente</option>
              <option value="COMPLETED" className="bg-megga-navy">Concluidos</option>
              <option value="FAILED" className="bg-megga-navy">Falhos</option>
              <option value="CANCELED" className="bg-megga-navy">Cancelados</option>
              <option value="ALL" className="bg-megga-navy">Todos</option>
            </select>
          </label>
          {userIdParam && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Filtro</p>
              <p className="mt-2 text-sm">Usuario filtrado: {userIdParam}</p>
              <Link href="/admin/suitpay" className="mt-2 inline-flex text-xs text-megga-yellow hover:underline">
                Ver todos
              </Link>
            </div>
          )}
        </div>

        {withdrawMessage && <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-megga-lime">{withdrawMessage}</p>}
        {withdrawLoading && <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Carregando saques...</p>}
        {withdrawError && (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-megga-rose">
            Erro ao carregar saques: {withdrawError?.message ?? "falha desconhecida"}
          </p>
        )}

        <ul className="space-y-3">
          {(withdraws ?? []).map((payment) => {
            const status = payment.status;
            const statusStyles =
              status === "COMPLETED"
                ? "bg-megga-lime/15 text-megga-lime border-megga-lime/30"
                : status === "FAILED"
                  ? "bg-red-500/15 text-red-200 border-red-500/30"
                  : status === "CANCELED"
                    ? "bg-white/10 text-white/60 border-white/20"
                    : status === "PENDING"
                      ? "bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30"
                      : "bg-megga-yellow/20 text-megga-yellow border-megga-yellow/40";
            const disableActions = withdrawActionId === payment.id;
            const canProcess = status === "PROCESSING" || status === "PENDING";
            return (
              <li key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{payment.user?.fullName ?? "Usuario"}</p>
                    <p className="text-xs text-white/60">CPF: {payment.user?.cpf ?? "--"} | PIX: {payment.user?.pixKey ?? "--"}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusStyles}`}>
                      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                      {status}
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

                {canProcess && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleComplete(payment.id)}
                      disabled={disableActions}
                      className="rounded-2xl bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-megga-navy transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Concluir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFail(payment.id)}
                      disabled={disableActions}
                      className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Estornar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {!withdrawLoading && (withdraws?.length ?? 0) === 0 && (
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              Nenhum saque encontrado para este filtro.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-3xl bg-megga-navy/80 p-6 shadow-lg ring-1 ring-white/5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Configuracao</p>
          <h2 className="text-xl font-semibold">SuitPay - Configuracao</h2>
          <p className="text-sm text-white/70">Defina ambiente, endpoint e chaves de acesso (sandbox ou producao).</p>
        </div>

        {configError && (
          <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-megga-rose">
            Erro ao carregar configuracao: {configError?.message ?? "falha desconhecida"}
          </p>
        )}
        {!config && !configError && (
          <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Carregando configuracao...</p>
        )}
        {config && (
          <form onSubmit={save} className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-white/70">
                <span>Ambiente</span>
                <select
                  value={config.environment}
                  onChange={handleChange("environment")}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white focus:border-megga-magenta focus:outline-none"
                >
                  <option value="sandbox" className="bg-megga-navy">Sandbox</option>
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
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-megga-yellow px-6 py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar configuracao"}
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
