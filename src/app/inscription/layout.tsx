import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription Gratuite | Essai 14 jours',
  description: 'Créez votre compte CAPITAL ÉNERGIE gratuitement. Essai 14 jours sans engagement. Solution IA pour artisans CEE, paysagistes et viticulteurs.',
  keywords: [
    'inscription',
    'essai gratuit',
    'logiciel artisan',
    'CEE',
    'paysagiste',
    'viticulteur',
  ],
  openGraph: {
    title: 'Inscription Gratuite | CAPITAL ÉNERGIE',
    description: 'Créez votre compte gratuitement. Essai 14 jours sans engagement.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: '/inscription',
  },
};

export default function InscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
