import { Suspense } from "react";
import TicketsAdminClient from "./tickets-client";

export default function AdminTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl bg-megga-navy/80 px-2 py-5 text-sm text-white/70 shadow-lg ring-1 ring-white/5 md:p-6">
          Carregando tickets...
        </div>
      }
    >
      <TicketsAdminClient />
    </Suspense>
  );
}
