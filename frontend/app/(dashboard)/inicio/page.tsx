import { Suspense, type ReactNode } from "react";
import { DashboardBoloes } from "@/components/dashboard-boloes";
import { RankingHighlights } from "@/components/ranking-highlights";
import { WinnersBanner } from "@/components/winners-banner";

export const metadata = {
  title: "Inicio - Megga Bolao",
};

const LoadingCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-3xl bg-megga-navy/60 p-6 text-sm text-white/60 ring-1 ring-white/5">{children}</div>
);

export default function InicioPage() {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="space-y-[0.375rem] md:space-y-[0.45rem]">
        <WinnersBanner />
        <Suspense fallback={<LoadingCard>Carregando bolões...</LoadingCard>}>
          <DashboardBoloes />
        </Suspense>
      </div>
      <Suspense fallback={<LoadingCard>Carregando ranking...</LoadingCard>}>
        <RankingHighlights />
      </Suspense>
    </div>
  );
}
