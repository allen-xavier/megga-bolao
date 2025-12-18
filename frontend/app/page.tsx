import Link from "next/link";
import {
  RocketLaunchIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";

const features = [
  {
    name: "Bolões dinâmicos",
    description:
      "Crie bolões com premiações flexíveis, promoções e acompanhamento em tempo real.",
    icon: TrophyIcon,
  },
  {
    name: "Pagamentos automáticos",
    description:
      "Integração com SuitPay para depósitos e saques rápidos, com aprovação automática ou manual.",
    icon: RocketLaunchIcon,
  },
  {
    name: "Experiência mobile first",
    description:
      "PWA, notificações e login seguro, inspirados em apps modernos de apostas.",
    icon: SparklesIcon,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-full space-y-8 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <section className="grid gap-4 rounded-3xl border border-white/5 bg-[#0f1117] p-6 text-white shadow-lg ring-1 ring-white/5 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.name}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1ea7a4]/15 text-[#f7b500]">
              <feature.icon className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold">{feature.name}</h2>
            <p className="text-sm text-white/70">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-[#0f1117] p-6 text-white shadow-lg ring-1 ring-white/5">
          <h3 className="text-xl font-semibold">Comece pelo painel</h3>
          <p className="mt-2 text-sm text-white/70">
            Explore os bolões em andamento, faça apostas, acompanhe sua posição
            no ranking e gerencie sua carteira.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#f7b500] px-4 py-2 text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
          >
            Ir para o dashboard
          </Link>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0f1117] p-6 text-white shadow-lg ring-1 ring-white/5">
          <h3 className="text-xl font-semibold">Não tem conta?</h3>
          <p className="mt-2 text-sm text-white/70">
            Cadastre-se e valide seu número de WhatsApp para receber códigos em
            tempo real.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#1ea7a4] hover:text-[#f7b500]"
          >
            Acessar / Criar conta
          </Link>
        </div>
      </section>
    </div>
  );
}
