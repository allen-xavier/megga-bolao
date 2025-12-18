'use client';

import useSWR from "swr";
import { Suspense, type ReactNode } from "react";
import { api } from "@/lib/api";
import { WalletSummary } from "@/components/wallet-summary";

type WalletResponse = {
  balance: string;
};

const fetcher = (url: string, token?: string) =>
  api
    .get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((res) => res.data as WalletResponse);

const LoadingCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-3xl bg-[#0f1117] p-6 text-sm text-white/70 ring-1 ring-white/5 shadow-lg">
    {children}
  </div>
);

function WalletDetail() {
  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("accessToken") as string | null)
      : null;

  const { data } = useSWR<WalletResponse>(
    token ? ["/wallet/me", token] : "/wallet/me",
    token ? ([url, t]) => fetcher(url, t) : (url) => fetcher(url),
    {
      revalidateOnFocus: true,
      refreshInterval: 15000,
    }
  );

  const balance = Number(data?.balance ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-[#0f1117] px-5 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between text-sm text-white/75">
          <span className="uppercase tracking-[0.26em] text-white/50">
            Saldo atual
          </span>
          <span className="text-lg font-semibold text-[#f7b500]">
            R$ {balance}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0f1117] px-5 py-4 text-white shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Entradas e saídas</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Em breve
          </span>
        </div>
        <p className="text-sm text-white/65">
          O extrato detalhado será exibido aqui assim que disponível. Por
          enquanto, acompanhe seu saldo atualizado em tempo real acima.
        </p>
      </div>
    </div>
  );
}

export default function CarteiraPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingCard>Carregando saldo...</LoadingCard>}>
        <WalletSummary />
      </Suspense>
      <Suspense fallback={<LoadingCard>Carregando carteira...</LoadingCard>}>
        <WalletDetail />
      </Suspense>
    </div>
  );
}
