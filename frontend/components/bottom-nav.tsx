'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    label: 'Bolões',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path d="M4 7h16v10H4z" fill="currentColor" opacity="0.2" />
        <path d="M4 7h16M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M5 5h14a1 1 0 0 1 1 1v4.5a1.5 1.5 0 0 0 0 3V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.5a1.5 1.5 0 0 0 0-3V6a1 1 0 0 1 1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 9h6m-6 6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'SuitPay',
    href: '/suitpay',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M4.5 7A2.5 2.5 0 0 1 7 4.5h10A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 9.5h6V12a3 3 0 0 1-3 3H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Mais',
    href: '/mais',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 w-[calc(100%-2.5rem)] max-w-[410px] -translate-x-1/2 rounded-3xl border border-white/5 bg-megga-surface/95 px-4 py-3 text-white shadow-glow backdrop-blur md:hidden">
      <ul className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
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
