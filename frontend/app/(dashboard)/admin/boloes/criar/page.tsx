import { Suspense } from "react";
import CreateBolaoClient from "./client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-white/70">Carregando...</div>}>
      <CreateBolaoClient />
    </Suspense>
  );
}
