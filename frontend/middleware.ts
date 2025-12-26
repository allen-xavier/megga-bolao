import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inicio/:path*',
    '/tickets/:path*',
    '/carteira/:path*',
    '/afiliados/:path*',
    '/boloes/:path*',
    '/suitpay/:path*',
    '/mais/:path*',
    '/admin/:path*',
    '/perfil/:path*',
  ],
};
