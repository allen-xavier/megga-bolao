import Link from 'next/link';

const quickLinks = [
  {
    title: 'Criar Bolão',
    href: '/admin/boloes/criar',
    highlight: 'Configurar cotas e prêmios',
    description: 'Defina data de início, valor da cota e percentuais de premiação para novos bolões.',
  },
  {
    title: 'Sorteios',
    href: '/admin/sorteios',
    highlight: 'Registrar números oficiais',
    description: 'Cadastre resultados e atualize rankings dos bolões em andamento.',
  },
  {
    title: 'Aprovar Saques',
    href: '/admin/saques',
    highlight: 'SuitPay',
    description: 'Libere pagamentos acima do limite automático e acompanhe webhooks.',
  },
  {
    title: 'Configurar Afiliados',
    href: '/admin/afiliados',
    highlight: 'Indique e Ganhe',
    description: 'Ajuste percentuais das comissões direta e indireta do programa.',
  },
];

export const metadata = {
  title: 'Mais ações - Megga Bolão',
};

export default function MaisPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Atalhos do Administrador</p>
        <h1 className="text-2xl font-semibold">Central de ações rápidas</h1>
        <p className="text-sm text-white/70">
          Acesse configurações estratégicas do Megga Bolão em um único lugar. Escolha a área desejada para continuar o fluxo.
        </p>
      </header>
      <section className="grid gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group block rounded-3xl border border-white/5 bg-megga-navy/80 p-5 text-white shadow-lg ring-1 ring-white/5 transition hover:border-megga-magenta/40 hover:bg-megga-purple/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-megga-lime">{link.highlight}</p>
                <h2 className="mt-2 text-xl font-semibold">{link.title}</h2>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-megga-yellow transition group-hover:bg-white/20">
                <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <p className="mt-4 text-sm text-white/70">{link.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
