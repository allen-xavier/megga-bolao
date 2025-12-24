import { Suspense } from "react";
import SaquesClient from "./saques-client";

export default function SaquesPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl bg-megga-navy/80 p-6 text-sm text-white/70 shadow-lg ring-1 ring-white/5">
          Carregando aprovações de saque...
        </div>
      }
    >
      <SaquesClient />
    </Suspense>
  );
}
