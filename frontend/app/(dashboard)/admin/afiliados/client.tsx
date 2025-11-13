'use client';

import { useMemo, useState } from 'react';

export default function AdminAfiliadosClient() {
  const [firstCommission, setFirstCommission] = useState(2);
  const [secondCommission, setSecondCommission] = useState(1);
  const [firstBetBonus, setFirstBetBonus] = useState(10);

  const totalCommission = useMemo(() => firstCommission + secondCommission, [firstCommission, secondCommission]);

  const resetValues = () => {
    setFirstCommission(2);
    setSecondCommission(1);
    setFirstBetBonus(10);
  };

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Programa de afiliados</p>
        <h1 className="text-2xl font-semibold">Configurar indicações</h1>
        <p className="text-sm text-white/70">
          Defina percentuais de comissão por indicação direta e indireta e configure o bônus para a primeira aposta do indicado.
        </p>
      </header>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Comissão 1º nível</span>
            <input
              type="number"
              value={firstCommission}
              onChange={(event) => setFirstCommission(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
            <span className="text-xs text-white/60">Percentual pago para indicações diretas.</span>
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Comissão 2º nível</span>
            <input
              type="number"
              value={secondCommission}
              onChange={(event) => setSecondCommission(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
            <span className="text-xs text-white/60">Percentual pago para indicações indiretas.</span>
          </label>
          <label className="space-y-2 text-sm text-white/80 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Bônus na primeira aposta</span>
            <input
              type="number"
              value={firstBetBonus}
              onChange={(event) => setFirstBetBonus(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
            <span className="text-xs text-white/60">Valor em reais creditado após a primeira aposta do indicado.</span>
          </label>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Resumo das comissões</p>
          <p className="mt-2 text-base font-semibold text-megga-yellow">{totalCommission}% do total de premiações</p>
          <p className="text-xs text-white/60">
            A soma das comissões precisa ficar abaixo de 3% para manter a Taxa Megga positiva. Ajuste conforme sua estratégia de marketing.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetValues}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Restaurar valores padrão
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
