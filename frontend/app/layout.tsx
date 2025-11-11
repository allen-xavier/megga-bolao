import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Megga Bolão',
  description: 'Sistema completo de bolões com foco em transparência e mobilidade',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="font-display">
        <Providers>
          <div className="flex min-h-screen w-full flex-col items-center bg-megga-gradient">
            <div className="container-app flex w-full flex-1 flex-col pb-28 pt-8">
              <TopBar />
              <div className="mt-6 flex-1 space-y-6 pb-8">{children}</div>
            </div>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
