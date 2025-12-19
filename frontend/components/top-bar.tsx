'use client';

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { AppDrawer } from "@/components/app-drawer";

interface WalletResponse {
  balance: string;
}

const authedFetcher = ([url, token]: [string, string]) =>
  api
    .get(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((response) => response.data as WalletResponse);

export function TopBar() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const { data } = useSWR<WalletResponse>(token ? ["/wallet/me", token] : null, authedFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 15000,
    revalidateIfStale: true,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const balance = Number(data?.balance ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 w-full bg-[#0f1117] px-3 py-3 text-white shadow-lg md:static md:rounded-3xl md:border md:border-white/5 md:bg-[#0f1117]/90 md:px-5 md:py-4 md:ring-1 md:ring-white/5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/70 transition hover:border-[#f7b500] hover:text-white md:hidden"
            aria-label="Abrir menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/50">Bolão entre Amigos</span>
              <span className="mt-0.5 text-base font-semibold leading-tight md:text-lg">Megga Bolão</span>
            </div>

            <div className="ml-auto flex flex-col items-start gap-0.5 text-[11px] text-white/75 md:inline-flex md:flex-row md:items-center md:gap-3 md:rounded-2xl md:border md:border-white/10 md:bg-white/5 md:px-4 md:py-3 md:text-sm">
              <span className="uppercase tracking-[0.26em] text-white/45">Saldo</span>
              <span className="text-[13px] font-semibold text-[#f7b500] md:text-base">R$ {balance}</span>
            </div>
          </div>

          <Link
            href="/perfil"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80 transition hover:border-[#1ea7a4] hover:text-[#f7b500]"
          >
            <span className="sr-only">Ir para o perfil</span>
            <span aria-hidden>MB</span>
          </Link>
        </div>
      </header>

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
