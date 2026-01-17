import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { BrandingProvider } from "@/contexts/ThemeContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { IndustryProvider } from "@/contexts/IndustryContext";
import SupabaseInit from "@/components/SupabaseInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAPITAL ÉNERGIE | Plateforme IA pour PME",
  description: "Optimisez vos économies d'énergie grâce à l'intelligence artificielle",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CE",
  },
};

// Viewport exporté séparément (Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrandingProvider>
          <AuthProvider>
            <IndustryProvider>
              <SubscriptionProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </SubscriptionProvider>
            </IndustryProvider>
          </AuthProvider>
        </BrandingProvider>
        <ServiceWorkerRegister />
        <SupabaseInit />
      </body>
    </html>
  );
}
