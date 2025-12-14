'use client';

import { useState, type ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export interface UserProfile {
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
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const updateProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      await api.patch(`/users/${user.id}`, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
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
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        updateProfile();
      }}
    >
      {message && <p className="rounded-2xl bg-megga-surface/70 p-3 text-sm text-megga-lime">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/80">
          Nome completo
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.fullName}
            onChange={onChange('fullName')}
          />
        </label>
        <label className="text-sm text-white/80">
          E-mail
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.email ?? ''}
            onChange={onChange('email')}
          />
        </label>
        <label className="text-sm text-white/80">
          Telefone
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.phone}
            onChange={onChange('phone')}
          />
        </label>
        <label className="text-sm text-white/80">
          CPF
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.cpf}
            onChange={onChange('cpf')}
          />
        </label>
        <label className="text-sm text-white/80">
          CEP
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.cep}
            onChange={onChange('cep')}
          />
        </label>
        <label className="text-sm text-white/80">
          Endereço
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.address}
            onChange={onChange('address')}
          />
        </label>
        <label className="text-sm text-white/80">
          Cidade
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.city}
            onChange={onChange('city')}
          />
        </label>
        <label className="text-sm text-white/80">
          Estado
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.state}
            onChange={onChange('state')}
          />
        </label>
        <label className="text-sm text-white/80">
          Chave Pix
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.pixKey}
            onChange={onChange('pixKey')}
          />
        </label>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-megga-magenta to-megga-teal px-5 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
      >
        {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
        Salvar alterações
      </button>
    </form>
  );
}
