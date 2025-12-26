'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const isPublicPath = (pathname: string) => {
  if (pathname === '/') return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/register')) return true;
  if (pathname.startsWith('/politica')) return true;
  return false;
};

export function AuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = (session?.user as any)?.accessToken as string | undefined;
    if (!token) {
      signOut({ callbackUrl: '/' });
      return;
    }
    const parts = token.split('.');
    if (parts.length < 2) {
      signOut({ callbackUrl: '/' });
      return;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decoded = JSON.parse(atob(padded));
      const exp = Number(decoded?.exp ?? 0);
      if (exp && Date.now() >= exp * 1000) {
        signOut({ callbackUrl: '/' });
      }
    } catch {
      signOut({ callbackUrl: '/' });
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (isPublicPath(pathname)) return;
    router.replace('/');
  }, [status, pathname, router]);

  return null;
}
