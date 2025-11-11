import { Suspense } from 'react';
import { DashboardBoloes } from '@/components/dashboard-boloes';
import { WalletSummary } from '@/components/wallet-summary';
import { RankingHighlights } from '@/components/ranking-highlights';

export const metadata = {
  title: 'Dashboard - Megga Bolão',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="rounded-2xl bg-slate-900/60 p-6">Carregando dashboard...</div>}>
        <WalletSummary />
      </Suspense>
      <Suspense fallback={<div className="rounded-2xl bg-slate-900/60 p-6">Carregando bolões...</div>}>
        <DashboardBoloes />
      </Suspense>
      <Suspense fallback={<div className="rounded-2xl bg-slate-900/60 p-6">Carregando ranking...</div>}>
        <RankingHighlights />
      </Suspense>
    </div>
  );
}
