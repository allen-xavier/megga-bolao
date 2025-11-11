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
}

export function BetsList({ bets }: { bets: Bet[] }) {
  if (bets.length === 0) {
    return <p className="text-sm text-slate-400">Nenhuma aposta registrada ainda.</p>;
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {bets.map((bet) => (
        <li key={bet.id} className="space-y-2 rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{new Date(bet.createdAt).toLocaleString('pt-BR')}</span>
            {bet.isSurprise && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Surpresinha</span>}
          </div>
          <p className="font-mono text-sm tracking-widest text-white">{bet.numbers?.join(' • ')}</p>
          <p className="text-xs text-slate-400">
            {bet.user?.fullName?.split(' ')[0]} - {bet.user?.city}/{bet.user?.state}
          </p>
        </li>
      ))}
    </ul>
  );
}
