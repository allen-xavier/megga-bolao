'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminAfiliadosClient() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPERVISOR';

  const { data, mutate } = useSWR(
    token && isAdmin ? ['/admin/affiliate-config', token] : null,
    ([url, t]) => api.get(url, { headers: { Authorization: `Bearer ${t}` } }).then((res) => res.data),
    { revalidateOnFocus: false },
  );

  const [firstCommission, setFirstCommission] = useState(2);
  const [secondCommission, setSecondCommission] = useState(1);
  const [firstBetBonus, setFirstBetBonus] = useState(0);
  const [firstBetBonusEnabled, setFirstBetBonusEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setFirstCommission(Number(data.firstLevelPercent ?? 0));
      setSecondCommission(Number(data.secondLevelPercent ?? 0));
      setFirstBetBonus(Number(data.firstBetBonus ?? 0));
      setFirstBetBonusEnabled(Boolean(data.firstBetBonusEnabled));
    }
  }, [data]);

  const totalCommission = useMemo(() => firstCommission + secondCommission, [firstCommission, secondCommission]);

  const resetValues = () => {
    setFirstCommission(2);
    setSecondCommission(1);
    setFirstBetBonus(0);
    setFirstBetBonusEnabled(false);
  };

  if (status !== 'authenticated') {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faça login como administrador para acessar esta página.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await api.put(
        '/admin/affiliate-config',
        {
          firstLevelPercent: firstCommission,
          secondLevelPercent: secondCommission,
          firstBetBonus,
          firstBetBonusEnabled,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      await mutate();
      setMessage('Configuração salva.');
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
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
      {message && <p className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-megga-lime">{message}</p>}
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
          <label className="flex items-center gap-3 text-sm text-white/80 md:col-span-2">
            <input
              type="checkbox"
              checked={firstBetBonusEnabled}
              onChange={(e) => setFirstBetBonusEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-white/20 bg-white/5 text-megga-magenta focus:ring-megga-magenta"
            />
            <span>Ativar bônus na primeira aposta do indicado (apenas nível 1)</span>
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
            onClick={save}
            className="flex-1 rounded-2xl bg-megga-yellow py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </section>
    </div>
  );
}
