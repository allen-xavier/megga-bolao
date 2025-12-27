import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken?: string;
      refreshToken?: string;
      role?: string;
      fullName?: string;
      phone?: string;
      cpf?: string;
      cep?: string;
      address?: string;
      addressNumber?: string;
      addressComplement?: string;
      city?: string;
      state?: string;
      pixKey?: string;
      pixKeyType?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    fullName?: string;
    phone?: string;
    cpf?: string;
    cep?: string;
    address?: string;
    addressNumber?: string;
    addressComplement?: string;
    city?: string;
    state?: string;
    pixKey?: string;
    pixKeyType?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    fullName?: string;
    phone?: string;
    cpf?: string;
    cep?: string;
    address?: string;
    addressNumber?: string;
    addressComplement?: string;
    city?: string;
    state?: string;
    pixKey?: string;
    pixKeyType?: string;
  }
}
