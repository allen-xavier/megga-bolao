"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  { id: "pe-quente", name: "Pé Quente", description: "Ganha quem acertar 10 números primeiro", percentage: 40, enabled: true },
  { id: "pe-frio", name: "Pé Frio", description: "Ganha quem acertar menos números no final", percentage: 12, enabled: true },
  { id: "consolacao", name: "Consolação", description: "Ganha quem ficar com 9 acertos no final", percentage: 8, enabled: true },
  { id: "sena", name: "Sena 1º Sorteio", description: "Ganha quem completar 6 acertos no primeiro sorteio", percentage: 10, enabled: true },
  { id: "ligeirinho", name: "Ligeirinho", description: "Ganha quem fizer mais acertos no primeiro sorteio", percentage: 5, enabled: true },
  { id: "oito", name: "8 acertos", description: "Ganha quem finalizar com 8 acertos", percentage: 8, enabled: true },
  { id: "indicacao", name: "Indique e Ganhe", description: "Comissão direta e indireta", percentage: 3, enabled: true },
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

const prizeTypeMap: Record<string, string> = {
  "pe-quente": "PE_QUENTE",
  "pe-frio": "PE_FRIO",
  consolacao: "CONSOLACAO",
  sena: "SENA_PRIMEIRO",
  ligeirinho: "LIGEIRINHO",
  oito: "OITO_ACERTOS",
  indicacao: "INDICACAO_DIRETA",
};

const reversePrizeTypeMap: Record<string, string> = Object.fromEntries(
  Object.entries(prizeTypeMap).map(([k, v]) => [v, k]),
);

const formatInputDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const toIsoFromInput = (value: string) => {
  const sanitized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${sanitized}-03:00`).toISOString();
};

const toNumber = (value: string | number) => {
  if (typeof value === "number") return value;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function CreatebolãoClient() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";
  const searchParams = useSearchParams();
  const router = useRouter();
  const bolãoId = searchParams.get("id");

  const [defaultPrizes, setDefaultPrizes] = useState<PrizeOption[]>(() => mapPrizeDefaults());
  const [prizes, setPrizes] = useState<PrizeOption[]>(() => mapPrizeDefaults());
  const [guaranteedPrize, setGuaranteedPrize] = useState("10000,00");
  const [name, setName] = useState("Bolão promocional");
  const [startsAt, setStartsAt] = useState(() => formatInputDate(new Date())); // data/hora atual SP
  const [ticketPrice, setTicketPrice] = useState(35);
  const [minimumQuotas, setMinimumQuotas] = useState(500);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  const { totalPercentage, meggaTax } = useMemo(() => {
    const total = prizes.filter((prize) => prize.enabled).reduce((acc, prize) => acc + prize.percentage, 0);
    const tax = Math.max(0, 100 - total);
    return { totalPercentage: total, meggaTax: tax };
  }, [prizes]);

  useEffect(() => {
    if (!bolãoId || status !== "authenticated" || !session?.user?.accessToken) return;

    const loadbolão = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/boloes/${bolãoId}`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });

        setName(data.name ?? "");
        setGuaranteedPrize(String(data.guaranteedPrize ?? ""));
        setTicketPrice(Number(data.ticketPrice ?? 0));
        setMinimumQuotas(Number(data.minimumQuotas ?? 0));
        setStartsAt(formatInputDate(new Date(data.startsAt)));

        const prizesFromApi: PrizeOption[] = basePrizes.map((p) => {
          const match = (data.prizes ?? []).find((pr: any) => reversePrizeTypeMap[pr.type] === p.id);
          return match
            ? { ...p, enabled: true, percentage: Number(match.percentage ?? p.percentage) }
            : { ...p, enabled: false };
        });
        setPrizes(prizesFromApi);
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message ||
          error?.message ||
          (typeof error === "string" ? error : null);
        setMessage(backendMessage ? String(backendMessage) : "Erro ao carregar bolão.");
      } finally {
        setLoading(false);
      }
    };

    loadbolão();
  }, [bolãoId, session?.user?.accessToken, status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.accessToken || !isAdmin) return;
    if (defaultsLoaded) return;
    let cancelled = false;

    const loadDefaults = async () => {
      try {
        const { data } = await api.get("/admin/general-config", {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });
        if (cancelled) return;
        const mapped = mapPrizeDefaults(data?.defaultPrizes as DefaultPrizeConfig[] | undefined);
        setDefaultPrizes(mapped);
        if (!bolãoId) {
          setPrizes(mapped);
        }
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message ||
          error?.message ||
          (typeof error === "string" ? error : null);
        setMessage(backendMessage ? String(backendMessage) : "Erro ao carregar padrao de premiacoes.");
      } finally {
        if (!cancelled) setDefaultsLoaded(true);
      }
    };

    loadDefaults();

    return () => {
      cancelled = true;
    };
  }, [bolãoId, defaultsLoaded, isAdmin, session?.user?.accessToken, status]);

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
    setPrizes(defaultPrizes.map((prize) => ({ ...prize })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      if (status !== "authenticated" || !session?.user?.accessToken) {
        throw new Error("Faça login como administrador para salvar.");
      }

      const payload = {
        name,
        startsAt: toIsoFromInput(startsAt),
        ticketPrice: Number(ticketPrice),
        minimumQuotas: Number(minimumQuotas),
        guaranteedPrize: toNumber(guaranteedPrize),
        commissionPercent: meggaTax,
        promotional: true,
        prizes: prizes
          .filter((p) => p.enabled)
          .map((p) => ({
            type: prizeTypeMap[p.id] ?? "CONSOLACAO",
            percentage: p.percentage,
          })),
      };

      if (bolãoId) {
        await api.put(`/boloes/${bolãoId}`, payload, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        });
        setMessage("Bolão atualizado com sucesso.");
      } else {
        await api.post("/boloes", payload, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        });
        setMessage("Bolão criado com sucesso.");
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === "string" ? error : null);
      setMessage(backendMessage ? String(backendMessage) : "Erro ao salvar bolão.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bolãoId) {
      setMessage("Nenhum bolão selecionado para excluir.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir este bolão?")) {
      return;
    }
    try {
      setDeleting(true);
      setMessage(null);

      if (status !== "authenticated" || !session?.user?.accessToken) {
        throw new Error("Faça login como administrador para excluir.");
      }

      await api.delete(`/boloes/${bolãoId}`, {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });
      setMessage("Bolão excluído com sucesso.");
      router.push("/admin/boloes");
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === "string" ? error : null);
      setMessage(backendMessage ? String(backendMessage) : "Erro ao excluir bolão.");
    } finally {
      setDeleting(false);
    }
  };


  if (status !== "authenticated") {
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{bolãoId ? "Editar bolão" : "Novo bolão"}</p>
          <h1 className="text-2xl font-semibold">{bolãoId ? "Editar bolão" : "Criar bolão promocional"}</h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </header>

      {message && <p className="rounded-2xl bg-megga-navy/70 p-3 text-sm text-megga-lime">{message}</p>}
      {loading && <p className="rounded-2xl bg-megga-navy/70 p-3 text-sm text-white/70">Carregando dados do bolão...</p>}

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Nome do bolão</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
            <span className="text-xs text-white/60">Valor mínimo garantido. So entra na conta apos superar o arrecadado.</span>
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Valor da cota</span>
            <input
              type="number"
              value={ticketPrice}
              onChange={(event) => setTicketPrice(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Mínimo de cotas</span>
            <input
              type="number"
              value={minimumQuotas}
              onChange={(event) => setMinimumQuotas(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Data de início</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
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
                    current.map((item) => (item.id === prize.id ? { ...item, percentage: Number(event.target.value) } : item)),
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
            className="flex-1 rounded-2xl bg-[#f7b500] py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
          >
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-2xl bg-[#1ea7a4] py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
        {bolãoId && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-2xl border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir bolão"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
