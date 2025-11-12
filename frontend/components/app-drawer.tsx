'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type DrawerSection = {
  title: string;
  items: { label: string; href: string; description?: string }[];
};

const sections: DrawerSection[] = [
  {
    title: 'Bolões',
    items: [
      { label: 'Criar Bolão', href: '/admin/boloes/criar', description: 'Configure cotas, prêmios e taxa Megga.' },
      { label: 'Bolões em Andamento', href: '/admin/boloes', description: 'Gerencie campanhas ativas e status.' },
      { label: 'Bolões Encerrados', href: '/admin/boloes?filtro=encerrados', description: 'Consulte histórico e relatórios.' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Dashboard', href: '/admin', description: 'Resumo de premiações, saques e indicações.' },
      { label: 'Usuários', href: '/admin/usuarios', description: 'Acompanhe cadastros e perfis verificados.' },
      { label: 'SuitPay Config', href: '/admin/suitpay', description: 'Chaves, webhooks e limites automáticos.' },
      { label: 'Config Afiliados', href: '/admin/afiliados', description: 'Defina comissões diretas e indiretas.' },
    ],
  },
  {
    title: 'Política',
    items: [
      { label: 'Termos e Condições', href: '/politica/termos' },
      { label: 'Jogo Responsável', href: '/politica/jogo-responsavel' },
      { label: 'Privacidade', href: '/politica/privacidade' },
    ],
  },
];

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [pathname, open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-pointer"
        aria-label="Fechar menu lateral"
      />
      <aside className="relative h-full w-[280px] max-w-[80%] overflow-y-auto bg-megga-surface p-6 text-white shadow-glow ring-1 ring-white/10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Megga Bolão</p>
            <p className="mt-1 text-lg font-semibold">Painel Administrativo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-megga-magenta hover:text-megga-yellow"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">{section.title}</h2>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-megga-magenta/50 hover:bg-megga-purple/30"
                    >
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-white/60">{item.description}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
