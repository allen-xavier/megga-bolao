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
      <section className="grid gap-4 rounded-2xl bg-slate-900/60 p-6 shadow-lg ring-1 ring-white/10 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.name} className="flex flex-col gap-3 rounded-xl bg-slate-900/60 p-4 ring-1 ring-white/5">
            <feature.icon className="h-8 w-8 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">{feature.name}</h2>
            <p className="text-sm text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/5">
          <h3 className="text-xl font-semibold text-white">Comece pelo painel</h3>
          <p className="mt-2 text-sm text-slate-300">
            Explore os bolões em andamento, faça apostas, acompanhe sua posição no ranking e gerencie sua carteira.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-600"
          >
            Ir para o dashboard
          </Link>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/5">
          <h3 className="text-xl font-semibold text-white">Não tem conta?</h3>
          <p className="mt-2 text-sm text-slate-300">
            Cadastre-se e valide seu número de WhatsApp para receber códigos em tempo real.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-400 hover:text-primary-200"
          >
            Acessar / Criar conta
          </Link>
        </div>
      </section>
    </div>
  );
}
