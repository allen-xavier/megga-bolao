'use client';

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { sections } from "@/components/nav-sections";
import { signOut } from "next-auth/react";

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const isAuthed = status === 'authenticated';
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      lastPathRef.current = pathname;
      return;
    }
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      onClose();
    }
  }, [pathname, open, onClose]);

  if (!open) return null;

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.adminOnly ? role === "ADMIN" : true
      ),
    }))
    .filter((section) => section.items.length > 0);

  const publicSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.href.startsWith("/politica")),
    }))
    .filter((section) => section.items.length > 0);

  const visibleSections = isAuthed ? filteredSections : publicSections;

  const handleNavigate = () => onClose();

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/70 backdrop-blur-sm md:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-pointer"
        aria-label="Fechar menu lateral"
      />
      <aside className="relative h-full w-[280px] max-w-[80%] overflow-y-auto border-r border-white/10 bg-[#0f1117] p-6 text-white shadow-lg">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Megga Bolão</p>
            <p className="mt-1 text-lg font-semibold">Painel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:border-[#3fdc7c] hover:text-white"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>
        <div className="space-y-6">

          {!isAuthed && (
            <Link
              href="/login"
              onClick={handleNavigate}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-[#3fdc7c] hover:text-[#f7b500]"
            >
              Entrar / Criar conta
            </Link>
          )}
          {visibleSections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleNavigate}
                      className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-[#3fdc7c]/70 hover:bg-[#121623]"
                    >
                      <p className="text-sm font-medium text-white">
                        {item.label}
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-white/60">
                          {item.description}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {isAuthed && (
            <div className="pt-4">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full rounded-2xl border border-red-400/40 bg-red-600/30 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-red-300 hover:bg-red-600/50"
              >
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
