"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

interface PrizeOption {
  id: string;
  name: string;
  description: string;
  percentage: number;
  enabled: boolean;
}

interface DefaultPrizeConfig {
  id: string;
  percentage: number;
  enabled: boolean;
}

const basePrizes: PrizeOption[] = [
  { id: "pe-quente", name: "Pe Quente", description: "Ganha quem acertar 10 numeros primeiro", percentage: 40, enabled: true },
  { id: "pe-frio", name: "Pe Frio", description: "Ganha quem acertar menos numeros no final", percentage: 12, enabled: true },
  { id: "consolacao", name: "Consolacao", description: "Ganha quem ficar com 9 acertos no final", percentage: 8, enabled: true },
  { id: "sena", name: "Sena 1o Sorteio", description: "Ganha quem completar 6 acertos no primeiro sorteio", percentage: 10, enabled: true },
  { id: "ligeirinho", name: "Ligeirinho", description: "Ganha quem fizer mais acertos no primeiro sorteio", percentage: 5, enabled: true },
  { id: "oito", name: "8 acertos", description: "Ganha quem finalizar com 8 acertos", percentage: 8, enabled: true },
  { id: "indicacao", name: "Indique e Ganhe", description: "Comissao direta e indireta", percentage: 3, enabled: true },
];

const mapPrizeDefaults = (defaults?: DefaultPrizeConfig[]) => {
  if (!Array.isArray(defaults) || defaults.length === 0) {
    return basePrizes.map((prize) => ({ ...prize }));
  }
  const map = new Map(defaults.map((item) => [item.id, item]));
  return basePrizes.map((prize) => {
    const match = map.get(prize.id);
    if (!match) return { ...prize };
    const percentage = Number(match.percentage);
    return {
      ...prize,
      percentage: Number.isFinite(percentage) ? percentage : prize.percentage,
      enabled: Boolean(match.enabled),
    };
  });
};

export default function AdminConfiguracoesGeraisClient() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const [senaRollPercent, setSenaRollPercent] = useState(10);
  const [prizes, setPrizes] = useState<PrizeOption[]>(() => mapPrizeDefaults());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { totalPercentage, meggaTax } = useMemo(() => {
    const total = prizes.filter((prize) => prize.enabled).reduce((acc, prize) => acc + prize.percentage, 0);
    const tax = Math.max(0, 100 - total);
    return { totalPercentage: total, meggaTax: tax };
  }, [prizes]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !isAdmin) return;
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const { data } = await api.get("/admin/general-config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        setSenaRollPercent(Number(data?.senaRollPercent ?? 10));
        setPrizes(mapPrizeDefaults(data?.defaultPrizes as DefaultPrizeConfig[] | undefined));
      } catch (error: any) {
        if (cancelled) return;
        const backendMessage =
          error?.response?.data?.message ||
          error?.message ||
          (typeof error === "string" ? error : null);
        setMessage(backendMessage ? String(backendMessage) : "Erro ao carregar configuracoes.");
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, status, token]);

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

  const resetDefaults = () => {
    setSenaRollPercent(10);
    setPrizes(mapPrizeDefaults());
  };

  const save = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setMessage(null);
      await api.put(
        "/admin/general-config",
        {
          senaRollPercent,
          defaultPrizes: prizes.map(({ id, percentage, enabled }) => ({ id, percentage, enabled })),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage("Configuracoes salvas.");
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === "string" ? error : null);
      setMessage(backendMessage ? String(backendMessage) : "Erro ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faca login como administrador para acessar esta pagina.</p>
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
        <p className="text-sm text-megga-rose">Voce nao tem permissao para acessar esta pagina.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Administracao</p>
        <h1 className="text-2xl font-semibold">Configuracoes gerais</h1>
        <p className="text-sm text-white/70">
          Ajuste o percentual de acumulacao da Sena e os padroes de premiacao usados ao criar novos boloes.
        </p>
      </header>

      {message && <p className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-megga-lime">{message}</p>}

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Acumulacao da Sena</p>
          <h2 className="text-lg font-semibold">Percentual descontado</h2>
          <p className="text-sm text-white/70">
            Defina quanto do premio da Sena sera reservado para o proximo bolao quando nao houver ganhador.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Percentual de desconto</span>
            <input
              type="number"
              value={senaRollPercent}
              onChange={(event) => setSenaRollPercent(Number(event.target.value))}
              min={0}
              max={100}
              step={0.1}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
            <span className="text-xs text-white/60">Exemplo: 10 significa que 90% segue para o proximo bolao.</span>
          </label>
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Resumo</p>
            <p className="mt-2 text-base font-semibold text-megga-yellow">
              {Math.max(0, 100 - senaRollPercent)}% repassado para o proximo bolao
            </p>
            <p className="text-xs text-white/60">O restante cobre custos administrativos e operacionais.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Premiacoes padrao</p>
          <h2 className="text-xl font-semibold">Percentuais configuraveis</h2>
          <p className="text-sm text-white/60">Defina quais premios ficam ativos por padrao nos novos boloes.</p>
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
                    current.map((item) => (item.id === prize.id ? { ...item, percentage: Number(event.target.value) } : item)),
                  )
                }
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-megga-magenta focus:outline-none"
              />
            </label>
          ))}
        </div>
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Resumo financeiro</p>
          <p className="mt-2 text-base font-semibold text-megga-yellow">{totalPercentage}% destinado a premios</p>
          <p className="text-xs text-white/60">
            A Taxa Megga atual e de <span className="font-semibold text-megga-yellow">{meggaTax}%</span>. Ajuste os percentuais para
            manter o equilibrio do bolao.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Restaurar padrao
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-2xl bg-megga-yellow py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </div>
      </section>
    </div>
  );
}
