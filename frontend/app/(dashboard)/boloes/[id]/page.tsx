import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { BetsList } from '@/components/bets-list';

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
              <p className="mt-2 text-2xl font-semibold text-megga-yellow">R$ {formatCurrency(Number(bolao.ticketPrice))}</p>
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
            {['Apostar', 'Sorteios', 'Premiação', 'Apostadores'].map((item) => (
              <span key={item} className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70">
                {item}
              </span>
            ))}
          </nav>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
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

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Lista de apostadores</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60">
            Transparência
          </span>
        </header>
        <BetsList bets={bolao.bets ?? []} />
      </section>
    </div>
  );
}
