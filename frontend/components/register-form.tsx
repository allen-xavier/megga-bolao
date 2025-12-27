'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

type PixKeyType = 'document' | 'phoneNumber' | 'email' | 'randomKey' | 'paymentCode';

type RegisterPayload = {
  fullName: string;
  phone: string;
  cpf: string;
  email?: string;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement?: string;
  city: string;
  state: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  password: string;
  referralCode?: string;
  acceptedTerms: boolean;
};

const PIX_KEY_OPTIONS: Array<{ value: PixKeyType; label: string }> = [
  { value: 'document', label: 'CPF/CNPJ' },
  { value: 'phoneNumber', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'randomKey', label: 'Chave aleatoria' },
  { value: 'paymentCode', label: 'Codigo QR' },
];

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
    addressNumber: '',
    addressComplement: '',
    city: '',
    state: '',
    pixKey: '',
    pixKeyType: 'document',
    password: '',
    referralCode: '',
    acceptedTerms: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (refFromUrl) {
      setForm((prev) => ({ ...prev, referralCode: refFromUrl }));
    }
  }, [refFromUrl]);

  const handleChange =
    (field: keyof RegisterPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        let nextValue = value;
        if (field === 'fullName' || field === 'address' || field === 'addressNumber' || field === 'addressComplement' || field === 'city' || field === 'state') {
          nextValue = value.toUpperCase();
        } else if (field === 'email') {
          nextValue = value.toLowerCase();
        } else if (field === 'cpf' || field === 'cep') {
          nextValue = normalizeDigits(value);
        } else if (field === 'pixKey' && prev.pixKeyType === 'document') {
          nextValue = normalizeDigits(value);
        } else if (field === 'pixKey' && prev.pixKeyType === 'phoneNumber') {
          nextValue = normalizeDigits(value);
        }

        const nextState: RegisterPayload = { ...prev, [field]: nextValue };
        if (field === 'cpf' && prev.pixKeyType === 'document') {
          nextState.pixKey = normalizeDigits(nextValue);
        }
        if (field === 'pixKeyType') {
          const nextType = nextValue as PixKeyType;
          if (nextType === 'document') {
            nextState.pixKey = normalizeDigits(prev.cpf);
          } else if (nextType === 'phoneNumber') {
            nextState.pixKey = normalizePixPhone(prev.pixKey);
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
        address: (data.logradouro ?? prev.address).toUpperCase(),
        city: (data.localidade ?? prev.city).toUpperCase(),
        state: (data.uf ?? prev.state).toUpperCase(),
      }));
    } catch (err: any) {
      setMessage(err?.message ?? 'Nao foi possivel consultar o CEP.');
    }
  };

  const checkAvailability = async (params: { cpf?: string; email?: string; phone?: string }) => {
    try {
      await api.get('/auth/check', { params });
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

  const handleCpfBlur = async () => {
    const cpf = normalizeDigits(form.cpf);
    if (!cpf) return;
    if (!isValidCpf(cpf)) {
      setMessage('CPF invalido.');
      return;
    }
    await checkAvailability({ cpf });
  };

  const handleEmailBlur = async () => {
    if (!form.email) return;
    if (!isValidEmail(form.email)) {
      setMessage('Email invalido.');
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
    await checkAvailability({ phone: form.phone });
  };

  const handlePixKeyBlur = () => {
    if (!form.pixKey) return;
    if (form.pixKeyType === 'phoneNumber') {
      const rawDigits = normalizeDigits(form.pixKey);
      const normalized = normalizePixPhone(form.pixKey);
      if (normalized !== rawDigits) {
        setForm((prev) => ({ ...prev, pixKey: normalized }));
      }
      if (rawDigits.length === 10) {
        setMessage('Adicionamos o 9 ao celular. Confira se esta correto.');
        return;
      }
    }
    const result = validatePixKey(form.pixKeyType, form.pixKey, {
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

  const submit = async () => {
    try {
      setLoading(true);
      setMessage(null);
      if (!form.fullName || !form.phone || !form.cpf || !form.password) {
        throw new Error('Preencha nome, telefone, CPF e senha.');
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
      const pixKeyResult = validatePixKey(form.pixKeyType, form.pixKey, {
        cpf: normalizedCpf,
        email: normalizedEmail,
        phone: form.phone,
      });
      if (!pixKeyResult.valid) {
        throw new Error(pixKeyResult.message ?? 'Chave Pix invalida.');
      }

      const payload: RegisterPayload = {
        ...form,
        fullName: form.fullName.toUpperCase(),
        cpf: normalizedCpf,
        cep: normalizedCep,
        address: form.address.toUpperCase(),
        addressNumber: form.addressNumber.toUpperCase(),
        addressComplement: form.addressComplement ? form.addressComplement.toUpperCase() : undefined,
        city: form.city.toUpperCase(),
        state: form.state.toUpperCase(),
        email: normalizedEmail,
        pixKey: pixKeyResult.value ?? form.pixKey,
        acceptedTerms: true,
      };
      if (refFromUrl) {
        payload.referralCode = refFromUrl;
      } else if (!payload.referralCode) {
        delete payload.referralCode;
      }
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
              onBlur={handlePhoneBlur}
              required
            />
          </label>
          <label className="text-sm text-white/80">
            CPF
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.cpf}
              onChange={handleChange('cpf')}
              onBlur={handleCpfBlur}
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
              onBlur={handleEmailBlur}
            />
          </label>
          <label className="text-sm text-white/80">
            CEP
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.cep}
              onChange={handleChange('cep')}
              onBlur={handleCepBlur}
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
            Numero
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.addressNumber}
              onChange={handleChange('addressNumber')}
              required
            />
          </label>
          <label className="text-sm text-white/80">
            Complemento (opcional)
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.addressComplement ?? ''}
              onChange={handleChange('addressComplement')}
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
            Tipo da chave Pix
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.pixKeyType}
              onChange={handleChange('pixKeyType')}
            >
              {PIX_KEY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-white/80">
            Chave PIX
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.pixKey}
              onChange={handleChange('pixKey')}
              readOnly={form.pixKeyType === 'document'}
              onBlur={handlePixKeyBlur}
            />
          </label>
          <label className="text-sm text-white/80">
            Código de convite (opcional)
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-megga-navy/80 px-4 py-2 text-sm text-white focus:border-megga-magenta focus:outline-none focus:ring-2 focus:ring-megga-magenta/40"
              value={form.referralCode ?? ''}
              onChange={handleChange('referralCode')}
              readOnly={Boolean(refFromUrl)}
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
