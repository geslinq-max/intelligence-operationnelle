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
  title: {
    default: "CAPITAL ÉNERGIE | Plateforme IA pour PME",
    template: "%s | CAPITAL ÉNERGIE",
  },
  description: "Plateforme IA pour artisans et PME : dossiers CEE, BSD Trackdéchets, registre phytosanitaire. Simplifiez votre conformité réglementaire.",
  keywords: [
    "CEE",
    "certificats économie énergie",
    "BSD",
    "Trackdéchets",
    "registre phytosanitaire",
    "logiciel artisan",
    "conformité réglementaire",
    "PME",
    "intelligence artificielle",
  ],
  authors: [{ name: "CAPITAL ÉNERGIE" }],
  creator: "CAPITAL ÉNERGIE",
  publisher: "CAPITAL ÉNERGIE",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://capital-energie.fr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "CAPITAL ÉNERGIE",
    title: "CAPITAL ÉNERGIE | Plateforme IA pour PME",
    description: "Simplifiez votre conformité réglementaire : CEE, BSD, registre phyto. Solution IA pour artisans et PME.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "CAPITAL ÉNERGIE - Plateforme IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAPITAL ÉNERGIE | Plateforme IA pour PME",
    description: "Simplifiez votre conformité réglementaire : CEE, BSD, registre phyto.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "VOTRE_CODE_VERIFICATION_GOOGLE",
  },
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
