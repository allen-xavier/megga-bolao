'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sections } from '@/components/nav-sections';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col gap-6 rounded-3xl bg-megga-surface/60 p-6 text-white shadow-glow ring-1 ring-white/5 md:flex">
      <header className="space-y-1 border-b border-white/5 pb-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Megga Bolão</p>
        <p className="text-xl font-semibold text-white">Painel</p>
        <p className="text-sm text-white/60">Navegue entre administração, bolões e configurações.</p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{section.title}</h2>
            <ul className="space-y-2">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-2xl border px-4 py-3 transition ${
                        active
                          ? 'border-megga-magenta/60 bg-megga-purple/40 text-white'
                          : 'border-white/5 bg-white/5 text-white/80 hover:border-megga-magenta/40 hover:bg-megga-purple/20'
                      }`}
                    >
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description ? <p className="mt-1 text-xs text-white/60">{item.description}</p> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
