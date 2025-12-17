'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';

interface Bolao {
  id: string;
  name: string;
  startsAt: string;
  promotional: boolean;
  isParticipant?: boolean;
  ticketPrice: string;
  minimumQuotas: number;
  closedAt?: string | null;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);
const authedFetcher = ([url, token]: [string, string]) =>
  api.get(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then((response) => response.data);

function formatStartsAt(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getNextDrawLabel() {
  const now = new Date();
  const nowSp = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const targetDays = [2, 4, 6]; // terça(2), quinta(4), sábado(6)
  for (let add = 0; add < 7; add += 1) {
    const candidate = new Date(nowSp.getTime() + add * 24 * 60 * 60 * 1000);
    if (targetDays.includes(candidate.getDay())) {
      if (add === 0) return 'Hoje';
      return candidate.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
  }
  return '';
}

export function DashboardBoloes() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const { data, isLoading } = useSWR<Bolao[]>(token ? ['/boloes', token] : '/boloes', token ? authedFetcher : fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    refreshInterval: 15000,
  });

  const now = Date.now();
  const ativos = (data ?? []).filter((b) => {
    const closedTs = b.closedAt ? new Date(b.closedAt).getTime() : null;
    return !closedTs || closedTs > now;
  });

  if (isLoading) {
    return <div className="rounded-3xl bg-megga-navy/60 p-6 text-sm text-white/60">Carregando bolões...</div>;
  }

  if (!ativos || ativos.length === 0) {
    return (
      <section className="rounded-3xl bg-megga-navy/60 p-6 text-sm text-white/70 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Bolões em andamento</h2>
        <p className="mt-4 text-sm text-white/60">
          Nenhum bolão ativo no momento. Volte mais tarde para acompanhar novas oportunidades.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {ativos.map((bolao) => {
        const startsAt = new Date(bolao.startsAt);
        const hasStarted = startsAt.getTime() <= Date.now();
        const statusLabel = hasStarted ? 'Em andamento' : 'Acumulando';
        const participationLabel = bolao.isParticipant ? 'Participando' : statusLabel;
        const nextDrawLabel = getNextDrawLabel();

        return (
          <article
            key={bolao.id}
            className="overflow-hidden rounded-3xl bg-megga-navy/80 text-white shadow-lg ring-1 ring-white/5"
          >
            <div className="flex items-center justify-between bg-megga-purple/80 px-5 py-3 text-[11px] uppercase tracking-[0.2em]">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-megga-lime shadow" aria-hidden />
                {participationLabel}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">{statusLabel}</span>
            </div>
            <div className="space-y-5 px-5 pb-6 pt-7">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold leading-tight">{bolao.name}</h3>
                  <p className="mt-1 text-xs text-white/70">Bolão inicia em {formatStartsAt(startsAt)}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-megga-magenta via-megga-purple to-megga-teal px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Cota</p>
                  <p className="text-lg font-semibold text-megga-yellow">
                    R$ {Number(bolao.ticketPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </header>
              <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-widest text-white/60">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <span className="block text-[10px] text-white/40">Cotas mínimas</span>
                  <span className="mt-1 block text-base font-semibold text-white">{bolao.minimumQuotas}</span>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <span className="block text-[10px] text-white/40">Próximo sorteio</span>
                  <span className="mt-1 block text-base font-semibold text-white">
                    {nextDrawLabel}
                  </span>
                </div>
              </div>
              <Link
                href={`/boloes/${bolao.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-3 text-sm font-semibold text-white shadow transition hover:opacity-95"
              >
                Acompanhar agora
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
