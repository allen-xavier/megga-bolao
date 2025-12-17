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
          city: u.city,
          state: u.state,
          pixKey: u.pixKey,
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
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.fullName = (user as any).fullName;
        token.phone = (user as any).phone;
        token.cpf = (user as any).cpf;
        token.cep = (user as any).cep;
        token.address = (user as any).address;
        token.city = (user as any).city;
        token.state = (user as any).state;
        token.pixKey = (user as any).pixKey;
        token.email = (user as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...(session.user || {}),
        accessToken: token.accessToken as string | undefined,
        refreshToken: token.refreshToken as string | undefined,
        role: token.role as string | undefined,
        fullName: token.fullName as string | undefined,
        phone: token.phone as string | undefined,
        cpf: token.cpf as string | undefined,
        cep: token.cep as string | undefined,
        address: token.address as string | undefined,
        city: token.city as string | undefined,
        state: token.state as string | undefined,
        pixKey: token.pixKey as string | undefined,
        email: token.email as string | undefined,
      } as any;
      return session;
    },
  },
};
