'use client';

import { useState, type ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type PixKeyType = 'document' | 'phoneNumber' | 'email' | 'randomKey' | 'paymentCode';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement?: string;
  city: string;
  state: string;
  pixKey: string;
  pixKeyType?: PixKeyType;
  email?: string | null;
}

const PIX_KEY_OPTIONS: Array<{ value: PixKeyType; label: string }> = [
  { value: 'document', label: 'CPF/CNPJ' },
  { value: 'phoneNumber', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'randomKey', label: 'Chave aleatoria' },
];

const resolvePixKeyType = (value?: string | null) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 'document';
  if (['document', 'cpf', 'cnpj', 'cpf/cnpj', 'cpfcnpj', 'cpf_cnpj'].includes(raw)) {
    return 'document';
  }
  if (['phonenumber', 'phone', 'telefone', 'tel', 'celular', 'mobile'].includes(raw)) {
    return 'phoneNumber';
  }
  if (raw === 'email') return 'email';
  if (['randomkey', 'random', 'aleatoria', 'chavealeatoria', 'chave_aleatoria'].includes(raw)) {
    return 'randomKey';
  }
  return 'document';
};

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const normalizePixPhone = (value: string) => {
  let digits = normalizeDigits(value);
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  if (digits.length === 10) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }
  return digits;
};

const isValidCpf = (value: string) => {
  const cpf = normalizeDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(cpf[10]);
};

const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

const isValidPhone = (value: string) => {
  const digits = normalizeDigits(value);
  return digits.length >= 10 && digits.length <= 14;
};

const validatePixKey = (
  type: PixKeyType,
  key: string,
  context: { cpf: string; email?: string; phone: string },
) => {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, message: 'Chave Pix obrigatoria.' };
  }

  if (type === 'document') {
    const digits = normalizeDigits(trimmed);
    if (digits.length !== 11 && digits.length !== 14) {
      return { valid: false, message: 'Chave Pix CPF/CNPJ invalida.' };
    }
    if (digits.length === 11 && !isValidCpf(digits)) {
      return { valid: false, message: 'CPF da chave Pix invalido.' };
    }
    const cpf = normalizeDigits(context.cpf);
    if (cpf && digits !== cpf) {
      return { valid: false, message: 'CPF da chave Pix deve ser o mesmo do cadastro.' };
    }
    return { valid: true, value: digits };
  }

  if (type === 'phoneNumber') {
    const digits = normalizePixPhone(trimmed);
    if (digits.length !== 11) {
      return { valid: false, message: 'Telefone da chave Pix invalido.' };
    }
    return { valid: true, value: digits };
  }

  if (type === 'email') {
    const email = trimmed.toLowerCase();
    if (!isValidEmail(email)) {
      return { valid: false, message: 'Email da chave Pix invalido.' };
    }
    return { valid: true, value: email };
  }

  if (type === 'randomKey') {
    if (!/^[0-9a-fA-F-]{32,36}$/.test(trimmed)) {
      return { valid: false, message: 'Chave aleatoria Pix invalida.' };
    }
    return { valid: true, value: trimmed };
  }

  if (type === 'paymentCode') {
    if (trimmed.length < 6) {
      return { valid: false, message: 'Codigo Pix invalido.' };
    }
    return { valid: true, value: trimmed };
  }

  return { valid: false, message: 'Tipo de chave Pix invalido.' };
};

