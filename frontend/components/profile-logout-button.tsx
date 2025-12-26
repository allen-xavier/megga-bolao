'use client';

import { signOut } from 'next-auth/react';

export function ProfileLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="w-full rounded-2xl bg-[#ff4d4f] px-4 py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
    >
      Sair da conta
    </button>
  );
}
