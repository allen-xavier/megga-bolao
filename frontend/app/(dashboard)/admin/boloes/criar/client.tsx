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

export default function CreateBolaoClient() {
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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
            <span className="text-xs text-white/60">Valor mínimo garantido. Só entra na conta após superar o arrecadado.</span>
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Valor da cota</span>
            <input
              type="number"
              defaultValue={35}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Mínimo de cotas</span>
            <input
              type="number"
              defaultValue={500}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Resumo financeiro</p>
          <p className="mt-2 text-base font-semibold text-megga-yellow">{totalPercentage}% destinado a prêmios</p>
          <p className="text-xs text-white/60">
            A Taxa Megga atual é de <span className="font-semibold text-megga-yellow">{meggaTax}%</span>. Ajuste as premiações para não exceder o arrecadado.
          </p>
        </div>
      </section>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Premiações</p>
          <h2 className="text-xl font-semibold">Percentuais configuráveis</h2>
          <p className="text-sm text-white/60">Ative ou desative prêmios conforme a estratégia do bolão.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {prizes.map((prize) => (
            <label
              key={prize.id}
              className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 transition hover:border-megga-magenta"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{prize.name}</p>
                  <p className="text-sm text-white/70">{prize.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prize.enabled}
                  onChange={() => togglePrize(prize.id)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent text-megga-magenta focus:ring-megga-magenta"
                />
              </div>
              <input
                type="number"
                value={prize.percentage}
                onChange={(event) =>
                  setPrizes((current) =>
                    current.map((item) =>
                      item.id === prize.id ? { ...item, percentage: Number(event.target.value) } : item,
                    ),
                  )
                }
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-megga-magenta focus:outline-none"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetPrizes}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Restaurar padrão
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Salvar configurações
          </button>
        </div>
      </section>
    </div>
  );
}
