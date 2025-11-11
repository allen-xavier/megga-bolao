'use client';

import { useState, type ChangeEvent } from 'react';
import { api } from '@/lib/api';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  pixKey: string;
  email?: string | null;
}

export function ProfileForm({ user }: { user: UserProfile }) {
  const [form, setForm] = useState<UserProfile>(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      await api.patch(`/users/${user.id}`, form);
      setMessage('Dados atualizados com sucesso!');
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (key: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        updateProfile();
      }}
    >
      {message && <p className="rounded-lg bg-slate-800/60 p-3 text-sm text-primary-200">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-200">
          Nome completo
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.fullName}
            onChange={onChange('fullName')}
          />
        </label>
        <label className="text-sm text-slate-200">
          E-mail
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.email ?? ''}
            onChange={onChange('email')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Telefone
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.phone}
            onChange={onChange('phone')}
          />
        </label>
        <label className="text-sm text-slate-200">
          CPF
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.cpf}
            onChange={onChange('cpf')}
          />
        </label>
        <label className="text-sm text-slate-200">
          CEP
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.cep}
            onChange={onChange('cep')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Endereço
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.address}
            onChange={onChange('address')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Cidade
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.city}
            onChange={onChange('city')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Estado
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.state}
            onChange={onChange('state')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Chave Pix
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
            value={form.pixKey}
            onChange={onChange('pixKey')}
          />
        </label>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
      >
        {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
        Salvar alterações
      </button>
    </form>
  );
}
