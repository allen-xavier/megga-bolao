'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    label: 'Minhas Apostas',
    href: '/apostas',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M5 5h14a1 1 0 0 1 1 1v12l-8-4-8 4V6a1 1 0 0 1 1-1z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'Depositar',
    href: '/carteira/depositar',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M12 3v14m0 0-4-4m4 4 4-4M5 21h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: 'Sacar',
    href: '/carteira/sacar',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M12 21V7m0 0 4 4m-4-4-4 4M5 3h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: 'Mais',
    href: '/mais',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M12 5v14m-7-7h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 w-[calc(100%-2.5rem)] max-w-[410px] -translate-x-1/2 rounded-3xl border border-white/5 bg-megga-surface/95 px-4 py-3 text-white shadow-glow backdrop-blur">
      <ul className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`group inline-flex h-full w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${
                  isActive ? 'bg-megga-purple text-megga-yellow' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-sm text-inherit group-hover:bg-white/10">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
