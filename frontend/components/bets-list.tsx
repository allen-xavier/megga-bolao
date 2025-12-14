'use client';

interface Bet {
  id: string;
  numbers: number[];
  isSurprise: boolean;
  createdAt: string;
  user?: {
    fullName: string;
    city?: string;
    state?: string;
  };
  hits?: number;
}

function formatLocation(bet: Bet) {
  if (!bet.user?.city || !bet.user?.state) {
    return 'Cidade não informada';
  }
  return `${bet.user.city} - ${bet.user.state}`;
}

export function BetsList({ bets, winningNumbers = [] }: { bets: Bet[]; winningNumbers?: number[] }) {
  if (bets.length === 0) {
    return <p className="text-sm text-white/60">Nenhuma aposta registrada ainda.</p>;
  }

  const winningSet = new Set(winningNumbers);

  return (
    <div className="overflow-hidden rounded-3xl bg-megga-navy/80 text-white shadow-lg ring-1 ring-white/5">
      <header className="grid grid-cols-[auto,1fr,auto] items-center gap-3 bg-megga-purple/70 px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-white/70">
        <span>Nº</span>
        <span>Apostador</span>
        <span>Jogos</span>
      </header>
      <ul className="divide-y divide-white/5">
        {bets.map((bet, index) => (
          <li key={bet.id} className="grid grid-cols-[auto,1fr,auto] gap-3 px-5 py-4 text-sm">
            <span className="font-semibold text-white/80">{String(index + 1).padStart(4, '0')}</span>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-white/90">{bet.user?.fullName?.split(' ')[0] ?? 'Apostador'}</p>
                <p className="text-xs text-white/50">{formatLocation(bet)}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {bet.numbers?.map((number, idx) => {
                  const isHit = winningSet.size > 0 && winningSet.has(number);
                  return (
                    <span
                      key={`${bet.id}-${number}-${idx}`}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                        isHit ? 'bg-megga-lime/70 text-megga-navy' : 'bg-white/10 text-megga-yellow'
                      }`}
                    >
                      {number.toString().padStart(2, '0')}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between text-right text-xs text-white/60">
              <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em]">
                {bet.isSurprise ? 'Surpresinha' : 'Manual'}
              </span>
              <span>{new Date(bet.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
