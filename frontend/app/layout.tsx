import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthRedirect } from "@/components/auth-redirect";

export const metadata: Metadata = {
  title: "Megga Bolão",
  description: "Sistema completo de bolões com foco em transparência e mobilidade",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-display">
        <Providers>
          <div className="flex min-h-screen w-full bg-megga-gradient text-white">
            <AuthRedirect />
            <AppSidebar />
            <div className="flex min-h-screen flex-1 flex-col items-center">
              <TopBar />
              <div className="container-app flex w-full flex-1 flex-col pb-28 pt-[160px] md:pt-8">
                <div className="mt-1 flex-1 space-y-6 pb-8 md:mt-4">{children}</div>
              </div>
              <BottomNav />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
