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

export default async function BolaoPage({ params }: { params: { id: string } }) {
  const bolao = await getBolao(params.id);
  if (!bolao) {
    notFound();
  }

  return (
    <div className="space-y-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <header className="space-y-2">
        <p className="text-sm text-slate-300">Início {new Date(bolao.startsAt).toLocaleString('pt-BR')}</p>
        <h1 className="text-2xl font-semibold text-white">{bolao.name}</h1>
        <p className="text-sm text-slate-400">
          Valor da cota: R$ {Number(bolao.ticketPrice).toFixed(2)} • Cotas mínimas: {bolao.minimumQuotas}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Premiações</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {bolao.prizes?.map((prize: any) => (
            <li key={prize.id} className="rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/5">
              <p className="text-sm font-medium text-white">{prize.type}</p>
              <p className="text-sm text-slate-300">
                {prize.percentage ? `${Number(prize.percentage).toFixed(2)}%` : `R$ ${Number(prize.fixedValue).toFixed(2)}`}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Apostas</h2>
        <BetsList bets={bolao.bets ?? []} />
      </section>
    </div>
  );
}
