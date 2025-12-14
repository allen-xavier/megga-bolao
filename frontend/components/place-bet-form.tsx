'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSWRConfig } from 'swr';
import { api } from '@/lib/api';

interface PlaceBetFormProps {
  bolaoId: string;
  ticketPrice: number;
}

const ALL_NUMBERS = Array.from({ length: 60 }, (_, index) => index + 1);

function generateRandomNumbers() {
  const pool = [...ALL_NUMBERS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 10).sort((a, b) => a - b);
}

export function PlaceBetForm({ bolaoId, ticketPrice }: PlaceBetFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: session, status } = useSession();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isSurprise, setIsSurprise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formattedTicketPrice = useMemo(
    () =>
      ticketPrice.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [ticketPrice],
  );

  const remainingNumbers = 10 - selectedNumbers.length;
  const canSubmit = (isSurprise || selectedNumbers.length === 10) && !isSubmitting;

  function toggleNumber(value: number) {
    setIsSurprise(false);
    setSuccessMessage(null);
    setSelectedNumbers((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value);
      }
      if (previous.length >= 10) {
        return previous;
      }
      return [...previous, value].sort((a, b) => a - b);
    });
  }

  function handleSurpresinha() {
    setIsSurprise(true);
    setError(null);
    setSuccessMessage(null);
    setSelectedNumbers(generateRandomNumbers());
  }

  function handleClear() {
    setIsSurprise(false);
    setError(null);
    setSuccessMessage(null);
    setSelectedNumbers([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (status !== 'authenticated' || !session?.user?.accessToken) {
        throw new Error('Faça login para apostar.');
      }

      const payload = isSurprise
        ? { isSurprise: true }
        : { numbers: selectedNumbers, isSurprise: false };
      const response = await api.post(`/boloes/${bolaoId}/bets`, payload, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      });

      setSuccessMessage('Aposta registrada com sucesso!');
      setIsSurprise(false);
      setSelectedNumbers([]);

      await mutate('/wallet/me');
      await mutate('/boloes');
      router.refresh();

      return response.data;
    } catch (submissionError: any) {
      const message =
        submissionError?.response?.data?.message ??
        'Não foi possível registrar a aposta. Tente novamente em instantes.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-5 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Faça sua aposta</h2>
          <p className="text-sm text-white/60">Selecione 10 números ou deixe que o sistema escolha por você.</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-megga-magenta via-megga-purple to-megga-teal px-4 py-3 text-right shadow">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Valor da cota</p>
          <p className="mt-1 text-xl font-semibold text-megga-yellow">R$ {formattedTicketPrice}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white/70">
            {isSurprise
              ? 'Surpresinha ativada. Geramos uma combinação exclusiva para você.'
              : `Selecione ${remainingNumbers} número${remainingNumbers === 1 ? '' : 's'} para completar sua aposta.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSurpresinha}
              className="inline-flex items-center gap-2 rounded-full bg-megga-purple/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition hover:opacity-90"
            >
              Surpresinha
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:bg-white/10"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-megga-surface/60 p-4">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
            {ALL_NUMBERS.map((number) => {
              const isSelected = selectedNumbers.includes(number);
              const isDisabled = !isSelected && !isSurprise && selectedNumbers.length >= 10;
              return (
                <button
                  key={number}
                  type="button"
                  disabled={isSurprise || isDisabled}
                  onClick={() => toggleNumber(number)}
                  className={`flex h-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isSelected
                      ? 'border-megga-lime bg-megga-lime/20 text-megga-lime'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                  } ${isSurprise ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {number.toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-white/40">Números selecionados</span>
            <div className="flex flex-wrap gap-1">
              {(isSurprise ? selectedNumbers : selectedNumbers).map((number) => (
                <span
                  key={`selected-${number}`}
                  className="inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-full bg-white/10 px-2 text-[11px] font-semibold text-megga-yellow"
                >
                  {number.toString().padStart(2, '0')}
                </span>
              ))}
              {selectedNumbers.length === 0 && (
                <span className="text-xs text-white/50">Nenhum número escolhido ainda.</span>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-megga-rose">{error}</p>}
        {successMessage && <p className="text-sm text-megga-lime">{successMessage}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-3 text-sm font-semibold text-white shadow transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Registrando aposta...' : 'Confirmar aposta'}
        </button>
      </form>
    </section>
  );
}
