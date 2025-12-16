"use client";

import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";

function RegisterContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Crie sua conta</h2>
        <p className="text-sm text-white/70">
          Preencha seus dados e, se tiver, use um codigo de convite para vincular seu cadastro como afiliado.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-white/60">
        Ja tem conta?{" "}
        <Link href="/login" className="font-medium text-megga-yellow underline">
          Fazer login
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Carregando...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
