import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { BetsList } from '@/components/bets-list';
import { PlaceBetForm } from '@/components/place-bet-form';
import { TransparencyDownload } from '@/components/transparency-download';

async function getBolao(id: string) {
  try {
    const response = await api.get(`/boloes/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function BolaoPage({ params }: { params: { id: string } }) {
  const bolao = await getBolao(params.id);
  if (!bolao) {
    notFound();
  }

  const startsAt = new Date(bolao.startsAt);
  const ticketPrice = Number(bolao.ticketPrice ?? 0);
  const hasTransparency = Boolean(bolao.transparency);
  const draws = bolao.draws ?? [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-megga-navy/80 text-white shadow-lg ring-1 ring-white/5">
        <div className="flex items-center justify-between bg-megga-purple/80 px-6 py-4 text-[11px] uppercase tracking-[0.24em] text-white/70">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-megga-lime shadow" aria-hidden /> Em andamento
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">Bolão #{bolao.id.slice(0, 6)}</span>
        </div>
        <div className="space-y-6 px-6 pb-8 pt-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold leading-tight">{bolao.name}</h1>
              <p className="mt-1 text-sm text-white/60">
                Início {startsAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às{' '}
                {startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Dias oficiais: terça, quinta e sábado</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-megga-magenta via-megga-purple to-megga-teal px-5 py-4 text-right shadow">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Valor da cota</p>
              <p className="mt-2 text-2xl font-semibold text-megga-yellow">R$ {formatCurrency(ticketPrice)}</p>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.28em] text-white/60">
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <span className="text-white/40">Cotas mínimas</span>
              <p className="mt-2 text-lg font-semibold text-white">{bolao.minimumQuotas}</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <span className="text-white/40">Promoção</span>
              <p className="mt-2 text-lg font-semibold text-white">{bolao.promotional ? 'Ativa' : 'Padrão'}</p>
            </div>
          </div>
          <nav className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.24em] text-white/60">
            <a href="#apostar" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Apostar
            </a>
            <a href="#sorteios" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Sorteios
            </a>
            <a href="#premiacoes" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Premiação
            </a>
            <a href="#apostadores" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Apostadores
            </a>
          </nav>
        </div>
      </section>

      <div id="apostar">
        <PlaceBetForm bolaoId={bolao.id} ticketPrice={ticketPrice} />
      </div>

      <section id="premiacoes" className="space-y-4 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <header>
          <h2 className="text-lg font-semibold">Premiações</h2>
          <p className="text-sm text-white/60">Distribuição configurada para este bolão.</p>
        </header>
        <ul className="space-y-3">
          {bolao.prizes?.map((prize: any) => (
            <li key={prize.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-white">{prize.type}</p>
                <p className="text-xs text-white/60">Premiação prevista</p>
              </div>
              <span className="text-sm font-semibold text-megga-yellow">
                {prize.percentage
                  ? `${Number(prize.percentage).toFixed(2)}%`
                  : `R$ ${formatCurrency(Number(prize.fixedValue ?? 0))}`}
              </span>
            </li>
          ))}
          {(!bolao.prizes || bolao.prizes.length === 0) && (
            <li className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/60">
              Nenhuma premiação configurada para este bolão.
            </li>
          )}
        </ul>
      </section>

      <section id="sorteios" className="space-y-3 rounded-3xl bg-megga-surface/60 p-6 text-white shadow-lg ring-1 ring-white/5">
        <header>
          <h2 className="text-lg font-semibold">Sorteios</h2>
          <p className="text-sm text-white/60">Resultados oficiais vinculados a este bolão.</p>
        </header>
        {draws.length === 0 ? (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
            Nenhum sorteio registrado ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {draws.map((draw: any) => (
              <li key={draw.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Data</p>
                    <p className="font-semibold">
                      {new Date(draw.drawnAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draw.numbers?.map((num: number) => (
                      <span
                        key={num}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-megga-magenta/25 text-xs font-semibold text-megga-yellow"
                      >
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="apostadores" className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Lista de apostadores</h2>
          <TransparencyDownload bolaoId={bolao.id} hasFile={hasTransparency} />
        </header>
        <BetsList bets={bolao.bets ?? []} />
      </section>
    </div>
  );
}
