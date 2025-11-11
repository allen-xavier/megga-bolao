'use client';

import { useMemo, useState } from 'react';

const numbers = Array.from({ length: 60 }, (_, index) => index + 1);

const runningPools = [
  { name: 'Bolão de Maio', code: '1645145', active: true },
  { name: 'Bolão de Junho', code: '1654875', active: true },
  { name: 'Bolão de São João', code: '1548754', active: true },
  { name: 'Bolão Julino', code: '1548754', active: false },
];

const registeredPools = [
  { name: 'Bolão de Maio', code: '1645145' },
  { name: 'Bolão de Junho', code: '1654875' },
  { name: 'Bolão de São João', code: '1548754' },
  { name: 'Bolão Julino', code: '1548754' },
];

const initialSelection = new Set([11, 13, 14, 17, 18, 59]);

export const metadata = {
  title: 'Sorteios - Admin Megga Bolão',
};

export default function AdminSorteiosPage() {
  const [activeTab, setActiveTab] = useState<'cadastrar' | 'editar'>('cadastrar');
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(() => new Set(initialSelection));
  const [drawDate, setDrawDate] = useState('2025-05-25');

  const toggleNumber = (value: number) => {
    setSelectedNumbers((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const sortedSelection = useMemo(() => Array.from(selectedNumbers.values()).sort((a, b) => a - b), [selectedNumbers]);

  const clearSelection = () => {
    setSelectedNumbers(new Set());
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Controle de sorteios</p>
          <h1 className="text-2xl font-semibold">Registrar números oficiais</h1>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('cadastrar')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              activeTab === 'cadastrar' ? 'bg-megga-purple text-megga-yellow' : 'text-white/60'
            }`}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editar')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              activeTab === 'editar' ? 'bg-megga-purple text-megga-yellow' : 'text-white/60'
            }`}
          >
            Editar / Apagar
          </button>
        </div>
      </header>
      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <h2 className="text-lg font-semibold text-white">Selecione os números sorteados</h2>
        <div className="grid grid-cols-5 gap-2 text-sm text-white/80">
          {numbers.map((number) => {
            const isSelected = selectedNumbers.has(number);
            return (
              <button
                key={number}
                type="button"
                onClick={() => toggleNumber(number)}
                className={`flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                  isSelected
                    ? 'border-megga-yellow/60 bg-megga-yellow/20 text-megga-yellow'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-megga-magenta/40 hover:text-white'
                }`}
              >
                {number.toString().padStart(2, '0')}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Números selecionados</p>
            <p className="mt-1 font-semibold tracking-[0.35em] text-white">{sortedSelection.join(' ') || 'Nenhum número'}</p>
          </div>
          <label className="flex flex-col gap-2 text-sm text-white/80 md:w-48">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Data do sorteio</span>
            <input
              type="date"
              value={drawDate}
              onChange={(event) => setDrawDate(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={clearSelection}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Limpar seleção
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {activeTab === 'cadastrar' ? 'Registrar sorteio' : 'Atualizar sorteio'}
          </button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <h2 className="text-lg font-semibold text-white">Bolões em andamento</h2>
          <ul className="space-y-2 text-sm text-white/80">
            {runningPools.map((pool) => (
              <li
                key={pool.code}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  pool.active ? 'border-megga-lime/40 bg-megga-lime/10 text-megga-lime' : 'border-white/10 bg-white/5 text-white/70'
                }`}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]">{pool.name}</p>
                  <p className="text-xs text-white/60">{pool.code}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.3em]">{pool.active ? 'Ativo' : 'Encerrado'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
          <h2 className="text-lg font-semibold text-white">Bolões cadastrados</h2>
          <ul className="space-y-2 text-sm text-white/80">
            {registeredPools.map((pool) => (
              <li key={pool.code} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{pool.name}</p>
                  <p className="text-xs text-white/60">{pool.code}</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded border border-white/30 bg-transparent accent-megga-magenta" defaultChecked />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
