'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    label: 'In\u00edcio',
    href: '/inicio',
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
    label: 'Carteira',
    href: '/carteira',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M4 7h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 7V6a2 2 0 0 1 2-2h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="12.5" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Afiliados',
    href: '/afiliados',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M8 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 12z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 12a3 3 0 1 0-3-3A3 3 0 0 0 16.5 12z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 19a4.5 4.5 0 0 1 9 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 19a3.5 3.5 0 0 1 7 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-white/10 bg-[#0f1117]/98 px-4 py-3 text-white shadow-[0_-6px_18px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/inicio' && pathname === '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`group inline-flex h-full w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${
                  isActive ? 'bg-[#f7b500] text-[#0f1117]' : 'text-white/80 hover:bg-white/5 hover:text-white'
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
