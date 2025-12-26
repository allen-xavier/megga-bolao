"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

type User = {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  email?: string | null;
  cep?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  city?: string | null;
  state?: string | null;
  pixKey?: string | null;
  pixKeyType?: "document" | "phoneNumber" | "email" | "randomKey" | null;
  acceptedTerms?: boolean;
};

type PixKeyType = "document" | "phoneNumber" | "email" | "randomKey";

const PIX_KEY_OPTIONS: Array<{ value: PixKeyType; label: string }> = [
  { value: "document", label: "CPF/CNPJ" },
  { value: "phoneNumber", label: "Telefone" },
  { value: "email", label: "Email" },
  { value: "randomKey", label: "Chave aleatoria" },
];

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

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

const fetchCepData = async (cep: string) => {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP.");
  }
  const data = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    localidade?: string;
    uf?: string;
  };
  if (data.erro) {
    throw new Error("CEP nao encontrado.");
  }
  return data;
};

const fetcher = (url: string, token?: string) =>
  api
    .get<User>(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    .then((res) => res.data);

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const { data: user, error } = useSWR<User, any, [string, string] | null>(
    token && userId && isAdmin ? [`/users/${userId}`, token] as [string, string] : null,
    ([url, t]) => fetcher(url, t),
    { revalidateOnFocus: false },
  );

  const [form, setForm] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleChange = (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === "acceptedTerms" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => {
      if (!prev) return prev;
      if (field === "acceptedTerms") {
        return { ...prev, acceptedTerms: value as boolean };
      }
      let nextValue = String(value);
      if (field === "fullName" || field === "address" || field === "addressNumber" || field === "addressComplement" || field === "city" || field === "state") {
        nextValue = nextValue.toUpperCase();
      } else if (field === "email") {
        nextValue = nextValue.toLowerCase();
      } else if (field === "cpf" || field === "cep") {
        nextValue = normalizeDigits(nextValue);
      } else if (field === "pixKey" && (prev.pixKeyType === "document" || prev.pixKeyType === "phoneNumber")) {
        nextValue = normalizeDigits(nextValue);
      }

      const nextState = { ...prev, [field]: nextValue };
      if (field === "cpf" && prev.pixKeyType === "document") {
        nextState.pixKey = normalizeDigits(nextValue);
      }
      if (field === "pixKeyType") {
        const nextType = nextValue as PixKeyType;
        nextState.pixKeyType = nextType;
        if (nextType === "document") {
          nextState.pixKey = normalizeDigits(prev.cpf ?? "");
        } else if (nextType === "phoneNumber") {
          nextState.pixKey = normalizeDigits(prev.pixKey ?? "");
        }
      }
      return nextState;
    });
  };

  const checkAvailability = async (params: { cpf?: string; email?: string; phone?: string }) => {
    try {
      await api.get("/auth/check", { params: { ...params, excludeId: userId } });
      setErrorMsg(null);
      return true;
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.response?.status === 400) {
        setErrorMsg(err?.response?.data?.message ?? "Dado ja cadastrado.");
        return false;
      }
      setErrorMsg("Nao foi possivel validar os dados.");
      return false;
    }
  };

  const handleCpfBlur = async () => {
    if (!form?.cpf) return;
    const cpf = normalizeDigits(form.cpf);
    if (!isValidCpf(cpf)) {
      setErrorMsg("CPF invalido.");
      return;
    }
    if (normalizeDigits(user?.cpf ?? "") === cpf) {
      setErrorMsg(null);
      return;
    }
    await checkAvailability({ cpf });
  };

  const handleEmailBlur = async () => {
    if (!form?.email) return;
    const email = form.email.toLowerCase();
    if (!isValidEmail(email)) {
      setErrorMsg("Email invalido.");
      return;
    }
    if ((user?.email ?? "") === email) {
      setErrorMsg(null);
      return;
    }
    await checkAvailability({ email });
  };

  const handlePhoneBlur = async () => {
    if (!form?.phone) return;
    if (!isValidPhone(form.phone)) {
      setErrorMsg("Telefone invalido.");
      return;
    }
    if ((user?.phone ?? "") === form.phone) {
      setErrorMsg(null);
      return;
    }
    await checkAvailability({ phone: form.phone });
  };

  const handleCepBlur = async () => {
    if (!form?.cep) return;
    const cep = normalizeDigits(form.cep);
    if (cep.length !== 8) {
      setErrorMsg("CEP invalido.");
      return;
    }
    try {
      const data = await fetchCepData(cep);
      setForm((prev) =>
        prev
          ? {
              ...prev,
              cep,
              address: data.logradouro ?? prev.address ?? "",
              city: data.localidade ?? prev.city ?? "",
              state: data.uf ?? prev.state ?? "",
            }
          : prev,
      );
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Nao foi possivel consultar o CEP.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !token) return;
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        cpf: form.cpf,
        email: form.email ?? undefined,
        cep: form.cep ?? undefined,
        address: form.address ?? undefined,
        addressNumber: form.addressNumber ?? undefined,
        addressComplement: form.addressComplement ?? undefined,
        city: form.city ?? undefined,
        state: form.state ?? undefined,
        pixKey: form.pixKey ?? undefined,
        pixKeyType: form.pixKeyType ?? undefined,
        acceptedTerms: form.acceptedTerms ?? false,
      };
      await api.patch(`/users/${userId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Perfil atualizado com sucesso.");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? "Falha ao atualizar usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faça login como administrador para editar usuários.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  if (error?.response?.status === 401) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Sessão expirada ou sem permissão. Faça login novamente.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Erro ao carregar usuario: {error?.message ?? "falha desconhecida"}</p>
        <Link href="/admin/usuarios" className="mt-3 inline-flex text-xs text-megga-yellow underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  if (!form) {
    return <p className="rounded-3xl bg-megga-navy/80 p-6 text-sm text-white/70">Carregando dados do usuario...</p>;
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gestão de contas</p>
        <h1 className="text-2xl font-semibold">Editar usuario</h1>
        <p className="text-sm text-white/70">Atualize dados cadastrais e status de verificacao.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-megga-navy/80 p-6 shadow-lg ring-1 ring-white/5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-white/70">
            <span>Nome completo</span>
            <input
              type="text"
              value={form.fullName ?? ""}
              onChange={handleChange("fullName")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Telefone (WhatsApp)</span>
            <input
              type="text"
              value={form.phone ?? ""}
              onChange={handleChange("phone")}
              onBlur={handlePhoneBlur}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>CPF</span>
            <input
              type="text"
              value={form.cpf ?? ""}
              onChange={handleChange("cpf")}
              onBlur={handleCpfBlur}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Email</span>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={handleChange("email")}
              onBlur={handleEmailBlur}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>CEP</span>
            <input
              type="text"
              value={form.cep ?? ""}
              onChange={handleChange("cep")}
              onBlur={handleCepBlur}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Endereco</span>
            <input
              type="text"
              value={form.address ?? ""}
              onChange={handleChange("address")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Numero</span>
            <input
              type="text"
              value={form.addressNumber ?? ""}
              onChange={handleChange("addressNumber")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Complemento</span>
            <input
              type="text"
              value={form.addressComplement ?? ""}
              onChange={handleChange("addressComplement")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Cidade</span>
            <input
              type="text"
              value={form.city ?? ""}
              onChange={handleChange("city")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Estado</span>
            <input
              type="text"
              value={form.state ?? ""}
              onChange={handleChange("state")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Chave PIX</span>
            <input
              type="text"
              value={form.pixKey ?? ""}
              onChange={handleChange("pixKey")}
              readOnly={form.pixKeyType === "document"}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Tipo da chave PIX</span>
            <select
              value={(form.pixKeyType ?? "document") as string}
              onChange={handleChange("pixKeyType")}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            >
              {PIX_KEY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={!!form.acceptedTerms}
              onChange={handleChange("acceptedTerms")}
              className="h-4 w-4 rounded border-white/30 bg-transparent text-megga-teal focus:ring-megga-magenta"
            />
            <span>Usuário verificado (aceitou termos)</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-megga-yellow px-6 py-3 text-sm font-semibold text-megga-navy transition hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alteracoes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
          >
            Cancelar
          </button>
        </div>

        {message && <p className="text-sm text-megga-lime">{message}</p>}
        {errorMsg && <p className="text-sm text-megga-rose">{errorMsg}</p>}
      </form>
    </div>
  );
}