export function ProfileForm({ user }: { user: UserProfile }) {
  const [form, setForm] = useState<UserProfile>({
    id: user.id,
    fullName: user.fullName ?? (user as any).name ?? '',
    phone: user.phone ?? '',
    cpf: user.cpf ?? '',
    cep: user.cep ?? '',
    address: user.address ?? '',
    addressNumber: (user as any).addressNumber ?? '',
    addressComplement: (user as any).addressComplement ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    pixKey: user.pixKey ?? '',
    pixKeyType: resolvePixKeyType(user.pixKeyType ?? 'document'),
    email: user.email ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { data: session, update: updateSession } = useSession();
  const role = session?.user?.role;
  const canEditLockedFields = role === 'ADMIN' || role === 'SUPERVISOR';
  const token = session?.user?.accessToken;
  const userId = user.id ?? (session?.user as any)?.id ?? (session?.user as any)?.sub;

  const fetchCepData = async (cep: string) => {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
      throw new Error('Nao foi possivel consultar o CEP.');
    }
    const data = (await response.json()) as {
      erro?: boolean;
      logradouro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) {
      throw new Error('CEP nao encontrado.');
    }
    return data;
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      if (!userId) {
        setMessage("Não foi possível identificar o usuário.");
        setLoading(false);
        return;
      }
      const normalizedCpf = normalizeDigits(form.cpf);
      if (!isValidCpf(normalizedCpf)) {
        throw new Error('CPF invalido.');
      }
      const normalizedCep = normalizeDigits(form.cep);
      if (!normalizedCep || normalizedCep.length !== 8) {
        throw new Error('CEP invalido.');
      }
      if (!form.addressNumber?.trim()) {
        throw new Error('Numero do endereco obrigatorio.');
      }
      const normalizedEmail = form.email ? form.email.trim().toLowerCase() : undefined;
      if (normalizedEmail && !isValidEmail(normalizedEmail)) {
        throw new Error('Email invalido.');
      }
      const pixKeyType = form.pixKeyType ?? 'document';
      const pixKeyResult = validatePixKey(pixKeyType, form.pixKey, {
        cpf: normalizedCpf,
        email: normalizedEmail,
        phone: form.phone,
      });
      if (!pixKeyResult.valid) {
        throw new Error(pixKeyResult.message ?? 'Chave Pix invalida.');
      }
      const payload = {
        fullName: form.fullName.toUpperCase(),
        phone: form.phone,
        cpf: normalizedCpf,
        cep: normalizedCep,
        address: form.address.toUpperCase(),
        addressNumber: form.addressNumber.toUpperCase(),
        addressComplement: form.addressComplement ? form.addressComplement.toUpperCase() : undefined,
        city: form.city.toUpperCase(),
        state: form.state.toUpperCase(),
        pixKey: pixKeyResult.value ?? form.pixKey,
        pixKeyType,
        email: normalizedEmail,
      };
      await api.patch(`/users/${userId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await updateSession?.(payload);
      setMessage('Dados atualizados com sucesso!');
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const onChange =
    (key: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((current) => {
        let nextValue = value;
        if (key === 'fullName' || key === 'address' || key === 'addressNumber' || key === 'addressComplement' || key === 'city' || key === 'state') {
          nextValue = value.toUpperCase();
        } else if (key === 'email') {
          nextValue = value.toLowerCase();
        } else if (key === 'cpf' || key === 'cep') {
          nextValue = normalizeDigits(value);
        } else if (key === 'pixKey' && current.pixKeyType === 'document') {
          nextValue = normalizeDigits(value);
        } else if (key === 'pixKey' && current.pixKeyType === 'phoneNumber') {
          nextValue = normalizeDigits(value);
        }

        const nextState: UserProfile = { ...current, [key]: nextValue };
        if (key === 'cpf' && current.pixKeyType === 'document') {
          nextState.pixKey = normalizeDigits(nextValue as string);
        }
        if (key === 'pixKeyType') {
          const nextType = nextValue as PixKeyType;
          if (nextType === 'document') {
            nextState.pixKey = normalizeDigits(current.cpf);
          } else if (nextType === 'phoneNumber') {
            nextState.pixKey = normalizePixPhone(current.pixKey);
          }
        }
        return nextState;
      });
    };

  const handleCepBlur = async () => {
    const cep = normalizeDigits(form.cep);
    if (!cep) return;
    if (cep.length !== 8) {
      setMessage('CEP invalido.');
      return;
    }
    try {
      const data = await fetchCepData(cep);
      setForm((prev) => ({
        ...prev,
        cep,
        address: data.logradouro ?? prev.address,
        city: data.localidade ?? prev.city,
        state: data.uf ?? prev.state,
      }));
    } catch (err: any) {
      setMessage(err?.message ?? 'Nao foi possivel consultar o CEP.');
    }
  };

  const checkAvailability = async (params: { cpf?: string; email?: string; phone?: string }) => {
    try {
      await api.get('/auth/check', {
        params: { ...params, excludeId: userId },
      });
      setMessage(null);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 409 || error?.response?.status === 400) {
        setMessage(error?.response?.data?.message ?? 'Dado ja cadastrado.');
        return false;
      }
      setMessage('Nao foi possivel validar os dados.');
      return false;
    }
  };

  const handleEmailBlur = async () => {
    if (!form.email) return;
    if (!isValidEmail(form.email)) {
      setMessage('Email invalido.');
      return;
    }
    if (form.email === (user.email ?? '')) {
      setMessage(null);
      return;
    }
    await checkAvailability({ email: form.email });
  };

  const handlePhoneBlur = async () => {
    if (!form.phone) return;
    if (!isValidPhone(form.phone)) {
      setMessage('Telefone invalido.');
      return;
    }
    if (form.phone === user.phone) {
      setMessage(null);
      return;
    }
    await checkAvailability({ phone: form.phone });
  };

  const handlePixKeyBlur = () => {
    if (!form.pixKey) return;
    if (form.pixKeyType === 'phoneNumber') {
      const rawDigits = normalizeDigits(form.pixKey);
      const normalized = normalizePixPhone(form.pixKey);
      if (normalized !== rawDigits) {
        setForm((prev) => (prev ? { ...prev, pixKey: normalized } : prev));
      }
      if (rawDigits.length === 10) {
        setMessage('Adicionamos o 9 ao celular. Confira se esta correto.');
        return;
      }
    }
    const result = validatePixKey(form.pixKeyType ?? 'document', form.pixKey, {
      cpf: normalizeDigits(form.cpf),
      email: form.email?.toLowerCase(),
      phone: form.phone,
    });
    if (!result.valid) {
      setMessage(result.message ?? 'Chave Pix invalida.');
      return;
    }
    setMessage(null);
  };

  const handleCpfBlur = async () => {
    if (!form.cpf) return;
    const cpf = normalizeDigits(form.cpf);
    if (!isValidCpf(cpf)) {
      setMessage('CPF invalido.');
      return;
    }
    if (normalizeDigits(user.cpf ?? '') === cpf) {
      setMessage(null);
      return;
    }
    await checkAvailability({ cpf });
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
            onBlur={handleEmailBlur}
          />
        </label>
        <label className="text-sm text-white/80">
          Telefone
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.phone}
            onChange={onChange('phone')}
            onBlur={handlePhoneBlur}
          />
        </label>
        <label className="text-sm text-white/80">
          CPF
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.cpf}
            onChange={onChange('cpf')}
            onBlur={handleCpfBlur}
            readOnly={!canEditLockedFields}
          />
        </label>
        <label className="text-sm text-white/80">
          CEP
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.cep}
            onChange={onChange('cep')}
            onBlur={handleCepBlur}
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
          Numero
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.addressNumber}
            onChange={onChange('addressNumber')}
            required
          />
        </label>
        <label className="text-sm text-white/80">
          Complemento
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.addressComplement ?? ''}
            onChange={onChange('addressComplement')}
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
          Tipo da chave Pix
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.pixKeyType ?? 'document'}
            onChange={onChange('pixKeyType')}
          >
            {PIX_KEY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="text-black">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-white/80">
          Chave Pix
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-surface/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
            value={form.pixKey}
            onChange={onChange('pixKey')}
            onBlur={handlePixKeyBlur}
            readOnly={form.pixKeyType === 'document'}
          />
        </label>
      </div>
      <div className="flex justify-center">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-megga-yellow px-5 py-2 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
          Salvar alteracoes
        </button>
      </div>
    </form>
  );
}
