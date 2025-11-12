import Link from 'next/link';

const boloes = [
  {
    id: '1645145',
    name: 'Bolão de Maio',
    status: 'Em andamento',
    prizePool: 'R$ 153.000,00',
    quotas: '1000 / 1200 cotas',
    guaranteed: 'R$ 10.000,00 garantido',
    highlight: 'Participando',
  },
  {
    id: '1654875',
    name: 'Bolão de Junho',
    status: 'Acumulado',
    prizePool: 'R$ 189.651,00',
    quotas: '800 / 1500 cotas',
    guaranteed: 'R$ 15.000,00 garantido',
    highlight: 'Acumulado',
  },
];

function StatusBadge({ label }: { label: string }) {
  const isActive = label === 'Em andamento';
  const color = isActive ? 'bg-megga-lime/20 text-megga-lime border-megga-lime/30' : 'bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export const metadata = {
  title: 'Bolões - Admin Megga Bolão',
};

export default function AdminBoloesPage() {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestão de bolões</p>
          <h1 className="text-2xl font-semibold">Bolões em andamento</h1>
        </div>
        <Link
          href="/admin/boloes/criar"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
        >
          Criar novo bolão
        </Link>
      </header>
      <section className="space-y-4">
        {boloes.map((bolao) => (
          <article key={bolao.id} className="rounded-3xl bg-megga-navy/80 p-5 text-white shadow-lg ring-1 ring-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">#{bolao.id}</p>
                <h2 className="mt-1 text-lg font-semibold">{bolao.name}</h2>
              </div>
              <StatusBadge label={bolao.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Premiação total</p>
                <p className="mt-2 text-base font-semibold text-megga-yellow">{bolao.prizePool}</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Cotas vendidas</p>
                <p className="mt-2 text-base font-semibold text-white">{bolao.quotas}</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Premiação garantida</p>
                <p className="mt-2 text-base font-semibold text-white">{bolao.guaranteed}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href={`/boloes/${bolao.id}`}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
              >
                Visualizar bolão
              </Link>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Editar / Pausar
              </button>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/50">{bolao.highlight}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
