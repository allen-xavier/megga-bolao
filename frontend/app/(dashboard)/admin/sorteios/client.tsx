'use client';

import { useMemo, useState } from 'react';

const initialSelection = new Set([11, 13, 14, 17, 18, 59]);

export default function AdminSorteiosClient() {
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(initialSelection);
  const [drawDate, setDrawDate] = useState(() => new Date().toISOString().slice(0, 16));

  const toggleNumber = (number: number) => {
    setSelectedNumbers((current) => {
      const next = new Set(current);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  };

  const formattedNumbers = useMemo(() => Array.from(selectedNumbers).sort((a, b) => a - b), [selectedNumbers]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestão de sorteios</p>
        <h1 className="text-2xl font-semibold">Registrar resultado oficial</h1>
        <p className="text-sm text-white/70">Informe os números sorteados e aplique imediatamente aos bolões ativos.</p>
      </header>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="flex flex-col gap-4 md:flex-row">
          <label className="flex-1 space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Data e horário do sorteio</span>
            <input
              type="datetime-local"
              value={drawDate}
              onChange={(event) => setDrawDate(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Números selecionados</p>
            <div className="flex flex-wrap gap-2">
              {formattedNumbers.map((number) => (
                <span
                  key={number}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-megga-magenta/20 text-sm font-semibold text-megga-yellow"
                >
                  {number.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
            <p className="text-xs text-white/60">Selecione exatamente 6 números para validar o sorteio.</p>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 60 }, (_, index) => index + 1).map((number) => {
            const isActive = selectedNumbers.has(number);
            return (
              <button
                key={number}
                type="button"
                onClick={() => toggleNumber(number)}
                className={`aspect-square rounded-full border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-megga-magenta ${
                  isActive
                    ? 'border-megga-magenta bg-megga-magenta/30 text-megga-yellow'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-megga-magenta/60 hover:text-white'
                }`}
              >
                {number.toString().padStart(2, '0')}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setSelectedNumbers(initialSelection)}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Restaurar seleção padrão
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Registrar sorteio
          </button>
        </div>
      </section>
    </div>
  );
}
