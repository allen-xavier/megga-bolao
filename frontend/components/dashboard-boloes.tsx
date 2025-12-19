'use client';

import useSWR from "swr";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

interface Bolao {
  id: string;
  name: string;
  startsAt: string;
  promotional: boolean;
  isParticipant?: boolean;
  myBets?: { userId: string }[];
  bets?: { userId: string }[];
  ticketPrice: string;
  minimumQuotas: number;
  closedAt?: string | null;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);
const authedFetcher = ([url, token]: [string, string]) =>
  api
    .get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((response) => response.data);

function getUserId(session: any): string | undefined {
  return (
    session?.user?.id ??
    session?.user?._id ??
    session?.user?.sub ??
    session?.user?.userId ??
    (session as any)?.id ??
    (session as any)?.userId
  );
}

function formatStartsAt(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getNextDrawLabel() {
  const now = new Date();
  const nowSp = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const targetDays = [2, 4, 6]; // terça, quinta, sábado
  for (let add = 0; add < 7; add += 1) {
    const candidate = new Date(nowSp.getTime() + add * 24 * 60 * 60 * 1000);
    if (targetDays.includes(candidate.getDay())) {
      if (add === 0) return "Hoje";
      return candidate.toLocaleDateString("pt-BR", { weekday: "long" });
    }
  }
  return "";
}

export function DashboardBoloes() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const userId = getUserId(session);
  const { data, isLoading } = useSWR<Bolao[]>(
    token ? ["/boloes", token] : "/boloes",
    token ? authedFetcher : fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      refreshInterval: 15000,
    }
  );

  const now = Date.now();
  const ativos = (data ?? []).filter((b) => {
    const closedTs = b.closedAt ? new Date(b.closedAt).getTime() : null;
    return !closedTs || closedTs > now;
  });

  const futuros = ativos.filter((b) => new Date(b.startsAt).getTime() > now);
  const andamento = ativos.filter((b) => new Date(b.startsAt).getTime() <= now);
  const cards = [...futuros, ...andamento];

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-[#0f1117] p-6 text-sm text-white/75 ring-1 ring-white/5 shadow-lg">
        Carregando bolÇæes...
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <section className="rounded-3xl bg-[#0f1117] p-6 text-sm text-white/75 shadow-lg ring-1 ring-white/5">
        <h2 className="text-lg font-semibold text-white">BolÇæes em andamento</h2>
        <p className="mt-4 text-sm text-white/65">
          Nenhum bolÇœo ativo no momento. Volte mais tarde para acompanhar novas oportunidades.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {cards.map((bolao) => {
          const startsAt = new Date(bolao.startsAt);
          const hasStarted = startsAt.getTime() <= Date.now();
          const statusLabel = hasStarted ? "Em andamento" : "Acumulando";
          const inferredParticipant =
            bolao.isParticipant ||
            (bolao.myBets?.some?.((b: any) => b.userId === userId) ?? false) ||
            (bolao.bets?.some?.((b: any) => b.userId === userId) ?? false);
          const participationLabel = inferredParticipant ? "Participando" : statusLabel;
          const nextDrawLabel = getNextDrawLabel();

          return (
            <article
              key={bolao.id}
              className="overflow-hidden rounded-xl border border-white/5 bg-[#0f1117] text-white shadow md:rounded-2xl md:shadow-lg"
            >
              <div className="flex items-center justify-between bg-[#151824] px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] md:px-5 md:py-3 md:text-[11px] md:tracking-[0.18em]">
                <span className="inline-flex items-center gap-2 font-semibold text-[#3fdc7c]">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-[#3fdc7c] shadow-[0_0_8px_rgba(63,220,124,0.65)]"
                    aria-hidden
                  />
                  {participationLabel}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">
                  {statusLabel}
                </span>
              </div>

              <div className="space-y-4 px-4 pb-5 pt-6 md:space-y-5 md:px-5 md:pb-6 md:pt-7">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold leading-tight text-white">{bolao.name}</h3>
                    <p className="mt-1 text-xs text-white/65">BolÇœo inicia em {formatStartsAt(startsAt)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#141823] px-4 py-3 text-right md:rounded-2xl">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 md:tracking-[0.2em]">Cota</p>
                    <p className="text-lg font-semibold text-[#f7b500]">
                      R${" "}
                      {Number(bolao.ticketPrice).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wide text-white/65 md:gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 md:rounded-2xl md:px-4 md:py-3">
                    <span className="block text-[10px] text-white/40">Cotas mÇðnimas</span>
                    <span className="mt-1 block text-base font-semibold text-white">{bolao.minimumQuotas}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 md:rounded-2xl md:px-4 md:py-3">
                    <span className="block text-[10px] text-white/40">PrÇüximo sorteio</span>
                    <span className="mt-1 block text-base font-semibold text-white">{nextDrawLabel}</span>
                  </div>
                </div>

                <Link
                  href={`/boloes/${bolao.id}`}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow transition md:rounded-2xl md:shadow-lg ${
                    hasStarted
                      ? "bg-[#f7b500] text-[#0f1117] hover:brightness-110"
                      : "bg-[#3fdc7c] text-[#0f1117] hover:brightness-110 animate-bounce"
                  }`}
                >
                  {hasStarted ? "Acompanhar agora" : "Aposte Agora!"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
