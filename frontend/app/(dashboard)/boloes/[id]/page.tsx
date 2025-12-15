import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { BetsList } from "@/components/bets-list";
import { PlaceBetForm } from "@/components/place-bet-form";
import { TransparencyDownload } from "@/components/transparency-download";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getBolao(id: string) {
  try {
    const response = await api.get(`/boloes/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function BolaoPage({ params }: { params: { id: string } }) {
  const bolao = await getBolao(params.id);
  if (!bolao) {
    notFound();
  }

  const startsAt = new Date(bolao.startsAt);
  const isClosed = Boolean(bolao.closedAt);
  const latestResult = bolao.bolaoResults?.[0] ?? null;
  const prizeResults = latestResult?.prizes ?? [];
  const livePrizes = bolao.livePrizes ?? [];
  const senaPot = Number(bolao.senaPot ?? 0);
  const ticketPrice = Number(bolao.ticketPrice ?? 0);
  const hasTransparency = Boolean(bolao.transparency);
  const draws = bolao.draws ?? [];
  const drawsAsc = [...draws].sort(
    (a: any, b: any) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime(),
  );
  const firstDrawNumbers: number[] = Array.isArray(drawsAsc[0]?.numbers)
    ? drawsAsc[0].numbers.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
    : [];
  const winningNumbers: Array<number | string> = Array.from(
    new Set(
      (draws as any[])
        .flatMap((draw: any) => (Array.isArray(draw.numbers) ? draw.numbers : []))
        .map((value: any) => Number(value))
        .filter((value: number) => Number.isFinite(value)),
    ),
  );
  const totalCollected = (bolao.bets?.length ?? 0) * Number(bolao.ticketPrice ?? 0);
  const commissionPercent = Number(bolao.commissionPercent ?? 0);
  const netPool = totalCollected * (1 - commissionPercent / 100);
  const guaranteedPrize = Number(bolao.guaranteedPrize ?? 0);
  const prizePool = Math.max(guaranteedPrize, netPool);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-megga-navy/80 text-white shadow-lg ring-1 ring-white/5">
        <div className="flex items-center justify-between bg-megga-purple/80 px-6 py-4 text-[11px] uppercase tracking-[0.24em] text-white/70">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span
              className={`h-2.5 w-2.5 rounded-full shadow ${isClosed ? "bg-white/60" : "bg-megga-lime"}`}
              aria-hidden
            />{" "}
            {isClosed ? "Encerrado" : "Em andamento"}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">Bolao #{bolao.id.slice(0, 6)}</span>
        </div>
        <div className="space-y-6 px-6 pb-8 pt-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold leading-tight">{bolao.name}</h1>
              <p className="mt-1 text-sm text-white/60">
                Inicio {startsAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })} as{" "}
                {startsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Dias oficiais: terca, quinta e sabado</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-megga-magenta via-megga-purple to-megga-teal px-5 py-4 text-right shadow">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Valor da cota</p>
                <p className="mt-2 text-2xl font-semibold text-megga-yellow">R$ {formatCurrency(ticketPrice)}</p>
              </div>
              <div className="rounded-2xl bg-megga-lime/20 px-5 py-4 text-right shadow ring-1 ring-megga-lime/40">
                <p className="text-[11px] uppercase tracking-[0.3em] text-megga-lime/80">Premiacao total</p>
                <p className="mt-2 text-2xl font-semibold text-megga-lime">R$ {formatCurrency(prizePool)}</p>
              </div>
              {!isClosed && senaPot > 0 && (
                <div className="rounded-2xl bg-white/10 px-5 py-4 text-right shadow ring-1 ring-megga-purple/40">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Sena acumulada</p>
                  <p className="mt-2 text-2xl font-semibold text-megga-yellow">R$ {formatCurrency(senaPot)}</p>
                </div>
              )}
            </div>
          </header>
          <nav className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.24em] text-white/60">
            <a href="#apostar" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Apostar
            </a>
            <a href="#sorteios" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Sorteios
            </a>
            <a href="#premiacoes" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Premiacao
            </a>
            <a href="#apostadores" className="rounded-2xl bg-white/5 px-3 py-2 text-center text-white/70 hover:bg-megga-purple/30">
              Apostadores
            </a>
          </nav>
        </div>
      </section>

      <div id="apostar">
        <PlaceBetForm bolaoId={bolao.id} ticketPrice={ticketPrice} />
      </div>

      <section id="premiacoes" className="space-y-4 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <header>
          <h2 className="text-lg font-semibold">Premiacoes</h2>
          <p className="text-sm text-white/60">Distribuicao configurada para este bolao (valores calculados).</p>
        </header>
        <ul className="space-y-3">
          {bolao.prizes?.map((prize: any) => (
            <li key={prize.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-white">{prize.type}</p>
                <p className="text-xs text-white/60">Premiacao prevista</p>
              </div>
              <span className="text-sm font-semibold text-megga-yellow">
                {(() => {
                  const fixed = Number(prize.fixedValue ?? 0);
                  const pct = Number(prize.percentage ?? 0);
                  const value = fixed > 0 ? fixed : pct > 0 ? (pct / 100) * prizePool : 0;
                  return `R$ ${formatCurrency(value)}`;
                })()}
              </span>
            </li>
          ))}
          {(!bolao.prizes || bolao.prizes.length === 0) && (
            <li className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/60">
              Nenhuma premiacao configurada para este bolao.
            </li>
          )}
        </ul>
      </section>

      {!isClosed && livePrizes.length > 0 && (
        <section className="space-y-4 rounded-3xl bg-megga-surface/60 p-6 text-white shadow-lg ring-1 ring-white/5">
          <header>
            <h2 className="text-lg font-semibold">Premiacoes ja atingidas</h2>
            <p className="text-sm text-white/60">Premios liberados antes do encerramento.</p>
          </header>
          <div className="space-y-3">
            {livePrizes.map((prize: any) => (
              <div key={prize.prizeType} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">Premiacao</p>
                    <p className="text-base font-semibold">{prize.prizeType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total distribuido</p>
                    <p className="text-lg font-semibold text-megga-yellow">R$ {formatCurrency(Number(prize.totalValue ?? 0))}</p>
                  </div>
                </div>
                {prize.winners?.length ? (
                  <ul className="space-y-1 text-sm text-white/80">
                    {prize.winners.map((winner: any) => (
                      <li key={`${prize.prizeType}-${winner.bet?.id ?? winner.user?.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
                        <div>
                          <p className="font-medium">{winner.user?.fullName ?? "Apostador"}</p>
                          {winner.bet?.numbers && (
                            <p className="text-xs text-white/60">
                              Jogo: {winner.bet.numbers.map((n: number) => n.toString().padStart(2, "0")).join(" · ")} • {winner.hits} acertos
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-megga-lime">
                          R$ {formatCurrency(Number(winner.amount ?? 0))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/60">Nenhum ganhador nesta categoria.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {isClosed && prizeResults.length > 0 && (
        <section className="space-y-4 rounded-3xl bg-megga-surface/60 p-6 text-white shadow-lg ring-1 ring-white/5">
          <header>
            <h2 className="text-lg font-semibold">Resultados e ganhadores</h2>
            <p className="text-sm text-white/60">
              Bolao encerrado em {new Date(bolao.closedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}.
            </p>
          </header>
          <div className="space-y-3">
            {prizeResults.map((prize: any) => (
              <div key={prize.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">Premiacao</p>
                    <p className="text-base font-semibold">{prize.prizeType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total distribuido</p>
                    <p className="text-lg font-semibold text-megga-yellow">R$ {formatCurrency(Number(prize.totalValue ?? 0))}</p>
                  </div>
                </div>
                {prize.winners?.length ? (
                  <ul className="space-y-1 text-sm text-white/80">
                    {prize.winners.map((winner: any) => (
                      <li key={winner.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
                        <div>
                          <p className="font-medium">{winner.user?.fullName ?? "Apostador"}</p>
                          {winner.bet?.numbers && (
                            <p className="text-xs text-white/60">
                              Jogo: {winner.bet.numbers.map((n: number) => n.toString().padStart(2, "0")).join(" · ")}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-megga-lime">
                          R$ {formatCurrency(Number(winner.amount ?? 0))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/60">Nenhum ganhador nesta categoria.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="sorteios" className="space-y-3 rounded-3xl bg-megga-surface/60 p-6 text-white shadow-lg ring-1 ring-white/5">
        <header>
          <h2 className="text-lg font-semibold">Sorteios</h2>
          <p className="text-sm text-white/60">Resultados oficiais vinculados a este bolao.</p>
        </header>
        {draws.length === 0 ? (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
            Nenhum sorteio registrado ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {draws.map((draw: any) => (
              <li key={draw.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Data</p>
                    <p className="font-semibold">
                      {new Date(draw.drawnAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draw.numbers?.map((num: number) => (
                      <span
                        key={num}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-megga-magenta/25 text-xs font-semibold text-megga-yellow"
                      >
                        {num.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="apostadores" className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Lista de apostadores</h2>
          <TransparencyDownload bolaoId={bolao.id} hasFile={hasTransparency} />
        </header>
        <BetsList bets={(bolao.bets ?? []) as any[]} winningNumbers={winningNumbers} />
      </section>
    </div>
  );
}
