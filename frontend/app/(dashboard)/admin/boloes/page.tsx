'use client';

import { Suspense } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

type Prize = {
  id: string;
  type: string;
  percentage: number | null;
  fixedValue: number | null;
};

type BetCount = { bets?: number };

type Bolao = {
  id: string;
  name: string;
  startsAt: string;
  guaranteedPrize: number | string | null;
  commissionPercent?: number | string | null;
  comissaoPercentual?: number | string | null;
  commission?: number | string | null;
  premiacaoGarantida?: number | string | null;
  premiacaoTotal?: number | string | null;
  prizeTotal?: number | string | null;
  prizePool?: number | string | null;
  prizePoolValue?: number | string | null;
  prizePoolList?: number | string | null;
  estimatedPrize?: number | string | null;
  estimatedTotalPrize?: number | string | null;
  estimatedPool?: number | string | null;
  totalPrize?: number | string | null;
  totalPrizeValue?: number | string | null;
  prizeCount?: number | null;
  minimumQuotas: number;
  ticketPrice: number | string;
  closedAt?: string | null;
  prizes: Prize[];
  _count?: BetCount;
  isParticipant?: boolean;
  myBets?: { userId: string }[];
  bets?: { userId: string }[];
  hasPrize?: boolean;
  sena?: number | string;
  senaAcumulada?: number | string;
  senaAcumuladaValor?: number | string;
  senaAccumulated?: number | string;
  senaAccumulatedValue?: number | string;
  senaReserved?: number | string;
  senaReservedAmount?: number | string;
  senaPot?: number | string;
  senaPotValue?: number | string;
  senaPotAmount?: number | string;
  senaPotReserved?: number | string;
  senaPotApplied?: number | string;
  senaApplied?: number | string;
  senaCurrentPot?: number | string;
  senaPotCurrent?: number | string;
  senaPotRollover?: number | string;
  senaPotTotal?: number | string;
  senaPotAccumulated?: number | string;
  senaAcumuladaTotal?: number | string;
};

