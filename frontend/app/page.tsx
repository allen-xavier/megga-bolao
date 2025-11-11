import Link from 'next/link';
import { RocketLaunchIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/solid';

const features = [
  {
    name: 'Bolões dinâmicos',
    description: 'Crie bolões com percentuais de prêmios flexíveis, promoções e acompanhamento de apostas em tempo real.',
    icon: TrophyIcon,
  },
  {
    name: 'Pagamentos automáticos',
    description: 'Integração com SuitPay para depósitos e saques rápidos, com aprovação automática ou manual.',
    icon: RocketLaunchIcon,
  },
  {
    name: 'Experiência mobile first',
    description: 'Frontend inspirado em aplicativos modernos, com PWA, notificações e NextAuth JWT.',
    icon: SparklesIcon,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.name} className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-megga-purple/70 text-megga-yellow">
              <feature.icon className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold">{feature.name}</h2>
            <p className="text-sm text-white/70">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
          <h3 className="text-xl font-semibold">Comece pelo painel</h3>
          <p className="mt-2 text-sm text-white/70">
            Explore os bolões em andamento, faça apostas, acompanhe sua posição no ranking e gerencie sua carteira.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Ir para o dashboard
          </Link>
        </div>
        <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
          <h3 className="text-xl font-semibold">Não tem conta?</h3>
          <p className="mt-2 text-sm text-white/70">
            Cadastre-se e valide seu número de WhatsApp para receber códigos em tempo real.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Acessar / Criar conta
          </Link>
        </div>
      </section>
    </div>
  );
}
