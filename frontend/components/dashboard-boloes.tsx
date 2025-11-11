'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Bolao {
  id: string;
  name: string;
  startsAt: string;
  promotional: boolean;
  ticketPrice: string;
}

const fetcher = (url: string) => api.get(url).then((response) => response.data);

export function DashboardBoloes() {
  const { data, isLoading } = useSWR<Bolao[]>('/boloes', fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div className="rounded-2xl bg-slate-900/60 p-6">Carregando bolões...</div>;
  }

  return (
    <section className="space-y-4 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Bolões em andamento</h2>
        <Link href="/boloes/criar" className="text-sm text-primary-300 hover:underline">
          Criar bolão
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((bolao) => (
          <article key={bolao.id} className="flex flex-col gap-2 rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/5">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{new Date(bolao.startsAt).toLocaleString('pt-BR')}</span>
              {bolao.promotional && <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-xs text-primary-200">Promo</span>}
            </div>
            <h3 className="text-lg font-semibold text-white">{bolao.name}</h3>
            <p className="text-sm text-slate-400">Cota: R$ {Number(bolao.ticketPrice).toFixed(2)}</p>
            <Link href={`/boloes/${bolao.id}`} className="text-sm text-primary-300 hover:underline">
              Ver detalhes
            </Link>
          </article>
        ))}
        {data?.length === 0 && <p className="text-sm text-slate-400">Nenhum bolão ativo no momento.</p>}
      </div>
    </section>
  );
}
