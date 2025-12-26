'use client';

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

type WalletStatement = {
  id: string;
  amount: string;
  description: string;
  createdAt: string;
  type?: "DEPOSIT" | "WITHDRAW" | "COMMISSION" | "PRIZE" | string;
  referenceId?: string | null;
  receiptAvailable?: boolean;
};

interface Wallet {
  balance: string;
  locked: string;
  statements: WalletStatement[];
}

const EMPTY_STATEMENTS: WalletStatement[] = [];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MIN_WITHDRAW = 50;
const LAST_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function formatCpf(value?: string) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function WalletSummary() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;

  const { data, isLoading, mutate } = useSWR<Wallet>(
    token ? "/wallet/me" : null,
    () =>
      api
        .get("/wallet/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => response.data),
    {
      revalidateOnFocus: false,
    }
  );

  const [filterMode, setFilterMode] = useState<"last30" | "month">("last30");
  const [filterMonth, setFilterMonth] = useState(() => new Date().getMonth());
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());
  const [flowFilter, setFlowFilter] = useState<"all" | "in" | "out">("all");
  const [hideAffiliate, setHideAffiliate] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawUseTotal, setWithdrawUseTotal] = useState(false);
  const [withdrawSuccessOpen, setWithdrawSuccessOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMessage, setDepositMessage] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositData, setDepositData] = useState<{
    id: string;
    paymentCode: string;
    paymentCodeBase64: string;
  } | null>(null);

  const userPixKey = (session?.user as any)?.pixKey ?? "";
  const userCpf = (session?.user as any)?.cpf ?? "";

  const statements = useMemo(() => data?.statements ?? EMPTY_STATEMENTS, [data?.statements]);
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    statements.forEach((item) => {
      const year = new Date(item.createdAt).getFullYear();
      if (!Number.isNaN(year)) years.add(year);
    });
    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [statements]);

  const filteredStatements = useMemo(() => {
    const now = Date.now();
    const cutoff = now - LAST_30_DAYS_MS;
    return statements.filter((item) => {
      const createdAt = new Date(item.createdAt).getTime();
      if (Number.isNaN(createdAt)) return false;
      if (filterMode === "last30" && createdAt < cutoff) return false;
      if (filterMode === "month") {
        const date = new Date(createdAt);
        if (date.getMonth() !== filterMonth || date.getFullYear() !== filterYear) return false;
      }

      const amountValue = Number(item.amount);
      const isOut = amountValue < 0;
      if (flowFilter === "in" && isOut) return false;
      if (flowFilter === "out" && !isOut) return false;

      const description = (item.description ?? "").toLowerCase();
      const isAffiliate = item.type === "COMMISSION" || description.includes("comissao") || description.includes("afiliado");
      if (hideAffiliate && isAffiliate) return false;

      return true;
    });
  }, [statements, filterMode, filterMonth, filterYear, flowFilter, hideAffiliate]);

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0f1117] p-6 text-sm text-white/70 shadow-lg">
        Entre com sua conta para ver os dados da carteira.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0f1117] p-6 text-sm text-white/70 shadow-lg">
        Carregando carteira...
      </div>
    );
  }

  const balanceValue = Number(data?.balance ?? 0);
  const lockedValue = Number(data?.locked ?? 0);
  const balance = balanceValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const locked = lockedValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const minWithdrawLabel = MIN_WITHDRAW.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const canWithdraw = balanceValue >= MIN_WITHDRAW;
  const withdrawParsed = Number(withdrawAmount.replace(",", "."));
  const withdrawValue = Number.isFinite(withdrawParsed) ? withdrawParsed : 0;
  const withdrawValid = withdrawValue >= MIN_WITHDRAW && withdrawValue <= balanceValue;
  const depositParsed = Number(depositAmount.replace(",", "."));
  const depositValue = Number.isFinite(depositParsed) ? depositParsed : 0;
  const depositValid = depositValue > 0;
  const depositQrSrc = depositData?.paymentCodeBase64
    ? depositData.paymentCodeBase64.startsWith("data:image")
      ? depositData.paymentCodeBase64
      : `data:image/png;base64,${depositData.paymentCodeBase64}`
    : "";
  const pixKeyAvailable = Boolean(userPixKey);
  const confirmDisabled = !withdrawValid || !pixKeyAvailable;
  const formattedCpf = formatCpf(userCpf);

  const openWithdraw = () => {
    setWithdrawMessage(null);
    setWithdrawUseTotal(false);
    setWithdrawSuccessOpen(false);
    setWithdrawAmount(canWithdraw ? String(MIN_WITHDRAW) : "");
    setWithdrawOpen(true);
  };
  const closeWithdraw = () => {
    setWithdrawOpen(false);
    setWithdrawMessage(null);
    setWithdrawUseTotal(false);
    setWithdrawSuccessOpen(false);
  };
  const confirmWithdraw = async () => {
    if (confirmDisabled || !token) return;
    setWithdrawMessage(null);
    try {
      await api.post(
        "/payments/withdraw",
        { amount: withdrawValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await mutate();
      setWithdrawOpen(false);
      setWithdrawSuccessOpen(true);
    } catch (err: any) {
      setWithdrawMessage(err?.response?.data?.message ?? "Falha ao solicitar saque.");
    }
  };

  const downloadReceipt = async (paymentId: string) => {
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

  const openDeposit = () => {
    setDepositMessage(null);
    setDepositAmount("");
    setDepositData(null);
    setDepositOpen(true);
  };

  const closeDeposit = () => {
    setDepositOpen(false);
    setDepositMessage(null);
    setDepositData(null);
    setDepositLoading(false);
  };

  const confirmDeposit = async () => {
    if (!token || !depositValid) return;
    setDepositMessage(null);
    setDepositLoading(true);
    try {
      const response = await api.post(
        "/payments/deposit",
        { amount: depositValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDepositData({
        id: response.data.id,
        paymentCode: response.data.paymentCode,
        paymentCodeBase64: response.data.paymentCodeBase64,
      });
    } catch (err: any) {
      setDepositMessage(err?.response?.data?.message ?? "Falha ao gerar PIX.");
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <>
      <section className="rounded-3xl border border-white/5 bg-[#0f1117] px-3 py-4 text-white shadow-lg md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Minha carteira</h2>
          <div className="flex flex-col gap-2 sm:min-w-[190px]">
            <button
              type="button"
              onClick={openWithdraw}
              disabled={!canWithdraw}
              className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                canWithdraw ? "bg-megga-yellow text-megga-navy hover:opacity-95" : "bg-white/10 text-white/40"
              }`}
            >
              Solicitar saque
            </button>
            <button
              type="button"
              onClick={openDeposit}
              className="w-full rounded-full bg-[#3fdc7c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f1117] transition hover:opacity-95"
            >
              Depositar
            </button>
          </div>
        </div>
        {!canWithdraw && (
          <p className="mt-2 text-xs text-white/60">Saque mínimo: R$ {minWithdrawLabel}.</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#151824] px-3 py-3 shadow md:px-5 md:py-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">Saldo disponivel</span>
            <p className="mt-3 text-3xl font-semibold text-[#f7b500]">R$ {balance}</p>
            {lockedValue > 0 && (
              <p className="mt-2 text-xs text-red-400">Bloqueado por saque: R$ {locked}</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 md:px-5 md:py-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/60">Em processamento</span>
            <p className="mt-3 text-2xl font-semibold text-[#1ea7a4]">R$ {locked}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Ultimos movimentos</p>
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/50">
              {filteredStatements.length} movimento(s)
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                Periodo
                <select
                  value={filterMode}
                  onChange={(event) => setFilterMode(event.target.value as "last30" | "month")}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#151824] px-3 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
                >
                  <option value="last30" className="bg-[#0f1117]">
                    Ultimos 30 dias
                  </option>
                  <option value="month" className="bg-[#0f1117]">
                    Mes e ano
                  </option>
                </select>
              </label>
              {filterMode === "month" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                    Mes
                    <select
                      value={filterMonth}
                      onChange={(event) => setFilterMonth(Number(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#151824] px-3 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
                    >
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index} className="bg-[#0f1117]">
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                    Ano
                    <select
                      value={filterYear}
                      onChange={(event) => setFilterYear(Number(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#151824] px-3 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
                    >
                      {availableYears.map((year) => (
                        <option key={year} value={year} className="bg-[#0f1117]">
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
            <label className="text-[11px] uppercase tracking-[0.3em] text-white/50">
              Tipo
              <select
                value={flowFilter}
                onChange={(event) => setFlowFilter(event.target.value as "all" | "in" | "out")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#151824] px-3 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
              >
                <option value="all" className="bg-[#0f1117]">
                  Todas
                </option>
                <option value="in" className="bg-[#0f1117]">
                  Entradas
                </option>
                <option value="out" className="bg-[#0f1117]">
                  Saidas
                </option>
              </select>
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={hideAffiliate}
              onChange={(event) => setHideAffiliate(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-megga-yellow focus:ring-megga-yellow"
            />
            Ocultar comissões de afiliados
          </label>

          <ul className="mt-3 max-h-60 space-y-3 overflow-y-auto pr-1 text-sm">
            {filteredStatements.map((item) => {
              const amount = Number(item.amount);
              const formattedAmount = amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const hasReceipt = Boolean(item.receiptAvailable && item.referenceId);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#151824] px-3 py-3 md:px-4"
                >
                  <div>
                    <p className="font-medium text-white/90">{item.description}</p>
                    <p className="text-xs text-white/50">{new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${amount >= 0 ? "text-[#3fdc7c]" : "text-[#ff6b8b]"}`}>
                      {amount >= 0 ? "+" : "-"}R$ {formattedAmount}
                    </span>
                    {hasReceipt && (
                      <button
                        type="button"
                        onClick={() => downloadReceipt(item.referenceId as string)}
                        className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-megga-yellow hover:text-white"
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
                </li>
              );
            })}
            {filteredStatements.length === 0 && (
              <li className="rounded-xl border border-white/5 bg-[#151824] px-3 py-3 text-sm text-white/60 md:px-4">
                Nenhuma movimentacao encontrada para este filtro.
              </li>
            )}
          </ul>
        </div>
      </section>

      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f1117] p-4 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Depositar via PIX</h3>
              <button
                type="button"
                onClick={closeDeposit}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
              >
                Fechar
              </button>
            </div>

            {!depositData && (
              <>
                <p className="mt-2 text-xs text-white/60">Informe o valor para gerar o QR Code de pagamento.</p>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-[#151824] px-3 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none"
                  placeholder="Valor do deposito"
                />
                {depositMessage && (
                  <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-xs text-megga-lime">{depositMessage}</p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeDeposit}
                    className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-megga-yellow hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeposit}
                    disabled={!depositValid || depositLoading}
                    className="flex-1 rounded-2xl bg-[#3fdc7c] px-4 py-2 text-sm font-semibold text-[#0f1117] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {depositLoading ? "Gerando..." : "Gerar PIX"}
                  </button>
                </div>
              </>
            )}

            {depositData && (
              <div className="mt-4 space-y-4 text-center">
                <div className="mx-auto w-full max-w-[220px] rounded-2xl bg-white p-3">
                  {depositQrSrc && <img src={depositQrSrc} alt="QR Code Pix" className="h-auto w-full" />}
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#151824] px-3 py-3 text-xs text-white/70">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Codigo PIX</p>
                  <p className="mt-2 break-all text-sm text-white">{depositData.paymentCode}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(depositData.paymentCode)}
                    className="mt-3 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:border-megga-yellow hover:text-white"
                  >
                    Copiar codigo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => downloadReceipt(depositData.id)}
                  className="w-full rounded-2xl bg-megga-yellow px-4 py-2 text-sm font-semibold text-megga-navy transition hover:opacity-95"
                >
                  Baixar comprovante
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f1117] p-4 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Solicitar saque</h3>
              <button
                type="button"
                onClick={closeWithdraw}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
              >
                Fechar
              </button>
            </div>
            <p className="mt-2 text-xs text-white/60">Saldo disponivel para saque: R$ {balance}.</p>
            <p className="mt-1 text-xs text-white/60">Saque mínimo: R$ {minWithdrawLabel}.</p>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/70">
              <span>Valor do saque</span>
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={withdrawUseTotal}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setWithdrawUseTotal(checked);
                    if (checked) {
                      setWithdrawAmount(balanceValue.toFixed(2));
                    }
                  }}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-megga-yellow focus:ring-megga-yellow"
                />
                Saldo total
              </label>
            </div>
            <input
              type="number"
              min={MIN_WITHDRAW}
              max={balanceValue}
              step="0.01"
              value={withdrawAmount}
              onChange={(event) => {
                setWithdrawAmount(event.target.value);
                if (withdrawUseTotal) setWithdrawUseTotal(false);
              }}
              disabled={withdrawUseTotal}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#151824] px-3 py-2 text-sm text-white focus:border-megga-yellow focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              placeholder={`Mínimo R$ ${minWithdrawLabel}`}
            />

            <div className="mt-3 rounded-2xl border border-white/10 bg-[#151824] p-3 text-sm">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Chave PIX cadastrada</p>
              <p className="mt-1 font-semibold text-white">{userPixKey || "Não cadastrada"}</p>
              <p className="mt-2 text-xs text-white/60">
                O PIX deve pertencer ao CPF {formattedCpf || "cadastrado"}.
              </p>
            </div>

            {!pixKeyAvailable && (
              <p className="mt-2 text-xs text-[#f7b500]">Cadastre sua chave PIX no perfil para solicitar o saque.</p>
            )}
            {!withdrawValid && withdrawAmount && (
              <p className="mt-2 text-xs text-white/60">
                Informe um valor entre R$ {minWithdrawLabel} e R$ {balance}.
              </p>
            )}

            {withdrawMessage && (
              <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-xs text-megga-lime">{withdrawMessage}</p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={closeWithdraw}
                className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-megga-yellow hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmWithdraw}
                disabled={confirmDisabled}
                className="flex-1 rounded-2xl bg-megga-yellow px-4 py-2 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirmar saque
              </button>
            </div>
          </div>
        </div>
      )}
      {withdrawSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-6">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f1117] p-5 text-white shadow-xl">
            <div className="space-y-3 text-center">
              <h3 className="text-lg font-semibold">Pedido confirmado</h3>
              <p className="text-sm text-white/70">Solicitacao enviada, aguardando processamento.</p>
              <button
                type="button"
                onClick={() => setWithdrawSuccessOpen(false)}
                className="w-full rounded-2xl bg-megga-yellow px-4 py-2 text-sm font-semibold text-megga-navy transition hover:opacity-95"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

}
