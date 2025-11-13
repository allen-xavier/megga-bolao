const payoutQueue = [
  {
    id: 'REQ-9087',
    user: 'Fernanda Souza',
    value: 'R$ 420,00',
    status: 'Aguardando aprovação',
    requestedAt: '25/05/2025 às 19h32',
  },
  {
    id: 'REQ-9079',
    user: 'Carlos Pereira',
    value: 'R$ 110,00',
    status: 'Automático enviado',
    requestedAt: '25/05/2025 às 18h45',
  },
];

const webhooks = [
  { id: 'WH-5523', type: 'Depósito confirmado', amount: 'R$ 250,00', at: '25/05/2025 17h01' },
  { id: 'WH-5522', type: 'Saque processado', amount: 'R$ 90,00', at: '25/05/2025 16h20' },
];

export const metadata = {
  title: 'SuitPay - Megga Bolão',
};

export default function SuitPayPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pagamentos</p>
        <h1 className="text-2xl font-semibold">Fluxo SuitPay</h1>
        <p className="text-sm text-white/70">
          Monitore solicitações de saque, regras automáticas e webhooks recebidos diretamente da SuitPay. Aprove para valores acima do limite automático.
        </p>
      </header>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fila de saques</h2>
          <span className="rounded-full bg-megga-yellow/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-megga-yellow">
            Limite auto: R$ 150,00
          </span>
        </div>
        <ul className="space-y-3">
          {payoutQueue.map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{item.id}</p>
                  <p className="mt-1 font-semibold text-white">{item.user}</p>
                  <p className="text-xs text-white/60">Solicitado em {item.requestedAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Valor</p>
                  <p className="mt-1 text-lg font-semibold text-megga-yellow">{item.value}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
                >
                  Detalhes
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Aprovar saque
                </button>
              </div>
              <p className="mt-3 text-xs text-white/60">{item.status}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Logs de webhooks</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Atualizar
          </button>
        </header>
        <ul className="space-y-2 text-sm">
          {webhooks.map((webhook) => (
            <li key={webhook.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{webhook.id}</p>
                <p className="mt-1 font-medium text-white">{webhook.type}</p>
                <p className="text-xs text-white/60">{webhook.at}</p>
              </div>
              <span className="text-base font-semibold text-megga-lime">{webhook.amount}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
