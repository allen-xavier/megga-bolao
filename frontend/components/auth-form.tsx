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
    <div className="space-y-4 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      {message && <p className="rounded-lg bg-slate-800/60 p-3 text-sm text-primary-200">{message}</p>}
      {step === 'credentials' ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitCredentials();
          }}
        >
          <label className="block text-left text-sm font-medium text-slate-200">
            Telefone (WhatsApp)
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="block text-left text-sm font-medium text-slate-200">
            Senha
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="text-sm text-slate-300">
            Insira o código de seis dígitos enviado para <strong>{phone}</strong>.
          </p>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-center text-2xl tracking-[0.3em] text-white focus:border-primary-400 focus:outline-none"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={6}
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
            <span className="ml-2">Confirmar código</span>
          </button>
        </form>
      )}
    </div>
  );
}
