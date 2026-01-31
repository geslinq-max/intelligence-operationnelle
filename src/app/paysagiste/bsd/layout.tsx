import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BSD Express | Créer un Bordereau en 2 Minutes',
  description: 'Créez vos bordereaux de suivi des déchets (BSD) en 2 minutes. Signature tactile, génération PDF, conformité Trackdéchets 2026 garantie.',
  keywords: [
    'BSD',
    'bordereau suivi déchets',
    'Trackdéchets',
    'signature électronique',
    'paysagiste',
    'déchets verts',
    'ISDI',
  ],
  openGraph: {
    title: 'BSD Express | CAPITAL ÉNERGIE',
    description: 'Créez vos BSD en 2 minutes avec signature tactile.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: '/paysagiste/bsd',
  },
};

export default function BSDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
