import CredentialsProvider from 'next-auth/providers/credentials';
import { type NextAuthOptions } from 'next-auth';
import { api } from './api';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Telefone', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }
        const response = await api.post('/auth/login', {
          phone: credentials.phone,
          password: credentials.password,
        });
        const u = response.data.user;
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          phone: u.phone,
          cpf: u.cpf,
          cep: u.cep,
          address: u.address,
          addressNumber: u.addressNumber,
          addressComplement: u.addressComplement,
          city: u.city,
          state: u.state,
          pixKey: u.pixKey,
          pixKeyType: u.pixKeyType,
          fullName: u.fullName,
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.fullName = (user as any).fullName;
        token.phone = (user as any).phone;
        token.cpf = (user as any).cpf;
        token.cep = (user as any).cep;
        token.address = (user as any).address;
        token.addressNumber = (user as any).addressNumber;
        token.addressComplement = (user as any).addressComplement;
        token.city = (user as any).city;
        token.state = (user as any).state;
        token.pixKey = (user as any).pixKey;
        token.pixKeyType = (user as any).pixKeyType;
        token.email = (user as any).email;
      }
      if (trigger === "update" && session) {
        const updateData = (session as any).user ?? session;
        token.fullName = updateData.fullName ?? token.fullName;
        token.phone = updateData.phone ?? token.phone;
        token.cpf = updateData.cpf ?? token.cpf;
        token.cep = updateData.cep ?? token.cep;
        token.address = updateData.address ?? token.address;
        token.addressNumber = updateData.addressNumber ?? token.addressNumber;
        token.addressComplement = updateData.addressComplement ?? token.addressComplement;
        token.city = updateData.city ?? token.city;
        token.state = updateData.state ?? token.state;
        token.pixKey = updateData.pixKey ?? token.pixKey;
        token.pixKeyType = updateData.pixKeyType ?? token.pixKeyType;
        token.email = updateData.email ?? token.email;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...(session.user || {}),
        id: (token as any).id ?? (token.sub as string | undefined),
        accessToken: token.accessToken as string | undefined,
        refreshToken: token.refreshToken as string | undefined,
        role: token.role as string | undefined,
        fullName: token.fullName as string | undefined,
        phone: token.phone as string | undefined,
        cpf: token.cpf as string | undefined,
        cep: token.cep as string | undefined,
        address: token.address as string | undefined,
        addressNumber: token.addressNumber as string | undefined,
        addressComplement: token.addressComplement as string | undefined,
        city: token.city as string | undefined,
        state: token.state as string | undefined,
        pixKey: token.pixKey as string | undefined,
        pixKeyType: token.pixKeyType as string | undefined,
        email: token.email as string | undefined,
      } as any;
      return session;
    },
  },
};
