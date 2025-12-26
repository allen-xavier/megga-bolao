'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (isPublicPath(pathname)) return;
    router.replace('/');
  }, [status, pathname, router]);

  return null;
}
