import { Suspense } from "react";
import SuitPayClient from "./suitpay-client";

export default function SuitPayPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl bg-megga-navy/80 p-6 text-sm text-white/70 shadow-lg ring-1 ring-white/5">
          Carregando painel de saques...
        </div>
      }
    >
      <SuitPayClient />
    </Suspense>
  );
}