function StatusBadge({ label }: { label: string }) {
  const isActive = label === 'Em andamento';
  const color = isActive
    ? 'bg-[#1ea7a4]/15 text-[#1ea7a4] border-[#1ea7a4]/30'
    : label === 'Encerrado'
      ? 'bg-red-700/30 text-red-300 border-red-400/40'
      : 'bg-[#f7b500]/10 text-[#f7b500] border-[#f7b500]/30';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseAmount(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');
  let normalized = trimmed;
  if (hasComma && hasDot) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = trimmed.replace(',', '.');
  } else if (hasDot && trimmed.split('.').length > 2) {
    normalized = trimmed.replace(/\./g, '');
  }
  normalized = normalized.replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function estimatePrize(bolao: Bolao) {
  const ticket = parseAmount(bolao.ticketPrice);
  const betsCount = bolao._count?.bets ?? bolao.bets?.length ?? 0;
  const commissionPercent =
    parseAmount(bolao.commissionPercent) ||
    parseAmount(bolao.commission) ||
    parseAmount(bolao.comissaoPercentual);
  const commissionRate = Math.min(Math.max(commissionPercent / 100, 0), 1);
  const netPool = betsCount * ticket * (1 - commissionRate);

  const garantido = parseAmount(bolao.guaranteedPrize) || parseAmount(bolao.premiacaoGarantida);

  const poolCandidates = [
    parseAmount(bolao.totalPrize),
    parseAmount(bolao.premiacaoTotal),
    parseAmount(bolao.prizeTotal),
    parseAmount(bolao.totalPrizeValue),
    parseAmount(bolao.estimatedTotalPrize),
    parseAmount(bolao.estimatedPrize),
    parseAmount(bolao.estimatedPool),
    parseAmount(bolao.prizePool),
    parseAmount(bolao.prizePoolValue),
    parseAmount(bolao.prizePoolList),
  ];

  const senaCandidates = [
    parseAmount(bolao.sena),
    parseAmount(bolao.senaAcumulada),
    parseAmount(bolao.senaAcumuladaValor),
    parseAmount(bolao.senaAccumulated),
    parseAmount(bolao.senaAccumulatedValue),
    parseAmount(bolao.senaReserved),
    parseAmount(bolao.senaReservedAmount),
    parseAmount(bolao.senaPot),
    parseAmount(bolao.senaPotValue),
    parseAmount(bolao.senaPotAmount),
    parseAmount(bolao.senaPotReserved),
    parseAmount(bolao.senaPotApplied),
    parseAmount(bolao.senaApplied),
    parseAmount(bolao.senaCurrentPot),
    parseAmount(bolao.senaPotCurrent),
    parseAmount(bolao.senaPotRollover),
    parseAmount(bolao.senaPotTotal),
    parseAmount(bolao.senaPotAccumulated),
    parseAmount(bolao.senaAcumuladaTotal),
  ];

  const computedPool = Math.max(garantido, netPool);
  const poolFallback = Math.max(0, ...poolCandidates);
  const basePool = computedPool > 0 ? computedPool : poolFallback;
  const senaTotal = Math.max(0, ...senaCandidates);
  const totalEstimado = basePool + senaTotal;

  const premiosPrevistos = bolao.prizeCount ?? bolao.prizes?.length ?? 0;

  return { totalEstimado, premiosPrevistos };
}

function formatSaoPaulo(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function toSections(boloes: Bolao[]) {
  const now = Date.now();
  const andamento: Bolao[] = [];
  const futuros: Bolao[] = [];
  const encerrados: Bolao[] = [];

  boloes.forEach((b) => {
    const closedTs = b.closedAt ? new Date(b.closedAt).getTime() : null;
    if (closedTs && closedTs <= now) {
      encerrados.push(b);
      return;
    }
    const start = new Date(b.startsAt).getTime();
    if (start > now) {
      futuros.push(b);
    } else {
      andamento.push(b);
    }
  });

  encerrados.sort((a, b) => {
    const ca = a.closedAt ? new Date(a.closedAt).getTime() : 0;
    const cb = b.closedAt ? new Date(b.closedAt).getTime() : 0;
    return cb - ca;
  });

  return { andamento, futuros, encerrados };
}

function AdminBoloesPageContent() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPERVISOR';
  const userId =
    (session?.user as any)?.id ??
    (session?.user as any)?._id ??
    (session?.user as any)?.sub ??
    (session?.user as any)?.userId ??
    (session as any)?.id ??
    (session as any)?.userId;
  const searchParams = useSearchParams();
  const filtro = searchParams.get('filtro');

  const { data, error, isLoading } = useSWR(
    token ? '/boloes' : null,
    () =>
      api
        .get('/boloes', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.data as Bolao[]),
    { revalidateOnFocus: false },
  );

  const { andamento, futuros, encerrados } = toSections(data ?? []);
  const visibleEncerrados = isAdmin ? encerrados : encerrados.slice(0, 5);
  const sectionsToRender = !isAdmin
    ? [{ title: 'Encerrados', list: visibleEncerrados }]
    : filtro === 'encerrados'
      ? [{ title: 'Encerrados', list: visibleEncerrados }]
      : filtro === 'futuros'
        ? [{ title: 'Futuros', list: futuros }]
        : filtro === 'andamento'
          ? [
              { title: 'Futuros', list: futuros },
              { title: 'Em andamento', list: andamento },
            ]
          : [
              { title: 'Futuros', list: futuros },
              { title: 'Em andamento', list: andamento },
              { title: 'Encerrados', list: visibleEncerrados },
            ];

  const renderClosedCard = (bolao: Bolao) => {
    const statusLabel = 'Encerrado';
    const hasPrize = Boolean(bolao.hasPrize);
    const inferredParticipant =
      bolao.isParticipant ||
      bolao.myBets?.some?.((b) => b.userId === userId) ||
      bolao.bets?.some?.((b) => b.userId === userId) ||
      hasPrize;
    const participationLabel = inferredParticipant ? 'Participando' : statusLabel;
    const { totalEstimado, premiosPrevistos } = estimatePrize(bolao);
    const closedAtLabel = formatSaoPaulo(bolao.closedAt ?? bolao.startsAt);
    const cardClass = 'border-[#ff4d4f]/25 bg-gradient-to-br from-[#1c0b10] via-[#141520] to-[#0e1118]';
    const headerClass = 'bg-[#2a0f12]';
    const statusPillClass = 'bg-[#ff4d4f]/15 text-[#ff4d4f]';
    const panelClass = 'border-[#ff4d4f]/25 bg-[#160d10]/75';
    const infoPanelClass = 'border-[#ff4d4f]/15 bg-[#12141d]/70';
    const patternStyle = {
      backgroundImage:
        'radial-gradient(circle at 85% 0%, rgba(255, 77, 79, 0.2), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.05), transparent 50%)',
    };

    return (
      <article key={bolao.id} className={`relative overflow-hidden rounded-2xl border text-white shadow-lg ${cardClass}`}>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-70" style={patternStyle} aria-hidden />
        <div className="relative z-10">
          <div className={`flex items-center justify-between px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] md:px-5 md:py-3 md:text-[11px] md:tracking-[0.18em] ${headerClass}`}>
            <span className="inline-flex flex-wrap items-center gap-2 font-semibold text-[#ff6b6d]">
              <span
                className="h-2.5 w-2.5 rounded-full bg-[#ff4d4f] shadow-[0_0_8px_rgba(255,77,79,0.65)]"
                aria-hidden
              />
              {participationLabel}
              {hasPrize && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#ff4d4f]/35 bg-[#ff4d4f]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#ff4d4f] winner-badge-pulse">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
                    <path
                      d="M3 7h18v4H3zM5 11h14v9H5zM12 7v13M9 7c-1.1 0-2-.9-2-2s.9-2 2-2c2 0 3 2 3 4M15 7c1.1 0 2-.9 2-2s-.9-2-2-2c-2 0-3 2-3 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Ganhou
                </span>
              )}
            </span>
            <span className={`rounded-full px-3 py-1 ${statusPillClass}`}>{statusLabel}</span>
          </div>

          <div className="space-y-3 px-4 pb-4 pt-2 md:px-5 md:pb-6 md:pt-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 self-center">
                <h3 className="text-xl font-semibold leading-tight text-white">{bolao.name}</h3>
                <p className="mt-0.5 text-xs text-white/65">Bolao encerrado em {closedAtLabel}</p>
              </div>
              <div className="flex flex-col items-end justify-end self-end rounded-2xl border border-white/10 bg-[#141823] px-4 py-3 text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 md:tracking-[0.2em]">Cota</p>
                <p className="text-lg font-semibold text-[#ff4d4f]">
                  R$ {parseAmount(bolao.ticketPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </header>

            <div className={`rounded-2xl border px-4 py-1 text-white shadow-inner ${panelClass}`}>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
                <span>Valor da premiacao</span>
              </div>
              <p className="mt-0.5 text-center text-3xl font-bold text-[#ff4d4f]">{formatCurrency(totalEstimado)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-wide text-white/65">
              <div className={`rounded-2xl border px-4 py-3 ${infoPanelClass}`}>
                <span className="block text-[10px] text-white/40">Encerrado em</span>
                <span className="mt-1 block text-base font-semibold text-white">{closedAtLabel}</span>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${infoPanelClass}`}>
                <span className="block text-[10px] text-white/40">Premios configurados</span>
                <span className="mt-1 block text-base font-semibold text-white">
                  {premiosPrevistos > 0 ? `${premiosPrevistos} premio${premiosPrevistos > 1 ? 's' : ''}` : 'Em configuracao'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/boloes/${bolao.id}`}
                className="flex-1 rounded-2xl bg-[#ff4d4f] py-3 text-center text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
              >
                Visualizar bolao
              </Link>
              {isAdmin && (
                <Link
                  href={`/admin/boloes/criar?id=${bolao.id}`}
                  className="flex-1 rounded-2xl bg-[#1ea7a4] py-3 text-center text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
                >
                  Editar / pausar
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderDefaultCard = (bolao: Bolao) => (
    <article key={bolao.id} className="rounded-3xl bg-[#111218] p-5 text-white shadow-lg ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">#{bolao.id}</p>
          <h3 className="mt-1 text-lg font-semibold">{bolao.name}</h3>
          <p className="text-xs text-white/60">
            Inicio: {formatSaoPaulo(bolao.startsAt)} - Cota: {formatCurrency(parseAmount(bolao.ticketPrice))} - Minimo: {bolao.minimumQuotas} cotas
          </p>
          {(bolao.isParticipant ||
            bolao.myBets?.some?.((b) => b.userId === userId) ||
            bolao.bets?.some?.((b) => b.userId === userId)) && (
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#1ea7a4]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1ea7a4]">
              Participando
            </span>
          )}
        </div>
        <StatusBadge
          label={
            bolao.closedAt
              ? 'Encerrado'
              : new Date(bolao.startsAt).getTime() > Date.now()
                ? 'Futuro'
                : 'Em andamento'
          }
        />
      </div>
      <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-3">
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Premiacao garantida</p>
          <p className="mt-2 text-base font-semibold text-[#f7b500]">
            {formatCurrency(parseAmount(bolao.guaranteedPrize))}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Comissao</p>
          <p className="mt-2 text-base font-semibold text-white">{Number(bolao.commissionPercent ?? 0).toFixed(2)}%</p>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Premios configurados</p>
          <p className="mt-2 text-base font-semibold text-white">{bolao.prizes?.length ?? 0} premiacoes</p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link
          href={`/boloes/${bolao.id}`}
          className="flex-1 rounded-2xl bg-[#f7b500] py-3 text-center text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
        >
          Visualizar bolao
        </Link>
        {isAdmin && (
          <Link
            href={`/admin/boloes/criar?id=${bolao.id}`}
            className="flex-1 rounded-2xl bg-[#1ea7a4] py-3 text-center text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
          >
            Editar / pausar
          </Link>
        )}
      </div>
    </article>
  );

  const renderList = (title: string, list: Bolao[]) => {
    const isClosedList = title === 'Encerrados';

    return (
      <section className="space-y-4 md:space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">{list.length} registros</span>
        </div>
        {list.length === 0 ? (
          <p className="rounded-2xl bg-[#111218] p-4 text-sm text-white/70 ring-1 ring-white/5">Nenhum bolao encontrado.</p>
        ) : isClosedList ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">{list.map(renderClosedCard)}</div>
        ) : (
          list.map(renderDefaultCard)
        )}
      </section>
    );
  };

  if (status !== 'authenticated') {
    return (
      <p className="rounded-2xl bg-[#111218] p-4 text-sm text-white/70 ring-1 ring-white/5">
        Faca login para visualizar os boloes.
      </p>
    );
  }

  if (isLoading) {
    return <p className="rounded-2xl bg-[#111218] p-4 text-sm text-white/70 ring-1 ring-white/5">Carregando bolões...</p>;
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-[#111218] p-4 text-sm text-[#f7b500] ring-1 ring-white/5">
        Erro ao carregar bolões: {error?.message ?? 'falha desconhecida'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            {isAdmin ? 'Gestao de boloes' : 'Historico de boloes'}
          </p>
          <h1 className="text-2xl font-semibold">{isAdmin ? 'Boloes' : 'Boloes encerrados'}</h1>
        </div>
        {isAdmin && (
          <Link
            href="/admin/boloes/criar"
            className="inline-flex items-center gap-2 rounded-full bg-[#f7b500] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f1117] transition hover:brightness-110"
          >
            Criar novo bolão
          </Link>
        )}
      </header>

      {sectionsToRender.map((section) => renderList(section.title, section.list))}
    </div>
  );
}

export default function AdminBoloesPage() {
  return (
    <Suspense fallback={<p className="rounded-2xl bg-[#111218] p-4 text-sm text-white/70 ring-1 ring-white/5">Carregando bolões...</p>}>
      <AdminBoloesPageContent />
    </Suspense>
  );
}





