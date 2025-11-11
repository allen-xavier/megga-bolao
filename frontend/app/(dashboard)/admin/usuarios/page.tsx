const users = [
  { name: 'Fernanda Souza', phone: '(11) 98888-1212', cpf: '123.456.789-09', status: 'Verificado', balance: 'R$ 520,00' },
  { name: 'Carlos Pereira', phone: '(21) 97777-3434', cpf: '321.654.987-00', status: 'Pendente', balance: 'R$ 80,00' },
  { name: 'Juliana Alves', phone: '(31) 96666-9090', cpf: '456.789.123-11', status: 'Verificado', balance: 'R$ 1.250,00' },
];

function StatusPill({ status }: { status: string }) {
  const isVerified = status === 'Verificado';
  const color = isVerified ? 'bg-megga-lime/15 text-megga-lime border-megga-lime/30' : 'bg-megga-yellow/10 text-megga-yellow border-megga-yellow/30';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export const metadata = {
  title: 'Usuários - Admin Megga Bolão',
};

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestão de contas</p>
        <h1 className="text-2xl font-semibold">Usuários cadastrados</h1>
        <p className="text-sm text-white/70">
          Visualize dados de contato, status de verificação e saldo disponível para depósito ou saque.
        </p>
      </header>
      <section className="space-y-3 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Filtro rápido</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Buscar por nome ou CPF"
              className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
            />
            <select className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white focus:border-megga-magenta focus:outline-none">
              <option className="bg-megga-navy">Todos os status</option>
              <option className="bg-megga-navy">Verificado</option>
              <option className="bg-megga-navy">Pendente</option>
            </select>
            <button
              type="button"
              className="rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
        <ul className="space-y-3 text-sm text-white/80">
          {users.map((user) => (
            <li key={user.cpf} className="rounded-2xl bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-white/60">{user.phone}</p>
                </div>
                <StatusPill status={user.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                <span>CPF: {user.cpf}</span>
                <span>Saldo: <span className="font-semibold text-megga-yellow">{user.balance}</span></span>
              </div>
              <div className="mt-4 flex gap-3 text-sm">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
                >
                  Ver perfil
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 font-semibold text-white transition hover:opacity-95"
                >
                  Liberar saque
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
