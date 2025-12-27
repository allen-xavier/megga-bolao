export const PIX_KEY_TYPES = ["document", "phoneNumber", "email", "randomKey", "paymentCode"] as const;
export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const normalizePixPhone = (value: string) => {
  let digits = normalizeDigits(value);
  if (!digits) return "";
  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.length === 10) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }
  return digits;
};

export const normalizeEmail = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
};

export const normalizeName = (value: string) => value.trim().toUpperCase();

export const normalizeCpf = (value: string) => normalizeDigits(value || "");

export const normalizeCep = (value: string) => normalizeDigits(value || "");

export const normalizePhone = (phone: string) => {
  if (!phone) {
    return "";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.length === 11) {
    return `+55${digits}`;
  }
  if (phone.startsWith("+")) {
    return phone;
  }
  return `+${digits}`;
};

export const isValidCpf = (value: string) => {
  const cpf = normalizeCpf(value);
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

export const normalizePixKey = (type: PixKeyType, key: string, opts?: { cpf?: string; phone?: string; email?: string }) => {
  const trimmed = String(key || "").trim();
  if (!trimmed) {
    return { valid: false, message: "Chave Pix obrigatoria." };
  }

  if (type === "document") {
    const digits = normalizeDigits(trimmed);
    if (digits.length !== 11 && digits.length !== 14) {
      return { valid: false, message: "Chave Pix CPF/CNPJ invalida." };
    }
    if (digits.length === 11) {
      if (!isValidCpf(digits)) {
        return { valid: false, message: "CPF da chave Pix invalido." };
      }
      const cpf = normalizeCpf(opts?.cpf ?? "");
      if (cpf && digits !== cpf) {
        return { valid: false, message: "CPF da chave Pix deve ser o mesmo do cadastro." };
      }
    }
    return { valid: true, value: digits };
  }

  if (type === "phoneNumber") {
    const digits = normalizePixPhone(trimmed);
    if (digits.length !== 11) {
      return { valid: false, message: "Telefone da chave Pix invalido." };
    }
    return { valid: true, value: digits };
  }

  if (type === "email") {
    const email = normalizeEmail(trimmed);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { valid: false, message: "Email da chave Pix invalido." };
    }
    return { valid: true, value: email };
  }

  if (type === "randomKey") {
    const cleaned = trimmed;
    if (!/^[0-9a-fA-F-]{32,36}$/.test(cleaned)) {
      return { valid: false, message: "Chave aleatoria Pix invalida." };
    }
    return { valid: true, value: cleaned };
  }

  if (type === "paymentCode") {
    if (trimmed.length < 6) {
      return { valid: false, message: "Codigo Pix invalido." };
    }
    return { valid: true, value: trimmed };
  }

  return { valid: false, message: "Tipo de chave Pix invalido." };
};
