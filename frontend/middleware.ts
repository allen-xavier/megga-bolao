import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tickets/:path*',
    '/suitpay/:path*',
    '/mais/:path*',
    '/admin/:path*',
    '/perfil/:path*',
  ],
};
