const mockTickets = [
  {
    id: '1645145',
    bolao: 'Bolão de Maio',
    status: 'Ganhador',
    numbers: ['01', '07', '15', '23', '41', '45', '47', '55', '58', '60'],
    prize: 'R$ 60.000,00',
  },
  {
    id: '1654875',
    bolao: 'Bolão de Junho',
    status: 'Em análise',
    numbers: ['03', '05', '11', '22', '36', '40', '44', '52', '57', '59'],
    prize: 'Aguardando',
  },
];

function StatusPill({ status }: { status: string }) {
  const isWinner = status === 'Ganhador';
  const colors = isWinner
    ? 'bg-megga-lime/20 text-megga-lime border-megga-lime/30'
    : 'bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${colors}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export const metadata = {
  title: 'Tickets - Megga Bolão',
};

export default function TicketsPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Comprovantes</p>
        <h1 className="text-2xl font-semibold">Tickets e transparência</h1>
        <p className="text-sm text-white/70">
          Consulte seus comprovantes de aposta, status de auditoria e prêmios confirmados. Faça o download para compartilhar com o seu time.
        </p>
      </header>
      <section className="space-y-4">
        {mockTickets.map((ticket) => (
          <article key={ticket.id} className="rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Ticket #{ticket.id}</p>
                <h2 className="mt-1 text-lg font-semibold">{ticket.bolao}</h2>
              </div>
              <StatusPill status={ticket.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Números apostados</p>
                <p className="mt-2 font-medium tracking-[0.35em] text-white">{ticket.numbers.join(' ')}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span className="uppercase tracking-[0.3em] text-white/40">Premiação</span>
                <span className="text-base font-semibold text-megga-yellow">{ticket.prize}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
              >
                Ver transparência
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Baixar ticket
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
