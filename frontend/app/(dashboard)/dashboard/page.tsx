import { Suspense, type ReactNode } from "react";
import { DashboardBoloes } from "@/components/dashboard-boloes";
import { RankingHighlights } from "@/components/ranking-highlights";
import { WinnersBanner } from "@/components/winners-banner";

export const metadata = {
  title: "Dashboard - Megga Bolão",
};

const LoadingCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-3xl bg-[#0f1117] p-6 text-sm text-white/70 ring-1 ring-white/5 shadow-lg">
    {children}
  </div>
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WinnersBanner />
      <Suspense fallback={<LoadingCard>Carregando bolões...</LoadingCard>}>
        <DashboardBoloes />
      </Suspense>
      <Suspense fallback={<LoadingCard>Carregando ranking...</LoadingCard>}>
        <RankingHighlights />
      </Suspense>
    </div>
  );
}
