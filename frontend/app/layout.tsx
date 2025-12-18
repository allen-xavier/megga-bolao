import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "Megga Bolão",
  description: "Sistema completo de bolões com foco em transparência e mobilidade",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-display">
        <Providers>
          <div className="flex min-h-screen w-full bg-megga-gradient text-white">
            <AppSidebar />
            <div className="flex min-h-screen flex-1 flex-col items-center">
              <div className="container-app flex w-full flex-1 flex-col px-4 pb-28 pt-8 sm:px-6 md:px-8 md:pb-10">
                <TopBar />
                <div className="mt-6 flex-1 space-y-6 pb-8">{children}</div>
              </div>
              <BottomNav />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
