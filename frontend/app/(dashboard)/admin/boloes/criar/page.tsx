'use client';

import { useMemo, useState } from 'react';

interface PrizeOption {
  id: string;
  name: string;
  description: string;
  percentage: number;
  enabled: boolean;
}

const basePrizes: PrizeOption[] = [
  { id: 'pe-quente', name: 'Pé Quente', description: 'Ganha quem acertar 10 números primeiro', percentage: 40, enabled: true },
  { id: 'pe-frio', name: 'Pé Frio', description: 'Ganha quem acertar menos números no final', percentage: 12, enabled: true },
  { id: 'consolacao', name: 'Consolação', description: 'Ganha quem ficar com 9 acertos no final', percentage: 8, enabled: true },
  { id: 'sena', name: 'Sena 1º Sorteio', description: 'Ganha quem completar 6 acertos no primeiro sorteio', percentage: 10, enabled: true },
  { id: 'ligeirinho', name: 'Ligeirinho', description: 'Ganha quem fizer mais acertos no primeiro sorteio', percentage: 5, enabled: true },
  { id: 'oito', name: '8 acertos', description: 'Ganha quem finalizar com 8 acertos', percentage: 8, enabled: true },
  { id: 'indicacao', name: 'Indique e Ganhe', description: 'Comissão direta e indireta', percentage: 3, enabled: true },
];

export const metadata = {
  title: 'Criar Bolão - Admin Megga Bolão',
};

export default function CreateBolaoPage() {
  const [prizes, setPrizes] = useState<PrizeOption[]>(() => basePrizes.map((prize) => ({ ...prize })));
  const [guaranteedPrize, setGuaranteedPrize] = useState('10000,00');

  const { totalPercentage, meggaTax } = useMemo(() => {
    const total = prizes.filter((prize) => prize.enabled).reduce((acc, prize) => acc + prize.percentage, 0);
    const tax = Math.max(0, 100 - total);
    return { totalPercentage: total, meggaTax: tax };
  }, [prizes]);

  const togglePrize = (id: string) => {
    setPrizes((current) =>
      current.map((prize) =>
        prize.id === id
          ? {
              ...prize,
              enabled: !prize.enabled,
            }
          : prize,
      ),
    );
  };

  const resetPrizes = () => {
    setPrizes(basePrizes.map((prize) => ({ ...prize })));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Novo bolão</p>
          <h1 className="text-2xl font-semibold">Criar bolão promocional</h1>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-95"
        >
          Salvar rascunho
        </button>
      </header>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Nome do bolão</span>
            <input
              type="text"
              defaultValue="Bolão de Maio"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Premiação garantida</span>
            <input
              type="text"
              value={guaranteedPrize}
              onChange={(event) => setGuaranteedPrize(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Data / horário início</span>
            <input
              type="datetime-local"
              defaultValue="2025-05-28T19:00"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-white/80">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">Mínimo de cotas</span>
              <input
                type="number"
                defaultValue={500}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">Valor da cota</span>
              <input
                type="number"
                defaultValue={50}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-megga-magenta focus:outline-none"
              />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Premiação total</p>
            <p className="mt-1 text-lg font-semibold text-megga-yellow">{totalPercentage}%</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Taxa Megga</p>
            <p className="mt-1 text-lg font-semibold text-megga-lime">{meggaTax}%</p>
          </div>
        </div>
      </section>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Premiações configuráveis</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Distribuição dos prêmios</h2>
          </div>
          <button
            type="button"
            onClick={resetPrizes}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Restaurar padrão
          </button>
        </header>
        <ul className="space-y-3">
          {prizes.map((prize) => (
            <li key={prize.id} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <input
                  id={`prize-${prize.id}`}
                  type="checkbox"
                  checked={prize.enabled}
                  onChange={() => togglePrize(prize.id)}
                  className="mt-1 h-5 w-5 rounded border border-white/30 bg-transparent accent-megga-magenta"
                />
                <div>
                  <label htmlFor={`prize-${prize.id}`} className="text-sm font-semibold text-white">
                    {prize.name}
                  </label>
                  <p className="text-xs text-white/60">{prize.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={prize.percentage}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPrizes((current) =>
                      current.map((item) => (item.id === prize.id ? { ...item, percentage: Number.isNaN(value) ? 0 : value } : item)),
                    );
                  }}
                  className="w-24 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm text-white focus:border-megga-magenta focus:outline-none"
                />
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">%</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <footer className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
        >
          Cancelar
        </button>
        <button
          type="button"
          className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          Publicar bolão
        </button>
      </footer>
    </div>
  );
}
