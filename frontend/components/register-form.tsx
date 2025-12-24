'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

type RegisterPayload = {
  fullName: string;
  phone: string;
  cpf: string;
  email?: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  pixKey: string;
  password: string;
  referralCode?: string;
  acceptedTerms: boolean;
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl = searchParams?.get('ref') ?? '';

  const [form, setForm] = useState<RegisterPayload>({
    fullName: '',
    phone: '',
    cpf: '',
    email: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    pixKey: '',
    password: '',
    referralCode: '',
    acceptedTerms: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (refFromUrl) {
      setForm((prev) => ({ ...prev, referralCode: refFromUrl }));
    }
  }, [refFromUrl]);

  const handleChange = (field: keyof RegisterPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async () => {
    try {
      setLoading(true);
      setMessage(null);
      if (!form.fullName || !form.phone || !form.cpf || !form.password) {
        throw new Error('Preencha nome, telefone, CPF e senha.');
      }
      const payload: RegisterPayload = { ...form, acceptedTerms: true };
      if (!payload.referralCode) delete payload.referralCode;
      await api.post('/auth/register', payload);
      const result = await signIn('credentials', {
        phone: form.phone,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      await router.replace('/inicio');
      router.refresh();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? err?.message ?? 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-megga-surface/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      {message && <p className="rounded-2xl bg-megga-navy/70 p-3 text-sm text-megga-lime">{message}</p>}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-white/80">
            Nome completo
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.fullName}
              onChange={handleChange('fullName')}
              required
            />
          </label>
          <label className="text-sm text-white/80">
            Telefone (WhatsApp)
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.phone}
              onChange={handleChange('phone')}
              required
            />
          </label>
          <label className="text-sm text-white/80">
            CPF
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.cpf}
              onChange={handleChange('cpf')}
              required
            />
          </label>
          <label className="text-sm text-white/80">
            Email (opcional)
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.email ?? ''}
              onChange={handleChange('email')}
            />
          </label>
          <label className="text-sm text-white/80">
            CEP
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.cep}
              onChange={handleChange('cep')}
            />
          </label>
          <label className="text-sm text-white/80">
            Endereco
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.address}
              onChange={handleChange('address')}
            />
          </label>
          <label className="text-sm text-white/80">
            Cidade
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.city}
              onChange={handleChange('city')}
            />
          </label>
          <label className="text-sm text-white/80">
            Estado
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.state}
              onChange={handleChange('state')}
            />
          </label>
          <label className="text-sm text-white/80">
            Chave PIX
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.pixKey}
              onChange={handleChange('pixKey')}
            />
          </label>
          <label className="text-sm text-white/80">
            Código de convite (opcional)
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.referralCode ?? ''}
              onChange={handleChange('referralCode')}
              placeholder="Cole aqui o codigo ou use o link"
            />
          </label>
          <label className="text-sm text-white/80">
            Senha
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.password}
              onChange={handleChange('password')}
              required
            />
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-megga-yellow px-4 py-2 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}
