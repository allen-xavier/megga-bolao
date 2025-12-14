'use client';

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

type Bolao = {
  id: string;
  name: string;
  startsAt: string;
  guaranteedPrize: number | null;
  commissionPercent: number | null;
  minimumQuotas: number;
  ticketPrice: number;
  closedAt?: string | null;
  prizes: Prize[];
};

function StatusBadge({ label }: { label: string }) {
  const isActive = label === 'Em andamento';
  const color = isActive
    ? 'bg-megga-lime/20 text-megga-lime border-megga-lime/30'
    : label === 'Encerrado'
      ? 'bg-white/10 text-white border-white/20'
      : 'bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30';
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

  return { andamento, futuros, encerrados };
}

export default function AdminBoloesPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
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
  const sectionsToRender =
    filtro === 'encerrados'
      ? [{ title: 'Encerrados', list: encerrados }]
      : filtro === 'futuros'
        ? [{ title: 'Futuros', list: futuros }]
        : [{ title: 'Em andamento', list: andamento }, { title: 'Futuros', list: futuros }, { title: 'Encerrados', list: encerrados }];

  const renderList = (title: string, list: Bolao[]) => (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs uppercase tracking-[0.3em] text-white/50">{list.length} registros</span>
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-megga-navy/80 p-4 text-sm text-white/70 ring-1 ring-white/5">Nenhum bolão encontrado.</p>
      ) : (
        list.map((bolao) => (
          <article key={bolao.id} className="rounded-3xl bg-megga-navy/80 p-5 text-white shadow-lg ring-1 ring-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">#{bolao.id}</p>
                <h3 className="mt-1 text-lg font-semibold">{bolao.name}</h3>
                <p className="text-xs text-white/60">
                  Início: {new Date(bolao.startsAt).toLocaleString('pt-BR')} • Cota: {formatCurrency(bolao.ticketPrice)} • Mínimo: {bolao.minimumQuotas} cotas
                </p>
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
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Premiação garantida</p>
                <p className="mt-2 text-base font-semibold text-megga-yellow">{formatCurrency(bolao.guaranteedPrize)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Comissão</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {Number(bolao.commissionPercent ?? 0).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Prêmios configurados</p>
                <p className="mt-2 text-base font-semibold text-white">{bolao.prizes?.length ?? 0} premiações</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href={`/boloes/${bolao.id}`}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
              >
                Visualizar bolão
              </Link>
              <Link
                href={`/admin/boloes/criar?id=${bolao.id}`}
                className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-center text-sm font-semibold text-white transition hover:opacity-95"
              >
                Editar / Pausar
              </Link>
            </div>
          </article>
        ))
      )}
    </section>
  );

  if (status !== 'authenticated') {
    return (
      <p className="rounded-2xl bg-megga-navy/80 p-4 text-sm text-white/70 ring-1 ring-white/5">
        Faça login como administrador para visualizar os bolões.
      </p>
    );
  }

  if (isLoading) {
    return <p className="rounded-2xl bg-megga-navy/80 p-4 text-sm text-white/70 ring-1 ring-white/5">Carregando bolões...</p>;
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-megga-navy/80 p-4 text-sm text-megga-yellow ring-1 ring-white/5">
        Erro ao carregar bolões: {error?.message ?? 'falha desconhecida'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestão de bolões</p>
          <h1 className="text-2xl font-semibold">Bolões</h1>
        </div>
        <Link
          href="/admin/boloes/criar"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
        >
          Criar novo bolão
        </Link>
      </header>

      {sectionsToRender.map((section) => renderList(section.title, section.list))}
    </div>
  );
}
