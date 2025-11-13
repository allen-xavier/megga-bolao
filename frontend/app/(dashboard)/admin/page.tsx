const metrics = [
  {
    label: 'Premiação Garantida',
    value: 'R$ 260.000,00',
    caption: 'Somatório dos bolões ativos',
  },
  {
    label: 'Carteira Administrativa',
    value: 'R$ 48.930,00',
    caption: 'Disponível para pagamentos e bônus',
  },
  {
    label: 'Usuários Verificados',
    value: '1.284',
    caption: 'Com CPF e WhatsApp confirmados',
  },
];

const highlights = [
  {
    title: 'Bolão de Maio',
    status: 'Em andamento',
    quotas: '153.000 cotas vendidas',
    nextDraw: 'Próximo sorteio 28/05 - 19h',
  },
  {
    title: 'Bolão de Junho',
    status: 'Acumulado',
    quotas: '189.651 cotas vendidas',
    nextDraw: 'Próximo sorteio 18/06 - 19h',
  },
];

export const metadata = {
  title: 'Admin - Megga Bolão',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Administração</p>
        <h1 className="text-2xl font-semibold">Painel do administrador</h1>
        <p className="text-sm text-white/70">
          Acompanhe resultados operacionais, status dos bolões e indicadores financeiros em tempo real.
        </p>
      </header>
      <section className="grid gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-megga-yellow">{metric.value}</p>
            <p className="mt-2 text-sm text-white/60">{metric.caption}</p>
          </div>
        ))}
      </section>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Bolões em destaque</p>
            <h2 className="mt-1 text-lg font-semibold">Visão geral das campanhas</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Ver todos
          </button>
        </header>
        <ul className="space-y-3">
          {highlights.map((highlight) => (
            <li key={highlight.title} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{highlight.status}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{highlight.title}</h3>
                <p className="text-xs text-white/60">{highlight.quotas}</p>
              </div>
              <span className="text-sm font-semibold text-megga-lime">{highlight.nextDraw}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
