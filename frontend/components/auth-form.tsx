'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

export function AuthForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const submitCredentials = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await api.post('/auth/login', { phone, password });
      if (response.data?.tokens) {
        setStep('code');
        setMessage('Enviamos um código de confirmação para o seu WhatsApp.');
        await api.post('/notifications/whatsapp-code', {
          phone,
          code: Math.floor(100000 + Math.random() * 900000).toString(),
        });
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const result = await signIn('credentials', {
        phone,
        password,
        code,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error(result?.error ?? 'Falha na confirmação');
      }
      router.push('/dashboard');
    } catch (error: any) {
      setMessage(error?.message ?? 'Erro ao confirmar código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-megga-surface/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      {message && <p className="rounded-2xl bg-megga-navy/70 p-3 text-sm text-megga-lime">{message}</p>}
      {step === 'credentials' ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitCredentials();
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
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            confirmCode();
          }}
        >
          <p className="text-sm text-white/70">
            Insira o código de seis dígitos enviado para <strong>{phone}</strong>.
          </p>
          <input
            className="w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-3 text-center text-2xl tracking-[0.3em] text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={6}
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-megga-teal to-megga-lime px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
            <span>Confirmar código</span>
          </button>
        </form>
      )}
    </div>
  );
}
