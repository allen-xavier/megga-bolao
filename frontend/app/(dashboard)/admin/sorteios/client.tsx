'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';

const formatInputDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const toIsoFromInput = (value: string) => {
  const sanitized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${sanitized}-03:00`).toISOString();
};

export default function AdminSorteiosClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [drawDate, setDrawDate] = useState(() => formatInputDate(new Date()));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const toggleNumber = (number: number) => {
    setSelectedNumbers((current) => {
      const next = new Set(current);
      if (next.has(number)) {
        next.delete(number);
      } else if (next.size < 6) {
        next.add(number);
      }
      return next;
    });
  };

  const formattedNumbers = useMemo(() => Array.from(selectedNumbers).sort((a, b) => a - b), [selectedNumbers]);

  const { data: draws, isLoading, mutate } = useSWR(
    ['/draws', token, from, to],
    async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await api.get('/draws', {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data as Array<{
        id: string;
        drawnAt: string;
        numbers: number[];
        bolao?: { id: string; name: string } | null;
      }>;
    },
    { revalidateOnFocus: false },
  );

  const registerDraw = async () => {
    if (!token) {
      setMessage('Faça login como administrador para registrar sorteio.');
      return;
    }
    if (formattedNumbers.length !== 6) {
      setMessage('Selecione exatamente 6 números.');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await api.post(
        '/draws',
        {
          drawnAt: toIsoFromInput(drawDate),
          numbers: formattedNumbers,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedNumbers(new Set());
      mutate();
      setMessage('Sorteio registrado e aplicado ao bolão em andamento.');
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Não foi possível registrar o sorteio.';
      setMessage(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteDraw = async (id: string) => {
    if (!token) {
      setMessage('Faça login como administrador para excluir sorteio.');
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      await api.delete(`/draws/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate();
      setMessage('Sorteio excluído.');
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Não foi possível excluir o sorteio.';
      setMessage(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestão de sorteios</p>
        <h1 className="text-2xl font-semibold">Registrar resultado oficial</h1>
        <p className="text-sm text-white/70">Informe os números sorteados e aplique imediatamente aos bolões ativos.</p>
      </header>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 shadow-lg ring-1 ring-white/5">
        {message && <p className="rounded-2xl bg-megga-surface/70 p-3 text-sm text-megga-lime">{message}</p>}
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
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">números selecionados</p>
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
            <p className="text-xs text-white/60">Selecione exatamente 6 números.</p>
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
            onClick={() => setSelectedNumbers(new Set())}
            className="flex-1 rounded-2xl bg-[#f7b500] py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
          >
            Limpar seleção
          </button>
          <button
            type="button"
            onClick={registerDraw}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[#1ea7a4] py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'Registrar sorteio'}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 text-white shadow-lg ring-1 ring-white/5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Sorteios cadastrados</p>
            <h2 className="text-lg font-semibold">Histórico</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/80">
            <label className="flex items-center gap-1">
              De:
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-white focus:border-megga-magenta focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1">
              Até:
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-white focus:border-megga-magenta focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => mutate()}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-megga-magenta hover:text-megga-yellow"
            >
              Filtrar
            </button>
          </div>
        </header>

        {isLoading && <p className="text-sm text-white/70">Carregando sorteios...</p>}
        {!isLoading && (!draws || draws.length === 0) && (
          <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">Nenhum sorteio encontrado.</p>
        )}
        <ul className="space-y-3">
          {draws?.map((draw) => (
            <li key={draw.id} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Data</p>
                  <p className="font-semibold">
                    {new Date(draw.drawnAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p className="text-xs text-white/60">
                    bolão: {draw.bolao?.name ? `${draw.bolao.name} (${draw.bolao.id.slice(0, 6)})` : 'Não vinculado'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draw.numbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-megga-magenta/25 text-xs font-semibold text-megga-yellow"
                    >
                      {num.toString().padStart(2, '0')}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => deleteDraw(draw.id)}
                  className="rounded-xl border border-megga-rose/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-megga-rose transition hover:border-megga-rose hover:text-megga-rose"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}














