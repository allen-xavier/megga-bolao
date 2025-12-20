'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export function AuthForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitLogin = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const result = await signIn('credentials', {
        phone,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error(result?.error ?? 'Credenciais invalidas');
      }
      await router.replace('/inicio');
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message ?? 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-megga-surface/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      {message && <p className="rounded-2xl bg-megga-navy/70 p-3 text-sm text-megga-lime">{message}</p>}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submitLogin();
        }}
      >
        <label className="block text-left text-sm font-medium text-white/80">
          Telefone (WhatsApp)
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="block text-left text-sm font-medium text-white/80">
          Senha
          <input
            type="password"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Entrar'}
        </button>
      </form>
    </div>
  );
}