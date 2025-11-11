import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Megga Bolão',
  description: 'Sistema completo de bolões com foco em transparência e mobilidade',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="bg-slate-950">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100`}>
        <Providers>
          <main className="container-app py-6 space-y-6">
            <header className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-6 shadow-xl">
              <div className="flex flex-col gap-2 text-white md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-widest opacity-80">Bem-vindo ao</p>
                  <h1 className="text-3xl font-semibold md:text-4xl">Megga Bolão</h1>
                </div>
                <p className="max-w-lg text-sm text-primary-50 opacity-90">
                  Gerencie seus bolões com sorteios dinâmicos, pagamentos integrados e acompanhamento em tempo real.
                </p>
              </div>
            </header>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
